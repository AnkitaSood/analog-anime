import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideStar } from '@ng-icons/lucide';
import { AnimeEntry, animeImage } from './anime.models';

@Component({
  selector: 'a[app-anime-card]',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideArrowRight, lucideStar })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anime-card',
    target: '_blank',
    rel: 'noreferrer',
    '[href]': 'anime().url',
    '[attr.aria-label]': 'anime().title + " on MyAnimeList"',
  },
  template: `
    <div class="poster-wrap">
      <img class="poster" [src]="image()" [alt]="anime().title + ' poster'" [loading]="eager() ? 'eager' : 'lazy'" />
      @if (rank()) { <span class="rank-chip">#{{ rank() }}</span> }
      @if (anime().score; as score) { <span class="score-chip"><ng-icon name="lucideStar" /> {{ score.toFixed(2) }}</span> }
      <span class="poster-link"><ng-icon name="lucideArrowRight" /></span>
    </div>
    <div class="card-caption">
      <div class="anime-meta"><span>{{ anime().type || 'Anime' }}</span>@if (anime().year) { <span class="meta-divider">·</span><span>{{ anime().year }}</span> }</div>
      <h3>{{ anime().title_english || anime().title }}</h3>
      <p>{{ anime().episodes ? anime().episodes + ' episodes' : 'Series & films' }}<span class="caption-arrow">↗</span></p>
    </div>
  `,
})
export class AnimeCardComponent {
  readonly anime = input.required<AnimeEntry>();
  readonly rank = input<number | null>(null);
  readonly eager = input(false);
  readonly image = computed(() => animeImage(this.anime()));
}
