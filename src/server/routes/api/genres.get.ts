import { createError, defineEventHandler } from 'h3';
import { defineCachedFunction } from 'nitropack/runtime';

interface EdgeResponse<T> {
  data: T;
}

interface AnimeGenre {
  malId: number;
  name: string;
  count: number;
}

const ANIME_API = 'https://jikan.lucashdo.com/v1';
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

// `filter=genres` leaves out the explicit genres (Hentai, Erotica, Ecchi) and themes/demographics.
// Genres rarely change, so the API is hit at most once a day. A failed fetch throws and isn't cached,
// and once a day has passed the stale list is served while a fresh one loads in the background.
const getGenres = defineCachedFunction(
  async (): Promise<AnimeGenre[]> => {
    const response = await fetch(`${ANIME_API}/genres/anime?filter=genres`);
    if (!response.ok) throw new Error(`jikan-edge responded with ${response.status}`);
    const result = (await response.json()) as EdgeResponse<AnimeGenre[]>;
    return [...(result.data ?? [])]
      .map(({ malId, name, count }) => ({ malId, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  { name: 'anime-genres', getKey: () => 'anime', maxAge: ONE_DAY_IN_SECONDS },
);

export default defineEventHandler(async () => {
  try {
    return await getGenres();
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Genres are temporarily unavailable' });
  }
});
