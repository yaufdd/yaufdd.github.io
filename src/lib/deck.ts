/** Marks the dot of the slide that crosses the middle of the screen (`aria-current`), as the reader scrolls. */
export function startDeck(deck: HTMLElement): void {
  const slides = [...deck.querySelectorAll<HTMLElement>(':scope > .slide')];
  const dots = [...document.querySelectorAll<HTMLAnchorElement>('.deck-dots a')];
  const mark = (id: string) => {
    for (const dot of dots) {
      if (dot.getAttribute('href') === `#${id}`) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) mark(entry.target.id);
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  for (const slide of slides) observer.observe(slide);
}
