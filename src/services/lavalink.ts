import { LavalinkConfig, LavalinkSearchResult, LavalinkTrackItem, Track } from '../types/music';
import { customFetch } from './http';
import { logger } from './logger';

const DEFAULT_CONFIG: LavalinkConfig = {
  host: '',
  port: 2333,
  password: '',
  secure: false,
};

const CONFIG_KEY = 'music_app_lavalink_config';

export function getLavalinkConfig(): LavalinkConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveLavalinkConfig(config: LavalinkConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export class LavalinkService {
  private config: LavalinkConfig;
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  private onStatusChangeCallbacks: Array<(connected: boolean) => void> = [];

  constructor() {
    this.config = getLavalinkConfig();
  }

  public updateConfig(newConfig: LavalinkConfig) {
    this.config = newConfig;
    saveLavalinkConfig(newConfig);
    this.reconnect();
  }

  public getConfig(): LavalinkConfig {
    return this.config;
  }

  public onStatusChange(cb: (connected: boolean) => void) {
    this.onStatusChangeCallbacks.push(cb);
    cb(this.isConnected);
  }

  private notifyStatus(status: boolean) {
    this.isConnected = status;
    this.onStatusChangeCallbacks.forEach(cb => cb(status));
  }

  public async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    if (!this.config.host) {
      return { success: false, message: 'ยังไม่ได้ระบุ Host ของ Lavalink Server (กรุณาเพิ่มเซิร์ฟเวอร์ในตั้งค่า)' };
    }
    const protocol = this.config.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${this.config.host}:${this.config.port}`;
    logger.addLog('info', 'Lavalink', `Testing connection to ${baseUrl}...`);
    try {
      const response = await customFetch(`${baseUrl}/version`, {
        headers: {
          'Authorization': this.config.password,
        },
      });
      if (response.ok) {
        const version = await response.text();
        logger.addLog('success', 'Lavalink', `Connected successfully to ${baseUrl} (v${version.trim()})`);
        return { success: true, message: `Connected to Lavalink v${version}`, version };
      } else {
        logger.addLog('error', 'Lavalink', `HTTP error ${response.status} from ${baseUrl}`);
        return { success: false, message: `HTTP Error ${response.status}: ${response.statusText}` };
      }
    } catch (err: any) {
      logger.addLog('error', 'Lavalink', `Failed to connect to ${baseUrl}: ${err.message}`);
      return { success: false, message: err.message || 'Failed to connect to Lavalink server' };
    }
  }

  public async search(query: string, source: 'ytsearch' | 'ytmsearch' | 'scsearch' = 'ytsearch'): Promise<Track[]> {
    if (!this.config.host) {
      logger.addLog('warn', 'Lavalink', 'Cannot search: Lavalink server host is not configured');
      return [];
    }
    const protocol = this.config.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${this.config.host}:${this.config.port}`;

    let identifier = query;
    if (!query.startsWith('http://') && !query.startsWith('https://')) {
      identifier = `${source}:${query}`;
    }

    logger.addLog('info', 'Lavalink', `Searching query: "${query}" (identifier: ${identifier})`);

    try {
      const res = await customFetch(`${baseUrl}/v4/loadtracks?identifier=${encodeURIComponent(identifier)}`, {
        headers: {
          'Authorization': this.config.password,
        },
      });

      if (!res.ok) {
        throw new Error(`Lavalink HTTP error ${res.status}`);
      }

      const result: LavalinkSearchResult = await res.json();
      const tracks = this.parseTracks(result);
      logger.addLog('success', 'Lavalink', `Found ${tracks.length} tracks for "${query}"`, { loadType: result.loadType });
      return tracks;
    } catch (error: any) {
      logger.addLog('warn', 'Lavalink', `Lavalink search failed: ${error.message}. Using fallback suggest search.`);
      return this.fallbackSearch(query);
    }
  }

  private parseTracks(result: any): Track[] {
    let rawItems: LavalinkTrackItem[] = [];

    if (result.loadType === 'track' && result.data) {
      rawItems = [result.data];
    } else if (result.loadType === 'search' && Array.isArray(result.data)) {
      rawItems = result.data;
    } else if (result.loadType === 'playlist' && result.data && Array.isArray(result.data.tracks)) {
      rawItems = result.data.tracks;
    }

    return rawItems.map(item => {
      const info = item.info;
      let artworkUrl = info.artworkUrl;

      // Generate artwork if missing and identifier looks like YouTube video ID
      if (!artworkUrl && info.identifier) {
        artworkUrl = `https://i.ytimg.com/vi/${info.identifier}/hqdefault.jpg`;
      }

      return {
        identifier: info.identifier || '',
        isSeekable: info.isSeekable ?? true,
        author: info.author || 'Unknown Artist',
        length: info.length || 0,
        isStream: info.isStream || false,
        position: info.position || 0,
        title: info.title || 'Unknown Track',
        uri: info.uri,
        artworkUrl: artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        isrc: info.isrc,
        sourceName: info.sourceName || 'youtube',
        encoded: item.encoded,
      };
    });
  }

  // Fallback demo search if Lavalink server is not yet online or responding
  private async fallbackSearch(query: string): Promise<Track[]> {
    try {
      const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const suggestions: string[] = data[1] || [];

      return suggestions.slice(0, 10).map((item, idx) => ({
        identifier: `demo-${idx}-${Date.now()}`,
        isSeekable: true,
        author: 'YouTube Artist',
        length: 210000,
        isStream: false,
        position: 0,
        title: item,
        artworkUrl: `https://picsum.photos/seed/${encodeURIComponent(item)}/300/300`,
        sourceName: 'youtube',
        uri: `https://www.youtube.com/results?search_query=${encodeURIComponent(item)}`
      }));
    } catch {
      return [];
    }
  }

  public connectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    const wsProtocol = this.config.secure ? 'wss' : 'ws';
    const url = `${wsProtocol}://${this.config.host}:${this.config.port}/v4/websocket`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.notifyStatus(true);
      };

      this.ws.onclose = () => {
        this.notifyStatus(false);
      };

      this.ws.onerror = () => {
        this.notifyStatus(false);
      };
    } catch (e) {
      this.notifyStatus(false);
    }
  }

  public reconnect() {
    this.connectWebSocket();
  }
}

export const lavalinkService = new LavalinkService();
