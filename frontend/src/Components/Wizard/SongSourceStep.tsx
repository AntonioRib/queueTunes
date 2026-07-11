import { useEffect, useRef, useState } from 'react';
import { PlaylistInfo } from '../../Models/PlaylistInfo';
import { GetPlaylistInfo } from '../../Services/GetPlaylistInfo';
import { GetPlaylistIdFromUrl } from '../../Utils/GetPlaylistIdFromUrl';
import { ValidatePlaylistUrl } from '../../Utils/ValidatePlaylistUrl';
import { strings } from '../../strings';

/** Kinds of song source the wizard supports. */
export type SongSource =
    | { kind: 'my-songs' }
    | { kind: 'playlist'; url: string; info?: PlaylistInfo };

/** Props for {@link SongSourceStep}. */
export interface SongSourceStepProps {
    source: SongSource;
    onSourceChange: (source: SongSource) => void;
    songsPerEpisode: number;
    onSongsPerEpisodeChange: (n: number) => void;
    randomize: boolean;
    onRandomizeChange: (v: boolean) => void;
    episodesCount: number;
    onBack: () => void;
    onPlayNow: () => void;
    isBusy?: boolean;
}

/**
 * Wizard Step 2 — pick songs.
 *
 * Radio between "My songs" (random slice of Saved Tracks) and
 * "Playlist URL". Validates the pasted URL on change and fetches
 * playlist metadata via `GetPlaylistInfo`. A collapsed "Fine-tune"
 * disclosure exposes the songs-per-episode slider and randomize
 * checkbox.
 */
export function SongSourceStep({
    source,
    onSourceChange,
    songsPerEpisode,
    onSongsPerEpisodeChange,
    randomize,
    onRandomizeChange,
    episodesCount,
    onBack,
    onPlayNow,
    isBusy,
}: SongSourceStepProps) {
    const [urlInput, setUrlInput] = useState(source.kind === 'playlist' ? source.url : '');
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [fineTuneOpen, setFineTuneOpen] = useState(false);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        if (source.kind !== 'playlist') return;
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        const url = urlInput.trim();
        if (url === '') {
            onSourceChange({ kind: 'playlist', url: '' });
            setLoadError(null);
            setIsLoading(false);
            return;
        }
        if (!ValidatePlaylistUrl(url)) {
            onSourceChange({ kind: 'playlist', url });
            setLoadError(strings.songSource.invalidUrl);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);
        debounceRef.current = window.setTimeout(async () => {
            const id = GetPlaylistIdFromUrl(url);
            const info = await GetPlaylistInfo(id);
            if (cancelled) return;
            setIsLoading(false);
            if (!info) {
                setLoadError(strings.songSource.playlistLoadFailed);
                onSourceChange({ kind: 'playlist', url });
                return;
            }
            onSourceChange({ kind: 'playlist', url, info });
        }, 400);

        return () => {
            cancelled = true;
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
        // We intentionally exclude onSourceChange to avoid re-fetching on every parent render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlInput, source.kind]);

    const neededSongs = episodesCount * songsPerEpisode;
    const playlistTrackTotal = source.kind === 'playlist' ? source.info?.tracks?.total ?? 0 : undefined;

    const playDisabled =
        isBusy ||
        (source.kind === 'playlist' && (isLoading || !source.info || !source.url));

    return (
        <div className="flex w-full max-w-md flex-col gap-4 pb-24">
            <p className="text-sm text-zinc-400">{strings.songSource.prompt}</p>

            <div className="flex flex-col gap-2 rounded-lg bg-zinc-900 p-3">
                <label className="flex items-center gap-3">
                    <input
                        type="radio"
                        name="song-source"
                        checked={source.kind === 'my-songs'}
                        onChange={() => onSourceChange({ kind: 'my-songs' })}
                        className="h-4 w-4 accent-green-500"
                    />
                    <span className="text-sm text-white">{strings.songSource.mySongsLabel}</span>
                    <span className="text-xs text-zinc-500">{strings.songSource.mySongsHint}</span>
                </label>
                <label className="flex items-center gap-3">
                    <input
                        type="radio"
                        name="song-source"
                        checked={source.kind === 'playlist'}
                        onChange={() => onSourceChange({ kind: 'playlist', url: urlInput })}
                        className="h-4 w-4 accent-green-500"
                    />
                    <span className="text-sm text-white">{strings.songSource.playlistLabel}</span>
                </label>

                {source.kind === 'playlist' && (
                    <div className="mt-2 flex flex-col gap-2">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder={strings.songSource.playlistPlaceholder}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none"
                        />
                        {isLoading && <p className="text-xs text-zinc-400">{strings.songSource.loadingPlaylist}</p>}
                        {loadError && <p className="text-xs text-red-400">{loadError}</p>}
                        {source.info && !isLoading && !loadError && (
                            <div className="rounded-lg bg-zinc-800 p-3">
                                <p className="text-sm font-medium text-white">{source.info.name}</p>
                                <p className="text-xs text-zinc-400">
                                    {strings.songSource.playlistTrackCount(source.info.tracks?.total ?? 0)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-lg bg-zinc-900">
                <button
                    onClick={() => setFineTuneOpen(v => !v)}
                    className="flex w-full items-center justify-between p-3 text-sm text-zinc-300 hover:text-white"
                    aria-expanded={fineTuneOpen}
                >
                    <span>{strings.songSource.fineTune}</span>
                    <span aria-hidden className={`transition-transform ${fineTuneOpen ? 'rotate-90' : ''}`}>
                        ›
                    </span>
                </button>
                {fineTuneOpen && (
                    <div className="flex flex-col gap-4 p-3 pt-0">
                        <div>
                            <label htmlFor="songs-per-ep" className="text-sm text-white">
                                {strings.songSource.songsPerEpisodeLabel(songsPerEpisode)}
                            </label>
                            <input
                                id="songs-per-ep"
                                type="range"
                                min={1}
                                max={5}
                                step={1}
                                value={songsPerEpisode}
                                onChange={e => onSongsPerEpisodeChange(Number(e.target.value))}
                                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-green-500"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-white">
                            <input
                                type="checkbox"
                                checked={randomize}
                                onChange={e => onRandomizeChange(e.target.checked)}
                                className="h-4 w-4 accent-green-500"
                            />
                            {strings.songSource.randomizeLabel}
                        </label>
                    </div>
                )}
            </div>

            {source.kind === 'playlist' && playlistTrackTotal !== undefined && playlistTrackTotal < neededSongs && playlistTrackTotal > 0 && (
                <p className="rounded-lg bg-yellow-950/50 p-3 text-xs text-yellow-200">
                    {strings.songSource.playlistShortWarning(playlistTrackTotal, neededSongs)}
                </p>
            )}

            <div className="fixed inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black via-black to-transparent p-4">
                <button
                    onClick={onPlayNow}
                    disabled={playDisabled}
                    className="mx-auto block w-full max-w-md rounded-full bg-green-500 py-3 font-semibold text-black transition-colors hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                    {strings.songSource.playNow}
                </button>
                <button
                    onClick={onBack}
                    className="mx-auto block w-full max-w-md text-sm text-zinc-400 hover:text-white"
                >
                    {strings.songSource.backToEpisodes}
                </button>
            </div>
        </div>
    );
}
