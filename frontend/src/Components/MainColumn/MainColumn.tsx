import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Divider } from "../Divider/Divider";
import { Step1 } from "../Step1/Step1";
import { Step2 } from "../Step2/Step2";
import { Step3 } from "../Step3/Step3";
import { PlaylistInfo } from "../../Models/PlaylistInfo";
import { fetchPlaylistInfo } from "../../Hooks/fetchPlaylistInfo";

export function MainColumn() {
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [songToPodcastRatio, setSongToPodcastRatio] = useState(5);
    const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | undefined>(undefined);
    const [loadingFailed, setLoadingFailed] = useState(false);

    useEffect(() => {
        fetchPlaylistInfo(playlistUrl, setPlaylistInfo, setLoadingFailed);
    }, [playlistUrl, setPlaylistInfo, setLoadingFailed]);

    const onClick = () => {
        console.log("Queue Tunes with: " + playlistInfo?.name + " and songToPodcastRatio: " + songToPodcastRatio);
        toast.success("Queue Tunes with: " + playlistInfo?.name + " and songToPodcastRatio: " + songToPodcastRatio);
        toast.promise(new Promise(function (resolve, err) {
            setTimeout(resolve, 5000);
        }), {
            loading: "Updating your playlist...",
            success: "Playlist updated successfully",
            error: "Failed to update playlist",
        });
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
                playlistName={playlistInfo?.name}
                playlistNumberOfSongs={playlistInfo?.tracks?.total}
                playlistFollowers={playlistInfo?.followers?.total}
                loadingFailed={loadingFailed}
            />
            <Divider />
            <Step3 onClick={onClick} disabled={loadingFailed || playlistInfo === undefined} />
        </div>
    );
}