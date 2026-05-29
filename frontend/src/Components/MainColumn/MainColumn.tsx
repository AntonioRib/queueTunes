import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Divider } from "../Divider/Divider";
import { Step1 } from "../Step1/Step1";
import { Step2 } from "../Step2/Step2";
import { Step3 } from "../Step3/Step3";
import { PlaylistInfo } from "../../Models/PlaylistInfo";
import { fetchPlaylistInfo } from "../../Hooks/fetchPlaylistInfo";
import { getToken, logInWithSpotify } from "../../Utils/Login";
import { GetSpotifyQueueState } from "../../Services/GetSpotifyQueueState";
import { MergeQueueAndPlaylist, countEpisodesInQueue } from "../../Utils/MergeQueueAndPlaylist";
import { GetPlaybackState } from "../../Services/GetPlaybackState";
import { GetPlaylistInfo } from "../../Services/GetPlaylistInfo";
import { GetPlaylistIdFromUrl } from "../../Utils/GetPlaylistIdFromUrl";
import { restorePlaylistInfo } from "../../Hooks/restorePlaylistInfo";
import { getPlaylistInfo } from "../../Hooks/getPlaylistInfo";
import { addTracksToQueue } from "../../Utils/AddTracksToQueue";
import { skipTracksOnQueue } from "../../Utils/SkipTracksOnQueue";
import { saveSettings } from "../../Hooks/saveSettings";
import { getSettings } from "../../Hooks/getSettings";
import { QueueState } from "../../Models/QueueState";
import { GetMySongs } from "../../Services/GetMySongs";
import { savePlaylistInfo } from "../../Hooks/savePlaylistInfo";
import { QueuePreview } from "../QueuePreview/QueuePreview";
import { PausePlayback } from "../../Services/PausePlayback";
import packageJson from '../../../package.json';

