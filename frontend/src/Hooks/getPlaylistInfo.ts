import { PlaylistInfo } from "../Models/PlaylistInfo";

export const getPlaylistInfo = () => {
    const playlistInfo = localStorage.getItem("playlistInfo");
    if (!playlistInfo) {
        return null;
    }

    return JSON.parse(playlistInfo) as { url: string, info: PlaylistInfo };
};