# Isometric dashboard plan and regression ledger

## Phase 0 — audit (completed before feature edits)

Static application: one index.html (no bundler, package manifest, build or lint command). All original HTML, three inline CSS blocks, four application/bootstrap scripts and five bundled vendor scripts were inventoried. Vendor code and embedded fonts/logo remain byte-identical. tests/operations.cjs is the existing Chromium regression suite. README.md and VALIDATION.md describe the previous design.

Data flow: local FileReader → SheetJS → pickBestSheet → rowsFromSheet → enterWorkspace → sessionData.rows (stable _id per import). refreshScope computes filtered reports; computeMapa → selectDisplayedMapProject → layoutMapa → buildPlanoSvg produces mapState.lots and SVG .mlot[data-i]. No data fetches or remote API. Demo is an explicit, pre-existing 96-row fictitious dataset. Inline libraries: SheetJS 0.18.5, ExcelJS 4.4.0, Chart.js 4.4.1, jsPDF 2.5.1, AutoTable 3.8.2. Optional exact-version GSAP/Lenis scripts load from jsDelivr.

Navigation: selectPanel switches seven existing panels; mountSharedMap moves a single map and inspector between overview and detailed plan. data-goto opens reports; data-project changes the global project filter. SVG lot selection calls inspectLot; data-rid rows openSheet; showOnMap reconciles project scope. Search, periods, sorting, pagination, export and WebMCP reuse these functions.

## Data → scene mapping

| Existing entity / source | 3D representation | Existing action |
|---|---|---|
| Each mapState.lots row / #m-canvas .mlot[data-i] | One low-poly lot tile and raised blue marker; userData stores row ID and DOM selector. Dimensions/position reuse layoutMapa. | Dispatch click on the exact SVG lot → inspectLot |
| Each displayed manzana / layoutMapa.blocks | Neutral raised island grouping those same lots; instanced when repeated | No invented action |
| Current project scope / selectDisplayedMapProject | The same set of islands/lots as the shared SVG map | Existing global/chip filters redraw both |
| Existing selection / .mlot[aria-pressed=true] and data-rid panels | Highlight/pulse and camera center | Existing handlers remain authoritative |
| Ground, paths, a few trees and moving props | Explicitly illustrative neutral context, no new business entities | None |

The scene is schematic: marker height does not assert construction or financial progress; no invented coordinates or metrics. Missing columns remain unavailable. Runtime DOM mutations trigger a coalesced read-only binding refresh.

## UI block inventory (selectors from the original document)

| Block | Selector |
|---|---|
| nav | `#motionMenuList` |
| section | `#hero` |
| header | `header.landing-top` |
| label | `#dropzone` |
| header | `header.topbar` |
| aside | `#sidebar` |
| nav | `#reportNavigation` |
| main | `#app-main` |
| div | `div.scopebar` |
| div | `#reportTools` |
| section | `#panel-resumen` |
| button | `#overviewHomes` |
| button | `#overviewAssigned` |
| button | `#overviewUnassigned` |
| button | `#overviewSales` |
| section | `section.overview-operation` |
| article | `#overviewBalance` |
| article | `#overviewDeeds` |
| article | `#overviewBridge` |
| details | `details.overview-secondary` |
| article | `article.activity-card` |
| canvas | `#o-activity` |
| article | `article.attention-card` |
| article | `article.projects-card` |
| section | `#panel-clientes` |
| div | `div.kpi` |
| div | `div.kpi.green` |
| div | `div.kpi.red` |
| div | `div.kpi.gold` |
| div | `#alertsCard` |
| table | `table` |
| tbody | `#alertsBody` |
| div | `div.chart-card` |
| canvas | `#c-donut` |
| canvas | `#c-bar` |
| div | `div.table-card` |
| tbody | `#c-prod-cobrar` |
| tbody | `#c-prod-favor` |
| tbody | `#c-cargo-list` |
| tbody | `#c-favor-list` |
| section | `#panel-ventas` |
| canvas | `#v-donut` |
| canvas | `#v-bar` |
| tbody | `#v-desglose` |
| section | `#panel-personal` |
| canvas | `#p-bar` |
| tbody | `#p-resumen` |
| section | `#panel-puente` |
| canvas | `#pt-donut` |
| canvas | `#pt-bar` |
| tbody | `#pt-desglose` |
| tbody | `#pt-pendientes-list` |
| section | `#panel-saldos` |
| table | `table.s-resumen` |
| tbody | `#s-resumen` |
| canvas | `#s-bar-saldos` |
| canvas | `#s-bar-esc` |
| section | `#panel-mapa` |
| div | `div.map-controls` |
| div | `#m-stats` |
| div | `div.map-board` |
| aside | `aside.map-inspector` |
| footer | `footer.footer-note` |
| div | `div.modal-box` |
| div | `div.palette` |
| aside | `#clientSheet` |

