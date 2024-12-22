export interface QueueState {
    currently_playing?: QueueItem;
    queue?: QueueItem[];
}

export interface QueueItem {
    description?: string;
    id?: string;
    is_playable?: boolean;
    name?: string;
    type?: string;
    show?: {
        name?: string;
        id?: string;
        publisher?: string;
        description?: string;
    }
    uri?: string;
}