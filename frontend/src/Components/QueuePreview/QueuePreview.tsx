import { useState } from "react";
import { PlaylistInfo } from "../../Models/PlaylistInfo";

interface QueuePreviewProps {
    playlistInfo?: PlaylistInfo;
    amountOfEpisodes: number;
    songToPodcastRatio: number;
    randomizedChecked: boolean;
}

export function QueuePreview({ playlistInfo, amountOfEpisodes, songToPodcastRatio, randomizedChecked }: QueuePreviewProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!playlistInfo?.tracks?.items) {
        return null;
    }

    const tracks = [...playlistInfo.tracks.items];
    if (randomizedChecked) {
        tracks.sort(() => Math.random() - 0.5);
    }

    // Build a preview of the interleaved queue pattern
    const preview: { name: string; type: 'song' | 'episode' }[] = [];
    let trackIndex = 0;

    for (let ep = 0; ep < amountOfEpisodes; ep++) {
        preview.push({ name: `Episode ${ep + 1}`, type: 'episode' });
        for (let s = 0; s < songToPodcastRatio; s++) {
            const track = tracks[trackIndex]?.track;
            if (track?.name) {
                const artist = track.artists?.[0]?.name;
                preview.push({ name: artist ? `${track.name} — ${artist}` : track.name, type: 'song' });
            }
            trackIndex++;
        }
    }

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    viewBox="0 0 12 12"
                    fill="currentColor"
                >
                    <path d="M4 2l4 4-4 4V2z" />
                </svg>
                Queue Preview
            </button>
            {isOpen && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-emerald-900/50 p-2 space-y-0.5">
                    {preview.map((item, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded ${item.type === 'episode' ? 'bg-emerald-800/60 text-emerald-200 font-medium' : 'text-white/80'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === 'episode' ? 'bg-emerald-400' : 'bg-white/50'
                                }`} />
                            <span className="truncate">{item.name}</span>
                        </div>
                    ))}
                </div>
            )}
            {isOpen && randomizedChecked && (
                <p className="text-xs text-emerald-400/70 mt-2 italic">Songs will be shuffled on queue</p>
            )}
        </div>
    );
}
