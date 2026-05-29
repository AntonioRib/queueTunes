import { SpotifyEpisode } from '../Services/GetShowEpisodes';

export interface EpisodeWithShow extends SpotifyEpisode {
    showName: string;
    showImages: { url: string; height: number; width: number }[];
}

export type LookbackDays = 1 | 3 | 7;
