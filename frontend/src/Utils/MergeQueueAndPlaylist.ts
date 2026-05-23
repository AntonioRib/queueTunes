import { PlaylistInfo } from "../Models/PlaylistInfo";
import { QueueState } from "../Models/QueueState";
import { TrackToAdd } from "../Models/TrackToAdd";

export const countEpisodesInQueue = (queue: QueueState): number => {
    if (!queue?.queue) return 0;
    const allItems = [queue.currently_playing, ...queue.queue];
    return allItems.filter(item => item?.type === 'episode').length;
};

export const MergeQueueAndPlaylist = (queue: QueueState, tracks: PlaylistInfo['tracks'], amountOfEpisodes: number, songsPerEpisode: number) => {
    if (!queue || !tracks || !tracks.items || !queue.queue) {
        return undefined;
    }

    const playlistTracks = tracks.items;
    const queueCurrentlyPlaying = queue.currently_playing;

    // Filter queue to only include episodes (podcasts), ignoring any tracks/songs
    const queueEpisodes = [queueCurrentlyPlaying, ...queue.queue].filter(
        item => item?.type === 'episode'
    );

    // Build the interleaved queue: [Ep1, Song1, Song2, Ep2, Song3, Song4, ...]
    const urisToQueue: TrackToAdd[] = [];
    let songIndex = 0;

    for (let ep = 0; ep < amountOfEpisodes; ep++) {
        // Add the episode
        const episode = queueEpisodes[ep];
        if (episode?.name && episode?.uri) {
            urisToQueue.push({ name: episode.name, uri: episode.uri });
        }

        // Add N songs after it
        for (let s = 0; s < songsPerEpisode; s++) {
            const track = playlistTracks[songIndex]?.track;
            if (track?.name && track?.uri) {
                urisToQueue.push({ name: track.name, uri: track.uri });
            }
            songIndex++;
        }
    }

    return urisToQueue;
}