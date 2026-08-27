// Service to fetch real-time YouTube search suggestions (Autocomplete)
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    // Data format is [query, [suggestion1, suggestion2, ...]]
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      return data[1].slice(0, 8); // Top 8 suggestions
    }
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
  }

  return [];
}
