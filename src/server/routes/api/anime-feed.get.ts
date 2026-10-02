import { defineEventHandler } from 'h3';

interface JikanEnvelope<T> {
  data: T;
}

interface AnimeEntry {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  images: {
    webp?: { image_url?: string | null };
    jpg?: { image_url?: string | null };
  };
  score: number | null;
  rank: number | null;
  episodes: number | null;
  year: number | null;
  type: string | null;
}

interface AnimeRecommendation {
  entry: AnimeEntry[];
  content: string;
  date: string;
  user: { username: string; url: string };
}

const JIKAN_API = 'https://api.jikan.moe/v4';

async function fetchJikan<T>(path: string): Promise<T> {
  const response = await fetch(`${JIKAN_API}${path}`);
  if (!response.ok) throw new Error(`Jikan responded with ${response.status}`);
  const result = await response.json() as JikanEnvelope<T>;
  return result.data;
}

export default defineEventHandler(async () => {
  const [topResult, recommendationsResult] = await Promise.allSettled([
    fetchJikan<AnimeEntry[]>('/top/anime?limit=12'),
    fetchJikan<AnimeRecommendation[]>('/recommendations/anime?limit=8'),
  ]);

  return {
    topAnime: topResult.status === 'fulfilled' ? topResult.value : [],
    recommendations: recommendationsResult.status === 'fulfilled' ? recommendationsResult.value : [],
    errors: {
      topAnime: topResult.status === 'rejected',
      recommendations: recommendationsResult.status === 'rejected',
    },
  };
});
