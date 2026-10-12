import { describe, expect, it } from 'vitest';
import { MOTION_CLASS, motionInitScript } from '../../src/lib/motion';

/** Runs the inline <head> script against fake globals and returns the classes it put on <html>. */
function runInitScript(reducedMotion: boolean | 'throws'): Set<string> {
  const classes = new Set<string>();
  const document = { documentElement: { classList: { add: (name: string) => classes.add(name) } } };
  const window = {
    matchMedia: (query: string) => {
      if (reducedMotion === 'throws') throw new Error('matchMedia unavailable');
      return { matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion };
    },
  };
  new Function('window', 'document', motionInitScript)(window, document);
  return classes;
}

describe('motionInitScript', () => {
  it('opts into entrance animations by default', () => {
    expect(runInitScript(false)).toEqual(new Set([MOTION_CLASS]));
  });
  it('respects prefers-reduced-motion', () => {
    expect(runInitScript(true).size).toBe(0);
  });
  it('leaves the page static when matchMedia is unavailable', () => {
    expect(() => runInitScript('throws')).not.toThrow();
    expect(runInitScript('throws').size).toBe(0);
  });
});

