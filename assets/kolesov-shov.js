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

/* ── Игра 7 января: «Сшей обходной путь на бьющемся сердце» (Колесов, 25.02.1964) ──
   Сюжет — как на странице дня: пережать артерию → 8 «минут» ЭКГ (8 секунд, ритм ровный) →
   8 стежков на бьющемся сердце → кровь идёт в обход сужения → финал с фактами.
   Управление (Р206): только одиночные нажатия. Шаг 1 — «Пережать артерию» (1 нажатие),
   ЭКГ идёт сама; шаг 2 — «Стежок» (8 нажатий, каждое — стежок в мигающей точке на сердце).
   Точки качаются с пульсом, игла попадает сама — целиться не нужно. Итого 9 нажатий. */
(function () {
  var root = document.querySelector('[data-kolesov-igra]');
  if (!root) return;
  var ruka = igraRuka(root);
  var $ = function (s) { return root.querySelector(s); };
  var bClamp = $('.ks-clamp'), bStitch = $('.ks-stitch'), bAgain = $('.ks-again');
  var task = $('.igra-seychas .ks-task-t'), sub = $('.ks-sub');
  var ekgTxt = $('.ks-ekg-t'), shovTxt = $('.ks-shov-t'), stitchN = $('.ks-stitch small');
  var steps = root.querySelectorAll('.ks-steps li'), finale = $('.ks-finale');
  var N = 8;

  function seychas(t) { task.textContent = t; }
  function msg(t, ok) { sub.textContent = t; sub.classList.toggle('ok', !!ok); }
  function shag(i) {
    for (var k = 0; k < steps.length; k++) {
      steps[k].classList.toggle('on', k === i);
      steps[k].classList.toggle('ok', k < i);
    }
  }
  function vkl(b, on) { b.classList.toggle('ks-off', !on); }

  /* холсты: рисуем в координатах 300×300, сам холст 600×600 — чётко на телефоне */
  function hold(cv) { var c = cv.getContext('2d'); c.setTransform(cv.width / 300, 0, 0, cv.height / 300, 0, 0); return c; }
  var ekg = $('.ks-ekg'), ec = hold(ekg), cv = $('.ks-heart'), c = hold(cv);
  var W = 300, H = 300;

  var state, clampT, done, flow, lastStitch, timer, t0 = performance.now();
  function nachalo() {
    state = 'clamp'; clampT = -1; done = []; flow = false; lastStitch = { i: -1, t: 0 };
    clearTimeout(timer);
    ekgTxt.textContent = 'артерия не пережата'; shovTxt.textContent = 'ждёт проверки ЭКГ';
    bClamp.firstChild.nodeValue = 'Пережать артерию'; bClamp.lastChild.textContent = 'и смотреть ЭКГ'; stitchN.textContent = '0 из ' + N;
    vkl(bClamp, true); vkl(bStitch, false);
    finale.hidden = true; bAgain.hidden = true;
    shag(0);
    seychas('Нажми «Пережать артерию»');
    msg('Сначала артерию сердца зажимают и смотрят ЭКГ: выдержит ли сердце.');
    ruka.na(bClamp);
  }

  /* ── ЭКГ ── восемь «минут» пережатия = восемь секунд; ритм ровный: сердце выдержало (протокол 1964). */
  function ekgDraw(t) {
    ec.fillStyle = '#0b1a12'; ec.fillRect(0, 0, W, H);
    ec.strokeStyle = 'rgba(80,160,110,.25)'; ec.lineWidth = 1;
    for (var x = 0; x < W; x += 20) { ec.beginPath(); ec.moveTo(x, 0); ec.lineTo(x, H); ec.stroke(); }
    for (var y = 0; y < H; y += 20) { ec.beginPath(); ec.moveTo(0, y); ec.lineTo(W, y); ec.stroke(); }
    ec.strokeStyle = '#5fe08a'; ec.lineWidth = 2; ec.beginPath();
    for (var i = 0; i <= W; i++) {
      var ph = ((i + t * 120) % 75) / 75, v = 0;
      if (ph > .30 && ph < .34) v = -8; else if (ph > .36 && ph < .39) v = 70 * (1 - Math.abs(ph - .375) / .015); else if (ph > .39 && ph < .42) v = -14; else if (ph > .55 && ph < .68) v = 12 * Math.sin((ph - .55) / .13 * Math.PI);
      var yy = H / 2 - v; if (i === 0) ec.moveTo(i, yy); else ec.lineTo(i, yy);
    }
    ec.stroke();
    if (clampT >= 0) {
      var p = state === 'ekg' ? Math.min(1, (performance.now() - clampT) / 8000) : 1;
      ec.fillStyle = 'rgba(0,0,0,.45)'; ec.fillRect(0, H - 22, W, 22);
      ec.fillStyle = state === 'ekg' ? '#e4c97a' : '#5fe08a'; ec.fillRect(0, H - 22, W * p, 4);
      ec.fillStyle = '#d8f5e2'; ec.font = '13px sans-serif';
      ec.fillText(state === 'ekg' ? 'зажим · минута ' + Math.min(8, Math.floor(p * 8) + 1) + ' из 8' : 'зажим · 8 минут, ритм ровный', 8, H - 6);
    }
  }

  /* ── СЕРДЦЕ ── точки шва вокруг места соединения ниже сужения качаются с пульсом. */
  var J = { x: 112, y: 200 };
  function beat(t) { return 1 + 0.035 * Math.max(0, Math.sin(t * 7.5)); }
  function pts(t) {
    var k = beat(t), r = [], i;
    for (i = 0; i < N; i++) { var a = i / N * Math.PI * 2; r.push({ x: 150 + (J.x + Math.cos(a) * 15 - 150) * k, y: 170 + (J.y + Math.sin(a) * 15 - 170) * k }); }
    return r;
  }
  function heart(t, now) {
    var k = beat(t);
    c.fillStyle = '#f3ecd9'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(150, 170); c.scale(k, k); c.translate(-150, -170);
    c.fillStyle = '#b5473a'; c.beginPath(); c.ellipse(150, 180, 95, 100, -0.35, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e9c7a8'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(165, 85); c.quadraticCurveTo(110, 120, 105, 175); c.quadraticCurveTo(100, 230, 130, 265); c.stroke();
    c.strokeStyle = '#5a2a24'; c.lineWidth = 9; c.beginPath(); c.moveTo(116, 140); c.lineTo(110, 158); c.stroke();
    c.restore();
    /* зажим на артерии сердца выше места шва — пока идёт пережатие и шов */
    if (clampT >= 0 && !flow) {
      c.save(); c.translate(150, 170); c.scale(k, k); c.translate(-150, -170);
      c.strokeStyle = '#46505c'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(88, 176); c.lineTo(124, 182); c.stroke();
      c.beginPath(); c.moveTo(88, 184); c.lineTo(124, 176); c.stroke();
      c.restore();
    }
    c.strokeStyle = '#d9543f'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 20); c.quadraticCurveTo(70, 90, J.x - 2, J.y - 14); c.stroke();
    c.fillStyle = '#333'; c.font = '12px sans-serif'; c.fillText('грудная артерия', 8, 14); c.fillText('сужение', 150, 148);
    var P = pts(t), next = done.indexOf(false) < 0 ? done.length : done.indexOf(false);
    /* нить шва — через наложенные стежки по порядку */
    if (done.length) {
      c.strokeStyle = '#1d1d1d'; c.lineWidth = 1.5; c.beginPath();
      for (var j = 0; j < done.length; j++) { if (j === 0) c.moveTo(P[j].x, P[j].y); else c.lineTo(P[j].x, P[j].y); }
      if (done.length === N) c.closePath();
      c.stroke();
    }
    P.forEach(function (p, i) {
      c.beginPath(); c.arc(p.x, p.y, done[i] ? 3 : 6, 0, Math.PI * 2);
      c.fillStyle = done[i] ? '#1d1d1d' : 'rgba(201,168,76,.95)'; c.fill();
      if (!done[i] && state === 'shov') { c.strokeStyle = '#7a5a10'; c.lineWidth = 1.5; c.stroke(); }
    });
    /* следующая точка — мигает кольцом: сюда ляжет стежок */
    if (state === 'shov' && next < N) {
      var q = P[next], f = (now / 700) % 1;
      c.strokeStyle = 'rgba(30,110,200,' + (1 - f) + ')'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(q.x, q.y, 8 + f * 10, 0, Math.PI * 2); c.stroke();
    }
    /* игла — короткая дуга над только что наложенным стежком */
    if (lastStitch.i >= 0 && now - lastStitch.t < 450) {
      var s = P[lastStitch.i], a = 1 - (now - lastStitch.t) / 450;
      c.strokeStyle = 'rgba(120,130,140,' + a + ')'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(s.x, s.y - 4, 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    }
    if (flow) {
      c.fillStyle = '#ff2d2d';
      for (var d = 0; d < 6; d++) {
        var u = ((t * 0.6) + d / 6) % 1, x = (1 - u) * (1 - u) * 20 + 2 * (1 - u) * u * 70 + u * u * (J.x - 2), y = (1 - u) * (1 - u) * 20 + 2 * (1 - u) * u * 90 + u * u * (J.y - 14);
        c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
      }
    }
    /* лупа: Колесов шил «под контролем лупы» — место шва крупно, в круге справа вверху */
    var sx = cv.width / W, L = { x: 240, y: 60, r: 54 }, z = 2, half = L.r / z;
    c.save(); c.beginPath(); c.arc(L.x, L.y, L.r, 0, Math.PI * 2); c.closePath(); c.clip();
    c.drawImage(cv, (J.x - half) * sx, (J.y - half) * sx, 2 * half * sx, 2 * half * sx, L.x - L.r, L.y - L.r, 2 * L.r, 2 * L.r);
    c.restore();
    c.strokeStyle = '#2b3642'; c.lineWidth = 4; c.beginPath(); c.arc(L.x, L.y, L.r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(43,54,66,.45)'; c.lineWidth = 1.5; c.beginPath(); c.arc(J.x, J.y, half, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#333'; c.font = '12px sans-serif'; c.fillText('лупа', L.x - L.r - 32, L.y + 4);
  }

  function loop(now) {
    var t = (now - t0) / 1000;
    if (state === 'ekg') {
      var m = Math.min(8, Math.floor((now - clampT) / 1000) + 1);
      ekgTxt.textContent = 'пережатие, минута ' + m + ' из 8';
      if (now - clampT >= 8000) gotovoEkg();
    }
    ekgDraw(t); heart(t, now);
    requestAnimationFrame(loop);
  }

  function gotovoEkg() {
    state = 'shov'; shag(1);
    ekgTxt.textContent = '8 минут, ритм ровный'; bClamp.lastChild.textContent = 'ЭКГ: ритм ровный';
    shovTxt.textContent = 'стежков 0 из ' + N;
    vkl(bStitch, true);
    seychas('Нажми «Стежок»');
    msg('Сердце выдержало. Вскрывай артерию и шей: одно нажатие — один стежок в мигающей точке.', true);
    ruka.na(bStitch);
  }

  bClamp.addEventListener('click', function () {
    if (state !== 'clamp') { podskazka(); return; }
    state = 'ekg'; clampT = performance.now();
    bClamp.firstChild.nodeValue = 'Артерия пережата'; bClamp.lastChild.textContent = 'идёт ЭКГ'; vkl(bClamp, false);
    ruka.ubrat();
    ekgTxt.textContent = 'пережатие, минута 1 из 8';
    seychas('Смотри на кардиограмму: 8 секунд');
    msg('Артерия пережата. Если ритм собьётся, вскрывать нельзя.');
  });

  bStitch.addEventListener('click', function () {
    if (state !== 'shov') { podskazka(); return; }
    done.push(true); var n = done.length;
    lastStitch = { i: n - 1, t: performance.now() };
    stitchN.textContent = n + ' из ' + N; shovTxt.textContent = 'стежков ' + n + ' из ' + N;
    if (n < N) {
      seychas('Нажми «Стежок» ещё раз');
      msg('Стежок наложен. Осталось ' + (N - n) + '.');
      return;
    }
    state = 'final'; flow = true; shag(2); steps[2].classList.add('ok');
    vkl(bStitch, false); ruka.ubrat();
    shovTxt.textContent = 'шов готов, кровь идёт в обход';
    seychas('Операция удалась');
    msg('Кровь пошла по грудной артерии в обход сужения.', true);
    timer = setTimeout(function () {
      finale.hidden = false; bAgain.hidden = false;
      finale.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1800);
  });

  function podskazka() {
    if (state === 'ekg') msg('Подожди: идёт проверка ЭКГ. Потом замигает «Стежок».');
    else if (state === 'final') msg('Операция уже закончена. Ниже — факты о Колесове.');
    else msg('Жми мигающую кнопку — над ней рука.');
  }
  /* нажатие мимо кнопок (на картинки) — подсказка, игра не ломается */
  root.querySelector('.ks-stage').addEventListener('click', function () {
    if (state === 'clamp' || state === 'shov') msg('Жми мигающую кнопку «' + (state === 'clamp' ? 'Пережать артерию' : 'Стежок') + '».');
    else podskazka();
  });

  bAgain.addEventListener('click', function () {
    nachalo();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  nachalo();
  requestAnimationFrame(loop);
})();
