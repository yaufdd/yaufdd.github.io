import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { addStudioLight, createCamera, tuneRenderer } from '../../src/lib/avatar-stage';

function figureWithMesh() {
  const figure = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.3), new THREE.MeshStandardMaterial());
  mesh.position.y = 0.5;
  figure.add(mesh);
  return { figure, mesh };
}

function studio() {
  const scene = new THREE.Scene();
  const { figure, mesh } = figureWithMesh();
  scene.add(figure);
  const environment = new THREE.Texture();
  const light = addStudioLight(THREE, scene, figure, environment);
  const contact = scene.getObjectByName('contact-shadow') as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  return { scene, figure, mesh, environment, light, contact };
}

describe('createCamera', () => {
  it('frames the 1-unit figure with its feet at 10% and its head at 90% of the frame height', () => {
    const camera = createCamera(THREE, 437 / 728);
    camera.updateMatrixWorld();
    expect(new THREE.Vector3(0, 0, 0).project(camera).y).toBeCloseTo(-0.8, 2);
    expect(new THREE.Vector3(0, 1, 0).project(camera).y).toBeCloseTo(0.8, 2);
    expect(new THREE.Vector3(0, 0.5, 0).project(camera).x).toBeCloseTo(0, 5);
  });
});

describe('tuneRenderer', () => {
  it('uses neutral tone mapping (ACES washed skin and the white T-shirt out) and turns shadows on', () => {
    const renderer = { outputColorSpace: '', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 2, shadowMap: { enabled: false, type: THREE.BasicShadowMap } };
    tuneRenderer(THREE, renderer as unknown as THREE.WebGLRenderer);
    expect(renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
    expect(renderer.toneMapping).toBe(THREE.NeutralToneMapping);
    expect(renderer.toneMappingExposure).toBe(1);
    expect(renderer.shadowMap.enabled).toBe(true);
  });
});

describe('addStudioLight', () => {
  it('dims the ambient room light so a directional key light shapes the figure', () => {
    const { scene, environment } = studio();
    expect(scene.environment).toBe(environment);
    expect(scene.environmentIntensity).toBeLessThan(0.5);
    const lights = scene.children.filter((o): o is THREE.DirectionalLight => o instanceof THREE.DirectionalLight);
    const key = lights.find((l) => l.castShadow);
    expect(key, 'a shadow-casting key light').toBeDefined();
    expect(key!.position.x, 'key light from the left').toBeLessThan(0);
    expect(key!.position.z, 'key light in front').toBeGreaterThan(0);
    expect(lights.some((l) => l.position.z < 0), 'a rim light from behind').toBe(true);
  });

  it('makes the figure cast shadows onto itself', () => {
    const { mesh } = studio();
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it('puts a soft contact shadow flat on the floor under the feet, outside the figure so it stays on the ground', () => {
    const { figure, contact } = studio();
    expect(contact).toBeDefined();
    expect(contact.parent).not.toBe(figure);
    expect(contact.position.y).toBeGreaterThanOrEqual(0);
    expect(contact.position.y).toBeLessThan(0.01);
    expect(new THREE.Vector3(0, 0, 1).applyQuaternion(contact.quaternion).y).toBeCloseTo(1, 5);
    expect(contact.material.transparent).toBe(true);
    expect(contact.material.depthWrite).toBe(false);
  });

  it('shrinks and fades the contact shadow while the figure is in the air, and restores it on landing', () => {
    const { light, contact } = studio();
    const ground = { scale: contact.scale.x, opacity: contact.material.opacity };
    light.setLift(0.12);
    expect(contact.scale.x).toBeLessThan(ground.scale);
    expect(contact.material.opacity).toBeLessThan(ground.opacity);
    expect(contact.material.opacity).toBeGreaterThan(0);
    light.setLift(0);
    expect(contact.scale.x).toBe(ground.scale);
    expect(contact.material.opacity).toBe(ground.opacity);
  });
});
