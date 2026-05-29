import { EpisodeWithShow } from '../../Models/EpisodeWithShow';
import { EpisodeCard } from './EpisodeCard';

interface EpisodeListProps {
    groupedEpisodes: { day: string; episodes: EpisodeWithShow[] }[];
    checkedIds: Set<string>;
    onToggleEpisode: (id: string) => void;
    lookbackDays: number;
}

export function EpisodeList({ groupedEpisodes, checkedIds, onToggleEpisode, lookbackDays }: EpisodeListProps) {
    if (groupedEpisodes.length === 0 || groupedEpisodes.every(g => g.episodes.length === 0)) {
        return (
            <div className="text-center py-10 text-zinc-400">
                <p className="text-lg">No new episodes</p>
                <p className="text-sm mt-1">Nothing released in the last {lookbackDays === 1 ? '24 hours' : `${lookbackDays} days`}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {groupedEpisodes.map(group => (
                <div key={group.day}>
                    <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        {group.day}
                    </h3>
                    <div className="flex flex-col gap-2">
                        {group.episodes.map(ep => (
                            <EpisodeCard
                                key={ep.id}
                                episode={ep}
                                isChecked={checkedIds.has(ep.id)}
                                onToggle={onToggleEpisode}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
