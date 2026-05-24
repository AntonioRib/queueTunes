import { RatioSlider } from "../RatioSlider/RatioSlider";
import { EpisodeSlider } from "../EpisodeSlider/EpisodeSlider";
import { RandomizeCheckbox } from "../RandomizeCheckbox/RandomizeCheckbox";
import { SetStateAction } from "react";
import { SourceChoice } from "../SourceChoice/SourceChoice";

interface Step2Props {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    songToPodcastRatio: number;
    setSongToPodcastRatio: (ratio: number) => void;
    playlistName?: string;
    playlistNumberOfSongs?: number;
    playlistSongsApproximate?: boolean;
    playlistFollowers?: number;
    loadingFailed: boolean;
    isLoading: boolean;
    amountOfEpisodes: number;
    setAmountOfEpisodes: (amount: number) => void;
    randomizedChecked: boolean;
    setRandomizedChecked: (checked: boolean) => void;
    handleRetry: () => void;
    useMySongs: boolean;
    setUseMySongs: React.Dispatch<SetStateAction<boolean>>;
    reshuffle?: () => void;
}

export function Step2({ playlistUrl, setPlaylistUrl, songToPodcastRatio, setSongToPodcastRatio, playlistName, playlistNumberOfSongs, playlistSongsApproximate, playlistFollowers, loadingFailed, isLoading, amountOfEpisodes, setAmountOfEpisodes, randomizedChecked, setRandomizedChecked, handleRetry, useMySongs, setUseMySongs, reshuffle }: Step2Props) {
    return (
        <div id="step2" className="flex flex-col items-center font-semibold">
            <div className="mt-5 text-base">
                2. Add the playlist you'll want to queue and choose the podcast-to-song ratio
            </div>
            <div className="w-full my-5">
                <SourceChoice
                    playlistUrl={playlistUrl}
                    setPlaylistUrl={setPlaylistUrl}
                    playlistName={playlistName}
                    playlistNumberOfSongs={playlistNumberOfSongs}
                    playlistSongsApproximate={playlistSongsApproximate}
                    playlistFollowers={playlistFollowers}
                    loadingFailed={loadingFailed}
                    isLoading={isLoading}
                    handleRetry={handleRetry}
                    useMySongs={useMySongs}
                    setUseMySongs={setUseMySongs}
                />
            </div>
            <RandomizeCheckbox randomizedChecked={randomizedChecked} setRandomizedChecked={setRandomizedChecked} reshuffle={useMySongs ? undefined : reshuffle} />
            <EpisodeSlider amountOfEpisodes={amountOfEpisodes} setAmountOfEpisodes={setAmountOfEpisodes} />
            <RatioSlider songToPodcastRatio={songToPodcastRatio} setSongToPodcastRatio={setSongToPodcastRatio} />
        </div>
    );
}