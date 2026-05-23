import { PlaylistInfo } from "../Models/PlaylistInfo";
import { getPlaylistInfo } from "./getPlaylistInfo";

export const restorePlaylistInfo = async (currentUrl: string,
    setPlaylistInfo: (value: React.SetStateAction<PlaylistInfo | undefined>) => void,
    setPlaylistUrl: (value: React.SetStateAction<string>) => void,
    setLoadingFailed: (value: React.SetStateAction<boolean>) => void) => {
    const playlistInfo = getPlaylistInfo();
    if (!playlistInfo) {
        return;
    }

    setPlaylistInfo(playlistInfo.info);
    setPlaylistUrl(playlistInfo.url);
    setLoadingFailed(false);
}