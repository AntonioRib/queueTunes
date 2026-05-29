import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { GetMyShows, SpotifyShow } from '../../Services/GetMyShows';
import { GetShowEpisodes } from '../../Services/GetShowEpisodes';
import { AddToSpotifyQueue } from '../../Services/AddToSpotifyQueue';
import { GetAvailableDevices, SpotifyDevice } from '../../Services/GetAvailableDevices';
import { TransferPlayback } from '../../Services/TransferPlayback';
import { getToken, logInWithSpotify } from '../../Utils/Login';
import { EpisodeWithShow, LookbackDays } from '../../Models/EpisodeWithShow';
import { QueueControls } from './QueueControls';
import { EpisodeList } from './EpisodeList';
import { DevicePickerModal } from './DevicePickerModal';
import { AddToQueueButton } from './AddToQueueButton';
import { ENABLE_DEVICE_PICKER, QUICK_QUEUE_PRIMARY, HIDE_PLAYED_EPISODES } from '../../featureFlags';
import env from 'react-dotenv';

const redirect_uri = env.REACT_APP_SPOTIFY_REDIRECT_URL;

const LOOKBACK_KEY = 'quick_queue_lookback_days';
const CACHE_KEY = 'quick_queue_episode_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCachedEpisodes(): { episodes: EpisodeWithShow[]; timestamp: number } | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

function isCacheFresh(cached: { timestamp: number }): boolean {
    return Date.now() - cached.timestamp < CACHE_TTL_MS;
}

function setCachedEpisodes(episodes: EpisodeWithShow[]) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ episodes, timestamp: Date.now() }));
}

function getLookbackFromStorage(): LookbackDays {
    const stored = localStorage.getItem(LOOKBACK_KEY);
    if (stored === '1' || stored === '3' || stored === '7') return Number(stored) as LookbackDays;
    return 3;
}

