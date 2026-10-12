/** On <html> when entrance animations may run: JavaScript is on and the user has not asked for reduced motion. */
export const MOTION_CLASS = 'motion';
/** Added by startMotion() once everything is wired up; until then CSS keeps a timed fallback that reveals content. */
export const MOTION_READY_CLASS = 'motion-ready';

/** Inlined into <head> next to the theme script so hidden start states apply before the first paint. */
export const motionInitScript = `(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('${MOTION_CLASS}');}catch(e){}})();`;

export type ScreenLineKind = 'cmd' | 'ok' | 'out';

/** How a line of a project's terminal screen is coloured: commands bright, "✓" results in the accent, the rest muted. */
export function screenLineKind(line: string): ScreenLineKind {
  if (line.startsWith('$')) return 'cmd';
  if (line.startsWith('✓')) return 'ok';
  return 'out';
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function typeInto(el: HTMLElement, text: string, msPerChar: number): Promise<void> {
  el.textContent = '';
  for (const char of text) {
    el.textContent += char;
    await sleep(msPerChar);
  }
}

/**
 * Browser side of the entrance animations. Everything that can fail is set up first; only then, in one step,
 * the typed text is cleared and MOTION_READY_CLASS is set. If anything throws before that, the server-rendered
 * text stays and the CSS fallback reveals hidden elements after a few seconds.
 */
export function startMotion(root: HTMLElement = document.documentElement): void {
  if (!root.classList.contains(MOTION_CLASS)) return;

  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );
  const screens = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        screens.unobserve(entry.target);
        void typeScreen(entry.target as HTMLElement);
      }
    },
    { threshold: 0.4 },
  );

  const typed = [...document.querySelectorAll<HTMLElement>('[data-type]')].map((el) => ({ el, text: el.textContent ?? '' }));
  const screenEls = [...document.querySelectorAll<HTMLElement>('[data-screen]')];
  const lines = screenEls.map((screen) => [...screen.children].map((line) => ({ el: line as HTMLElement, text: line.textContent ?? '' })));
  const screenLines = new Map(screenEls.map((screen, i) => [screen, lines[i] ?? []]));

  async function typeScreen(screen: HTMLElement) {
    for (const line of screenLines.get(screen) ?? []) {
      await typeInto(line.el, line.text, 16);
      await sleep(140);
    }
  }

  // Commit point: from here on the page is animated.
  for (const { el } of typed) el.textContent = '';
  for (const { el } of lines.flat()) el.textContent = '';
  root.classList.add(MOTION_READY_CLASS);
  document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));
  screenEls.forEach((el) => screens.observe(el));

  void (async () => {
    const [prompt, ...outputs] = typed;
    if (prompt) await typeInto(prompt.el, prompt.text, 60);
    await sleep(120);
    for (const line of outputs) await typeInto(line.el, line.text, 14);
  })();
}
