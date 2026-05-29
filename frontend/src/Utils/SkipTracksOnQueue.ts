import { SkipToNext } from "../Services/SkipToNext";

export const skipTracksOnQueue = async (amount: number) => {
    for (let i = 0; i < amount; i++) {
        console.log("Skipping to next track");
        await SkipToNext();
        // Small delay to let Spotify update its state between skips
        if (i < amount - 1) {
            await new Promise(r => setTimeout(r, 300));
        }
    }
};