import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { EpisodeWithShow, LookbackDays } from '../../Models/EpisodeWithShow';
import { GetMyShows, SpotifyShow } from '../../Services/GetMyShows';
import { GetShowsEpisodesBatch } from '../../Services/GetShowsEpisodesBatch';
import { HIDE_PLAYED_EPISODES } from '../../featureFlags';
import { strings } from '../../strings';
import { EpisodeList, EpisodeGroup } from './EpisodeList';

/** Props for {@link EpisodePickerStep}. */
export interface EpisodePickerStepProps {
    lookbackDays: LookbackDays;
    onLookbackChange: (days: LookbackDays) => void;
    selectedIds: Set<string>;
    onSelectedIdsChange: (ids: Set<string>) => void;
    onEpisodesResolved: (episodes: EpisodeWithShow[]) => void;
    onNext: () => void;
}

const CACHE_KEY = 'wizard_episode_cache';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface EpisodeCache {
    episodes: EpisodeWithShow[];
    timestamp: number;
}

/**
 * Read a fresh-or-stale cached list of augmented episodes.
 * Corruption silently clears the key.
 */
const readEpisodeCache = (): EpisodeCache | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as EpisodeCache;
        if (!Array.isArray(parsed?.episodes) || typeof parsed?.timestamp !== 'number') {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed;
    } catch {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
};

const writeEpisodeCache = (episodes: EpisodeWithShow[]): void => {
    try {
        const payload: EpisodeCache = { episodes, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
        // non-fatal
    }
};

/**
 * Convert an ISO release date into "Today" / "Yesterday" / weekday name.
 */
const getRelativeDay = (dateStr: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return strings.episodePicker.relativeDayToday;
    if (diffDays === 1) return strings.episodePicker.relativeDayYesterday;
    return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const isWithinDays = (dateStr: string, days: number): boolean => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return diffMs <= days * 24 * 60 * 60 * 1000;
};

const filterAndSort = (all: EpisodeWithShow[], lookbackDays: number): EpisodeWithShow[] => {
    const filtered = all.filter(
        ep =>
            isWithinDays(ep.release_date, lookbackDays) &&
            (!HIDE_PLAYED_EPISODES || !ep.resume_point?.fully_played),
    );
    filtered.sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
    );
    return filtered;
};

const groupByDay = (episodes: EpisodeWithShow[]): EpisodeGroup[] => {
    const groups: EpisodeGroup[] = [];
    for (const ep of episodes) {
        const day = getRelativeDay(ep.release_date);
        const existing = groups.find(g => g.day === day);
        if (existing) existing.episodes.push(ep);
        else groups.push({ day, episodes: [ep] });
    }
    return groups;
};

/**
 * Wizard Step 1 — pick episodes.
 *
 * Reads followed shows via {@link GetMyShows} (with its 6h cache),
 * batches per-show episode fetches via {@link GetShowsEpisodesBatch}
 * against the backend SWR cache, filters by the current lookback,
 * groups by relative day, and lets the user check episodes.
 *
 * Owns a 1h localStorage cache so switching lookback chips is instant.
 */
