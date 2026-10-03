import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <a class="wordmark footer-wordmark" routerLink="/"><span class="brand-mark"><span></span><span></span><span></span></span><span>anime<span class="wordmark-light">index</span></span></a>
      <p>Find the story you didn’t know you needed.</p>
      <span class="data-credit">Anime data by <a href="https://github.com/LucasHenriqueDiniz/jikan-edge" target="_blank" rel="noreferrer">jikan-edge</a><span class="credit-divider">·</span> Images & rankings by MyAnimeList</span>
    </footer>
  `,
})
export class SiteFooterComponent {}
