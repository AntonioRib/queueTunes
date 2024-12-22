import { PlaylistInfo } from "../Models/PlaylistInfo";

export const savePlaylistInfo = async (url: string, playlistInfo: PlaylistInfo) => {
    const infoToSave = {
        url: url,
        info: playlistInfo
    };
    localStorage.setItem("playlistInfo", JSON.stringify(infoToSave));
};