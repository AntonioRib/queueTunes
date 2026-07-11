import { buildMerge, fisherYates } from './buildMerge';

describe('buildMerge', () => {
    it('interleaves N episodes with K songs each in exact order', () => {
        const out = buildMerge({
            episodes: ['ep1', 'ep2', 'ep3'],
            songs: ['s1', 's2', 's3', 's4', 's5', 's6'],
            songsPerEpisode: 2,
        });
        expect(out).toEqual(['ep1', 's1', 's2', 'ep2', 's3', 's4', 'ep3', 's5', 's6']);
        expect(out).toHaveLength(3 + 3 * 2);
    });

    it('truncates trailing songs when the pool is exhausted (does not cycle)', () => {
        const out = buildMerge({
            episodes: ['ep1', 'ep2', 'ep3'],
            songs: ['s1', 's2', 's3'],
            songsPerEpisode: 2,
        });
        // ep1 consumes s1,s2; ep2 consumes s3; ep3 gets nothing.
        expect(out).toEqual(['ep1', 's1', 's2', 'ep2', 's3', 'ep3']);
    });

    it('returns [] when episodes are empty', () => {
        expect(buildMerge({ episodes: [], songs: ['s1'], songsPerEpisode: 3 })).toEqual([]);
    });

    it('returns just episodes when songsPerEpisode is 0', () => {
        expect(
            buildMerge({ episodes: ['ep1', 'ep2'], songs: ['s1', 's2'], songsPerEpisode: 0 }),
        ).toEqual(['ep1', 'ep2']);
    });

    it('returns just episodes when songs pool is empty', () => {
        expect(
            buildMerge({ episodes: ['ep1', 'ep2'], songs: [], songsPerEpisode: 5 }),
        ).toEqual(['ep1', 'ep2']);
    });

    it('throws on negative songsPerEpisode', () => {
        expect(() =>
            buildMerge({ episodes: ['ep1'], songs: [], songsPerEpisode: -1 }),
        ).toThrow(/non-negative integer/);
    });

    it('throws on non-integer songsPerEpisode', () => {
        expect(() =>
            buildMerge({ episodes: ['ep1'], songs: [], songsPerEpisode: 1.5 }),
        ).toThrow(/non-negative integer/);
    });
});

describe('fisherYates', () => {
    it('produces a permutation of the input (same length, same set)', () => {
        const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const copy = [...input];
        const out = fisherYates(copy);
        expect(out).toBe(copy); // same reference (in-place)
        expect(out).toHaveLength(input.length);
        expect([...out].sort()).toEqual([...input].sort());
    });

    it('is a no-op on empty arrays', () => {
        expect(fisherYates([])).toEqual([]);
    });

    it('is a no-op on single-element arrays', () => {
        expect(fisherYates(['x'])).toEqual(['x']);
    });
});
