export const GetPlaylistIdFromUrl = (spotifyUrl: string): string => {
    //Playlist Link format
    //https://open.spotify.com/playlist/3dQKMAv02EBqx13fpwiskk?si=319614c6178642dd
    const splitUrl = spotifyUrl.split("/");
    const playlistIdPlusParams = splitUrl[splitUrl.length - 1];
    const playlistId = playlistIdPlusParams.split("?")[0];
    return playlistId;
}