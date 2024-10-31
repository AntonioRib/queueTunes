import { PlaylistViewer } from "../PlaylistViewer/PlaylistViewer";
import { RatioSlider } from "../RatioSlider/RatioSlider";

interface Step2Props {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    songToPodcastRatio: number;
    setSongToPodcastRatio: (ratio: number) => void;
}

export function Step2({ playlistUrl, setPlaylistUrl, songToPodcastRatio, setSongToPodcastRatio, }: Step2Props) {
    return (
        <div id="step2" className="flex flex-col items-center font-semibold">
            <div className="my-5 text-base">
                2. Add the playlist you'll want to queue and choose the podcast-to-song ratio
            </div>
            <PlaylistViewer playlistUrl={playlistUrl} setPlaylistUrl={setPlaylistUrl} />
            <RatioSlider songToPodcastRatio={songToPodcastRatio} setSongToPodcastRatio={setSongToPodcastRatio} />
        </div>
    );
}