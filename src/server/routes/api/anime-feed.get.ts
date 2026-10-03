import { defineEventHandler } from 'h3';

interface EdgeResponse<T> {
  data: T;
}

interface AnimeEntry {
  malId: number;
  url?: string;
  title: string;
  imageUrl: string | null;
  score: number | null;
  episodes: number | null;
  type: string | null;
}

interface AnimeRecommendation {
  malId: number;
  title: string;
  imageUrl: string | null;
  recommendedMalId: number;
  recommendedTitle: string;
  recommendedImageUrl: string | null;
  content: string;
  username: string;
}

const ANIME_API = 'https://jikan.lucashdo.com/v1';
// jikan-edge has no `limit`: top lists come back 50 at a time and recommendations 100 at a time.
const TOP_ANIME_COUNT = 12;
const RECOMMENDATION_COUNT = 8;

async function fetchAnimeApi<T>(path: string): Promise<T> {
  const response = await fetch(`${ANIME_API}${path}`);
  if (!response.ok) throw new Error(`jikan-edge responded with ${response.status}`);
  const result = await response.json() as EdgeResponse<T>;
  return result.data;
}

export default defineEventHandler(async () => {
  const [topResult, recommendationsResult] = await Promise.allSettled([
    fetchAnimeApi<AnimeEntry[]>('/top/anime'),
    fetchAnimeApi<AnimeRecommendation[]>('/recommendations/anime'),
  ]);

  return {
    topAnime: topResult.status === 'fulfilled'
      ? topResult.value.slice(0, TOP_ANIME_COUNT).map((anime) => ({ ...anime, url: anime.url ?? `https://myanimelist.net/anime/${anime.malId}` }))
      : [],
    recommendations: recommendationsResult.status === 'fulfilled' ? recommendationsResult.value.slice(0, RECOMMENDATION_COUNT) : [],
    errors: {
      topAnime: topResult.status === 'rejected',
      recommendations: recommendationsResult.status === 'rejected',
    },
  };
});