## Original links, buttons and fields — regression checklist

Each static control is listed below. Repeated generated controls and all listener registrations follow. Verification evidence will be filled after browser execution.

- [ ] `#motionMenuClose`
- [ ] `#skipLink` → `#app-main`
- [ ] `#fileInput`
- [ ] `#demoBtn`
- [ ] `#sidebarBackdrop`
- [ ] `#menuToggle`
- [ ] `#projectFilter`
- [ ] `#searchTrigger`
- [ ] `#resetBtn`
- [ ] `#densityToggle`
- [ ] `#exportXlsxBtn`
- [ ] `#exportPdfBtn`
- [ ] `#sidebarClose`
- [ ] `#tab-resumen`
- [ ] `#tab-clientes`
- [ ] `#tab-ventas`
- [ ] `#tab-personal`
- [ ] `#tab-puente`
- [ ] `#tab-saldos`
- [ ] `#tab-mapa`
- [ ] `#exitDemo`
- [ ] `#periodFrom`
- [ ] `#periodTo`
- [ ] `#periodClear`
- [ ] `#reportSearch`
- [ ] `#overviewHomes`
- [ ] `#overviewAssigned`
- [ ] `#overviewUnassigned`
- [ ] `#overviewSales`
- [ ] `button.text-button[data-goto="mapa"]`
- [ ] `button.balance-link[data-goto="saldos"]`
- [ ] `button.text-button[data-goto="puente"]`
- [ ] `summary`
- [ ] `button[data-mode="month"]`
- [ ] `button[data-mode="cum"]`
- [ ] `button.text-button[data-goto="personal"]`
- [ ] `button.text-button[data-goto="saldos"]`
- [ ] `button[data-days="30"]`
- [ ] `button[data-days="60"]`
- [ ] `button[data-days="90"]`
- [ ] `button[data-days="120"]`
- [ ] `#m-search`
- [ ] `#mapResetFilters`
- [ ] `#downloadMap`
- [ ] `button[data-map-view="perspective"]`
- [ ] `button[data-map-view="plan"]`
- [ ] `#m-zoom-out`
- [ ] `#m-zoom-fit`
- [ ] `#m-zoom-in`
- [ ] `#pdfSel-clientes`
- [ ] `#pdfSel-ventas`
- [ ] `#pdfSel-personal`
- [ ] `#pdfSel-puente`
- [ ] `#pdfSel-saldos`
- [ ] `#pdfModalCancel`
- [ ] `#pdfModalConfirm`
- [ ] `#paletteInput`

### Generated controls and interaction families

