export interface AnimeEntry {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  images: { webp?: { image_url?: string | null }; jpg?: { image_url?: string | null } };
  score: number | null;
  rank: number | null;
  episodes: number | null;
  year: number | null;
  type: string | null;
}

export interface AnimeRecommendation {
  entry: AnimeEntry[];
  content: string;
  date: string;
  user: { username: string; url: string };
}

export interface AnimeGenre {
  mal_id: number;
  name: string;
  count: number;
}

export interface JikanEnvelope<T> {
  data: T;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: { count: number; total: number; per_page: number };
}

export interface JikanPage<T> extends JikanEnvelope<T[]> {
  pagination: JikanPagination;
}

export const ANIME_TYPES = [
  { value: 'tv', label: 'TV' },
  { value: 'movie', label: 'Movie' },
  { value: 'ova', label: 'OVA' },
  { value: 'special', label: 'Special' },
  { value: 'ona', label: 'ONA' },
  { value: 'tv_special', label: 'TV Special' },
  { value: 'music', label: 'Music' },
  { value: 'cm', label: 'Commercial' },
  { value: 'pv', label: 'Promo video' },
] as const;

export const ANIME_STATUSES = [
  { value: 'airing', label: 'Airing' },
  { value: 'complete', label: 'Finished' },
  { value: 'upcoming', label: 'Upcoming' },
] as const;

// Jikan's `rx` (Hentai) rating is intentionally left out.
export const ANIME_RATINGS = [
  { value: 'g', label: 'G – All ages' },
  { value: 'pg', label: 'PG – Children' },
  { value: 'pg13', label: 'PG-13 – Teens 13+' },
  { value: 'r17', label: 'R – 17+' },
  { value: 'r', label: 'R+ – Mild nudity' },
] as const;

export type AnimeType = (typeof ANIME_TYPES)[number]['value'];
export type AnimeStatus = (typeof ANIME_STATUSES)[number]['value'];
export type AnimeRating = (typeof ANIME_RATINGS)[number]['value'];

export interface AnimeSearchFilters {
  q: string;
  genres: number[];
  type: AnimeType | null;
  status: AnimeStatus | null;
  rating: AnimeRating | null;
  page: number;
}

export function animeImage(anime: AnimeEntry): string {
  return anime.images.webp?.image_url || anime.images.jpg?.image_url || '';
}
