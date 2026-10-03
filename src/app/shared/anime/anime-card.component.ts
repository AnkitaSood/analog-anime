import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideStar } from '@ng-icons/lucide';
import { AnimeEntry, animeUrl } from './anime.models';

@Component({
  selector: 'a[app-anime-card]',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideArrowRight, lucideStar })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anime-card',
    target: '_blank',
    rel: 'noreferrer',
    '[href]': 'href()',
    '[attr.aria-label]': 'anime().title + " on MyAnimeList"',
  },
  template: `
    <div class="poster-wrap">
      <img class="poster" [src]="anime().imageUrl ?? ''" [alt]="anime().title + ' poster'" [loading]="eager() ? 'eager' : 'lazy'" />
      @if (rank()) { <span class="rank-chip">#{{ rank() }}</span> }
      @if (anime().score; as score) { <span class="score-chip"><ng-icon name="lucideStar" /> {{ score.toFixed(2) }}</span> }
      <span class="poster-link"><ng-icon name="lucideArrowRight" /></span>
    </div>
    <div class="card-caption">
      <div class="anime-meta"><span>{{ anime().type || 'Anime' }}</span></div>
      <h3>{{ anime().title }}</h3>
      <p>{{ anime().episodes ? anime().episodes + ' episodes' : 'Series & films' }}<span class="caption-arrow">↗</span></p>
    </div>
  `,
})
export class AnimeCardComponent {
  readonly anime = input.required<AnimeEntry>();
  readonly rank = input<number | null>(null);
  readonly eager = input(false);
  readonly href = computed(() => this.anime().url ?? animeUrl(this.anime().malId));
}
