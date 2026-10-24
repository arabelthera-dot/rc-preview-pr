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

/* Игра «Подними камеру в небо» (26 января, Срезневский, 1886).
   Только нажатия (Р206): «Выше ↑» ×3 → «Снять!» → «Наложи карту» — 5 нажатий.
   Шаг 1 — шар поднимается на 300 → 700 → 1100 м, вид вниз из корзины (высота — по образцу M-33, canvas).
   Шаг 2 — затвор и проявка пластинки 24×24, сама.
   Шаг 3 — карта сегодня ложится на снимок 1886 года (своя шторка на clip-path).
   Всё нарисовано по схеме: подлинного снимка 1886 года в открытом доступе нет. */
(function () {
  var root = document.querySelector('[data-shar-igra]');
  if (!root) return;
  function $(s) { return root.querySelector(s); }
  var TOP = 1100;
  var ruka = igraRuka(root);
  function setTask(t) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }

  /* География: единица = 100 м, x — на восток, y — на юг, (0,0) — Дворцовая площадь. */
  var NORTH = [[-600,-175],[-520,-168],[-420,-150],[-330,-140],[-260,-116],[-180,-96],[-110,-70],[-70,-50],[-45,-32]];
  var EDGE = [[-40,-22],[-46,-12],[-38,-6],[-44,2],[-36,10],[-48,18]];
  var SOUTH = [[-58,22],[-90,26],[-150,40],[-220,45],[-300,38],[-400,46],[-520,56],[-600,60]];
  var LAND = [[-600,-400]].concat(NORTH, EDGE, SOUTH, [[-600,400],[400,400],[400,-400]]);
  var KOTLIN = [[-282,-58],[-286,-48],[-300,-43],[-320,-45],[-345,-49],[-370,-53],[-395,-58],[-408,-61],
    [-403,-65],[-380,-66],[-350,-67],[-320,-70],[-300,-71],[-288,-66]];
  var NEVA = [[140,-30],[70,-26],[40,-12],[14,-5],[-10,-3],[-30,-1],[-46,2]];
  var NEVKA = [[14,-5],[4,-22],[-14,-32],[-44,-30]];
  var FORTS = [[-270,-62],[-276,-44],[-300,-36],[-330,-38],[-352,-76],[-322,-79],[-382,-73],[-292,-82],[-252,-58],[-262,-36]];
  var DAM = [[[-325,-139],[-331,-69]],[[-333,-44],[-336,40]]];
  var START = { x: 6, y: -0.175 };
  var TREES = [[-395,-61,6,2],[-382,-62,8,2.5],[-366,-59,7,3],[-352,-57,6,4],[-336,-58,6,5],[-318,-60,5,6]];

  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function inPoly(p, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function segDist(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function lineDist(p, line) { var d = 1e9; for (var i = 1; i < line.length; i++) d = Math.min(d, segDist(p, line[i - 1], line[i])); return d; }

  /* Кварталы: Петербург 1886 года, Кронштадт, сегодняшние пригороды (только для карты). */
  var R = rnd(1886), CITY = [], KRON = [], NEW = [];
  for (var bx = -38; bx < 70; bx += 2.2) for (var by = -40; by < 40; by += 1.6) {
    var p = [bx + 0.9, by + 0.6];
    if (!inPoly(p, LAND) || lineDist(p, NEVA) < 2.4 || lineDist(p, NEVKA) < 1.6) continue;
    if (Math.hypot(p[0] - 5, p[1]) > 40 * (0.8 + R() * 0.4)) continue;
    CITY.push([bx, by, 1.85, 1.25, Math.floor(R() * 5), R()]);
  }
  for (bx = -301; bx < -284; bx += 1.6) for (by = -71; by < -43; by += 1.3) {
    if (inPoly([bx + 0.6, by + 0.5], KOTLIN) && R() > 0.12) KRON.push([bx, by, 1.25, 0.95, Math.floor(R() * 5), R()]);
  }
  [[-320,46,30,10],[-310,-150,40,14],[-150,40,40,12],[-200,-112,40,10]].forEach(function (z) {
    for (var x = z[0]; x < z[0] + z[2]; x += 2.4) for (var y = z[1]; y < z[1] + z[3]; y += 1.9)
      if (inPoly([x + 1, y + 0.7], LAND) && R() > 0.3) NEW.push([x, y, 2, 1.4]);
  });
  /* Люди и экипажи на улице под стартом — видны только у самой земли. */
  var MOV = [];
  for (var m = 0; m < 70; m++) {
    var cart = R() < 0.3;
    MOV.push({ x: -14 + R() * 40, y: START.y + (R() - 0.5) * (cart ? 0.18 : 0.42), v: (R() < 0.5 ? -1 : 1) * (cart ? 0.004 : 0.0012) * (0.6 + R()), cart: cart });
  }

  var PAL = {
    live: { water: '#3d6a84', land: '#7d8f5e', ground: '#bdb09a', neva: '#3d6a84', roofs: ['#8a5444','#6f7c66','#8c8a84','#9a6a52','#737d84'], yard: '#4a443c', street: '#d8cdb8', tree: '#4f6a3e', fort: '#6b5e50', isl: '#8a9566' },
    plate: { water: '#5b4430', land: '#b89c72', ground: '#cdb48c', neva: '#5b4430', roofs: ['#8f714f','#7b5f42','#a3855f','#86694a','#97795a'], yard: '#5e4731', street: '#d6bf98', tree: '#6e5538', fort: '#3e2f20', isl: '#bfa478' },
    map: { water: '#aad3df', land: '#f2efe9', ground: '#e8e2da', neva: '#aad3df', roofs: ['#d9d0c9','#d9d0c9','#d9d0c9','#d9d0c9','#d9d0c9'], yard: '#e8e2da', street: '#fff', tree: '#c8e6b4', fort: '#c9bdb2', isl: '#f2efe9' }
  };

  function viewAt(h) {
    if (h <= 700) return { w: 4 * Math.pow(15, h / 700), cx: START.x, cy: START.y };
    var u = (h - 700) / 400, e = u * u * (3 - 2 * u);
    return { w: 60 * Math.pow(4, u), cx: START.x + e * (-345 - START.x), cy: START.y + e * (-57 - START.y) };
  }
  var FRAME = 0.6;

  function draw(ctx, size, v, pal, opt) {
    var s = size / v.w, ox = size / 2 - v.cx * s, oy = size / 2 - v.cy * s;
    var x0 = v.cx - v.w / 2 - 3, x1 = v.cx + v.w / 2 + 3, y0 = v.cy - v.w / 2 - 3, y1 = v.cy + v.w / 2 + 3;
    function X(x) { return x * s + ox; } function Y(y) { return y * s + oy; }
    function poly(pts) { ctx.beginPath(); pts.forEach(function (q, i) { i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.closePath(); }
    function line(pts, w, c) { ctx.beginPath(); pts.forEach(function (q, i) { i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.lineWidth = Math.max(1, w * s); ctx.strokeStyle = c; ctx.lineCap = ctx.lineJoin = 'round'; ctx.stroke(); }
    function vis(b) { return b[0] + b[2] > x0 && b[0] < x1 && b[1] + b[3] > y0 && b[1] < y1; }
    function blocks(list) {
      var fine = v.w < 30, lines = v.w < 8;
      list.forEach(function (b) {
        if (!vis(b)) return;
        ctx.fillStyle = pal.roofs[b[4]];
        ctx.fillRect(X(b[0]), Y(b[1]), Math.max(1, b[2] * s), Math.max(1, b[3] * s));
        if (fine) {
          var i = b[5] > 0.5 ? 0.42 : 0.32;
          ctx.fillStyle = pal.yard;
          ctx.fillRect(X(b[0] + i), Y(b[1] + i * 0.8), (b[2] - 2 * i) * s, (b[3] - 1.6 * i) * s);
          if (!lines) return;
          ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
          for (var k = b[0] + 0.3; k < b[0] + b[2]; k += 0.28) { ctx.beginPath(); ctx.moveTo(X(k), Y(b[1])); ctx.lineTo(X(k), Y(b[1] + i * 0.8)); ctx.moveTo(X(k), Y(b[1] + b[3])); ctx.lineTo(X(k), Y(b[1] + b[3] - i * 0.8)); ctx.stroke(); }
        }
      });
    }
    ctx.fillStyle = pal.water; ctx.fillRect(0, 0, size, size);
    poly(LAND); ctx.fillStyle = pal.land; ctx.fill();
    ctx.save(); poly(LAND); ctx.clip();
    ctx.beginPath(); ctx.arc(X(5), Y(0), 46 * s, 0, 7); ctx.fillStyle = pal.ground; ctx.fill();
    if (opt.map) NEW.forEach(function (b) { if (vis(b)) { ctx.fillStyle = '#ddd5cd'; ctx.fillRect(X(b[0]), Y(b[1]), b[2] * s, b[3] * s); } });
    ctx.restore();
    if (!opt.map) { ctx.fillStyle = pal.street; ctx.fillRect(X(-40), Y(-0.42), 100 * s, Math.max(1, 0.5 * s)); }
    line(NEVA, 4, pal.neva); line(NEVKA, 2.2, pal.neva);
    blocks(CITY);
    poly(KOTLIN); ctx.fillStyle = pal.isl; ctx.fill();
    ctx.save(); poly(KOTLIN); ctx.clip();
    ctx.fillStyle = pal.ground; ctx.fillRect(X(-302), Y(-72), 19 * s, 30 * s);
    ctx.restore();
    TREES.forEach(function (t) { ctx.beginPath(); ctx.ellipse(X(t[0]), Y(t[1]), t[2] * s, t[3] * s * 0.5, 0, 0, 7); ctx.fillStyle = pal.tree; ctx.fill(); });
    blocks(KRON);
    /* молы гаваней */
    line([[-302,-43],[-298,-38],[-284,-40],[-282,-48]], 0.7, pal.fort);
    /* гавани Кронштадта — тёмные ковши у южного берега */
    ctx.fillStyle = pal.water;
    [[-299,-46,4,3],[-293,-47,4,3.5],[-287,-50,3,3]].forEach(function (g) { ctx.fillRect(X(g[0]), Y(g[1]), g[2] * s, g[3] * s); });
    FORTS.forEach(function (f, i) { var r = Math.max(2.5, 1.6 * s); ctx.beginPath(); if (i % 2) ctx.arc(X(f[0]), Y(f[1]), r, 0, 7); else { ctx.moveTo(X(f[0]) - r, Y(f[1]) + r * 0.7); ctx.lineTo(X(f[0]), Y(f[1]) - r); ctx.lineTo(X(f[0]) + r, Y(f[1]) + r * 0.7); ctx.closePath(); } ctx.fillStyle = pal.fort; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.35); ctx.strokeStyle = pal.ground; ctx.stroke(); });
    if (opt.map) {
      DAM.forEach(function (d) { line(d, 1.6, '#fff'); line(d, 0.9, '#f2a65a'); });
      line([[-331,-69],[-333,-44]], 0.9, '#f2a65a');
      line([[-330,-57],[-292,-57]], 0.6, '#fff');
    }
    if (opt.movers && v.w < 14) {
      MOV.forEach(function (q) {
        if (opt.tick) { q.x += q.v; if (q.x > 26) q.x = -14; if (q.x < -14) q.x = 26; }
        ctx.fillStyle = q.cart ? '#2b2118' : '#1d1d24';
        var d = cv.width / 300;
        if (q.cart) ctx.fillRect(X(q.x) - 3 * d, Y(q.y) - 1.6 * d, 6 * d, 3.2 * d);
        else { ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 1.3 * d, 0, 7); ctx.fill(); }
      });
    }
  }

  function plateFX(ctx, size) {
    var r = rnd(24), img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var n = (r() - 0.5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
    var g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.75);
    g.addColorStop(0, 'rgba(40,25,10,0)'); g.addColorStop(1, 'rgba(40,25,10,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  }

  /* ---------- Шаг 1: шар вверх ---------- */
  var cv = $('.sr-view'), ctx = cv.getContext('2d'), track = $('.sr-rope'), ball = $('.sr-ball'), alt = $('.sr-alt b');
  var task = $('.sr-task'), sub = $('.sr-sub'), steps = root.querySelectorAll('.sr-steps li');
  var h = 0, target = 0, done = false, raf = 0, cssSize = 0;
  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cssSize = cv.clientWidth; cv.width = Math.round(cssSize * dpr); cv.height = cv.width;
  }
  function render(tick) {
    var size = cv.width, v = viewAt(h);
    draw(ctx, size, v, PAL.live, { movers: true, tick: tick });
    var f = size * FRAME, a = (size - f) / 2, top = h >= TOP - 0.5;
    ctx.fillStyle = 'rgba(6,12,23,.42)';
    ctx.fillRect(0, 0, size, a); ctx.fillRect(0, a + f, size, a); ctx.fillRect(0, a, a, f); ctx.fillRect(a + f, a, a, f);
    ctx.strokeStyle = top ? '#ffd65a' : 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(2, size / 140);
    var c = f * 0.16; ctx.beginPath();
    [[a, a, 1, 1], [a + f, a, -1, 1], [a, a + f, 1, -1], [a + f, a + f, -1, -1]].forEach(function (k) {
      ctx.moveTo(k[0], k[1] + c * k[3]); ctx.lineTo(k[0], k[1]); ctx.lineTo(k[0] + c * k[2], k[1]);
    });
    ctx.stroke();
    if (top) { ctx.strokeStyle = 'rgba(255,214,90,.5)'; ctx.lineWidth = 1; ctx.strokeRect(a, a, f, f); }
  }
  function setBall() {
    var p = h / TOP;
    ball.style.bottom = 'calc(' + (p * 100) + '% - ' + (p * 56) + 'px)';
    track.style.setProperty('--p', p);
    alt.textContent = Math.round(h / 10) * 10;
  }
  /* Подъём: каждое нажатие «Выше ↑» — плавно к следующей высоте за 1,6 с. */
  var LEVELS = [300, 700, TOP], lvl = 0, from = 0, t0 = 0, DUR = 1600, busy = false;
  var SAY = [
    '300 метров. Под тобой улица: видны люди и экипажи. Рамка — то, что попадёт на снимок.',
    '700 метров. В окне уже весь Петербург, Нева и острова. Кронштадта в рамке пока нет.',
    'Есть Кронштадт! С 1100 метров весь остров влез в рамку.'
  ];
  var up = $('.sr-up');
  function loop(now) {
    if (busy) {
      var u = Math.min(1, (now - t0) / DUR), e = u * u * (3 - 2 * u);
      h = from + (target - from) * e; setBall();
      if (u >= 1) { h = target; setBall(); busy = false; arrived(); }
    }
    render(true);
    raf = requestAnimationFrame(loop);
  }
  up.addEventListener('click', function () {
    if (busy || done || up.hidden) return;
    ruka.ubrat(); busy = true; from = h; target = LEVELS[lvl]; t0 = performance.now();
    up.textContent = 'Летим… ↑';
    sub.textContent = 'Шар поднимается на ' + target + ' м…';
    root.classList.add('sr-touched');
  });
  function arrived() {
    sub.textContent = SAY[lvl]; lvl++;
    if (lvl < LEVELS.length) { up.textContent = 'Выше ↑'; ruka.na(up); }
    else reached();
  }
  /* Нажатие мимо мигающей кнопки игру не ломает. */
  root.addEventListener('click', function (e) {
    if (fin || busy || e.target.closest('.igra-aktiv, .sr-finale, .igra-pravila')) return;
    if (root.querySelector('.igra-aktiv')) sub.textContent = 'Жми мигающую кнопку — над ней рука.';
  });

  function stepOn(n) { steps.forEach(function (li, i) { li.classList.toggle('on', i === n - 1); }); root.dataset.step = n; }
  function reached() {
    done = true; h = target = TOP; setBall();
    root.classList.add('sr-top');
    setTask('Нажми «Снять!»');
    up.hidden = true;
    $('.sr-shoot').hidden = false; ruka.na($('.sr-shoot'));
  }

  /* ---------- Шаг 2: затвор и проявка ---------- */
  var plateURL = '', mapURL = '';
  var shot = false;
  $('.sr-shoot').addEventListener('click', function () {
    if (shot) return; shot = true; ruka.ubrat();
    root.classList.add('sr-flash');
    sub.textContent = 'Щёлк! Затвор открылся на миг.';
    var v = viewAt(TOP), F = v.w * FRAME, fv = { w: F, cx: v.cx, cy: v.cy }, N = 720;
    var pc = $('.sr-plate'); pc.width = pc.height = N;
    var pctx = pc.getContext('2d');
    draw(pctx, N, fv, PAL.plate, {}); plateFX(pctx, N);
    plateURL = pc.toDataURL('image/jpeg', 0.86);
    var mc = document.createElement('canvas'); mc.width = mc.height = N;
    draw(mc.getContext('2d'), N, fv, PAL.map, { map: true });
    mapURL = mc.toDataURL('image/png');
    setTimeout(function () {
      cancelAnimationFrame(raf);
      $('.sr-s1').hidden = true; $('.sr-s2').hidden = false; stepOn(2);
      setTask('Смотри на пластинку');
      sub.textContent = 'Снимок сделан на стеклянную пластинку. В проявителе — особой жидкости — он проступает сам.';
      requestAnimationFrame(function () { root.classList.add('sr-dev'); });
      setTimeout(shutterStep, 4000);
    }, 380);
  });

  /* ---------- Шаг 3: карта ложится на снимок ---------- */
  var sht = $('.sr-sht'), nal = $('.sr-nalozhi');
  function shutterStep() {
    $('.sr-sht-plate').src = plateURL; $('.sr-sht-map').src = mapURL;
    $('.sr-s2').hidden = true; $('.sr-s3').hidden = false; stepOn(3);
    setTask('Нажми «Наложи карту»');
    sub.textContent = 'Снимок проявился. Теперь положим на него карту из твоего телефона.';
    ruka.na(nal);
  }
  nal.addEventListener('click', function () {
    if (sht.classList.contains('sr-sht-go')) return;
    ruka.ubrat(); nal.hidden = true;
    sht.classList.add('sr-sht-go'); root.classList.add('sr-map-on');
    sub.textContent = 'Карта ложится на снимок…';
    setTimeout(function () { $('.sr-cap-map').hidden = false; finale(); }, 1700);
  });
  var fin = false;
  function finale() {
    if (fin) return; fin = true;
    setTask('Прочитай, как это было');
    sub.textContent = 'Совпало! Снимок 1886 года лёг на карту: берега и форты на тех же местах.';
    var f = $('.sr-finale'); f.hidden = false;
    setTimeout(function () { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 900);
  }

  $('.sr-again').addEventListener('click', function () { location.reload(); });

  fit(); setBall(); render(false);
  ruka.na(up);
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', function () { fit(); render(false); });
})();
