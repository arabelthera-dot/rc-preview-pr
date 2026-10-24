/* Игра 17 января (Жуковский): подними пилота — наугад или по формуле. Только нажатия (Р206, Р227, Р228; Р180 — понятные шаги). */
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

(function () {
  var root = document.querySelector('[data-zhukovsky-igra]');
  if (!root) return;
  var q = function (s) { return root.querySelector(s); };
  var ruka = igraRuka(root);
  var bGo = q('.zp-go'), bUp = q('.zp-up'), bZh = q('.zp-zh'), bCalc = q('.zp-calc'), bAgain = q('.zp-again');
  var task = q('.zp-task'), sub = q('.zp-sub'), finale = q('.zp-finale');
  var steps = root.querySelectorAll('.zp-steps li');

  /* Модель (как на странице дня): подъёмная сила ~ угол до предела 15°, за пределом — срыв.
     Нужный угол = вес пилота / 7,5; запас ±6% силы. Наугад силу не видно, «глазами Жуковского» — стрелки и вихрь. */
  var cv = q('.zp-cv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, KRIT = 15, K = 7.5, BAND = 0.06, GROUND = H - 34;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KG = 70, UGOL0 = 4, UGOL_NA_GLAZ = 13;
  var ugol, mode, crashes, state, fl, wrecks, bits, wreckFade, shag, zhdat;

  function zadacha(t) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }
  function poyasn(t, cls) { sub.className = 'zp-sub igra-poyasnenie' + (cls ? ' ' + cls : ''); sub.textContent = t; }
  function etap(n) { for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', i === n); }
  function fmt(a) { return (Math.round(a * 10) / 10).toString().replace('.', ',') + '°'; }
  function pokazUgol() { q('.zp-ugol').textContent = fmt(ugol); }
  function ratio(a) { return a > KRIT ? 0.12 : (a / (KG / K)); }
  function hillY(x) { return x < 150 ? 210 + (x / 150) * (x / 150) * (GROUND - 210) : GROUND; }
  function plural(n, a, b, c5) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14)) ? b : c5; }

  var P = []; for (var i = 0; i < 46; i++) P.push({ x: Math.random() * W, y: 20 + Math.random() * (GROUND - 60), s: .6 + Math.random() * .7 });
  function glider(x, y, rot, a, alpha) {
    c.save(); c.globalAlpha = alpha == null ? 1 : alpha; c.translate(x, y); c.rotate(rot); c.scale(1.35, 1.35);
    c.save(); c.scale(-1, 1); c.rotate(a * Math.PI / 180);
    c.beginPath(); c.moveTo(-46, 2); c.bezierCurveTo(-46, -10, -20, -15, 6, -12); c.bezierCurveTo(28, -9, 46, -2, 54, 1);
    c.bezierCurveTo(30, 4, -16, 8, -36, 7); c.bezierCurveTo(-44, 6, -46, 4, -46, 2); c.closePath();
    c.fillStyle = '#e8eef5'; c.fill(); c.restore();
    c.strokeStyle = '#c9a84c'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-4, 4); c.lineTo(-10, 26); c.moveTo(6, 4); c.lineTo(-2, 26); c.stroke();
    c.fillStyle = '#c9a84c'; c.beginPath(); c.arc(-6, 30, 5, 0, 7); c.fill(); c.fillRect(-9, 34, 6, 14);
    c.restore();
  }
  function arrow(x, y, len, col, w) {
    var d = len < 0 ? -1 : 1; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - len + d * 10); c.stroke();
    c.beginPath(); c.moveTo(x - 9, y - len + d * 12); c.lineTo(x + 9, y - len + d * 12); c.lineTo(x, y - len); c.closePath(); c.fill();
  }
  function vortex(x, y, t, al, drift) {
    if (al <= 0) return; c.strokeStyle = 'rgba(125,200,255,' + al.toFixed(2) + ')'; c.lineWidth = 2;
    for (var k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x + drift, y, 92 + k * 14, 34 + k * 7, 0, t * 2 + k, t * 2 + k + 4.4); c.stroke(); }
  }
  function draw(t) {
    c.fillStyle = '#0b1a2a'; c.fillRect(0, 0, W, H);
    P.forEach(function (p) { p.x += (RM ? 0.6 : 1.8) * p.s; if (p.x > W) { p.x = 0; p.y = 20 + Math.random() * (GROUND - 60); } c.fillStyle = 'rgba(140,200,255,.35)'; c.fillRect(p.x, p.y, 6, 1.4); });
    c.fillStyle = '#3a2f22'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 10) c.lineTo(x, hillY(x)); c.lineTo(W, H); c.closePath(); c.fill();
    c.fillStyle = '#4f6b3a'; c.fillRect(0, GROUND, W, 3);
    wrecks.forEach(function (w) { c.save(); c.globalAlpha = wreckFade; c.translate(w.x, w.y); c.rotate(w.r); c.fillStyle = '#8c97a3'; c.fillRect(-w.l / 2, -2, w.l, 4); c.restore(); });
    bits.forEach(function (b) { c.save(); c.translate(b.x, b.y); c.rotate(b.r); c.fillStyle = '#d6dde5'; c.fillRect(-b.l / 2, -2, b.l, 4); c.restore(); });
    var zh = mode === 'zh';
    if (state === 'ready') {
      var gx = 96, gy = hillY(96) - 70, r = ratio(ugol);
      glider(gx, gy, 0, ugol);
      if (zh) {
        var stall = ugol > KRIT, good = Math.abs(r - 1) <= BAND && !stall;
        vortex(gx + 4, gy - 2, t, stall ? 0.25 : 0.25 + Math.min(r, 1.3) * 0.45, stall ? 40 + Math.sin(t * 3) * 20 : 0);
        c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,120,110,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(gx + 46, gy - 12 - 90); c.lineTo(gx + 114, gy - 12 - 90); c.stroke(); c.setLineDash([]);
        arrow(gx + 80, gy - 12, Math.max(10, Math.min(170, 90 * r)), good ? '#5fe08a' : (stall ? '#ff8a6e' : '#e8c66a'), 6);
        arrow(gx + 80, gy + 60, -90, 'rgba(255,120,110,.85)', 4);
      }
    } else if (fl) {
      if (zh && !fl.crash) vortex(fl.x + 4, fl.y - 2, t, fl.stall ? Math.max(0, .6 - (t - fl.st) * 0.4) : 0.6, fl.stall ? (t - fl.st) * -160 : 0);
      if (!fl.gone) glider(fl.x, fl.y, fl.rot, ugol);
    }
  }
  function step(dt, t) {
    bits.forEach(function (b) { if (b.rest) return; b.vy += 420 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt;
      if (b.y >= GROUND - 2) { b.y = GROUND - 2; b.rest = true; wrecks.push({ x: b.x, y: b.y, r: b.r, l: b.l }); } });
    bits = bits.filter(function (b) { return !b.rest; });
    if (state !== 'fly' || !fl) return;
    fl.t += dt; var k = fl.kind, g = 300;
    if (k === 'ok') { fl.vy += (-g * 0.04 - fl.vy * 1.5) * dt; fl.rot += (-0.05 - fl.rot) * dt * 3; }
    else if (k === 'malo') { fl.vy += g * 0.55 * dt; fl.rot += (0.7 - fl.rot) * dt * 1.4; }
    else if (k === 'mnogo') { if (!fl.stall) { fl.vy += (-g * 0.9) * dt; fl.rot += (-0.9 - fl.rot) * dt * 2.2; if (fl.t > 0.75) { fl.stall = true; fl.st = t; } }
      else { fl.vy += g * 1.1 * dt; fl.vx *= 1 - dt * 0.9; fl.rot += 3.2 * dt; } }
    else { if (fl.t < 0.35) fl.vy += -g * 0.2 * dt; else { fl.vy += g * 1.2 * dt; fl.vx *= 1 - dt * 0.8; fl.rot += 2.6 * dt; } }
    fl.x += fl.vx * dt; fl.y += fl.vy * dt;
    if (k === 'ok' && fl.x > W + 60) { fl.gone = true; finish(true); return; }
    if (fl.y + 52 >= hillY(fl.x) && fl.t > 0.2) { fl.crash = true; fl.gone = true;
      for (var i = 0; i < 7; i++) bits.push({ x: fl.x + (i - 3) * 6, y: hillY(fl.x) - 14, vx: fl.vx * 0.3 + (Math.random() - .5) * 160, vy: -80 - Math.random() * 140, r: Math.random() * 3, vr: (Math.random() - .5) * 12, l: 10 + Math.random() * 16 });
      finish(false); }
  }

  /* Шаги игры: каждое нажатие — один видимый шаг сюжета. */
  var SHAGI = [
    { btn: bGo,   task: 'Нажми «В воздух»' },
    { btn: bUp,   task: 'Нажми «Круче крыло»' },
    { btn: bGo,   task: 'Нажми «В воздух»' },
    { btn: bZh,   task: 'Нажми «Глазами Жуковского»' },
    { btn: bCalc, task: 'Нажми «Посчитать по формуле»' },
    { btn: bGo,   task: 'Нажми «В воздух»' }
  ];
  function k(n) { shag = n; zhdat = false; zadacha(SHAGI[n].task); ruka.na(SHAGI[n].btn); }
  function zanyat(t) { zhdat = true; ruka.ubrat(); zadacha(t); }

  function launch() {
    var r = ratio(ugol), kind = ugol > KRIT ? 'srv' : (r < 1 - BAND ? 'malo' : (r > 1 + BAND ? 'mnogo' : 'ok'));
    state = 'fly'; fl = { x: 96, y: hillY(96) - 70, vx: 170, vy: 0, rot: 0, t: 0, kind: kind, stall: kind === 'srv', st: 0, crash: false };
    if (fl.stall) fl.st = (performance.now() - t0) / 1000;
    zanyat('Смотри на планёр');
    poyasn(mode === 'zh' ? 'Старт по расчёту…' : 'Старт наугад… угол ' + fmt(ugol) + ', силы крыла не видно.');
  }
  function finish(ok) {
    state = 'done';
    var a = fmt(ugol), kind = fl.kind;
    if (!ok) {
      crashes++; q('.zp-crash-n').textContent = crashes; q('.zp-icons').appendChild(document.createElement('i'));
      var cb = q('.zp-crash'); cb.classList.add('bump'); setTimeout(function () { cb.classList.remove('bump'); }, 500);
    }
    var text, cls = 'bad', dalshe;
    if (ok) {
      cls = 'ok';
      text = 'С первого раза! Наугад ты разбил ' + crashes + ' ' + plural(crashes, 'планёр', 'планёра', 'планёров') + ' — а по формуле хватило одного расчёта. Этим Жуковский и перевернул авиацию в 1906 году.';
      q('.zp-crash').classList.add('pogas'); wreckFade = 1; fade();
      dalshe = otkrytFinal;
    } else if (kind === 'malo') { text = 'Мало силы: при ' + a + ' крыло не удержало пилота ' + KG + ' кг — планёр клюнул носом.'; dalshe = function () { k(1); }; }
    else { text = 'Перетянул: при ' + a + ' нос задрался, поток над крылом сорвался — сваливание. Так и учились до 1906 года — обломками.'; dalshe = function () { k(3); }; }
    poyasn(text, cls);
    setTimeout(function () { fl = null; state = 'ready'; dalshe(); }, ok ? 1400 : 1300);
  }
  function fade() { var s = performance.now(); (function f(n) { wreckFade = Math.max(0, 1 - (n - s) / 1600); if (wreckFade > 0) requestAnimationFrame(f); else wrecks = []; })(s); }
  function plavno(cel, ms, gotovo) {
    var a0 = ugol, s = performance.now();
    (function f(n) { var x = Math.min(1, (n - s) / ms); x = x * x * (3 - 2 * x); ugol = a0 + (cel - a0) * x; pokazUgol();
      if (x < 1) requestAnimationFrame(f); else { ugol = cel; pokazUgol(); gotovo(); } })(s);
  }
  function otkrytFinal() {
    ruka.ubrat(); zhdat = true; etap(2);
    zadacha('Готово — читай ниже');
    q('.zp-big').textContent = 'Пилот ' + KG + ' кг в воздухе с первого раза. Наугад — ' + crashes + ' ' + plural(crashes, 'разбитый планёр', 'разбитых планёра', 'разбитых планёров') + ', по формуле Жуковского — ни одного: угол посчитали до полёта.';
    finale.hidden = false;
    setTimeout(function () { finale.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }, 300);
  }

  function nazhal(btn) {
    if (zhdat || !SHAGI[shag] || SHAGI[shag].btn !== btn) {
      poyasn(zhdat ? 'Подожди — планёр в полёте' : 'Жми мигающую кнопку'); return;
    }
    if (shag === 0 || shag === 2 || shag === 5) { launch(); return; }
    if (shag === 1) {
      zanyat('Смотри на угол крыла');
      poyasn('Круче крыло — больше силы? Ставим на глаз…');
      plavno(UGOL_NA_GLAZ, 700, function () { poyasn('Угол ' + fmt(ugol) + ' — снова на глаз. Хватит ли теперь?'); k(2); });
      return;
    }
    if (shag === 3) {
      mode = 'zh'; etap(1); q('.zp-legend').hidden = false;
      poyasn('Видно то, что увидел Жуковский: вихрь вокруг крыла. Жёлтая стрелка силы выше красной черты веса — при ' + fmt(ugol) + ' перебор.');
      k(4); return;
    }
    if (shag === 4) {
      zanyat('Смотри на стрелку силы');
      q('.zp-formula').hidden = false;
      poyasn('Считаем по формуле Y = ρ · V · Γ…');
      plavno(KG / K, 900, function () { etap(2); poyasn('По формуле для пилота ' + KG + ' кг нужен угол ' + fmt(ugol) + '. Зелёная стрелка ровно на черте — посчитано до полёта.', 'ok'); k(5); });
    }
  }
  [bGo, bUp, bZh, bCalc].forEach(function (b) { b.addEventListener('click', function () { nazhal(b); }); });

  function start() {
    ugol = UGOL0; mode = 'blind'; crashes = 0; state = 'ready'; fl = null; wrecks = []; bits = []; wreckFade = 1;
    q('.zp-crash-n').textContent = '0'; q('.zp-icons').innerHTML = ''; q('.zp-crash').classList.remove('pogas');
    q('.zp-legend').hidden = true; q('.zp-formula').hidden = true; finale.hidden = true; etap(0); pokazUgol();
    poyasn('Пилот ' + KG + ' кг ждёт на холме. Угол крыла 4° — поставлен на глаз.');
    k(0);
  }
  bAgain.addEventListener('click', function () { start(); root.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); });

  var last = performance.now(), t0 = last;
  function loop(now) { var dt = Math.min(.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000; step(dt, t); draw(t); requestAnimationFrame(loop); }
  start();
  requestAnimationFrame(loop);
})();
