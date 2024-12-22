export interface PlaylistInfo {
    name?: string;
    description?: string;
    id?: string;
    uri?: string;
    type?: string;
    tracks?: {
        total?: number;
        items?: [TrackInfo];
    };
    followers?: {
        total?: number;
    };
    owner?: {
        display_name?: string;
    };
}

export interface TrackInfo {
    added_at?: string;
    track?: {
        name?: string;
        uri?: string;
        artists?: [ArtistInfo];
        album?: {
            name?: string;
        };
    };
}

export interface ArtistInfo {
    name?: string;
    uri?: string;
}