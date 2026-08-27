import { LavalinkServerPreset } from '../types/music';

export const PUBLIC_LAVALINK_SERVERS: LavalinkServerPreset[] = [
  {
    id: 'millohost-my',
    name: 'MilloHost v4 Node',
    location: 'Malaysia (SEA Region)',
    description: 'High-speed public node in Southeast Asia',
    host: 'lava-v4.millohost.my.id',
    port: 443,
    password: 'https://discord.gg/mjS5J2K3ep',
    secure: true,
  },
  {
    id: 'serenetia-us',
    name: 'Serenetia Public Node',
    location: 'United States (US East)',
    description: 'Stable US Lavalink v4 public node',
    host: 'lavalink.serenetia.com',
    port: 443,
    password: 'youshallnotpass',
    secure: true,
  },
  {
    id: 'serenetia-v4-us',
    name: 'Serenetia v4 Node',
    location: 'United States (US West)',
    description: 'Official Serenetia v4 high capacity server',
    host: 'lavalinkv4.serenetia.com',
    port: 443,
    password: 'https://seretia.link/discord',
    secure: true,
  },
  {
    id: 'local-server',
    name: 'Local Lavalink Server',
    location: 'Localhost (PC/Mac)',
    description: 'Localhost server on your local machine',
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
    secure: false,
  },
];

const ALL_SERVERS_KEY = 'ichigo_all_lavalink_servers_v2';

export function getStoredLavalinkServers(): LavalinkServerPreset[] {
  try {
    const raw = localStorage.getItem(ALL_SERVERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }
  return PUBLIC_LAVALINK_SERVERS;
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
  localStorage.setItem(ALL_SERVERS_KEY, JSON.stringify(PUBLIC_LAVALINK_SERVERS));
  return PUBLIC_LAVALINK_SERVERS;
}
