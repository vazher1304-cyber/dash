/* Exercise the original control families beyond the existing operations suite. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');
let passed=0;function check(v,m){assert(v,m);passed++;}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write'],acceptDownloads:true,timezoneId:'America/Ciudad_Juarez'});
 await c.route('https://cdn.jsdelivr.net/**',async r=>r.fulfill({contentType:'application/javascript',body:await fs.readFile(path.join('/workspace/.templer-tools/cdn',path.basename(new URL(r.request().url()).pathname)))}));
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const panel=async name=>{await p.evaluate(name=>selectPanel(name,false,false),name);await p.waitForFunction(name=>document.querySelector('.panel.active').id==='panel-'+name,name);};
 try{
 await p.goto((process.env.TEMPLER_URL||'http://127.0.0.1:8000/index.html')+'?no3d=1');
 for(const key of ['Enter','Space']){const event=p.waitForEvent('filechooser');await p.locator('#dropzone').focus();await p.keyboard.press(key);await event;check(true,'Dropzone keyboard '+key);}
 await p.locator('#demoBtn').click();await p.waitForFunction(()=>sessionData.rows.length===96);
 for(const id of ['resetBtn','exitDemo']){const event=p.waitForEvent('filechooser');await p.locator('#'+id).click();await event;check(true,'File chooser '+id);}
 await p.locator('#skipLink').focus();await p.keyboard.press('Enter');check(await p.evaluate(()=>document.activeElement.id==='app-main'),'Skip link');
 await p.locator('#densityToggle').click();check(await p.locator('#app').evaluate(el=>el.classList.contains('compact')),'Density toggle');await p.locator('#densityToggle').click();
 // Every static and generated data-goto entry, including KPI cards and follow-up actions.
 for(const name of ['resumen','clientes','ventas','personal','puente','saldos','mapa']){
  await p.locator('#tab-'+name).click();check(await p.locator('#panel-'+name).isVisible(),'Actual navigation button '+name);
 }
 await panel('resumen');await p.locator('.overview-secondary>summary').click();
 const links=await p.locator('#panel-resumen [data-goto]').evaluateAll(nodes=>nodes.map((n,i)=>({i,to:n.dataset.goto})));
 for(const link of links){await panel('resumen');await p.locator('#panel-resumen [data-goto]').nth(link.i).click();check(await p.locator('#panel-'+link.to).isVisible(),'Overview navigation target '+link.to);}
 await panel('resumen');
 for(const mode of ['cum','month']){await p.locator(`#activityMode [data-mode="${mode}"]`).click();check(await p.locator(`#activityMode [data-mode="${mode}"]`).getAttribute('aria-pressed')==='true','Activity '+mode);}
 for(let i=0;i<3;i++){await p.locator('#overviewProjects [data-project]').nth(i).click();check(await p.locator('#projectFilter').inputValue()!=='','Project card '+i);await p.locator('#projectFilter').selectOption('');}
 for(const name of ['clientes','ventas','personal','puente','saldos']){
  await panel(name);
  const cards=p.locator('#panel-'+name+' .table-card');const count=await cards.count();
  for(let i=0;i<count;i++){
   const card=cards.nth(i);const sorts=card.locator('.sort-button');
   for(let j=0;j<await sorts.count();j++){await sorts.nth(j).click();check(await sorts.nth(j).locator('..').getAttribute('aria-sort')==='ascending',`Sort ${name}/${i}/${j}`);}
   const copy=card.locator('[aria-label="Copiar tabla"]');await copy.click();
   check((await p.evaluate(()=>navigator.clipboard.readText())).includes('\t'),'Copy table '+name+'/'+i);
   const downloaded=p.waitForEvent('download');await card.locator('[aria-label="Exportar tabla a Excel"]').click();const file=await downloaded;check(file.suggestedFilename().endsWith('.xlsx'),'Export table '+name+'/'+i);
   const next=card.locator('.page-next');
   if(await next.isVisible()&&await next.isEnabled()){
    await next.click();check(await card.locator('.page-prev').isEnabled(),'Next page '+name+'/'+i);await card.locator('.page-prev').click();
    await card.locator('.table-pager select').selectOption('0');check(await next.isDisabled(),'All rows '+name+'/'+i);
    await card.locator('.table-pager select').selectOption('10');
   }
   await card.locator('[aria-label^="Ampliar tabla:"]').click();check(await card.evaluate(el=>el.classList.contains('expanded')),'Expand table '+name+'/'+i);
   await p.keyboard.press('Escape');check(!await card.evaluate(el=>el.classList.contains('expanded')),'Close expanded table '+name+'/'+i);
  }
  const legends=p.locator('#panel-'+name+' .legend-item');
  for(let i=0;i<await legends.count();i++){await legends.nth(i).click();check(await legends.nth(i).getAttribute('aria-pressed')==='false','Chart legend '+name+'/'+i);await legends.nth(i).click();}
 }
 await panel('clientes');
 for(const days of [30,60,90,120]){await p.locator(`[data-days="${days}"]`).click();check(await p.locator(`[data-days="${days}"]`).getAttribute('aria-pressed')==='true','Aging '+days);}
 await p.locator('#reportSearch').fill('xyz');await p.locator('#reportSearch').press('Escape');check(await p.locator('#reportSearch').inputValue()==='','Report search Escape');
 const row=p.locator('#c-cargo-list tr[data-rid]').first();await row.focus();await row.press('Enter');await p.locator('#sheetOverlay.show').waitFor();
 await p.locator('[data-sheet-copy]').click();check((await p.evaluate(()=>navigator.clipboard.readText())).includes('Proyecto:'),'Copy client details');
 await p.locator('[data-sheet-close]').click();check(!await p.locator('#sheetOverlay').evaluate(el=>el.classList.contains('show')),'Sheet close button');
 await p.keyboard.press('Control+k');await p.locator('#paletteInput').fill('Ana');await p.locator('#paletteInput').press('ArrowDown');await p.locator('#paletteInput').press('ArrowUp');
 await p.locator('.palette-item').filter({hasText:'Ana '}).first().click();await p.locator('#sheetOverlay.show').waitFor();check(await p.locator('#sheetOverlay.show').isVisible(),'Palette pointer choice');await p.keyboard.press('Escape');
 await p.locator('#searchTrigger').click();await p.locator('#paletteOverlay').click({position:{x:5,y:5}});check(!await p.locator('#paletteOverlay').evaluate(el=>el.classList.contains('show')),'Palette outside click');
 await p.locator('#exportPdfBtn').click();for(const id of ['clientes','ventas','personal','puente','saldos'])await p.locator('#pdfSel-'+id).uncheck();
 await p.locator('#pdfModalConfirm').click();check(await p.locator('#pdfModalError').isVisible(),'PDF empty-selection validation');await p.locator('#pdfModalCancel').click();
 await p.locator('#exportPdfBtn').click();await p.locator('#pdfModalOverlay').click({position:{x:5,y:5}});check(!await p.locator('#pdfModalOverlay').evaluate(el=>el.classList.contains('show')),'PDF outside click');
 await panel('mapa');for(let i=0;i<3;i++){await p.locator('#m-proj-chips button').nth(i).click();check(await p.locator('#m-proj-chips button').nth(i).getAttribute('aria-pressed')==='true','Map project chip '+i);}
 for(const state of ['cargo','favor','ok','libre']){await p.locator(`#m-stats [data-st="${state}"]`).click();check(await p.locator(`#m-stats [data-st="${state}"]`).getAttribute('aria-pressed')==='false','Map status '+state);await p.locator('#mapResetFilters').click();}
 await p.locator('#tab-mapa').focus();await p.keyboard.press('Home');check(await p.locator('#tab-resumen').getAttribute('aria-selected')==='true','Navigation Home');await p.keyboard.press('End');check(await p.locator('#tab-mapa').getAttribute('aria-selected')==='true','Navigation End');await p.keyboard.press('ArrowUp');check(await p.locator('#tab-saldos').getAttribute('aria-selected')==='true','Navigation arrow');
 await p.setViewportSize({width:390,height:844});await p.locator('#menuToggle').click();await p.locator('#sidebarClose').click();check(!await p.locator('#sidebar').isVisible(),'Drawer close button');await p.locator('#menuToggle').click();await p.locator('#sidebarBackdrop').click({position:{x:380,y:500}});check(!await p.locator('#sidebar').isVisible(),'Drawer backdrop');
 check(errors.length===0,'No uncaught errors '+errors.join('\n'));console.log(`${passed} original-control checks passed.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
