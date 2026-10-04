import { createError, defineEventHandler, getRouterParam } from 'h3';
import { defineCachedFunction } from 'nitropack/runtime';

interface EdgeResponse<T> {
  data: T;
}

interface AnimeNews {
  malId: number;
  title: string;
  url: string;
  imageUrl: string | null;
  excerpt: string;
  date: string;
  author: string;
}

const ANIME_API = 'https://jikan.lucashdo.com/v1';
const NEWS_COUNT = 3;
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const FOUR_HOURS_IN_SECONDS = 60 * 60 * 4;

async function fetchAnimeApi<T>(path: string): Promise<T> {
  const response = await fetch(`${ANIME_API}${path}`);
  if (!response.ok) throw new Error(`jikan-edge responded with ${response.status}`);
  const result = (await response.json()) as EdgeResponse<T>;
  return result.data;
}

// Synopses rarely change, so each is fetched at most once a day; news at most every 4 hours. As with the
// home feed, a failed fetch isn't cached, and stale entries are served while fresh ones load.
const getSynopsis = defineCachedFunction(
  async (malId: number) => (await fetchAnimeApi<{ synopsis: string | null }>(`/anime/${malId}`)).synopsis ?? null,
  { name: 'anime-synopsis', getKey: (malId: number) => String(malId), maxAge: ONE_DAY_IN_SECONDS },
);

// jikan-edge lists news newest first.
const getNews = defineCachedFunction(
  async (malId: number): Promise<AnimeNews[]> =>
    (await fetchAnimeApi<AnimeNews[]>(`/anime/${malId}/news`))
      .slice(0, NEWS_COUNT)
      .map(({ malId, title, url, imageUrl, excerpt, date, author }) => ({ malId, title, url, imageUrl, excerpt, date, author })),
  { name: 'anime-news', getKey: (malId: number) => String(malId), maxAge: FOUR_HOURS_IN_SECONDS },
);

export default defineEventHandler(async (event) => {
  const malId = Number(getRouterParam(event, 'malId'));
  if (!Number.isInteger(malId) || malId <= 0) throw createError({ statusCode: 400, statusMessage: 'Invalid anime id' });

  const [synopsis, news] = await Promise.allSettled([getSynopsis(malId), getNews(malId)]);

  return {
    synopsis: synopsis.status === 'fulfilled' ? synopsis.value : null,
    news: news.status === 'fulfilled' ? news.value : [],
    errors: {
      synopsis: synopsis.status === 'rejected',
      news: news.status === 'rejected',
    },
  };
});
