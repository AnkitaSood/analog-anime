import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideExternalLink, lucideLogIn, lucideLogOut, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { AuthService } from '@/shared/auth/auth.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-site-header',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  viewProviders: [provideIcons({ lucideExternalLink, lucideLogIn, lucideLogOut, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <a class="wordmark" routerLink="/" aria-label="Anime Index home">
        <span class="brand-mark"><span></span><span></span><span></span></span>
        <span>anime<span class="wordmark-light">index</span></span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a routerLink="/browse" routerLinkActive="is-active" ariaCurrentWhenActive="page">Browse</a>
        <a routerLink="/favorites" routerLinkActive="is-active" ariaCurrentWhenActive="page">Favorites</a>
      </nav>
      <div class="header-actions">
        <button type="button" class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="toggleLabel()" [attr.title]="toggleLabel()">
          <ng-icon [name]="theme.isDark() ? 'lucideSun' : 'lucideMoon'" />
        </button>
        <a class="mal-link" href="https://myanimelist.net/topanime.php" target="_blank" rel="noreferrer">
          <span>MyAnimeList</span><ng-icon name="lucideExternalLink" />
        </a>
        @switch (auth.status()) {
          @case ('signed-in') {
            <button type="button" class="account-link" (click)="signOut()" [attr.title]="'Signed in as ' + auth.user()?.email">
              <span>Sign out</span><ng-icon name="lucideLogOut" />
            </button>
          }
          @case ('signed-out') {
            <a class="account-link" routerLink="/sign-in" [queryParams]="{ redirect: router.url }">
              <span>Sign in</span><ng-icon name="lucideLogIn" />
            </a>
          }
        }
      </div>
    </header>
  `,
})
export class SiteHeaderComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    // Favorites are private, so don't leave them on screen.
    if (this.router.url.startsWith('/favorites')) await this.router.navigateByUrl('/');
  }

  protected toggleLabel(): string {
    return this.theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode';
  }
}
