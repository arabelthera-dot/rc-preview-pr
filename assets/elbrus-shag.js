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
/* Игра «Уложи команды в шаг» (27 января, «Эльбрус»): рецепт супа = программа, лента шагов = время машины.
   Один повар — одна команда за шаг (8 шагов). Два повара («Эльбрус») — по две за шаг, если команда не ждёт чужого результата. */
(function () {
  var root = document.querySelector('[data-elbrus-igra]');
  if (!root) return;

  var IC = {
    drop: '<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z" fill="#3a8ee6"/>',
    fire: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#e8642c"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffc531"/>',
    salt: '<path d="M8 9l1-5h6l1 5z" fill="#8a8a8a"/><rect x="7" y="9" width="10" height="13" rx="2" fill="#fff" stroke="#6b6b6b"/><circle cx="10" cy="6" r=".9" fill="#fff"/><circle cx="14" cy="6" r=".9" fill="#fff"/>',
    potato: '<ellipse cx="12" cy="13" rx="9" ry="7" fill="#b9823f"/><circle cx="9" cy="11" r="1" fill="#7a5222"/><circle cx="14" cy="15" r="1" fill="#7a5222"/><path d="M3 6c2 1 3 1 5 0" stroke="#3a8ee6" stroke-width="2" fill="none"/><path d="M16 5c2 1 3 1 5 0" stroke="#3a8ee6" stroke-width="2" fill="none"/>',
    peel: '<ellipse cx="11" cy="13" rx="8" ry="7" fill="#f3d983"/><path d="M17 8c3-3 5 0 3 2s-1 5 2 5" stroke="#b9823f" stroke-width="2.5" fill="none"/>',
    knife: '<path d="M4 18L18 4l2 2-10 11z" fill="#c9ced6" stroke="#7d8590"/><rect x="2" y="16" width="6" height="4" rx="1" transform="rotate(-45 5 18)" fill="#6b4222"/>',
    pot: '<path d="M4 10h16v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#4b5563"/><rect x="3" y="8" width="18" height="3" rx="1.5" fill="#6b7280"/><ellipse cx="10" cy="6" rx="2.5" ry="2" fill="#f3d983"/><ellipse cx="14.5" cy="5" rx="2" ry="1.6" fill="#f3d983"/>',
    leaf: '<path d="M5 19C5 9 12 4 20 4c0 8-5 15-15 15z" fill="#4caf50"/><path d="M5 19L15 9" stroke="#2e7d32" stroke-width="1.5"/>',
    cook: '<path d="M7 14a4 4 0 0 1 .5-8 4.5 4.5 0 0 1 9 0 4 4 0 0 1 .5 8v5H7z" fill="#fff"/><rect x="7" y="16" width="10" height="3" fill="#cfd8e3"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }

  var T = [
    { id: 'w1', t: 'Налей воду', ic: 'drop', deps: [] },
    { id: 'w2', t: 'Вскипяти воду', ic: 'fire', deps: ['w1'] },
    { id: 'w3', t: 'Посоли воду', ic: 'salt', deps: ['w2'] },
    { id: 'p1', t: 'Помой картошку', ic: 'potato', deps: [] },
    { id: 'p2', t: 'Почисти картошку', ic: 'peel', deps: ['p1'] },
    { id: 'p3', t: 'Нарежь картошку', ic: 'knife', deps: ['p2'] },
    { id: 'g', t: 'Нарежь зелень', ic: 'leaf', deps: [] },
    { id: 's', t: 'Брось картошку в воду', ic: 'pot', deps: ['w3', 'p3'] }
  ];
  var byId = {}; T.forEach(function (x, i) { x.n = i + 1; byId[x.id] = x; });

  var $ = function (s) { return root.querySelector(s); };
  var pool = $('.el-pool'), rowsEl = $('.el-rows'), cooksEl = $('.el-cooks');
  var task = $('.el-task'), sub = $('.el-sub'), nEl = $('.el-n');
  var race = $('.el-race'), win = $('.el-win'), btnNext = $('.el-next');
  var steps = root.querySelectorAll('.el-steps li');
  var ruka = igraRuka(root);

  function setTask(t) { task.innerHTML = '<b>Что сделать сейчас:</b> ' + t; }

  var mode = 1;          // 1 — один повар, 2 — «Эльбрус», два повара
  var place = {};        // id -> номер шага (0..7)
  var order = [];        // какие плитки посетитель кладёт сам, по очереди
  var cel = null, busy = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setStep(k) { steps.forEach(function (li, i) { li.classList.toggle('on', i === k - 1); }); }
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
    var left = pool.children.length; pool.hidden = !left; $('.el-label').hidden = !left;
    cooksEl.innerHTML = '<span></span><span>' + svg('cook') + 'Повар 1</span>' +
      (mode === 1 ? '<span class="off">второго нет</span>' : '<span>' + svg('cook') + 'Повар 2</span>');
    rowsEl.innerHTML = '';
    for (var r = 0; r < 8; r++) {
      var row = document.createElement('div');
      row.className = 'el-row'; row.dataset.row = r;
      row.innerHTML = '<b>шаг<br>' + (r + 1) + '</b>';
      var inRow = T.filter(function (x) { return place[x.id] === r; });
      if (inRow.length) row.classList.add('used');
      for (var c = 0; c < 2; c++) {
        var s = document.createElement('div');
        s.className = 'el-slot' + (mode === 1 && c === 1 ? ' off' : '');
        var x = inRow[c];
        if (x) {
          var d = document.createElement('span');
          d.className = 'el-tile done'; d.dataset.id = x.id;
          d.innerHTML = tileHTML(x);
          s.appendChild(d);
        }
        row.appendChild(s);
      }
      rowsEl.appendChild(row);
    }
    var used = T.filter(function (x) { return place[x.id] != null; });
    nEl.textContent = used.length ? Math.max.apply(null, used.map(function (x) { return place[x.id]; })) + 1 : 0;
  }

  // Одна активная кнопка: мигает, над ней рука. Если не видна — подкрутить к ней.
  function aktiv(el) {
    cel = el; ruka.na(el);
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 90) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  function tile(id) { return pool.querySelector('.el-tile[data-id="' + id + '"]'); }
  function zhdat() { cel = null; ruka.ubrat(); }

  function nextFree() { for (var r = 0; r < 8; r++) if (!T.some(function (k) { return place[k.id] === r; })) return r; return -1; }
  // Самый ранний шаг для команды у двух поваров: всё, чего она ждёт, — выше, и в шаге есть свободный повар.
  function earliest(id) {
    var x = byId[id], r = 0;
    x.deps.forEach(function (d) { r = Math.max(r, place[d] + 1); });
    while (T.filter(function (k) { return place[k.id] === r; }).length >= 2) r++;
    return r;
  }
  function count() { return T.filter(function (x) { return place[x.id] != null; }).length; }

  var SAY1 = ['Хорошо! Повар сделает это в шаге 1.', 'Шаг 2 занят. Ещё одну — и машина продолжит сама'];
  var SAY2 = {
    w1: 'Повар 1 наливает воду — это шаг 1.',
    p1: '«Помой картошку» не ждёт воду — второй повар делает это в тот же шаг!',
    w2: '«Вскипяти воду» ждёт «Налей воду» — значит, шаг 2.',
    p2: '«Почисти картошку» тоже в шаге 2: второй повар не ждёт воду. Дальше машина сама.'
  };

  function polozhit(id) {
    zhdat();
    place[id] = mode === 1 ? nextFree() : earliest(id);
    var c = count();
    if (mode === 1) sub.textContent = SAY1[c - 1] || '';
    else sub.textContent = SAY2[id];
    setTask('Смотри на ленту шагов');
    render();
    setTimeout(dalshe, reduce ? 80 : 450);
  }

  function dalshe() {
    var c = count();
    if (c < order.length) {
      var nx = byId[order[c]];
      setTask('Нажми «' + nx.t + '»');
      aktiv(tile(nx.id));
      return;
    }
    if (mode === 1) autoFill(); else autoPairs();
  }

  // Режим 1: один повар — после трёх плиток машина докладывает остальное сама, по одной.
  function autoFill() {
    busy = true;
    setTask('Смотри — машина докладывает сама');
    sub.textContent = 'Один повар делает по одной команде. Машина доложит остальное…';
    var rest = T.filter(function (x) { return place[x.id] == null; });
    var i = 0;
    (function step() {
      if (i >= rest.length) {
        busy = false;
        setTask('Нажми «Позвать второго повара →»');
        sub.textContent = 'Один повар: 8 команд — 8 шагов. Долго! Позови второго повара';
        btnNext.textContent = 'Позвать второго повара →';
        btnNext.hidden = false;
        aktiv(btnNext);
        return;
      }
      place[rest[i].id] = nextFree(); i++; render();
      setTimeout(step, reduce ? 60 : 380);
    })();
  }

  function startElbrus() {
    mode = 2; place = {}; order = ['w1', 'p1', 'w2', 'p2']; setStep(2);
    btnNext.hidden = true; race.hidden = true;
    sub.textContent = 'Пока один повар наливает воду, второй моет картошку — в один шаг';
    render();
    setTimeout(dalshe, reduce ? 80 : 450);
  }

  // Режим 2: остальное машина кладёт сама, парами — как «Эльбрус».
  function autoPairs() {
    busy = true;
    setTask('Смотри — машина кладёт парами');
    var pary = [['w3', 'p3'], ['s', 'g']], i = 0;
    (function step() {
      if (i >= pary.length) return setTimeout(finish, reduce ? 60 : 500);
      var r = earliest(pary[i][0]);
      pary[i].forEach(function (id) { place[id] = r; });
      sub.textContent = '«' + byId[pary[i][0]].t + '» и «' + byId[pary[i][1]].t + '» не ждут друг друга — шаг ' + (r + 1);
      i++; render();
      setTimeout(step, reduce ? 80 : 900);
    })();
  }

  function finish() {
    var n = +nEl.textContent;
    busy = true;
    setTask('Смотри, кто сварит быстрее');
    sub.textContent = '';
    race.hidden = false; win.textContent = '';
    var slow = $('.el-bar-slow'), fast = $('.el-bar-fast');
    slow.innerHTML = fast.innerHTML = new Array(9).join('<i></i>');
    setTimeout(function () { race.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }, 50);
    var t = 0;
    (function tick() {
      if (t < 8) slow.children[t].classList.add('on');
      if (t < n) fast.children[t].classList.add('on');
      t++;
      if (t < 8) return setTimeout(tick, reduce ? 40 : 320);
      busy = false;
      setTask('Нажми «Кто так считал первым? →»');
      win.innerHTML = 'Два повара: <b>' + n + ' шага</b> вместо 8. Ты ускорил программу вдвое.';
      btnNext.textContent = 'Кто так считал первым? →';
      btnNext.hidden = false;
      aktiv(btnNext);
    })();
  }

  function finale() {
    zhdat(); busy = true;
    setStep(3);
    $('.el-play').hidden = true;
    setTask('Прочитай, как считал «Эльбрус»'); sub.textContent = '';
    var f = $('.el-finale'); f.hidden = false;
    f.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  // Каждый шаг — одно нажатие на мигающую кнопку. Нажатие мимо — только подсказка.
  root.addEventListener('click', function (e) {
    if (e.target.closest('.el-finale, [data-igra-pravila]')) return;
    var k = e.target.closest('.igra-aktiv');
    if (k && k === cel) {
      if (k === btnNext) { zhdat(); btnNext.hidden = true; if (mode === 1) startElbrus(); else finale(); return; }
      if (k.dataset.id) return polozhit(k.dataset.id);
      return;
    }
    if (!busy && cel) sub.textContent = 'Жми мигающую кнопку — над ней рука.';
  });
  $('.el-again').addEventListener('click', function () { location.reload(); });

  // Игра стартует сама: мигает первая плитка.
  order = ['w1', 'w2', 'w3'];
  render();
  setTimeout(dalshe, 300);
})();
