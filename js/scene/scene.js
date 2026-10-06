import * as THREE from 'three';
import { createResources, createContext } from './objects.js';

export function createScene(host, canvas, context) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#EEF2F7');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, .1, 200);
  camera.position.set(20, 20, 20); camera.lookAt(0, 0, 0);
  const resources = createResources();
  const decoration = createContext(resources); scene.add(decoration.group);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B1BFCC', 2.3));
  const sun = new THREE.DirectionalLight('#FFFFFF', 3);
  sun.position.set(-8, 18, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 60 });
  sun.shadow.normalBias = .025; sun.shadow.bias = -.0002; sun.shadow.radius = 3;
  scene.add(sun);
  const clock = new THREE.Clock(false);
  let frame = 0, disposed = false;
  function resize() {
    const width = innerWidth, height = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    const half = 20;
    camera.left = -half * width / height; camera.right = half * width / height;
    camera.top = half; camera.bottom = -half; camera.updateProjectionMatrix();
  }
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    clock.getDelta();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
  function visibility() {
    cancelAnimationFrame(frame); frame = 0;
    if (document.hidden) clock.stop();
    else { clock.start(); frame = requestAnimationFrame(render); }
  }
  const lost = event => { event.preventDefault(); dispose(); host.dataset.state = 'unavailable'; };
  host.append(canvas); resize(); visibility();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  canvas.addEventListener('webglcontextlost', lost);
  function dispose() {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(frame); clock.stop();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility);
    canvas.removeEventListener('webglcontextlost', lost);
    sun.shadow.dispose(); resources.dispose(); renderer.dispose(); renderer.forceContextLoss();
    canvas.remove(); document.documentElement.classList.remove('scene-ready');
  }
  return { dispose };
}
