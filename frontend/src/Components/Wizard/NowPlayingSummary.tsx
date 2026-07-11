import { EpisodeWithShow } from '../../Models/EpisodeWithShow';
import { SpotifyTrack } from '../../Models/SpotifyTrack';
import { strings } from '../../strings';

/** Props for {@link NowPlayingSummary}. */
export interface NowPlayingSummaryProps {
    episodes: EpisodeWithShow[];
    songs: SpotifyTrack[];
    songsPerEpisode: number;
    onStartOver: () => void;
}

/**
 * Post-play confirmation view. Renders the merged plan
 * (Ep1 → S1 → S2 → Ep2 → …) so the user can see what got queued, plus a
 * "Start over" button that clears selections and returns to Step 1.
 */
export function NowPlayingSummary({ episodes, songs, songsPerEpisode, onStartOver }: NowPlayingSummaryProps) {
    const rows: { kind: 'episode' | 'song'; label: string; sub?: string }[] = [];
    let songIndex = 0;
    for (const ep of episodes) {
        rows.push({ kind: 'episode', label: ep.name, sub: ep.showName });
        for (let i = 0; i < songsPerEpisode; i++) {
            const song = songs[songIndex];
            if (!song) break;
            rows.push({
                kind: 'song',
                label: song.name,
                sub: song.artists.map(a => a.name).join(', '),
            });
            songIndex++;
        }
    }

    return (
        <div className="flex w-full max-w-md flex-col gap-4 pb-32">
            <div className="rounded-lg bg-green-950/40 p-4 text-center">
                <h2 className="text-lg font-semibold text-green-300">{strings.nowPlaying.heading}</h2>
                <p className="mt-1 text-xs text-zinc-400">
                    {strings.nowPlaying.summary(episodes.length, songs.length)}
                </p>
            </div>

            <ol className="flex flex-col gap-1">
                {rows.map((row, idx) => (
                    <li
                        key={idx}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                            row.kind === 'episode' ? 'bg-zinc-800' : 'bg-zinc-900'
                        }`}
                    >
                        <span className="text-xs text-zinc-400">{idx + 1}</span>
                        <span aria-hidden="true" className="text-xs">
                            {row.kind === 'episode' ? '🎙️' : '🎵'}
                        </span>
                        <span className="sr-only">{row.kind === 'episode' ? 'Episode: ' : 'Song: '}</span>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm text-white">{row.label}</span>
                            {row.sub && <span className="truncate text-xs text-zinc-400">{row.sub}</span>}
                        </div>
                    </li>
                ))}
            </ol>

            <div
                className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-black to-transparent px-4 pt-4"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                <button
                    onClick={onStartOver}
                    className="mx-auto block w-full max-w-md min-h-[44px] rounded-full bg-green-500 py-3 font-semibold text-black transition-colors hover:bg-green-400"
                >
                    {strings.nowPlaying.startOver}
                </button>
            </div>
        </div>
    );
}
