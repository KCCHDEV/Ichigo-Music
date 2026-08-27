import { LavalinkServerPreset } from '../types/music';
import { customFetch } from './http';
import { logger } from './logger';

export interface LavalinkDeepStats {
  players: number;
  playingPlayers: number;
  uptime: number; // in ms
  memory: {
    free: number;
    used: number;
    allocated: number;
    reservable: number;
  };
  cpu: {
    cores: number;
    systemLoad: number;
    lavalinkLoad: number;
  };
  frameStats?: {
    sent: number;
    nulled: number;
    deficit: number;
  };
  version?: string;
  latency?: number;
}

/**
 * Formats bytes into human readable MB / GB string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  return `${megabytes.toFixed(1)} MB`;
}

/**
 * Formats uptime milliseconds into Days, Hours, Minutes, Seconds
 */
export function formatUptime(ms: number): string {
  if (!ms || ms <= 0) return '0s';
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

/**
 * Fetches detailed deep server statistics and version from Lavalink v4 REST API
 */
export async function fetchDeepServerStats(server: LavalinkServerPreset): Promise<LavalinkDeepStats | null> {
  const protocol = server.secure ? 'https' : 'http';
  const baseUrl = `${protocol}://${server.host}:${server.port}`;
  const start = Date.now();

  logger.addLog('info', 'Lavalink', `Fetching deep stats for server: ${server.name} (${baseUrl})`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Fetch /v4/stats
    const statsRes = await customFetch(`${baseUrl}/v4/stats`, {
      headers: { 'Authorization': server.password },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - start;

    if (!statsRes.ok) {
      throw new Error(`HTTP Error ${statsRes.status}`);
    }

    const statsData = await statsRes.json();

    // Fetch /version
    let versionStr = 'v4.x';
    try {
      const verRes = await customFetch(`${baseUrl}/version`, {
        headers: { 'Authorization': server.password },
      });
      if (verRes.ok) {
        versionStr = (await verRes.text()).trim();
      }
    } catch {
      // Use fallback version
    }

    const deepStats: LavalinkDeepStats = {
      players: statsData.players || 0,
      playingPlayers: statsData.playingPlayers || 0,
      uptime: statsData.uptime || 0,
      memory: {
        free: statsData.memory?.free || 0,
        used: statsData.memory?.used || 0,
        allocated: statsData.memory?.allocated || 0,
        reservable: statsData.memory?.reservable || 0,
      },
      cpu: {
        cores: statsData.cpu?.cores || 1,
        systemLoad: statsData.cpu?.systemLoad || 0,
        lavalinkLoad: statsData.cpu?.lavalinkLoad || 0,
      },
      frameStats: statsData.frameStats ? {
        sent: statsData.frameStats.sent || 0,
        nulled: statsData.frameStats.nulled || 0,
        deficit: statsData.frameStats.deficit || 0,
      } : undefined,
      version: versionStr,
      latency,
    };

    logger.addLog('success', 'Lavalink', `Fetched deep stats for ${server.name}: ${deepStats.playingPlayers}/${deepStats.players} active players`);
    return deepStats;
  } catch (err: any) {
    logger.addLog('warn', 'Lavalink', `Failed to fetch deep stats for ${server.name}: ${err.message}`);
    return null;
  }
}
