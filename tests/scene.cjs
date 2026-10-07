/* Additional browser regressions for the additive 3D layer. Uses existing dev-only Playwright. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const base = process.env.TEMPLER_URL || 'http://127.0.0.1:8000/index.html';
let passed = 0;
function check(value, message) { assert(value, message); passed++; }
async function boot(page, query='') {
  await page.goto(base + query); await page.locator('#demoBtn').click();
  await page.waitForFunction(() => sessionData.rows.length === 96);
}
async function sceneReady(page) { await page.waitForFunction(() => document.documentElement.classList.contains('scene-ready')); }
async function waitFrames(page,n=3) { await page.evaluate(n=>new Promise(resolve=>{function step(){if(--n<=0)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);}),n); }
(async()=>{
  const artifacts = await fs.mkdtemp(path.join(os.tmpdir(),'templer-scene-'));
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium', args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const errors=[],warnings=[];
  async function context(options={}) {
    const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',timezoneId:'America/Ciudad_Juarez',...options});
    await c.route('https://cdn.jsdelivr.net/**',async route=>{
      const filename=path.basename(new URL(route.request().url()).pathname);
      await route.fulfill({contentType:'application/javascript',body:await fs.readFile(path.join(process.env.TEMPLER_CDN_CACHE||'/workspace/.templer-tools/cdn',filename))});
    });
    c.on('page',p=>{
      p.on('pageerror',e=>errors.push(e.message));
      p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
    });
    return c;
  }
  try {
    const c=await context(); const p=await c.newPage();
    // Test-only draw counters observe real rendering without exporting product internals.
    await p.addInitScript(()=>{
      window.__draws=0;
      for(const name of ['drawElements','drawElementsInstanced','drawArrays','drawArraysInstanced']){
        const original=WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name]=function(...args){window.__draws++;return original.apply(this,args);};
      }
    });
    await boot(p); await sceneReady(p); await waitFrames(p);
    check(await p.locator('#isometric-scene').getAttribute('data-lots')==='96','Every real demo lot bound');
    check(await p.locator('#isometric-scene canvas').count()===1,'One renderer');
    check(await p.locator('#isometric-scene').getAttribute('aria-hidden')==='true','Decorative canvas excluded from accessibility tree');
    check(await p.evaluate(()=>__draws>0),'WebGL actually renders');
    check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Desktop has no horizontal overflow');
    check(await p.evaluate(()=>{const card=document.querySelector('.overview-metric');const css=getComputedStyle(card);return css.borderRadius==='16px'&&css.backdropFilter.includes('16px');}),'Glass card tokens applied');
    const box=await p.locator('#m-scroll').boundingBox();
    check(await p.evaluate(({x,y})=>document.elementFromPoint(x,y).matches('#isometric-scene canvas'),{x:box.x+box.width/2,y:box.y+box.height/2}),'Open center passes pointers through the UI');
    // Find a real rendered marker using normal pointermove + Raycaster, never forced DOM selection.
    let hit;
    for(let y=box.y+20;y<Math.min(box.y+box.height-10,980)&&!hit;y+=14){
      for(let x=box.x+20;x<box.x+box.width-20&&!hit;x+=18){
        await p.mouse.move(x,y);await waitFrames(p,2);
        if(await p.locator('.scene-tooltip').isVisible())hit={x,y};
      }
    }
    check(!!hit,'Raycast hover finds a real entity');
    check((await p.locator('.scene-tooltip').innerText()).includes('ejemplo'),'Tooltip contains actual project data');
    await p.mouse.click(hit.x,hit.y);await waitFrames(p,4);
    const selected=await p.evaluate(()=>mapState.selectedId);
    check(selected!==null,'3D click calls the existing lot inspector');
    check(await p.locator('#lotInspector [data-open-rid]').getAttribute('data-open-rid')===String(selected),'Inspector matches raycast row ID');
    await p.mouse.move(hit.x,hit.y);await p.mouse.down();await p.mouse.move(hit.x+12,hit.y+8,{steps:3});await p.mouse.move(hit.x,hit.y);await p.mouse.up();await waitFrames(p);
    check(await p.evaluate(()=>mapState.selectedId)===selected,'Drag returning to its start does not dispatch a click');
    await p.locator('[data-scene-fit]').click();
    for(const control of ['[data-scene-in]','[data-scene-out]']){await p.locator(control).click();}
    await p.locator('[data-scene-plan]').click();
    check(!await p.evaluate(()=>document.documentElement.classList.contains('scene-ready')),'2D switch restores original plan');
    await p.locator('#m-canvas .mlot').first().waitFor({state:'visible'});
    check(await p.locator('#m-canvas .mlot').first().isVisible(),'Original keyboard and SVG lot targets remain visible in 2D');
    const target=p.locator('#m-canvas .mlot').nth(12);await target.focus();await target.press('Enter');
    check(await target.getAttribute('aria-pressed')==='true','Original keyboard selection');
    await p.locator('[data-scene-plan]').click();await sceneReady(p);
    await p.locator('#lotInspector [data-open-rid]').focus();await waitFrames(p);
    await p.locator('#lotInspector [data-open-rid]').click();
    check(await p.locator('#sheetOverlay.show').isVisible(),'3D selection opens the original client sheet');
    await p.keyboard.press('Escape');
    await p.locator('#projectFilter').selectOption('bosque poniente · ejemplo');
    await p.waitForFunction(()=>document.getElementById('isometric-scene').dataset.lots==='32');
    check(await p.locator('#o-homes').innerText()==='32','Global filter updates UI and scene together');
    await p.locator('#m-search').fill('no-matches-xyz');await waitFrames(p);
    check(await p.locator('#m-canvas .mlot:not(.dim)').count()===0,'Scene uses original filtering state');
    await p.locator('#mapResetFilters').click();await waitFrames(p);
    check(await p.locator('#m-canvas .mlot:not(.dim)').count()===32,'Reset updates the binding');
    await p.locator('#projectFilter').selectOption('');await waitFrames(p);
    await p.screenshot({path:path.join(artifacts,'scene-desktop.png')});
    // Runtime data replacement, missing columns and empty data come through existing entry points.
    await p.evaluate(()=>enterWorkspace([{loteId:'R1',fraccionamiento:'Real import',nombreCliente:'Ana',manzana:1,lote:1}], 'Runtime fixture',false,['loteId','fraccionamiento','nombreCliente','manzana','lote']));
    await p.waitForFunction(()=>document.getElementById('isometric-scene').dataset.lots==='1');
    check(!await p.locator('#overviewSales').isVisible(),'Missing financial columns still omit unsupported KPI');
    await p.evaluate(()=>enterWorkspace([],'Empty',false,[]));await waitFrames(p);
    check(!await p.evaluate(()=>document.documentElement.classList.contains('scene-ready')),'Empty data falls back without invented markers');
    check(await p.locator('#isometric-scene').getAttribute('data-lots')==='0','No stale objects after empty import');
    await p.evaluate(()=>document.getElementById('demoBtn').click());await sceneReady(p);
    // Hidden-tab lifecycle: deterministic visibility event, observed via actual GL calls.
    await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    const paused=await p.evaluate(()=>__draws);await waitFrames(p,5);
    check(await p.evaluate(()=>__draws)===paused,'No rendering while document.hidden');
    await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await waitFrames(p,4);
    check(await p.evaluate(()=>__draws)>paused,'Rendering resumes on visibility');
    await p.setViewportSize({width:767,height:900});await p.waitForFunction(()=>!document.querySelector('#isometric-scene canvas'));
    check(!await p.locator('.scene-tools').count(),'Mobile disposes renderer and scene controls');
    await p.locator('#m-canvas .mlot').first().waitFor({state:'visible'});
    check(await p.locator('#m-canvas .mlot').first().isVisible(),'Mobile retains the original usable map');
    await p.screenshot({path:path.join(artifacts,'fallback-mobile.png'),fullPage:true});
    await p.setViewportSize({width:1440,height:1000});await sceneReady(p);
    check(await p.locator('#isometric-scene canvas').count()===1,'Resize back creates one renderer');
    await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await waitFrames(p);
    check(await p.locator('#isometric-scene canvas').count()===0,'Pagehide disposes GPU resources');
    await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await sceneReady(p);
    await p.evaluate(()=>TemplerScene.dispose());
    check(await p.locator('#isometric-scene canvas,.scene-tools,.scene-tooltip').count()===0,'Explicit teardown removes canvas, controls and tooltip');
    await p.evaluate(()=>TemplerScene.init());await sceneReady(p);
    await c.close();
    const off=await context();const no=await off.newPage();const requests=[];no.on('request',r=>requests.push(r.url()));
    await boot(no,'?no3d=1');await waitFrames(no);
    check(await no.locator('#isometric-scene canvas').count()===0,'Kill switch never creates a renderer');
    check(!requests.some(u=>u.includes('three.module')||u.endsWith('/scene.js')),'Kill switch never imports Three.js');
    await off.close();
    const mobile=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mp=await mobile.newPage();const mobileRequests=[];mp.on('request',r=>mobileRequests.push(r.url()));
    await boot(mp);await waitFrames(mp);
    check(!mobileRequests.some(u=>u.includes('three.module')||u.endsWith('/scene.js')),'Small initial viewport never imports Three.js');
    await mp.locator('#m-canvas .mlot').nth(1).tap();
    check(await mp.evaluate(()=>mapState.selectedId!==null),'Mobile touch selection survives glass restyle');
    await mp.screenshot({path:path.join(artifacts,'mobile-390.png'),fullPage:true});await mobile.close();
    const unavailable=await context();await unavailable.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:original.call(this,kind,...args);};});
    const np=await unavailable.newPage();await boot(np);await waitFrames(np);
    check(await np.locator('#isometric-scene').getAttribute('data-state')==='unavailable','WebGL unavailable yields a static background');
    check(await np.locator('#m-canvas .mlot').first().isVisible(),'WebGL failure keeps the original dashboard');
    await unavailable.close();
    const movingContext=await context({reducedMotion:'no-preference'});const movingPage=await movingContext.newPage();
    await boot(movingPage);await sceneReady(movingPage);await movingPage.waitForFunction(()=>!!window.TemplerMotion);
    await movingPage.locator('[data-scene-in]').click();await movingPage.locator('[data-scene-fit]').click();
    check(await movingPage.locator('#o-homes').innerText()==='96','3D coexists with original GSAP/Lenis motion');
    for(const width of [1024,768]){await movingPage.setViewportSize({width,height:1000});await waitFrames(movingPage,4);check(await movingPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Scene layout fits '+width);}
    await movingPage.evaluate(()=>document.querySelector('#isometric-scene canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
    await movingPage.locator('#m-canvas .mlot').first().waitFor({state:'visible'});
    check(await movingPage.locator('#isometric-scene canvas').count()===0,'Context loss disposes the scene and restores the original plan');
    await movingContext.close();
    // Direct file:// navigation is blocked by this managed browser policy; documented in PLAN.md.
    // Runtime scene factory tests check instancing and individual identity without implementation stubs.
    const unit=await context();const up=await unit.newPage();await boot(up,'?no3d=1');
    const factory=await up.evaluate(async()=>{
      const THREE=await import('three');
      const {createInteractions}=await import('./js/scene/interactions.js');
      const {createResources,createLots}=await import('./js/scene/objects.js');
      const resources=createResources(),group=createLots(resources),project=selectDisplayedMapProject();
      const entries=[...document.querySelectorAll('#m-canvas .mlot')].map(element=>{const lot=mapState.lots[+element.dataset.i];return{lot,id:lot.r._id,selector:`#m-canvas .mlot[data-i="${element.dataset.i}"]`,element};});
      group.rebuild({lots:entries,layout:layoutMapa(project,{schematic:true})});
      const result={instanced:group.targets.every(m=>m.isInstancedMesh&&m.count===96),identities:group.entries.every(e=>document.querySelector(e.userData.selector)&&e.id===e.userData.id),groups:group.group.children.filter(m=>m.isInstancedMesh).length};
      const camera=new THREE.OrthographicCamera(-20,20,20,-20,.1,200);camera.position.set(20,20,20);camera.lookAt(0,0,0);
      const canvas=document.createElement('canvas');document.body.append(canvas);let reduced=false;
      const interactions=createInteractions({camera,canvas,lots:group,reduced:()=>reduced,isActive:()=>true,aperture:()=>({left:0,right:innerWidth,top:0,bottom:innerHeight})});
      result.controls=interactions.controls.enableRotate===false&&interactions.controls.enablePan&&interactions.controls.minZoom===.7&&interactions.controls.maxZoom===3;
      interactions.update(0);entries[10].element.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));interactions.update(.3);
      const mid=interactions.controls.target.clone();interactions.update(.6);const end=interactions.controls.target.clone();
      result.tween=mid.length()>0&&mid.distanceTo(end)>0&&Math.abs(end.x-entries[10].position.x)<.001;
      reduced=true;entries[30].element.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
      result.reduced=Math.abs(interactions.controls.target.x-entries[30].position.x)<.001;
      interactions.controls.target.set(100,0,100);interactions.update(.7);result.pan=Math.abs(interactions.controls.target.x)<=11&&Math.abs(interactions.controls.target.z)<=11;
      group.animate(1,true);const first=new THREE.Matrix4();group.targets[0].getMatrixAt(0,first);group.animate(2,true);const second=new THREE.Matrix4();group.targets[0].getMatrixAt(0,second);result.static=first.equals(second);
      group.animate(2,false);const moving=new THREE.Matrix4();group.targets[0].getMatrixAt(0,moving);result.idle=!first.equals(moving);
      group.emphasize(entries[0],null,0);group.targets[0].getMatrixAt(0,moving);const scale=new THREE.Vector3();moving.decompose(new THREE.Vector3(),new THREE.Quaternion(),scale);result.hover=Math.abs(scale.x/entries[0].markerSize-1.08)<.001&&resources.materials.highlight.emissiveIntensity>0;
      interactions.dispose();canvas.remove();
      let geometries=0,materials=0;Object.values(resources.geometries).forEach(g=>g.addEventListener('dispose',()=>geometries++));Object.values(resources.materials).forEach(m=>m.addEventListener('dispose',()=>materials++));
      group.dispose();resources.dispose();return{...result,geometries,materials};
    });
    check(factory.instanced&&factory.groups===3,'Repeated lots, markers and blocks use InstancedMesh');
    check(factory.controls&&factory.pan,'Camera rotation disabled, zoom limits and pan bounds');
    check(factory.tween&&factory.reduced,'Reverse focus centers camera in 600ms, immediately with reduced motion');
    check(factory.static&&factory.idle,'Idle motion is disabled for reduced-motion preference');
    check(factory.hover,'Hover scales marker to 1.08 and uses an emissive highlight');
    check(factory.identities,'Every 3D entity resolves to the original DOM target');
    check(factory.geometries===4&&factory.materials===9,'All shared geometries and materials dispose');
    await unit.close();
    check(errors.length===0,'No browser errors: '+errors.join('\n'));
    const codeWarnings=warnings.filter(w=>!w.includes('GPU stall due to ReadPixels'));
    check(codeWarnings.length===0,'No application warnings: '+codeWarnings.join('\n'));
    console.log(`${passed} scene checks passed. Artifacts: ${artifacts}. Chromium software-GPU readback warnings: ${warnings.length-codeWarnings.length}.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
