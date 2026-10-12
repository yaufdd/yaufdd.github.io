#!/usr/bin/env node
// Renders the 3D avatar's still image with the live viewer's own camera and studio light (src/lib/avatar-stage.ts):
//   src/assets/avatar-poster.png — the whole figure, shown until the 3D view is ready (and without JS or WebGL)
// Re-run after changing the model, the camera or the light: node scripts/render-avatar-stills.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const three = join(root, 'node_modules/three');

const shots = [
  // Same framing as the live viewer (createCamera), at the poster's size.
  { name: 'poster', out: 'src/assets/avatar-poster.png', width: 437, height: 728 },
];

const page = `<!doctype html>
<meta charset="utf-8">
<style>html, body { margin: 0; background: transparent } canvas { display: block }</style>
<script type="importmap">{ "imports": { "three": "/three/build/three.module.js", "three/examples/jsm/": "/three/examples/jsm/" } }</script>
<script type="module">
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
  import { addStudioLight, createCamera, tuneRenderer } from '/stage.js';

  window.render = async ({ width, height }) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(2); // supersampled: the screenshot is taken at 1x
    renderer.setSize(width, height);
    tuneRenderer(THREE, renderer);
    document.body.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const figure = new THREE.Group();
    figure.add((await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/avatar.glb')).scene);
    scene.add(figure);
    addStudioLight(THREE, scene, figure, new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture);

    renderer.render(scene, createCamera(THREE, width / height));
  };
</script>`;

const types = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  try {
    let body;
    let type = types[extname(pathname)] ?? 'application/octet-stream';
    if (pathname === '/') [body, type] = [page, 'text/html'];
    else if (pathname === '/stage.js') body = stripTypeScriptTypes(await readFile(join(root, 'src/lib/avatar-stage.ts'), 'utf8'));
    else if (pathname === '/avatar.glb') body = await readFile(join(root, 'public/models/avatar.glb'));
    else if (pathname.startsWith('/three/')) {
      const file = normalize(join(three, decodeURIComponent(pathname.slice('/three/'.length))));
      if (!file.startsWith(three)) throw new Error('outside three');
      body = await readFile(file);
    } else throw new Error('not found');
    res.writeHead(200, { 'content-type': type }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const { port } = server.address();

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  const tab = await browser.newPage();
  tab.on('pageerror', (error) => console.error('page error:', error.message));
  for (const shot of shots) {
    await tab.setViewportSize({ width: shot.width, height: shot.height });
    await tab.goto(`http://127.0.0.1:${port}/`);
    await tab.waitForFunction(() => typeof window.render === 'function');
    await tab.evaluate((options) => window.render(options), shot);
    await tab.locator('canvas').screenshot({ path: join(root, shot.out), omitBackground: true });
    console.log(`✓ ${shot.out} (${shot.width}×${shot.height})`);
  }
} finally {
  await browser.close();
  server.close();
}
