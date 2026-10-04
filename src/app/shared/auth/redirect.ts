/** Only same-site paths are followed after sign-in, so `?redirect=` can't send people off to another site. */
export function safeRedirect(value: string | null | undefined, fallback = '/favorites'): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback;
}
