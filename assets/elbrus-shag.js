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
/* Игра «Щит Москвы» (27 января, «Эльбрус»; Р224): к Москве летит цель, машина считает перехват.
   Обычная ЭВМ — одна команда за шаг (8 шагов, не успевает). «Эльбрус» — до трёх команд в шаг, если они не ждут друг друга (4 шага, перехват).
   Один шаг = 10 секунд схемы, до Москвы — 60 секунд. */
(function () {
  var root = document.querySelector('[data-elbrus-igra]');
  if (!root) return;

  var IC = {
    radar: '<circle cx="12" cy="13" r="9" fill="#0d3b2a" stroke="#38d39f" stroke-width="1.5"/><circle cx="12" cy="13" r="4.5" fill="none" stroke="#38d39f"/><path d="M12 13L19 7" stroke="#9cf5cf" stroke-width="2"/>',
    speed: '<path d="M3 17a9 9 0 0 1 18 0z" fill="#2c4a6b"/><path d="M12 17l5-6" stroke="#ffc531" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="2" fill="#fff"/>',
    dir: '<path d="M4 20L20 4" stroke="#3a8ee6" stroke-width="2.6"/><path d="M11 4h9v9" fill="none" stroke="#3a8ee6" stroke-width="2.6" stroke-linejoin="round"/>',
    alt: '<path d="M2 21l7-11 4 6 3-4 6 9z" fill="#7a8a99"/><path d="M18 2v8M15 5l3-3 3 3" stroke="#e8642c" stroke-width="2" fill="none"/>',
    ready: '<rect x="4" y="15" width="16" height="5" rx="1" fill="#6b7280"/><path d="M12 2c2 2 3 5 3 8v5H9v-5c0-3 1-6 3-8z" fill="#e8eef5" stroke="#4b5563"/>',
    meet: '<circle cx="12" cy="12" r="8" fill="none" stroke="#e8642c" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#e8642c"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="#e8642c" stroke-width="2"/>',
    launch: '<path d="M12 1c2.5 2.5 3.5 6 3.5 9.5V16h-7v-5.5C8.5 7 9.5 3.5 12 1z" fill="#e8eef5" stroke="#4b5563"/><path d="M9.5 17h5l-2.5 6z" fill="#ffc531"/>',
    aim: '<path d="M3 20L17 6" stroke="#38d39f" stroke-width="2" stroke-dasharray="3 2"/><path d="M14 4l6-1-1 6z" fill="#38d39f"/><circle cx="4" cy="20" r="2.2" fill="#e8eef5"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }

  var T = [
    { id: 'r', t: 'Принять сигнал радара', ic: 'radar', deps: [] },
    { id: 'v', t: 'Узнать скорость цели', ic: 'speed', deps: ['r'] },
    { id: 'd', t: 'Узнать направление полёта', ic: 'dir', deps: ['r'] },
    { id: 'h', t: 'Узнать высоту', ic: 'alt', deps: ['r'] },
    { id: 'g', t: 'Подготовить перехватчик', ic: 'ready', deps: [] },
    { id: 'p', t: 'Найти точку встречи', ic: 'meet', deps: ['v', 'd', 'h'] },
    { id: 's', t: 'Пуск перехватчика', ic: 'launch', deps: ['g'] },
    { id: 'n', t: 'Навести перехватчик', ic: 'aim', deps: ['p', 's'] }
  ];
  var byId = {}; T.forEach(function (x, i) { x.n = i + 1; byId[x.id] = x; });
  var KRATKO = { r: 'Сигнал радара', v: 'Скорость', d: 'Направление', h: 'Высота', g: 'Подготовка', p: 'Точка встречи', s: 'Пуск', n: 'Наведение' };

  var LIMIT = 60, SHAG = 10;
  var $ = function (s) { return root.querySelector(s); };
  var pool = $('.el-pool'), rowsEl = $('.el-rows'), lanesEl = $('.el-lanes');
  var task = $('.el-task'), sub = $('.el-sub'), nEl = $('.el-n'), dockT = $('.el-dock-t');
  var timer = $('.el-timer'), timerN = $('.el-timer b'), scene = $('.el-scene');
  var tgt = $('.el-tgt'), icp = $('.el-icp'), hit = $('.el-hit');
  var race = $('.el-race'), win = $('.el-win'), btnNext = $('.el-next');
  var steps = root.querySelectorAll('.el-steps li');
  var ruka = igraRuka(root);

  var mode = 1, place = {}, cel = null, busy = false, dalshe = null, novaya = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P0 = { x: 178, y: 26 }, M = { x: 100, y: 104 };

  function zhdi(ms) { return reduce ? Math.min(ms, 120) : ms; }
  function setTask(t) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }
  function setStep(k) { steps.forEach(function (li, i) { li.classList.toggle('on', i === k - 1); }); }
  function mesta() { return mode === 1 ? 1 : 3; }
  function shagov() { var m = 0; for (var k in place) m = Math.max(m, place[k] + 1); return m; }
  function zanyato(r) { var c = 0; for (var k in place) if (place[k] === r) c++; return c; }
  function ranniy(x) {
    if (mode === 1) return shagov();
    var r = 0;
    x.deps.forEach(function (d) { r = Math.max(r, place[d] + 1); });
    while (zanyato(r) >= mesta()) r++;
    return r;
  }
  function gotova(x) { return x.deps.every(function (d) { return place[d] != null; }); }
  function sklon(n) { return n % 10 === 1 && n % 100 !== 11 ? 'шаг' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'шага' : 'шагов'); }

  function tochka(f) { return { x: P0.x + (M.x - P0.x) * f, y: P0.y + (M.y - P0.y) * f }; }
  function dvigat(el, p) { el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)'; }

  function chasy() {
    var n = shagov(), ost = LIMIT - n * SHAG;
    nEl.textContent = n;
    timerN.textContent = Math.max(ost, 0) + ' с';
    dockT.textContent = Math.max(ost, 0) + ' с';
    timer.classList.toggle('malo', ost <= 20);
    dvigat(tgt, tochka(Math.min(n * SHAG / LIMIT, 1)));
    if (ost <= 0 && !scene.classList.contains('proshla')) {
      scene.classList.add('proshla'); timer.classList.add('vse');
      sub.textContent = 'Время вышло — цель прошла к Москве, а машина ещё считает.';
    }
  }

  function tileHTML(x) { return svg(x.ic) + '<span>' + x.t + '</span><span class="n">' + x.n + '</span>'; }

  function render() {
    pool.innerHTML = '';
    T.forEach(function (x) {
      if (place[x.id] != null) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'el-tile'; b.dataset.id = x.id; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', x.n + '. ' + x.t);
      b.innerHTML = tileHTML(x);
      pool.appendChild(b);
    });
    rowsEl.innerHTML = '';
    var m = mesta(), vsego = Math.max(shagov(), 1);
    rowsEl.style.setProperty('--m', m);
    lanesEl.style.setProperty('--m', m);
    lanesEl.innerHTML = '<span></span>' + (m === 1 ? '<span>Одна команда в шаге</span>' : '<span>место 1</span><span>место 2</span><span>место 3</span>');
    for (var r = 0; r < vsego; r++) {
      var row = document.createElement('div');
      row.className = 'el-row' + (zanyato(r) ? ' used' : '') + (mode === 1 && r * SHAG >= LIMIT ? ' pozdno' : '');
      row.innerHTML = '<b>Шаг ' + (r + 1) + '</b>';
      var v = T.filter(function (x) { return place[x.id] === r; });
      for (var j = 0; j < m; j++) {
        var s = document.createElement('div');
        s.className = 'el-slot';
        var x = v[j];
        if (x) {
          s.innerHTML = '<span class="el-tile done' + (x.id === novaya ? ' new' : '') + '">' + svg(x.ic) + '<span>' + KRATKO[x.id] + '</span></span>';
        }
        row.appendChild(s);
      }
      rowsEl.appendChild(row);
    }
    chasy();
  }

  function vidno(el) {
    var r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 96) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  function ukazat(el, t, posle) { cel = el; dalshe = posle; busy = false; setTask(t); ruka.na(el); vidno(el); }
  function plitka(id) { return pool.querySelector('[data-id="' + id + '"]'); }

  function polozhit(id) {
    place[id] = ranniy(byId[id]); novaya = id;
    render();
    return place[id];
  }

  function avto(ids, slova, konec) {
    var i = 0;
    (function sled() {
      if (i >= ids.length) return setTimeout(konec, zhdi(600));
      var id = ids[i], r = polozhit(id);
      if (slova && slova[id]) sub.textContent = slova[id];
      else if (!scene.classList.contains('proshla')) sub.textContent = '«' + byId[id].t + '» — шаг ' + (r + 1) + '.';
      i++;
      setTimeout(sled, zhdi(mode === 1 ? 750 : 1300));
    })();
  }

  /* Часть 1: обычная ЭВМ */
  var TAPS1 = ['r', 'v', 'd'];
  function chast1() {
    mode = 1; place = {}; setStep(1);
    root.classList.remove('rezhim-2'); scene.classList.remove('proshla', 'perehvat'); timer.classList.remove('vse');
    render();
    sub.textContent = 'Обычная ЭВМ: одна команда — один шаг. Шаг — 10 секунд.';
    tap1(0);
  }
  function tap1(k) {
    if (k >= TAPS1.length) {
      busy = true; ruka.ubrat(); cel = null;
      setTask('Смотри, как машина досчитывает');
      sub.textContent = 'Дальше машина кладёт команды сама — по одной за шаг.';
      return setTimeout(function () {
        avto(['h', 'g', 'p', 's', 'n'], null, konec1);
      }, zhdi(900));
    }
    var x = byId[TAPS1[k]];
    ukazat(plitka(x.id), 'Нажми «' + x.t + '»', function () {
      var r = polozhit(x.id);
      sub.textContent = '«' + x.t + '» — шаг ' + (r + 1) + '. Прошло ' + (r + 1) * SHAG + ' секунд.';
      setTimeout(function () { tap1(k + 1); }, zhdi(450));
    });
  }
  function konec1() {
    sub.innerHTML = '<b>8 команд — 8 шагов.</b> По одной команде за шаг — не успеть.';
    btnNext.textContent = 'Включить «Эльбрус» →'; btnNext.hidden = false;
    ukazat(btnNext, 'Нажми «Включить „Эльбрус“»', chast2);
  }

  /* Часть 2: «Эльбрус» */
  function chast2() {
    btnNext.hidden = true; ruka.ubrat();
    mode = 2; place = {}; setStep(2);
    root.classList.add('rezhim-2'); scene.classList.remove('proshla'); timer.classList.remove('vse');
    render();
    sub.textContent = '«Эльбрус» кладёт команду в самый ранний шаг — до трёх команд рядом.';
    vidno(scene);
    setTimeout(function () { tap2(0); }, zhdi(700));
  }
  var TAPS2 = [
    { id: 'r', slovo: '«Сигнал радара» — шаг 1. Остальные ждут его.' },
    { id: 'v', slovo: '«Скорость» ждёт сигнала радара — встаёт в шаг 2.' },
    { id: 'd', slovo: '«Скорость» и «направление» не ждут друг друга — «Эльбрус» считает их в один шаг!' },
    { id: 'p' }
  ];
  function tap2(k) {
    if (k >= TAPS2.length) return;
    var w = TAPS2[k], x = byId[w.id];
    ukazat(plitka(x.id), 'Нажми «' + x.t + '»', function () {
      if (!gotova(x)) return otskok(plitka(x.id));
      polozhit(x.id); sub.textContent = w.slovo;
      setTimeout(function () { tap2(k + 1); }, zhdi(500));
    });
  }
  function otskok(b) {
    busy = true; ruka.ubrat(); cel = null;
    b.classList.add('el-otskok');
    sub.textContent = 'Сначала нужны скорость, направление и высота.';
    setTask('Смотри, как машина досчитывает');
    setTimeout(function () {
      b.classList.remove('el-otskok');
      avto(['h', 'p', 'g', 's', 'n'], {
        h: '«Высоту» машина кладёт сама — тоже в шаг 2, рядом.',
        p: 'Скорость, направление и высота есть — «Точка встречи» встаёт в шаг 3.',
        g: '«Подготовить перехватчик» не ждёт радара — встаёт в шаг 1 рядом.',
        s: '«Пуск» не ждёт точку встречи — в шаг 3 рядом.',
        n: '«Навести перехватчик» ждёт точку встречи и пуск — шаг 4.'
      }, perehvat);
    }, zhdi(1500));
  }
  function perehvat() {
    var f = shagov() * SHAG / LIMIT, p = tochka(f);
    sub.textContent = 'Перехватчик летит к точке встречи…';
    icp.style.opacity = 1;
    dvigat(icp, M);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      icp.classList.add('let'); dvigat(icp, p);
    }); });
    setTimeout(function () {
      scene.classList.add('perehvat'); dvigat(hit, p);
      var n = shagov(), ost = LIMIT - n * SHAG;
      win.innerHTML = 'Цель перехвачена! «Эльбрус» успел за ' + n + ' ' + sklon(n) + ' — обычной ЭВМ нужно 8.';
      sub.textContent = 'Цель перехвачена за ' + ost + ' секунд до Москвы.';
      race.querySelectorAll('.el-bar').forEach(function (bar, i) {
        var k = i === 0 ? 8 : n;
        bar.innerHTML = '';
        for (var j = 0; j < 8; j++) bar.appendChild(document.createElement('i'));
        bar.querySelectorAll('i').forEach(function (c, j) { if (j < k) c.className = 'on'; });
      });
      race.hidden = false;
      btnNext.textContent = 'Кто так считал первым? →'; btnNext.hidden = false;
      ukazat(btnNext, 'Нажми «Кто так считал первым?»', finish);
      vidno(race);
    }, zhdi(1600));
  }

  function finish() {
    ruka.ubrat(); cel = null; busy = true; btnNext.hidden = true; setStep(3);
    setTask('Читай, кто так считал первым');
    var f = $('.el-finale'); f.hidden = false;
    f.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !root.contains(b) || b.classList.contains('el-again')) return;
    if (!busy && cel && b === cel) {
      var go = dalshe; cel = null; dalshe = null; busy = true; ruka.ubrat();
      return go();
    }
    if (!busy && cel) sub.textContent = 'Жми мигающую кнопку — над ней рука.';
  });
  $('.el-again').addEventListener('click', function () { window.scrollTo(0, 0); location.reload(); });

  chast1();
})();
