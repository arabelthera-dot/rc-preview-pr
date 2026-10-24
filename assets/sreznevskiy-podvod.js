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

/* Игра «Камера под воду» (26 января, Срезневский, 1886) — вторая игра дня (Р215).
   Только нажатия (Р206): «Закрой камеру» → «Опусти ↓» ×2 → «Снять!» → «Подними ↑» → «Открой камеру» — 6 нажатий.
   Потом сама: «внутри сухо» → проявка снимка дна → финал.
   Всё нарисовано музеем: устройство камеры, глубина и дно в источниках не описаны. */
(function () {
  var root = document.querySelector('[data-podvod-igra]');
  if (!root) return;
  function $(s) { return root.querySelector(s); }
  var NS = 'http://www.w3.org/2000/svg';
  var ruka = igraRuka(root);
  var task = $('.pv-task'), sub = $('.pv-sub'), glub = $('.pv-glub b');
  var steps = [].slice.call(root.querySelectorAll('.pv-steps li'));
  var kam = $('.pv-kamera'), ver = $('.pv-verevka'), kry = $('.pv-kryshka'), kadr = $('.pv-kadr');
  var busy = false, fin = false;
  function setTask(t) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }
  function stepOn(n) { steps.forEach(function (li, i) { li.classList.toggle('on', i === n - 1); }); root.dataset.step = n; }
  function el(tag, at, parent) { var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); parent.appendChild(e); return e; }

  /* Дно: камни, водоросли, рыбы — одни данные для сцены и для снимка (рисунок музея). */
  function rnd(seed) { return function () { seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = rnd(1886);
  var PESOK = 'M0 404 Q40 392 80 398 T160 396 T240 402 T300 394 T360 400 V460 H0z';
  var KAMNI = [[78,412,26,15],[118,420,18,11],[44,426,14,9],[150,414,12,8],[96,404,10,7],[240,418,22,13],[300,410,16,10],[330,428,12,8],[200,430,10,6]];
  var VODOR = [];
  [30,62,88,104,136,166,226,262,284,318,346].forEach(function (x, i) { VODOR.push([x, 400 + R() * 10, 34 + R() * 46, i % 3]); });
  var RYBY = [[92,350,1],[128,366,1],[70,374,1],[290,250,-1],[312,262,-1]];
  var dno = $('.pv-dno');
  VODOR.forEach(function (v) {
    var g = el('g', { 'class': 'pv-vodorosl pv-v' + v[3], style: 'transform-origin:' + v[0] + 'px ' + v[1] + 'px' }, dno);
    el('path', { d: 'M' + v[0] + ' ' + v[1] + ' q-8 ' + (-v[2] / 3) + ' 0 ' + (-v[2] / 1.6) + ' t2 ' + (-v[2] / 2.6), fill: 'none', stroke: '#4f8a3e', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
  });
  el('path', { d: PESOK, fill: '#b7a57a' }, dno);
  KAMNI.forEach(function (k) { el('ellipse', { cx: k[0], cy: k[1], rx: k[2], ry: k[3], fill: '#6f6a5e', stroke: '#4a463e', 'stroke-width': 2 }, dno); });
  var ryby = $('.pv-ryby');
  function rybaPath(x, y, s) { return 'M' + x + ' ' + y + ' q' + (8 * s) + ' -7 ' + (18 * s) + ' 0 q' + (-10 * s) + ' 7 ' + (-18 * s) + ' 0z M' + (x + 17 * s) + ' ' + y + ' l' + (7 * s) + ' -5 v10z'; }
  RYBY.forEach(function (r, i) { el('path', { d: rybaPath(r[0], r[1], r[2]), fill: '#d9c08a', 'class': 'pv-ryba pv-r' + (i % 2) }, ryby); });

  /* Камера: положение по высоте и крышка. Плавно, через requestAnimationFrame. */
  var Y = 13, KRY = -40;
  function place() {
    kam.setAttribute('transform', 'translate(210 ' + Y.toFixed(1) + ')');
    ver.setAttribute('y2', (Y - 11).toFixed(1));
    kry.setAttribute('transform', 'rotate(' + KRY.toFixed(1) + ' -27 -3)');
  }
  function tween(from, to, dur, set, done) {
    var t0 = performance.now();
    (function f(now) {
      var u = Math.min(1, (now - t0) / dur), e = u * u * (3 - 2 * u);
      set(from + (to - from) * e);
      if (u < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }
  var puzyri = $('.pv-puzyri');
  function bubbles() {
    for (var i = 0; i < 9; i++) {
      var c = el('circle', { cx: 196 + R() * 30, cy: Y + 20, r: 2 + R() * 3, fill: 'none', stroke: '#d8f1f8', 'stroke-width': 1.5, 'class': 'pv-puzyr' }, puzyri);
      c.style.animationDelay = (i * 0.12) + 's';
      c.style.setProperty('--h', -(Y - 60) + 'px');
      (function (c) { setTimeout(function () { c.remove(); }, 2600); })(c);
    }
  }
  place();

  function show(btn) { root.querySelectorAll('.pv-row button').forEach(function (b) { b.hidden = b !== btn; }); ruka.na(btn); }

  /* 1. Закрой камеру */
  $('.pv-zakroy').addEventListener('click', function () {
    if (busy || KRY === 0) return; busy = true; ruka.ubrat();
    sub.textContent = 'Крышка ложится на место и плотно прижимается…';
    tween(-40, 0, 700, function (v) { KRY = v; place(); }, function () {
      KRY = 0; place(); busy = false; root.classList.add('pv-zakryta');
      sub.textContent = 'Закрыто. Ящик глухой — вода не найдёт щели. Теперь за борт.';
      setTask('Нажми «Опусти ↓»'); show($('.pv-vniz'));
    });
  });

  /* 2. Опусти ↓ — два нажатия: под воду и к самому дну */
  var GLUB = [190, 322], gl = 0;
  var SAY = ['Камера под водой. Вокруг только вода, а внутри ящика — сухо.', 'Камера у самого дна: камни, водоросли, рыбы. Жёлтая рамка — то, что попадёт на снимок.'];
  $('.pv-vniz').addEventListener('click', function () {
    if (busy || gl >= GLUB.length) return; busy = true; ruka.ubrat();
    var to = GLUB[gl];
    this.textContent = 'Вниз… ↓'; sub.textContent = 'Верёвка разматывается, камера идёт вниз…';
    glub.textContent = 'уходит вниз';
    tween(Y, to, 1500, function (v) { Y = v; place(); if (v > 70 && !root.classList.contains('pv-mokro')) { root.classList.add('pv-mokro'); bubbles(); } }, function () {
      Y = to; place(); busy = false; sub.textContent = SAY[gl]; gl++;
      var b = $('.pv-vniz'); b.textContent = 'Опусти ↓';
      if (gl < GLUB.length) { glub.textContent = 'под водой'; show(b); }
      else { glub.textContent = 'у дна'; kadr.setAttribute('opacity', 1); stepOn(2); setTask('Нажми «Снять!»'); show($('.pv-snyat')); }
    });
  });

  /* 3. Снять! */
  var vsp = $('.pv-vspyshka'), shot = false;
  $('.pv-snyat').addEventListener('click', function () {
    if (busy || shot) return; shot = true; busy = true; ruka.ubrat();
    sub.textContent = 'Щёлк! Затвор открылся — дно легло на стекло внутри камеры.';
    root.classList.add('pv-shchelk');
    tween(0.7, 0, 500, function (v) { vsp.setAttribute('opacity', v.toFixed(2)); });
    setTimeout(function () {
      busy = false; kadr.setAttribute('opacity', 0); stepOn(3);
      setTask('Нажми «Подними ↑»'); show($('.pv-vverh'));
    }, 700);
  });

  /* 4. Подними ↑ */
  $('.pv-vverh').addEventListener('click', function () {
    if (busy || Y < 20) return; busy = true; ruka.ubrat();
    this.textContent = 'Тянем… ↑'; sub.textContent = 'Тянем верёвку — камера поднимается из глубины…';
    glub.textContent = 'поднимается';
    tween(Y, 13, 1800, function (v) { Y = v; place(); }, function () {
      Y = 13; place(); busy = false; root.classList.add('pv-naverhu');
      glub.textContent = 'в лодке, мокрая';
      sub.textContent = 'Камера в лодке. Снаружи с неё течёт вода. А внутри?';
      stepOn(4); setTask('Нажми «Открой камеру»'); show($('.pv-otkroy'));
    });
  });

  /* 5. Открой камеру → сухо → проявка → финал */
  var opened = false;
  $('.pv-otkroy').addEventListener('click', function () {
    if (busy || opened) return; opened = true; busy = true; ruka.ubrat();
    sub.textContent = 'Открываем крышку…';
    tween(0, -40, 500, function (v) { KRY = v; place(); }, function () {
      $('.pv-s1').hidden = true; $('.pv-s2').hidden = false;
      root.classList.add('pv-otkryta');
      setTask('Смотри внутрь');
      sub.textContent = 'Внутри сухо — ни капли! Стекло со снимком цело и сухо.';
      setTimeout(proyavka, 2600);
    });
  });
  function proyavka() {
    var c = $('.pv-plate'); drawPlate(c.getContext('2d'), c.width, c.height);
    $('.pv-s2').hidden = true; $('.pv-s3').hidden = false;
    setTask('Смотри на пластинку');
    sub.textContent = 'Стекло — в проявитель. Снимок дна проступает сам.';
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('pv-dev'); }); });
    setTimeout(finale, 4200);
  }
  /* Снимок: то, что было в жёлтой рамке (x 60…178, y 329…417 в сцене), в тонах старой пластинки. */
  function drawPlate(ctx, W, H) {
    var x0 = 60, y0 = 329, w = 118, h = 88, s = W / w;
    ctx.save(); ctx.scale(s, H / h); ctx.translate(-x0, -y0);
    var g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#7a6246'); g.addColorStop(1, '#4b3a28');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = '#3d2e1e'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    VODOR.forEach(function (v) { ctx.beginPath(); ctx.moveTo(v[0], v[1]); ctx.quadraticCurveTo(v[0] - 8, v[1] - v[2] / 3, v[0], v[1] - v[2] / 1.6); ctx.quadraticCurveTo(v[0] + 8, v[1] - v[2] / 1.2, v[0] + 2, v[1] - v[2] / 1.6 - v[2] / 2.6); ctx.stroke(); });
    ctx.fillStyle = '#c9ad82'; ctx.fill(new Path2D(PESOK));
    KAMNI.forEach(function (k) { ctx.beginPath(); ctx.ellipse(k[0], k[1], k[2], k[3], 0, 0, 7); ctx.fillStyle = '#6a5440'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3d2e1e'; ctx.stroke(); });
    RYBY.forEach(function (r) { ctx.fillStyle = '#d8c39c'; ctx.fill(new Path2D(rybaPath(r[0], r[1], r[2]))); });
    ctx.restore();
    var Rz = rnd(26);
    for (var i = 0; i < 900; i++) { ctx.fillStyle = 'rgba(30,20,10,' + (Rz() * 0.18) + ')'; ctx.fillRect(Rz() * W, Rz() * H, 2, 2); }
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,12,4,.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function finale() {
    if (fin) return; fin = true;
    setTask('Прочитай, как это было');
    sub.textContent = 'Снимок со дна готов — а внутри камеры не было ни капли.';
    var f = $('.pv-finale'); f.hidden = false;
    setTimeout(function () { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 900);
  }

  /* Нажатие мимо мигающей кнопки игру не ломает. */
  root.addEventListener('click', function (e) {
    if (fin || busy || e.target.closest('.igra-aktiv, .pv-finale, .igra-pravila')) return;
    if (root.querySelector('.igra-aktiv')) sub.textContent = 'Жми мигающую кнопку — над ней рука.';
  });
  $('.pv-again').addEventListener('click', function () { location.reload(); });
  show($('.pv-zakroy'));
})();
