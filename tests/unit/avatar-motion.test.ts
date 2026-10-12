import { describe, expect, it } from 'vitest';
import { BLINK, bodyYawFor, damp, HEAD, headPose, idlePose, JUMP, jumpPose, LOOK, nextBlinkIn, pointerToLook } from '../../src/lib/avatar-motion';

const rect = { left: 100, top: 100, width: 200, height: 400 };
const viewport = { width: 1000, height: 800 };

describe('pointerToLook', () => {
  it('looks straight ahead when the pointer is at the avatar centre', () => {
    expect(pointerToLook(200, 300, rect, viewport)).toEqual({ yaw: 0, pitch: 0 });
  });
  it('turns towards the pointer: right of the avatar is positive yaw, below is positive pitch', () => {
    const look = pointerToLook(700, 700, rect, viewport);
    expect(look.yaw).toBeGreaterThan(0);
    expect(look.pitch).toBeGreaterThan(0);
  });
  it('never turns further than the limits, however far the pointer goes', () => {
    const far = pointerToLook(-1e6, 1e6, rect, viewport);
    expect(far.yaw).toBe(-LOOK.maxYaw);
    expect(far.pitch).toBe(LOOK.maxPitch);
  });
});

describe('damp', () => {
  it('moves towards the target without overshooting', () => {
    const next = damp(0, 1, 8, 1 / 60);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });
  it('is frame-rate independent: two half steps equal one full step', () => {
    const twoHalf = damp(damp(0, 1, 8, 1 / 120), 1, 8, 1 / 120);
    expect(twoHalf).toBeCloseTo(damp(0, 1, 8, 1 / 60), 10);
  });
});

describe('idlePose', () => {
  it('only moves gently', () => {
    for (let t = 0; t < 10; t += 0.37) {
      const pose = idlePose(t);
      expect(Math.abs(pose.y)).toBeLessThanOrEqual(0.02);
      expect(Math.abs(pose.scaleY - 1)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(pose.sway)).toBeLessThanOrEqual(0.08);
    }
  });
});

describe('jumpPose', () => {
  it('starts and ends on the ground with a full turn', () => {
    expect(jumpPose(0)).toMatchObject({ y: 0, spin: 0 });
    const end = jumpPose(1);
    expect(end.y).toBeCloseTo(0, 10);
    expect(end.spin).toBeCloseTo(Math.PI * 2, 10);
  });
  it('peaks halfway', () => {
    expect(jumpPose(0.5).y).toBeCloseTo(JUMP.height, 10);
  });
  it('clamps progress outside 0..1', () => {
    expect(jumpPose(-1)).toEqual(jumpPose(0));
    expect(jumpPose(2)).toEqual(jumpPose(1));
  });
});

describe('bodyYawFor / headPose', () => {
  it('the head leads: the body turns only part of the way and the head turns the rest', () => {
    const look = { yaw: 0.5, pitch: 0 };
    const body = bodyYawFor(look.yaw);
    expect(body).toBeGreaterThan(0);
    expect(body).toBeLessThan(look.yaw);
    expect(body + headPose(look, body).yaw).toBeCloseTo(look.yaw, 10);
  });
  it('nods down towards a pointer below, but barely tips back (further, the hair goes through the hood)', () => {
    expect(headPose({ yaw: 0, pitch: LOOK.maxPitch }, 0).pitch).toBeGreaterThan(0);
    expect(headPose({ yaw: 0, pitch: LOOK.maxPitch }, 0).pitch).toBeLessThanOrEqual(HEAD.maxPitch);
    expect(headPose({ yaw: 0, pitch: -LOOK.maxPitch }, 0).pitch).toBe(HEAD.minPitch);
    expect(HEAD.minPitch).toBeGreaterThanOrEqual(-0.08);
  });
  it('tilts a little into the turn, and not at all when looking straight ahead', () => {
    const left = headPose({ yaw: -0.5, pitch: 0 }, bodyYawFor(-0.5));
    const right = headPose({ yaw: 0.5, pitch: 0 }, bodyYawFor(0.5));
    expect(Math.sign(left.roll)).toBe(-Math.sign(right.roll));
    expect(Math.abs(right.roll)).toBeGreaterThan(0);
    expect(Math.abs(right.roll)).toBeLessThan(0.1);
    expect(headPose({ yaw: 0, pitch: 0 }, 0).roll + 0).toBe(0);
  });
});

describe('nextBlinkIn', () => {
  it('waits a natural few seconds between blinks', () => {
    for (const r of [0.2, 0.5, 0.999]) {
      const seq = [0.99, r];
      const wait = nextBlinkIn(() => seq.shift()!);
      expect(wait).toBeGreaterThanOrEqual(BLINK.minGap);
      expect(wait).toBeLessThanOrEqual(BLINK.maxGap);
    }
  });
  it('now and then blinks twice in quick succession', () => {
    expect(nextBlinkIn(() => 0)).toBe(BLINK.doubleGap);
    expect(BLINK.doubleGap).toBeLessThan(0.5);
    expect(BLINK.doubleGap).toBeGreaterThan(BLINK.seconds);
  });
  it('keeps the eyes shut only for a moment', () => {
    expect(BLINK.seconds).toBeGreaterThan(0.08);
    expect(BLINK.seconds).toBeLessThan(0.2);
  });
});
