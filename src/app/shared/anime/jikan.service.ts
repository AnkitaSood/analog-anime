import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { AnimeEntry, AnimeGenre, AnimeSearchFilters, EdgeResponse } from './anime.models';

// jikan-edge: a Jikan-like API that keeps answering from its cache while MyAnimeList is unreachable.
// It rejects parameters it doesn't honour (`limit`, `sfw`, …) with a 400, so only send supported ones.
const ANIME_API = 'https://jikan.lucashdo.com/v1';
// Fixed by MyAnimeList; jikan-edge has no `limit` on search.
export const BROWSE_PAGE_SIZE = 50;

@Injectable({ providedIn: 'root' })
export class JikanService {
  private readonly http = inject(HttpClient);

  // Served by our own API route, which filters and sorts the list and caches it for a day.
  private readonly genres$ = this.http
    .get<AnimeGenre[]>('/api/genres')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getGenres(): Observable<AnimeGenre[]> {
    return this.genres$;
  }

  searchAnime(filters: AnimeSearchFilters): Observable<EdgeResponse<AnimeEntry[]>> {
    let params = new HttpParams().set('page', filters.page);

    if (filters.q) {
      params = params.set('q', filters.q);
    } else {
      // Without a search term results come back in id order, so browse by popularity instead.
      params = params.set('order_by', 'members').set('sort', 'desc');
    }
    if (filters.genres.length) params = params.set('genres', filters.genres.join(','));
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.rating) params = params.set('rating', filters.rating);

    return this.http.get<EdgeResponse<AnimeEntry[]>>(`${ANIME_API}/anime`, { params });
  }
}
