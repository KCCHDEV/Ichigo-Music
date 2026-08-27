import { HistoryItem, Track } from '../types/music';

const HISTORY_KEY = 'music_app_listening_history';
const SEARCH_HISTORY_KEY = 'music_app_search_history';

export function getListeningHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load listening history', e);
    return [];
  }
}

export function addToListeningHistory(track: Track): HistoryItem[] {
  const current = getListeningHistory();
  const existingIndex = current.findIndex(item => item.track.identifier === track.identifier || (item.track.title === track.title && item.track.author === track.author));

  let updated: HistoryItem[];
  const now = Date.now();

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const updatedItem: HistoryItem = {
      ...existing,
      track: { ...existing.track, ...track },
      playedAt: now,
      playCount: (existing.playCount || 1) + 1
    };
    updated = [updatedItem, ...current.filter((_, idx) => idx !== existingIndex)];
  } else {
    const newItem: HistoryItem = {
      id: `${track.identifier || Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      track,
      playedAt: now,
      playCount: 1
    };
    updated = [newItem, ...current];
  }

  // Keep last 200 items
  const sliced = updated.slice(0, 200);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sliced));
  } catch (e) {
    console.error('Failed to save listening history', e);
  }
  return sliced;
}

export function clearListeningHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): string[] {
  if (!query || !query.trim()) return getSearchHistory();
  const trimmed = query.trim();
  const current = getSearchHistory().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...current].slice(0, 20);
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save search history', e);
  }
  return updated;
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}
