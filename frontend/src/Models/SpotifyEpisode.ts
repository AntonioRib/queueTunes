/**
 * Shape of a Spotify episode item returned by
 * `GET /v1/shows/{id}/episodes` (and by our backend cache
 * `POST /api/shows/episodes`, which mirrors the same field set).
 */
export interface SpotifyEpisode {
    id: string;
    name: string;
    uri: string;
    release_date: string;
    duration_ms: number;
    images: { url: string; height: number; width: number }[];
    resume_point?: { fully_played: boolean; resume_position_ms: number };
    show?: { id: string; name: string; images: { url: string; height: number; width: number }[] };
}
