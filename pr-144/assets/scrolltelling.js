/* scrolltelling.js — скроллтеллинг M-73 (музей «Русские не сдаются»).
 * Закреплённая картина меняет сцену и подпись по мере прокрутки шагов `.st-step`,
 * а активная сцена мягко наезжает (scale 1→1.1) по прогрессу прокрутки своего шага.
 * Индикатор (точки) и счётчик «сцена N/3» генерируются движком — разметка в HTML
 * не дублируется. Скрытые сцены хранят адреса в data-src/data-srcset (performance.md):
 * движок подставляет их при показе сцены и заранее для следующей — с первой прокрутки.
 * Повторяющийся блок: подключается на каждой странице дня,
 * разметка — в HTML, логика и стили — общие. Движок не пишется заново на страницу.
 */
(function () {
  function init() {
    var root = document.querySelector('.scrolltelling');
    if (!root) return;
    var steps = root.querySelectorAll('.st-step');
    var scenes = root.querySelectorAll('.st-scene');
    var caps = root.querySelectorAll('.st-cap-layer');
    if (!steps.length) return;

    var reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { reduce = false; }

    var current = 0;
    var ticking = false;
    var i;

    /* индикатор: точки под сценой + счётчик в панели подписи (генерируются движком) */
    var stage = root.querySelector('.st-stage');
    var capBox = root.querySelector('.st-cap');
    var dots = [];
    var counter = null;

    if (stage) {
      var ind = document.createElement('div');
      ind.className = 'st-indicator';
      ind.setAttribute('aria-hidden', 'true');
      for (i = 0; i < scenes.length; i++) {
        var d = document.createElement('span');
        d.className = 'st-dot';
        ind.appendChild(d);
        dots.push(d);
      }
      stage.appendChild(ind);
    }
    if (capBox) {
      counter = document.createElement('span');
      counter.className = 'st-counter';
      counter.setAttribute('aria-hidden', 'true');
      capBox.appendChild(counter);
    }

    function reveal(n) {
      var img = scenes[n];
      if (!img) return;
      if (img.dataset.srcset) { img.setAttribute('srcset', img.dataset.srcset); delete img.dataset.srcset; }
      if (img.dataset.src) { img.setAttribute('src', img.dataset.src); delete img.dataset.src; }
    }

    function paint(idx) {
      current = idx;
      reveal(idx);
      if (idx > 0) reveal(idx + 1);
      for (i = 0; i < scenes.length; i++) {
        scenes[i].classList.toggle('active', i === idx);
        scenes[i].setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      }
      for (i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('on', i === idx);
      }
      for (i = 0; i < caps.length; i++) {
        caps[i].classList.toggle('active', i === idx);
        caps[i].setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      }
      if (counter) {
        counter.textContent = 'сцена ' + (idx + 1) + '/' + scenes.length;
      }
      if (!reduce) applyScale();
    }

    /* (а) наезд активной сцены: progress прокрутки шага 0→1 = scale 1→1.1 */
    function applyScale() {
      var step = steps[current];
      if (!step) return;
      var r = step.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var total = vh + r.height;
      var p = total > 0 ? (vh - r.top) / total : 0;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      var s = (1 + 0.1 * p).toFixed(4);
      for (i = 0; i < scenes.length; i++) {
        scenes[i].style.transform = i === current ? 'scale(' + s + ')' : 'scale(1)';
      }
    }

    function onScroll() {
      if (reduce || ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        applyScale();
        ticking = false;
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) paint(Number(e.target.dataset.idx));
        });
      }, { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    }

    if (!reduce) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
    window.addEventListener('scroll', function () { reveal(1); }, { passive: true, once: true });
    paint(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
