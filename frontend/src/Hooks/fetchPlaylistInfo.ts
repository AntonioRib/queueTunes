import { PlaylistInfo } from "../Models/PlaylistInfo";
import { GetPlaylistInfo } from "../Services/GetPlaylistInfo";
import { GetPlaylistIdFromUrl } from "../Utils/GetPlaylistIdFromUrl";
import { ValidatePlaylistUrl } from "../Utils/ValidatePlaylistUrl";
import { savePlaylistInfo } from "./savePlaylistInfo";

export const fetchPlaylistInfo = async (url: string,
    setPlaylistInfo: (value: React.SetStateAction<PlaylistInfo | undefined>) => void,
    setLoadingFailed: (value: React.SetStateAction<boolean>) => void,
    setIsLoading: (value: React.SetStateAction<boolean>) => void) => {
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
        setIsLoading(true);
        const info = await GetPlaylistInfo(playlistId);
        setIsLoading(false);
        if (!info) {
            setLoadingFailed(true);
            return;
        }
        setPlaylistInfo(info);
        savePlaylistInfo(url, info);
        setLoadingFailed(false);
    } catch (error) {
        console.error("Failed to fetch playlist info:", error);
        setIsLoading(false);
        setLoadingFailed(true);
    }
};