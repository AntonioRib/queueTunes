/**
 * All user-facing copy in one place. Import the key, not the literal.
 * Rules:
 *   - Button labels, headings, empty-state copy, toast messages, error
 *     messages, modal bodies, aria-labels live here.
 *   - Log/dev-only strings, error codes, and test fixtures stay inline.
 *   - Dynamic copy is a function (never string concatenation at the call site).
 *
 * See `docs/style.md` → "User-facing strings".
 */
export const strings = {
    auth: {
        signInFailed: 'Sign-in failed. Check your connection and try again.',
        sessionExpired: 'Session expired, please sign in again.',
    },
    wizard: {
        loginPrompt: 'Log in with Spotify to pick episodes and interleave them with music.',
        loginButton: 'Log in with Spotify',
        replaceWarningToast: 'No active Spotify device. Open Spotify and play something first.',
        pickEpisodeFirst: 'Pick at least one episode first.',
        cooldownToast: 'Hang on — just a moment ago.',
        playFailedToast: "Spotify couldn't start playback. Try again?",
        deviceActivateFailedToast: 'Could not activate that device. Try playing something on Spotify first.',
        retapConfirm: (secondsAgo: number): string =>
            `You just built a queue ${secondsAgo}s ago. Play again?`,
        version: (v: string): string => `v${v}`,
    },
    songs: {
        noSavedSongs: "You don't have any saved songs on Spotify.",
        loadSavedSongsFailed: 'Could not load your saved songs.',
        emptyPlaylist: 'This playlist has no playable tracks.',
        savedShortfall: (available: number, needed: number): string =>
            `Only found ${available} songs, but you asked for ${needed}. Using what we have.`,
        playlistShortfall: (available: number, needed: number): string =>
            `Playlist has ${available} songs, but you'll need ${needed}. Using what we have.`,
        grabbingSavedLabel: 'Grabbing your saved songs…',
        loadingPlaylistLabel: 'Loading playlist…',
        sendingLabel: 'Sending to Spotify…',
    },
    episodePicker: {
        lookbackToday: 'Today',
        lookbackLast3: 'Last 3 days',
        lookbackLast7: 'Last 7 days',
        refreshTitle: 'Refresh episodes',
        selectAll: 'Select all',
        deselectAll: 'Deselect all',
        prompt: 'Pick the episodes you want to hear.',
        fetchFailed: 'Failed to fetch episodes',
        nextWithCount: (count: number): string =>
            `Next → Pick songs (${count} episode${count === 1 ? '' : 's'})`,
        nextEmpty: 'Next → Pick songs',
        relativeDayToday: 'Today',
        relativeDayYesterday: 'Yesterday',
    },
    episodeList: {
        emptyTitle: 'No new episodes',
        emptyBody: (lookbackDays: number): string =>
            lookbackDays === 1
                ? 'Nothing released in the last 24 hours'
                : `Nothing released in the last ${lookbackDays} days`,
        widenTo7: 'Try last 7 days',
    },
    songSource: {
        prompt: 'Which songs should play between episodes?',
        sourceLegend: 'Song source',
        mySongsLabel: 'My songs',
        mySongsHint: 'A random slice of your Saved Tracks',
        playlistLabel: 'Playlist URL',
        playlistPlaceholder: 'https://open.spotify.com/playlist/…',
        loadingPlaylist: 'Loading playlist…',
        invalidUrl: 'That does not look like a Spotify playlist URL.',
        playlistLoadFailed: 'Could not load that playlist. Check the URL and try again.',
        playlistTrackCount: (n: number): string => `${n} songs`,
        fineTune: 'Fine-tune',
        songsPerEpisodeLabel: (n: number): string => `Songs per episode: ${n}`,
        randomizeLabel: 'Randomize song order',
        playlistShortWarning: (available: number, needed: number): string =>
            `This playlist has ${available} songs but you'll need ${needed}. You'll get as many as fit.`,
        playNow: 'Play now',
        backToEpisodes: '← Back to episodes',
    },
    playNowConfirm: {
        title: "Replace what's playing?",
        body: 'This will replace whatever is currently playing on Spotify with your new queue.',
        dontAskAgain: "Don't ask me again",
        cancel: 'Cancel',
        continue: 'Continue',
    },
    building: {
        heading: 'Building your queue…',
        cancel: 'Cancel',
    },
    nowPlaying: {
        heading: '▶ Now playing on Spotify',
        summary: (episodeCount: number, songCount: number): string =>
            `${episodeCount} episode${episodeCount === 1 ? '' : 's'} interleaved with ${songCount} song${songCount === 1 ? '' : 's'}`,
        startOver: 'Start over',
    },
    devicePicker: {
        title: 'No active device',
        refreshTitle: 'Refresh devices',
        prompt: 'Pick a device to play on:',
        troubleshoot: "Don't see your device? Open Spotify on it and play something briefly, then hit refresh.",
        emptyList: 'No devices found yet.',
        cancel: 'Cancel',
    },
} as const;
