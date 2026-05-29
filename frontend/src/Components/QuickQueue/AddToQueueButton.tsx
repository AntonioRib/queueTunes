interface AddToQueueButtonProps {
    checkedCount: number;
    isQueuing: boolean;
    progress: { current: number; total: number };
    onAdd: () => void;
    queuedCount: number | null;
    onContinue: () => void;
}

export function AddToQueueButton({ checkedCount, isQueuing, progress, onAdd, queuedCount, onContinue }: AddToQueueButtonProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
            {queuedCount ? (
                <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2">
                    <p className="text-green-400 text-sm font-medium">✓ {queuedCount} episode{queuedCount !== 1 ? 's' : ''} added to queue</p>
                    <button
                        onClick={onContinue}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 text-lg rounded-full transition-colors animate-pulse"
                    >
                        Continue to Queue Tunes →
                    </button>
                </div>
            ) : (
                <button
                    onClick={onAdd}
                    disabled={isQueuing || checkedCount === 0}
                    className="w-full max-w-md mx-auto block bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-semibold py-3 rounded-full transition-colors"
                >
                    {isQueuing
                        ? `Adding ${progress.current}/${progress.total}...`
                        : `Add ${checkedCount} episode${checkedCount !== 1 ? 's' : ''} to queue`
                    }
                </button>
            )}
        </div>
    );
}
