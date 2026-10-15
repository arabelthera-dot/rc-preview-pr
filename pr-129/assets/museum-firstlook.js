/* museum-firstlook.js — движок «Первозданный облик» (механики M-39, M-47, M-48, M-49).

   Зачем: принцип Сергея от 11.08.2026 — «наша задача показывать красоту того, как это было
   тогда». Экспонат показывается в первозданном виде, нынешнее состояние — рядом, как «стало».
   Никаких внешних библиотек (JuxtaposeJS не подключаем): одна разметка, один файл, офлайн.

   Два режима в одном движке:
     mode:'shutter' — два состояния, посетитель тащит границу по кадру (M-47);
     mode:'eras'    — 2–5 закреплённых дат, посетитель жмёт кнопку даты (M-48 + M-49).

   ЖЁСТКОЕ ПРАВИЛО ВЁРСТКИ (Сергей, 03.08): текст никогда не лежит на картинке.
   Внутри кадра — только изображение и ручка-перетаскиватель. Даты, подписи, слой
   достоверности, источник — отдельными строками ПОД кадром.

   Подключение:
     <section class="block" id="firstlook"></section>
     <script>window.MUSEUM_FIRSTLOOK=[{
       mount:'#firstlook',                       // необязательно, по умолчанию #firstlook
       eyebrow:'Первозданный облик',
       title:'Изба, какой её видели в 1870 году',
       lead:'Потяни границу: слева свежий сруб и роспись, справа то же дерево сегодня.',
       mode:'shutter',                           // 'shutter' | 'eras'
       ratio:'16/10',                            // пропорции кадра, по умолчанию 16/10
       states:[
         {date:'1870', label:'Свежий сруб', img:'media/izba-1870.svg', alt:'…',
          kind:'Реконструкция', caption:'Тёс ещё золотой, роспись читается с дороги.',
          source:'Реконструкция музея по образцам городецкой росписи'},
         {date:'сегодня', label:'То, что осталось', img:'media/izba-now.svg', alt:'…',
          kind:'Фотография', caption:'Дерево почернело, роспись сошла.', source:'…'}
       ]
     }];</script>
     <script src="../assets/museum-firstlook.js"></script>

   Если конфига нет или точка монтирования не найдена — движок молчит и страницу не трогает.
*/
(function () {
  'use strict';

  var CFG = window.MUSEUM_FIRSTLOOK;
  if (!CFG) return;
  if (!Array.isArray(CFG)) CFG = [CFG];
  if (!CFG.length) return;

  var CSS_ID = 'fl-style';
  var css = ''
    + '.fl{margin:0 0 clamp(28px,5vw,48px)}'
    + '.fl-head{max-width:60ch;margin:0 0 18px}'
    + '.fl-eyebrow{font:600 10px/1.4 Inter,system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;'
    + 'color:var(--fl-accent,#a8813a);margin:0 0 10px}'
    + '.fl-title{font:700 clamp(21px,3.2vw,30px)/1.22 "Playfair Display",Georgia,serif;margin:0 0 8px;'
    + 'color:var(--fl-fg,inherit)}'
    + '.fl-lead{font:400 15px/1.62 Inter,system-ui,sans-serif;margin:0;opacity:.82}'
    + '.fl-frame{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;border-radius:14px;'
    + 'background:var(--fl-frame-bg,#0d0f13);box-shadow:0 18px 44px rgba(0,0,0,.28);touch-action:pan-y;'
    + 'user-select:none;-webkit-user-select:none}'
    + '.fl-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}'
    + '.fl-layer[data-role="top"]{clip-path:inset(0 0 0 50%)}'
    + '.fl-mode-eras .fl-layer{opacity:0;transition:opacity .45s ease}'
    + '.fl-mode-eras .fl-layer.is-on{opacity:1}'
    + '.fl-handle{position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;'
    + 'background:rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(0,0,0,.25);cursor:ew-resize;z-index:3}'
    + '.fl-grip{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;'
    + 'background:rgba(255,255,255,.94);box-shadow:0 6px 18px rgba(0,0,0,.35);display:flex;align-items:center;'
    + 'justify-content:center;gap:5px}'
    + '.fl-grip i{display:block;width:0;height:0;border:6px solid transparent}'
    + '.fl-grip i:first-child{border-right-color:#1b1d22}'
    + '.fl-grip i:last-child{border-left-color:#1b1d22}'
    + '.fl-frame:focus-visible{outline:3px solid var(--fl-accent,#a8813a);outline-offset:3px}'
    + '.fl-rail{width:100%;margin:12px 0 0;display:block;accent-color:var(--fl-accent,#a8813a);cursor:ew-resize}'
    + '.fl-eras{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}'
    + '.fl-era{font:600 12px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;padding:10px 15px;border-radius:999px;'
    + 'border:1px solid var(--fl-line,rgba(128,128,128,.42));background:transparent;color:inherit;cursor:pointer;'
    + 'transition:background .18s ease,color .18s ease,border-color .18s ease}'
    + '.fl-era:hover{border-color:var(--fl-accent,#a8813a)}'
    + '.fl-era[aria-pressed="true"]{background:var(--fl-accent,#a8813a);border-color:var(--fl-accent,#a8813a);color:#fff}'
    + '.fl-ends{display:flex;justify-content:space-between;gap:16px;margin:12px 0 0;'
    + 'font:600 11px/1.4 Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.72}'
    + '.fl-ends span:last-child{text-align:right}'
    + '.fl-caption{margin:12px 0 0;font:400 15px/1.6 Inter,system-ui,sans-serif;max-width:62ch}'
    + '.fl-caption b{font-weight:700}'
    + '.fl-meta{margin:8px 0 0;font:400 12px/1.5 Inter,system-ui,sans-serif;opacity:.62;max-width:62ch}'
    + '.fl-kind{display:inline-block;font:600 10px/1 Inter,system-ui,sans-serif;letter-spacing:.16em;'
    + 'text-transform:uppercase;padding:5px 9px;border-radius:4px;border:1px solid var(--fl-line,rgba(128,128,128,.42));'
    + 'margin:0 8px 0 0;vertical-align:middle;opacity:.9}'
    + '@media (max-width:560px){.fl-frame{aspect-ratio:4/3}.fl-ends{font-size:10px;letter-spacing:.1em}}'
    + '@media (prefers-reduced-motion:reduce){.fl-mode-eras .fl-layer{transition:none}}';

  function styleOnce() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function image(state, role) {
    var img = el('img', 'fl-layer');
    img.src = state.img;
    img.alt = state.alt || state.label || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    if (role) img.setAttribute('data-role', role);
    return img;
  }

  /* Подпись под кадром: слой достоверности + текст + источник. Внутрь кадра не попадает никогда. */
  function describe(capNode, metaNode, state) {
    var kind = state.kind ? '<span class="fl-kind">' + esc(state.kind) + '</span>' : '';
    var date = state.date ? '<b>' + esc(state.date) + '</b>' + (state.caption ? ' · ' : '') : '';
    capNode.innerHTML = kind + date + esc(state.caption || '');
    metaNode.textContent = state.source ? 'Источник: ' + state.source : '';
    metaNode.style.display = state.source ? '' : 'none';
  }

  function buildShutter(box, item) {
    var a = item.states[0], b = item.states[1];
    var frame = el('div', 'fl-frame');
    if (item.ratio) frame.style.aspectRatio = item.ratio;
    // вертикальный архивный кадр во всю ширину колонки съедает экран целиком:
    // maxw держит его в разумном поле и центрует
    if (item.maxw) { frame.style.maxWidth = item.maxw; frame.style.margin = '0 auto'; }
    frame.appendChild(image(a, 'bottom'));
    var top = image(b, 'top');
    frame.appendChild(top);

    var handle = el('div', 'fl-handle');
    handle.appendChild(el('div', 'fl-grip', '<i></i><i></i>'));
    frame.appendChild(handle);
    box.appendChild(frame);

    var rail = el('input', 'fl-rail');
    rail.type = 'range';
    rail.min = 0; rail.max = 100; rail.value = 50; rail.step = 1;
    rail.setAttribute('aria-label', 'Граница между состояниями: ' + (a.date || a.label || 'было')
      + ' и ' + (b.date || b.label || 'стало'));
    box.appendChild(rail);

    var ends = el('div', 'fl-ends');
    ends.appendChild(el('span', null, esc(a.date || '') + (a.label ? ' · ' + esc(a.label) : '')));
    ends.appendChild(el('span', null, esc(b.date || '') + (b.label ? ' · ' + esc(b.label) : '')));
    box.appendChild(ends);

    var cap = el('p', 'fl-caption');
    var meta = el('p', 'fl-meta');
    box.appendChild(cap);
    box.appendChild(meta);
    /* У шторки под кадром описывается первозданное состояние — оно главное. */
    describe(cap, meta, a);

    /* Необязательная награда (15.10.2026, музей спорта): item.award = {key, points}.
       Начисляется один раз, когда посетитель довёл шторку до обоих краёв и увидел оба
       состояния целиком. Без item.award движок ведёт себя как прежде. */
    var seenA = false, seenB = false;
    function maybeAward(pct) {
      if (!item.award || typeof window.award !== 'function') return;
      if (pct >= 95) seenA = true;
      if (pct <= 5) seenB = true;
      if (seenA && seenB) window.award(item.award.key, item.award.points);
    }

    function setPos(pct, user) {
      pct = Math.max(0, Math.min(100, pct));
      top.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      handle.style.left = pct + '%';
      if (rail.value != pct) rail.value = pct;
      describe(cap, meta, pct > 55 ? a : (pct < 45 ? b : a));
      if (user) maybeAward(pct);
    }

    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
      setPos((x / r.width) * 100, true);
    }

    var dragging = false;
    frame.addEventListener('pointerdown', function (e) {
      dragging = true;
      frame.setPointerCapture && frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      frame.addEventListener(ev, function () { dragging = false; });
    });
    rail.addEventListener('input', function () { setPos(+rail.value, true); });

    setPos(item.start != null ? item.start : 50);
  }

  function buildEras(box, item) {
    var frame = el('div', 'fl-frame');
    if (item.ratio) frame.style.aspectRatio = item.ratio;
    // вертикальный архивный кадр во всю ширину колонки съедает экран целиком:
    // maxw держит его в разумном поле и центрует
    if (item.maxw) { frame.style.maxWidth = item.maxw; frame.style.margin = '0 auto'; }
    box.classList.add('fl-mode-eras');

    var layers = item.states.map(function (st, i) {
      var img = image(st);
      if (i === 0) img.classList.add('is-on');
      frame.appendChild(img);
      return img;
    });
    box.appendChild(frame);

    var bar = el('div', 'fl-eras');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Даты одного места');
    var cap = el('p', 'fl-caption');
    var meta = el('p', 'fl-meta');

    var buttons = item.states.map(function (st, i) {
      var b = el('button', 'fl-era', esc(st.date || st.label || (i + 1)));
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { show(i); });
      bar.appendChild(b);
      return b;
    });

    box.appendChild(bar);
    box.appendChild(cap);
    box.appendChild(meta);

    function show(i) {
      layers.forEach(function (l, k) { l.classList.toggle('is-on', k === i); });
      buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      describe(cap, meta, item.states[i]);
    }

    bar.addEventListener('keydown', function (e) {
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (next < 0 || next >= buttons.length) return;
      e.preventDefault();
      buttons[next].focus();
      show(next);
    });

    show(0);
  }

  function build(item) {
    var host = document.querySelector(item.mount || '#firstlook');
    if (!host) return false;
    if (!item.states || item.states.length < 2) return false;
    if (host.querySelector('.fl')) return false;

    var box = el('div', 'fl');
    var head = el('div', 'fl-head');
    if (item.eyebrow) head.appendChild(el('div', 'fl-eyebrow', esc(item.eyebrow)));
    if (item.title) head.appendChild(el('h2', 'fl-title', esc(item.title)));
    if (item.lead) head.appendChild(el('p', 'fl-lead', esc(item.lead)));
    if (head.childNodes.length) box.appendChild(head);

    host.appendChild(box);
    if (item.mode === 'eras' || item.states.length > 2) buildEras(box, item);
    else buildShutter(box, item);
    return true;
  }

  function run() {
    styleOnce();
    CFG.forEach(build);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
