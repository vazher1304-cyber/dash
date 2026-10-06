import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { entityId, tooltipContent } from './bindings.js';

export function createInteractions({ camera, canvas, lots, reduced, isActive, aperture }) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableRotate = false; controls.enablePan = true; controls.screenSpacePanning = false;
  controls.enableDamping = false; controls.minZoom = .7; controls.maxZoom = 3;
  controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  controls.touches.ONE = THREE.TOUCH.PAN; controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const tip = document.createElement('div'); tip.className = 'scene-tooltip'; tip.hidden = true;
  tip.setAttribute('aria-hidden', 'true'); document.body.append(tip);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), projected = new THREE.Vector3();
  let hover = null, pointerDirty = false, current = null, down = null, maxDistance = 0;
  let tween = null, pulseId = null, pulseStart = 0, time = 0, dispatching = false;
  const handlers = new AbortController(), opts = { signal: handlers.signal };
  function pick(x, y) {
    if (!isActive()) return null;
    const box = aperture();
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) return null;
    pointer.set(x/innerWidth*2-1, 1-y/innerHeight*2);
    camera.updateMatrixWorld(); lots.group.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(lots.targets, false).find(h => !h.object.userData.entities[h.instanceId]?.filtered);
    return hit ? hit.object.userData.entities[hit.instanceId] : null;
  }
  function setHover(entry) {
    if (hover === entry) return;
    hover = entry; canvas.style.cursor = hover ? 'pointer' : 'grab';
    tip.hidden = !hover; if (hover) tooltipContent(hover, tip);
  }
  function focus(id) {
    const entry = lots.positions.get(id); if (!entry) return;
    const target = entry.position.clone(); target.y = 0;
    pulseId = id; pulseStart = time;
    if (reduced()) {
      camera.position.add(target.clone().sub(controls.target)); controls.target.copy(target);
      controls.update(); tween = null;
    } else tween = { from: controls.target.clone(), to: target, start: time };
  }
  canvas.addEventListener('pointermove', event => {
    current = { x: event.clientX, y: event.clientY }; pointerDirty = true;
    if (down) maxDistance = Math.max(maxDistance, Math.hypot(current.x-down.x, current.y-down.y));
  }, opts);
  canvas.addEventListener('pointerleave', () => { current = null; pointerDirty = false; setHover(null); }, opts);
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    if (down) { down = null; return; }
    down = { x: event.clientX, y: event.clientY, id: event.pointerId }; maxDistance = 0; tween = null;
  }, opts);
  canvas.addEventListener('pointercancel', () => { down = null; }, opts);
  canvas.addEventListener('pointerup', event => {
    const start = down; down = null;
    if (!start || start.id !== event.pointerId || event.button !== 0 || maxDistance >= 5 || Math.hypot(event.clientX-start.x,event.clientY-start.y) >= 5) return;
    const entry = pick(event.clientX, event.clientY); if (!entry) return;
    const element = document.querySelector(entry.selector);
    if (!element || element.classList.contains('dim')) return;
    dispatching = true;
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: event.clientX, clientY: event.clientY }));
    dispatching = false; focus(entry.id);
  }, opts);
  canvas.addEventListener('wheel', () => { tween = null; }, { ...opts, passive: true });
  function reverse(event) {
    if (dispatching) return;
    const id = entityId(event.target); if (id !== null) focus(id);
  }
  document.addEventListener('click', reverse, opts); document.addEventListener('focusin', reverse, opts);
  controls.addEventListener('change', () => { pointerDirty = true; });
  return {
    controls,
    reset() {
      tween = null; controls.target.set(0,0,0); camera.position.set(20,20,20); camera.zoom = 1;
      camera.updateProjectionMatrix(); controls.update(); setHover(null);
    },
    refresh() { setHover(null); pointerDirty = true; },
    update(elapsed) {
      time = elapsed; controls.enabled = isActive();
      if (!controls.enabled) { setHover(null); return; }
      if (tween) {
        const progress = reduced() ? 1 : Math.min(1, (time-tween.start)/.6);
        const eased = progress < .5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
        const target = tween.from.clone().lerp(tween.to,eased);
        camera.position.add(target.clone().sub(controls.target)); controls.target.copy(target);
        if (progress === 1) tween = null;
      }
      const clamped = controls.target.clone(); clamped.x = THREE.MathUtils.clamp(clamped.x,-11,11);
      clamped.z = THREE.MathUtils.clamp(clamped.z,-11,11); clamped.y = 0;
      camera.position.add(clamped.clone().sub(controls.target)); controls.target.copy(clamped);
      controls.update();
      if (pointerDirty) { pointerDirty = false; setHover(current ? pick(current.x,current.y) : null); }
      const pulse = reduced() ? 0 : Math.max(0,1-(time-pulseStart)/.8)*Math.abs(Math.sin((time-pulseStart)*Math.PI*3));
      lots.emphasize(hover,pulseId,pulse);
      if (hover) {
        projected.copy(hover.position).project(camera);
        const x=(projected.x*.5+.5)*innerWidth, y=(-projected.y*.5+.5)*innerHeight;
        tip.style.left = `${Math.max(12,Math.min(innerWidth-tip.offsetWidth-12,x+18))}px`;
        tip.style.top = `${Math.max(12,Math.min(innerHeight-tip.offsetHeight-12,y-tip.offsetHeight-18))}px`;
      }
    },
    dispose() { handlers.abort(); controls.dispose(); tip.remove(); }
  };
}
