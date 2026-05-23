interface RandomizeCheckboxrProps {
    randomizedChecked: boolean;
    setRandomizedChecked: (checked: boolean) => void;
    reshuffle?: () => void;
}

export function RandomizeCheckbox({ randomizedChecked, setRandomizedChecked, reshuffle }: RandomizeCheckboxrProps) {
    const tooltip = (
        <div className="group relative inline">
            *
            <span className="absolute top-5 scale-0 rounded min-w-60 bg-gray-800 p-2 text-xs text-white group-hover:scale-100">Get random songs from the playlist instead of always the ones from the top</span>
        </div>
    )
    return (
        <div className="w-full text-start mb-5">
            <div className="flex items-center gap-3">
                <input
                    id="randomizedChecked"
                    type="checkbox"
                    checked={randomizedChecked}
                    onChange={(e) => setRandomizedChecked(e.target.checked)}
                    className="w-5 h-5 rounded-lg cursor-pointer accent-green-500 hover:scale-110 transition-transform duration-200"
                />
                <label
                    htmlFor="randomizedChecked"
                    className="text-white font-medium text-sm cursor-pointer hover:text-green-400 transition-colors duration-200"
                    tabIndex={0}
                    title="Enable to randomize playlist songs"
                >
                    Randomize playlist songs {tooltip}
                </label>
                {reshuffle && (
                    <button
                        onClick={reshuffle}
                        disabled={!randomizedChecked}
                        className={`ml-auto text-xs border rounded px-2 py-0.5 transition-colors duration-200 ${randomizedChecked
                                ? 'text-emerald-300 hover:text-emerald-100 border-emerald-600 hover:border-emerald-400 cursor-pointer'
                                : 'text-gray-500 border-gray-600 cursor-not-allowed'
                            }`}
                        title="Shuffle again"
                    >
                        🎲 Reshuffle
                    </button>
                )}
            </div>
        </div>
    );
}