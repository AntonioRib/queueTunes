import { PlaylistInfo } from "../Models/PlaylistInfo";
import { GetPlaylistInfo } from "../Services/GetPlaylistInfo";
import { GetPlaylistIdFromUrl } from "../Utils/GetPlaylistIdFromUrl";
import { ValidatePlaylistUrl } from "../Utils/ValidatePlaylistUrl";

export const fetchPlaylistInfo = async (url: string, setPlaylistInfo: (value: React.SetStateAction<PlaylistInfo | undefined>) => void, setLoadingFailed: (value: React.SetStateAction<boolean>) => void) => {
    if (url === "") {
        setPlaylistInfo(undefined);
        return;
    }

    console.log("Playlist URL:", url);
    if (!ValidatePlaylistUrl(url)) {
        console.log("Invalid Playlist URL");
        setPlaylistInfo(undefined);
        return;
    }

    const playlistId = GetPlaylistIdFromUrl(url);
    try {
        const info = await GetPlaylistInfo(playlistId);
        if (!info) {
            setLoadingFailed(true);
            return;
        }
        setPlaylistInfo(info);
        setLoadingFailed(false);
    } catch (error) {
        console.error("Failed to fetch playlist info:", error);
        setLoadingFailed(true);
    }
};