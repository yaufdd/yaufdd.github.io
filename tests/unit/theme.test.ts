import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  parseTheme,
  readTheme,
  themeInitScript,
  writeTheme,
} from '../../src/lib/theme';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const throwingStorage = {
  getItem: (): string | null => {
    throw new DOMException('denied', 'SecurityError');
  },
  setItem: (): void => {
    throw new DOMException('full', 'QuotaExceededError');
  },
};

/** Runs the inline <head> script against fake globals and returns the applied theme. */
function runInitScript(storage: unknown): string | undefined {
  const document = { documentElement: { dataset: {} as Record<string, string> } };
  new Function('localStorage', 'document', themeInitScript)(storage, document);
  return document.documentElement.dataset.theme;
}

describe('parseTheme', () => {
  it('accepts every known theme', () => {
    for (const theme of THEMES) expect(parseTheme(theme)).toBe(theme);
  });
  it.each([null, undefined, '', 'dark', 'DIM', 42])('falls back to dim for %j', (value) => {
    expect(parseTheme(value)).toBe('dim');
  });
});

describe('readTheme / writeTheme', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    writeTheme(storage, 'paper');
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe('paper');
    expect(readTheme(storage)).toBe('paper');
  });
  it('uses the default without storage', () => {
    expect(readTheme(null)).toBe(DEFAULT_THEME);
    expect(() => writeTheme(null, 'light')).not.toThrow();
  });
  it('survives storage that throws', () => {
    expect(readTheme(throwingStorage)).toBe('dim');
    expect(() => writeTheme(throwingStorage, 'light')).not.toThrow();
  });
});

describe('themeInitScript', () => {
  it('applies the stored theme', () => {
    expect(runInitScript(memoryStorage({ [THEME_STORAGE_KEY]: 'paper' }))).toBe('paper');
  });
  it('ignores unknown stored values', () => {
    expect(runInitScript(memoryStorage({ [THEME_STORAGE_KEY]: 'neon' }))).toBe('dim');
  });
  it('falls back to dim when storage throws', () => {
    expect(runInitScript(throwingStorage)).toBe('dim');
  });
  it('falls back to dim when storage is missing', () => {
    expect(runInitScript(null)).toBe('dim');
  });
});
