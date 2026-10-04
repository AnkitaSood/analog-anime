import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { map } from 'rxjs';
import { AuthService } from '@/shared/auth/auth.service';
import { safeRedirect } from '@/shared/auth/redirect';
import { ZardButtonComponent } from '@/shared/components/button';
import { SiteFooterComponent } from '@/shared/layout/site-footer.component';
import { SiteHeaderComponent } from '@/shared/layout/site-header.component';

export const routeMeta: RouteMeta = {
  title: 'Sign in — Anime Index',
  meta: [{ name: 'description', content: 'Sign in to save your favorite anime.' }],
};

type Mode = 'sign-in' | 'sign-up';

// Better Auth's default minimum.
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-sign-in',
  imports: [SiteFooterComponent, SiteHeaderComponent, ZardButtonComponent],
  template: `
    <div class="site-shell">
      <app-site-header />

      <main id="top">
        <section class="auth-panel" aria-labelledby="auth-title">
          <span class="section-kicker">{{ isSignUp() ? 'JOIN ANIME INDEX' : 'WELCOME BACK' }}</span>
          <h1 id="auth-title">{{ isSignUp() ? 'Create an account' : 'Sign in' }}<span class="period">.</span></h1>
          <p>Save your favorite anime and keep up with news.</p>

          <form class="auth-form" (submit)="submit($event)" novalidate>
            @if (isSignUp()) {
              <label class="auth-field">
                <span class="filter-label">Name</span>
                <input name="name" autocomplete="name" required [value]="name()" (input)="name.set(valueOf($event))" />
              </label>
            }
            <label class="auth-field">
              <span class="filter-label">Email</span>
              <input name="email" type="email" autocomplete="email" required [value]="email()" (input)="email.set(valueOf($event))" />
            </label>
            <label class="auth-field">
              <span class="filter-label">Password</span>
              <input
                name="password"
                type="password"
                [attr.autocomplete]="isSignUp() ? 'new-password' : 'current-password'"
                [attr.minlength]="isSignUp() ? minPasswordLength : null"
                required
                [value]="password()"
                (input)="password.set(valueOf($event))"
              />
              @if (isSignUp()) { <span class="auth-hint">At least {{ minPasswordLength }} characters.</span> }
            </label>

            @if (error()) { <p class="auth-error" role="alert">{{ error() }}</p> }

            <button type="submit" z-button zSize="lg" [zLoading]="submitting()" [disabled]="submitting()">
              {{ submitting() ? 'One moment…' : isSignUp() ? 'Create account' : 'Sign in' }}
            </button>
          </form>

          <p class="auth-switch">
            {{ isSignUp() ? 'Already have an account?' : 'New here?' }}
            <button type="button" (click)="switchMode()">{{ isSignUp() ? 'Sign in' : 'Create an account' }}</button>
          </p>
        </section>
      </main>

      <app-site-footer />
    </div>
  `,
})
export default class SignInPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly redirect = computed(() => safeRedirect(this.params().get('redirect')));

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly mode = toSignal(this.route.queryParamMap.pipe(map((params): Mode => (params.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in'))), { requireSync: true });
  readonly isSignUp = computed(() => this.mode() === 'sign-up');
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly submitting = signal(false);

  constructor() {
    // Covers arriving here already signed in, as well as finishing sign-in or sign-up.
    effect(() => {
      if (this.auth.status() === 'signed-in') this.router.navigateByUrl(this.redirect(), { replaceUrl: true });
    });
  }

  valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  switchMode(): void {
    this.error.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: this.isSignUp() ? null : 'sign-up' }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;

    const name = this.name().trim();
    const email = this.email().trim();
    const password = this.password();
    const problem = this.validate(name, email, password);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    try {
      const error = this.isSignUp() ? await this.auth.signUp(name, email, password) : await this.auth.signIn(email, password);
      // On success the session updates and the effect above navigates away.
      if (error) this.error.set(error);
    } catch {
      this.error.set('Something went wrong. Check your connection and try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  private validate(name: string, email: string, password: string): string {
    if (this.isSignUp() && !name) return 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Enter your password.';
    if (this.isSignUp() && password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
    return '';
  }
}
