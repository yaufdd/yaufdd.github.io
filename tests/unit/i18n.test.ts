import { describe, expect, it } from 'vitest';
import { ui } from '../../src/i18n/ui';
import {
  formatPeriod,
  formatTeam,
  formatYearMonth,
  isLocale,
  localizePath,
  otherLocale,
  t,
  toLocale,
} from '../../src/i18n/utils';

describe('localizePath', () => {
  it.each([
    ['ja', '', '/'],
    ['en', '', '/en/'],
    ['ja', 'projects/visa-docs/', '/projects/visa-docs/'],
    ['en', 'projects/visa-docs/', '/en/projects/visa-docs/'],
    ['en', '/about', '/en/about/'],
    ['ja', '#projects', '/#projects'],
    ['en', '#projects', '/en/#projects'],
    ['en', 'about#workflow', '/en/about/#workflow'],
    ['ja', 'about/#workflow', '/about/#workflow'],
  ] as const)('(%s, %j) → %s', (locale, path, expected) => {
    expect(localizePath(locale, path)).toBe(expected);
  });
});

describe('locale helpers', () => {
  it('recognises supported locales only', () => {
    expect(isLocale('ja')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
  it('falls back to Japanese for unknown or missing locales', () => {
    expect(toLocale(undefined)).toBe('ja');
    expect(toLocale('fr')).toBe('ja');
    expect(toLocale('en')).toBe('en');
  });
  it('flips between the two locales', () => {
    expect(otherLocale('ja')).toBe('en');
    expect(otherLocale('en')).toBe('ja');
  });
});

describe('t', () => {
  it('returns the string for the locale', () => {
    expect(t('ja', 'project.live')).toBe('サイトを見る');
    expect(t('en', 'project.live')).toBe('Visit site');
  });
  it('interpolates variables', () => {
    expect(t('en', 'project.teamMany', { n: 3 })).toBe('3 people');
    expect(t('ja', 'project.teamMany', { n: 3 })).toBe('3人');
  });
});

describe('dictionaries', () => {
  it('ja and en define the same non-empty keys', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ja).sort());
    for (const [locale, dict] of Object.entries(ui)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });
});

describe('dates and team', () => {
  it('formats year-month per locale', () => {
    expect(formatYearMonth('2026-04', 'ja')).toBe('2026年4月');
    expect(formatYearMonth('2026-12', 'en')).toBe('Dec 2026');
  });
  it('formats open and closed periods', () => {
    expect(formatPeriod({ start: '2026-04', end: null }, 'ja')).toBe('2026年4月 〜 現在');
    expect(formatPeriod({ start: '2026-04', end: null }, 'en')).toBe('Apr 2026 – present');
    expect(formatPeriod({ start: '2026-03', end: '2026-04' }, 'ja')).toBe('2026年3月 〜 2026年4月');
    expect(formatPeriod({ start: '2026-03', end: '2026-04' }, 'en')).toBe('Mar 2026 – Apr 2026');
  });
  it('formats team size', () => {
    expect(formatTeam(1, 'ja')).toBe('1人（個人開発）');
    expect(formatTeam(1, 'en')).toBe('Solo');
    expect(formatTeam(3, 'en')).toBe('3 people');
  });
});
