/* igra-ruka — вид как у образца 29 янв. (ko-hand, rc-site e4f86d74). Подсказка «куда жать» (Р206, 23.10.2026): на шаге одна активная кнопка
   пульсирует, над ней рука «тап-тап», остальные кнопки игры приглушены.
   Вставить В НАЧАЛО скрипта игры как есть. Использование:
     var ruka = igraRuka(root);   // root — секция игры
     ruka.na(knopka);             // показать руку над кнопкой, кнопка пульсирует
     ruka.ubrat();                // убрать (пока идёт анимация / финал)
   Отклик на касание (≤100 мс): класс .igra-zhmyak на pointerdown + navigator.vibrate(20). */
function igraRuka(root) {
  var el = document.createElement('span');
  el.className = 'igra-ruka'; el.setAttribute('aria-hidden', 'true'); el.hidden = true;
  el.innerHTML = '<i class="igra-ruka-krug"></i><svg viewBox="0 0 40 48" width="40" height="48"><path d="M15 4c2.2 0 4 1.8 4 4v13l1.2-.5c1.9-.7 4 .2 4.8 2l.3.7.8-.3c1.9-.6 4 .3 4.7 2.2l.2.5c1.9-.4 3.8.7 4.4 2.5.2.6.3 1.2.3 1.8V36c0 5.5-4.5 10-10 10h-4.6c-3 0-5.8-1.4-7.7-3.7L5.2 33.5c-1.3-1.6-1.1-4 .5-5.3 1.5-1.2 3.7-1.1 5.1.3l.2.2V8c0-2.2 1.8-4 4-4z" fill="#fff" stroke="#1a1206" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
  root.appendChild(el);
  var cel = null;
  function mesto() {
    if (!cel || el.hidden) return;
    var r = cel.getBoundingClientRect(), b = root.getBoundingClientRect();
    el.style.left = Math.round(r.left - b.left + r.width * 0.86) + 'px';
    el.style.top = Math.round(r.top - b.top + r.height * 0.5) + 'px';
  }
  function ubrat() {
    if (cel) cel.classList.remove('igra-aktiv');
    cel = null; el.hidden = true; root.classList.remove('igra-ved');
  }
  function na(knopka) {
    ubrat();
    if (!knopka) return;
    cel = knopka; cel.classList.add('igra-aktiv'); root.classList.add('igra-ved');
    el.hidden = false; mesto();
    requestAnimationFrame(mesto);
  }
  window.addEventListener('resize', mesto);
  if (window.ResizeObserver) new ResizeObserver(mesto).observe(root);
  root.addEventListener('pointerdown', function (e) {
    var k = e.target.closest('button, [role="button"]');
    if (!k || !root.contains(k)) return;
    k.classList.add('igra-zhmyak');
    setTimeout(function () { k.classList.remove('igra-zhmyak'); }, 160);
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (_) {} }
  });
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  return { na: na, ubrat: ubrat, mesto: mesto };
}
/* odner-koleso.js — черновик игры 18 января «Мир считал на петербургском колесе» (Р169, Р176) на одиночных нажатиях
   (Р201, Р206, Р227, Р228). Сюжет как на странице дня (assets/odner-polka.js + арифмометр страницы):
   1) полка из семи машин четырёх стран — нажатие на мигающую машину, просвет сам плывёт к ней, внутри колесо Однера;
   2) все семь — встают стопки: ≈5000 машин Тома и 3 000 000 «Феликсов»;
   3) «Феликс» в руки: три рычажка набирают 147, ручка вперёд ×3, сдвиг каретки, ручка ×2 — в счётчике 3381; затем финал.
   Перетаскивание просвета, «подержи» и вращение ручки пальцем заменены одиночными нажатиями. */
