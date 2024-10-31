import { PlaylistViewer } from "./Components/PlaylistViewer/PlaylistViewer";
import { RatioSlider } from "./Components/RatioSlider/RatioSlider";

export function Step2() {
    return (
        <div id="step2" className="flex flex-col items-center font-semibold">
            <div className="my-5 text-base">
                2. Add the playlist you'll want to queue and choose the podcast-to-song ratio
            </div>
            <PlaylistViewer />
            <RatioSlider />
        </div>
    );
}