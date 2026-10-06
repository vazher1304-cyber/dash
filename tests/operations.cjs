/* Browser regression checks. No application dependencies or build step are required.
 * Run against the local static server; optional TEMPLER_CDN_CACHE contains the
 * exact upstream motion scripts, downloaded with TLS verification enabled.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const base=process.env.TEMPLER_URL||'http://127.0.0.1:8000/index.html';
let passed=0;
function check(condition,message){assert(condition,message);passed++;}
const panel=async(page,name)=>{await page.evaluate(name=>selectPanel(name,false,false),name);await page.waitForFunction(name=>document.querySelector('.panel.active').id==='panel-'+name,name);};
const visible=async(page,selector)=>page.locator(selector).isVisible();
const model=page=>page.evaluate(()=>JSON.parse(JSON.stringify({rows:sessionData.rows,c:lastC,v:lastV,p:lastP,pt:lastPt,s:lastS})));
async function ready(page){await page.goto(base);await page.locator('#demoBtn').click();await page.waitForFunction(()=>sessionData.rows.length===96);}
async function fixture(page,rows,extension='xlsx'){
 return Buffer.from(await page.evaluate(({rows,extension})=>{
  const sheet=XLSX.utils.aoa_to_sheet(rows);
  if(extension==='csv')return Array.from(new TextEncoder().encode('\ufeff'+XLSX.utils.sheet_to_csv(sheet)));
  const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,'Reporte');
  return Array.from(new Uint8Array(XLSX.write(book,{bookType:extension,type:'array'})));
 },{rows,extension}));
}
async function upload(page,buffer,name,expected){
 await page.locator('#fileInput').setInputFiles({name,mimeType:'application/octet-stream',buffer});
 await page.waitForFunction(({name,expected})=>!exportBusy&&sessionData.fileName===name&&sessionData.rows.length===expected,{name,expected});
}
async function rowLot(page,id){const index=await page.evaluate(id=>mapState.lots.findIndex(l=>l.r._id===id),id);assert(index>=0,'Row must have a lot in the displayed project');return page.locator(`#m-canvas .mlot[data-i="${index}"]`);}
async function download(page,selector,dir){const [file]=await Promise.all([page.waitForEvent('download'),page.locator(selector).click()]);const filename=path.join(dir,file.suggestedFilename());await file.saveAs(filename);return filename;}
async function assertWidth(page){check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-level horizontal overflow');}
(async()=>{
 const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'templer-validation-'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',timezoneId:'America/Ciudad_Juarez',acceptDownloads:true});
 if(process.env.TEMPLER_CDN_CACHE){await context.route('https://cdn.jsdelivr.net/**',async route=>{
  const filename=path.basename(new URL(route.request().url()).pathname);
  await route.fulfill({contentType:'application/javascript',body:await fs.readFile(path.join(process.env.TEMPLER_CDN_CACHE,filename))});
 });}
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
 await ready(page);
 check(await page.locator('#o-homes').innerText()==='96','Demo home count');
 check(await page.locator('#o-assigned').innerText()==='81','Demo assignments');
 check(await page.locator('#o-unassigned').innerText()==='15','Demo unassigned units');
 check(await page.locator('#m-canvas .mlot').count()===96,'All projects represented in the overview');
 check(await page.locator('#m-canvas .street-name,#m-canvas .park,#m-canvas .neighbor').count()===0,'Overview contains no invented surroundings');
 check(await page.locator('#sharedMapWorkspace').count()===1,'A single map workspace');
 check(await visible(page,'#sidebar')&&!await visible(page,'#menuToggle'),'Persistent desktop navigation');
 check(await page.locator('#reportNavigation').getAttribute('aria-orientation')==='vertical','Vertical sidebar keyboard semantics');
 check((await page.locator('#lotInspector').innerText()).includes('Todos los proyectos'),'Useful contextual summary before selection');
 check(await page.locator('#lotInspector [data-goto="clientes"],#lotInspector [data-goto="ventas"]').count()>=2,'Summary actions navigate to real reports');
 check(await page.evaluate(()=>{const metrics=document.querySelector('.overview-metrics').getBoundingClientRect(),detail=document.querySelector('.map-inspector').getBoundingClientRect(),map=document.getElementById('m-scroll').getBoundingClientRect();return Math.abs(metrics.top-detail.top)<2&&detail.left>=map.right&&map.height>metrics.height*3;}),'KPI / large model / right detail composition');
 check(await page.evaluate(()=>{const map=document.getElementById('m-scroll').getBoundingClientRect(),svg=document.querySelector('.map-svg').getBoundingClientRect();return svg.left>=map.left&&svg.right<=map.right&&svg.top>=map.top&&svg.bottom<=map.bottom+1;}),'Fitted overview shows the entire model');
 check(await page.locator('#m-canvas .lot-depth').count()===96,'Schematic depth follows actual lots');
 check(!await page.locator('.overview-secondary').evaluate(el=>el.open),'Secondary charts start compact');
 await page.locator('.overview-secondary>summary').click();
 check(await visible(page,'#o-activity')&&await page.locator('#o-activity').evaluate(el=>el.width>0),'Optional activity chart expands correctly');
 await page.locator('.overview-secondary>summary').click();
 await assertWidth(page);
 await page.screenshot({path:path.join(temporary,'overview-desktop.png'),fullPage:true});
 await page.locator('#projectFilter').selectOption('bosque poniente · ejemplo');
 check(await page.locator('#o-homes').innerText()==='32','The global project filter changes the overview scope');
 check(await page.evaluate(()=>sessionData.scope.every(r=>proyectoDe(r)==='Bosque Poniente · ejemplo')),'Canonical scope agrees with project');
 check(await page.locator('#m-canvas .mlot').count()===32&&(await page.locator('#lotInspector').innerText()).includes('Bosque Poniente'),'Project filter updates model and unselected summary');
 check(await page.evaluate(()=>selectDisplayedMapProject().lots.every(l=>sessionData.scope.includes(l.r))),'Map uses canonical project membership');
 check((await page.locator('#o-cargo').innerText())==='$5,850,000','Project filter updates lower financial summary');
 const selectedId=await page.evaluate(()=>mapState.lots.find(l=>l.status==='cargo').r._id);
 const lot=await rowLot(page,selectedId);await lot.focus();await lot.press('Enter');
 check(await lot.getAttribute('aria-pressed')==='true','Keyboard lot selection');
 const initialDetail=await page.locator('#lotInspector').innerText();
 check(initialDetail.includes('Bosque Poniente')&&initialDetail.includes('Precio de venta'),'Context panel includes real property fields');
 await page.locator('#m-zoom-in').click();
 check(await page.evaluate(id=>mapState.selectedId===id,selectedId),'Zoom preserves selected row');
 await page.locator('#m-zoom-in').click();await page.locator('#m-zoom-in').click();await page.locator('#m-zoom-in').click();
 await page.locator('#m-scroll').scrollIntoViewIfNeeded();
 const scrollBox=await page.locator('#m-scroll').boundingBox();
 const beforePan=await page.locator('#m-scroll').evaluate(el=>el.scrollLeft);
 await page.mouse.move(scrollBox.x+scrollBox.width/2,scrollBox.y+20);await page.mouse.down();await page.mouse.move(scrollBox.x+scrollBox.width/2-100,scrollBox.y+20,{steps:5});await page.mouse.up();
 check(await page.locator('#m-scroll').evaluate(el=>el.scrollLeft)>beforePan,'Mouse drag pans the shared map');
 const beforeWheel=await page.evaluate(()=>mapState.zoom);
 await page.keyboard.down('Control');await page.mouse.wheel(0,-20);await page.keyboard.up('Control');
 await page.waitForFunction(before=>mapState.zoom>before,beforeWheel);
 check(await page.evaluate(()=>mapState.zoom)<=5,'Ctrl-wheel zoom respects the limit');

 await page.locator('[data-map-view="perspective"]').click();
 check(await (await rowLot(page,selectedId)).getAttribute('aria-pressed')==='true','Perspective redraw preserves selection');
 await page.locator('[data-map-view="plan"]').click();
 await page.locator('#mapResetFilters').click();
 check(await page.locator('#lotInspector').innerText()===initialDetail,'Reset preserves context');
 await page.locator('#m-search').fill('no-match-999999');
 check(await page.locator('#m-canvas .mlot:not(.dim)').count()===0,'Map search empty state');
 check(await page.locator('#m-canvas .mlot[tabindex="0"]').count()===0,'Filtered lots leave the tab order');
 await page.locator('#mapResetFilters').click();
 await page.locator('#m-stats [data-st="cargo"]').click();
 check(await page.locator('#m-canvas .st-cargo:not(.dim)').count()===0,'Status filter');
 await page.locator('#mapResetFilters').click();
 await page.locator('#lotInspector [data-open-rid]').click();await page.locator('#sheetOverlay.show').waitFor({state:'visible'});
 check(await visible(page,'#sheetOverlay.show'),'Full client sheet');
 await page.keyboard.press('Escape');await page.locator('#sheetOverlay.show').waitFor({state:'hidden'});
 check(!await visible(page,'#sheetOverlay.show'),'Sheet closes via keyboard');
 await page.locator('#lotInspector [data-show-map-rid]').click();
 await page.waitForFunction(()=>document.getElementById('panel-mapa').classList.contains('active'));
 check(await page.evaluate(id=>mapState.selectedId===id,selectedId),'Show on map retains selection');
 check(await page.locator('#m-canvas .street-name').count()>0,'Detailed plan retains original rendering');
 await panel(page,'resumen');
 check(await page.evaluate(id=>mapState.selectedId===id,selectedId),'Cross-view selection');
 check(await page.locator('#overviewMapHost #sharedMapWorkspace').count()===1,'Overview uses the original workspace');
 await page.locator('#projectFilter').selectOption('');
 for(const name of ['clientes','ventas','personal','puente','saldos','mapa']){
  await panel(page,name);check(await visible(page,'#panel-'+name),'Report '+name+' remains available');
  check(await page.locator('#tab-'+name).getAttribute('aria-selected')==='true','Report tab state '+name);
 }
 await panel(page,'resumen');
 // Representative imported data exercises dates, amounts, project accents and safe text rendering.
 const cells=[['LoteID','Fraccionamiento','Prototipo','Saldo Edo Cuenta','Nombre Cliente','Precio Venta','F Estim Escritura','Manzana','Lote','Tamaño Lote','Monto Liberacion','Suma de Servicio Credito Puente','Credito Plan Ventas','Calle'],
 ['M1-L1','Álamo','Cedro',150000,'Ana',1500000,'2026-02-15',1,1,120,500000,100000,'Bancario','Cedro'],
 ['M1-L2','Álamo','Cedro',-20000,'Luis',1600000,'2026-03-15',1,2,132,500000,500000,'Contado','Cedro'],
 ['M1-L3','Álamo','Olivo',0,'',0,'',1,3,144,0,0,'',''],
 ['M2-L1','Bosque','Encino',0,'Eva',1800000,'',2,1,150,600000,200000,'Bancario','Encino'],
 ['M2-L2','Bosque','Olivo',200,'<img src=x onerror=alert(1)>',1900000,'2026-04-15',2,2,120,300000,0,'Contado','Olivo']];
 for(const extension of ['xlsx','xls','csv']){
  await upload(page,await fixture(page,cells,extension),'fixture.'+extension,5);
  const actual=await model(page);
  check(actual.c.totalViviendas===5&&actual.c.escrituradas===3,'Import counts '+extension);
  check(actual.c.saldoNeto===130200&&actual.c.creditosSaldoFavor===-20000,'Import balances '+extension);
  check(actual.v.valorCasasConPrecioVenta===6800000&&actual.pt.pendientePuente===1100000,'Sales and bridge '+extension);
  check(actual.s.proyectos.some(p=>p.nombre==='Álamo'),'Unicode project '+extension);
  check(await page.locator('#o-assigned').innerText()==='4'&&await page.locator('#o-unassigned').innerText()==='1','Assignment KPIs '+extension);
  check(!await visible(page,'#demoBanner'),'Import replaces demo '+extension);
  check(await page.evaluate(()=>mapState.selectedId===null),'Reimport clears stale selection '+extension);
 }
 if(process.env.TEMPLER_BASELINE_MODEL){const baseline=JSON.parse(await fs.readFile(process.env.TEMPLER_BASELINE_MODEL,'utf8'));assert.deepEqual(await model(page),baseline);passed++;}
 await page.locator('#projectFilter').selectOption('bosque');
 const malicious=await rowLot(page,4);await malicious.click();
 check((await page.locator('#lotInspector').innerText()).includes('<img src=x'),'Imported names display as text');
 check(await page.locator('#lotInspector img').count()===0,'No imported markup injected');
 await page.locator('#searchTrigger').click();await page.locator('#paletteInput').fill('Ana');await page.locator('#paletteInput').press('Enter');await page.locator('#sheetName').waitFor({state:'visible'});
 check((await page.locator('#sheetBody').innerText()).includes('Ana'),'Global search reaches a row outside the project scope');
 await page.locator('[data-sheet-map]').click();await page.waitForFunction(()=>mapState.selectedId===0);
 check(await page.evaluate(()=>projectFilter.value===''),'Show on map reconciles global project scope');
 await panel(page,'ventas');await page.locator('#periodFrom').selectOption('2026-02');await page.locator('#periodTo').selectOption('2026-02');
 check(await page.evaluate(()=>lastV.valorCasasConPrecioVenta===1500000&&lastP.totalEscrituradas===1),'Period filters apply to sales and personal');
 await panel(page,'resumen');
 check((await page.locator('#o-sales-period').innerText()).toLowerCase().includes('feb'),'Overview identifies the active sales period');
 check(await page.locator('#o-homes').innerText()==='5','Period preserves existing inventory scope');
 check(await page.evaluate(()=>mapState.selectedId===0),'Period refresh preserves selected lot');
 await panel(page,'ventas');await page.locator('#periodClear').click();
 await page.locator('#reportSearch').fill('no-matches');check(await visible(page,'#panel-ventas .filter-empty'),'Report search empty state');
 await page.locator('#reportSearch').fill('');await panel(page,'resumen');
 const excel=await download(page,'#exportXlsxBtn',temporary);
 const bytes=await fs.readFile(excel);
 const sheets=await page.evaluate(data=>{const book=XLSX.read(new Uint8Array(data),{type:'array'});return{names:book.SheetNames,kpis:XLSX.utils.sheet_to_json(book.Sheets['KPIs Clientes'],{header:1})};},Array.from(bytes));
 check(sheets.names.includes('Dashboard')&&sheets.names.includes('KPIs Clientes'),'Excel workbook sheets');
 check(sheets.kpis.some(row=>row[0]==='Total de viviendas'&&row[1]===5),'Excel contains canonical totals');
 await page.locator('#exportPdfBtn').click();const pdf=await download(page,'#pdfModalConfirm',temporary);
 check((await fs.readFile(pdf)).subarray(0,5).toString()==='%PDF-','PDF download');
 const text=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});
 check(text.includes('Clientes y cobranza')&&text.includes('Ventas')&&text.includes('Crédito puente'),'PDF contains selected report sections');
 check(await page.evaluate(()=>!exportBusy&&sessionData.rows.length===5),'Export leaves the app usable');
 const svg=await download(page,'#downloadMap',temporary);check((await fs.readFile(svg,'utf8')).includes('class="mlot'),'SVG plan export');
 // A valid workbook with missing optional columns must not invent monetary KPIs.
 const missing=[['LoteID','Fraccionamiento','Prototipo','Nombre Cliente','Manzana','Lote'],['X1','Sin importes','Cedro','Ana',1,1]];
 await upload(page,await fixture(page,missing),'missing.xlsx',1);
 check(!await visible(page,'#overviewSales')&&!await visible(page,'#overviewBridge')&&!await visible(page,'#overviewBalance'),'Unsupported monetary KPIs are omitted');
 check(await visible(page,'#overviewDataNote'),'Missing data is explained');
 check(await page.locator('#m-canvas .mlot').count()===1,'Incomplete row still has a lot');
 check(await page.locator('#m-canvas .st-unknown').count()===1,'Unknown balance is not presented as current status');
 check(await page.locator('#overviewProjects .project-progress').count()===0,'Missing date column does not imply zero project progress');
 // No lot identifiers: report data still loads and the map has a meaningful empty state.
 const noLots=[['Fraccionamiento','Prototipo','Saldo Edo Cuenta','Nombre Cliente','Precio Venta','Credito Plan Ventas'],['Sin lotes','Cedro',100,'Ana',1000,'Contado']];
 await upload(page,await fixture(page,noLots),'no-lots.xlsx',1);
 check((await page.locator('#m-canvas').innerText()).includes('No encontré lotes'),'Map empty state');
 check(await page.evaluate(()=>mapState.lots.length===0&&mapState.selectedId===null),'Empty map clears stale state');
 check(!await visible(page,'#overviewHomes')&&!await visible(page,'#overviewAssigned'),'No unsupported unit counts');
 await page.evaluate(()=>enterWorkspace([],'Sin registros',false,[]));
 check(await page.locator('#overviewProjects .empty-state').count()===1,'Empty dataset project state');
 // Desktop, dark mode, narrow widths, touch and keyboard without hover.
 await page.evaluate(()=>document.getElementById('demoBtn').click());
 for(const width of [1024,768,390,320]){
  await page.setViewportSize({width,height:900});await assertWidth(page);
  check(!await visible(page,'#sidebar')&&await visible(page,'#menuToggle'),'Narrow navigation collapses at '+width);
  check(await page.locator('.app-brand strong').isVisible(),'Brand remains visible at '+width);
  await page.locator('#menuToggle').click();
  check(await visible(page,'#sidebar')&&await page.locator('#sidebar').getAttribute('aria-modal')==='true','Accessible drawer at '+width);
  check(await page.locator('#tab-ventas>span:not(.nav-marker)').evaluate(el=>parseFloat(getComputedStyle(el).opacity)===1&&el.getBoundingClientRect().width>20),'Inactive report labels remain visible at '+width);
  check(await page.evaluate(()=>document.getElementById('app-main').inert),'Drawer suspends background keyboard navigation');
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  check(await page.evaluate(()=>document.getElementById('sidebar').contains(document.activeElement)),'Drawer traps keyboard focus');
  await page.keyboard.press('Escape');
  check(!await visible(page,'#sidebar')&&await page.evaluate(()=>document.activeElement.id==='menuToggle'&&!document.getElementById('app-main').inert),'Escape closes drawer and restores focus');
  await page.screenshot({path:path.join(temporary,'overview-'+width+'.png'),fullPage:true});
 }
 await page.setViewportSize({width:1800,height:1000});await assertWidth(page);
 check(await visible(page,'#sidebar'),'Wide desktop restores persistent sidebar');
 await page.setViewportSize({width:320,height:900});
 await page.emulateMedia({colorScheme:'dark'});await assertWidth(page);
 await page.screenshot({path:path.join(temporary,'overview-dark.png'),fullPage:true});
 const target=await rowLot(page,1);await target.focus();await target.press('Space');
 check(await target.getAttribute('aria-pressed')==='true','Space selects a lot at narrow width');
 await page.locator('[data-clear-lot]').click();
 check(await page.evaluate(()=>mapState.selectedId===null)&&await page.locator('#lotInspector .project-inspector').count()===1,'Clearing selection restores real project summary');
 await target.focus();await target.press('Enter');
 await page.locator('#lotInspector [data-open-rid]').click();await page.locator('#sheetName').waitFor({state:'visible'});await page.keyboard.press('Escape');
 check(await page.evaluate(()=>document.activeElement.matches('[data-open-rid]')),'Focus returns after closing the client sheet');
 const touchPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 if(process.env.TEMPLER_CDN_CACHE)await touchPage.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 touchPage.on('pageerror',error=>errors.push(error.message));await ready(touchPage);
 await touchPage.locator('#m-canvas .mlot').nth(1).tap();
 check(await touchPage.locator('#m-canvas [aria-pressed="true"]').count()===1,'Touch selection without hover');
 await touchPage.locator('#m-scroll').scrollIntoViewIfNeeded();
 const touchBox=await touchPage.locator('#m-scroll').boundingBox();
 const cx=touchBox.x+touchBox.width/2,cy=touchBox.y+80;
 const touchSession=await touchPage.context().newCDPSession(touchPage);
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-25,y:cy},{x:cx+25,y:cy}]});
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-55,y:cy},{x:cx+55,y:cy}]});
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 check(await touchPage.evaluate(()=>mapState.zoom>1),'Two-finger pinch zooms the shared map');
 await touchPage.close();
 if(process.env.TEMPLER_CDN_CACHE){
  const motionContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',timezoneId:'America/Ciudad_Juarez'});
  await motionContext.route('https://cdn.jsdelivr.net/**',async route=>{const filename=path.basename(new URL(route.request().url()).pathname);await route.fulfill({contentType:'application/javascript',body:await fs.readFile(path.join(process.env.TEMPLER_CDN_CACHE,filename))});});
  const motionPage=await motionContext.newPage();motionPage.on('pageerror',error=>errors.push(error.message));
  await ready(motionPage);await motionPage.waitForFunction(()=>!!window.TemplerMotion);
  check(await motionPage.locator('#o-homes').innerText()==='96','Overview values are immediate with motion enabled');
  check(await motionPage.locator('#overviewMapHost .map-board').evaluate(el=>getComputedStyle(el).opacity)==='1','Map has no reveal animation delay');
  await motionPage.locator('#m-canvas .mlot').nth(1).click();const selected=await motionPage.evaluate(()=>mapState.selectedId);
  await motionPage.locator('.overview-operation [data-goto="mapa"]').click();await motionPage.waitForFunction(()=>document.getElementById('panel-mapa').classList.contains('active'));
  await motionPage.locator('#tab-resumen').click();
  await motionPage.waitForFunction(()=>document.getElementById('panel-resumen').classList.contains('active'));
  check(await motionPage.evaluate(id=>mapState.selectedId===id,selected),'Desktop sidebar navigation preserves lot selection with motion enabled');
  check(await motionPage.locator('#overviewProjects .project-summary').first().evaluate(el=>getComputedStyle(el).opacity)==='1','Project summaries remain visible without scrolling to reveal them');
  await motionPage.waitForFunction(()=>{const box=document.getElementById('motionCurtain').getBoundingClientRect();return box.top>=innerHeight||box.bottom<=0;});
  await motionPage.screenshot({path:path.join(temporary,'overview-motion.png'),fullPage:false});
  await motionPage.setViewportSize({width:390,height:844});await motionPage.locator('#menuToggle').click();
  await motionPage.locator('#tab-clientes').press('Enter');await motionPage.waitForFunction(()=>document.getElementById('panel-clientes').classList.contains('active'));
  check(!await visible(motionPage,'#sidebar')&&await visible(motionPage,'#panel-clientes'),'Motion uses the same working mobile drawer');
  await motionContext.close();
 }
 check(errors.length===0,'No uncaught browser errors: '+errors.join('\n'));
 console.log(`${passed} checks passed. Artifacts: ${temporary}`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
