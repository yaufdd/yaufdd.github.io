/**
 * Sakura petals that fall from the mouse pointer on the home page. Pure petal physics first (unit-tested),
 * then the canvas loop, which only runs while petals are in the air.
 */

export const SAKURA = {
  /** Pixels the pointer travels per new petal, and the most petals one movement can drop. */
  spacing: 18,
  burst: 3,
  max: 80,
  /** Px/s², and the share of speed kept per second. */
  gravity: 140,
  drag: 0.35,
  /** Seconds a petal lives: [min, max]. */
  life: [1.4, 2.2],
  /** Share of whole blossoms among single petals. */
  blossoms: 0.15,
  fadeIn: 0.1,
  fadeOutFrom: 0.6,
} as const;

export interface Petal {
  kind: 'petal' | 'blossom';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  /** Flutter (how fast the petal seems to flip) and its phase. */
  flip: number;
  phase: number;
  age: number;
  life: number;
}

/** How many petals to drop after the pointer moved `moved` px, with `carry` px left over from before. */
export function spawnCount(moved: number, carry: number): { count: number; carry: number } {
  const total = moved + carry;
  const count = Math.floor(total / SAKURA.spacing);
  if (count >= SAKURA.burst) return { count: SAKURA.burst, carry: 0 };
  return { count, carry: total - count * SAKURA.spacing };
}

/** A new petal at the pointer, drifting a little with the pointer's velocity (px/s) and popping up. */
export function createPetal(x: number, y: number, pointerVx: number, pointerVy: number, random: () => number): Petal {
  const kind = random() < SAKURA.blossoms ? 'blossom' : 'petal';
  const r = () => random() - 0.5;
  return {
    kind,
    x: x + r() * 12,
    y: y + r() * 12,
    vx: pointerVx * 0.08 + r() * 60,
    vy: pointerVy * 0.04 - (20 + random() * 60),
    angle: random() * Math.PI * 2,
    spin: r() * 6,
    size: kind === 'blossom' ? 13 + random() * 5 : 8 + random() * 5,
    flip: 3 + random() * 4,
    phase: random() * Math.PI * 2,
    age: 0,
    life: SAKURA.life[0] + random() * (SAKURA.life[1] - SAKURA.life[0]),
  };
}

/** Advances a petal by `dt` seconds (in place); false once its life is over. */
export function stepPetal(p: Petal, dt: number): boolean {
  const keep = SAKURA.drag ** dt;
  p.vx *= keep;
  p.vy = p.vy * keep + SAKURA.gravity * dt;
  p.x += (p.vx + Math.sin(p.age * 2.5 + p.phase) * 18) * dt;
  p.y += p.vy * dt;
  p.angle += p.spin * dt;
  p.age += dt;
  return p.age < p.life;
}

export function petalOpacity(p: Petal): number {
  const t = p.age / p.life;
  if (t <= 0 || t >= 1) return 0;
  if (p.age < SAKURA.fadeIn) return p.age / SAKURA.fadeIn;
  if (t > SAKURA.fadeOutFrom) return (1 - t) / (1 - SAKURA.fadeOutFrom);
  return 1;
}

/** The new petals appended, keeping only the newest SAKURA.max. */
export function addPetals(petals: Petal[], fresh: Petal[]): Petal[] {
  const all = petals.concat(fresh);
  return all.length > SAKURA.max ? all.slice(all.length - SAKURA.max) : all;
}

/** One sakura petal in a unit box: rounded, with the little notch at its tip; base at the bottom. */
function petalPath(): Path2D {
  const p = new Path2D();
  p.moveTo(0, 0.5);
  p.bezierCurveTo(-0.45, 0.2, -0.42, -0.35, -0.12, -0.5);
  p.lineTo(0, -0.36);
  p.lineTo(0.12, -0.5);
  p.bezierCurveTo(0.42, -0.35, 0.45, 0.2, 0, 0.5);
  p.closePath();
  return p;
}

/** Pre-rendered petal and blossom images (drawn once, then stamped every frame). */
function sprites(scale: number): Record<Petal['kind'], HTMLCanvasElement> {
  const make = (draw: (ctx: CanvasRenderingContext2D, s: number) => void) => {
    const s = Math.ceil(32 * scale);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(s / 2, s / 2);
    draw(ctx, s);
    return canvas;
  };
  const shape = petalPath();
  const fillPetal = (ctx: CanvasRenderingContext2D, length: number) => {
    const g = ctx.createLinearGradient(0, length / 2, 0, -length / 2);
    g.addColorStop(0, '#f48fb0');
    g.addColorStop(0.45, '#ffc2d4');
    g.addColorStop(1, '#ffe6ee');
    ctx.save();
    ctx.scale(length * 0.75, length);
    ctx.fillStyle = g;
    ctx.fill(shape);
    ctx.restore();
  };
  return {
    petal: make((ctx, s) => fillPetal(ctx, s * 0.9)),
    blossom: make((ctx, s) => {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.translate(0, -s * 0.22);
        fillPetal(ctx, s * 0.46);
        ctx.restore();
      }
      ctx.fillStyle = '#ee6f95';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd36b';
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 + 0.6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.1, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
  };
}

/** Starts the petals on a full-viewport canvas; does nothing on touch screens or with reduced motion. */
export function startSakura(canvas: HTMLCanvasElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1;
  let images = sprites(1);
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    images = sprites(dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  let petals: Petal[] = [];
  let carry = 0;
  let last: { x: number; y: number; t: number } | null = null;
  let frame = 0;
  let previous = 0;

  const draw = (now: number) => {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    petals = petals.filter((p) => stepPetal(p, dt));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of petals) {
      const image = images[p.kind];
      const size = p.size * dpr;
      ctx.globalAlpha = petalOpacity(p);
      // A falling petal seems to flip over: squash it sideways as it turns.
      const flutter = p.kind === 'petal' ? 0.35 + 0.65 * Math.abs(Math.cos(p.age * p.flip + p.phase)) : 1;
      ctx.setTransform(Math.cos(p.angle) * flutter, Math.sin(p.angle) * flutter, -Math.sin(p.angle), Math.cos(p.angle), p.x * dpr, p.y * dpr);
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    frame = petals.length > 0 ? requestAnimationFrame(draw) : 0;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      const now = performance.now();
      if (last) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        const seconds = Math.max((now - last.t) / 1000, 1 / 240);
        const spawn = spawnCount(Math.hypot(dx, dy), carry);
        carry = spawn.carry;
        const fresh = Array.from({ length: spawn.count }, () => createPetal(event.clientX, event.clientY, dx / seconds, dy / seconds, Math.random));
        if (fresh.length) petals = addPetals(petals, fresh);
      }
      last = { x: event.clientX, y: event.clientY, t: now };
      if (petals.length > 0 && !frame) {
        previous = now;
        frame = requestAnimationFrame(draw);
      }
    },
    { passive: true },
  );
}