export function EpisodePickerStep({
    lookbackDays,
    onLookbackChange,
    selectedIds,
    onSelectedIdsChange,
    onEpisodesResolved,
    onNext,
}: EpisodePickerStepProps) {
    const [episodes, setEpisodes] = useState<EpisodeWithShow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const abortRef = useRef<AbortController | null>(null);

    const fetchEpisodes = useCallback(
        async (forceFullRefresh: boolean) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoading(true);
            try {
                const cached = readEpisodeCache();
                if (!forceFullRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                    if (controller.signal.aborted) return;
                    const filtered = filterAndSort(cached.episodes, lookbackDays);
                    setEpisodes(filtered);
                    onEpisodesResolved(filtered);
                    setIsLoading(false);
                    return;
                }

                const shows: SpotifyShow[] = await GetMyShows({ forceRefresh: forceFullRefresh });
                if (controller.signal.aborted) return;
                if (shows.length === 0) {
                    setEpisodes([]);
                    onEpisodesResolved([]);
                    return;
                }

                const isIncremental = !forceFullRefresh && cached && cached.episodes.length > 0;
                const episodesPerShow = isIncremental ? 2 : 5;

                const showsById = new Map(shows.map(s => [s.id, s]));
                const episodesByShow = await GetShowsEpisodesBatch(
                    shows.map(s => s.id),
                    episodesPerShow,
                );
                if (controller.signal.aborted) return;

                const fresh: EpisodeWithShow[] = [];
                for (const [showId, showEpisodes] of Object.entries(episodesByShow)) {
                    const show = showsById.get(showId);
                    if (!show) continue;
                    showEpisodes.forEach(ep => {
                        fresh.push({ ...ep, showName: show.name, showImages: show.images });
                    });
                }

                let all: EpisodeWithShow[];
                if (isIncremental && cached) {
                    const freshIds = new Set(fresh.map(ep => ep.id));
                    const kept = cached.episodes.filter(ep => !freshIds.has(ep.id));
                    all = [...fresh, ...kept];
                } else {
                    all = fresh;
                }

                writeEpisodeCache(all);
                const filtered = filterAndSort(all, lookbackDays);
                setEpisodes(filtered);
                onEpisodesResolved(filtered);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Error fetching episodes:', error);
                toast.error(strings.episodePicker.fetchFailed);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        },
        [lookbackDays, onEpisodesResolved],
    );

    useEffect(() => {
        fetchEpisodes(false);
        return () => abortRef.current?.abort();
    }, [fetchEpisodes]);

    const toggleEpisode = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectedIdsChange(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === episodes.length) onSelectedIdsChange(new Set());
        else onSelectedIdsChange(new Set(episodes.map(ep => ep.id)));
    };

    const forceRefresh = () => {
        localStorage.removeItem(CACHE_KEY);
        fetchEpisodes(true);
    };

    const grouped = groupByDay(episodes);
    const allSelected = selectedIds.size === episodes.length && episodes.length > 0;
    const canProceed = selectedIds.size > 0;

    return (
        <div className="flex w-full max-w-md flex-col gap-4 pb-32">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label htmlFor="lookback-days" className="sr-only">
                        {strings.episodePicker.prompt}
                    </label>
                    <select
                        id="lookback-days"
                        value={lookbackDays}
                        onChange={e => onLookbackChange(Number(e.target.value) as LookbackDays)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-base text-white focus:border-green-500 focus:outline-none sm:text-sm"
                    >
                        <option value={1}>{strings.episodePicker.lookbackToday}</option>
                        <option value={3}>{strings.episodePicker.lookbackLast3}</option>
                        <option value={7}>{strings.episodePicker.lookbackLast7}</option>
                    </select>
                    <button
                        onClick={forceRefresh}
                        aria-label={strings.episodePicker.refreshTitle}
                        title={strings.episodePicker.refreshTitle}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-white"
                    >
                        <svg
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    </button>
                </div>
                {episodes.length > 0 && (
                    <button
                        onClick={toggleAll}
                        className="min-h-[44px] rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        {allSelected ? strings.episodePicker.deselectAll : strings.episodePicker.selectAll}
                    </button>
                )}
            </div>

            <p className="text-sm text-zinc-400">{strings.episodePicker.prompt}</p>

            {isLoading ? (
                <div
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                    className="flex flex-col gap-3"
                >
                    <span className="sr-only">{strings.episodePicker.prompt}</span>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-zinc-800 motion-reduce:animate-none" aria-hidden="true" />
                    ))}
                </div>
            ) : (
                <EpisodeList
                    groupedEpisodes={grouped}
                    checkedIds={selectedIds}
                    onToggleEpisode={toggleEpisode}
                    lookbackDays={lookbackDays}
                    onWidenLookback={
                        lookbackDays < 7 ? () => onLookbackChange((lookbackDays === 1 ? 3 : 7) as LookbackDays) : undefined
                    }
                />
            )}

            <div
                className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-black to-transparent px-4 pt-4"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="mx-auto block w-full max-w-md min-h-[44px] rounded-full bg-green-500 py-3 font-semibold text-black transition-colors hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                    {canProceed
                        ? strings.episodePicker.nextWithCount(selectedIds.size)
                        : strings.episodePicker.nextEmpty}
                </button>
            </div>
        </div>
    );
}
