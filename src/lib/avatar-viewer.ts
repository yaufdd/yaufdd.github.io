import { damp, idlePose, JUMP, jumpPose, pointerToLook } from './avatar-motion';
import { addStudioLight, createCamera, tuneRenderer } from './avatar-stage';

/**
 * Lifecycle of `[data-avatar]` (exposed as data-state for CSS and tests):
 *   poster   → server-rendered still image (also the no-JS state)
 *   static   → user prefers reduced motion: keep the still image, never download three.js or the model
 *   fallback → no WebGL or loading failed: keep the still image
 *   loading  → three.js and the model are being fetched (after the page has loaded and the avatar is near view)
 *   ready    → the 3D figure is on screen and reacting
 */
type State = 'poster' | 'static' | 'fallback' | 'loading' | 'ready';

const setState = (el: HTMLElement, state: State) => {
  el.dataset.state = state;
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Resolves once the page has loaded, the browser is idle and the avatar is (nearly) in view. */
function whenWorthLoading(el: HTMLElement): Promise<void> {
  const loaded = new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
  const idle = () =>
    new Promise<void>((resolve) => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 200)));
  const visible = new Promise<void>((resolve) => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          resolve();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
  });
  return Promise.all([loaded.then(idle), visible]).then(() => undefined);
}

export async function mountAvatar(el: HTMLElement, modelUrl: string): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setState(el, 'static');
  if (!hasWebGL()) return setState(el, 'fallback');

  await whenWorthLoading(el);
  setState(el, 'loading');
  try {
    const [THREE, { GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
    ]);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    tuneRenderer(THREE, renderer);

    const scene = new THREE.Scene();
    // Framed like the poster, which scripts/render-avatar-stills.mjs renders with this same camera and light.
    const camera = createCamera(THREE, 1);

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(modelUrl);
    // Pivot at the feet so jumps and breathing scale from the ground up.
    const figure = new THREE.Group();
    figure.add(gltf.scene);
    scene.add(figure);
    const environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    const studio = addStudioLight(THREE, scene, figure, environment);

    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    el.append(canvas);

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(el);
    resize();

    const look = { yaw: 0, pitch: 0 };
    const target = { yaw: 0, pitch: 0 };
    window.addEventListener(
      'pointermove',
      (event) => {
        Object.assign(target, pointerToLook(event.clientX, event.clientY, el.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }));
      },
      { passive: true },
    );

    let jumpStart = -Infinity;
    canvas.addEventListener('click', () => {
      jumpStart = performance.now() / 1000;
      el.dataset.jumps = String(Number(el.dataset.jumps ?? '0') + 1);
    });

    let onScreen = true;
    new IntersectionObserver((entries) => (onScreen = entries.some((e) => e.isIntersecting))).observe(el);

    let last = performance.now() / 1000;
    renderer.setAnimationLoop(() => {
      const now = performance.now() / 1000;
      const dt = Math.min(now - last, 0.1);
      last = now;
      if (!onScreen || document.hidden) return;

      look.yaw = damp(look.yaw, target.yaw, 6, dt);
      look.pitch = damp(look.pitch, target.pitch, 6, dt);
      const idle = idlePose(now);
      const jump = jumpPose((now - jumpStart) / JUMP.seconds);

      figure.position.y = idle.y + jump.y;
      studio.setLift(jump.y);
      figure.scale.set(1, idle.scaleY, 1);
      figure.rotation.set(look.pitch * 0.5, look.yaw + idle.sway + jump.spin, 0);
      renderer.render(scene, camera);
      if (el.dataset.state !== 'ready') setState(el, 'ready');
    });
  } catch (error) {
    console.warn('avatar: falling back to the still image', error);
    setState(el, 'fallback');
  }
}
