import { PlaylistInfo } from "../Models/PlaylistInfo";
import { QueueState } from "../Models/QueueState";
import { TrackToAdd } from "../Models/TrackToAdd";

export const MergeQueueAndPlaylist = (queue: QueueState, playlist: PlaylistInfo, amountOfEpisodes: number, songsPerEpisode: number) => {
    if (!queue || !playlist || !playlist.tracks || !playlist.tracks.items || !queue.queue) {
        return undefined;
    }

    const urisToQueue: TrackToAdd[] = [];
    const playlistTracks = playlist.tracks.items;
    const queueCurrentlyPlaying = queue.currently_playing;
    const queueTracks = [queueCurrentlyPlaying, ...queue.queue];
    for (let epidosesCount = 0; epidosesCount < amountOfEpisodes; epidosesCount++) {
        const queueTrack = queueTracks[epidosesCount];
        if (queueTrack && queueTrack.name && queueTrack.uri) {
            urisToQueue.push({ name: queueTrack.name, uri: queueTrack.uri });
        }
    }

    const songsToAdd = songsPerEpisode * amountOfEpisodes;
    let insertionIndex = 1;

    for (let trackCount = 0; trackCount < songsToAdd; trackCount++) {
        const trackToAdd = playlistTracks[trackCount]?.track;
        if (trackToAdd?.name && trackToAdd?.uri) {
            urisToQueue.splice(insertionIndex, 0, { name: trackToAdd.name, uri: trackToAdd.uri });
            insertionIndex++;
        }

        if ((trackCount + 1) % songsPerEpisode === 0) {
            insertionIndex++;
        }
    }
    return urisToQueue;
}