export const saveSettings = async (numberOfEpisodes: number, podcastRatio: number, randomizeTracks: boolean, useMySongs: string) => {
    const infoToSave = {
        number_episodes: numberOfEpisodes,
        podcast_ratio: podcastRatio,
        randomize_tracks: randomizeTracks,
        useMySongs: useMySongs,
    };
    localStorage.setItem("settings", JSON.stringify(infoToSave));
};