// Верхняя картинка на телефоне: каждая страница открывается в профилях iPhone 13 и Pixel 7
// (playwright devices — мировой стандарт), проверяются картинки и фоны первого экрана.
// Режим заявки: PR=N, SHA=… — ждёт, пока превью rc-preview-pr/pr-N выложится с этим SHA.
// Режим сайта: PAGES="a.html b.html" BASE=живой сайт. Выход 1 — есть пустая обложка.
import { chromium, devices } from 'playwright';
import fs from 'fs';
const PHONES = ['iPhone 13', 'Pixel 7'];
const { PR, SHA } = process.env;
let base = process.env.BASE || 'https://arabelthera-dot.github.io/rc-museum-preview/';
let pages = (process.env.PAGES || '').split(/\s+/).filter(Boolean);
if (PR) {
  base = `https://arabelthera-dot.github.io/rc-preview-pr/pr-${PR}/`;
  let html = '';
  for (let i = 0; i < 40; i++) {  // Pages выкладывает ~1 мин, ждём до 10 мин
    try { const r = await fetch(base + '?v=' + Date.now()); html = r.ok ? await r.text() : ''; } catch { html = ''; }
    if (html.includes(SHA)) break;
    html = ''; await new Promise(r => setTimeout(r, 15000));
  }
  if (!html) { console.log(`превью pr-${PR} с ${SHA} не выложилось за 10 мин`); process.exit(1); }
  pages = [...html.matchAll(/<li><a href="([^"]+\.html)">/g)].map(m => m[1]);
}
console.log(`страниц: ${pages.length}, телефоны: ${PHONES.join(', ')}`);
fs.mkdirSync('phone-shots', { recursive: true });
const b = await chromium.launch();
const fails = [];
const jobs = pages.flatMap(p => PHONES.map(ph => [p, ph]));
let k = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (k < jobs.length) {
    const [page, phone] = jobs[k++];
    const ctx = await b.newContext(devices[phone]);
    const p = await ctx.newPage();
    const bad = new Set();
    p.on('response', r => { if (r.status() >= 400 && r.request().resourceType() === 'image') bad.add(r.url()); });
    p.on('requestfailed', r => { if (r.resourceType() === 'image') bad.add(r.url()); });
    let res;
    try {
      const doc = await p.goto(base + page + '?v=' + Date.now(), { waitUntil: 'load', timeout: 60000 });
      if (!doc || doc.status() >= 400) throw new Error('ответ ' + (doc ? doc.status() : 'нет'));
      await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      res = await p.evaluate(() => {
        const vh = innerHeight, out = { imgs: [], bgs: [] };
        const seen = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          return r.top < vh && r.bottom > 0 && r.width > 80 && r.height > 60 && s.visibility !== 'hidden' && s.display !== 'none'; };
        for (const i of document.images) if (i.getAttribute('src') && seen(i))
          out.imgs.push({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 });
        for (const el of document.querySelectorAll('body *')) if (seen(el)) {
          const m = getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/); if (m) out.bgs.push(m[1]); }
        return out;
      });
    } catch (e) { res = { err: String(e).split('\n')[0] }; }
    const why = [];
    if (res.err) why.push('не открылась: ' + res.err);
    else {
      for (const i of res.imgs) if (!i.ok) why.push('пустая картинка ' + i.src);
      for (const u of new Set(res.bgs)) if (bad.has(u)) why.push('пустой фон ' + u);
    }
    if (why.length) {
      fails.push(`${page} [${phone}]\n  ` + why.join('\n  '));
      await p.screenshot({ path: `phone-shots/${page.replace(/\//g, '_')}-${phone.replace(/ /g, '')}.png` }).catch(() => {});
    }
    await ctx.close();
  }
}));
await b.close();
const report = fails.length ? `❌ Пустой первый экран на телефоне — ${fails.length}:\n\n${fails.join('\n')}` : `✅ Первый экран на телефоне: ${pages.length} стр. × ${PHONES.length} телефона — всё грузится`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.replace(/\n/g, '  \n') + '\n');
process.exit(fails.length ? 1 : 0);
