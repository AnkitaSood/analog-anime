import { httpResource } from '@angular/common/http';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight, lucideNewspaper, lucideRotateCw } from '@ng-icons/lucide';
import { AnimeCardComponent } from './anime-card.component';
import { AnimeDetails, FavoriteAnime } from './anime.models';

/** "Nov 5, 2018 2:27 PM" → "Nov 5, 2018"; the time adds nothing at a glance. */
export function newsDate(date: string): string {
  return date.replace(/,?\s+\d{1,2}:\d{2}\s*[AP]M$/i, '');
}

// One favorite as a full-width section: the poster card, the synopsis beside it, and recent news below.
// Details are only fetched once the card nears the viewport, so a long list doesn't fire every request at once.
@Component({
  selector: 'article[app-favorite-card]',
  imports: [AnimeCardComponent, NgIcon],
  viewProviders: [provideIcons({ lucideArrowUpRight, lucideNewspaper, lucideRotateCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'favorite-card', '[attr.aria-labelledby]': 'headingId()' },
  template: `
    <app-anime-card class="favorite-poster" [anime]="anime()" [eager]="eager()" />

    <section class="favorite-synopsis">
      <span class="section-kicker">THE STORY</span>
      <h2 [id]="headingId()">{{ anime().title }}</h2>
      @if (!details.hasValue() && !details.error()) {
        <div class="synopsis-loading" aria-label="Loading synopsis" aria-busy="true">
          <span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-short"></span>
        </div>
      } @else if (details.error()) {
        <p class="favorite-status">The synopsis and news couldn’t load right now. <button type="button" (click)="details.reload()"><ng-icon name="lucideRotateCw" /> Try again</button></p>
      } @else if (paragraphs().length) {
        <div class="synopsis-text">
          @for (paragraph of paragraphs(); track $index) { <p>{{ paragraph }}</p> }
        </div>
      } @else if (details.value()?.errors?.synopsis) {
        <p class="favorite-status">The synopsis couldn’t load right now. <button type="button" (click)="details.reload()"><ng-icon name="lucideRotateCw" /> Try again</button></p>
      } @else {
        <p class="favorite-status">No synopsis is available for this series yet.</p>
      }
      <a class="favorite-more" [href]="anime().url" target="_blank" rel="noreferrer">More on MyAnimeList <ng-icon name="lucideArrowUpRight" /></a>
    </section>

    <section class="favorite-news" [attr.aria-labelledby]="headingId() + '-news'">
      <span class="section-kicker" [id]="headingId() + '-news'">LATEST NEWS</span>
      @if (!details.hasValue() && !details.error()) {
        <div class="news-list" aria-label="Loading news" aria-busy="true">
          @for (placeholder of [1, 2, 3]; track placeholder) {
            <div class="news-item news-skeleton"><span class="news-thumb skeleton-shimmer"></span><span class="news-skeleton-lines"><span class="skeleton-line"></span><span class="skeleton-short"></span></span></div>
          }
        </div>
      } @else if (details.error() || details.value()?.errors?.news) {
        <p class="favorite-status">News couldn’t load right now.</p>
      } @else if (details.value()?.news?.length) {
        <ul class="news-list">
          @for (item of details.value()!.news; track item.malId) {
            <li>
              <a class="news-item" [href]="item.url" target="_blank" rel="noreferrer">
                @if (item.imageUrl) {
                  <img class="news-thumb" [src]="item.imageUrl" alt="" loading="lazy" />
                } @else {
                  <span class="news-thumb news-thumb-empty"><ng-icon name="lucideNewspaper" /></span>
                }
                <span class="news-body">
                  <span class="news-meta">{{ newsDate(item.date) }} · {{ item.author }}</span>
                  <span class="news-title">{{ item.title }}</span>
                  <span class="news-excerpt">{{ item.excerpt }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      } @else {
        <p class="favorite-status">No news about this series yet.</p>
      }
    </section>
  `,
})
export class FavoriteCardComponent {
  readonly anime = input.required<FavoriteAnime>();
  readonly eager = input(false);

  private readonly inView = signal(false);
  protected readonly headingId = computed(() => `favorite-${this.anime().malId}`);
  protected readonly details = httpResource<AnimeDetails>(() => (this.inView() ? `/api/anime/${this.anime().malId}/details` : undefined));
  protected readonly paragraphs = computed(() =>
    (this.details.value()?.synopsis ?? '')
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  );
  protected readonly newsDate = newsDate;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          this.inView.set(true);
          observer.disconnect();
        },
        { rootMargin: '300px 0px' },
      );
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
