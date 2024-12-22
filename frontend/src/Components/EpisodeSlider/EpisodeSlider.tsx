interface EpisodeSliderProps {
    amountOfEpisodes: number;
    setAmountOfEpisodes: (value: number) => void;
}

export function EpisodeSlider({ amountOfEpisodes, setAmountOfEpisodes }: EpisodeSliderProps) {
    const tooltip = (
        <div className="group relative inline">
            *
            <span className="absolute top-10 scale-0 rounded min-w-40 bg-gray-800 p-2 text-xs text-white group-hover:scale-100">Including the currently being played</span>
        </div>
    )
    return (
        <div className="w-full text-start mb-5">
            <label htmlFor="amountOfEpisodes" className="text-white font-medium text-sm">Number of episodes (<output id="amountOfEpisodesValue">{amountOfEpisodes}</output> podcasts) {tooltip}</label>
            <input
                id="amountOfEpisodes"
                type="range"
                min="0"
                max="10"
                step="1"
                value={amountOfEpisodes}
                onChange={(e) => setAmountOfEpisodes(parseInt(e.target.value))}
                className="w-full h-2 mt-5 bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
        </div>
    );
}