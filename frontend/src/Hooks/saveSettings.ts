export const saveSettings = async (numberOfEpisodes: number, podcastRatio: number) => {
    const infoToSave = {
        number_episodes: numberOfEpisodes,
        podcast_ratio: podcastRatio
    };
    localStorage.setItem("settings", JSON.stringify(infoToSave));
};