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

/* 3 февраля · «Луна-9»: посадка, раскрытие, панорама из строк радиопередачи (механика таблицы ✅, M-14 по порядку) */
TapIgra({
  steps: [
    { key: 'posadka', task: 'Нажми «Посадка»', sub: 'Станция подлетает к Луне',
      run: function (st, done, later) {
        st.classList.add('s-down');
        later(function () { st.classList.add('s-land'); }, 650);
        later(done, 1500);
      },
      cap: 'пятиметровый <b>щуп</b> коснулся Луны — двигатель выключился. Станция в надутых баллонах подпрыгнула несколько раз, <b>как мяч</b>, и улеглась в Океане Бурь.' },
    { key: 'raskryt', task: 'Нажми «Раскрыть»', sub: 'Сбрось баллоны',
      run: function (st, done, later) { st.classList.add('s-open'); later(done, 1100); },
      cap: 'баллоны отстрелились, раскрылись <b>четыре лепестка</b>-антенны и открыли телекамеру.' },
    { key: 'stroka', task: 'Нажми «Принять строку»', sub: 'Сигнал летит на Землю',
      run: function (st, done, later) {
        st.classList.add('s-tx', 's-l1');
        later(function () { st.classList.remove('s-tx'); done(); }, 1100);
      },
      cap: 'на Земле проявилась первая полоса снимка — горизонт Луны. Панорама шла <b>строчка за строчкой</b>.' },
    { key: 'stroka', task: 'Ещё раз «Принять строку»', sub: 'Вторая полоса снимка',
      run: function (st, done, later) {
        st.classList.add('s-tx', 's-l2');
        later(function () { st.classList.remove('s-tx'); done(); }, 1100);
      },
      cap: 'вторая полоса: <b>камни и кратеры</b> разного размера.' },
    { key: 'stroka', task: 'Прими последнюю строку', sub: 'Снимок почти готов',
      run: function (st, done, later) {
        st.classList.add('s-tx', 's-l3');
        later(function () { st.classList.remove('s-tx'); done(); }, 1100);
      },
      cap: 'снимок собран! Это <b>первая в истории панорама с поверхности Луны</b> — Земля получила её утром 4 февраля 1966 года.' },
    { key: 'grunt', task: 'Проверь грунт под станцией', sub: 'Нажми на круг под станцией',
      watch: 'Смотри под станцию!',
      run: function (st, done, later) { st.classList.add('s-grunt'); later(done, 900); },
      cap: '<b>не провалилась!</b> Многометрового слоя пыли нет: грунт твёрдый, похож на песок с камнями. Значит, на Луну можно сажать новые аппараты и готовить полёты людей.' }
  ],
  doneTask: 'Первый снимок с Луны собран!',
  reset: function (st) { st.className = 'ti-stage'; }
});
