export const THEMES = ['dim', 'light', 'paper'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'dim';
export const THEME_STORAGE_KEY = 'theme';

export function parseTheme(value: unknown): Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value) ? (value as Theme) : DEFAULT_THEME;
}

export function readTheme(storage: Pick<Storage, 'getItem'> | null | undefined): Theme {
  try {
    return parseTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeTheme(storage: Pick<Storage, 'setItem'> | null | undefined, theme: Theme): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked or full: the theme still applies for this page view.
  }
}

/** Even reading `window.localStorage` can throw (blocked site data), so guard the access itself. */
export function safeLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Inlined into <head> so the theme is set before the first paint; keep it dependency-free. */
export const themeInitScript = `(function(){var t='${DEFAULT_THEME}';try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(${JSON.stringify(THEMES)}.indexOf(s)>-1)t=s;}catch(e){}document.documentElement.dataset.theme=t;})();`;
