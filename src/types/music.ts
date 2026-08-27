export interface Track {
  identifier: string;
  isSeekable: boolean;
  author: string;
  length: number; // milliseconds
  isStream: boolean;
  position: number;
  title: string;
  uri?: string;
  artworkUrl?: string;
  isrc?: string;
  sourceName?: string;
  encoded?: string; // Lavalink encoded track string
}

export interface LavalinkTrackItem {
  encoded: string;
  info: Track;
  pluginInfo?: Record<string, any>;
  userData?: Record<string, any>;
}

export interface LavalinkSearchResult {
  loadType: 'track' | 'playlist' | 'search' | 'empty' | 'error';
  data: LavalinkTrackItem[] | { info: { name: string }; tracks: LavalinkTrackItem[] } | any;
}

export interface HistoryItem {
  id: string;
  track: Track;
  playedAt: number; // Unix timestamp
  playCount: number;
}

export interface LavalinkConfig {
  host: string;
  port: number;
  password: string;
  secure: boolean;
  name?: string;
}

export interface LavalinkServerPreset extends LavalinkConfig {
  id: string;
  name: string;
  location: string;
  description: string;
}
