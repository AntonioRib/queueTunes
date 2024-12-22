import { TrackToAdd } from "../Models/TrackToAdd";
import { AddToSpotifyQueue } from "../Services/AddToSpotifyQueue";

export const addTracksToQueue = async (tracks: TrackToAdd[]) => {
    for (const track of tracks) {
        if (!track.uri) {
            console.error("Invalid track:", track);
            continue;
        }

        await AddToSpotifyQueue(track.uri);
        console.log(`Added track with name: ${track.name} ID: ${track.uri}`);
    }
};
