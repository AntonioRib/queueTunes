export function ValidatePlaylistUrl(spotifyUrl: string): boolean {
    //Playlist Link format
    //https://open.spotify.com/playlist/3dQKMAv02EBqx13fpwiskk?si=319614c6178642dd
    if (spotifyUrl === "") {
        return false;
    }
    const splitUrl = spotifyUrl.split("/");
    if (splitUrl.length < 5) {
        return false;
    }

    if (splitUrl[2] !== "open.spotify.com" || splitUrl[3] !== "playlist") {
        return false;
    }

    return true;
}