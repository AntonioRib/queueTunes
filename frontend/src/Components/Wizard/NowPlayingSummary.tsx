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
        <div className="flex w-full max-w-md flex-col gap-4 pb-24">
            <div className="rounded-lg bg-green-950/40 p-4 text-center">
                <p className="text-lg font-semibold text-green-300">{strings.nowPlaying.heading}</p>
                <p className="mt-1 text-xs text-zinc-400">
                    {strings.nowPlaying.summary(episodes.length, songs.length)}
                </p>
            </div>

            <div className="flex flex-col gap-1">
                {rows.map((row, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                            row.kind === 'episode' ? 'bg-zinc-800' : 'bg-zinc-900'
                        }`}
                    >
                        <span className="text-xs text-zinc-500">{idx + 1}</span>
                        <span className="text-xs">{row.kind === 'episode' ? '🎙️' : '🎵'}</span>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm text-white">{row.label}</span>
                            {row.sub && <span className="truncate text-xs text-zinc-400">{row.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-black to-transparent p-4">
                <button
                    onClick={onStartOver}
                    className="mx-auto block w-full max-w-md rounded-full bg-green-500 py-3 font-semibold text-black transition-colors hover:bg-green-400"
                >
                    {strings.nowPlaying.startOver}
                </button>
            </div>
        </div>
    );
}
