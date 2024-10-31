import { useState } from 'react';

export function RatioSlider() {
    const [songToPodcastRatio, setSongToPodcastRatio] = useState(5);

    return (
        <div className="w-full text-start mb-5">
            <label htmlFor="songToPodcastRatio" className="text-white font-medium text-sm">Ratio (<output id="songToPodcastRatioValue">{songToPodcastRatio}</output> songs per podcast)</label>
            <input
                id="songToPodcastRatio"
                type="range"
                min="0"
                max="10"
                step="1"
                value={songToPodcastRatio}
                onChange={(e) => setSongToPodcastRatio(parseInt(e.target.value))}
                className="w-full h-2 mt-5 bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
        </div>
    );
}