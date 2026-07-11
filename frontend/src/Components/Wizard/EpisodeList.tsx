import { EpisodeWithShow } from '../../Models/EpisodeWithShow';
import { strings } from '../../strings';
import { EpisodeCard } from './EpisodeCard';

/** A day-group emitted by the Wizard's Step 1 sort. */
export interface EpisodeGroup {
    day: string;
    episodes: EpisodeWithShow[];
}

/** Props for {@link EpisodeList}. */
export interface EpisodeListProps {
    groupedEpisodes: EpisodeGroup[];
    checkedIds: Set<string>;
    onToggleEpisode: (id: string) => void;
    lookbackDays: number;
    onWidenLookback?: () => void;
}

/**
 * Renders Step 1's list of episodes grouped by relative day (`Today`,
 * `Yesterday`, `Monday`, …). If the list is empty for the current
 * lookback window, shows the empty state from the v2 spec with an
 * optional "widen" affordance.
 */
export function EpisodeList({
    groupedEpisodes,
    checkedIds,
    onToggleEpisode,
    lookbackDays,
    onWidenLookback,
}: EpisodeListProps) {
    const isEmpty = groupedEpisodes.length === 0 || groupedEpisodes.every(g => g.episodes.length === 0);
    if (isEmpty) {
        return (
            <div className="py-10 text-center text-zinc-400">
                <p className="text-lg">{strings.episodeList.emptyTitle}</p>
                <p className="mt-1 text-sm">{strings.episodeList.emptyBody(lookbackDays)}</p>
                {onWidenLookback && lookbackDays < 7 && (
                    <button
                        onClick={onWidenLookback}
                        className="mt-4 min-h-[44px] rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-green-500 hover:text-white"
                    >
                        {strings.episodeList.widenTo7}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {groupedEpisodes.map(group => {
                const headingId = `episode-group-${group.day.replace(/\s+/g, '-').toLowerCase()}`;
                return (
                    <section key={group.day} aria-labelledby={headingId}>
                        <h2
                            id={headingId}
                            className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"
                        >
                            {group.day}
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {group.episodes.map(ep => (
                                <EpisodeCard
                                    key={ep.id}
                                    episode={ep}
                                    isChecked={checkedIds.has(ep.id)}
                                    onToggle={onToggleEpisode}
                                />
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
