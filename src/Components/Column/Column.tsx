import { useState } from "react";
import { Divider } from "../Divider/Divider";
import { Step1 } from "../Step1/Step1";
import { Step2 } from "../Step2/Step2";
import { Step3 } from "../Step3/Step3";

export function Column() {
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [songToPodcastRatio, setSongToPodcastRatio] = useState(5);

    const onClick = () => {
        console.log("Queue Tunes with playlistUrl:", playlistUrl, "and songToPodcastRatio:", songToPodcastRatio);
        alert("Queue Tunes with playlistUrl: " + playlistUrl + " and songToPodcastRatio: " + songToPodcastRatio);
    }

    return (
        <div id="column" className="max-w-md min-w-60 text-start bg-emerald-950 border border-green-900 rounded-lg px-10 py-5 shadow-lg">
            <Step1 />
            <Divider />
            <Step2
                playlistUrl={playlistUrl}
                setPlaylistUrl={setPlaylistUrl}
                songToPodcastRatio={songToPodcastRatio}
                setSongToPodcastRatio={setSongToPodcastRatio}
            />
            <Divider />
            <Step3 onClick={onClick} />
        </div>
    );
}