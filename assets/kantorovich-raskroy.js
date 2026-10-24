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

/* kantorovich-raskroy — игра 19 января (Канторович, 1939) на одиночных нажатиях (Р206, Р227, Р228).
   Сюжет как на странице дня: лист 12×8 клеток, заказ 2 щита 6×4, 2 малых щита 3×4, 2 полосы 6×2 = 96 клеток;
   мастер «на глаз» теряет четверть листа; план «по Канторовичу» — отходов ноль; лента лет 1939 → 1947 (Данциг).
   Вместо перетаскивания — цепочка нажатий: «на глаз» → «по Канторовичу» → (малый щит → место на листе) ×2 → лента лет. */
(function () {
  var root = document.querySelector('[data-kantorovich-igra]');
  if (!root) return;
  var ruka = igraRuka(root);
  var q = function (s) { return root.querySelector(s); };
  var cv = q('canvas'), c = cv.getContext('2d'), C = 50, GW = 12, GH = 8;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPES = { A: { name: 'Щит 6×4', col: '#c9a84c' }, B: { name: 'Малый щит 3×4', col: '#5aa6d6' }, S: { name: 'Полоса 6×2', col: '#7fc48a' } };
  /* мастер «на глаз»: щиты сверху, полосы посередине низа — остаются щели в одну клетку, малые щиты не влезают (72 из 96 = 75%) */
  var GLAZ = [['A', 0, 0, 6, 4], ['A', 6, 0, 6, 4], ['S', 0, 5, 6, 2], ['S', 6, 5, 6, 2]];
  /* план Канторовича (как на странице дня): щиты друг над другом слева, малые рядом справа вверху, полосы под ними */
  var PLAN = [['A', 0, 0, 6, 4], ['A', 0, 4, 6, 4], ['S', 6, 4, 6, 2], ['S', 6, 6, 6, 2]];
  var SLOTS = [[6, 0, 3, 4], [9, 0, 3, 4]];

  var btnGlaz = q('.kz-glaz'), btnKant = q('.kz-kant'), btnPusk = q('.kz-pusk'), btnAgain = q('.kz-again');
  var tray = {}; [].forEach.call(root.querySelectorAll('.kz-piece'), function (b) { tray[b.dataset.t] = b; });
  var slots = [].slice.call(root.querySelectorAll('.kz-slot'));
  var taskT = q('.kz-task-t'), sub = q('.kz-sub'), msgEl = q('.kz-msg'), steps = root.querySelectorAll('.kz-steps li');
  var L = q('.kz-lenta'), finale = q('.kz-finale');

  var placed = [], scraps = false, slotOpen = -1, inHand = false, stage = 0, cur = null, run = 0;
  var grain = []; for (var g = 0; g < 46; g++) grain.push({ y: Math.random() * 400, a: Math.random() * .08 + .03, k: Math.random() * 6 + 2, ph: Math.random() * 6 });

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function easeBack(t) { var s = 1.4; t = t - 1; return t * t * ((s + 1) * t + s) + 1; }
  function used() { return placed.reduce(function (s, p) { return s + p.w * p.h; }, 0); }
  function free(x, y) { return !placed.some(function (p) { return x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h; }); }
  function msg(t, cls) { msgEl.className = 'lab-msg kz-msg' + (cls ? ' ' + cls : ''); msgEl.textContent = t; }
  function shag(n) { [].forEach.call(steps, function (li, i) { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); }); }
  /* шаг игры: одна активная кнопка, над ней рука; текст «Что сделать сейчас» */
  function zhdat(btn, task, poyasn) {
    cur = btn; taskT.textContent = task; if (poyasn != null) sub.textContent = poyasn;
    [btnGlaz, btnKant, btnPusk].concat(slots, [tray.A, tray.B, tray.S]).forEach(function (b) { b.setAttribute('aria-disabled', b === btn ? 'false' : 'true'); });
    ruka.na(btn);
  }

  /* ── рисование листа ── */
  function rr(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawPiece(t, x, y, w, h, alpha, outline, dash) {
    var px = x * C + 3, py = y * C + 3, pw = w * C - 6, ph = h * C - 6;
    c.save(); c.globalAlpha = alpha;
    if (dash) { c.setLineDash([10, 8]); c.lineWidth = 4; c.strokeStyle = outline; rr(px, py, pw, ph, 6); c.stroke(); c.restore(); return; }
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    c.fillStyle = TYPES[t].col; rr(px, py, pw, ph, 6); c.fill();
    c.shadowColor = 'transparent';
    var gr = c.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(1, 'rgba(0,0,0,.12)');
    c.fillStyle = gr; rr(px, py, pw, ph, 6); c.fill();
    c.restore();
  }
  var raf = 0;
  function paint() {
    cancelAnimationFrame(raf);
    var now = performance.now(), moving = false;
    c.fillStyle = '#d9b98a'; c.fillRect(0, 0, cv.width, cv.height);
    grain.forEach(function (l) {
      c.strokeStyle = 'rgba(120,70,20,' + l.a + ')'; c.lineWidth = 1.4; c.beginPath();
      for (var x = 0; x <= 600; x += 20) { var yy = l.y + Math.sin(x / 90 * l.k / 4 + l.ph) * l.k; if (!x) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke();
    });
    c.strokeStyle = 'rgba(120,80,40,.28)'; c.lineWidth = 1;
    for (var x = 0; x <= GW; x++) { c.beginPath(); c.moveTo(x * C, 0); c.lineTo(x * C, GH * C); c.stroke(); }
    for (var y = 0; y <= GH; y++) { c.beginPath(); c.moveTo(0, y * C); c.lineTo(GW * C, y * C); c.stroke(); }
    if (scraps) { /* обрезки мастера — красным */
      c.save(); c.fillStyle = 'rgba(190,50,40,.22)'; c.strokeStyle = 'rgba(150,30,25,.55)'; c.lineWidth = 2;
      for (var yy = 0; yy < GH; yy++) for (var xx = 0; xx < GW; xx++) if (free(xx, yy)) {
        c.fillRect(xx * C, yy * C, C, C); c.beginPath(); c.moveTo(xx * C + 8, yy * C + C - 8); c.lineTo(xx * C + C - 8, yy * C + 8); c.stroke(); }
      c.restore();
    }
    SLOTS.forEach(function (s, i) { if (i >= slotOpen && slotOpen >= 0 && free(s[0], s[1])) drawPiece('B', s[0], s[1], s[2], s[3], i === slotOpen && inHand ? 1 : .55, i === slotOpen && inHand ? '#2fbf71' : 'rgba(40,90,140,.8)', true); });
    placed.forEach(function (p) {
      var x = p.x, y = p.y, w = p.w, h = p.h;
      if (p.an) {
        var k = Math.min(1, Math.max(0, (now - p.an.t0) / p.an.d)), e = easeBack(k);
        x = p.an.x + (p.x - p.an.x) * e; y = p.an.y + (p.y - p.an.y) * e; w = p.an.w + (p.w - p.an.w) * e; h = p.an.h + (p.h - p.an.h) * e;
        if (k >= 1) p.an = null; else moving = true;
      }
      drawPiece(p.t, x, y, w, h, 1);
    });
    meter();
    if (moving) raf = requestAnimationFrame(paint);
  }
  function lay(list, from) {
    var now = performance.now();
    return list.map(function (q, i) {
      var src = from && from[i];
      return { t: q[0], x: q[1], y: q[2], w: q[3], h: q[4], an: RM ? null : { x: src ? src.x : q[1], y: src ? src.y : GH + 1, w: q[3], h: q[4], t0: now + i * 150, d: src ? 760 : 520 } };
    });
  }
  function paintTray() {
    ['A', 'B', 'S'].forEach(function (t) {
      var n = 2 - placed.filter(function (p) { return p.t === t; }).length;
      tray[t].querySelector('.kz-pn').textContent = TYPES[t].name + ' · осталось ' + n;
      tray[t].classList.toggle('empty', n <= 0);
    });
    tray.B.classList.toggle('sel', inHand);
  }

  /* ── счётчик листа ── */
  var shown = 0, target = -1, tw = 0;
  var numEl = q('.kz-meter-num'), barEl = q('.kz-bar i'), otxEl = q('.kz-otx');
  function meter() {
    paintTray();
    var pct = Math.round(placed.reduce(function (s, p) { return s + (p.an ? 0 : p.w * p.h); }, 0) / 96 * 100);
    if (pct === target) return; target = pct;
    barEl.style.width = pct + '%'; barEl.classList.toggle('beat', pct > 75);
    otxEl.textContent = pct === 100 ? 'Отходы: ноль. У мастера «на глаз» — 25%.' : (pct > 75 ? 'Ты уже обходишь мастера: у него в деле 75%.' : 'Отходы: ' + (100 - pct) + '% листа. У мастера «на глаз» — 25%.');
    if (RM) { shown = pct; numEl.textContent = pct + '%'; return; }
    var from = shown, t0 = performance.now(); cancelAnimationFrame(tw);
    (function st(n) { var k = Math.min(1, (n - t0) / 500); shown = Math.round(from + (pct - from) * ease(k)); numEl.textContent = shown + '%'; if (k < 1) tw = requestAnimationFrame(st); })(t0);
  }

  /* ── шаги ── */
  function nachalo() {
    run++; placed = []; scraps = false; slotOpen = -1; inHand = false; stage = 0; target = -1;
    slots.forEach(function (s) { s.hidden = true; s.classList.remove('on'); });
    L.hidden = true; L.classList.remove('show'); finale.hidden = true;
    ['.kz-end-us', '.kz-fora', '.kz-danzig'].forEach(function (s) { q(s).classList.remove('on', 'show'); });
    btnPusk.hidden = false; resetLenta();
    shag(0); msg('Лист чистый, детали ждут в заказе.');
    zhdat(btnGlaz, 'Нажми «Раскроить на глаз»', 'Заказ: два больших щита, два малых и две полосы — всё из одного листа. Сначала посмотри, как режет мастер по соседству.');
    paint();
  }
  function onGlaz() {
    stage = 1; placed = lay(GLAZ); scraps = true; paint();
    msg('Мастер режет «на глаз»: щиты сверху, полосы посередине — между ними щели в одну клетку. Два малых щита уже не влезают, четверть листа уходит в обрезки.', 'bad');
    shag(1);
    zhdat(btnKant, 'Нажми «Посчитать по Канторовичу»', 'Те же детали, тот же лист. Посмотри, как их разложит метод Канторовича.');
  }
  function onKant() {
    stage = 2; var from = placed.map(function (p) { return { x: p.x, y: p.y }; });
    scraps = false; placed = lay(PLAN, from); slotOpen = 0; paint();
    msg('План по Канторовичу: большие щиты — друг над другом слева, полосы — справа внизу. Справа вверху осталось место ровно под два малых щита.', 'ok');
    shag(2);
    zhdat(tray.B, 'Нажми «Малый щит 3×4»', 'Возьми из заказа малый щит — он ляжет на свободное место.');
  }
  function onTray() {
    inHand = true; paint();
    var s = slots[slotOpen]; s.hidden = false; s.classList.add('on');
    msg('Малый щит в руке. Место для него на листе мигает.');
    zhdat(s, 'Нажми мигающее место на листе', 'Щит ляжет туда, где обведена рамка.');
  }
  function onSlot(i) {
    var sd = SLOTS[i], s = slots[i];
    inHand = false; s.hidden = true; s.classList.remove('on');
    var now = performance.now();
    placed.push({ t: 'B', x: sd[0], y: sd[1], w: sd[2], h: sd[3], an: RM ? null : { x: sd[0] + .5, y: -sd[3], w: sd[2], h: sd[3], t0: now, d: 420 } });
    slotOpen = i + 1; paint();
    if (i === 0) {
      msg('Малый щит уложен. Остался ещё один — и лист уйдёт в дело целиком.', 'ok');
      zhdat(tray.B, 'Нажми «Малый щит 3×4»', 'Второй малый щит — на место справа.');
      return;
    }
    slotOpen = -1; stage = 3; paint();
    msg('Весь заказ уложен — отходов ноль. Метод разрешающих множителей приходит к такому плану без перебора — так же быстро для фабрики из восьми станков и пяти работ, как в задаче 1938 года.', 'ok');
    shag(3);
    L.hidden = false; requestAnimationFrame(function () { L.classList.add('show'); });
    zhdat(btnPusk, 'Нажми «Пустить ленту лет»', 'Лист готов в 1939-м. Посмотри, когда к этому придут в Америке.');
    setTimeout(function () { var r = L.getBoundingClientRect(); if (r.top > window.innerHeight * .5) L.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); ruka.mesto(); }, RM ? 0 : 450);
  }

  /* ── лента лет 1939 → 1947 ── */
  var Y0 = 1939, Y1 = 1947, ticks = q('.kz-ticks');
  for (var yr = Y0; yr <= Y1; yr++) { var sp = document.createElement('span'); sp.className = 'kz-tick' + ((yr - Y0) % 4 === 0 ? ' big' : ''); sp.dataset.y = yr; sp.innerHTML = '<i></i><em>' + yr + '</em>'; ticks.appendChild(sp); }
  function let_(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? 'год' : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? 'года' : 'лет'; }
  function resetLenta() {
    q('.kz-track-line i').style.width = '0%'; q('.kz-lenta-god').textContent = Y0; q('.kz-fora-n').textContent = '0'; q('.kz-fora-w').textContent = 'лет';
    [].forEach.call(ticks.children, function (t) { t.classList.remove('on'); });
  }
  function onPusk() {
    stage = 4; ruka.ubrat(); btnPusk.hidden = true;
    taskT.textContent = 'Смотри, как бегут годы'; sub.textContent = 'В Ленинграде метод готов. Лента бежит к Америке.';
    var my = run, DUR = RM ? 0 : 3600, t0 = performance.now() + (RM ? 0 : 200);
    function fin() {
      q('.kz-lenta-god').textContent = Y1; q('.kz-track-line i').style.width = '100%';
      [].forEach.call(ticks.children, function (t) { t.classList.add('on'); });
      q('.kz-end-us').classList.add('on'); q('.kz-fora').classList.add('show');
      var f0 = performance.now();
      (function cnt(n) { if (my !== run) return; var k = RM ? 1 : Math.min(1, (n - f0) / 700), v = Math.round(8 * ease(k));
        q('.kz-fora-n').textContent = v; q('.kz-fora-w').textContent = let_(v); if (k < 1) requestAnimationFrame(cnt); })(f0);
      setTimeout(function () { if (my !== run) return; q('.kz-danzig').classList.add('show'); }, RM ? 0 : 800);
      setTimeout(function () {
        if (my !== run) return;
        taskT.textContent = 'Готово — читай факты ниже'; sub.textContent = 'Американец Данциг пришёл к тому же через восемь лет — и сам назвал первым Канторовича.';
        finale.hidden = false; finale.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }, RM ? 0 : 3200);
    }
    if (RM) { fin(); return; }
    (function step(n) {
      if (my !== run) return;
      var k = Math.max(0, Math.min(1, (n - t0) / DUR)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, y = Y0 + (Y1 - Y0) * e;
      q('.kz-track-line i').style.width = (e * 100) + '%'; q('.kz-lenta-god').textContent = Math.floor(y + 1e-6);
      [].forEach.call(ticks.children, function (t) { t.classList.toggle('on', +t.dataset.y <= y + 1e-6); });
      if (k < 1) requestAnimationFrame(step); else fin();
    })(performance.now());
  }

  /* ── нажатия: срабатывает только мигающая кнопка, остальное — подсказка ── */
  function mimo() { sub.textContent = 'Жми мигающую кнопку — над ней рука.'; }
  function zhmi(btn, fn) {
    btn.addEventListener('click', function () { if (btn !== cur) { mimo(); return; } cur = null; fn(); });
  }
  zhmi(btnGlaz, onGlaz); zhmi(btnKant, onKant); zhmi(btnPusk, onPusk);
  zhmi(tray.B, onTray);
  slots.forEach(function (s, i) { zhmi(s, function () { onSlot(i); }); });
  [tray.A, tray.S].forEach(function (b) { b.addEventListener('click', function () { msg('Этих деталей больше не нужно — жми мигающую кнопку.'); mimo(); }); });
  cv.addEventListener('click', function () { if (stage < 4) mimo(); });
  btnAgain.addEventListener('click', function () { nachalo(); root.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); });
  document.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === cv && cur) { e.preventDefault(); cur.click(); }
  });
  nachalo();
})();
