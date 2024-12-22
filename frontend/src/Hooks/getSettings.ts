export const getSettings = (currentUrl: string): {
    number_episodes: number,
    podcast_ratio: number
} | null => {
    if (!currentUrl.includes("/queue")) {
        return null;
    }

    if (!localStorage.getItem("settings")) {
        return null;
    }

    const settings = JSON.parse(localStorage.getItem("settings") || "");
    return settings as {
        number_episodes: number,
        podcast_ratio: number
    };
};