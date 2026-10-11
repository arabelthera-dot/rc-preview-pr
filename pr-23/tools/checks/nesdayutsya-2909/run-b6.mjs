#!/usr/bin/env node
// Standalone producer for the existing interactive_contract.py schema.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

export const codes = ['entry','wrong','reset','mobile','nojs','score','main','empty'];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const self = fileURLToPath(import.meta.url);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};

export async function run({root, page: pageFile, plan: planFile, output, module: modulePath, install = false}) {
  root = await fs.realpath(root); pageFile = await fs.realpath(pageFile);
  planFile = await fs.realpath(planFile); output = path.resolve(output);
  const inside = p => { const rel = path.relative(root,p); return rel !== '..' && !rel.startsWith('../') && !path.isAbsolute(rel); };
  if (!inside(pageFile)) throw new Error('Page must be inside root');
  // Never overwrite an existing report, including on failure or rerun.
  await fs.mkdir(output, {recursive: true});
  const lock = await fs.open(path.join(output,'.run-lock'),'wx');
  await lock.close();
  const pins = new Map();
  async function pin(file, bytes) {
    file = await fs.realpath(file); bytes ??= await fs.readFile(file);
    const hash = sha(bytes);
    if (pins.has(file) && pins.get(file) !== hash) throw new Error(`Input changed during run: ${file}`);
    pins.set(file,hash); return bytes;
  }
  await pin(pageFile); await pin(self); await pin(planFile);
  const plan = await import(pathToFileURL(planFile).href + `?run=${Date.now()}`);
  for (const file of plan.dependencies || []) await pin(path.resolve(path.dirname(planFile),file));
  if (!plan.scenarios || typeof plan.scenarios !== 'object') throw new Error('Plan must export scenarios');
  for (const code of Object.keys(plan.scenarios)) if (!codes.includes(code)) throw new Error(`Unknown scenario: ${code}`);
  const {chromium} = await import(modulePath || process.env.RC_PLAYWRIGHT_MODULE || 'playwright');
  if (!process.env.PLAYWRIGHT_CDP) throw new Error('PLAYWRIGHT_CDP required');
  const browser = await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP);
  const contexts = new Set();
  const report = {schema_version:1, page_sha256:pins.get(pageFile), runner:path.relative(output,self),
    created_at:new Date().toISOString(), browser:browser.version(), plan:path.relative(output,planFile),
    inputs:{}, scenarios:{}, errors:[], environment:{origin:'http://b6.local', network:'local inputs only'}};
  const url = 'http://b6.local/' + path.relative(root,pageFile).split(path.sep).map(encodeURIComponent).join('/');
  try {
    for (const code of codes) {
      report.scenarios[code] = [];
      if (typeof plan.scenarios[code] !== 'function') continue;
      for (const width of code === 'mobile' ? [390,1440] : [390]) {
        const id = `${code}-${width}`, javascript = code !== 'nojs';
        const observation = {test_id:id, code, width, javascript_enabled:javascript, url, steps:[], checks:[], errors:[]};
        const context = await browser.newContext({viewport:{width,height:900},javaScriptEnabled:javascript,serviceWorkers:'block'});
        contexts.add(context);
        context.setDefaultTimeout(10000);
        await context.route('**/*', async route => {
          try {
            const u = new URL(route.request().url());
            if (u.origin !== 'http://b6.local') throw new Error(`Unpinned external request: ${u.origin}${u.pathname}`);
            const file = await fs.realpath(path.resolve(root,'.'+decodeURIComponent(u.pathname)));
            if (!inside(file)) throw new Error('Resource escapes root');
            const bytes = await pin(file);
            await route.fulfill({status:200,contentType:types[path.extname(file)] || 'application/octet-stream',body:bytes});
          } catch(e) { observation.errors.push(e.message); await route.abort(); }
        });
        const page = await context.newPage();
        page.on('pageerror',e => observation.errors.push(e.message));
        const check = (label,actual,expected) => {
          let ok = true;
          try { assert.deepEqual(actual,expected); } catch { ok = false; }
          observation.checks.push({label,actual,expected,ok});
          assert.ok(ok,`Assertion failed: ${label}`);
        };
        const step = async (label,fn) => { observation.steps.push(label); return await fn(); };
        let status = 'pass';
        try {
          await page.goto(url,{waitUntil:'load'});
          await plan.scenarios[code]({page,context,check,step,width});
          if (!observation.checks.length) throw new Error('Scenario executed no assertions');
          if (observation.errors.length) throw new Error('Browser/resource errors');
        } catch(e) { status='fail'; observation.errors.push(e.message); }
        try {
          const screenshot = path.join(output,`${id}.png`);
          await page.screenshot({path:screenshot,fullPage:true}); await pin(screenshot);
          observation.screenshot = path.basename(screenshot);
        } catch(e) { status='fail'; observation.errors.push(`Screenshot: ${e.message}`); }
        await context.close(); contexts.delete(context);
        if (observation.errors.length) status = 'fail';
        observation.status = status;
        const evidence = path.join(output,`${id}.json`);
        await fs.writeFile(evidence,JSON.stringify(observation,null,2)+'\n'); await pin(evidence);
        report.scenarios[code].push({test_id:id,status,automated:true,width,javascript_enabled:javascript,evidence:path.basename(evidence)});
      }
    }
    for (const [file,hash] of pins) if (sha(await fs.readFile(file)) !== hash) throw new Error(`Input changed before report: ${file}`);
  } catch(e) {
    report.errors.push(e.message);
    // A torn capture must never leave a valid PASS envelope.
    report.scenarios = {};
  } finally {
    for (const context of contexts) await context.close().catch(()=>{});
    await browser.close();
  }
  report.inputs = Object.fromEntries([...pins].map(([file,hash]) => [path.relative(output,file),hash]));
  const envelope = path.join(output,'browser.interactive.json');
  await fs.writeFile(envelope,JSON.stringify(report,null,2)+'\n');
  const complete = codes.every(code => report.scenarios[code]?.length && report.scenarios[code].every(x => x.status === 'pass'));
  let sidecar = null;
  if (install) {
    sidecar = pageFile + '.interactive.json';
    const target = path.dirname(sidecar);
    const rebase = p => path.relative(target,path.resolve(output,p));
    const installed = {...report, runner:rebase(report.runner), plan:rebase(report.plan),
      inputs:Object.fromEntries(Object.entries(report.inputs).map(([p,h]) => [rebase(p),h])),
      scenarios:Object.fromEntries(Object.entries(report.scenarios).map(([code,records]) =>
        [code,records.map(r=>({...r,evidence:rebase(r.evidence)}))]))};
    await fs.writeFile(sidecar,JSON.stringify(installed,null,2)+'\n',{flag:'wx'});
  }
  return {envelope,sidecar,complete,errors:report.errors,results:Object.fromEntries(codes.map(code => [code,report.scenarios[code]?.map(x=>x.status) || []]))};
}
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  const [root,page,plan,output] = process.argv.slice(2);
  if (!root || !page || !plan || !output) { console.error('Usage: node run-b6.mjs ROOT PAGE PLAN.mjs NEW_OUTPUT_DIR [--install]'); process.exitCode=2; }
  else try { const result=await run({root,page,plan,output,install:process.argv[6] === '--install'}); console.log(JSON.stringify(result,null,2)); process.exitCode=result.complete?0:1; }
  catch(e) { console.error(e.message); process.exitCode=2; }
}
