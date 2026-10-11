import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../../src/lib/theme';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function tokensFor(theme: string): Record<string, string> {
  const block = new RegExp(`:root\\[data-theme='${theme}'\\][^{]*\\{([^}]*)\\}`).exec(css);
  if (!block?.[1]) throw new Error(`No token block for theme "${theme}" in tokens.css`);
  return Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  ['fg', 'bg'], ['fg', 'card'], ['muted', 'bg'], ['muted', 'card'],
  ['accent', 'bg'], ['accent', 'card'], ['tag-fg', 'tag-bg'],
] as const;

describe.each(THEMES)('theme %s', (theme) => {
  const tokens = tokensFor(theme);
  it('defines every token', () => {
    expect(Object.keys(tokens).sort()).toEqual(['accent', 'bg', 'border', 'card', 'fg', 'muted', 'tag-bg', 'tag-fg']);
  });
  it.each(PAIRS)('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
});
