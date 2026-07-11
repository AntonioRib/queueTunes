/**
 * Inputs to {@link buildMerge}. `episodes` and `songs` are pre-ordered by
 * the caller — {@link buildMerge} is a pure interleave, not a shuffler.
 * Randomization happens at the call site (see `Wizard.tsx`).
 */
export interface BuildMergeInput {
    episodes: readonly string[];
    songs: readonly string[];
    songsPerEpisode: number;
}

/**
 * Interleave episode URIs with song URIs to produce the merged play
 * sequence the wizard hands to `PUT /v1/me/player/play`.
 *
 * The output has the shape:
 * `[Ep1, S1, S2, Ep2, S3, S4, …, EpN, S(2N-1), S(2N)]`
 *
 * If we run out of songs partway through, remaining episodes are still
 * emitted with as many songs as we have (down to zero). This lets the
 * caller warn but still let the user play what's available.
 *
 * @param input - Episodes, songs, and songs-per-episode.
 * @returns Merged URI list in play order.
 * @throws When `songsPerEpisode` is negative or non-integer.
 * @example
 *   buildMerge({
 *     episodes: ['ep:1', 'ep:2'],
 *     songs: ['s:1', 's:2', 's:3', 's:4'],
 *     songsPerEpisode: 2,
 *   });
 *   // ['ep:1', 's:1', 's:2', 'ep:2', 's:3', 's:4']
 */
export const buildMerge = (input: BuildMergeInput): string[] => {
    const { episodes, songs, songsPerEpisode } = input;
    if (!Number.isInteger(songsPerEpisode) || songsPerEpisode < 0) {
        throw new Error(`buildMerge: songsPerEpisode must be a non-negative integer, got ${songsPerEpisode}`);
    }

    const merged: string[] = [];
    let songIndex = 0;
    for (const episodeUri of episodes) {
        merged.push(episodeUri);
        for (let i = 0; i < songsPerEpisode; i++) {
            if (songIndex >= songs.length) break;
            merged.push(songs[songIndex]);
            songIndex++;
        }
    }
    return merged;
};

/**
 * Fisher-Yates in-place shuffle, seeded off `Math.random()`.
 * Returns the same array reference for chaining but mutates in place.
 *
 * @param arr - Array to shuffle in place.
 * @returns The (now-shuffled) input array.
 */
export const fisherYates = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};
