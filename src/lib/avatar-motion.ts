/** Pure motion maths for the home page 3D avatar (no three.js here, so it is unit-testable). */

export const LOOK = { maxYaw: 0.6, maxPitch: 0.22 } as const;
export const JUMP = { height: 0.12, seconds: 0.9 } as const;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Head/body turn towards the pointer, relative to the avatar's centre and scaled by the viewport size. */
export function pointerToLook(
  clientX: number,
  clientY: number,
  rect: Box,
  viewport: { width: number; height: number },
): { yaw: number; pitch: number } {
  const dx = (clientX - (rect.left + rect.width / 2)) / (viewport.width / 2);
  const dy = (clientY - (rect.top + rect.height / 2)) / (viewport.height / 2);
  return {
    yaw: clamp(dx * LOOK.maxYaw, -LOOK.maxYaw, LOOK.maxYaw) + 0,
    pitch: clamp(dy * LOOK.maxPitch, -LOOK.maxPitch, LOOK.maxPitch) + 0,
  };
}

/** Exponential smoothing towards `target`; frame-rate independent. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

/** Gentle idle: a little bob, breathing and side-to-side sway. */
export function idlePose(t: number): { y: number; scaleY: number; sway: number } {
  return {
    y: Math.sin(t * 1.6) * 0.012,
    scaleY: 1 + Math.sin(t * 2.4) * 0.006,
    sway: Math.sin(t * 0.7) * 0.05,
  };
}

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/** A hop with a full turn; `progress` runs 0..1 over JUMP.seconds. */
export function jumpPose(progress: number): { y: number; spin: number } {
  const p = clamp(progress, 0, 1);
  return { y: 4 * JUMP.height * p * (1 - p), spin: easeInOut(p) * Math.PI * 2 };
}
