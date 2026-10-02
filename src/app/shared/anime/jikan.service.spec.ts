import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnimeSearchFilters } from './anime.models';
import { JikanService } from './jikan.service';

const noFilters: AnimeSearchFilters = { q: '', genres: [], type: null, status: null, rating: null, page: 1 };

describe('JikanService', () => {
  let service: JikanService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(JikanService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('always requests SFW results, 20 per page, ordered by popularity when there is no query', () => {
    service.searchAnime(noFilters).subscribe();

    const req = http.expectOne((r) => r.url === 'https://api.jikan.moe/v4/anime');
    expect(req.request.params.get('sfw')).toBe('true');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('order_by')).toBe('members');
    expect(req.request.params.get('sort')).toBe('desc');
    expect(req.request.params.has('q')).toBe(false);
    req.flush({ data: [], pagination: {} });
  });

  it('sends every filter along with sfw', () => {
    service
      .searchAnime({ q: 'frieren', genres: [2, 10], type: 'tv', status: 'complete', rating: 'pg13', page: 3 })
      .subscribe();

    const params = http.expectOne((r) => r.url === 'https://api.jikan.moe/v4/anime').request.params;
    expect(params.get('q')).toBe('frieren');
    expect(params.get('genres')).toBe('2,10');
    expect(params.get('type')).toBe('tv');
    expect(params.get('status')).toBe('complete');
    expect(params.get('rating')).toBe('pg13');
    expect(params.get('page')).toBe('3');
    expect(params.has('order_by')).toBe(false);
    expect(params.get('sfw')).toBe('true');
  });

  it('loads only non-explicit genres, sorted by name, and caches them', () => {
    const received: string[][] = [];
    service.getGenres().subscribe((genres) => received.push(genres.map((g) => g.name)));

    const req = http.expectOne('https://api.jikan.moe/v4/genres/anime?filter=genres');
    req.flush({ data: [{ mal_id: 4, name: 'Comedy', count: 1 }, { mal_id: 1, name: 'Action', count: 1 }] });
    service.getGenres().subscribe((genres) => received.push(genres.map((g) => g.name)));

    http.expectNone('https://api.jikan.moe/v4/genres/anime?filter=genres');
    expect(received).toEqual([['Action', 'Comedy'], ['Action', 'Comedy']]);
  });
});
