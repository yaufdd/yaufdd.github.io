import type * as Three from 'three';

/**
 * Camera and studio light for the 3D avatar, shared by the live viewer (src/lib/avatar-viewer.ts) and the
 * still renders (scripts/render-avatar-stills.mjs), so the poster and the head icon look exactly like the live figure.
 * three.js is passed in: the viewer imports it lazily, and the stills script loads this file in a browser with
 * its types stripped (keep to erasable TypeScript: no enums, no runtime imports).
 */
type ThreeModule = typeof Three;

/** The 1-unit-tall figure (feet at y = 0) fills 80% of the frame height, centred. */
export function createCamera(THREE: ThreeModule, aspect: number): Three.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(26, aspect, 0.1, 20);
  camera.position.set(0, 0.5, 1.25 / (2 * Math.tan(THREE.MathUtils.degToRad(13))));
  camera.lookAt(0, 0.5, 0);
  return camera;
}

/** Neutral tone mapping keeps the skin and the white T-shirt from washing out (ACES did). */
export function tuneRenderer(THREE: ThreeModule, renderer: Three.WebGLRenderer): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
}

export interface Studio {
  /** Shrinks and fades the floor shadow while the figure is `y` units off the ground (jumps). */
  setLift(y: number): void;
}

const CONTACT = { radius: 0.32, opacity: 0.38 } as const;

/** A black disc whose alpha falls off from the centre: 1 → 0.45 at half the radius → 0 at the edge. */
function contactShadowTexture(THREE: ThreeModule, size = 128): Three.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const alpha = r < 0.5 ? 1 - 1.1 * r : Math.max(0, 0.9 * (1 - r));
      data[(y * size + x) * 4 + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Studio look modelled on the owner's reference render: a dim room, a warm key light from the front left that
 * casts soft shadows onto the figure itself (hair on the forehead, hood under the chin), a weak cool fill,
 * a rim light from behind, and a soft contact shadow on the floor.
 */
export function addStudioLight(THREE: ThreeModule, scene: Three.Scene, figure: Three.Object3D, environment: Three.Texture): Studio {
  scene.environment = environment;
  scene.environmentIntensity = 0.35;

  const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
  key.position.set(-1.6, 2.6, 2.4);
  key.target.position.set(0, 0.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -0.6, right: 0.6, top: 1.2, bottom: -0.2, near: 0.1, far: 10 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 4;

  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(2, 1, 1.5);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(0.8, 1.8, -2.5);
  scene.add(key, key.target, fill, rim);

  figure.traverse((object) => {
    if ((object as Three.Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const material = new THREE.MeshBasicMaterial({ color: 0x000000, map: contactShadowTexture(THREE), transparent: true, opacity: CONTACT.opacity, depthWrite: false });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(CONTACT.radius * 2, CONTACT.radius * 2), material);
  contact.name = 'contact-shadow';
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.001;
  scene.add(contact);

  return {
    setLift(y) {
      const lift = Math.max(0, y);
      contact.scale.setScalar(1 / (1 + 2.5 * lift));
      material.opacity = CONTACT.opacity / (1 + 5 * lift);
    },
  };
}
