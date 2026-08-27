import { Track } from '../types/music';
import { lavalinkService } from './lavalink';
import { logger } from './logger';

/**
 * Cleans song titles/authors by removing common suffixes like (Official Video), [MV], ft., etc.
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Remove (...) [...] {...}
    .replace(/\b(official|music|video|audio|lyric|lyrics|hd|4k|mv|ft|feat|remix|cover)\b/gi, '')
    .replace(/[^\w\s\u0E00-\u0E7F]/gi, ' ') // Keep alphanumeric & Thai characters
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two song titles are virtually identical to prevent duplicates/remixes of the same track.
 */
function isTitleSimilar(titleA: string, titleB: string): boolean {
  const cleanA = cleanText(titleA);
  const cleanB = cleanText(titleB);
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
    const diffLen = Math.abs(cleanA.length - cleanB.length);
    if (diffLen < 6) return true;
  }

  // Token similarity
  const tokensA = new Set(cleanA.split(' ').filter(w => w.length > 2));
  const tokensB = new Set(cleanB.split(' ').filter(w => w.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });

  const jaccard = intersection / Math.max(tokensA.size, tokensB.size);
  return jaccard > 0.75;
}

/**
 * Fetches high-quality Apple Music style Auto Mix recommendations for a given seed track.
 */
export async function fetchAutoMixTracks(
  currentTrack: Track,
  existingQueue: Track[] = [],
  desiredCount: number = 8
): Promise<Track[]> {
  logger.addLog('info', 'AutoMix', `Generating Apple Music style mix for: "${currentTrack.title}" by ${currentTrack.author}`);

  const cleanTitle = cleanText(currentTrack.title);

  // Define multi-tier search queries
  const queries = [
    { query: `${currentTrack.author} ${cleanTitle} radio`, source: 'ytmsearch' as const },
    { query: `${currentTrack.author} mix`, source: 'ytmsearch' as const },
    { query: `${currentTrack.author} ${cleanTitle} recommendation`, source: 'ytsearch' as const },
    { query: `${currentTrack.author} popular tracks`, source: 'ytsearch' as const },
  ];

  const existingIds = new Set([
    currentTrack.identifier,
    ...existingQueue.map(q => q.identifier),
  ]);

  const existingTitles = [
    currentTrack.title,
    ...existingQueue.map(q => q.title),
  ];

  const candidates: Track[] = [];
  const seenIds = new Set<string>(existingIds);

  for (const { query, source } of queries) {
    if (candidates.length >= desiredCount * 2) break;

    try {
      const results = await lavalinkService.search(query, source);
      if (results && results.length > 0) {
        for (const track of results) {
          if (!track.identifier || seenIds.has(track.identifier)) continue;

          // Check title similarity against current track and existing queue
          const isDuplicate = existingTitles.some(t => isTitleSimilar(t, track.title)) ||
            candidates.some(c => isTitleSimilar(c.title, track.title));

          if (!isDuplicate) {
            seenIds.add(track.identifier);
            candidates.push(track);
          }
        }
      }
    } catch (err: any) {
      logger.addLog('warn', 'AutoMix', `Sub-query failed for "${query}": ${err.message}`);
    }
  }

  // Interleave artists for a balanced playlist feel (avoid 5 tracks from the same artist back-to-back)
  const artistMap = new Map<string, Track[]>();
  candidates.forEach(t => {
    const key = cleanText(t.author) || 'unknown';
    if (!artistMap.has(key)) artistMap.set(key, []);
    artistMap.get(key)!.push(t);
  });

  const finalQueue: Track[] = [];
  const artistKeys = Array.from(artistMap.keys());
  let addedAny = true;

  while (finalQueue.length < desiredCount && addedAny) {
    addedAny = false;
    for (const key of artistKeys) {
      const list = artistMap.get(key);
      if (list && list.length > 0) {
        finalQueue.push(list.shift()!);
        addedAny = true;
        if (finalQueue.length >= desiredCount) break;
      }
    }
  }

  logger.addLog(
    finalQueue.length > 0 ? 'success' : 'warn',
    'AutoMix',
    `Auto Mix generated ${finalQueue.length} tracks for upcoming playback.`
  );

  return finalQueue;
}
