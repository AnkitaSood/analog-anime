import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideExternalLink, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-site-header',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  viewProviders: [provideIcons({ lucideExternalLink, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <a class="wordmark" routerLink="/" aria-label="Anime Index home">
        <span class="brand-mark"><span></span><span></span><span></span></span>
        <span>anime<span class="wordmark-light">index</span></span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a routerLink="/" fragment="top-anime">Top anime</a>
        <a routerLink="/" fragment="recommendations">Community picks</a>
        <a routerLink="/browse" routerLinkActive="is-active" ariaCurrentWhenActive="page">Browse</a>
      </nav>
      <div class="header-actions">
        <button type="button" class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="toggleLabel()" [attr.title]="toggleLabel()">
          <ng-icon [name]="theme.isDark() ? 'lucideSun' : 'lucideMoon'" />
        </button>
        <a class="mal-link" href="https://myanimelist.net/topanime.php" target="_blank" rel="noreferrer">
          <span>MyAnimeList</span><ng-icon name="lucideExternalLink" />
        </a>
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {
  protected readonly theme = inject(ThemeService);

  protected toggleLabel(): string {
    return this.theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode';
  }
}
