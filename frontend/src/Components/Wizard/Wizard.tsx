import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { EpisodeWithShow, LookbackDays } from '../../Models/EpisodeWithShow';
import { SpotifyTrack } from '../../Models/SpotifyTrack';
import { getToken, logInWithSpotify } from '../../Utils/Login';
import { buildMerge, fisherYates } from '../../Utils/buildMerge';
import { readLastPlay, writeLastPlay } from '../../Utils/playSignature';
import { PlayUris } from '../../Services/PlayUris';
import { GetMySongsRandom } from '../../Services/GetMySongsRandom';
import { GetPlaylistInfo } from '../../Services/GetPlaylistInfo';
import { GetPlaylistIdFromUrl } from '../../Utils/GetPlaylistIdFromUrl';
import { GetAvailableDevices, SpotifyDevice } from '../../Services/GetAvailableDevices';
import { TransferPlayback } from '../../Services/TransferPlayback';
import { ENABLE_DEVICE_PICKER } from '../../featureFlags';
import { strings } from '../../strings';
import { EpisodePickerStep } from './EpisodePickerStep';
import { SongSourceStep, SongSource } from './SongSourceStep';
import { PlayNowConfirm, SEEN_REPLACE_WARNING_KEY } from './PlayNowConfirm';
import { BuildingState } from './BuildingState';
import { NowPlayingSummary } from './NowPlayingSummary';
import { DevicePickerModal } from './DevicePickerModal';
import packageJson from '../../../package.json';

/** Discrete steps of the wizard. */
type WizardStep = 'pick-episodes' | 'pick-songs' | 'building' | 'done';

/** Persisted lookback preference. Defaults to 3 days when unset. */
const LOOKBACK_KEY = 'wizard_lookback_days';

/** Cooldown after Play now to guard against double-tap. */
const PLAY_COOLDOWN_MS = 5_000;
/** Re-tap warning window after a successful play. */
const RETAP_WARN_MS = 30_000;

const readLookback = (): LookbackDays => {
    const raw = localStorage.getItem(LOOKBACK_KEY);
    if (raw === '1' || raw === '3' || raw === '7') return Number(raw) as LookbackDays;
    return 3;
};

/**
 * Wizard root. Owns the two-step flow's state and orchestrates the
 * "commit" phase: build merge → device picker (if needed) → single
 * `PUT /me/player/play`.
 *
 * State machine:
 * ```
 * pick-episodes → pick-songs → building → done → pick-episodes (Start over)
 * ```
 * Modal overlays (device picker, first-tap confirm) do not change
 * `step` — they just gate progression.
 */
