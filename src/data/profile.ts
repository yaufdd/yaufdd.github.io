import type { UIKey } from '../i18n/ui';

export interface StackGroup {
  label: UIKey;
  items: readonly string[];
}

export const stackGroups: readonly StackGroup[] = [
  { label: 'stack.backend', items: ['Go', 'PostgreSQL', 'Redis', 'Python'] },
  { label: 'stack.frontend', items: ['React', 'TypeScript', 'Vite', 'Astro'] },
  { label: 'stack.infra', items: ['Docker', 'Traefik', 'GitHub Actions', 'Linux'] },
  { label: 'stack.aiProduct', items: ['YandexGPT', 'Yandex Vision OCR', 'Qwen3'] },
  { label: 'stack.aiTools', items: ['Claude Code', 'MCP', 'Serena', 'Context7', 'Playwright'] },
];

/** `email: null` hides the address on the About page until the owner decides to publish one. */
export const contacts: { github: string; email: string | null } = {
  github: 'https://github.com/yaufdd',
  email: null,
};
