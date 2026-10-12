import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface GltfNode {
  name?: string;
  children?: number[];
  translation?: number[];
}

/** The glTF JSON chunk of a .glb (header: magic, version, length; then chunk length, chunk type, chunk data). */
function gltfJson(path: string): { nodes: GltfNode[]; scenes: { nodes: number[] }[] } {
  const glb = readFileSync(path);
  expect(glb.toString('ascii', 0, 4)).toBe('glTF');
  const length = glb.readUInt32LE(12);
  return JSON.parse(glb.toString('utf8', 20, 20 + length));
}

describe('public/models/avatar.glb', () => {
  const { nodes, scenes } = gltfJson('public/models/avatar.glb');
  const byName = (name: string) => nodes.findIndex((n) => n.name === name);

  it('has a separate head held by a "neck" pivot, so the head can turn on its own', () => {
    const neck = nodes[byName('neck')];
    expect(neck, 'neck node').toBeDefined();
    expect(neck!.children).toEqual([byName('head')]);
    expect(scenes[0]!.nodes).toContain(byName('neck'));
    expect(scenes[0]!.nodes).toContain(byName('body'));
  });

  it('pivots the head at the neck: centred, at about half the 1-unit height', () => {
    const [x, y] = nodes[byName('neck')]!.translation ?? [0, 0, 0];
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeGreaterThan(0.5);
    expect(y).toBeLessThan(0.56);
  });
});
