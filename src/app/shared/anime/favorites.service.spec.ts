import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, AuthStatus, AuthUser } from '@/shared/auth/auth.service';
import { AnimeEntry, FavoriteAnime } from './anime.models';
import { FavoritesService } from './favorites.service';

const frieren: AnimeEntry = { malId: 52991, title: 'Frieren', imageUrl: null, score: 9.3, episodes: 28, type: 'TV' };
const saved: FavoriteAnime = { ...frieren, url: 'https://myanimelist.net/anime/52991', addedAt: '2026-10-04T00:00:00.000Z' };

function fakeUser(id: string): AuthUser {
  return { id, name: id, email: `${id}@example.test` } as AuthUser;
}

class FakeAuthService {
  readonly currentUser = signal<AuthUser | null | undefined>(undefined);
  readonly user = computed(() => this.currentUser() ?? null);
  readonly status = computed<AuthStatus>(() => {
    const user = this.currentUser();
    return user === undefined ? 'loading' : user ? 'signed-in' : 'signed-out';
  });
}

describe('FavoritesService', () => {
  let service: FavoritesService;
  let http: HttpTestingController;
  let auth: FakeAuthService;

  function signIn(id = 'ann'): void {
    auth.currentUser.set(fakeUser(id));
    TestBed.tick();
  }

  /** Signs in, which loads the list, and answers that request. */
  function loadWith(favorites: FavoriteAnime[]): void {
    signIn();
    http.expectOne('/api/favorites').flush(favorites);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useClass: FakeAuthService }],
    });
    service = TestBed.inject(FavoritesService);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService) as unknown as FakeAuthService;
  });

  afterEach(() => http.verify());

  it('loads the saved list only once', () => {
    loadWith([saved]);
    service.load();

    expect(service.ready()).toBe(true);
    expect(service.isFavorite(frieren.malId)).toBe(true);
  });

  it('does not load anything until someone signs in', () => {
    service.load();
    auth.currentUser.set(null);
    TestBed.tick();

    http.expectNone('/api/favorites');
    expect(service.ready()).toBe(false);
  });

  it('can retry after a failed load', () => {
    signIn();
    http.expectOne('/api/favorites').flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.status()).toBe('error');

    service.load();
    http.expectOne('/api/favorites').flush([]);
    expect(service.ready()).toBe(true);
  });

  it('ignores toggles until the list has loaded', () => {
    signIn();
    service.toggle(frieren);

    http.expectOne({ method: 'GET', url: '/api/favorites' }).flush([]);
    expect(service.isFavorite(frieren.malId)).toBe(false);
  });

  it('sends signed-out visitors to sign in, then back to where they were', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    auth.currentUser.set(null);
    TestBed.tick();

    expect(service.canToggle(frieren.malId)).toBe(true);
    service.toggle(frieren);
    expect(navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { redirect: '/' } });
  });

  it('clears the list on sign-out and loads the next user’s on sign-in', () => {
    loadWith([saved]);

    auth.currentUser.set(null);
    TestBed.tick();
    expect(service.favorites()).toEqual([]);
    expect(service.ready()).toBe(false);

    signIn('bo');
    http.expectOne('/api/favorites').flush([]);
    expect(service.isFavorite(frieren.malId)).toBe(false);
  });

  it('keeps the list when the session refreshes for the same user', () => {
    loadWith([saved]);
    signIn('ann'); // a new user object with the same id

    http.expectNone('/api/favorites');
    expect(service.favorites()).toEqual([saved]);
  });

  it('drops a list that arrives after the user signed out', () => {
    signIn();
    const req = http.expectOne('/api/favorites');
    auth.currentUser.set(null);
    TestBed.tick();
    req.flush([saved]);

    expect(service.favorites()).toEqual([]);
  });

  it('saves optimistically, filling in the MyAnimeList url', () => {
    loadWith([]);
    service.toggle(frieren);

    expect(service.isFavorite(frieren.malId)).toBe(true);
    expect(service.isPending(frieren.malId)).toBe(true);
    const req = http.expectOne({ method: 'POST', url: '/api/favorites' });
    expect(req.request.body).toEqual({ ...frieren, url: saved.url });
    req.flush(saved);

    expect(service.isPending(frieren.malId)).toBe(false);
    expect(service.favorites()).toEqual([saved]);
  });

  it('rolls back a save the server rejects', () => {
    loadWith([]);
    service.toggle(frieren);
    http.expectOne({ method: 'POST', url: '/api/favorites' }).flush(null, { status: 500, statusText: 'Server Error' });

    expect(service.isFavorite(frieren.malId)).toBe(false);
    expect(service.isPending(frieren.malId)).toBe(false);
  });

  it('ignores a second toggle while the first is in flight', () => {
    loadWith([]);
    service.toggle(frieren);
    service.toggle(frieren);

    http.expectOne({ method: 'POST', url: '/api/favorites' }).flush(saved);
    expect(service.isFavorite(frieren.malId)).toBe(true);
  });

  it('removes optimistically and restores the entry in place if the delete fails', () => {
    const other: FavoriteAnime = { ...saved, malId: 1, title: 'Cowboy Bebop' };
    loadWith([other, saved]);
    service.toggle(other);

    expect(service.favorites()).toEqual([saved]);
    http.expectOne({ method: 'DELETE', url: '/api/favorites/1' }).flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.favorites()).toEqual([other, saved]);
  });
});
