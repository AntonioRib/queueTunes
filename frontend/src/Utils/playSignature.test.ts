import { LAST_PLAY_KEY, readLastPlay, writeLastPlay } from './playSignature';

describe('playSignature', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('readLastPlay', () => {
        it('returns null when the key is missing', () => {
            expect(readLastPlay()).toBeNull();
        });

        it('returns null when the stored payload is malformed JSON', () => {
            localStorage.setItem(LAST_PLAY_KEY, '{not json');
            expect(readLastPlay()).toBeNull();
        });

        it('returns null when the payload is JSON but missing `at`', () => {
            localStorage.setItem(LAST_PLAY_KEY, JSON.stringify({ foo: 'bar' }));
            expect(readLastPlay()).toBeNull();
        });

        it('returns null when `at` is not a number', () => {
            localStorage.setItem(LAST_PLAY_KEY, JSON.stringify({ at: 'yesterday' }));
            expect(readLastPlay()).toBeNull();
        });

        it('returns the marker when `at` is a number', () => {
            localStorage.setItem(LAST_PLAY_KEY, JSON.stringify({ at: 1234 }));
            expect(readLastPlay()).toEqual({ at: 1234 });
        });
    });

    describe('writeLastPlay -> readLastPlay round-trip', () => {
        it('persists an { at } marker', () => {
            const now = Date.now();
            writeLastPlay(now);
            expect(readLastPlay()).toEqual({ at: now });
        });
    });
});