- [ ] .mlot[data-i]: hover, click, focus, Enter, Space; .dim filtering; selection persistence
- [ ] [data-open-rid], [data-show-map-rid], [data-clear-lot], tr[data-rid]
- [ ] [data-project], .proj-chip[data-i], .legend-chip[data-st]
- [ ] [data-sheet-close], [data-sheet-copy], [data-sheet-map], sheet swipe-dismiss
- [ ] .sort-button, .page-prev, .page-next, .table-pager select
- [ ] .table-tools button: clipboard/Excel; heading expand; tableBackdrop and Escape
- [ ] .chart-legend button; bar-chart onPick; chart hover tooltips
- [ ] .palette-item, palette keyboard selection, Ctrl/Cmd K, outside-click and focus trap
- [ ] dropzone drag/drop and keyboard; file import errors; export busy states
- [ ] navigation arrows/Home/End, mobile drawer focus trap/backdrop, swipe reports
- [ ] map drag, Ctrl-wheel, two-finger pinch; resize and theme refresh
- [ ] WebMCP read_report_state, navigate_report_view, set_project_filter
- [ ] Optional motion preloader, curtain, cursor, reveals, scroll, pagehide/pageshow cleanup

### Event-handler registration inventory (original application scripts)

Line numbers refer to extracted inline script blocks, recorded before edits. Vendor internals are preserved wholesale.

