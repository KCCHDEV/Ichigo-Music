import { Track } from '../types/music';
import { customFetch } from './http';
import { logger } from './logger';

export interface LyricLine {
  time: number; // timestamp in seconds
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  plainText?: string;
  source?: string;
}

interface ParsedTrackInfo {
  title: string;
  artist: string;
}

/**
 * Parses raw YouTube titles and authors into possible (Title, Artist) combinations for Thai & International songs.
 * Example: "Room39 - หน่วง [Official MV]" -> Title: "หน่วง", Artist: "Room39"
 */
function parseTrackOptions(rawTitle: string, rawAuthor: string): ParsedTrackInfo[] {
  const options: ParsedTrackInfo[] = [];

  // Clean tags like (Official Video), [MV], 「MV」, 【Audio】, etc.
  const cleanedTitle = rawTitle
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .replace(/「.*?」/g, '')
    .replace(/【.*?】/g, '')
    .replace(/\b(official|music|video|audio|lyric|lyrics|hd|4k|mv|ft|feat|remix|cover)\b/gi, '')
    .trim();

  const knownLabels = ['gmm grammy', 'spicydisc', 'genie records', 'genierock', 'rsiam', 'whattheduck', 'smallroom', 'rs', 'gmm', 'official', 'channel'];
  let cleanedAuthor = rawAuthor.trim();
  knownLabels.forEach(label => {
    cleanedAuthor = cleanedAuthor.replace(new RegExp(label, 'gi'), '').trim();
  });

  // If title contains "Artist - Song" or "Song - Artist"
  if (cleanedTitle.includes('-')) {
    const parts = cleanedTitle.split('-').map(p => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      options.push({ title: parts[1], artist: parts[0] });
      options.push({ title: parts[0], artist: parts[1] });
    }
  }

  // Also include direct title & author
  options.push({ title: cleanedTitle, artist: cleanedAuthor });
  options.push({ title: cleanedTitle, artist: '' });

  return options;
}

/**
 * Parses LRC format strings like "[00:15.30] Line of lyrics" into structured LyricLine items.
 */
export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  const rawLines = lrc.split('\n');
  for (const raw of rawLines) {
    const match = raw.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const timeInSec = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();

      if (text) {
        lines.push({ time: timeInSec, text });
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Fetches synchronized or plain lyrics from LRCLIB free lyrics API with smart Thai title parsing.
 */
export async function fetchLyrics(track: Track): Promise<LyricsData | null> {
  const options = parseTrackOptions(track.title, track.author);
  logger.addLog('info', 'System', `Searching lyrics for: "${track.title}" (${track.author})`, { candidatesCount: options.length });

  // Phase 1: Try exact GET endpoints for all candidates
  for (const { title, artist } of options) {
    if (!title) continue;
    try {
      let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}`;
      if (artist) {
        url += `&artist_name=${encodeURIComponent(artist)}`;
      }

      const res = await customFetch(url, { headers: { 'User-Agent': 'IchigoMusic/0.1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const parsed = parseLRC(data.syncedLyrics);
          if (parsed.length > 0) {
            logger.addLog('success', 'System', `Found exact synced lyrics for "${title}" by "${artist || 'Unknown'}"`);
            return { synced: true, lines: parsed, source: 'LRCLIB (Synced)' };
          }
        }

        if (data.plainLyrics) {
          const plainLines: LyricLine[] = data.plainLyrics
            .split('\n')
            .map((t: string) => t.trim())
            .filter(Boolean)
            .map((text: string, idx: number) => ({ time: idx * 4, text }));

          return { synced: false, lines: plainLines, plainText: data.plainLyrics, source: 'LRCLIB (Plain)' };
        }
      }
    } catch {
      // Continue to next candidate option
    }
  }

  // Phase 2: Try Search API with combined queries (Works great for Thai songs like "หน่วง Room39", "ไม่เคย 25hours")
  const searchQueries = options.map(o => `${o.title} ${o.artist}`.trim()).filter(Boolean);
  const uniqueQueries = Array.from(new Set(searchQueries));

  for (const q of uniqueQueries) {
    try {
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
      const res = await customFetch(searchUrl, { headers: { 'User-Agent': 'IchigoMusic/0.1.0' } });

      if (res.ok) {
        const searchData = await res.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          const item = searchData.find((d: any) => d.syncedLyrics) || searchData[0];
          if (item.syncedLyrics) {
            const parsed = parseLRC(item.syncedLyrics);
            if (parsed.length > 0) {
              logger.addLog('success', 'System', `Found synced lyrics via search for "${q}"`);
              return { synced: true, lines: parsed, source: 'LRCLIB Search (Synced)' };
            }
          }
          if (item.plainLyrics) {
            const plainLines: LyricLine[] = item.plainLyrics
              .split('\n')
              .map((t: string) => t.trim())
              .filter(Boolean)
              .map((text: string, idx: number) => ({ time: idx * 4, text }));

            return { synced: false, lines: plainLines, plainText: item.plainLyrics, source: 'LRCLIB Search (Plain)' };
          }
        }
      }
    } catch {
      // Continue searching
    }
  }

  logger.addLog('warn', 'System', `No lyrics found for: "${track.title}"`);
  return null;
}
