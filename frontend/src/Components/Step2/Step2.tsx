import { PlaylistViewer } from "../PlaylistViewer/PlaylistViewer";
import { RatioSlider } from "../RatioSlider/RatioSlider";
import { EpisodeSlider } from "../EpisodeSlider/EpisodeSlider";
import { RandomizeCheckbox } from "../RandomizeCheckbox/RandomizeCheckbox";

interface Step2Props {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    songToPodcastRatio: number;
    setSongToPodcastRatio: (ratio: number) => void;
    playlistName?: string;
    playlistNumberOfSongs?: number;
    playlistFollowers?: number;
    loadingFailed: boolean;
    isLoading: boolean;
    amountOfEpisodes: number;
    setAmountOfEpisodes: (amount: number) => void;
    randomizedChecked: boolean;
    setRandomizedChecked: (checked: boolean) => void;
}

export function Step2({ playlistUrl, setPlaylistUrl, songToPodcastRatio, setSongToPodcastRatio, playlistName, playlistNumberOfSongs, playlistFollowers, loadingFailed, isLoading, amountOfEpisodes, setAmountOfEpisodes, randomizedChecked, setRandomizedChecked }: Step2Props) {
    return (
        <div id="step2" className="flex flex-col items-center font-semibold">
            <div className="my-5 text-base">
                2. Add the playlist you'll want to queue and choose the podcast-to-song ratio
            </div>
            <PlaylistViewer
                playlistUrl={playlistUrl}
                setPlaylistUrl={setPlaylistUrl}
                playlistName={playlistName}
                playlistNumberOfSongs={playlistNumberOfSongs}
                playlistFollowers={playlistFollowers}
                loadingFailed={loadingFailed}
                isLoading={isLoading}
            />
            <RandomizeCheckbox randomizedChecked={randomizedChecked} setRandomizedChecked={setRandomizedChecked} />
            <EpisodeSlider amountOfEpisodes={amountOfEpisodes} setAmountOfEpisodes={setAmountOfEpisodes} />
            <RatioSlider songToPodcastRatio={songToPodcastRatio} setSongToPodcastRatio={setSongToPodcastRatio} />
        </div>
    );
}