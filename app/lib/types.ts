export interface Channel {
  id: string;
  title: string;
  thumbnail?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string; // ISO 8601 string
  duration?: string; // ISO 8601 duration (e.g., PT5M30S)
  viewCount?: string;
  channelId: string;
}

export interface Category {
  id: string;
  name: string;
  channelIds: string[];
}

export type WatchlistStatus = 'unwatched' | 'watching' | 'completed';

export interface WatchlistVideo extends Video {
  addedAt: string; // ISO 8601 string
  status: WatchlistStatus;
  notes?: string;
}

export interface UserInterests {
  channels: Channel[];
  categories: Category[];
  watchlist?: WatchlistVideo[];
}

