import { SpotifyEpisode } from './SpotifyEpisode';

/**
 * A Spotify episode augmented with its parent show's display name and
 * artwork. The wizard builds these when merging `GET /v1/me/shows` with
 * the per-show episode fetches so the picker can render show art next
 * to each episode without a second lookup.
 */
export interface EpisodeWithShow extends SpotifyEpisode {
    showName: string;
    showImages: { url: string; height: number; width: number }[];
}

/**
 * Lookback window (in days) for Step 1 of the wizard.
 * Persisted in localStorage under `wizard_lookback_days`.
 */
export type LookbackDays = 1 | 3 | 7;
