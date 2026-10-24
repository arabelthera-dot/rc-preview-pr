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

/* 5 февраля · Болдырев и Истмен: две даты на шкале (механика таблицы; ползунок по Р206 заменён нажатиями; M-74 «Таймлайн» ✅ + M-14 «по порядку» ✅).
   Подписи — по Президентской библиотеке (prlib.ru, «Великая Россия»), РОСФОТО (rosphoto.org/events/ivan-boldyrev) и TechInsider (techinsider.ru, Истмен). */
TapIgra({
  steps: [
    { key: 'steklo', task: 'Нажми на стекло', sub: 'Так снимали до плёнки',
      run: function (st, done, later) { st.classList.add('s-steklo'); later(done, 1000); },
      cap: 'фотографы того времени снимали на <b>стеклянные пластинки</b> — а стекло хрупкое. Болдырев искал, чем его заменить.' },
    { key: 'y1878', task: 'Нажми «1878» на шкале', sub: 'Где стоит Болдырев?',
      run: function (st, done, later) { st.classList.add('s-1878'); later(done, 900); },
      cap: '<b>1878</b>: Болдырев показал Русскому техническому обществу свой новый объектив — и до 1883 года носил туда свои изобретения.' },
    { key: 'plenka', task: 'Размотай рулон плёнки', sub: 'Нажми на рулон',
      run: function (st, done, later) { st.classList.add('s-plenka'); later(done, 1400); },
      cap: 'это <b>«смоловидная лента»</b> Болдырева — прообраз современной фотоплёнки. Она могла бы заменить хрупкие стеклянные пластинки.' },
    { key: 'y1882', task: 'Нажми «1882» на шкале', sub: 'Смотри на обе дорожки',
      watch: 'Смотри на шкалу!',
      run: function (st, done, later) { st.classList.add('s-1882'); later(done, 1400); },
      cap: '<b>1882</b>: Болдырев показал плёнку на Всероссийской выставке в Москве — бронзовую медаль дали «за фотографические снимки». В том же году в США <b>Джордж Истмен</b> начал продавать свою плёнку.' },
    { key: 'y1888', task: 'Нажми «1888» на шкале', sub: 'Что делает Истмен?',
      run: function (st, done, later) { st.classList.add('s-1888'); later(done, 1000); },
      cap: '<b>1888</b>: Истмен стал наносить эмульсию на целлулоид — так появилась рулонная плёнка, а с ней фотоаппарат <b>Kodak</b>.' },
    { key: 'cmp', task: 'Нажми «Сравнить»', sub: 'Сколько лет между флажками?',
      watch: 'Смотри на скобку!',
      run: function (st, done, later) { st.classList.add('s-cmp'); later(done, 1400); },
      cap: 'от 1878-го, когда Болдырев начал носить изобретения в техническое общество, до рулонной плёнки Kodak — <b>десять лет</b>. Первооткрывателем считают Истмена, хотя его плёнка по многим параметрам уступала плёнке Болдырева.' }
  ],
  doneTask: 'Шкала готова!',
  reset: function (st) { st.className = 'ti-stage'; }
});
