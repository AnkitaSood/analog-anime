import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@/shared/auth/auth.service';
import { AnimeEntry, animeUrl, FavoriteAnime } from './anime.models';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

// Each signed-in user's favorites live in SQLite behind `/api/favorites`. Changes show up immediately and are
// rolled back if the server rejects them. The list follows the session: it loads on sign-in and clears on sign-out.
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly entries = signal<FavoriteAnime[]>([]);
  private readonly pending = signal<ReadonlySet<number>>(new Set());
  private readonly ids = computed(() => new Set(this.entries().map((anime) => anime.malId)));

  readonly favorites = this.entries.asReadonly();
  readonly status = signal<LoadStatus>('idle');
  readonly ready = computed(() => this.status() === 'loaded');

  // Keyed on the id alone: Better Auth hands out a new user object every time it refreshes the session.
  private readonly userId = computed(() => this.auth.user()?.id ?? null);

  constructor() {
    effect(() => {
      const userId = this.userId();
      untracked(() => {
        this.entries.set([]);
        this.status.set('idle');
        if (userId) this.load();
      });
    });
  }

  /** Fetches the signed-in user's list once; later calls do nothing unless the last attempt failed. */
  load(): void {
    const userId = this.userId();
    if (!this.isBrowser || !userId || this.status() === 'loading' || this.status() === 'loaded') return;
    this.status.set('loading');
    this.http.get<FavoriteAnime[]>('/api/favorites').subscribe({
      next: (favorites) => {
        if (this.userId() !== userId) return; // signed out (or in as someone else) while this was loading
        this.entries.set(favorites);
        this.status.set('loaded');
      },
      error: () => {
        if (this.userId() === userId) this.status.set('error');
      },
    });
  }

  isFavorite(malId: number): boolean {
    return this.ids().has(malId);
  }

  /** True while a save or removal for this anime is in flight, so it can't be toggled again mid-request. */
  isPending(malId: number): boolean {
    return this.pending().has(malId);
  }

  /** Whether this anime's heart can be clicked now. Signed-out visitors can click it, which takes them to sign in. */
  canToggle(malId: number): boolean {
    const status = this.auth.status();
    return status === 'signed-out' || (status === 'signed-in' && this.ready() && !this.isPending(malId));
  }

  /** Signed-out visitors are sent to sign in, then brought back to the page they were on. */
  toggle(anime: AnimeEntry): void {
    if (this.auth.status() === 'signed-out') {
      this.router.navigate(['/sign-in'], { queryParams: { redirect: this.router.url } });
      return;
    }
    if (!this.ready() || this.isPending(anime.malId)) return;
    if (this.isFavorite(anime.malId)) {
      this.remove(anime.malId);
    } else {
      this.add(anime);
    }
  }

  private add(anime: AnimeEntry): void {
    const { malId, title, imageUrl, score, episodes, type } = anime;
    const body = { malId, title, url: anime.url ?? animeUrl(malId), imageUrl, score, episodes, type };

    this.entries.update((favorites) => [{ ...body, addedAt: new Date().toISOString() }, ...favorites]);
    this.track(malId, this.http.post<FavoriteAnime>('/api/favorites', body), {
      next: (saved) => this.entries.update((favorites) => favorites.map((favorite) => (favorite.malId === malId ? saved : favorite))),
      error: () => this.entries.update((favorites) => favorites.filter((favorite) => favorite.malId !== malId)),
    });
  }

  private remove(malId: number): void {
    const index = this.entries().findIndex((favorite) => favorite.malId === malId);
    const removed = this.entries()[index];

    this.entries.update((favorites) => favorites.filter((favorite) => favorite.malId !== malId));
    this.track(malId, this.http.delete<void>(`/api/favorites/${malId}`), {
      error: () => this.entries.update((favorites) => [...favorites.slice(0, index), removed, ...favorites.slice(index)]),
    });
  }

  private track<T>(malId: number, request: Observable<T>, handlers: { next?: (value: T) => void; error: () => void }): void {
    this.pending.update((ids) => new Set(ids).add(malId));
    const settle = () => this.pending.update((ids) => {
      const next = new Set(ids);
      next.delete(malId);
      return next;
    });
    request.subscribe({
      next: (value) => handlers.next?.(value),
      error: () => {
        handlers.error();
        settle();
      },
      complete: settle,
    });
  }
}
