import { DEFAULT_LOCALE, LOCALES, ui, type Locale, type UIKey } from './ui';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Astro.currentLocale is `string | undefined`; anything unknown falls back to the default locale. */
export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

export function t(locale: Locale, key: UIKey, vars: Record<string, string | number> = {}): string {
  return Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), ui[locale][key]);
}

/**
 * Site URL for `locale` from a locale-neutral path; always ends the pathname with a slash.
 * localizePath('en', 'projects/visa-docs/') → '/en/projects/visa-docs/'
 * localizePath('ja', '#projects') → '/#projects'
 */
export function localizePath(locale: Locale, path: string): string {
  const url = (locale === DEFAULT_LOCALE ? '/' : `/${locale}/`) + path.replace(/^\/+/, '');
  const [pathname = '/', hash] = url.split('#', 2);
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return hash === undefined ? withSlash : `${withSlash}#${hash}`;
}

export interface Period {
  start: string;
  end: string | null;
}

export function formatYearMonth(yearMonth: string, locale: Locale): string {
  const [year = 0, month = 1] = yearMonth.split('-').map(Number);
  if (locale === 'ja') return `${year}年${month}月`;
  const name = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `${name} ${year}`;
}

export function formatPeriod(period: Period, locale: Locale): string {
  const start = formatYearMonth(period.start, locale);
  const end = period.end === null ? t(locale, 'project.present') : formatYearMonth(period.end, locale);
  return locale === 'ja' ? `${start} 〜 ${end}` : `${start} – ${end}`;
}

export function formatTeam(size: number, locale: Locale): string {
  return size === 1 ? t(locale, 'project.teamSolo') : t(locale, 'project.teamMany', { n: size });
}
