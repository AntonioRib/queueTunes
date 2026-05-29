import { EpisodeWithShow } from '../../Models/EpisodeWithShow';

function formatDuration(ms: number): string {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr ${remainingMins} min`;
}

interface EpisodeCardProps {
    episode: EpisodeWithShow;
    isChecked: boolean;
    onToggle: (id: string) => void;
}

export function EpisodeCard({ episode, isChecked, onToggle }: EpisodeCardProps) {
    return (
        <label
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-zinc-800' : 'bg-zinc-900 opacity-60'
                }`}
        >
            <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(episode.id)}
                className="w-4 h-4 accent-green-500 shrink-0"
            />
            <img
                src={episode.showImages?.[episode.showImages.length - 1]?.url || episode.images?.[episode.images.length - 1]?.url}
                alt={episode.showName}
                className="w-12 h-12 rounded object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0">
                <span className="text-white text-sm font-medium truncate">
                    {episode.name}
                </span>
                <span className="text-zinc-400 text-xs truncate">
                    {episode.showName} · {formatDuration(episode.duration_ms)}
                </span>
            </div>
        </label>
    );
}
