/**
 * Minimal shape of a Spotify track (`spotify:track:...`) as returned by
 * `GET /v1/me/tracks` and the playlist proxy `GET /api/playlist/:id`.
 *
 * Only the fields the wizard needs are declared. Spotify includes many more.
 */
export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    artists: { name: string; uri?: string }[];
    album?: {
        name?: string;
        images?: { url: string; height?: number; width?: number }[];
    };
}

/**
 * Envelope returned by `GET /v1/me/tracks`. Each `items[i].track` is a
 * `SpotifyTrack`; `total` is the user's total number of saved tracks.
 */
export interface SavedTracksResponse {
    href?: string;
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
    items: { added_at: string; track: SpotifyTrack }[];
}
