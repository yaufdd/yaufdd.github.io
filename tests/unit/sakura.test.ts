import { describe, expect, it } from 'vitest';
import { addPetals, createPetal, petalOpacity, SAKURA, spawnCount, stepPetal, type Petal } from '../../src/lib/sakura';

/** Deterministic stand-in for Math.random. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const petal = (overrides: Partial<Petal> = {}): Petal => ({ ...createPetal(100, 100, 0, 0, sequence(0.5)), ...overrides });

describe('spawnCount', () => {
  it('drops one petal for every SAKURA.spacing pixels the pointer travels, carrying the remainder over', () => {
    expect(spawnCount(SAKURA.spacing * 0.5, 0)).toEqual({ count: 0, carry: SAKURA.spacing * 0.5 });
    expect(spawnCount(SAKURA.spacing * 0.5, SAKURA.spacing * 0.5)).toEqual({ count: 1, carry: 0 });
  });
  it('never drops more than a few petals for one fast movement', () => {
    expect(spawnCount(SAKURA.spacing * 50, 0).count).toBe(SAKURA.burst);
    expect(spawnCount(SAKURA.spacing * 50, 0).carry).toBe(0);
  });
});

describe('createPetal', () => {
  it('starts near the pointer, drifting with it and popping up a little', () => {
    const p = createPetal(200, 300, 400, 0, sequence(0.5));
    expect(Math.hypot(p.x - 200, p.y - 300)).toBeLessThanOrEqual(8);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vy).toBeLessThan(0);
    expect(p.life).toBeGreaterThanOrEqual(SAKURA.life[0]);
    expect(p.life).toBeLessThanOrEqual(SAKURA.life[1]);
  });
  it('is mostly single petals with an occasional whole blossom', () => {
    expect(createPetal(0, 0, 0, 0, sequence(0.05, 0.5)).kind).toBe('blossom');
    expect(createPetal(0, 0, 0, 0, sequence(0.9, 0.5)).kind).toBe('petal');
  });
});

describe('stepPetal', () => {
  it('falls under gravity, spins and ages', () => {
    const p = petal({ vy: 0, spin: 2 });
    const { y, angle } = p;
    for (let i = 0; i < 30; i++) stepPetal(p, 1 / 60);
    expect(p.y).toBeGreaterThan(y);
    expect(p.angle).not.toBe(angle);
    expect(p.age).toBeCloseTo(0.5, 5);
  });
  it('reports a petal as gone once its life is over', () => {
    const p = petal({ life: 1 });
    expect(stepPetal(p, 0.5)).toBe(true);
    expect(stepPetal(p, 0.6)).toBe(false);
  });
});

describe('petalOpacity', () => {
  it('fades in quickly, then out towards the end of its life', () => {
    expect(petalOpacity(petal({ age: 0, life: 2 }))).toBe(0);
    expect(petalOpacity(petal({ age: 0.5, life: 2 }))).toBe(1);
    expect(petalOpacity(petal({ age: 1.8, life: 2 }))).toBeLessThan(0.5);
    expect(petalOpacity(petal({ age: 2, life: 2 }))).toBe(0);
  });
});

describe('addPetals', () => {
  it('keeps at most SAKURA.max petals, dropping the oldest', () => {
    const old = Array.from({ length: SAKURA.max }, (_, i) => petal({ x: i }));
    const fresh = [petal({ x: -1 }), petal({ x: -2 })];
    const all = addPetals(old, fresh);
    expect(all).toHaveLength(SAKURA.max);
    expect(all.at(-1)!.x).toBe(-2);
    expect(all[0]!.x).toBe(2);
  });
});
