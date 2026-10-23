/* Игра «Поймай резонанс» (31 января, гиротрон). Одна ручка «магнит»: попал в такт — точки-электроны
   сбиваются в сгусток, из трубки бьёт луч, счётчик ватт под сценой растёт. Шаги: 1964 (6 Вт) → ИТЭР (1 000 000 Вт)
   → финал: 8 лучей в бублик реактора, градусник до 300 млн °C. Все числа и подписи — в HTML под сценой.
   Р201: игра работает сразу при открытии, без экрана правил и кнопки «Начать»; короткие правила — под игрой. */
(function () {
  var root = document.querySelector('[data-girotron-igra]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var cv = $('.gr-cv'), c = cv.getContext('2d'), W = 640, H = 400;
  var range = $('.gr-range'), hand = $('.gr-hand'), task = $('.gr-task'), sub = $('.gr-sub');
  var wattEl = $('.gr-watt'), wBox = $('.gr-w'), eraEl = $('.gr-era'), eraL = $('.gr-era-l');
  var msg = $('.gr-msg'), next = $('.gr-next'), steps = root.querySelectorAll('.gr-steps li');
  var termo = $('.gr-termo'), tfill = $('.gr-tfill'), tempEl = $('.gr-temp'), sunL = $('.gr-tsun-l');
  var poke = $('.gr-poke'), tap = $('.gr-tap');
  var schema = $('.gr-schema'), finale = $('.gr-finale'), knobBox = $('.gr-knob'), kname = $('.gr-kname'), read = $('.gr-read');

  var LEVELS = [
    { target: 0.68, w: 0.10, dur: 2.5, beam: 0.3 },
    { target: 0.30, w: 0.06, dur: 4.5, beam: 1 }
  ];
  var N = 30, el = [];
  for (var i = 0; i < N; i++) el.push({ s0: i / N + Math.random() * 0.02, ph: Math.random() * Math.PI * 2 });

  var lv, prog, bunch, done, t = 0, last = 0, mode, fin, touched, raf = 0, running = false, hot = false;

  function fmtW(x) {
    if (x < 10) return x.toFixed(1).replace('.', ',').replace(',0', '') + ' Вт';
    return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Вт';
  }
  function setStep(n) { for (var k = 0; k < steps.length; k++) steps[k].classList.toggle('on', k <= n); }

  function start(n) {
    lv = n; prog = 0; bunch = 0; done = false; mode = 'play';
    msg.hidden = true; next.hidden = true; setStep(n);
    knobBox.hidden = false; kname.hidden = false; read.hidden = false; termo.hidden = true; finale.hidden = true;
    range.value = n === 0 ? 80 : 900;
    schema.textContent = 'схема · точки — электроны, кольца — магнит, справа — луч (настоящий невидим)';
    hot = false; poke.hidden = true; tap.hidden = true;
    if (n === 0) {
      task.textContent = 'Тяни жёлтый кружок на ручке внизу';
      sub.textContent = 'Ищи место, где точки закружат вместе';
      eraEl.textContent = '1964'; eraL.textContent = 'первый прибор, «молоток»';
    } else {
      task.textContent = 'Снова тяни кружок — теперь медленно';
      sub.textContent = 'У большого гиротрона нужное место другое и узкое';
      eraEl.textContent = 'ИТЭР'; eraL.textContent = 'гиротрон для реактора, наши дни';
    }
    hand.hidden = false; touched = false;
    wattEl.textContent = fmtW(0); wBox.classList.remove('hot');
  }

  function finish() {
    done = true; hand.hidden = true;
    if (lv === 0) {
      wattEl.textContent = '6 Вт';
      msg.innerHTML = '<p class="gr-why-did"><b>Что произошло.</b> Ты подобрал такую силу магнита, что все электроны закружили в такт — вместе, одной кучкой. Так они толкают луч все разом, как дети раскачивают качели, если толкают в такт. Это и называют резонансом.</p><b>6 ватт — как ночник.</b> Столько дал первый гиротрон, «молоток», в 1964 году. Его сделали в Горьком трое: Андрей Гапонов-Грехов, Михаил Петелин и Валентин Юлпатов.';
      next.textContent = 'Дальше: гиротрон для ИТЭР →';
    } else {
      wattEl.textContent = '1 000 000 Вт';
      msg.innerHTML = '<p class="gr-why-did"><b>Что произошло.</b> Ты снова поймал такт, только место было уже: чем мощнее прибор, тем точнее надо подобрать магнит.</p><b>1 000 000 ватт</b> — столько даёт один гиротрон для ИТЭР и держит так 1000 секунд. Мощность выросла не от ручки: сам прибор стал больше и сильнее, а такт по-прежнему нужно поймать. ИТЭР — международный термоядерный реактор во Франции; Россия сделала для него восемь гиротронов.';
      next.textContent = 'Финал: 8 лучей в реактор →';
    }
    task.textContent = 'Прочитай, что вышло, и нажми «' + (lv === 0 ? 'Дальше' : 'Финал') + '»';
    sub.textContent = 'Получилось! Ручку больше трогать не надо';
    tap.hidden = true;
    msg.hidden = false; next.hidden = false;
  }

  function startFinal() {
    mode = 'fin'; setStep(2); fin = { t: 0, on: false, end: false };
    knobBox.hidden = true; kname.hidden = true; read.hidden = true; msg.hidden = true; hand.hidden = true;
    termo.hidden = false; tfill.style.width = '0'; tempEl.textContent = '0'; sunL.classList.remove('past');
    task.textContent = 'Нажми кнопку «Включить 8 гиротронов»';
    schema.textContent = 'схема · бублик — реактор с плазмой, лучи — 8 гиротронов';
    sub.textContent = 'Кнопка — сразу под картинкой. Потом смотри на градусник ниже';
    next.textContent = 'Включить 8 гиротронов'; next.hidden = false;
  }

  next.addEventListener('click', function () {
    if (mode === 'play' && lv === 0) start(1);
    else if (mode === 'play') startFinal();
    else if (mode === 'fin' && !fin.on) {
      fin.on = true; next.hidden = true;
      task.textContent = 'Смотри на градусник';
      sub.textContent = 'Лучи греют плазму — газ, раскалённый до свечения…';
    }
  });

  // неверные действия: ткнул в картинку; ткнул в ручку вместо «тяни»
  var pokeT;
  $('.gr-stage').addEventListener('click', function () {
    if (mode !== 'play' || done) return;
    poke.hidden = false; clearTimeout(pokeT);
    pokeT = setTimeout(function () { poke.hidden = true; }, 3500);
  });
  var px = null, pv = 0, pMoved = false;
  range.addEventListener('pointerdown', function (e) { px = e.clientX; pv = +range.value; pMoved = false; });
  range.addEventListener('pointermove', function (e) { if (px !== null && Math.abs(e.clientX - px) > 8) pMoved = true; });
  range.addEventListener('pointerup', function () {
    if (px === null || mode !== 'play' || done) { px = null; return; }
    px = null;
    if (!pMoved && !hot) {
      tap.textContent = 'Ты ткнул — а нужно тянуть: прижми жёлтый кружок и веди его влево-вправо, не отрывая пальца';
      tap.hidden = false;
    }
  });
  $('.gr-again').addEventListener('click', function () { start(0); root.scrollIntoView({ behavior: 'smooth' }); });
  range.addEventListener('input', function () {
    if (!touched) { touched = true; hand.hidden = true; }
    if (pMoved) tap.hidden = true;
  });

  function resize() {
    var r = window.devicePixelRatio || 1, w = cv.clientWidth || 640;
    cv.width = Math.round(w * r); cv.height = Math.round(w * r * H / W);
    c.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  }
  window.addEventListener('resize', resize);

  function mix(a, b, k) { return Math.round(a + (b - a) * k); }

  function drawTube(v, dt) {
    var x0 = 70, x1 = 470, cy = 200, R = 72;
    // луч из трубки
    var L = LEVELS[lv], amp = bunch * L.beam * (lv === 1 ? 0.35 + 0.65 * prog : 1);
    if (amp > 0.01) {
      var len = (W - x1) * (lv === 0 ? 0.45 : 1);
      var g = c.createRadialGradient(x1, cy, 4, x1, cy, 40 + 110 * amp);
      g.addColorStop(0, 'rgba(255,220,140,' + (0.8 * amp) + ')'); g.addColorStop(1, 'rgba(255,180,80,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x1, cy, 40 + 110 * amp, 0, 7); c.fill();
      for (var b = 0; b < 3; b++) {
        c.beginPath();
        for (var x = 0; x <= len; x += 4) {
          var y = cy + (b - 1) * 14 * (0.4 + amp) + Math.sin(x * 0.12 - t * 14) * 7 * amp;
          if (x === 0) c.moveTo(x1 + x, y); else c.lineTo(x1 + x, y);
        }
        c.strokeStyle = 'rgba(255,' + mix(200, 240, amp) + ',140,' + (amp * (1 - b % 2 * 0.4)) + ')';
        c.lineWidth = 2 + 4 * amp; c.stroke();
      }
    }
    // стеклянная трубка
    c.fillStyle = 'rgba(120,170,220,.07)'; c.strokeStyle = 'rgba(150,190,230,.45)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x0, cy - R); c.lineTo(x1, cy - R); c.lineTo(x1, cy + R); c.lineTo(x0, cy + R); c.closePath(); c.fill(); c.stroke();
    // пушка электронов
    c.fillStyle = '#2a3646'; c.fillRect(30, cy - 40, 44, 80);
    c.fillStyle = 'rgba(127,200,255,.5)'; c.fillRect(70, cy - 30, 6, 60);
    // кольца магнита: ярче при сильном магните
    var om = 3 + 10 * v;
    [170, 370].forEach(function (mx) {
      c.lineWidth = 16; c.strokeStyle = 'rgba(' + mix(110, 230, v) + ',' + mix(70, 140, v) + ',40,' + (0.55 + 0.45 * v) + ')';
      c.shadowColor = '#ff9a3c'; c.shadowBlur = 24 * v;
      c.beginPath(); c.ellipse(mx, cy, 16, R + 22, 0, 0, 7); c.stroke(); c.shadowBlur = 0;
    });
    // электроны
    var G = 5, sp = 0.09;
    var col = 'rgb(' + mix(127, 255, bunch) + ',' + mix(200, 215, bunch) + ',' + mix(255, 110, bunch) + ')';
    el.forEach(function (e) {
      var c0 = (Math.floor(e.s0 * G) + 0.5) / G;
      var s = ((e.s0 + t * sp) % 1 + 1) % 1;
      var th = om * t + e.ph * (1 - 0.93 * bunch);
      var x = x0 + 14 + s * (x1 - x0 - 20), y = cy + R * 0.62 * Math.sin(th), d = Math.cos(th);
      c.globalAlpha = 0.45 + 0.55 * (d + 1) / 2;
      c.fillStyle = col; c.beginPath(); c.arc(x, y, 3.5 + 2.2 * (d + 1) / 2 + 1.5 * bunch, 0, 7); c.fill();
    });
    c.globalAlpha = 1;
  }

  function drawFinal(dt) {
    var cx = 320, cy = 215, f = 0;
    if (fin.on) fin.t += dt;
    var beamK = Math.min(1, fin.t / 1.2), heat = Math.max(0, Math.min(1, (fin.t - 1.2) / 5));
    f = heat * heat * (3 - 2 * heat);
    // корпус реактора — бублик
    c.lineWidth = 46; c.strokeStyle = '#2a3646';
    c.beginPath(); c.ellipse(cx, cy, 190, 82, 0, 0, 7); c.stroke();
    c.lineWidth = 22; c.strokeStyle = 'rgb(' + mix(60, 255, Math.min(1, f * 3)) + ',' + mix(40, 235, f) + ',' + mix(60, 255, f) + ')';
    c.shadowColor = f > 0.5 ? '#d8c8ff' : '#ff8a3c'; c.shadowBlur = 50 * f;
    c.globalAlpha = 0.25 + 0.75 * Math.min(1, f * 2 + 0.05 * beamK);
    c.beginPath(); c.ellipse(cx, cy, 190, 82, 0, 0, 7); c.stroke();
    c.shadowBlur = 0; c.globalAlpha = 1;
    // восемь лучей
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * Math.PI * 2 + 0.2, tx = cx + 190 * Math.cos(a), ty = cy + 82 * Math.sin(a);
      var sx = cx + 300 * Math.cos(a), sy = cy + 190 * Math.sin(a);
      var kk = Math.max(0, Math.min(1, beamK * 8 - k));
      if (kk <= 0) continue;
      c.strokeStyle = 'rgba(255,225,150,' + (0.9 * kk) + ')'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (tx - sx) * kk, sy + (ty - sy) * kk); c.stroke();
      c.fillStyle = '#4a5a6e'; c.beginPath(); c.arc(sx, sy, 9, 0, 7); c.fill();
    }
    var temp = 300e6 * f;
    tfill.style.width = (100 * f) + '%';
    tempEl.textContent = temp >= 1e6 ? Math.round(temp / 1e6) + ' млн' : '0';
    if (temp >= 15e6) sunL.classList.add('past');
    if (f >= 1 && !fin.end) {
      fin.end = true;
      tempEl.textContent = '300 млн';
      msg.innerHTML = '<b>300 млн °C — в 20 раз горячее ядра Солнца.</b> Лучи гиротронов помогут нагреть до такой жары плазму в реакторе ИТЭР. Из 24 его гиротронов восемь сделала Россия.';
      msg.hidden = false; task.textContent = 'Готово! Читай факты ниже'; sub.textContent = 'Горячее Солнца: градусник дошёл до 300 млн °C'; finale.hidden = false;
    }
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; t += dt;
    c.clearRect(0, 0, W, H); c.fillStyle = '#04070d'; c.fillRect(0, 0, W, H);
    if (mode === 'fin') drawFinal(dt);
    else {
      var v = range.value / 1000, L = LEVELS[lv];
      var k = Math.exp(-Math.pow((v - L.target) / L.w, 2));
      bunch += (k - bunch) * Math.min(1, dt * 3);
      if (!done) {
        if (bunch > 0.8) prog = Math.min(1, prog + dt / L.dur);
        else prog = Math.max(0, prog - dt * 0.06);
        var watt = lv === 0 ? 6 * prog : 6 * Math.pow(1e6 / 6, prog);
        wattEl.textContent = fmtW(lv === 0 ? watt : (prog > 0 ? watt : 6));
        wBox.classList.toggle('hot', bunch > 0.8);
        var wasHot = hot; hot = bunch > 0.8;
        if (hot && !wasHot) { task.textContent = 'Стоп! Оставь кружок на этом месте'; tap.hidden = true; }
        if (!hot && wasHot) task.textContent = lv === 0 ? 'Тяни жёлтый кружок на ручке внизу' : 'Снова тяни кружок — теперь медленно';
        sub.textContent = hot ? 'Есть такт: точки кружат вместе и бьют лучом. Не двигай ручку — мощность растёт'
          : bunch > 0.25 ? 'Теплее! Точки почти вместе. Ещё чуть ' + (v < L.target ? 'правее →' : '← левее')
          : lv === 0 ? 'Ищи место, где точки закружат вместе' : 'Нужное место узкое: веди кружок медленно';
        if (prog >= 1) finish();
      }
      drawTube(v, dt);
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  resize(); start(0);
  running = true; raf = requestAnimationFrame(frame);
})();
