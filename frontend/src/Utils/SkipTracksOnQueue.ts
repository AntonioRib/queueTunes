import { SkipToNext } from "../Services/SkipToNext";

export const skipTracksOnQueue = (amount: number) => {
    const promises = [];
    for (let i = 0; i < amount; i++) {
        console.log("Skipping to next track");
        promises.push(SkipToNext());
    }
    return Promise.all(promises);
};