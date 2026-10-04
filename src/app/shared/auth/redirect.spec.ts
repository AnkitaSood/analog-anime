import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('follows same-site paths', () => {
    expect(safeRedirect('/browse?q=frieren')).toBe('/browse?q=frieren');
  });

  it('falls back for missing or off-site targets', () => {
    for (const value of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
      expect(safeRedirect(value)).toBe('/favorites');
    }
  });
});
