import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowRight, lucideCheck, lucideChevronRight, lucideCompass, lucideExternalLink, lucideHeart, lucideLoaderCircle, lucideMoon, lucideSearch, lucideSparkles, lucideStar, lucideSun } from '@ng-icons/lucide';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardButtonComponent } from '@/shared/components/button';
import { RouteMeta } from '@analogjs/router';

interface AnimeEntry {
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

interface AnimeRecommendation {
  entry: AnimeEntry[];
  content: string;
  date: string;
  user: { username: string; url: string };
}

interface JikanEnvelope<T> {
  data: T;
}

interface AnimeFeed {
  topAnime: AnimeEntry[];
  recommendations: AnimeRecommendation[];
  errors: { topAnime: boolean; recommendations: boolean };
}

export const routeMeta: RouteMeta = {
  title: 'Anime Index — Find your next favorite',
  meta: [
    { name: 'description', content: 'Explore the highest rated anime and discover community recommendations, all in one place.' },
  ],
};

@Component({
  selector: 'app-home',
  imports: [NgIcon, ZardBadgeComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideArrowDown, lucideArrowRight, lucideCheck, lucideChevronRight, lucideCompass, lucideExternalLink, lucideHeart, lucideLoaderCircle, lucideMoon, lucideSearch, lucideSparkles, lucideStar, lucideSun })],
  template: `
    <div class="site-shell">
      <header class="topbar">
        <a class="wordmark" href="#top" aria-label="Anime Index home">
          <span class="brand-mark"><span></span><span></span><span></span></span>
          <span>anime<span class="wordmark-light">index</span></span>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
          <a href="#top-anime">Top anime</a>
          <a href="#recommendations">Community picks</a>
        </nav>
        <div class="header-actions">
          <button type="button" class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'" [attr.title]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
            <ng-icon [name]="isDark() ? 'lucideSun' : 'lucideMoon'" />
          </button>
          <a class="mal-link" href="https://myanimelist.net/topanime.php" target="_blank" rel="noreferrer">
            <span>MyAnimeList</span><ng-icon name="lucideExternalLink" />
          </a>
        </div>
      </header>

      <main id="top">
        <section class="intro" aria-labelledby="page-title">
          <div class="intro-copy">
            <z-badge zType="secondary" class="eyebrow"><span class="live-dot"></span> YOUR ANIME COMPASS</z-badge>
            <h1 id="page-title">Stories worth<br class="desktop-break"> staying up for<span class="period">.</span></h1>
            <p>A little direction for your next big obsession. Explore the all-time greats, then follow the recommendations fans can’t stop talking about.</p>
            <a class="scroll-cue" href="#top-anime"><span class="scroll-icon"><ng-icon name="lucideArrowDown" /></span> Start exploring</a>
          </div>
          <div class="intro-aside" aria-hidden="true">
            <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
            <div class="orbit-core"><ng-icon name="lucideSparkles" /></div>
            <span class="orbit-note note-top">THERE’S A WHOLE WORLD</span>
            <span class="orbit-note note-bottom">WAITING IN THE NEXT EPISODE</span>
            <span class="orbit-star star-one">✳</span><span class="orbit-star star-two">✳</span>
          </div>
        </section>

        <section class="content-section top-section" id="top-anime" aria-labelledby="top-title">
          <div class="section-heading">
            <div class="section-title-wrap">
              <span class="section-kicker">01 / THE ESSENTIALS</span>
              <h2 id="top-title">The all-time <span>greats</span></h2>
            </div>
            <div class="section-tools">
              <label class="search-field">
                <ng-icon name="lucideSearch" />
                <input type="search" placeholder="Find a title" [value]="query()" (input)="onSearch($event)" aria-label="Search top anime" />
                @if (query()) { <button type="button" class="clear-search" (click)="query.set('')" aria-label="Clear search"><ng-icon name="lucideCheck" /></button> }
              </label>
              <span class="result-count">{{ filteredAnime().length }} titles</span>
            </div>
          </div>

          @if (loading()) {
            <div class="anime-grid" aria-label="Loading top anime" aria-busy="true">
              @for (placeholder of placeholders; track placeholder) {
                <div class="anime-card skeleton-card"><div class="poster skeleton-shimmer"></div><div class="skeleton-line"></div><div class="skeleton-short"></div></div>
              }
            </div>
          } @else if (error() || topAnimeError()) {
            <div class="empty-state"><span class="empty-icon"><ng-icon name="lucideCompass" /></span><h3>The top anime list couldn’t load.</h3><p>{{ error() || 'Jikan could not return the top anime feed. Community picks may still be available below.' }}</p><button type="button" z-button zType="outline" (click)="loadFeed()">Try again <ng-icon name="lucideArrowRight" /></button></div>
          } @else if (filteredAnime().length) {
            <div class="anime-grid">
              @for (anime of filteredAnime(); track anime.mal_id; let i = $index) {
                <a class="anime-card" [href]="anime.url" target="_blank" rel="noreferrer" [attr.aria-label]="anime.title + ' on MyAnimeList'">
                  <div class="poster-wrap">
                    <img class="poster" [src]="imageFor(anime)" [alt]="anime.title + ' poster'" [loading]="i < 4 ? 'eager' : 'lazy'" />
                    <span class="rank-chip">#{{ anime.rank ?? i + 1 }}</span>
                    @if (anime.score) { <span class="score-chip"><ng-icon name="lucideStar" /> {{ anime.score.toFixed(2) }}</span> }
                    <span class="poster-link"><ng-icon name="lucideArrowRight" /></span>
                  </div>
                  <div class="card-caption">
                    <div class="anime-meta"><span>{{ anime.type || 'Anime' }}</span>@if (anime.year) { <span class="meta-divider">·</span><span>{{ anime.year }}</span> }</div>
                    <h3>{{ anime.title_english || anime.title }}</h3>
                    <p>{{ anime.episodes ? anime.episodes + ' episodes' : 'Series & films' }}<span class="caption-arrow">↗</span></p>
                  </div>
                </a>
              }
            </div>
          } @else {
            <div class="empty-state search-empty"><span class="empty-icon"><ng-icon name="lucideSearch" /></span><h3>No titles found</h3><p>Try another title or clear your search.</p><button type="button" z-button zType="outline" (click)="query.set('')">Clear search</button></div>
          }
          <div class="section-footnote"><span class="footnote-line"></span><span>Ranked by the anime community</span><span class="footnote-line"></span></div>
        </section>

        <section class="recommendations-section" id="recommendations" aria-labelledby="recommendations-title">
          <div class="recommendations-topline"><span class="section-kicker">02 / WORD OF MOUTH</span><span class="freshness"><span></span> THE COMMUNITY IS TALKING</span></div>
          <div class="recommendations-header">
            <div><h2 id="recommendations-title">One good watch<br>leads to <em>another.</em></h2></div>
            <p>These pairings are straight from fans. Find a favorite, then see what they think you should watch next.</p>
          </div>

          @if (!loading() && recommendations().length) {
            <div class="recommendation-list">
              @for (recommendation of recommendations(); track recommendation.date + recommendation.user.username + $index) {
                <article class="recommendation-card">
                  <div class="rec-pair">
                    @for (anime of recommendation.entry.slice(0, 2); track anime.mal_id; let pairIndex = $index) {
                      <a class="rec-anime" [href]="anime.url" target="_blank" rel="noreferrer">
                        <img [src]="imageFor(anime)" [alt]="anime.title + ' poster'" loading="lazy" />
                        <span class="rec-anime-title">{{ anime.title_english || anime.title }}</span>
                      </a>
                      @if (pairIndex === 0 && recommendation.entry.length > 1) { <span class="pair-plus" aria-hidden="true">+</span> }
                    }
                    <span class="rec-arrow" aria-hidden="true"><ng-icon name="lucideArrowRight" /></span>
                  </div>
                  <div class="rec-quote">
                    <span class="quote-mark">“</span>
                    <p>{{ recommendation.content || 'Fans of one found something to love in the other.' }}</p>
                    <div class="rec-byline"><span>Recommended by</span><a [href]="recommendation.user.url" target="_blank" rel="noreferrer">{{ recommendation.user.username }} <ng-icon name="lucideExternalLink" /></a><time [attr.datetime]="recommendation.date">{{ formatDate(recommendation.date) }}</time></div>
                  </div>
                </article>
              }
            </div>
          } @else if (loading()) {
            <div class="recommendation-loading"><span></span><span></span><span></span></div>
          } @else if (recommendationsError()) {
            <div class="rec-empty">Community recommendations couldn’t load just now. The top anime list is still available above.</div>
          } @else if (!error()) {
            <div class="rec-empty">No recommendations are available right now. Check back soon.</div>
          }
          <div class="rec-footer"><span><ng-icon name="lucideHeart" /> Made better by fans</span><a href="https://myanimelist.net/recommendations.php?s=anime" target="_blank" rel="noreferrer">More recommendations <ng-icon name="lucideChevronRight" /></a></div>
        </section>
      </main>

      <footer class="site-footer">
        <a class="wordmark footer-wordmark" href="#top"><span class="brand-mark"><span></span><span></span><span></span></span><span>anime<span class="wordmark-light">index</span></span></a>
        <p>Find the story you didn’t know you needed.</p>
        <span class="data-credit">Anime data by <a href="https://jikan.moe" target="_blank" rel="noreferrer">Jikan API</a><span class="credit-divider">·</span> Images & rankings by MyAnimeList</span>
      </footer>
    </div>
  `,
})
export default class HomePage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  readonly topAnime = signal<AnimeEntry[]>([]);
  readonly recommendations = signal<AnimeRecommendation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly topAnimeError = signal(false);
  readonly recommendationsError = signal(false);
  readonly query = signal('');
  readonly isDark = signal(false);
  readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly filteredAnime = () => {
    const term = this.query().trim().toLocaleLowerCase();
    if (!term) return this.topAnime();
    return this.topAnime().filter((anime) => `${anime.title} ${anime.title_english ?? ''}`.toLocaleLowerCase().includes(term));
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = window.localStorage.getItem('anime-index-theme');
      const shouldUseDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(shouldUseDark);
      document.documentElement.classList.toggle('dark', shouldUseDark);
      this.loadFeed();
    }
  }

  toggleTheme(): void {
    const nextThemeIsDark = !this.isDark();
    this.isDark.set(nextThemeIsDark);
    document.documentElement.classList.toggle('dark', nextThemeIsDark);
    window.localStorage.setItem('anime-index-theme', nextThemeIsDark ? 'dark' : 'light');
  }

  loadFeed(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<AnimeFeed>('/api/anime-feed').subscribe({
      next: (feed) => {
        this.error.set('');
        this.recommendations.set(feed.recommendations ?? []);
        this.recommendationsError.set(feed.errors?.recommendations ?? false);

        if (feed.topAnime?.length) {
          this.topAnime.set(feed.topAnime);
          this.topAnimeError.set(false);
          this.loading.set(false);
          return;
        }

        if (this.topAnime().length) {
          this.topAnimeError.set(false);
          this.loading.set(false);
          return;
        }

        this.loadTopAnimeFromBrowser();
      },
      error: () => {
        this.recommendationsError.set(true);
        this.loadTopAnimeFromBrowser();
      },
    });
  }

  private loadTopAnimeFromBrowser(): void {
    this.http.get<JikanEnvelope<AnimeEntry[]>>('https://api.jikan.moe/v4/top/anime?limit=12').subscribe({
      next: (response) => {
        const anime = response.data ?? [];
        this.topAnime.set(anime);
        this.topAnimeError.set(anime.length === 0);
        this.error.set(anime.length ? '' : 'Jikan returned an empty top anime list. Please try again shortly.');
        this.loading.set(false);
      },
      error: () => {
        this.topAnimeError.set(true);
        this.error.set('The top anime feed is temporarily unavailable. Please try again shortly.');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  imageFor(anime: AnimeEntry): string {
    return anime.images.webp?.image_url || anime.images.jpg?.image_url || '';
  }

  formatDate(value: string): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
  }
}
