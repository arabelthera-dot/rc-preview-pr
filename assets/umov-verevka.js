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

/* Игра «Верёвка с колокольчиком» — 23 января, Николай Умов, поток энергии (1874).
   Движок: струна (волновое уравнение, число Куранта 1 — импульс бежит без искажений),
   левый конец — ручка посетителя, правый — колокольчик (поглощающий конец, энергия уходит в него),
   «палец» — закреплённая точка (полное отражение). Слой «глазами Умова» рисует плотность энергии
   w = ½(v² + c²·y'²) светящимся сгустком и стрелку по знаку потока S = −v·y'.
   Управление — только кнопки, одно нажатие на шаг (Р201, Р206); канвас — картинка. Р183, черновик для показа Сергею (Р177). */
(function () {
  'use strict';
  var root = document.querySelector('[data-umov-igra]');
  if (!root) return;
  var cv = root.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var $ = function (s) { return root.querySelector(s); };
  var elTask = $('.uv-task'), elSub = $('.uv-sub');
  var btnPull = $('.uv-pull'), btnEye = $('.uv-eye'), btnPin = $('.uv-pin'), btnAgain = $('.uv-again');
  var knopki = [btnPull, btnEye, btnPin];
  var steps = root.querySelectorAll('.uv-steps li');
  var finale = $('.uv-finale');

  var N = 150;                 // узлов на верёвке
  var y = new Float32Array(N + 1), yOld = new Float32Array(N + 1), yNew = new Float32Array(N + 1);
  var W = 390, H = 280, dpr = 1, x0 = 40, x1 = 330, ry = 160, dx = 2;
  var DAMP = 0.998;            // трение: верёвка понемногу успокаивается и выпрямляется
  var STEPS_PER_SEC = 95;      // ≈1,6 с до колокольчика; «глазами Умова» — вдвое медленнее
  var acc = 0, last = 0;

  var hand = 0;                // смещение ручки, px
  var spring = 0;              // скорость возврата ручки
  var script = null;           // рывок кнопкой: {t, T, A}
  var PIN_AT = Math.round(N * 0.55);
  var pin = -1;                // узел под пальцем, −1 — нет
  var umov = false;
  var step = 1, done = false;  // шаги 1–5, потом финал
  var bell = { a: 0, w: 0, ring: 0, glow: 0 };
  var ev = null;               // текущий рывок: {absorbed, t, umov, pin, ringed, rest, sinceRing}
  var E_REF = 1, THRESH = 1;
  var audio = null, lastRatio = 0;

  /* Р206: на шаге одна активная пульсирующая кнопка + рука «тап-тап»; остальные приглушены (общий компонент igraRuka) */
  var ruka = igraRuka(root), tekAktiv = null;
  function aktiv(btn) {
    tekAktiv = btn || null;
    knopki.forEach(function (b) { b.setAttribute('aria-disabled', b === btn ? 'false' : 'true'); });
    if (btn) ruka.na(btn); else ruka.ubrat();
  }
  function mimo() { if (tekAktiv) elSub.textContent = 'Жми мигающую кнопку'; }
  function otklik() { try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) { /* нет вибро */ } }

  function layout() {
    var r = cv.getBoundingClientRect();
    W = Math.max(300, r.width); H = Math.max(220, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    x0 = Math.max(44, W * 0.09); x1 = W - Math.max(70, W * 0.13);
    ry = H * 0.56; dx = (x1 - x0) / N;
  }
  function amp() { return H * 0.17; }        // рывок кнопкой

  /* ---------- физика ---------- */
  function driveLeft(dt) {
    if (script) {
      script.t += dt;
      var p = script.t / script.T;
      hand = p >= 1 ? 0 : -script.A * Math.sin(Math.PI * p);
      if (p >= 1) script = null;
    } else {
      spring += (-hand * 900 - spring * 42) * dt;
      hand += spring * dt;
      if (Math.abs(hand) < 0.05 && Math.abs(spring) < 0.5) { hand = 0; spring = 0; }
    }
  }
  function simStep(sim) {
    var s = sim || state;
    var a = s.y, o = s.yOld, n = s.yNew, i;
    n[0] = s.hand;
    for (i = 1; i < N; i++) n[i] = (a[i + 1] + a[i - 1] - o[i]) * DAMP;   // схема устойчива ровно при Куранте 1
    n[N] = a[N - 1];                        // поглощающий конец (Мур, Куранта 1): энергия уходит в колокольчик
    if (s.pin > 0) n[s.pin] = 0;            // палец держит верёвку — отражение
    var out = n[N] - a[N];
    s.absorbed += out * out;
    s.yOld = a; s.y = n; s.yNew = o;
    return out;
  }
  var state = { y: y, yOld: yOld, yNew: yNew, hand: 0, pin: -1, absorbed: 0 };

  function calibrate() {
    // энергия эталонного рывка кнопкой, доехавшая до колокольчика
    var s = { y: new Float32Array(N + 1), yOld: new Float32Array(N + 1), yNew: new Float32Array(N + 1), hand: 0, pin: -1, absorbed: 0 };
    var T = 0.22, A = amp(), t = 0, dtS = 1 / STEPS_PER_SEC;
    for (var k = 0; k < N * 3; k++) {
      t += dtS;
      s.hand = t < T ? -A * Math.sin(Math.PI * t / T) : 0;
      simStep(s);
    }
    E_REF = s.absorbed || 1;
    THRESH = E_REF * 0.55;
  }
  function calm() {   // верёвка в покое (для «Сыграть ещё раз»)
    state.y.fill(0); state.yOld.fill(0); state.yNew.fill(0);
    hand = 0; spring = 0; script = null; state.hand = 0; ev = null;
  }

  function energyAt(i) {
    var v = state.y[i] - state.yOld[i];
    var g = (state.y[Math.min(N, i + 1)] - state.y[i]);
    return 0.5 * (v * v + g * g);
  }
  function fluxAt(i) {
    var v = state.y[i] - state.yOld[i];
    var g = (state.y[Math.min(N, i + 1)] - state.y[Math.max(0, i - 1)]) / 2;
    return -v * g;
  }

  /* ---------- события игры ---------- */
  function launchCheck(dt) {
    var moving = Math.abs(state.hand) > 2;
    if (moving && !ev) ev = { absorbed: 0, t: 0, umov: umov, pin: pin > 0, ringed: false, rest: 0, sinceRing: 0 };
    if (!ev) return;
    ev.t += dt;
    var travel = N / STEPS_PER_SEC;
    // итог рывка: звон — сразу, иначе — когда посылка точно успела бы доехать после того, как ручку отпустили
    if (script || Math.abs(state.hand) > 0.5) ev.rest = 0; else ev.rest += dt * (umov ? 0.5 : 1);
    if (ev.ringed) ev.sinceRing += dt;
    if (ev.sinceRing > 0.6 || ev.rest > travel * 1.25 || ev.t > 30) finish();
  }
  // рывок доехал (или не доехал): нужный исход — следующий шаг, иначе тот же шаг заново
  function finish() {
    var e = ev; ev = null;
    lastRatio = e.absorbed / THRESH;
    if (done) return;
    if (step === 1) { if (e.ringed) goStep(2); else goStep(1, 'Не дозвонились — нажми ещё раз'); }
    else if (step === 3) { if (e.ringed || lastRatio > 0.05) goStep(4); else goStep(3, 'Рывок не доехал — нажми ещё раз'); }
    else if (step === 5) { if (e.pin && !e.ringed) goStep(6); else goStep(5, 'Колокольчик зазвенел — нажми ещё раз'); }
  }
  function onAbsorb(out) {
    if (!ev) return;
    ev.absorbed += out * out;
    bell.w += out * 0.004;
    if (!ev.ringed && ev.absorbed >= THRESH) {
      ev.ringed = true; bell.ring = 1.6; bell.w += 2.2 * (out >= 0 ? 1 : -1);
      ding(Math.min(1, ev.absorbed / E_REF));
    }
  }

  /* ---------- шаги: одно нажатие на шаг ---------- */
  var SHAG = {
    1: [btnPull, 'нажми «Дёрнуть»', 'Колокольчик справа зазвенит, если рывок до него доедет'],
    2: [btnEye, 'нажми «Глазами Умова»', 'Звенит! Рывок доехал по верёвке до колокольчика. Теперь посмотрим, что именно по ней едет'],
    3: [btnPull, 'нажми «Дёрнуть»', 'Включено «Глазами Умова»: всё идёт медленнее, а энергия светится'],
    4: [btnPin, 'нажми «Прижать пальцем»', 'Видел светящийся комок? Это энергия едет к колокольчику, а сама верёвка остаётся на месте. Теперь не дай ему зазвонить'],
    5: [btnPull, 'нажми «Дёрнуть»', 'Палец прижал верёвку посередине. Доедет ли энергия до колокольчика?'],
    6: [null, 'прочитай рассказ ниже', 'Получилось! Колокольчик молчит: энергия упёрлась в палец и поехала назад']
  };
  var ETAP = [0, 1, 2, 2, 3, 3, 4];   // шаг → этап полоски (Позвонить / Увидеть / Помешать)
  function goStep(n, sub) {
    step = n;
    var e = ETAP[n];
    steps.forEach(function (li, k) { li.classList.toggle('on', k + 1 === e); li.classList.toggle('ok', k + 1 < e); });
    aktiv(SHAG[n][0]);
    say(SHAG[n][1], sub || SHAG[n][2]);
    if (n === 6) {
      done = true; finale.hidden = false;
      setTimeout(function () { if (done) finale.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 1200);
    }
  }
  // задание всегда начинается с «Что сделать сейчас:» (контракт Р199), вторая строка — пояснение, что произошло
  function say(a, b) {
    elTask.textContent = '';
    var m = document.createElement('b'); m.textContent = 'Что сделать сейчас:';
    elTask.appendChild(m); elTask.appendChild(document.createTextNode(' ' + a));
    elSub.textContent = b || '';
  }

  /* ---------- звук ---------- */
  function ding(power) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime, g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18 + 0.2 * power, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      g.connect(audio.destination);
      [1318, 2637, 3520].forEach(function (f, k) {
        var o = audio.createOscillator(), og = audio.createGain();
        o.frequency.value = f; og.gain.value = [1, 0.35, 0.18][k];
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.9);
      });
    } catch (e) { /* без звука */ }
  }

  /* ---------- ввод: только нажатия на кнопки (click) ---------- */
  function pull() {
    script = { t: 0, T: 0.22, A: amp() };
    driveLeft(1 / STEPS_PER_SEC); state.hand = hand;   // ручка дёргается в том же кадре
    aktiv(null);                                        // пока волна едет — все кнопки ждут
    say('смотри на колокольчик', 'Рывок едет по верёвке…');
  }
  function setPin(i) {
    pin = i; state.pin = i;
    btnPin.setAttribute('aria-pressed', pin > 0 ? 'true' : 'false');
  }
  function setUmov(on) {
    umov = on;
    btnEye.setAttribute('aria-pressed', on ? 'true' : 'false');
    root.classList.toggle('umov', on);
  }
  btnPull.addEventListener('click', function () {
    otklik();
    if (tekAktiv !== btnPull) return mimo();
    if (step === 1 || step === 3 || step === 5) pull();
  });
  btnEye.addEventListener('click', function () {
    otklik();
    if (step !== 2 || tekAktiv !== btnEye) return mimo();
    setUmov(true);                 // не тумблер: вид остаётся включённым до «Сыграть ещё раз»
    draw(performance.now());
    goStep(3);
  });
  btnPin.addEventListener('click', function () {
    otklik();
    if (step !== 4 || tekAktiv !== btnPin) return mimo();
    setPin(PIN_AT);                // не тумблер: палец остаётся до «Сыграть ещё раз»
    draw(performance.now());
    goStep(5);
  });
  btnAgain.addEventListener('click', function () {
    otklik();
    finale.hidden = true; done = false;
    calm(); setPin(-1); setUmov(false);
    goStep(1);
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  cv.addEventListener('click', function () { if (tekAktiv) tekAktiv.click(); });
  root.addEventListener('keydown', function (e) {
    if (e.target === cv && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      var b = SHAG[step] && SHAG[step][0];
      if (b && b === tekAktiv) b.click();
    }
  });

  /* ---------- рисование ---------- */
  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // пол и стойка
    ctx.fillStyle = umov ? 'rgba(4,8,16,.55)' : 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(201,168,76,.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 18); ctx.lineTo(W, H - 18); ctx.stroke();
    drawPost();

    // верёвка
    var pts = [];
    for (var i = 0; i <= N; i++) pts.push([x0 + i * dx, ry + state.y[i]]);
    if (umov) drawEnergy(pts);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = umov ? 'rgba(214,190,150,.35)' : '#d8bf8f';
    ctx.lineWidth = umov ? 3 : 4.5;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i <= N; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    if (!umov) { // волокна верёвки
      ctx.strokeStyle = 'rgba(120,90,50,.55)'; ctx.lineWidth = 1.2;
      for (i = 2; i < N; i += 4) { ctx.beginPath(); ctx.moveTo(pts[i][0] - 2, pts[i][1] - 2); ctx.lineTo(pts[i][0] + 2, pts[i][1] + 2); ctx.stroke(); }
    }
    drawHandle(pts[0], now);
    if (pin > 0) drawFinger(pts[pin], false);
    drawBell();
  }
  function drawPost() {
    var bx = x1 + Math.max(26, W * 0.045);
    ctx.fillStyle = '#3b2c1c';
    ctx.fillRect(bx + 18, ry - H * 0.42, 8, H * 0.42 + (H - 18 - ry));
    ctx.fillRect(bx - 6, ry - H * 0.42, 32, 7);
  }
  function drawBell() {
    var bx = x1 + Math.max(26, W * 0.045), topY = ry - H * 0.42 + 7;
    var len = H * 0.2;
    ctx.save();
    ctx.translate(bx, topY);
    ctx.rotate(bell.a);
    // подвес
    ctx.strokeStyle = '#9a7b3c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
    // язычок
    ctx.fillStyle = '#6b5426';
    ctx.beginPath(); ctx.arc(Math.sin(-bell.a * 2) * 6, len + 30, 4.5, 0, 7); ctx.fill();
    // колокол
    var s = Math.min(1.25, Math.max(0.85, H / 280));
    ctx.translate(0, len);
    if (bell.glow > 0.01) { ctx.shadowColor = 'rgba(255,214,120,' + bell.glow + ')'; ctx.shadowBlur = 30 * bell.glow; }
    var gr = ctx.createLinearGradient(-22 * s, 0, 22 * s, 0);
    gr.addColorStop(0, '#8d6b25'); gr.addColorStop(0.45, '#f0d27d'); gr.addColorStop(1, '#9c7a2e');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(-6 * s, 0); ctx.quadraticCurveTo(-14 * s, 2 * s, -16 * s, 18 * s);
    ctx.quadraticCurveTo(-18 * s, 30 * s, -25 * s, 34 * s); ctx.lineTo(25 * s, 34 * s);
    ctx.quadraticCurveTo(18 * s, 30 * s, 16 * s, 18 * s); ctx.quadraticCurveTo(14 * s, 2 * s, 6 * s, 0); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // звон — дуги вокруг колокольчика
    if (bell.ring > 0.02) {
      var cx = bx, cy = topY + len + 18;
      ctx.strokeStyle = 'rgba(255,220,140,' + Math.min(1, bell.ring) + ')'; ctx.lineWidth = 2.5;
      for (var k = 1; k <= 3; k++) {
        var r = 26 + k * 11 + (1.6 - bell.ring) * 16;
        ctx.beginPath(); ctx.arc(cx, cy, r, -0.6, 0.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      }
    }
    // перемычка от верёвки к колоколу
    ctx.strokeStyle = umov ? 'rgba(214,190,150,.35)' : '#d8bf8f'; ctx.lineWidth = umov ? 3 : 4.5;
    ctx.beginPath(); ctx.moveTo(x1, ry + state.y[N]);
    ctx.lineTo(bx + Math.sin(bell.a) * len * 0.9, topY + Math.cos(bell.a) * len * 0.9); ctx.stroke();
  }
  function drawHandle(p, now) {
    ctx.fillStyle = '#6b4a24';
    ctx.strokeStyle = '#e4c97a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(p[0] - 16, p[1], 13, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(6,12,23,.9)';
    ctx.beginPath(); ctx.ellipse(p[0] - 16, p[1], 5, 10, 0, 0, 7); ctx.fill();
  }
  function drawFinger(p, ghost) {
    var x = p[0], yy = p[1];
    ctx.save();
    ctx.globalAlpha = ghost ? 0.75 : 1;
    ctx.fillStyle = ghost ? '#f6e2c6' : '#f0c9a0';
    ctx.strokeStyle = '#8a5a35'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 9, yy - 60); ctx.lineTo(x - 9, yy - 8);
    ctx.quadraticCurveTo(x - 9, yy + 2, x, yy + 2); ctx.quadraticCurveTo(x + 9, yy + 2, x + 9, yy - 8);
    ctx.lineTo(x + 9, yy - 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(x, yy - 9, 5, 6, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawEnergy(pts) {
    // светящийся сгусток: толщина ~ корень плотности энергии
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (var i = 0; i < N; i++) {
      var e = energyAt(i);
      if (e < 0.004) continue;
      var w = Math.min(H * 0.13, 3 + Math.sqrt(e) * 1.5);
      var a = Math.min(0.85, 0.18 + Math.sqrt(e) * 0.07);
      ctx.strokeStyle = 'rgba(255,140,30,' + (a * 0.22) + ')'; ctx.lineWidth = w * 1.8;
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,80,' + a * 0.6 + ')'; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
    ctx.restore();
    // стрелки над сгустками: куда едет энергия
    var blobs = [], cur = null;
    for (i = 0; i <= N; i++) {
      var ee = energyAt(i);
      if (ee > 0.03) {
        if (!cur) cur = { s: 0, xs: 0, f: 0, m: 0, top: 1e9 };
        cur.s += ee; cur.xs += ee * i; cur.f += fluxAt(i); cur.m = Math.max(cur.m, ee);
        cur.top = Math.min(cur.top, pts[i][1]);
      } else if (cur) { blobs.push(cur); cur = null; }
    }
    if (cur) blobs.push(cur);
    blobs.forEach(function (b) {
      if (b.s < 0.6 || Math.abs(b.f) < 0.05) return;
      var ci = b.xs / b.s, dir = b.f > 0 ? 1 : -1;
      var cx = x0 + ci * dx, cy = Math.min(ry, b.top) - 18 - Math.min(H * 0.08, 3 + Math.sqrt(b.m) * 0.9);
      var L = 30;
      ctx.strokeStyle = '#fff3d0'; ctx.fillStyle = '#fff3d0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - dir * L / 2, cy); ctx.lineTo(cx + dir * L / 2, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + dir * (L / 2 + 9), cy); ctx.lineTo(cx + dir * L / 2 - dir * 2, cy - 7); ctx.lineTo(cx + dir * L / 2 - dir * 2, cy + 7); ctx.closePath(); ctx.fill();
      // хвост скорости
      ctx.globalAlpha = 0.5;
      for (var q = 1; q <= 3; q++) { ctx.beginPath(); ctx.arc(cx - dir * (L / 2 + q * 8), cy, 2.2 - q * 0.4, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    });
  }

  /* ---------- цикл ---------- */
  function frame(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    var slow = umov ? 0.5 : 1;
    acc += dt * STEPS_PER_SEC * slow;
    var sdt = 1 / STEPS_PER_SEC;
    while (acc >= 1) {
      acc -= 1;
      driveLeft(sdt);
      state.hand = hand;
      onAbsorb(simStep());
      launchCheck(sdt / slow);
    }
    // колокольчик — затухающий маятник
    bell.w += (-bell.a * 30 - bell.w * 2.4) * dt; bell.a += bell.w * dt;
    bell.a = Math.max(-0.6, Math.min(0.6, bell.a));
    bell.ring = Math.max(0, bell.ring - dt * 0.9);
    bell.glow = Math.min(1, bell.ring);
    draw(now);
    requestAnimationFrame(frame);
  }

  layout(); calibrate();
  window.addEventListener('resize', function () { layout(); calibrate(); });
  goStep(1);
  requestAnimationFrame(frame);
  // для проверки сценария в браузере (снимки, тест)
  window.rcUmov = { dbg: function () { return { E_REF: E_REF, THRESH: THRESH, H: H, W: W, hand: hand, ev: ev, last: lastRatio }; }, step: function () { return step; } };
})();
