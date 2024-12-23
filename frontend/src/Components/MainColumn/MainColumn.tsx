import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Divider } from "../Divider/Divider";
import { Step1 } from "../Step1/Step1";
import { Step2 } from "../Step2/Step2";
import { Step3 } from "../Step3/Step3";
import { PlaylistInfo } from "../../Models/PlaylistInfo";
import { fetchPlaylistInfo } from "../../Hooks/fetchPlaylistInfo";
import { cleanTokens, getToken, logInWithSpotify } from "../../Utils/Login";
import { GetSpotifyQueueState } from "../../Services/GetSpotifyQueueState";
import { MergeQueueAndPlaylist } from "../../Utils/MergeQueueAndPlaylist";
import { GetPlaybackState } from "../../Services/GetPlaybackState";
import { restorePlaylistInfo } from "../../Hooks/restorePlaylistInfo";
import { addTracksToQueue } from "../../Utils/AddTracksToQueue";
import { skipTracksOnQueue } from "../../Utils/SkipTracksOnQueue";
import { saveSettings } from "../../Hooks/saveSettings";
import { getSettings } from "../../Hooks/getSettings";
import { QueueState } from "../../Models/QueueState";
import { GetMySongs } from "../../Services/GetMySongs";

export function MainColumn() {
    const location = useLocation()
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingFailed, setLoadingFailed] = useState(false);


    const savedSettings = getSettings(location.pathname);
    const [useMySongs, setUseMySongs] = useState(savedSettings?.useMySongs || "false");
    const [songToPodcastRatio, setSongToPodcastRatio] = useState(savedSettings?.podcast_ratio || 2);
    const [amountOfEpisodes, setAmountOfEpisodes] = useState(savedSettings?.number_episodes || 4);

    const hasFetched = useRef(false);
    const [randomizedChecked, setRandomizedChecked] = useState(savedSettings?.randomize_tracks || false);

    useEffect(() => {
        fetchPlaylistInfo(playlistUrl, setPlaylistInfo, setLoadingFailed, setIsLoading);
    }, [playlistUrl, setPlaylistInfo, setLoadingFailed, setIsLoading]);

    useEffect(() => {
        restorePlaylistInfo(location.pathname, setPlaylistInfo, setPlaylistUrl, setLoadingFailed);
    }, [location.pathname, setPlaylistInfo, setPlaylistUrl, setLoadingFailed, setAmountOfEpisodes, setSongToPodcastRatio]);

    useEffect(() => {
        if (!location.pathname.includes("/queue")) {
            cleanTokens();
            return;
        }

        if (location.search.includes("?error")) {
            toast.error("Failed to get your info. Please try again.", {
                id: 'error-getting-info',
            });
            return
        }

        if (location.pathname === "/queue") {
            toast.success("We have your info. Please click QueueTunes again!", {
                id: 'click-again',
            });
            return;
        }
    }, [location.search, location.pathname]);

    useEffect(() => {
        if (hasFetched.current || location.pathname !== "/queue") {
            return;
        }

        hasFetched.current = true;
        getToken().then(() => {
            console.log("Got token");
            return;
        });
    }, [location, hasFetched]);

    const onClick = async () => {
        saveSettings(amountOfEpisodes, songToPodcastRatio, randomizedChecked, useMySongs);
        const [token] = await getToken();
        if (!token) {
            logInWithSpotify();
            return;
        }

        const playbackState = await GetPlaybackState();
        if (!playbackState.is_playing) {
            toast.error("Please start playing a podcast.");
            return;
        }

        const queueState = await GetSpotifyQueueState();
        if (!queueState || !playlistInfo) {
            toast.error("Failed to get queue state or playlist info. Please try again.");
            return;
        }

        if (useMySongs === "true") {
            const mySongs = await GetMySongs();
            if (!mySongs) {
                toast.error("Failed to get your songs. Please try again.");
                return;
            }
            const play = {
                tracks: {
                    items: mySongs.items,
                },
                total: mySongs.items?.length,
            } as PlaylistInfo;

            await handleAddTracksAndSkip(queueState, play);
            return;
        }

        await handleAddTracksAndSkip(queueState, playlistInfo);
    };

    const handleAddTracksAndSkip = async (queueState: QueueState, playlistInfo: PlaylistInfo) => {
        const idsToAdd = MergeQueueAndPlaylist(queueState, playlistInfo, amountOfEpisodes, songToPodcastRatio, randomizedChecked);
        if (!idsToAdd || idsToAdd.length === 0) {
            toast.error("No songs to add.");
            return;
        }

        const addTracksPromise = addTracksToQueue(idsToAdd);
        toast.promise(addTracksPromise, {
            loading: "Adding songs to queue...",
            success: "Successfully added songs to queue!",
            error: "Failed to add songs to queue.",
        });
        await addTracksPromise;
        const skipPromises = skipTracksOnQueue(amountOfEpisodes);
        toast.promise(skipPromises, {
            loading: "Skipping to next episode...",
            success: "Successfully added songs to queue and skipped to next episode!",
            error: "Failed to skip to next episode.",
        });
        await skipPromises;
    };

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
                isLoading={isLoading}
                amountOfEpisodes={amountOfEpisodes}
                setAmountOfEpisodes={setAmountOfEpisodes}
                randomizedChecked={randomizedChecked}
                setRandomizedChecked={setRandomizedChecked}
                handleRetry={() => fetchPlaylistInfo(playlistUrl, setPlaylistInfo, setLoadingFailed, setIsLoading)}
                useMySongs={useMySongs}
                setUseMySongs={setUseMySongs}
            />
            <Divider />
            <Step3 onClick={onClick} disabled={(loadingFailed || playlistInfo === undefined) && useMySongs === "false"} />
        </div>
    );
}