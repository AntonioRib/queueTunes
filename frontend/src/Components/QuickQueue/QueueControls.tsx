import { LookbackDays } from '../../Models/EpisodeWithShow';

interface QueueControlsProps {
    lookbackDays: LookbackDays;
    onLookbackChange: (days: LookbackDays) => void;
    onRefresh: () => void;
    onToggleAll: () => void;
    allSelected: boolean;
}

export function QueueControls({ lookbackDays, onLookbackChange, onRefresh, onToggleAll, allSelected }: QueueControlsProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <select
                    value={lookbackDays}
                    onChange={e => onLookbackChange(Number(e.target.value) as LookbackDays)}
                    className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:border-green-500"
                >
                    <option value={1}>Last 24 hours</option>
                    <option value={3}>Last 3 days</option>
                    <option value={7}>Last 7 days</option>
                </select>
                <button
                    onClick={onRefresh}
                    title="Refresh episodes"
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                    </svg>
                </button>
            </div>

            <button
                onClick={onToggleAll}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
                {allSelected ? 'Deselect all' : 'Select all'}
            </button>
        </div>
    );
}