- [ ] script 15:427: `barChart('p-bar',{labels,datasets:[{label:'Viviendas escrituradas',data:values,color:'blue'}],onPick:index=>scrollToMonth(p.monthKeys[index])});`
- [ ] script 15:554: `barChart('s-bar-saldos',{labels:s.proyectos.map(p=>p.nombre),horizontal:true,money:true,datasets:[{label:'Saldo a cargo',data:s.proyectos.map(p=>p.montoCargo),color:'neutral'},{label:'Saldo a favor',data:s.proyectos.map(p=>Math.abs(p.montoFavor)),color:'red'}],onPick:index=>pickProject(s.proyectos[index].nombre)});`
- [ ] script 15:555: `barChart('s-bar-esc',{labels:s.proyectos.map(p=>p.nombre),horizontal:true,stacked:true,datasets:[{label:'Escrituradas',data:s.proyectos.map(p=>p.escrituradas),color:'blue'},{label:'Por escriturar',data:s.proyectos.map(p=>p.porEscriturar),color:'track'}],onPick:index=>pickProject(s.proyectos[index].nombre)});`
- [ ] script 15:1171: `canvas.addEventListener('mouseover', e=>{ const el = e.target.closest('.mlot'); if(el) show(el, e.clientX, e.clientY); });`
- [ ] script 15:1172: `canvas.addEventListener('mousemove', e=>{ if(activeEl && e.target.closest('.mlot')) place(e.clientX, e.clientY); });`
- [ ] script 15:1173: `canvas.addEventListener('mouseout', e=>{ const el = e.target.closest('.mlot'); if(el && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.mlot')===el)) hide(); });`
- [ ] script 15:1174: `canvas.addEventListener('focusin', e=>{ const el = e.target.closest('.mlot'); if(el){ const r = el.getBoundingClientRect(); show(el, r.left + r.width/2, r.top + 4); } });`
- [ ] script 15:1175: `canvas.addEventListener('focusout', hide);`
- [ ] script 15:1176: `canvas.addEventListener('click', e=>{ const el = e.target.closest('.mlot'); if(el){ show(el, e.clientX, e.clientY); } });`
- [ ] script 15:1177: `scroll.addEventListener('scroll', hide);`
- [ ] script 15:1178: `window.addEventListener('resize', hide);`
- [ ] script 15:1179: `document.addEventListener('keydown', e=>{ if(e.key==='Escape') hide(); });`
- [ ] script 15:1183: `scroll.addEventListener('pointerdown', e=>{ if(e.pointerType!=='mouse' || e.button!==0) return; drag = {x:e.clientX, y:e.clientY, sl:scroll.scrollLeft, st:scroll.scrollTop, moved:false}; });`
- [ ] script 15:1184: `window.addEventListener('pointermove', e=>{`
- [ ] script 15:1190: `window.addEventListener('pointerup', ()=>{ drag = null; scroll.classList.remove('dragging'); });`
- [ ] script 15:1192: `document.getElementById('m-proj-chips').addEventListener('click', e=>{`
- [ ] script 15:1200: `document.getElementById('m-stats').addEventListener('click', e=>{`
- [ ] script 15:1208: `document.getElementById('m-search').addEventListener('input', e=>{ mapState.query = e.target.value.trim(); applyMapFiltros(); });`
- [ ] script 15:1209: `document.getElementById('m-zoom-in').addEventListener('click', ()=>{ mapState.zoom = Math.min(mapState.zoom*1.3, 5); applyMapZoom(); });`
- [ ] script 15:1210: `document.getElementById('m-zoom-out').addEventListener('click', ()=>{ mapState.zoom = Math.max(mapState.zoom/1.3, 1); applyMapZoom(); });`
- [ ] script 15:1211: `document.getElementById('m-zoom-fit').addEventListener('click', ()=>{ mapState.zoom = 1; applyMapZoom(); scroll.scrollTo({left:0, top:0}); });`
- [ ] script 15:1243: `['dragenter','dragover'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.add('drag');}));`
- [ ] script 15:1244: `['dragleave','drop'].forEach(type=>dropzone.addEventListener(type,event=>{event.preventDefault();dropzone.classList.remove('drag');}));`
- [ ] script 15:1245: `dropzone.addEventListener('drop',event=>{const file=event.dataTransfer.files[0];if(file)handleFile(file);});`
- [ ] script 15:1246: `dropzone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();fileInput.click();}});`
- [ ] script 15:1247: `fileInput.addEventListener('change',event=>{const file=event.target.files[0];if(file)handleFile(file);});`
- [ ] script 15:1248: `document.getElementById('resetBtn').addEventListener('click',()=>fileInput.click());`
- [ ] script 15:1249: `document.getElementById('exitDemo').addEventListener('click',()=>fileInput.click());`
- [ ] script 15:1317: `projectFilter.addEventListener('change',()=>{`
- [ ] script 15:1330: `document.querySelector('.overview-secondary').addEventListener('toggle',event=>{if(event.target.open)requestAnimationFrame(()=>Chart.getChart('o-activity')?.resize());});`
- [ ] script 15:1387: `tab.addEventListener('click',()=>selectPanel(tab.dataset.panel));`
- [ ] script 15:1388: `tab.addEventListener('keydown',event=>{`
- [ ] script 15:1396: `document.addEventListener('click',event=>{`
- [ ] script 15:1411: `menuToggle.addEventListener('click',()=>{`
- [ ] script 15:1419: `sidebar.addEventListener('keydown',event=>{`
- [ ] script 15:1424: `document.getElementById('sidebarClose').addEventListener('click',()=>{closeSidebar();menuToggle.focus({preventScroll:true});});`
- [ ] script 15:1425: `sidebarBackdrop.addEventListener('click',closeSidebar);navigationWide.addEventListener('change',syncNavigation);syncNavigation();`
- [ ] script 15:1427: `document.getElementById('densityToggle').addEventListener('click',event=>{const enabled=app.classList.toggle('compact');event.currentTarget.setAttribute('aria-pressed',String(enabled));event.currentTarget.setAttribute('aria-label',enabled?'Activar vista cómoda':'Activar vista compacta');});`
- [ ] script 15:1438: `expand.addEventListener('click',()=>toggleExpandedTable(card,expand));heading.append(tableTools(table),expand);`
- [ ] script 15:1445: `pager.querySelector('select').addEventListener('change',event=>{const s=tableStates.get(table);s.size=Number(event.target.value)||Infinity;s.page=0;paintTable(table);});`
- [ ] script 15:1446: `pager.querySelector('.page-prev').addEventListener('click',()=>{const s=tableStates.get(table);s.page=Math.max(0,s.page-1);paintTable(table);});`
- [ ] script 15:1447: `pager.querySelector('.page-next').addEventListener('click',()=>{tableStates.get(table).page++;paintTable(table);});`
- [ ] script 15:1455: `button.addEventListener('click',()=>{const s=tableStates.get(table);s.direction=s.column===index?-s.direction:1;s.column=index;s.page=0;table.querySelectorAll('thead th').forEach(header=>header.setAttribute('aria-sort','none'));th.setAttribute('aria-sort',s.direction===1?'ascending':'descending');paintTable(table);});th.append(button);`
- [ ] script 15:1492: `reportSearch.addEventListener('input',()=>{searchByPanel.set(document.querySelector('.tab.active').dataset.panel,reportSearch.value);applyReportSearch();});`
- [ ] script 15:1493: `reportSearch.addEventListener('keydown',event=>{if(event.key==='Escape'){reportSearch.value='';reportSearch.dispatchEvent(new Event('input'));event.stopPropagation();}});`
- [ ] script 15:1503: `document.getElementById('tableBackdrop').addEventListener('click',closeExpandedTable);`
- [ ] script 15:1504: `document.addEventListener('keydown',event=>{`
- [ ] script 15:1525: `document.getElementById('m-canvas').addEventListener('keydown',event=>{`
- [ ] script 15:1538: `document.getElementById('lotInspector').addEventListener('click',event=>{if(event.target.closest('[data-clear-lot]')){mapState.selectedId=null;document.querySelectorAll('#m-canvas .mlot').forEach(n=>{n.classList.remove('selected');n.setAttribute('aria-pressed','false');});resetInspector();document.getElementById('m-scroll').focus({preventScroll:true});return;}const button=event.target.closest('[data-show-map-rid]');if(button)showOnMap(Number(butt`
- [ ] script 15:1539: `document.getElementById('m-canvas').addEventListener('click',event=>{const lot=event.target.closest('.mlot');if(lot)inspectLot(lot);});`
- [ ] script 15:1540: `document.querySelectorAll('[data-map-view]').forEach(button=>button.addEventListener('click',()=>{mapState.view=button.dataset.mapView;mapState.zoom=1;document.querySelectorAll('[data-map-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));drawMapa();}));`
- [ ] script 15:1541: `document.getElementById('mapResetFilters').addEventListener('click',()=>{mapState.query='';mapState.filtros=new Set(['cargo','favor','ok','libre']);document.getElementById('m-search').value='';drawMapa();});`
- [ ] script 15:1548: `document.getElementById('downloadMap').addEventListener('click',()=>{`
- [ ] script 15:1554: `if(typeof ResizeObserver!=='undefined'){new ResizeObserver(()=>{if(sharedMapWorkspace.getClientRects().length)applyMapZoom();}).observe(document.getElementById('m-scroll'));}`
- [ ] script 15:1557: `document.getElementById('demoBtn').addEventListener('click',()=>{`
- [ ] script 15:2153: `exportXlsxBtn.addEventListener('click', async ()=>{`
- [ ] script 15:2448: `document.getElementById('pdfModalCancel').addEventListener('click', closePdfModal);`
- [ ] script 15:2449: `pdfModalOverlay.addEventListener('click', (e)=>{ if(e.target === pdfModalOverlay) closePdfModal(); });`
- [ ] script 15:2450: `pdfModalOverlay.addEventListener('keydown',event=>{`
- [ ] script 15:2463: `document.getElementById('pdfModalConfirm').addEventListener('click', ()=>{`
- [ ] script 15:2473: `exportPdfBtn.addEventListener('click', ()=>{`
- [ ] script 15:2811: `addEventListener('scroll',hideChartTip,{passive:true});`
- [ ] script 15:2834: `box.onclick=event=>{`
- [ ] script 15:2936: `document.getElementById('activityMode').addEventListener('click',event=>{`
- [ ] script 15:2997: `document.getElementById('agingSeg').addEventListener('click',event=>{`
- [ ] script 15:3032: `periodFrom.addEventListener('change',applyPeriod);periodTo.addEventListener('change',applyPeriod);`
- [ ] script 15:3033: `periodClear.addEventListener('click',()=>{periodFrom.value='';periodTo.value='';applyPeriod();});`
- [ ] script 15:3067: `const make=(name,label,run)=>{const button=document.createElement('button');button.type='button';button.className='icon-button';button.innerHTML=icon(name);button.title=label;button.setAttribute('aria-label',label);button.addEventListener('click',()=>run(table));return button;};`
- [ ] script 15:3071: `document.addEventListener('scroll',event=>{const box=event.target;if(box.classList&&box.classList.contains('scroll-table'))box.classList.toggle('scrolled-x',box.scrollLeft>2);},true);`
- [ ] script 15:3148: `sheetOverlay.addEventListener('click',async event=>{`
- [ ] script 15:3159: `grabber.addEventListener('touchstart',event=>{startY=event.touches[0].clientY;delta=0;clientSheet.style.transition='none';},{passive:true});`
- [ ] script 15:3160: `grabber.addEventListener('touchmove',event=>{if(startY===null)return;delta=Math.max(0,event.touches[0].clientY-startY);clientSheet.style.transform=ˋtranslateY(${delta}px)ˋ;},{passive:true});`
- [ ] script 15:3161: `grabber.addEventListener('touchend',()=>{if(startY===null)return;startY=null;clientSheet.style.transition='';if(delta>90)closeSheet();else clientSheet.style.transform='';});`
- [ ] script 15:3163: `document.addEventListener('click',event=>{`
- [ ] script 15:3170: `document.addEventListener('keydown',event=>{`
- [ ] script 15:3223: `paletteInput.addEventListener('input',()=>{paletteIndex=0;paintPalette();paletteList.scrollTop=0;});`
- [ ] script 15:3224: `paletteInput.addEventListener('keydown',event=>{`
- [ ] script 15:3229: `paletteOverlay.addEventListener('click',event=>{`
- [ ] script 15:3233: `paletteList.addEventListener('mousemove',event=>{const item=event.target.closest('.palette-item');if(item&&+item.dataset.i!==paletteIndex)movePalette(+item.dataset.i-paletteIndex);});`
- [ ] script 15:3234: `document.getElementById('searchTrigger').addEventListener('click',openPalette);`
- [ ] script 15:3236: `document.addEventListener('keydown',event=>{`
- [ ] script 15:3252: `main.addEventListener('touchstart',event=>{`
- [ ] script 15:3259: `main.addEventListener('touchmove',event=>{`
- [ ] script 15:3278: `main.addEventListener('touchend',finish);main.addEventListener('touchcancel',finish);`
- [ ] script 15:3292: `scroller.addEventListener('touchstart',event=>{pinch=event.touches.length===2?{distance:spread(event),zoom:mapState.zoom}:null;},{passive:true});`
- [ ] script 15:3293: `scroller.addEventListener('touchmove',event=>{`
- [ ] script 15:3297: `scroller.addEventListener('touchend',()=>{pinch=null;});`
- [ ] script 15:3298: `scroller.addEventListener('wheel',event=>{`
- [ ] script 15:3305: `matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{if(app.classList.contains('show')&&lastC&&!exportBusy){closeExpandedTable();refreshScope();}});`
- [ ] script 16:21: `new MutationObserver(()=>{`
- [ ] script 16:26: `if('ResizeObserver' in window){const watcher=new ResizeObserver(place);watcher.observe(nav);tabs.forEach(tab=>watcher.observe(tab));}`
- [ ] script 16:27: `addEventListener('resize',place);`
- [ ] script 17:24: `const listen=(el,event,fn,options)=>{el.addEventListener(event,fn,options);cleanups.push(()=>el.removeEventListener(event,fn,options));};`
- [ ] script 17:38: `const jobs=assets.map(img=>new Promise(resolve=>{if(img.complete&&img.naturalWidth)return resolve();const probe=img.loading==='lazy'?new Image():img;probe.addEventListener('load',resolve,{once:true});probe.addEventListener('error',resolve,{once:true});if(probe!==img)probe.src=img.currentSrc||img.src;if(probe.complete)resolve()}));`
- [ ] script 17:93: `const observer=new MutationObserver(()=>{scan();ScrollTrigger.refresh()});observer.observe($('#overviewProjects'),{childList:true});window.__templerProjectScan=scan;scan();`
- [ ] script 17:108: `listen(document,'pointermove',e=>{if(e.pointerType==='touch')return;root.classList.add('motion-cursor-ready');x(e.clientX);y(e.clientY);state(e.target)});`
- [ ] script 17:109: `listen(document,'pointerdown',()=>gsap.to(cursor,{scale:size/M.cursor.base*.8,duration:M.duration.fast,ease:M.ease.follow,overwrite:'auto'}));`
- [ ] script 17:110: `listen(document,'pointerup',e=>{previousSize=null;state(e.target)});`
- [ ] script 17:111: `listen(document,'pointerleave',()=>root.classList.remove('motion-cursor-ready'));`
- [ ] script 17:112: `listen(document,'pointerover',e=>{const p=e.target.closest('.project-summary');if(p&&!p.contains(e.relatedTarget))gsap.to(p,{scale:1.015,duration:M.duration.medium,ease:M.ease.follow})});`
- [ ] script 17:113: `listen(document,'pointerout',e=>{const p=e.target.closest('.project-summary');if(p&&!p.contains(e.relatedTarget))gsap.to(p,{scale:1,duration:M.duration.medium,ease:M.ease.follow,clearProps:'transform'})});`
- [ ] script 17:115: `listen(magnet,'pointermove',e=>{const r=magnet.getBoundingClientRect();gsap.to(magnet,{x:gsap.utils.clamp(-M.intensity.magnet,M.intensity.magnet,(e.clientX-r.left-r.width/2)*.05),y:gsap.utils.clamp(-M.intensity.magnet,M.intensity.magnet,(e.clientY-r.top-r.height/2)*.12),duration:M.duration.follow,ease:M.ease.follow,overwrite:'auto'})});`
- [ ] script 17:116: `listen(magnet,'pointerleave',()=>gsap.to(magnet,{x:0,y:0,duration:M.duration.medium,ease:M.ease.follow,clearProps:'transform'}));`
- [ ] script 17:125: `listen(window,'pageshow',reset);`
- [ ] script 17:126: `listen(document,'click',event=>{`
- [ ] script 17:193: `const observer=new ResizeObserver(measure);observer.observe(group);fonts().then(measure);`
- [ ] script 17:203: `const observer=new MutationObserver(()=>{if($('#app').classList.contains('show')){`
- [ ] script 17:217: `const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;`
- [ ] script 17:240: `if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();`
- [ ] script 17:245: `const context=document.modelContext;if(!context?.registerTool)return;`
- [ ] script 17:254: `for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}}`
- [ ] script 17:255: `addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort()},{once:true});`

## Implementation sequence

1. Phase 1 commit: additive glass stylesheet, fixed canvas host, UI wrapper.
2. Phase 2 commit: exact Three.js 0.170.0 local ES-module import map, primitive scene, responsive lifecycle and fallbacks.
3. Phase 3 commit: canonical data binding, instancing, hover/click/reverse links, constrained controls.
4. Phase 4 commit: motion, polish, regression tests and completed ledger.

## Verification strategy

- Preserve every original inline script/style and original markup element/attribute. Check a baseline manifest.
- Run existing operations suite against ?no3d=1 (original SVG presentation), then exercise the same interactions with the new scene enabled.
- New browser checks: actual WebGL raycast hover/click, drag threshold, reverse focus, runtime import/filter changes, instancing, camera limits, mobile/WebGL/kill-switch fallbacks, reduced motion, hidden-tab pause, teardown/restart, no new console errors/warnings.
- No existing lint/build command; use Node syntax checks and git diff --check.
- Capture desktop and mobile screenshots.
