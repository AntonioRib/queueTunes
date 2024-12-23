export const saveSettings = async (numberOfEpisodes: number, podcastRatio: number, randomizeTracks: boolean) => {
    const infoToSave = {
        number_episodes: numberOfEpisodes,
        podcast_ratio: podcastRatio,
        randomize_tracks: randomizeTracks
    };
    localStorage.setItem("settings", JSON.stringify(infoToSave));
};