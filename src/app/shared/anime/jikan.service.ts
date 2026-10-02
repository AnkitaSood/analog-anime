import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { AnimeEntry, AnimeGenre, AnimeSearchFilters, JikanEnvelope, JikanPage } from './anime.models';

const JIKAN_API = 'https://api.jikan.moe/v4';
export const BROWSE_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class JikanService {
  private readonly http = inject(HttpClient);

  // `filter=genres` leaves out the explicit genres (Hentai, Erotica, Ecchi) and themes/demographics.
  private readonly genres$ = this.http
    .get<JikanEnvelope<AnimeGenre[]>>(`${JIKAN_API}/genres/anime`, { params: { filter: 'genres' } })
    .pipe(
      map((response) => [...(response.data ?? [])].sort((a, b) => a.name.localeCompare(b.name))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  getGenres(): Observable<AnimeGenre[]> {
    return this.genres$;
  }

  searchAnime(filters: AnimeSearchFilters): Observable<JikanPage<AnimeEntry>> {
    let params = new HttpParams().set('page', filters.page).set('limit', BROWSE_PAGE_SIZE);

    if (filters.q) {
      params = params.set('q', filters.q);
    } else {
      // Without a search term Jikan orders by id, so browse by popularity instead.
      params = params.set('order_by', 'members').set('sort', 'desc');
    }
    if (filters.genres.length) params = params.set('genres', filters.genres.join(','));
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.rating) params = params.set('rating', filters.rating);

    // Always set last so no filter can turn it off.
    params = params.set('sfw', true);

    return this.http.get<JikanPage<AnimeEntry>>(`${JIKAN_API}/anime`, { params });
  }
}
