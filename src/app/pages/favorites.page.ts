import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideCompass, lucideHeart, lucideLogIn } from '@ng-icons/lucide';
import { FavoriteCardComponent } from '@/shared/anime/favorite-card.component';
import { FavoritesService } from '@/shared/anime/favorites.service';
import { AuthService } from '@/shared/auth/auth.service';
import { ZardButtonComponent } from '@/shared/components/button';
import { SiteFooterComponent } from '@/shared/layout/site-footer.component';
import { SiteHeaderComponent } from '@/shared/layout/site-header.component';

export const routeMeta: RouteMeta = {
  title: 'Your favorites — Anime Index',
  meta: [{ name: 'description', content: 'The anime you’ve saved, all in one place.' }],
};

@Component({
  selector: 'app-favorites',
  imports: [FavoriteCardComponent, NgIcon, RouterLink, SiteFooterComponent, SiteHeaderComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideArrowRight, lucideCompass, lucideHeart, lucideLogIn })],
  template: `
    <div class="site-shell">
      <app-site-header />

      <main id="top">
        <section class="browse-intro" aria-labelledby="favorites-title">
          <span class="section-kicker">YOUR COLLECTION</span>
          <h1 id="favorites-title">Favorites<span class="period">.</span></h1>
          <p>Every series and film you’ve saved. Tap the heart on any poster to add or remove it.</p>
        </section>

        <section class="content-section" aria-labelledby="favorites-label">
          <div class="section-heading">
            <div class="section-title-wrap">
              <span class="section-kicker" id="favorites-label">SAVED</span>
            </div>
            @if (favorites.ready()) {
              <span class="result-count">{{ countLabel() }}</span>
            }
          </div>

          @if (auth.status() === 'signed-out') {
            <div class="empty-state">
              <span class="empty-icon"><ng-icon name="lucideHeart" /></span>
              <h3>Sign in to see your favorites</h3>
              <p>Sign in to save your favorite anime and keep up with news.</p>
              <div class="empty-actions">
                <a z-button routerLink="/sign-in" [queryParams]="{ redirect: '/favorites' }"><ng-icon name="lucideLogIn" /> Sign in</a>
                <a z-button zType="outline" routerLink="/sign-in" [queryParams]="{ mode: 'sign-up', redirect: '/favorites' }">Create an account</a>
              </div>
            </div>
          } @else if (favorites.status() === 'error') {
            <div class="empty-state"><span class="empty-icon"><ng-icon name="lucideCompass" /></span><h3>Your favorites couldn’t load.</h3><p>Check your connection and try again.</p><button type="button" z-button zType="outline" (click)="favorites.load()">Try again <ng-icon name="lucideArrowRight" /></button></div>
          } @else if (!favorites.ready()) {
            <div class="favorite-list" aria-label="Loading favorites" aria-busy="true">
              @for (placeholder of placeholders; track placeholder) {
                <div class="favorite-card favorite-skeleton">
                  <div class="favorite-poster"><div class="poster-wrap skeleton-shimmer"></div></div>
                  <div class="favorite-synopsis"><span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-short"></span></div>
                </div>
              }
            </div>
          } @else if (favorites.favorites().length) {
            <div class="favorite-list">
              @for (anime of favorites.favorites(); track anime.malId; let i = $index) {
                <article app-favorite-card [anime]="anime" [eager]="i < 2"></article>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="empty-icon"><ng-icon name="lucideHeart" /></span>
              <h3>Nothing saved yet</h3>
              <p>Find something you love and tap the heart on its poster.</p>
              <a z-button zType="outline" routerLink="/browse">Browse anime <ng-icon name="lucideArrowRight" /></a>
            </div>
          }
        </section>
      </main>

      <app-site-footer />
    </div>
  `,
})
export default class FavoritesPage {
  protected readonly favorites = inject(FavoritesService);
  protected readonly auth = inject(AuthService);
  protected readonly placeholders = [1, 2];
  protected readonly countLabel = computed(() => {
    const count = this.favorites.favorites().length;
    return `${count} ${count === 1 ? 'title' : 'titles'}`;
  });
}
