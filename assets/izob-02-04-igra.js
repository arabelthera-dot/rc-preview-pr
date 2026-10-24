/* Движок игр февраля: каждый шаг — одно нажатие на одну мигающую кнопку, рука показывает куда (Р206).
   Только click; pointerdown лишь мгновенно рисует «нажато». */
function TapIgra(cfg) {
  'use strict';
  var root = document.querySelector('[data-ti]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var play = $('.ti-play'), hand = $('.ti-hand'), task = $('.ti-task'), sub = $('.ti-sub');
  var cap = $('.ti-cap'), capT = $('.ti-cap-t'), finale = $('.ti-finale'), stage = $('.ti-stage');
  var dotsBox = $('.ti-steps');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = cfg.steps, n = steps.length, cur = -1, active = null;
  var all = [].slice.call(root.querySelectorAll('[data-k]'));
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, reduce ? Math.min(ms, 250) : ms)); }

  dotsBox.innerHTML = '';
  for (var d = 0; d < n; d++) { var li = document.createElement('li'); li.textContent = d + 1; dotsBox.appendChild(li); }
  var dots = [].slice.call(dotsBox.children);

  function btnOf(k) { return root.querySelector('[data-k="' + k + '"]'); }
  function setActive(btn) {
    active = btn;
    all.forEach(function (b) { var on = b === btn; b.disabled = !on; b.classList.toggle('hint', on); });
    placeHand();
    if (btn) {
      var r = btn.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 8 || r.top < 0) btn.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function placeHand() {
    if (!active || active.hidden || active.disabled) { hand.hidden = true; return; }
    var pr = play.getBoundingClientRect(), r = active.getBoundingClientRect();
    if (!r.width) { hand.hidden = true; return; }
    hand.hidden = false;
    var zone = active.classList.contains('ti-zone');
    hand.style.left = Math.round(r.left - pr.left + r.width * (zone ? 0.6 : 0.82)) + 'px';
    hand.style.top = Math.round(r.top - pr.top + r.height * (zone ? 0.62 : 0.55)) + 'px';
  }
  window.addEventListener('resize', placeHand);
  setInterval(placeHand, 300); // подписи и картинки сдвигают кнопки — рука следом

  function buzz() { try { if (navigator.vibrate) navigator.vibrate(20); } catch (_) {} }
  function say(t) { if (!t) return; capT.innerHTML = t; cap.hidden = false; placeHand(); }

  all.forEach(function (b) {
    b.addEventListener('pointerdown', function () { if (!b.disabled) b.classList.add('press'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      b.addEventListener(ev, function () { setTimeout(function () { b.classList.remove('press'); }, 120); });
    });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (b.disabled || b !== active) return;
      buzz();
      b.classList.add('press'); setTimeout(function () { b.classList.remove('press'); }, 140);
      fire();
    });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  // нажатие прямо в картинку = нажатие мигающей кнопки
  stage.addEventListener('click', function () { if (active && !active.classList.contains('ti-zone')) active.click(); });

  function go(i) {
    cur = i;
    dots.forEach(function (li, k) { li.className = k < i ? 'done' : (k === i ? 'on' : ''); });
    if (i >= n) return finish();
    var s = steps[i];
    task.textContent = s.task;
    sub.textContent = s.sub || '';
    setActive(btnOf(s.key));
  }
  function fire() {
    var s = steps[cur], b = active;
    setActive(null);
    task.textContent = s.watch || 'Смотри!';
    var used = steps.slice(cur + 1).some(function (x) { return x.key === s.key; });
    s.run(stage, function () {
      if (!used) b.classList.add('done');
      say(s.cap);
      later(function () { go(cur + 1); }, s.pause == null ? 500 : s.pause);
    }, later);
  }
  function finish() {
    setActive(null);
    task.textContent = cfg.doneTask || 'Готово!';
    sub.textContent = cfg.doneSub || 'Листай вниз — факты дня';
    if (cfg.final) cfg.final(stage, later);
    finale.hidden = false;
    later(function () { finale.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); }, 900);
  }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    finale.hidden = true; cap.hidden = true;
    all.forEach(function (b) { b.classList.remove('done'); });
    if (cfg.reset) cfg.reset(stage);
    go(0);
  }
  var again = $('.ti-again');
  if (again) again.addEventListener('click', function () { reset(); root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  reset();
}

/* 4 февраля · самовар в разрезе: где горит уголь и куда идёт тяга (механика таблицы ✅, M-14 по порядку).
   Подписи — по «Краткой истории самовара» и «Устройству самовара», Музей самоваров и бульоток (samovarmuseum.ru). */
TapIgra({
  steps: [
    { key: 'voda', task: 'Нажми «Налить воду»', sub: 'Самовар пока пустой',
      run: function (st, done, later) { st.classList.add('s-voda'); later(done, 1100); },
      cap: 'воду наливают в <b>корпус</b> самовара. Крышка закрывает его и не даёт воде выкипать.' },
    { key: 'ugol', task: 'Положи угли в трубу', sub: 'Нажми на тёмную трубу в середине',
      run: function (st, done, later) { st.classList.add('s-ugol'); later(done, 900); },
      cap: 'в центре корпуса, прямо в воде, стоит <b>труба-жаровня</b>. Древесные угли лежат на <b>решётке</b> внизу трубы, зола просыпается сквозь неё.' },
    { key: 'air', task: 'Нажми на поддувала', sub: 'Дырочки в шейке под корпусом',
      run: function (st, done, later) { st.classList.add('s-air'); later(done, 1000); },
      cap: 'через <b>поддувала</b> — отверстия в шейке — воздух идёт к углям, и они разгораются.' },
    { key: 'tyaga', task: 'Нажми на верх трубы', sub: 'Куда девать дым?',
      watch: 'Смотри на дым и воду!',
      run: function (st, done, later) { st.classList.add('s-tyaga'); later(done, 1800); },
      cap: 'к самовару прилагали <b>вытяжную трубу</b>: её вставляли в отдушину печи, и дым уходил наружу. Огонь горит в трубе посреди воды и греет её со всех сторон — вода закипает.' },
    { key: 'chai', task: 'Нажми «Поставить чайник»', sub: 'Вода закипела',
      run: function (st, done, later) { st.classList.add('s-chai'); later(done, 900); },
      cap: 'когда вода в самоваре закипит, на <b>конфорку</b> наверху ставят заварочный чайник.' },
    { key: 'kran', task: 'Открой кран', sub: 'Нажми на кран справа',
      run: function (st, done, later) { st.classList.add('s-kran'); later(done, 1500); },
      cap: 'через <b>кран</b> кипяток разливают по чашкам. Это устройство сложилось в самом начале самоварного дела и сохранилось до наших дней.' }
  ],
  doneTask: 'Самовар вскипел!',
  reset: function (st) { st.className = 'ti-stage'; }
});