(function () {
  'use strict';
  var root = document.querySelector('[data-odner-igra]');
  if (!root) return;
  var ruka = igraRuka(root);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var taskEl = root.querySelector('.od-task'), subEl = root.querySelector('.od-sub');
  var stepLi = root.querySelectorAll('.od-steps li');
  function task(t) { taskEl.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }
  function sub(t, cls) { subEl.className = 'od-sub igra-poyasnenie' + (cls ? ' ' + cls : ''); subEl.textContent = t; }
  function etap(n) { stepLi.forEach(function (li, i) { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); }); }
  var aktiv = null, hod = null;
  function zhdi(el, t, fn) {            // шаг: одна активная кнопка, рука над ней
    aktiv = el; hod = fn; task(t); ruka.na(el);
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    if (r.top < 90 || r.bottom > vh - 20) el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
  }
  function pauza(t) { aktiv = null; hod = null; ruka.ubrat(); task(t); }
  root.addEventListener('click', function (e) {
    var k = e.target.closest('button');
    if (!k || !root.contains(k) || k.closest('.od-finale')) return;
    if (k === aktiv && hod) { var f = hod; aktiv = null; hod = null; ruka.ubrat(); audio(); f(); return; }
    sub('Жми мигающую кнопку — над ней рука.', 'bad');
  });

  /* ── ЗВУК ── только после нажатия посетителя */
  var ac = null;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, dur, vol, type) {
    var a = ac; if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function zvon() { tone(2093, 1.4, 0.22); tone(3136, 0.9, 0.08); tone(1568, 1.1, 0.06, 'triangle'); }
  function tik() { tone(900, 0.05, 0.12, 'square'); setTimeout(function () { tone(620, 0.05, 0.10, 'square'); }, 70); }

  /* ── МАШИНЫ ── как на странице дня (odner-polka.js) */
  var M = [
    {id: 'spb', name: '«Однер», Петербург', land: 'Россия · с 1890',
      body: '<rect x="14" y="112" width="172" height="16" rx="3" fill="#7a4a24"/><rect x="14" y="112" width="172" height="4" fill="#9c6233"/>' +
        '<path d="M30 112 V56 Q30 46 40 46 H150 Q160 46 160 56 V112 Z" fill="#141414"/>' +
        '<rect x="44" y="60" width="96" height="10" rx="2" fill="#2b2b2b"/>' + slots(48, 62, 9, 10, '#c9a84c') +
        '<rect x="36" y="86" width="118" height="16" rx="3" fill="#222"/>' + dots(46, 94, 8, 13, '#e4c97a') +
        crank(160, 76, '#c9a84c'), outline: 'M30 112 V56 Q30 46 40 46 H150 Q160 46 160 56 V112 Z'},
    {id: 'bru', name: 'Brunsviga', land: 'Германия · лицензия Однера',
      body: '<rect x="18" y="114" width="164" height="12" rx="4" fill="#1b1b1b"/>' +
        '<path d="M28 114 V78 Q28 40 100 38 Q172 40 172 78 V114 Z" fill="#202020"/>' +
        '<path d="M44 74 Q100 50 156 74" stroke="#3a3a3a" stroke-width="12" fill="none"/>' + slots(56, 66, 8, 12, '#d9d0bc') +
        '<rect x="40" y="92" width="120" height="14" rx="3" fill="#2e2e2e"/>' + dots(50, 99, 8, 14, '#f0eadc') +
        crank(172, 84, '#bdbdbd'), outline: 'M28 114 V78 Q28 40 100 38 Q172 40 172 78 V114 Z'},
    {id: 'ori', name: 'Original-Odhner', land: 'Швеция',
      body: '<rect x="16" y="114" width="168" height="12" rx="3" fill="#111"/>' +
        '<path d="M26 114 V64 L46 44 H154 L174 64 V114 Z" fill="#0f0f12"/>' +
        '<rect x="48" y="52" width="104" height="9" rx="2" fill="#2a2a30"/>' + slots(52, 54, 9, 11, '#e9e2d0') +
        '<rect x="34" y="90" width="132" height="14" rx="2" fill="#1f1f25"/>' + dots(44, 97, 9, 14, '#c9a84c') +
        crank(174, 80, '#8f8f8f'), outline: 'M26 114 V64 L46 44 H154 L174 64 V114 Z'},
    {id: 'fac', name: 'Facit', land: 'Швеция',
      body: '<rect x="20" y="114" width="160" height="12" rx="6" fill="#5c6b62"/>' +
        '<path d="M26 114 V70 Q26 50 46 50 H154 Q174 50 174 70 V114 Z" fill="#7d8f84"/>' +
        '<rect x="44" y="60" width="112" height="22" rx="5" fill="#6a7a70"/>' + slots(50, 63, 9, 12, '#f1efe6') +
        '<rect x="38" y="92" width="124" height="13" rx="6" fill="#56645b"/>' + dots(48, 98, 8, 15, '#f7f3e8') +
        crank(174, 86, '#e0e0e0'), outline: 'M26 114 V70 Q26 50 46 50 H154 Q174 50 174 70 V114 Z'},
    {id: 'tri', name: 'Triumphator', land: 'Германия',
      body: '<rect x="16" y="114" width="168" height="12" rx="3" fill="#202428"/>' +
        '<path d="M24 114 V60 L176 48 V114 Z" fill="#30363c"/>' +
        '<path d="M24 66 L176 54" stroke="#b9c2c9" stroke-width="3"/>' + slots(44, 64, 9, 12, '#e6e9ec') +
        '<rect x="36" y="92" width="128" height="14" rx="2" fill="#262b30"/>' + dots(46, 99, 8, 15, '#ffd27a') +
        crank(176, 80, '#b9c2c9'), outline: 'M24 114 V60 L176 48 V114 Z'},
    {id: 'mar', name: 'Marchant', land: 'США',
      body: '<rect x="18" y="116" width="164" height="10" rx="3" fill="#6b5d4a"/>' +
        '<path d="M30 116 V44 Q30 34 40 34 H160 Q170 34 170 44 V116 Z" fill="#cdbf9f"/>' +
        '<rect x="42" y="42" width="116" height="12" rx="2" fill="#3b352c"/>' + dots(50, 48, 8, 14, '#f4e7c4') +
        keys(44, 62, 8, 4, 14, 12, '#efe6cf', '#8c7b5d'), outline: 'M30 116 V44 Q30 34 40 34 H160 Q170 34 170 44 V116 Z'},
    {id: 'fel', name: '«Феликс», Курск', land: 'СССР · 3 миллиона',
      body: '<rect x="16" y="114" width="168" height="12" rx="3" fill="#3e4a3b"/>' +
        '<path d="M26 114 V58 Q26 50 34 50 H158 Q166 50 166 58 V114 Z" fill="#5f7259"/>' +
        '<rect x="38" y="58" width="116" height="24" rx="3" fill="#526449"/>' + slots(44, 61, 9, 12, '#141414') +
        '<rect x="34" y="90" width="124" height="14" rx="2" fill="#2d3729"/>' + dots(44, 97, 8, 15, '#f2f2e8') +
        crank(166, 80, '#151515'), outline: 'M26 114 V58 Q26 50 34 50 H158 Q166 50 166 58 V114 Z'}
  ];
  function slots(x, y, n, step, c) { var s = ''; for (var i = 0; i < n; i++) s += '<rect x="' + (x + i * step) + '" y="' + y + '" width="3" height="' + 12 + '" rx="1.5" fill="' + c + '" opacity=".85"/>'; return s; }
  function dots(x, y, n, step, c) { var s = ''; for (var i = 0; i < n; i++) s += '<circle cx="' + (x + i * step) + '" cy="' + y + '" r="3.2" fill="' + c + '"/>'; return s; }
  function keys(x, y, cols, rows, sx, sy, c, b) { var s = ''; for (var r = 0; r < rows; r++) for (var i = 0; i < cols; i++) s += '<rect x="' + (x + i * sx) + '" y="' + (y + r * sy) + '" width="10" height="9" rx="2" fill="' + c + '" stroke="' + b + '"/>'; return s; }
  function crank(x, y, c) { return '<path d="M' + x + ' ' + y + ' h10 v-26 h8" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="' + (x + 20) + '" cy="' + (y - 26) + '" r="5" fill="' + c + '"/>'; }

  /* колесо Однера: диск и 9 зубцов, выдвинуто n */
  function wheel(cx, cy, r, n, cls) {
    var s = '<g class="pw ' + cls + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#2a2210" stroke="#e4c97a" stroke-width="2"/>';
    for (var i = 0; i < 12; i++) {
      if (i > 8) continue;
      var a = -Math.PI / 2 + i * Math.PI / 6, out = i < n, L = out ? r * 0.5 : r * 0.12;
      var x1 = cx + Math.cos(a) * (r - 2), y1 = cy + Math.sin(a) * (r - 2), x2 = cx + Math.cos(a) * (r + L), y2 = cy + Math.sin(a) * (r + L);
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (out ? '#ffd27a' : '#8a6d2a') + '" stroke-width="' + (out ? 4.5 : 3) + '" stroke-linecap="round"/>';
    }
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.28) + '" fill="#e4c97a"/></g>';
  }
  function inside(m) {
    return '<rect width="200" height="140" fill="#081a2e"/>' + grid() +
      '<path d="' + m.outline + '" fill="rgba(125,200,255,.06)" stroke="#7dc8ff" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<line x1="44" y1="82" x2="156" y2="82" stroke="#7dc8ff" stroke-width="2" opacity=".7"/>' +
      wheel(56, 82, 14, 3, 'w1') + wheel(100, 82, 14, 7, 'w2') + wheel(144, 82, 14, 5, 'w3');
  }
  function grid() { var s = ''; for (var x = 0; x <= 200; x += 20) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="140" stroke="#13304f" stroke-width="1"/>'; for (var y = 0; y <= 140; y += 20) s += '<line x1="0" y1="' + y + '" x2="200" y2="' + y + '" stroke="#13304f" stroke-width="1"/>'; return s; }

  var KR = ['«Однер»', '«Brunsviga»', '«Original-Odhner»', '«Facit»', '«Triumphator»', '«Marchant»', '«Феликс»'];
  var polka = root.querySelector('.polka');
  var shelf = polka.querySelector('.polka-shelf'), lens = polka.querySelector('.polka-lens');
  var cnt = document.getElementById('polkaCnt');
  var cells = [];
  M.forEach(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mash'; b.dataset.i = i;
    b.setAttribute('aria-label', m.name + ', ' + m.land + ': просветить корпус');
    b.innerHTML = '<span class="mash-art"><svg class="mash-case" viewBox="0 0 200 140" aria-hidden="true">' + m.body + '</svg>' +
      '<svg class="mash-in" viewBox="0 0 200 140" aria-hidden="true">' + inside(m) + '</svg></span>' +
      '<span class="mash-name">' + m.name + '</span><span class="mash-land">' + m.land + '</span>' +
      '<span class="mash-tag">внутри — колесо Однера</span>';
    shelf.appendChild(b);
    cells.push({el: b, art: b.querySelector('.mash-art'), inn: b.querySelector('.mash-in'), m: m, found: false});
  });

  /* просвет: плывёт к нажатой машине сам; под ним корпус прозрачный */
  var R = 50, pos = {x: 0, y: 0}, tgt = {x: 0, y: 0}, cel = null, prishel = null, found = 0, polkaDone = false;
  function center(c) { var r = c.art.getBoundingClientRect(), s = shelf.getBoundingClientRect(); return {x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2}; }
  function place() {
    R = Math.max(34, Math.min(70, cells[0].art.clientWidth * 0.5));
    lens.style.width = lens.style.height = (R * 2) + 'px';
    lens.style.transform = 'translate(' + (pos.x - R) + 'px,' + (pos.y - R) + 'px)';
    var s = shelf.getBoundingClientRect();
    cells.forEach(function (c) {
      if (c.found) return;
      var r = c.art.getBoundingClientRect(), lx = pos.x - (r.left - s.left), ly = pos.y - (r.top - s.top);
      c.inn.style.clipPath = 'circle(' + R + 'px at ' + lx.toFixed(1) + 'px ' + ly.toFixed(1) + 'px)';
    });
  }
  function loop() {
    if (cel) tgt = center(cel);
    var k = reduce ? 1 : 0.16;
    pos.x += (tgt.x - pos.x) * k; pos.y += (tgt.y - pos.y) * k;
    if (prishel && Math.hypot(tgt.x - pos.x, tgt.y - pos.y) < 3) { var f = prishel; prishel = null; setTimeout(f, reduce ? 0 : 220); }
    place();
    if (!polkaDone || Math.hypot(tgt.x - pos.x, tgt.y - pos.y) > 0.5) requestAnimationFrame(loop);
    else lens.style.opacity = '0';
  }
  function reveal(c) {
    c.found = true; found++;
    var r = c.art.getBoundingClientRect();
    c.inn.style.clipPath = 'circle(' + Math.hypot(r.width, r.height) + 'px at 50% 50%)';
    c.el.classList.add('found');
    tik();
    cnt.textContent = found;
    polka.querySelector('.polka-bar i').style.width = (found / M.length * 100) + '%';
    var foreign = c.m.id !== 'spb' && c.m.id !== 'fel';
    if (found === M.length) { finalePolki(); return; }
    if (foreign) sub(c.m.name + ', ' + c.m.land.split(' · ')[0] + ' — а внутри то же петербургское колесо.', 'ok');
    else sub(c.m.name + ' — колесо Однера на месте. Дальше — машины других стран.', 'ok');
    shagPolki();
  }
  function shagPolki() {
    var c = cells[found];
    zhdi(c.el, 'Нажми ' + KR[found], function () {
      sub('Просвет плывёт к ' + KR[found] + '…');
      cel = c; prishel = function () { reveal(c); };
    });
  }

  /* ── СТОПКИ ── 1 кирпичик = 5000 машин */
  var takeRow = root.querySelector('.od-take-row'), takeBtn = root.querySelector('.od-take');
  function finalePolki() {
    polkaDone = true; cel = null;
    pauza('Смотри: встают две стопки');
    sub('Семь машин, четыре страны — и в каждой одно колесо из Петербурга. А теперь посчитаем, сколько их было.', 'ok');
    var st = document.getElementById('stopki'); st.hidden = false;
    var wall = st.querySelector('.stopki-wall'), num = document.getElementById('stopkiNum'), N = 600, html = '';
    for (var i = 0; i < N; i++) html += '<i></i>';
    wall.innerHTML = html;
    var bricks = wall.children, t0 = 0, D = reduce ? 1 : 2600;
    setTimeout(function () {
      st.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
      st.classList.add('go');
      requestAnimationFrame(function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 2), n = Math.round(e * N);
        for (var j = 0; j < n; j++) bricks[j].className = 'on';
        num.textContent = (Math.round(e * 3000000)).toLocaleString('ru-RU');
        if (p < 1) { requestAnimationFrame(step); return; }
        st.classList.add('end'); zvon();
        takeRow.hidden = false;
        sub('Французских машин Тома за сто лет — около 5 000. Курских «Феликсов» к 1973 году — 3 миллиона.', 'ok');
        zhdi(takeBtn, 'Нажми «Взять „Феликс“»', vzyat);
      });
    }, 700);
  }

  /* ── АРИФМОМЕТР ── три колеса Однера; каретка 0 = единицы, 1 = десятки.
     Оборот вперёд прибавляет набранное × 10^каретка (правило модели страницы дня). */
  var press = root.querySelector('.od-press');
  var lev = [0, 0, 0], acc = 0, car = 0, turns = 0, TARGET = 147, GOAL = 3381, NUZHNO = [1, 4, 7];
  var cw = document.getElementById('cvWheel'), wc = cw.getContext('2d'), cc = document.getElementById('cvCount'), ctx = cc.getContext('2d');
  var levBtn = press.querySelectorAll('[data-lev]'), crankBtn = press.querySelector('.od-crank'), carBtn = press.querySelector('.od-car');
  var arm = crankBtn.querySelector('.crank-arm'), ang = 0;
  function setNum() { return lev[0] * 100 + lev[1] * 10 + lev[2]; }
  function drawWheels() {
    var w = cw.width, h = cw.height; wc.fillStyle = '#f3ecd9'; wc.fillRect(0, 0, w, h);
    var names = ['сотни', 'десятки', 'единицы'];
    for (var k = 0; k < 3; k++) {
      var cx = 55 + k * 95, cy = 100, r = 34;
      wc.fillStyle = '#1d1d1d'; wc.beginPath(); wc.arc(cx, cy, r, 0, Math.PI * 2); wc.fill();
      for (var i = 0; i < 9; i++) {
        var a = -Math.PI / 2 + i * (Math.PI * 2 / 12), out = i < lev[k], len = out ? 16 : 4;
        var x1 = cx + Math.cos(a) * (r - 2), y1 = cy + Math.sin(a) * (r - 2), x2 = cx + Math.cos(a) * (r + len), y2 = cy + Math.sin(a) * (r + len);
        wc.strokeStyle = out ? '#c9a84c' : '#555'; wc.lineWidth = out ? 7 : 5; wc.lineCap = 'butt';
        wc.beginPath(); wc.moveTo(x1, y1); wc.lineTo(x2, y2); wc.stroke();
      }
      wc.fillStyle = '#f3ecd9'; wc.font = 'bold 26px sans-serif'; wc.textAlign = 'center'; wc.fillText(String(lev[k]), cx, cy + 9);
      wc.fillStyle = '#333'; wc.font = '13px sans-serif'; wc.fillText(names[k], cx, cy + 70);
    }
    wc.fillStyle = '#333'; wc.font = '13px sans-serif'; wc.textAlign = 'center';
    wc.fillText('золотые зубцы выдвинуты рычажком', w / 2, 22);
    document.getElementById('setTxt').textContent = String(setNum()).padStart(3, '0');
  }
  function drawCounter() {
    var w = cc.width, h = cc.height; ctx.fillStyle = '#16120c'; ctx.fillRect(0, 0, w, h);
    var s = String(Math.max(acc, 0)).padStart(6, '0');
    ctx.textAlign = 'center';
    for (var i = 0; i < 6; i++) {
      var x = 40 + i * 44; ctx.fillStyle = '#f3ecd9'; ctx.fillRect(x - 17, 40, 34, 46);
      ctx.fillStyle = '#1d1d1d'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(s[i], x, 73);
    }
    ctx.fillStyle = '#c9a84c'; ctx.font = '14px sans-serif';
    ctx.fillText('каретка: ' + (car ? 'десятки' : 'единицы'), w / 2, 130);
    ctx.fillText('оборотов ручки: ' + turns, w / 2, 158);
    document.getElementById('cntTxt').textContent = acc + ', оборотов ' + turns;
  }
  function redraw() { drawWheels(); drawCounter(); }
  redraw();

  function vzyat() {
    var h = document.getElementById('inHand');
    h.textContent = cells[6].m.name + ' (' + cells[6].m.land.split(' · ')[0] + ')';
    cells.forEach(function (c) { c.el.classList.toggle('taken', c.m.id === 'fel'); });
    takeRow.hidden = true; press.hidden = false; etap(1);
    sub('«Феликс» в руках. Задача счетовода: в цехе 23 рабочих, каждому положено 147 рублей.');
    shagLev(0);
  }
  var LEVN = ['сотен', 'десятков', 'единиц'], LEVT = ['«Сотни → 1»', '«Десятки → 4»', '«Единицы → 7»'];
  function shagLev(k) {
    zhdi(levBtn[k], 'Нажми ' + LEVT[k], function () {
      sub('Рычажок ' + LEVN[k] + ' пошёл вниз — зубцы выдвигаются…');
      (function zub() {
        if (lev[k] < NUZHNO[k]) { lev[k]++; redraw(); tone(1200, 0.03, 0.06, 'square'); setTimeout(zub, reduce ? 0 : 110); return; }
        if (setNum() === TARGET) {
          sub('Набрано 147. Видишь: из колёс выдвинуто 1, 4 и 7 зубцов. Теперь крути ручку вперёд — три раза.', 'ok');
          etap(2); shagRuchka();
        } else { sub('Набрано ' + String(setNum()).padStart(3, '0') + '. Нужно 147: сотни — 1, десятки — 4, единицы — 7.'); shagLev(k + 1); }
      })();
    });
  }
  function shagRuchka() {
    var t = turns < 3 ? (turns + 1) + '-й оборот из 3' : (turns - 2) + '-й оборот из 2';
    zhdi(crankBtn, 'Нажми «Ручку вперёд»', oborot);
    crankBtn.querySelector('small').textContent = t;
  }
  function oborot() {
    sub('Ручка идёт по кругу…');
    ang += 360; arm.style.transform = 'rotate(' + ang + 'deg)';
    setTimeout(function () {
      acc += setNum() * (car ? 10 : 1); turns++; redraw(); tik();
      if (acc === GOAL) { konec(); return; }
      if (!car && acc === TARGET * 3) {
        sub('Три оборота — в счётчике 441. Теперь сдвинь каретку на разряд.', 'ok');
        zhdi(carBtn, 'Нажми «Сдвинуть каретку»', kar);
        return;
      }
      sub('Оборот! В счётчике ' + acc + '.', 'ok');
      shagRuchka();
    }, reduce ? 0 : 440);
  }
  function kar() {
    car = 1; redraw(); tik();
    sub('Каретка сдвинута: теперь каждый оборот прибавляет число, умноженное на 10. Крути ещё два раза.', 'ok');
    shagRuchka();
  }

  /* ── ФИНАЛ ── */
  var fin = root.querySelector('.od-finale');
  function konec() {
    pauza('Готово — смотри ниже');
    crankBtn.querySelector('small').textContent = 'готово';
    etap(3);
    sub('3381 рубль — и всего ' + turns + ' оборотов ручки вместо 23 сложений. Так считали почти сто лет — с 1890-го до 1978-го.', 'ok');
    setTimeout(function () {
      fin.hidden = false; root.classList.add('od-konec');
      fin.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    }, reduce ? 0 : 1600);
  }
  root.querySelector('.od-again').addEventListener('click', function () { window.scrollTo(0, 0); location.reload(); });

  /* старт сразу (Р201): просвет над петербургской машиной, мигает она */
  requestAnimationFrame(function () {
    var c = center(cells[0]); pos = {x: c.x, y: c.y}; tgt = {x: c.x, y: c.y};
    requestAnimationFrame(loop);
    shagPolki();
  });
  window.addEventListener('resize', function () { if (!cel && !polkaDone) tgt = center(cells[0]); });
})();
