import { isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { createAuthClient } from 'better-auth/client';

type AuthClient = ReturnType<typeof createAuthClient>;
export type AuthUser = AuthClient['$Infer']['Session']['user'];
export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

// Wraps Better Auth's browser client (served by /api/auth) in signals. The session is only known in the
// browser, so during server rendering the status stays 'loading'.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client: AuthClient | null = isPlatformBrowser(inject(PLATFORM_ID)) ? createAuthClient() : null;
  private readonly currentUser = signal<AuthUser | null | undefined>(undefined);

  readonly user = computed(() => this.currentUser() ?? null);
  readonly status = computed<AuthStatus>(() => {
    const user = this.currentUser();
    if (user === undefined) return 'loading';
    return user ? 'signed-in' : 'signed-out';
  });

  constructor() {
    if (!this.client) return;
    // Better Auth refreshes this store itself after sign-in, sign-up and sign-out.
    const unsubscribe = this.client.useSession.subscribe(({ data, isPending }) => {
      if (!isPending) this.currentUser.set(data?.user ?? null);
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  /** Resolves with an error message, or null on success. */
  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await this.requireClient().signIn.email({ email, password });
    return error ? (error.message ?? 'Sign-in failed. Please try again.') : null;
  }

  /** Creates the account and signs straight in. Resolves with an error message, or null on success. */
  async signUp(name: string, email: string, password: string): Promise<string | null> {
    const { error } = await this.requireClient().signUp.email({ name, email, password });
    return error ? (error.message ?? 'Couldn’t create your account. Please try again.') : null;
  }

  async signOut(): Promise<void> {
    await this.requireClient().signOut();
  }

  private requireClient(): AuthClient {
    if (!this.client) throw new Error('Authentication is only available in the browser');
    return this.client;
  }
}
