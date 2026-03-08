import { describe, it, expect } from 'vitest';

describe('SiteSettings types', () => {
  it('validates branding color format (HSL string)', () => {
    const hslPattern = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;
    
    expect('220 75% 55%').toMatch(hslPattern);
    expect('160 55% 42%').toMatch(hslPattern);
    expect('0 0% 100%').toMatch(hslPattern);
    expect('222 47% 11%').toMatch(hslPattern);
  });

  it('validates invalid HSL formats are rejected', () => {
    const hslPattern = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;
    
    expect('#ff0000').not.toMatch(hslPattern);
    expect('rgb(255,0,0)').not.toMatch(hslPattern);
    expect('red').not.toMatch(hslPattern);
  });
});

describe('Font family options', () => {
  const FONT_OPTIONS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Nunito', 'Raleway', 'Source Sans 3', 'DM Sans',
    'Space Grotesk', 'Sora',
  ];

  it('includes common web fonts', () => {
    expect(FONT_OPTIONS).toContain('Inter');
    expect(FONT_OPTIONS).toContain('Roboto');
    expect(FONT_OPTIONS).toContain('Montserrat');
  });

  it('has at least 10 options', () => {
    expect(FONT_OPTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('has no duplicates', () => {
    const unique = new Set(FONT_OPTIONS);
    expect(unique.size).toBe(FONT_OPTIONS.length);
  });
});