export function MainColumn() {
    const location = useLocation()
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingFailed, setLoadingFailed] = useState(false);

    const episodesFromUrl = new URLSearchParams(location.search).get('episodes');
    const savedSettings = getSettings(location.pathname);
    const [useMySongs, setUseMySongs] = useState(savedSettings?.useMySongs ?? false);
    const [songToPodcastRatio, setSongToPodcastRatio] = useState(savedSettings?.podcast_ratio || 2);
    const [amountOfEpisodes, setAmountOfEpisodes] = useState(
        episodesFromUrl ? Math.min(Number(episodesFromUrl), 10) : (savedSettings?.number_episodes || 4)
    );

    const hasFetched = useRef(false);
    const requestOnGoing = useRef(false);
    const [isQueuingTunes, setIsQueuingTunes] = useState(false);

    const [randomizedChecked, setRandomizedChecked] = useState(savedSettings?.randomize_tracks || false);
    const [shuffledTracks, setShuffledTracks] = useState<PlaylistInfo['tracks']>(undefined);
    const [previewOpen, setPreviewOpen] = useState(false);
    const previewClosedByUser = useRef(false);

    const handleSetPreviewOpen = (open: boolean) => {
        if (!open) previewClosedByUser.current = true;
        setPreviewOpen(open);
    };

    const shuffleTracks = useCallback((tracks: PlaylistInfo['tracks']) => {
        if (!tracks?.items) return undefined;
        const shuffled = [...tracks.items].sort(() => Math.random() - 0.5);
        return { ...tracks, items: shuffled as [any] };
    }, []);

    // Recompute track order when playlist changes or randomize is toggled
    useEffect(() => {
        if (!playlistInfo?.tracks?.items) {
            setShuffledTracks(undefined);
            return;
        }
        // Restore saved shuffle order after login redirect
        const savedShuffle = localStorage.getItem("shuffledTracks");
        if (savedShuffle && randomizedChecked) {
            localStorage.removeItem("shuffledTracks");
            setShuffledTracks(JSON.parse(savedShuffle));
            return;
        }
        if (randomizedChecked) {
            setShuffledTracks(shuffleTracks(playlistInfo.tracks));
        } else {
            setShuffledTracks(playlistInfo.tracks);
        }
    }, [playlistInfo, randomizedChecked, shuffleTracks]);

    const reshuffle = useCallback(() => {
        if (playlistInfo?.tracks) {
            setShuffledTracks(shuffleTracks(playlistInfo.tracks));
            if (!previewClosedByUser.current) {
                setPreviewOpen(true);
            }
        }
    }, [playlistInfo, shuffleTracks]);

    useEffect(() => {
        fetchPlaylistInfo(playlistUrl, setPlaylistInfo, setLoadingFailed, setIsLoading);
    }, [playlistUrl, setPlaylistInfo, setLoadingFailed, setIsLoading]);

    useEffect(() => {
        restorePlaylistInfo(location.pathname, setPlaylistInfo, setPlaylistUrl, setLoadingFailed);
    }, [location.pathname, setPlaylistInfo, setPlaylistUrl, setLoadingFailed, setAmountOfEpisodes, setSongToPodcastRatio]);

    useEffect(() => {
        if (location.search.includes("?error")) {
            toast.error("Failed to get your info. Please try again.", {
                id: 'error-getting-info',
            });
            return
        }
    }, [location.search, location.pathname]);

    useEffect(() => {
        if (hasFetched.current || !location.search.includes("code=")) {
            return;
        }

        hasFetched.current = true;
        getToken().then(([token]) => {
            if (token && localStorage.getItem("pendingQueue")) {
                localStorage.removeItem("pendingQueue");
                onClick();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, hasFetched]);

    const onClick = async () => {
        saveSettings(amountOfEpisodes, songToPodcastRatio, randomizedChecked, useMySongs);
        const [token] = await getToken();
        if (!token) {
            if (playlistInfo) {
                savePlaylistInfo(playlistUrl, playlistInfo);
            }
            if (shuffledTracks) {
                localStorage.setItem("shuffledTracks", JSON.stringify(shuffledTracks));
            }
            localStorage.setItem("pendingQueue", "true");
            logInWithSpotify();
            return;
        }

        const playbackState = await GetPlaybackState();
        if (!playbackState) {
            toast.error("No active Spotify device found. Please open Spotify and play something first.");
            return;
        }

        const queueState = await GetSpotifyQueueState();
        if (!queueState) {
            toast.error("Failed to get queue state. Please try again.");
            return;
        }

        const detectedEpisodes = countEpisodesInQueue(queueState);
        if (detectedEpisodes === 0) {
            toast.error("No podcast episodes found in your queue. Please queue up some podcast episodes first.");
            return;
        }

        if (useMySongs) {
            const mySongs = await GetMySongs();
            if (!mySongs) {
                toast.error("Failed to get your songs. Please try again.");
                return;
            }
            const mySongTracks = {
                items: mySongs.items,
                total: mySongs.items?.length,
            } as PlaylistInfo['tracks'];

            await handleAddTracksAndSkip(queueState, mySongTracks, playbackState.is_playing);
            return;
        }

        // Fetch playlist info on-demand if not already loaded (also handles post-login state timing)
        let currentPlaylistInfo = playlistInfo;
        let currentPlaylistUrl = playlistUrl;
        if (!currentPlaylistInfo) {
            const saved = getPlaylistInfo();
            if (saved) {
                currentPlaylistInfo = saved.info;
                currentPlaylistUrl = saved.url;
                setPlaylistInfo(saved.info);
                setPlaylistUrl(saved.url);
            }
        }
        if (!currentPlaylistInfo && currentPlaylistUrl) {
            const playlistId = GetPlaylistIdFromUrl(currentPlaylistUrl);
            currentPlaylistInfo = await GetPlaylistInfo(playlistId);
            if (currentPlaylistInfo) {
                setPlaylistInfo(currentPlaylistInfo);
            }
        }

        if (!currentPlaylistInfo) {
            toast.error("Failed to get playlist info. Please check your playlist URL.");
            return;
        }

        // Use pre-shuffled tracks if available, otherwise use freshly loaded playlist tracks
        const tracksToQueue = shuffledTracks ?? currentPlaylistInfo.tracks;
        await handleAddTracksAndSkip(queueState, tracksToQueue, playbackState.is_playing);
    };

    const handleAddTracksAndSkip = async (queueState: QueueState, tracks: PlaylistInfo['tracks'], wasPlaying: boolean) => {
        if (requestOnGoing.current || isQueuingTunes) {
            console.log("Request is ongoing. Please wait.");
            return;
        }

        requestOnGoing.current = true;
        setIsQueuingTunes(true);
        const idsToAdd = MergeQueueAndPlaylist(queueState, tracks, amountOfEpisodes, songToPodcastRatio);
        if (!idsToAdd || idsToAdd.length === 0) {
            toast.error("No songs to add.");
            setIsQueuingTunes(false);
            requestOnGoing.current = false;
            return;
        }

        const addTracksPromise = addTracksToQueue(idsToAdd);
        toast.promise(addTracksPromise, {
            loading: "Adding songs to queue...",
            success: "Successfully added songs to queue!",
            error: "Failed to add songs to queue.",
        });
        await addTracksPromise;

        // Skip past: currently playing (1) + the podcast episodes already in queue
        // (from Quick Queue) to reach our interleaved tracks.
        const skipsNeeded = amountOfEpisodes + (wasPlaying ? 1 : 0);
        if (skipsNeeded > 0) {
            const skipPromise = skipTracksOnQueue(skipsNeeded);
            toast.promise(skipPromise, {
                loading: "Skipping to interleaved queue...",
                success: "Playing your interleaved queue!",
                error: "Failed to skip to interleaved queue.",
            });
            await skipPromise;
        }

        setIsQueuingTunes(false);
        requestOnGoing.current = false;
    };

    return (
        <div id="column" className="w-full max-w-md min-w-60 text-start bg-emerald-950 border border-green-900 rounded-lg px-10 py-5 shadow-lg">
            <Step1 />
            <Divider />
            <Step2
                playlistUrl={playlistUrl}
                setPlaylistUrl={setPlaylistUrl}
                songToPodcastRatio={songToPodcastRatio}
                setSongToPodcastRatio={setSongToPodcastRatio}
                playlistName={playlistInfo?.name}
                playlistNumberOfSongs={playlistInfo?.tracks?.total}
                playlistSongsApproximate={playlistInfo?.tracks?.totalIsApproximate}
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
                reshuffle={reshuffle}
            />
            {!useMySongs && (
                <QueuePreview
                    tracks={shuffledTracks}
                    amountOfEpisodes={amountOfEpisodes}
                    songToPodcastRatio={songToPodcastRatio}
                    isOpen={previewOpen}
                    setIsOpen={handleSetPreviewOpen}
                />
            )}
            <Divider />
            <Step3
                onClick={onClick}
                disabled={((playlistInfo === undefined && !useMySongs) || isQueuingTunes)}
                isQueuingTunes={isQueuingTunes}
            />
            <p className="text-xs text-emerald-700 text-center mt-4">v{packageJson.version}</p>
        </div>
    );
}