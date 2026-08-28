import { LavalinkServerPreset } from '../types/music';

// Default servers set to empty - Users must provide their own server settings
export const PUBLIC_LAVALINK_SERVERS: LavalinkServerPreset[] = [];

const ALL_SERVERS_KEY = 'ichigo_all_lavalink_servers_v2';

export function getStoredLavalinkServers(): LavalinkServerPreset[] {
  try {
    const raw = localStorage.getItem(ALL_SERVERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }
  return [];
}

export function saveCustomLavalinkServer(server: Omit<LavalinkServerPreset, 'id'>): LavalinkServerPreset[] {
  const newServer: LavalinkServerPreset = {
    ...server,
    id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  const current = getStoredLavalinkServers();
  const updated = [...current, newServer];
  localStorage.setItem(ALL_SERVERS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteLavalinkServer(id: string): LavalinkServerPreset[] {
  const current = getStoredLavalinkServers();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(ALL_SERVERS_KEY, JSON.stringify(updated));
  return updated;
}

export function resetLavalinkServers(): LavalinkServerPreset[] {
  localStorage.removeItem(ALL_SERVERS_KEY);
  return [];
}
