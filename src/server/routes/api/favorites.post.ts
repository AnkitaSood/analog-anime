import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3';
import { requireUser } from '../../auth';
import { useDb } from '../../db/client';
import { favorites, NewFavorite } from '../../db/schema';

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parseFavorite(body: unknown): Omit<NewFavorite, 'userId' | 'addedAt'> | null {
  if (!body || typeof body !== 'object') return null;
  const { malId, title, url, imageUrl = null, score = null, episodes = null, type = null } = body as Record<string, unknown>;

  if (!Number.isInteger(malId) || (malId as number) <= 0) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (url !== undefined && typeof url !== 'string') return null;
  if (!isNullableString(imageUrl) || !isNullableNumber(score) || !isNullableNumber(episodes) || !isNullableString(type)) return null;

  return {
    malId: malId as number,
    title: title.trim(),
    url: url ?? `https://myanimelist.net/anime/${malId}`,
    imageUrl,
    score,
    episodes,
    type,
  };
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const favorite = parseFavorite(await readBody(event));
  if (!favorite) throw createError({ statusCode: 400, statusMessage: 'Invalid anime' });

  // Saving an existing favorite refreshes its details but keeps its original position in the list.
  const [{ userId: _userId, ...saved }] = useDb()
    .insert(favorites)
    .values({ ...favorite, userId: user.id })
    .onConflictDoUpdate({ target: [favorites.userId, favorites.malId], set: favorite })
    .returning()
    .all();

  setResponseStatus(event, 201);
  return saved;
});
