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

/* Игра «Открой задвижку» — 21 января, Обнинская АЭС (1954). Черновик показа на нажатиях (Р206, Р227, Р228).
   Сюжет — как на странице 01-21: слева EBR-I (20.12.1951): ключ → 4 лампочки, провод упирается в стену.
   Справа Обнинск (26.06.1954, 17:45): штурвал задвижки (два оборота) → пар, турбина, ток за стену станции —
   опоры, улица, завод, за край экрана, в общую сеть. Счёт лампочек 200 Вт: 5 на киловатт — EBR-I 200 кВт = 1000,
   Обнинск 5000 кВт = 25 000. Вместо вращения пальцем — нажатия: одно нажатие на «Штурвал» = пол-оборота,
   четыре нажатия = два оборота, задвижка открыта. Всего 5 нажатий, каждое — видимый шаг. */
(function () {
  'use strict';
  var root = document.querySelector('[data-zadvizhka-igra]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 640, H = 300, TURN = 720, HALF = 180, RU_LAMPS = 25000;
  var btnKey = $('.zv-key'), btnWheel = $('.zv-wheel'), btnAgain = $('.zv-again');
  var knopki = [btnKey, btnWheel];
  var elTask = $('.zv-task'), elSub = $('.zv-msg'), finale = $('.zv-final');
  var wheelRot = $('.zw-rot'), elUS = $('.zv-us-lamps'), elRU = $('.zv-ru-lamps'), elOpen = $('.zv-open i');
  function prep(cv) { var c = cv.getContext('2d'); cv.width = W * 2; cv.height = H * 2; c.scale(2, 2); return c; }
  var cu = prep($('.zv-cv-us')), cr = prep($('.zv-cv-ru'));
  var keyOn = false, keyT = 0, acc = 0, openS = 0, front = 0, rot = 0, done = false, flash = 0;
  var tween = null, puffs = [];

  /* Р206: на шаге одна активная пульсирующая кнопка + рука; остальное приглушено (общий компонент igraRuka) */
  var ruka = igraRuka(root), tekAktiv = null;
  function aktiv(btn) {
    tekAktiv = btn || null;
    knopki.forEach(function (b) { b.setAttribute('aria-disabled', b === btn ? 'false' : 'true'); });
    if (btn) ruka.na(btn); else ruka.ubrat();
  }
  function mimo() { elSub.textContent = tekAktiv ? 'Жми мигающую кнопку' : 'Подожди — идёт показ, потом нажмёшь дальше'; }
  // строка задания всегда начинается с «Что сделать сейчас:» (контракт Р199)
  function say(a, b) {
    elTask.textContent = '';
    var m = document.createElement('b'); m.textContent = 'Что сделать сейчас:';
    elTask.appendChild(m); elTask.appendChild(document.createTextNode(' ' + a));
    if (b != null) elSub.textContent = b;
  }

  /* ---------- рисование (как на странице 01-21) ---------- */
  function glow(c, x, y, r, col, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function bulb(c, x, y, on, fl) {
    if (on) glow(c, x, y, 46, '255,214,120', 0.55 * fl);
    c.fillStyle = on ? 'rgba(255,236,170,' + (0.35 + 0.65 * fl) + ')' : '#2a3442'; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7f8a98'; c.fillRect(x - 5, y + 9, 10, 8);
  }
  var US_B = [[262, 96], [322, 96], [382, 96], [442, 96]];
  function drawUS(now) {
    var c = cu, k = keyOn ? Math.min(1, keyT) : 0, fl = k < 1 ? (0.4 + 0.6 * Math.abs(Math.sin(k * 18))) : 1, i;
    c.fillStyle = '#04070d'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#0a111c'; c.fillRect(24, 24, W - 48, H - 48);
    if (k > 0) glow(c, 352, 110, 260, '255,200,110', 0.16 * k);
    c.strokeStyle = '#26334a'; c.lineWidth = 16; c.strokeRect(16, 16, W - 32, H - 32);
    c.fillStyle = '#1d2a3c'; for (i = 0; i < 13; i++) { c.fillRect(40 + i * 46, H - 34, 30, 3); }
    c.fillStyle = '#1b2738'; c.fillRect(52, 150, 96, 104); c.fillStyle = '#26364d'; c.fillRect(64, 162, 72, 80);
    if (k > 0) glow(c, 100, 202, 44, '120,200,255', 0.7 * k);
    var path = [[148, 180], [200, 180], [200, 120], [480, 120], [480, 180], [600, 180]];
    c.lineWidth = 4; c.strokeStyle = k > 0 ? '#ffcf66' : '#3a4656'; c.beginPath(); c.moveTo(path[0][0], path[0][1]);
    for (i = 1; i < path.length; i++) c.lineTo(path[i][0], path[i][1]); c.stroke();
    c.fillStyle = '#152031'; c.fillRect(232, 66, 240, 62); c.strokeStyle = '#2c3b52'; c.lineWidth = 2; c.strokeRect(232, 66, 240, 62);
    US_B.forEach(function (b) { bulb(c, b[0], b[1], k > 0, fl); });
    c.fillStyle = '#8a3b34'; c.fillRect(596, 166, 14, 28);
    if (k >= 1) { var p = (now / 900) % 1, x = 480 + p * 116; glow(c, x, 180, 14, '255,220,140', 0.9 * (1 - p)); glow(c, 600, 180, 26, '255,90,70', 0.35 + 0.25 * Math.sin(now / 180)); }
  }
  var POLES = [236, 306, 376, 446, 516, 586, 656], HOUSES = [], FACT = { x: 452, y: 166, w: 104, h: 84 };
  (function () { var hx = 252; [[34, 52], [30, 70], [38, 44], [30, 60]].forEach(function (d) { var wins = [];
    for (var r = 0; r < Math.floor(d[1] / 16); r++) for (var cc = 0; cc < Math.floor(d[0] / 12); cc++) wins.push([hx + 5 + cc * 12, 250 - d[1] + 6 + r * 16]);
    HOUSES.push({ x: hx, w: d[0], h: d[1], wins: wins }); hx += d[0] + 16; }); })();
  function wireY(x) { var i = 0; while (i < POLES.length - 1 && POLES[i + 1] < x) i++; var a = i === 0 && x < POLES[0] ? 196 : POLES[i], b = i === 0 && x < POLES[0] ? POLES[0] : POLES[i + 1], t = (x - a) / (b - a); return 112 + Math.sin(Math.PI * Math.max(0, Math.min(1, t))) * 12; }
  function drawRU(now, dt) {
    var c = cr, o = openS, x, i, k;
    var sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#050a16'); sky.addColorStop(1, '#0d1a2c'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    if (o > 0.02) glow(c, Math.min(front, W), 250, 240, '255,200,110', 0.12 * o);
    c.fillStyle = '#16110b'; c.fillRect(0, 250, W, H - 250);
    c.fillStyle = '#152235'; c.fillRect(10, 92, 186, 158); c.fillStyle = '#1d2d44'; c.fillRect(10, 84, 186, 10);
    c.fillStyle = '#0b1422'; c.fillRect(22, 104, 162, 140);
    c.fillStyle = '#22324a'; c.fillRect(30, 170, 46, 70); glow(c, 53, 205, 30, '120,200,255', 0.35 + 0.5 * o);
    c.lineWidth = 8; c.strokeStyle = o > 0 ? '#c9d6e6' : '#33445c'; c.beginPath(); c.moveTo(76, 186); c.lineTo(104, 186); c.lineTo(104, 176); c.stroke();
    if (o > 0) { for (var s = 0; s < 3; s++) { var px = 76 + ((now / (520 - 400 * o) + s / 3) % 1) * 28; c.fillStyle = 'rgba(255,255,255,' + (0.5 * o) + ')'; c.beginPath(); c.arc(px, 186, 3, 0, Math.PI * 2); c.fill(); } }
    rot += dt * 0.02 * o * o * 1.6 + dt * 0.004 * o; var tx = 140, ty = 196;
    c.fillStyle = '#1b2a40'; c.beginPath(); c.arc(tx, ty, 32, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(tx, ty); c.rotate(rot); c.strokeStyle = o > 0 ? '#ffd36b' : '#55657c'; c.lineWidth = 5;
    for (var b = 0; b < 6; b++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -6, 26, 0); c.stroke(); } c.restore();
    c.fillStyle = '#0b1422'; c.beginPath(); c.arc(tx, ty, 6, 0, Math.PI * 2); c.fill();
    if (o > 0.01 && Math.random() < o * dt / 40) puffs.push({ x: 52 + Math.random() * 10, y: 82, r: 5, a: 0.55 });
    puffs.forEach(function (p) { p.y -= dt * 0.03; p.x += dt * 0.008; p.r += dt * 0.012; p.a -= dt * 0.0005; });
    puffs = puffs.filter(function (p) { return p.a > 0; });
    puffs.forEach(function (p) { c.fillStyle = 'rgba(230,238,248,' + p.a + ')'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill(); });
    var lit = front > 196;
    c.lineWidth = 3; c.strokeStyle = '#3a4656'; c.beginPath(); c.moveTo(196, 112);
    for (x = 196; x <= W; x += 4) c.lineTo(x, wireY(x)); c.stroke();
    if (lit) { c.strokeStyle = '#ffcf66'; c.lineWidth = 3; c.save(); c.shadowColor = '#ffb300'; c.shadowBlur = 10; c.beginPath(); c.moveTo(196, 112);
      for (x = 196; x <= Math.min(front, W); x += 4) c.lineTo(x, wireY(x)); c.stroke(); c.restore();
      for (k = 0; k < 6; k++) { var q = ((now / 1400) + k / 6) % 1, qx = 196 + q * (Math.min(front, W + 40) - 196); if (qx <= W) glow(c, qx, wireY(qx), 10, '255,236,170', 0.95); }
    }
    POLES.forEach(function (px) { if (px > W) return; var on = front > px;
      c.fillStyle = '#2b384b'; c.fillRect(px - 2, 112, 4, 138); c.fillRect(px - 12, 110, 24, 4);
      if (on) { glow(c, px, 236, 40, '255,214,120', 0.45); }
      c.fillStyle = on ? '#ffe9a8' : '#2a3442'; c.beginPath(); c.arc(px + 10, 128, 4, 0, Math.PI * 2); c.fill();
      if (on) glow(c, px + 10, 128, 16, '255,214,120', 0.8); });
    HOUSES.forEach(function (hs) { c.fillStyle = '#101b2b'; c.fillRect(hs.x, 250 - hs.h, hs.w, hs.h);
      var on = front > hs.x + hs.w / 2; hs.wins.forEach(function (w, n) { c.fillStyle = on && ((n * 7) % 5 !== 0 || front > hs.x + 60) ? '#ffd36b' : '#1d2838'; c.fillRect(w[0], w[1], 6, 8); }); });
    c.fillStyle = '#111d2e'; c.fillRect(FACT.x, FACT.y, FACT.w, FACT.h); c.fillRect(FACT.x + 78, FACT.y - 46, 14, 48);
    var fon = front > FACT.x + FACT.w / 2;
    for (i = 0; i < 4; i++) { c.fillStyle = fon ? '#ffe08a' : '#1d2838'; c.fillRect(FACT.x + 8 + i * 24, FACT.y + 18, 16, 26); }
    if (fon) { glow(c, FACT.x + 52, FACT.y + 30, 70, '255,214,120', 0.3); for (i = 0; i < 3; i++) { var ph = (now / 30 + i * 20) % 60, sy = FACT.y - 50 - ph; c.fillStyle = 'rgba(200,210,225,' + (0.3 * (1 - ph / 60)) + ')'; c.beginPath(); c.arc(FACT.x + 85, sy, 6 + ph / 8, 0, Math.PI * 2); c.fill(); } }
    if (front > W) { var g = c.createLinearGradient(W - 90, 0, W, 0); g.addColorStop(0, 'rgba(255,214,120,0)'); g.addColorStop(1, 'rgba(255,214,120,' + (0.22 + 0.1 * Math.sin(now / 300)) + ')'); c.fillStyle = g; c.fillRect(W - 90, 0, 90, H); }
    if (flash > 0) { c.fillStyle = 'rgba(255,245,210,' + (flash * 0.7) + ')'; c.fillRect(0, 0, W, H); }
  }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }

  /* ---------- шаги: одно нажатие на шаг ---------- */
  // после каждого пол-оборота штурвала — что стало видно (тексты подсказок страницы 01-21, разложенные на 4 нажатия)
  var POSLE = [
    null,
    'Задвижка приоткрылась: пар пошёл на турбину — она трогается. Нажимай штурвал дальше.',
    'Турбина набирает обороты, ток вышел за стену станции. Загораются опоры — нажимай дальше.',
    'Улица в огнях. Ещё немного — до завода и дальше, в общую сеть.'
  ];
  var shag = 0;   // 0 — ключ, 1–4 — пол-оборота штурвала, 5 — финал
  function goStep(n) {
    shag = n;
    if (n === 0) { aktiv(btnKey); say('нажми «Ключ»', 'Начни слева: поверни ключ американского реактора.'); }
    else if (n === 1) { aktiv(btnWheel); say('нажми «Штурвал»', 'Четыре лампочки горят — и провод упирается в стену. Дальше лаборатории этот ток не пошёл. Теперь справа: открой задвижку штурвалом.'); }
    else if (n < 5) { aktiv(btnWheel); say('нажми «Штурвал» ещё раз', POSLE[n - 1]); }
  }
  function setAcc(v) {
    acc = Math.max(0, Math.min(TURN, v));
    wheelRot.style.transform = 'rotate(' + acc + 'deg)';
    btnWheel.setAttribute('aria-label', acc ? 'Штурвал задвижки: открыта на ' + Math.round(acc / TURN * 100) + '%' : 'Штурвал задвижки: закрыта');
    kick();
  }
  function konec() {
    done = true; if (!reduce) flash = 1;
    aktiv(null);
    say('прочитай, что вышло, ниже', 'Ток ушёл за край экрана — в общую сеть. А слева так и горят четыре лампочки в запертой комнате.');
    finale.hidden = false; requestAnimationFrame(function () { finale.classList.add('on'); });
    setTimeout(function () { if (done) finale.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 1600);
  }

  btnKey.addEventListener('click', function () {
    if (tekAktiv !== btnKey || shag !== 0) return mimo();
    keyOn = true; keyT = reduce ? 1 : 0;                       // ключ повернулся в том же кадре
    btnKey.classList.add('on'); btnKey.setAttribute('aria-pressed', 'true');
    aktiv(null); say('смотри на лампочки', 'Ключ повёрнут — американский реактор дал ток…');
    kick();
    setTimeout(function () {
      goStep(1);
      if (window.innerWidth < 701) $('.zv-st-ru').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }, reduce ? 300 : 1300);
  });
  btnWheel.addEventListener('click', function () {
    if (tekAktiv !== btnWheel || shag < 1 || shag > 4) return mimo();
    var n = shag;
    aktiv(null); say('смотри на станцию', n === 1 ? 'Штурвал повернулся на пол-оборота — задвижка открывается…' : 'Ещё пол-оборота штурвала…');
    if (reduce) setAcc(n * HALF); else { tween = { from: acc, to: n * HALF, t: 0 }; kick(); }
    setTimeout(function () { if (n === 4) konec(); else goStep(n + 1); }, reduce ? 400 : 1500);
  });
  [$('.zv-cv-us'), $('.zv-cv-ru')].forEach(function (cv) { cv.addEventListener('click', mimo); });
  btnAgain.addEventListener('click', function () {
    keyOn = false; keyT = 0; done = false; flash = 0; tween = null; front = 0; openS = 0;
    btnKey.classList.remove('on'); btnKey.setAttribute('aria-pressed', 'false');
    finale.classList.remove('on'); finale.hidden = true; setAcc(0);
    goStep(0);
    root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- цикл: крутится, пока сцена на экране ---------- */
  var running = false, visible = true, last = 0;
  function loop(now) {
    var dt = last ? Math.min(50, now - last) : 16; last = now;
    if (tween) { tween.t = Math.min(1, tween.t + dt / 700); var e = 1 - Math.pow(1 - tween.t, 3); var to = tween.to; setAcc(tween.from + (to - tween.from) * e); if (tween.t >= 1) tween = null; }
    if (keyOn && keyT < 1) keyT = Math.min(1, keyT + dt / 900);
    var o = acc / TURN; openS += reduce ? (o - openS) : (o - openS) * Math.min(1, dt / 260);
    var fT = o >= 1 ? W + 400 : 196 + o * (W + 40 - 196); front += reduce ? (fT - front) : (fT - front) * Math.min(1, dt / 500);
    if (flash > 0) flash = Math.max(0, flash - dt / 700);
    elUS.textContent = keyOn ? '4' : '0';
    elRU.textContent = fmt(RU_LAMPS * Math.min(1, openS / 0.999));
    elOpen.style.width = (o * 100) + '%';
    drawUS(now); drawRU(now, dt);
    if (visible) requestAnimationFrame(loop); else { running = false; last = 0; }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe($('.zv-lab'));
  goStep(0);
  kick();
})();
