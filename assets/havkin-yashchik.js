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


/* Игра «Неси ящик с вакциной» (28 января, Хавкин). Только простые нажатия (Р206).
   Шаг 1 — ящик к двери «Россия» (закрыто), потом в Индию: 2 нажатия.
   Шаг 2 — мигает одна деревня, нажатие — флакон летит туда: 4 нажатия; волна холеры сама.
   Шаг 3 — «Дальше» и 3 нажатия по ящику: годы бегут к 1909, 1925, 1940. */
(function () {
  var root = document.querySelector('[data-havkin-igra]');
  if (!root) return;
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ruka = igraRuka(root);

  var task = $('.hv-task'), sub = $('.hv-sub'), steps = $$('.hv-steps li');
  function say(t, s) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; if (s !== undefined) sub.textContent = s; }
  function step(n) { steps.forEach(function (li, i) { li.classList.toggle('on', i === n - 1); }); }
  function at(el) {
    var r = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  }
  // Активная кнопка шага: пульсирует, над ней рука; если ушла за край экрана — подкрутить
  var cel = null;
  function aktiv(el) {
    cel = el; ruka.na(el);
    var r = el.getBoundingClientRect();
    if (r.top < 8 || r.bottom > window.innerHeight - 8) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
  function zhdat() { cel = null; ruka.ubrat(); }
  // Нажатие мимо мигающей кнопки — игру не ломает, только подсказка
  root.addEventListener('click', function (e) {
    if (!cel || cel.contains(e.target)) return;
    if (!e.target.closest('.hv-scene, .hv-head')) return;
    sub.textContent = 'Жми мигающую кнопку — над ней рука.';
  });

  /* ---------- Шаг 1 ---------- */
  var ru = $('.hv-s1 .hv-door-ru'), ind = $('.hv-s1 .hv-door-in'), crate1 = $('.hv-crate-s1'), cap = $('.hv-cap');
  var phase = 'home';
  function moveCrate(door) {
    var a = at(crate1), d = at(door);
    crate1.style.transform = 'translate(' + (d.x - a.x) * 0.8 + 'px,' + (d.y - a.y + 40) * 0.8 + 'px) scale(.7)';
  }
  function goHome() {
    phase = 'busy'; zhdat();
    say('Смотри на дверь «Россия»', 'Ящик едет домой, в Россию…');
    moveCrate(ru);
    setTimeout(function () {
      ru.classList.add('shut');
      ru.querySelector('small').textContent = '«не нужна»';
      cap.hidden = false;
      cap.textContent = '1892. Хавкин из Одессы предложил дома свою прививку от холеры. Ответ: «не нужна». Дверь закрыта.';
    }, reduce ? 0 : 700);
    setTimeout(function () {
      crate1.style.transform = '';
      ind.classList.add('glow');
      say('Нажми на ящик ещё раз', 'Дома дверь закрылась: прививку назвали «не нужна». Открыта дверь в Индию.');
      phase = 'india';
      setTimeout(function () { aktiv(crate1); }, reduce ? 0 : 650);
    }, reduce ? 300 : 1900);
  }
  function goIndia() {
    phase = 'busy'; zhdat();
    say('Смотри на дверь «Индия»', 'Ящик едет в Индию…');
    moveCrate(ind);
    setTimeout(function () { ind.classList.add('open'); }, reduce ? 0 : 600);
    setTimeout(startMap, reduce ? 300 : 1800);
  }
  crate1.addEventListener('click', function () { if (phase === 'home') goHome(); else if (phase === 'india') goIndia(); });

  /* ---------- Карта ---------- */
  // Схема Индии (долгота, широта) → координаты 310×310: x=(lon-67)·10, y=(38-lat)·10
  var LL = [[74.5,37],[78,35.5],[79,32.5],[81,30],[84,28],[88,27.5],[92,27],[96,28.2],[97,27.3],[95,25.5],[93,23],[91.5,22],
    [89,21.6],[87,21.5],[86,20],[84,18.5],[82,17],[80.2,15.5],[80,13],[79.8,10.5],[78,8.5],[77,8],[76,9.5],[75,12.5],[74,14.5],
    [73,17],[72.8,19],[72.6,21],[70,21],[69,22.5],[68.5,23.5],[70.5,25],[70,27],[71.5,28],[73.5,30],[74.5,32],[74,34.5]];
  var POLY = LL.map(function (p) { return [(p[0] - 67) * 10, (38 - p[1]) * 10]; });
  var pts = POLY.map(function (p) { return p.join(','); }).join(' ');
  $('.hv-land').setAttribute('points', pts); $('.hv-clip').setAttribute('points', pts);
  var VILS = [[74.5,29],[80,28],[85,25.5],[88,22.8],[73.5,23.5],[79,24],[76,19],[81,19.5]].map(function (p) {
    return { x: (p[0] - 67) * 10, y: (38 - p[1]) * 10 };
  });
  var vilBox = $('.hv-vils'), map = $('.hv-map');
  VILS.forEach(function (v, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hv-vil';
    b.style.left = (v.x / 3.1) + '%'; b.style.top = (v.y / 3.1) + '%';
    b.setAttribute('aria-label', 'Деревня ' + (i + 1) + ': привить');
    var l = document.createElement('span'); l.className = 'hv-lights';
    for (var k = 0; k < 10; k++) l.appendChild(document.createElement('i'));
    b.appendChild(l); vilBox.appendChild(b);
    v.el = b;
  });

  /* ---------- Шаг 2: флаконы в деревни ---------- */
  var crate2 = $('.hv-crate-s2'), vials = $$('.hv-vial', crate2), vaccinated = 0, s2phase = 'off';
  var PORYADOK = [5, 0, 6, 3]; // какие деревни мигают, по очереди
  VILS.forEach(function (v) { v.el.tabIndex = -1; });

  function startMap() {
    $('.hv-s1').hidden = true; $('.hv-s2').hidden = false; step(2);
    say('Нажми на мигающую деревню', 'Ящик доехал до Индии. Деревня — кружок с огоньками, один огонёк — один житель. Флаконов 4.');
    s2phase = 'vac';
    root.scrollIntoView({ block: 'start', behavior: 'auto' });
    setTimeout(function () { aktiv(VILS[PORYADOK[0]].el); }, 300);
  }
  function nextVial() { for (var i = 0; i < vials.length; i++) if (!vials[i].classList.contains('used')) return vials[i]; return null; }
  function letit(vial, v, gotovo) {
    var a = at(vial), t = at(v.el);
    var g = vial.cloneNode(); g.className = 'hv-vial hv-let'; root.appendChild(g);
    g.style.left = (a.x - 11) + 'px'; g.style.top = (a.y - 27) + 'px';
    vial.classList.add('used');
    if (reduce || !g.animate) { g.remove(); gotovo(); return; }
    var dx = t.x - a.x, dy = t.y - a.y;
    g.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)' },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 70) + 'px) scale(1.15) rotate(-20deg)', offset: .5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.5) rotate(0)', opacity: .2 }
    ], { duration: 750, easing: 'ease-in-out' }).onfinish = function () { g.remove(); gotovo(); };
  }
  function vaccinate(v) {
    if (s2phase !== 'vac' || cel !== v.el) return;
    var vial = nextVial(); if (!vial) return;
    zhdat(); vaccinated++;
    var left = 4 - vaccinated;
    say(left > 0 ? 'Смотри, летит флакон' : 'Смотри, как идёт холера', 'Флакон летит в деревню…');
    letit(vial, v, function () {
      v.el.classList.add('vac'); v.vac = true;
      v.el.setAttribute('aria-label', 'Деревня привита');
      if (left > 0) {
        say('Нажми на мигающую деревню', 'Деревня привита — она стала зелёной. Осталось флаконов: ' + left);
        setTimeout(function () { aktiv(VILS[PORYADOK[vaccinated]].el); }, reduce ? 0 : 250);
      } else {
        s2phase = 'wave';
        say('Смотри, как идёт холера', 'Флаконы кончились. Огонёк гаснет — холера унесла жителя');
        setTimeout(wave, 900);
      }
    });
  }
  VILS.forEach(function (v) { v.el.addEventListener('click', function () { vaccinate(v); }); });

  // Волна холеры: слева направо, на привитых гаснет в 10 раз меньше огоньков (10 из 40 против 1 из 40)
  function wave() {
    var un = VILS.filter(function (v) { return !v.vac; }), va = VILS.filter(function (v) { return v.vac; });
    var byX = function (a, b) { return a.x - b.x; };
    un.sort(byX).forEach(function (v, i) { v.loss = [3, 2, 3, 2][i] || 0; });
    va.sort(byX).forEach(function (v, i) { v.loss = i === 1 ? 1 : 0; });
    VILS.forEach(function (v) { v.hit = false; });
    var rect = $('.hv-wave'); rect.classList.add('go');
    var t0 = null, dur = reduce ? 600 : 4200;
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), x = -90 + k * 400;
      rect.setAttribute('x', x);
      VILS.forEach(function (v) {
        if (!v.hit && x + 45 >= v.x) {
          v.hit = true;
          var lights = $$('i', v.el), idx = [7, 2, 5, 0, 9];
          for (var j = 0; j < v.loss; j++) lights[idx[j]].classList.add('out');
        }
      });
      if (k < 1) requestAnimationFrame(frame); else { rect.classList.remove('go'); s2phase = 'result'; setTimeout(result, 500); }
    }
    requestAnimationFrame(frame);
  }
  function row(el, out) {
    for (var i = 0; i < 40; i++) { var d = document.createElement('i'); if (i >= 40 - out) d.className = 'out'; el.appendChild(d); }
  }
  function row(el, out) {
    for (var i = 0; i < 40; i++) { var d = document.createElement('i'); if (i >= 40 - out) d.className = 'out'; el.appendChild(d); }
  }
  function result() {
    row($('.lt-u'), 10); row($('.lt-v'), 1);
    say('Нажми «Дальше» внизу', 'Привитые деревни почти все горят. Без прививки погас каждый 4-й огонёк, с прививкой — 1 из 40');
    $('.hv-result').hidden = false; $('.hv-crate-s2').parentNode.hidden = true;
    aktiv($('.hv-next'));
  }

  /* ---------- Шаг 3: чума, три нажатия по ящику ---------- */
  var p = 0, done = false, busy = false, etap = 0;
  var CELI = [(1909 - 1897) / 43, (1925 - 1897) / 43, 1];
  var DOTS = (function () {
    var s = 7, out = [];
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    function inside(x, y) {
      var c = false;
      for (var i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
        var a = POLY[i], b = POLY[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    }
    while (out.length < 320) { var x = rnd() * 310, y = rnd() * 310; if (inside(x, y)) out.push([x, y]); }
    return out;
  })();
  var dotsG = $('.hv-dots'), shown = 0, NS = 'http://www.w3.org/2000/svg';
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function doses(pp) {
    var year = 1897 + pp * 43;
    var d = year <= 1909 ? (year - 1897) / 12 * 8e6 : 8e6 + (year - 1909) / 31 * 27e6;
    return Math.round(d / 1000) * 1000;
  }
  function draw() {
    var year = Math.floor(1897 + p * 43 + 1e-6);
    $('.hv-year').textContent = year;
    $('.hv-doses').textContent = p >= 1 ? '35 000 000' : fmt(doses(p));
    $('.hv-bar span').style.width = (p * 100) + '%';
    var want = Math.round(p * DOTS.length);
    while (shown < want) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', DOTS[shown][0].toFixed(1)); c.setAttribute('cy', DOTS[shown][1].toFixed(1)); c.setAttribute('r', 2.6);
      dotsG.appendChild(c); shown++;
    }
    VILS.forEach(function (v, i) { if (p > (i + 1) / 9) v.el.classList.add('vac'); });
    if (p < .12) sub.textContent = '1897: сначала Хавкин привил себя — дозой в 10 раз больше';
    else if (year < 1909) sub.textContent = 'В тех, кто прививал, летели камни.';
    else if (p < 1) sub.textContent = year < 1925 ? '1909: уже 8 миллионов.' : 'Бомбейская лаборатория — теперь Институт Хавкина';
    else sub.textContent = '1940: 35 миллионов прививок';
  }
  var ZADANIE = ['Нажми на ящик — до 1909', 'Нажми на ящик — до 1925', 'Нажми на ящик — до 1940'];
  function godyBegut() {
    if (s2phase !== 'plague' || busy || done || cel !== crate2) return;
    busy = true; zhdat();
    say('Смотри, бегут годы');
    var ot = p, k = CELI[etap], t0 = null, dur = reduce ? 300 : 2000;
    function frame(t) {
      if (t0 === null) t0 = t;
      var x = Math.min(1, (t - t0) / dur), e = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      p = ot + (k - ot) * e; draw();
      if (x < 1) { requestAnimationFrame(frame); return; }
      p = k; draw(); busy = false; etap++;
      if (etap >= CELI.length) { done = true; say('Смотри: 1940 год'); setTimeout(finale, 1300); return; }
      say(ZADANIE[etap]);
      setTimeout(function () { aktiv(crate2); }, reduce ? 0 : 300);
    }
    requestAnimationFrame(frame);
  }
  function startPlague() {
    if (s2phase !== 'result') return;
    zhdat();
    step(3); s2phase = 'plague';
    $('.hv-result').hidden = true; $('.hv-crate-s2').parentNode.hidden = false;
    $('.hv-legend').hidden = true; $('.hv-schema').textContent = 'схема · зелёная точка — привитые от чумы';
    VILS.forEach(function (v) { v.el.classList.remove('vac'); $$('i', v.el).forEach(function (i) { i.classList.remove('out'); }); });
    vials.forEach(function (v) { v.classList.remove('used'); v.classList.add('plague'); });
    crate2.setAttribute('aria-label', 'Ящик с вакциной от чумы: нажми — побегут годы');
    $('.hv-counter').hidden = false; $('.hv-bar').hidden = false;
    say(ZADANIE[0], 'Новая болезнь — чума. Новая вакцина Хавкина. Прививай всю Индию');
    root.scrollIntoView({ behavior: 'auto', block: 'start' });
    setTimeout(function () { aktiv(crate2); }, reduce ? 0 : 400);
  }
  crate2.addEventListener('click', godyBegut);
  $('.hv-next').addEventListener('click', startPlague);

  function finale() {
    zhdat();
    $('.hv-s2').hidden = true; $('.hv-steps').hidden = true;
    say('Прочитай, кто такой Хавкин', '');
    var fin = $('.hv-finale');
    fin.hidden = false;
    fin.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $('.hv-again').addEventListener('click', function () { location.reload(); });

  // Игра стартует сама (Р201)
  setTimeout(function () { aktiv(crate1); }, 300);
})();
