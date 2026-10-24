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

/* Игра «Пробей карту и найди лекарство» (25 января, Семён Корсаков).
   Шаг 1 — перфокарта ткёт узор в станке Жаккара; шаг 2 — посетитель пробивает признаки;
   шаг 3 — двигает карту по таблице лекарств (наложение по образцу M-29).
   Р206: каждый шаг — одно нажатие на одну подсвеченную кнопку, ничего не идёт само по таймеру. */
(function () {
  'use strict';
  var root = document.querySelector('[data-korsakov-igra]');
  if (!root) return;

  var SYM = [
    { w: 'Жар', i: '🌡️' }, { w: 'Кашель', i: '😮‍💨' }, { w: 'Слабость', i: '😴' },
    { w: 'Насморк', i: '🤧' }, { w: 'Сыпь', i: '🔴' }
  ];
  var NEED = [0, 1, 2];
  var ROWS = [[0, 3], [1], [3, 4], [0, 1, 2], [0, 1, 4]];
  var MATCH = 3;
  /* Узор карты станка: 8 столбцов × 6 рядов, 1 — дырка (нитка поднята) */
  var LOOM = [
    '10011001', '01100110', '00111100', '00111100', '01100110', '10011001'
  ];

  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || root).querySelectorAll(s)); };
  var task = $('.ko-task'), sub = $('.ko-sub');
  var punched = [];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var loomCard = $('.ko-card-loom'), nextBtn = $('.ko-next'), kCard = $('.ko-s2 .ko-card-k');
  var toTable = $('.ko-to-table'), downBtn = $('.ko-down'), answerBtn = $('.ko-answer');
  var cells = SYM.map(function (s, k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ko-cell';
    b.setAttribute('aria-label', 'Пробить: ' + s.w);
    b.addEventListener('click', function () { otklik(); punch(k, b); });
    kCard.appendChild(b);
    return b;
  });
  var knopki = [loomCard, nextBtn].concat(cells, [toTable, downBtn, answerBtn]);

  /* Р206: на шаге одна активная пульсирующая кнопка + рука «тап-тап»; остальные приглушены (общий компонент igraRuka) */
  var ruka = igraRuka(root), tekAktiv = null;
  function aktiv(btn) {
    tekAktiv = btn || null;
    knopki.forEach(function (b) { b.setAttribute('aria-disabled', b === btn ? 'false' : 'true'); });
    if (btn) ruka.na(btn); else ruka.ubrat();
  }
  // нажатие не на мигающую кнопку не ломает игру — только подсказка
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || knopki.indexOf(b) < 0 || b === tekAktiv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (tekAktiv) sub.textContent = 'Жми мигающую кнопку';
  }, true);
  function otklik() { try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) { /* нет вибро */ } }


  function say(t, s) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; sub.textContent = s || ''; }
  function step(n) {
    root.setAttribute('data-step', n);
    $$('.ko-steps li').forEach(function (li, k) { li.classList.toggle('on', k < n); });
  }
  function show(sel) {
    ['.ko-s1', '.ko-s2', '.ko-s3', '.ko-finale'].forEach(function (s) { $(s).hidden = s !== sel; });
    $('.ko-pravila').hidden = sel === '.ko-finale';
  }

  /* ---------- Шаг 1: станок ---------- */
  var holes = $('.ko-holes', loomCard);
  LOOM.forEach(function (row) {
    row.split('').forEach(function (c) {
      var d = document.createElement('i');
      if (c === '1') d.className = 'h';
      holes.appendChild(d);
    });
  });
  var cloth = $('.ko-cloth'), ctx = cloth.getContext('2d');
  function clearCloth() {
    ctx.fillStyle = '#2a1a14'; ctx.fillRect(0, 0, cloth.width, cloth.height);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for (var x = 0; x < cloth.width; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cloth.height); ctx.stroke(); }
  }
  function weave(done) {
    var cols = 24, rows = 12, cw = cloth.width / cols, ch = cloth.height / rows, r = 0;
    function row() {
      for (var c = 0; c < cols; c++) {
        var on = LOOM[r % 6][c % 8] === '1';
        ctx.fillStyle = on ? '#e4b84c' : '#8c2b2b';
        ctx.fillRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
      }
      r++;
      if (r < rows) setTimeout(row, reduce ? 0 : 70); else done();
    }
    row();
  }
  function start() {
    step(1); show('.ko-s1');
    loomCard.classList.remove('in'); loomCard.hidden = false; clearCloth();
    $('.ko-cap').hidden = true; nextBtn.hidden = true;
    say('нажми на перфокарту', 'Карточка с дырками светится под станком');
    aktiv(loomCard);
  }
  loomCard.addEventListener('click', function () {
    otklik();
    if (loomCard.classList.contains('in')) return;
    aktiv(null);
    loomCard.classList.add('in');
    say('смотри, как ткёт станок', 'Где в карте дырка — там нитка поднялась');
    /* анимация результата нажатия; дальше игра ждёт следующего нажатия */
    setTimeout(function () {
      loomCard.hidden = true;
      weave(function () {
        $('.ko-cap').hidden = false;
        nextBtn.hidden = false;
        say('нажми кнопку «Дальше»', 'Узор готов! Дырки в карте выбрали, какие нитки поднять');
        aktiv(nextBtn);
      });
    }, reduce ? 0 : 450);
  });
  nextBtn.addEventListener('click', function () { otklik(); startPunch(); });

  /* ---------- Шаг 2: пробить ---------- */
  function buildCols(box) {
    box.innerHTML = '';
    SYM.forEach(function (s) {
      var d = document.createElement('span');
      d.innerHTML = '<b>' + s.i + '</b>' + s.w;
      box.appendChild(d);
    });
  }
  $$('.ko-cols').forEach(buildCols);
  var oops = $('.ko-oops');
  function nextHole() {
    var k = NEED[punched.length];
    say('пробей дырку «' + SYM[k].w + '»', 'Нажми на светящийся кружок под словом «' + SYM[k].w + '»');
    aktiv(cells[k]);
  }
  function startPunch() {
    step(2); show('.ko-s2');
    toTable.hidden = true;
    oops.textContent = 'Та же карта — но теперь в ней будут сведения о больном';
    nextHole();
  }
  function punch(k, b) {
    if (punched.indexOf(k) > -1 || NEED.indexOf(k) < 0) return;
    punched.push(k);
    b.classList.add('h'); b.setAttribute('aria-label', 'Пробито: ' + SYM[k].w);
    var left = NEED.length - punched.length;
    if (left) {
      oops.textContent = 'Пробито: ' + SYM[k].w.toLowerCase() + '. Ещё ' + (left === 1 ? 'одна дырка' : left + ' дырки');
      nextHole();
    } else {
      oops.textContent = 'Карта больного готова! Теперь — к таблице лекарств';
      toTable.hidden = false;
      say('нажми «К таблице лекарств»', 'Там карта сама покажет, какое лекарство подходит');
      aktiv(toTable);
    }
  }
  toTable.addEventListener('click', function () { otklik(); startSlide(); });

  /* ---------- Шаг 3: сдвигать карту по таблице ---------- */
  var rowsBox = $('.ko-rows'), slider = $('.ko-slider'), verdict = $('.ko-verdict');
  var pos = -1, found = false;
  var park = document.createElement('div');
  park.className = 'ko-park';
  rowsBox.appendChild(park);
  ROWS.forEach(function (pins, r) {
    var row = document.createElement('div');
    row.className = 'ko-row';
    var html = '<span class="ko-med">💊 №&nbsp;' + (r + 1) + '</span>';
    for (var k = 0; k < SYM.length; k++) html += '<span class="ko-pin' + (pins.indexOf(k) > -1 ? ' p' : '') + '"></span>';
    row.innerHTML = html;
    rowsBox.appendChild(row);
  });
  SYM.forEach(function () { var c = document.createElement('span'); c.className = 'ko-cell'; slider.appendChild(c); });

  function rowH() { return park.getBoundingClientRect().height; }
  function setY(y) { slider.style.transform = 'translateY(' + y + 'px)'; }
  function judge(r) {
    var pins = r < 0 ? [] : ROWS[r], sc = $$('.ko-cell', slider), hit = 0, empty = 0;
    sc.forEach(function (c, k) {
      var h = punched.indexOf(k) > -1, p = pins.indexOf(k) > -1;
      c.className = 'ko-cell' + (h ? ' h' : '') + (h && p ? ' in' : '') + (!h && p ? ' hit' : '') + (h && !p && r >= 0 ? ' empty' : '');
      if (!h && p) hit++;
      if (h && !p && r >= 0) empty++;
    });
    $$('.ko-row').forEach(function (el, k) { el.classList.toggle('cur', k === r); el.classList.toggle('ok', k === r && !hit && !empty); });
    var miss = function (want) { return SYM.filter(function (s, k) { return (punched.indexOf(k) > -1) !== want && pins.indexOf(k) > -1 === want; }).map(function (s) { return s.w.toLowerCase(); }).join(', '); };
    return { hit: hit, empty: empty, hitW: miss(true), emptyW: miss(false) };
  }
  function place(r) {
    pos = r;
    setY((pos + 1) * rowH());
    var j = judge(pos);
    if (pos < 0) return;
    if (!j.hit && !j.empty) { win(); return; }
    verdict.innerHTML = '<b>№ ' + (pos + 1) + ' не подходит:</b> ' + (j.hit
      ? '<span class="ko-x">✕</span> шип «' + j.hitW + '» упёрся в карту — у больного этого нет'
      : '<span class="ko-o"></span> ' + (j.empty > 1 ? 'дырки «' + j.emptyW + '» пустые — это лекарство их не лечит' : 'дырка «' + j.emptyW + '» пустая — это лекарство её не лечит')) + '. Сдвигай ниже';
    say('нажми «Сдвинь ниже»', 'Карта опустится на строку № ' + (pos + 2));
    aktiv(downBtn);
  }
  function win() {
    found = true;
    verdict.textContent = 'Все шипы прошли в дырки — лекарство № ' + (MATCH + 1) + ' найдено!';
    downBtn.hidden = true; answerBtn.hidden = false;
    say('нажми «Узнать ответ»', 'Нашлось! Строка загорелась зелёным');
    aktiv(answerBtn);
  }
  function startSlide() {
    step(3); show('.ko-s3');
    found = false; downBtn.hidden = false; answerBtn.hidden = true;
    verdict.textContent = 'Золотые шипы в строке — что лечит лекарство. Нужно, чтобы шипы встали точно во все дырки';
    place(-1);
    say('нажми «Сдвинь ниже»', 'Карта опустится на строку № 1');
    aktiv(downBtn);
  }
  downBtn.addEventListener('click', function () {
    otklik();
    if (found || pos >= ROWS.length - 1) return;
    place(pos + 1);
  });
  answerBtn.addEventListener('click', function () { otklik(); finale(); });
  window.addEventListener('resize', function () { if (!$('.ko-s3').hidden) setY((pos + 1) * rowH()); });

  /* ---------- Финал ---------- */
  var finCard = $('.ko-card-fin');
  function finale() {
    aktiv(null);
    show('.ko-finale');
    say('прочитай, что придумал Корсаков', 'Карта нашла ответ. Сыграть снова — кнопка «Сыграть ещё раз» внизу');
    finCard.innerHTML = '';
    SYM.forEach(function (s, k) { var c = document.createElement('span'); c.className = 'ko-cell' + (punched.indexOf(k) > -1 ? ' h' : ''); finCard.appendChild(c); });
    var st = $('.ko-stamp'); st.classList.remove('hit'); void st.offsetWidth; st.classList.add('hit');
    $('.ko-fin-card').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $('.ko-again').addEventListener('click', function () {
    otklik();
    punched = []; found = false; pos = -1;
    cells.forEach(function (b, k) { b.className = 'ko-cell'; b.setAttribute('aria-label', 'Пробить: ' + SYM[k].w); });
    verdict.textContent = '';
    start();
    root.scrollIntoView({ block: 'start' });
  });

  start();
}());