function getRelativeDay(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function isWithinDays(dateStr: string, days: number): boolean {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    return diffMs <= days * 24 * 60 * 60 * 1000;
}

export function QuickQueue() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [episodes, setEpisodes] = useState<EpisodeWithShow[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isQueuing, setIsQueuing] = useState(false);
    const [queuedCount, setQueuedCount] = useState<number | null>(null);
    const [queuingProgress, setQueuingProgress] = useState({ current: 0, total: 0 });
    const [lookbackDays, setLookbackDays] = useState<LookbackDays>(getLookbackFromStorage);
    const [showDevicePicker, setShowDevicePicker] = useState(false);
    const [availableDevices, setAvailableDevices] = useState<SpotifyDevice[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            const [token, isUserToken] = await getToken();
            setIsLoggedIn(!!token && isUserToken);
        };
        checkAuth();
    }, [location.search]);

    const fetchEpisodes = useCallback(async (forceFullRefresh = false) => {
        setIsLoading(true);
        try {
            const cached = getCachedEpisodes();

            // If cache is fresh, just filter and display
            if (cached && isCacheFresh(cached)) {
                const filtered = cached.episodes.filter(ep =>
                    isWithinDays(ep.release_date, lookbackDays) &&
                    (!HIDE_PLAYED_EPISODES || !ep.resume_point?.fully_played)
                );
                filtered.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
                setEpisodes(filtered);
                setCheckedIds(new Set());
                setIsLoading(false);
                return;
            }

            const shows: SpotifyShow[] = await GetMyShows();
            if (shows.length === 0) {
                setEpisodes([]);
                return;
            }

            // Incremental fetch: if we have stale cache, only fetch 2 episodes per show
            // to catch new releases, then merge with existing data
            const isIncremental = !forceFullRefresh && cached && cached.episodes.length > 0;
            const episodesPerShow = isIncremental ? 2 : 5;

            const freshEpisodes: EpisodeWithShow[] = [];
            const batchSize = 10;

            for (let i = 0; i < shows.length; i += batchSize) {
                if (i > 0) await new Promise(r => setTimeout(r, 300));
                const batch = shows.slice(i, i + batchSize);
                const results = await Promise.all(
                    batch.map(show => GetShowEpisodes(show.id, episodesPerShow))
                );

                results.forEach((showEpisodes, idx) => {
                    const show = batch[idx];
                    showEpisodes.forEach(ep => {
                        freshEpisodes.push({
                            ...ep,
                            showName: show.name,
                            showImages: show.images,
                        });
                    });
                });
            }

            // Merge: fresh episodes take priority, keep older cached ones that weren't re-fetched
            let allEpisodes: EpisodeWithShow[];
            if (isIncremental) {
                const freshIds = new Set(freshEpisodes.map(ep => ep.id));
                const keptFromCache = cached.episodes.filter(ep => !freshIds.has(ep.id));
                allEpisodes = [...freshEpisodes, ...keptFromCache];
            } else {
                allEpisodes = freshEpisodes;
            }

            setCachedEpisodes(allEpisodes);

            const filtered = allEpisodes.filter(ep =>
                isWithinDays(ep.release_date, lookbackDays) &&
                (!HIDE_PLAYED_EPISODES || !ep.resume_point?.fully_played)
            );
            filtered.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());

            setEpisodes(filtered);
            setCheckedIds(new Set());
        } catch (error) {
            console.error('Error fetching episodes:', error);
            toast.error('Failed to fetch episodes');
        } finally {
            setIsLoading(false);
        }
    }, [lookbackDays]);

    useEffect(() => {
        if (isLoggedIn) fetchEpisodes();
    }, [fetchEpisodes, isLoggedIn]);

    const handleLookbackChange = (days: LookbackDays) => {
        setLookbackDays(days);
        localStorage.setItem(LOOKBACK_KEY, String(days));
    };

    const forceRefresh = () => {
        localStorage.removeItem(CACHE_KEY);
        fetchEpisodes();
    };

    const toggleEpisode = (id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (checkedIds.size === episodes.length) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(episodes.map(ep => ep.id)));
        }
    };

    const handleAddToQueue = async () => {
        const toQueue = episodes
            .filter(ep => checkedIds.has(ep.id))
            .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
        if (toQueue.length === 0) return;

        const devices = await GetAvailableDevices();
        const activeDevice = devices.find(d => d.is_active);

        if (!activeDevice) {
            if (ENABLE_DEVICE_PICKER && devices.length > 0) {
                setAvailableDevices(devices);
                setShowDevicePicker(true);
                return;
            }
            toast.error('No active Spotify device found. Open Spotify and play something first.');
            return;
        }

        await addEpisodesToQueue(toQueue);
    };

    const handleDeviceSelect = async (deviceId: string) => {
        setShowDevicePicker(false);
        const transferred = await TransferPlayback(deviceId);
        if (!transferred) {
            toast.error('Failed to activate device. Try playing something on Spotify first.');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        const toQueue = episodes
            .filter(ep => checkedIds.has(ep.id))
            .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
        await addEpisodesToQueue(toQueue);
    };

    const addEpisodesToQueue = async (toQueue: EpisodeWithShow[]) => {
        setIsQueuing(true);
        setQueuingProgress({ current: 0, total: toQueue.length });

        let successCount = 0;
        for (let i = 0; i < toQueue.length; i++) {
            setQueuingProgress({ current: i + 1, total: toQueue.length });
            const result = await AddToSpotifyQueue(toQueue[i].uri);
            if (result !== undefined) successCount++;
        }

        setIsQueuing(false);
        if (successCount === toQueue.length) {
            toast.success(`Added ${successCount} episodes to queue`);
            setQueuedCount(successCount);
        } else {
            toast.error(`Added ${successCount}/${toQueue.length} episodes (some failed)`);
        }
    };

    // Group episodes by relative day
    const groupedEpisodes: { day: string; episodes: EpisodeWithShow[] }[] = [];
    episodes.forEach(ep => {
        const day = getRelativeDay(ep.release_date);
        const existing = groupedEpisodes.find(g => g.day === day);
        if (existing) existing.episodes.push(ep);
        else groupedEpisodes.push({ day, episodes: [ep] });
    });

    if (isLoggedIn === null) {
        return null;
    }

    if (!isLoggedIn) {
        return (
            <div className="w-full max-w-md flex flex-col items-center gap-6 py-10">
                <p className="text-zinc-400 text-center">
                    Log in with Spotify to see your new podcast episodes
                </p>
                <button
                    onClick={() => logInWithSpotify(QUICK_QUEUE_PRIMARY ? redirect_uri : redirect_uri + '/quick-queue')}
                    className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors"
                >
                    Log in with Spotify
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full max-w-md flex flex-col items-center gap-4 py-10">
                <div className="animate-pulse flex flex-col gap-3 w-full">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-zinc-800 rounded-lg h-20 w-full" />
                    ))}
                </div>
                <p className="text-zinc-400 text-sm">Loading new episodes...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md flex flex-col gap-4 pb-24">
            <QueueControls
                lookbackDays={lookbackDays}
                onLookbackChange={handleLookbackChange}
                onRefresh={forceRefresh}
                onToggleAll={toggleAll}
                allSelected={checkedIds.size === episodes.length && episodes.length > 0}
            />

            <p className="text-zinc-400 text-sm">Select the episodes you'd like to add to your queue</p>

            <EpisodeList
                groupedEpisodes={groupedEpisodes}
                checkedIds={checkedIds}
                onToggleEpisode={toggleEpisode}
                lookbackDays={lookbackDays}
            />

            {showDevicePicker && (
                <DevicePickerModal
                    devices={availableDevices}
                    onSelect={handleDeviceSelect}
                    onCancel={() => setShowDevicePicker(false)}
                    onRefresh={async () => {
                        const devices = await GetAvailableDevices();
                        setAvailableDevices(devices);
                    }}
                />
            )}

            {episodes.length > 0 && (
                <AddToQueueButton
                    checkedCount={checkedIds.size}
                    isQueuing={isQueuing}
                    progress={queuingProgress}
                    onAdd={handleAddToQueue}
                    queuedCount={queuedCount}
                    onContinue={() => {
                        const queueTunesPath = QUICK_QUEUE_PRIMARY ? '/queue-tunes' : '/';
                        navigate(`${queueTunesPath}?episodes=${queuedCount}`);
                    }}
                />
            )}
        </div>
    );
}
