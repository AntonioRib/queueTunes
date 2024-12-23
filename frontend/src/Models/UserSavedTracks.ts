import { TrackInfo } from "./PlaylistInfo";

export interface UserSavedTracks {
    href?: string;
    limit?: number;
    next?: string;
    offset?: number;
    previous?: string;
    total?: number;
    items?: [TrackInfo];
}