export function Wizard() {
    const location = useLocation();

    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [step, setStep] = useState<WizardStep>('pick-episodes');

    const [lookbackDays, setLookbackDays] = useState<LookbackDays>(readLookback);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [resolvedEpisodes, setResolvedEpisodes] = useState<EpisodeWithShow[]>([]);

    const [source, setSource] = useState<SongSource>({ kind: 'my-songs' });
    const [songsPerEpisode, setSongsPerEpisode] = useState(2);
    const [randomize, setRandomize] = useState(true);

    const [showConfirm, setShowConfirm] = useState(false);
    const [devicePicker, setDevicePicker] = useState<{ devices: SpotifyDevice[] } | null>(null);
    const [buildingLabel, setBuildingLabel] = useState<string | undefined>();
    const [lastPlayed, setLastPlayed] = useState<{ episodes: EpisodeWithShow[]; songs: SpotifyTrack[] } | null>(null);

    const playCooldownRef = useRef<number>(0);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        (async () => {
            const [token, isUserToken] = await getToken();
            setIsLoggedIn(!!token && isUserToken);
        })();
    }, [location.search]);

    const handleLookbackChange = useCallback((days: LookbackDays) => {
        setLookbackDays(days);
        localStorage.setItem(LOOKBACK_KEY, String(days));
    }, []);

    /**
     * Gathers the list of song URIs for the current source, obeying the
     * randomize toggle. Warns via toast on shortfall but still returns.
     */
    const fetchSongs = async (needed: number): Promise<SpotifyTrack[]> => {
        if (source.kind === 'my-songs') {
            setBuildingLabel(strings.songs.grabbingSavedLabel);
            const { tracks, total } = await GetMySongsRandom();
            if (tracks.length === 0) {
                toast.error(
                    total === 0 ? strings.songs.noSavedSongs : strings.songs.loadSavedSongsFailed,
                );
                return [];
            }
            if (randomize) fisherYates(tracks);
            if (tracks.length < needed) {
                toast(strings.songs.savedShortfall(tracks.length, needed));
            }
            return tracks;
        }

        setBuildingLabel(strings.songs.loadingPlaylistLabel);
        let info = source.info;
        if (!info && source.url) {
            const id = GetPlaylistIdFromUrl(source.url);
            info = await GetPlaylistInfo(id);
        }
        const items = info?.tracks?.items ?? [];
        const tracks: SpotifyTrack[] = items
            .map(item => item?.track)
            .filter((t): t is NonNullable<typeof t> => !!t?.uri && !!t?.name)
            .map(t => ({
                id: (t.uri ?? '').split(':').pop() ?? '',
                name: t.name ?? '',
                uri: t.uri ?? '',
                artists: (t.artists ?? []).map(a => ({ name: a?.name ?? '', uri: a?.uri })),
                album: t.album ? { name: t.album.name } : undefined,
            }));
        if (tracks.length === 0) {
            toast.error(strings.songs.emptyPlaylist);
            return [];
        }
        if (randomize) fisherYates(tracks);
        if (tracks.length < needed) {
            toast(strings.songs.playlistShortfall(tracks.length, needed));
        }
        return tracks;
    };

    const doPlay = async (deviceId?: string): Promise<void> => {
        const episodes = resolvedEpisodes.filter(ep => selectedIds.has(ep.id));
        if (episodes.length === 0) {
            toast.error(strings.wizard.pickEpisodeFirst);
            setStep('pick-episodes');
            return;
        }

        // Establish the abort controller up-front so Cancel during song
        // fetch prevents the subsequent play write.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setStep('building');
        setBuildingLabel(undefined);

        const needed = episodes.length * songsPerEpisode;
        const songs = await fetchSongs(needed);
        if (controller.signal.aborted) return;
        if (songs.length === 0) {
            setStep('pick-songs');
            return;
        }

        const merged = buildMerge({
            episodes: episodes.map(e => e.uri),
            songs: songs.map(s => s.uri),
            songsPerEpisode,
        });
        if (controller.signal.aborted) return;

        setBuildingLabel(strings.songs.sendingLabel);

        const ok = await PlayUris(merged, { signal: controller.signal, deviceId });
        if (controller.signal.aborted) return;
        if (!ok) {
            toast.error(strings.wizard.playFailedToast);
            setStep('pick-songs');
            return;
        }

        writeLastPlay(Date.now());
        setLastPlayed({ episodes, songs: songs.slice(0, needed) });
        setStep('done');
    };

    /**
     * Handle the user tapping Play now. Enforces the 5s cooldown,
     * shows the first-tap confirmation, checks for an active device,
     * and warns on 30s re-tap.
     */
    const handlePlayNow = async (): Promise<void> => {
        const now = Date.now();
        if (now - playCooldownRef.current < PLAY_COOLDOWN_MS) {
            toast(strings.wizard.cooldownToast);
            return;
        }
        playCooldownRef.current = now;

        const episodes = resolvedEpisodes.filter(ep => selectedIds.has(ep.id));
        if (episodes.length === 0) {
            toast.error(strings.wizard.pickEpisodeFirst);
            return;
        }

        const last = readLastPlay();
        if (last && now - last.at < RETAP_WARN_MS) {
            const secondsAgo = Math.round((now - last.at) / 1000);
            if (!window.confirm(strings.wizard.retapConfirm(secondsAgo))) {
                playCooldownRef.current = 0;
                return;
            }
        }

        if (!localStorage.getItem(SEEN_REPLACE_WARNING_KEY)) {
            setShowConfirm(true);
            return;
        }

        await ensureDeviceThenPlay();
    };

    const ensureDeviceThenPlay = async (): Promise<void> => {
        const devices = await GetAvailableDevices();
        const active = devices.find(d => d.is_active);
        if (active) {
            await doPlay();
            return;
        }
        if (ENABLE_DEVICE_PICKER) {
            setDevicePicker({ devices });
            return;
        }
        // No picker path: reset the cooldown so the button isn't stranded
        // for 5s after the "no device" toast.
        playCooldownRef.current = 0;
        toast.error(strings.wizard.replaceWarningToast);
    };

    const handleDevicePick = async (deviceId: string): Promise<void> => {
        setDevicePicker(null);
        const ok = await TransferPlayback(deviceId);
        if (!ok) {
            playCooldownRef.current = 0;
            toast.error(strings.wizard.deviceActivateFailedToast);
            return;
        }
        await new Promise(r => setTimeout(r, 1000));
        await doPlay(deviceId);
    };

    const handleConfirm = async (remember: boolean): Promise<void> => {
        setShowConfirm(false);
        if (remember) localStorage.setItem(SEEN_REPLACE_WARNING_KEY, '1');
        await ensureDeviceThenPlay();
    };

    const handleCancelBuilding = (): void => {
        abortRef.current?.abort();
        setStep('pick-songs');
    };

    const handleStartOver = (): void => {
        setSelectedIds(new Set());
        setLastPlayed(null);
        setStep('pick-episodes');
    };

    if (isLoggedIn === null) return null;

    if (!isLoggedIn) {
        return (
            <div className="flex w-full max-w-md flex-col items-center gap-6 py-10">
                <p className="text-center text-zinc-400">
                    {strings.wizard.loginPrompt}
                </p>
                <button
                    onClick={() => logInWithSpotify()}
                    className="min-h-[44px] rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-green-400"
                >
                    {strings.wizard.loginButton}
                </button>
            </div>
        );
    }

    return (
        <>
            {step === 'pick-episodes' && (
                <EpisodePickerStep
                    lookbackDays={lookbackDays}
                    onLookbackChange={handleLookbackChange}
                    selectedIds={selectedIds}
                    onSelectedIdsChange={setSelectedIds}
                    onEpisodesResolved={setResolvedEpisodes}
                    onNext={() => setStep('pick-songs')}
                />
            )}

            {step === 'pick-songs' && (
                <SongSourceStep
                    source={source}
                    onSourceChange={setSource}
                    songsPerEpisode={songsPerEpisode}
                    onSongsPerEpisodeChange={setSongsPerEpisode}
                    randomize={randomize}
                    onRandomizeChange={setRandomize}
                    episodesCount={selectedIds.size}
                    onBack={() => setStep('pick-episodes')}
                    onPlayNow={handlePlayNow}
                />
            )}

            {step === 'building' && <BuildingState onCancel={handleCancelBuilding} label={buildingLabel} />}

            {step === 'done' && lastPlayed && (
                <NowPlayingSummary
                    episodes={lastPlayed.episodes}
                    songs={lastPlayed.songs}
                    songsPerEpisode={songsPerEpisode}
                    onStartOver={handleStartOver}
                />
            )}

            {showConfirm && (
                <PlayNowConfirm
                    onConfirm={handleConfirm}
                    onCancel={() => {
                        setShowConfirm(false);
                        playCooldownRef.current = 0;
                    }}
                />
            )}

            {devicePicker && (
                <DevicePickerModal
                    devices={devicePicker.devices}
                    onSelect={handleDevicePick}
                    onCancel={() => {
                        setDevicePicker(null);
                        playCooldownRef.current = 0;
                    }}
                    onRefresh={async () => {
                        const devices = await GetAvailableDevices();
                        setDevicePicker({ devices });
                    }}
                />
            )}

            <p className="mt-6 text-center text-xs text-zinc-500">{strings.wizard.version(packageJson.version)}</p>
        </>
    );
}
