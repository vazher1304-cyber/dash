import * as THREE from 'three';
import { createResources, createContext, createLots } from './objects.js';
import { createBindings } from './bindings.js';
import { createInteractions } from './interactions.js';

export function createScene(host, canvas, context) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#EEF2F7');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, .1, 200);
  camera.position.set(20, 20, 20); camera.lookAt(0, 0, 0);
  const resources = createResources();
  const decoration = createContext(resources); scene.add(decoration.group);
  const lots = createLots(resources); scene.add(lots.group);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B1BFCC', 2.3));
  const sun = new THREE.DirectionalLight('#FFFFFF', 3);
  sun.position.set(-8, 18, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 60 });
  sun.shadow.normalBias = .025; sun.shadow.bias = -.0002; sun.shadow.radius = 3; scene.add(sun);
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const viewport = document.getElementById('m-scroll');
  const aperture = () => viewport.getBoundingClientRect();
  let active = false, plan = false, disposed = false, elapsed = 0, frame = 0, projectionDirty = true;
  let geometryKey = '', lastWidth = 0, lastHeight = 0;
  const clock = new THREE.Clock(false), events = new AbortController(), opts = { signal: events.signal };
  const interactions = createInteractions({ camera, canvas, lots, reduced: () => motion.matches, isActive: () => active && !document.body.classList.contains('overlay-open') && !document.getElementById('app-main').inert, aperture });
  const toolbar = document.createElement('div'); toolbar.className = 'scene-tools'; toolbar.hidden = true;
  toolbar.innerHTML = '<button type="button" class="btn-secondary" data-scene-plan aria-pressed="false">Ver plano 2D</button><div class="scene-camera-tools" role="group" aria-label="Cámara 3D"><button type="button" data-scene-out aria-label="Alejar escena 3D">−</button><button type="button" data-scene-fit>Ajustar 3D</button><button type="button" data-scene-in aria-label="Acercar escena 3D">+</button></div>';
  document.querySelector('.overview-operation>.card-heading').append(toolbar);
  const planButton = toolbar.querySelector('[data-scene-plan]');
  function usePlan(value) {
    plan = value; planButton.setAttribute('aria-pressed', String(plan));
    planButton.textContent = plan ? 'Explorar en 3D' : 'Ver plano 2D'; syncUI();
  }
  toolbar.addEventListener('click', event => {
    if (event.target.closest('[data-scene-plan]')) usePlan(!plan);
    if (event.target.closest('[data-scene-fit]')) { interactions.reset(); projectionDirty = true; }
    if (event.target.closest('[data-scene-in]')) camera.zoom = Math.min(3,camera.zoom*1.2);
    if (event.target.closest('[data-scene-out]')) camera.zoom = Math.max(.7,camera.zoom/1.2);
    camera.updateProjectionMatrix();
  }, opts);
  // The original plan controls keep their exact behavior and reveal that plan.
  document.querySelector('.map-toolbar').addEventListener('click', event => {
    if (event.target.closest('[data-map-view],.map-zoom button')) usePlan(true);
  }, opts);
  viewport.addEventListener('focusin', () => usePlan(true), opts);
  const bindings = createBindings(snapshot => {
    const nextKey = JSON.stringify(snapshot.lots.map(e => [e.id,e.lot.mz,e.lot.size,proyectoDe(e.lot.r)]));
    lots.rebuild(snapshot); interactions.refresh();
    if (nextKey !== geometryKey) { geometryKey = nextKey; interactions.reset(); }
    host.dataset.lots = String(snapshot.lots.length);
    syncUI(); projectionDirty = true;
  });
  function syncUI() {
    const overview = document.getElementById('app').classList.contains('show') && document.getElementById('panel-resumen').classList.contains('active');
    const available = overview && lots.entries.length > 0;
    toolbar.hidden = !available;
    const next = available && !plan;
    if (next !== active) {
      active = next; root.classList.toggle('scene-ready',active); canvas.hidden = !active;
      projectionDirty = true;
    }
    toolbar.querySelector('.scene-camera-tools').hidden = !active;
  }
  const uiObserver = new MutationObserver(syncUI);
  uiObserver.observe(document.getElementById('app'), { attributes: true, attributeFilter: ['class'] });
  uiObserver.observe(document.getElementById('panel-resumen'), { attributes: true, attributeFilter: ['class','hidden'] });
  function resize() { projectionDirty = true; }
  function project() {
    const width = innerWidth, height = innerHeight;
    if (width !== lastWidth || height !== lastHeight) {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(width,height);
      lastWidth = width; lastHeight = height;
    }
    const box = aperture();
    // Full-viewport renderer; asymmetric frustum fits the open UI aperture.
    const half = Math.max(30 / Math.max(box.width,240), 23 / Math.max(box.height,240)) * height / 2;
    const hw = half*width/height;
    const offsetX = ((box.left+box.width/2)-width/2)*2*hw/width;
    const offsetY = ((box.top+box.height/2)-height/2)*2*half/height;
    camera.left = -hw-offsetX; camera.right = hw-offsetX;
    camera.top = half+offsetY; camera.bottom = -half+offsetY;
    camera.updateProjectionMatrix(); projectionDirty = false;
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(viewport);
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    elapsed += Math.min(clock.getDelta(),.05);
    bindings.update();
    if (projectionDirty) project();
    if (active) {
      lots.animate(elapsed,motion.matches);
      decoration.prop.position.z = motion.matches ? -10 : Math.sin(elapsed*.12)*10;
    }
    interactions.update(elapsed);
    if (active) renderer.render(scene,camera);
    frame = requestAnimationFrame(render);
  }
  function visibility() {
    cancelAnimationFrame(frame); frame = 0;
    if (document.hidden) clock.stop();
    else { clock.start(); frame = requestAnimationFrame(render); }
  }
  const lost = event => { event.preventDefault(); dispose(); host.dataset.state = 'unavailable'; };
  canvas.hidden = true; canvas.setAttribute('data-lenis-prevent',''); host.append(canvas);
  project(); visibility();
  window.addEventListener('resize',resize,opts); window.addEventListener('scroll',resize,{ ...opts, passive:true });
  document.addEventListener('visibilitychange',visibility,opts); canvas.addEventListener('webglcontextlost',lost,opts);
  function dispose() {
    if (disposed) return; disposed = true; cancelAnimationFrame(frame); clock.stop(); events.abort();
    uiObserver.disconnect(); resizeObserver.disconnect(); bindings.dispose(); interactions.dispose();
    lots.dispose(); sun.shadow.dispose(); resources.dispose(); renderer.dispose(); renderer.forceContextLoss();
    toolbar.remove(); canvas.remove(); root.classList.remove('scene-ready');
  }
  return { dispose };
}
