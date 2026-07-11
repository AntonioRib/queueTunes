import { EpisodeWithShow } from '../../Models/EpisodeWithShow';

/**
 * Convert Spotify's milliseconds duration into a compact "Xh Ym" string.
 * @param ms - Duration in milliseconds.
 * @returns e.g. `"42 min"`, `"1 hr 5 min"`.
 */
const formatDuration = (ms: number): string => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr ${remainingMins} min`;
};

/** Props for {@link EpisodeCard}. */
export interface EpisodeCardProps {
    episode: EpisodeWithShow;
    isChecked: boolean;
    onToggle: (id: string) => void;
}

/**
 * Single row in the Step 1 episode picker: show art + episode title +
 * show name + duration + checkbox.
 */
export function EpisodeCard({ episode, isChecked, onToggle }: EpisodeCardProps) {
    const smallestShowImg = episode.showImages?.[episode.showImages.length - 1]?.url;
    const smallestEpImg = episode.images?.[episode.images.length - 1]?.url;
    return (
        <li className="list-none">
            <label
                className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                    isChecked ? 'bg-zinc-800' : 'bg-zinc-900'
                }`}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(episode.id)}
                    className="h-5 w-5 shrink-0 accent-green-500"
                />
                <img
                    src={smallestShowImg || smallestEpImg}
                    alt=""
                    aria-hidden="true"
                    className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <div className="flex min-w-0 flex-col">
                    <span
                        className={`truncate text-sm font-medium ${
                            isChecked ? 'text-white' : 'text-zinc-300'
                        }`}
                    >
                        {episode.name}
                    </span>
                    <span className={`truncate text-xs ${isChecked ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {episode.showName} · {formatDuration(episode.duration_ms)}
                    </span>
                </div>
            </label>
        </li>
    );
}
