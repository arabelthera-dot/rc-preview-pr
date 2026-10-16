/* museum-chrome.js — единая обвязка страницы экспоната для всех музеев.
   Эталон разметки и CSS — pervoprohodcy/exp-dezhnev-1648.html (аудит 30.07).

   Даёт пять элементов стандарта + анти-тупик:
     1. .backbtn «← [Музей]» в шапке
     2. .sharerow с #sharebtn «⤴ Поделиться страницей» (+ дубль #sharefinal, если есть в HTML)
     3. #secnav — липкие чипсы разделов с полосой прочитанного
     4. прилипшие стрелки «← пред · след →»
     5. строка «🎲 Случайное · Все экспонаты · В город-музей» в блоке «Куда дальше»

   Ничего не дублирует: если элемент уже есть в HTML — движок его не трогает,
   только доводит поведение (share, подсветка чипсов).

   Подключение перед </body>:
     <script>window.MUSEUM_CHROME={
       museum:{title:'Музей изобретений',href:'index.html'},
       share:{title:'…',text:'…'},
       prev:{href:'day-04jan-pilchikov.html',title:'4 января · Пильчиков'},
       next:{href:'day-06jan-bering.html',title:'6 января · Беринг'},
       all:{href:'index.html',label:'Все изобретения'},
       city:'../../index.html',
       random:['day-01jan-cabletv.html','…']
     };</script>
     <script src="../../assets/museum-chrome.js"></script>
*/
(function(){
  var C = window.MUSEUM_CHROME || {};
  var M = C.museum || {};
  var T = C.t || {};                       /* подписи: RU по умолчанию, EN-версия шлёт свои */
  var doc = document, body = doc.body;
  if(!body) return;

  /* ── подписи чипсов по id секции: единые для трёх музеев ── */
  var LABEL = {
    'video':'Ролик','rolik':'Ролик','rolik-kartiny':'Ролик','film':'Ролик',
    'audioguide':'Аудиогид','audiogid':'Аудиогид',
    'glubokiy-zum':'Зум','zum-po-polotnu':'Зум','zoomwrap':'Зум',
    'kartina-i-hudozhnik':'Картина','story':'История','istoriya':'История',
    'put':'Маршрут','routewrap':'Маршрут','atlas':'Атлас',
    'trudno-poverit':'Факты','more':'Ещё','theme-inventions':'Тема',
    /* 03.08: секции, которые выпадали из панели на всех трёх флагманах */
    'chto-zametit':'Детали','mirovoy-kontekst':'Мир','scene-baku':'Сцена',
    'kontekst':'Мир','razbor':'Разбор',
    'chat':'Интервью','chat-sec':'Интервью',
    'game':'Игра','games':'Игры','pohod':'Игра','geom-sec':'Игра',
    'game-trajectory':'Игра','game-landing':'Игра','assemble':'Сборка',
    'quiz':'Викторина','quiz-sec':'Викторина','sharada':'Шарада','myth-sec':'Мифы',
    'fork':'Развилка','excursion':'Экскурсия','result':'Итог','calendar':'Календарь'
  };
  var SKIP = {'catalog':1,'kuda-dalshe':1,'final':1};

  /* ── CSS: в assets/museum-chrome.css. Страница подключает его в <head>, чтобы стили были
     на месте до первой отрисовки: строка, вставленная отсюда после отрисовки, меняла высоту
     шапки и крошек, и обложка уезжала (Lighthouse 16.10.2026: CLS 0.17–0.21). Где ссылки
     в <head> ещё нет — подключаем тот же файл сами, рядом с этим скриптом. Динамический
     stylesheet держит событие load, так что расчёт обложки (fitHero на load) видит стили;
     resize после загрузки пересчитывает липкую навигацию. ── */
  (function(){
    if(doc.querySelector('link[href*="museum-chrome.css"]')) return;
    var me = doc.currentScript || doc.querySelector('script[src*="museum-chrome.js"]');
    var ln = doc.createElement('link'); ln.rel = 'stylesheet';
    ln.href = me && me.src ? me.src.replace(/museum-chrome\.js(\?.*)?$/, 'museum-chrome.css') : '../../assets/museum-chrome.css';
    ln.onload = function(){ window.dispatchEvent(new Event('resize')); };
    doc.head.appendChild(ln);
  })();

  function el(tag, cls, html){var e=doc.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e;}

  /* ── 0-бис. строка слогана портала в шапке ──
     Слоган портала один на все музеи и меняться не может (museum-core, раздел 6-бис),
     поэтому текст живёт здесь, а не в конфиге страницы. Переопределение — только для
     иноязычной версии через C.t.slogan. Если строка уже стоит в HTML (эталон Шухова) —
     движок её не трогает, как и любой другой готовый элемент. */
  /* Одной строкой, без склейки: аудитор ищет слоган в тексте этого файла (slogan_ok
     в tools/audit-pages.py), разорванная конкатенацией строка ему не видна. */
  var SLOGAN = 'Первый цифровой музей достижений России · Цивилизация первенств — что Россия дала миру раньше всех';
  (function(){
    var head = doc.querySelector('header.top') || doc.querySelector('header.site');
    if(!head) return;
    if(!head.querySelector('.b2')) head.appendChild(el('div','b2', T.slogan || SLOGAN));
    /* сжатие только у липкой шапки: обычная уезжает при прокрутке сама */
    if((doc.defaultView.getComputedStyle(head).position || '') !== 'sticky') return;
    var shrunk = false;
    doc.defaultView.addEventListener('scroll', function(){
      var need = (doc.defaultView.pageYOffset || 0) > 90;
      if(need === shrunk) return;
      shrunk = need;
      head.classList[need ? 'add' : 'remove']('mc-shrink');
    }, {passive:true});
  })();

  /* ── 0-тер. две кнопки первого экрана ── маркер для аудитора: MC_BUILDS_HERO_BTNS
     Блок одинаков на всех страницах дня (эталон — day-05jan-shukhov.html), поэтому его
     строит движок, а не копия разметки в каждом файле (договор о приёмке, п. 10).
     Условия жёсткие: есть куда вставить (.hero-lead), нечего дублировать (нет .hero-btns)
     и есть КУДА вести — обе цели, #story и #audioguide, существуют на странице. Цели нет —
     не строим ничего: кнопка в никуда хуже отсутствующей кнопки (запрет заглушек, 06.09.2026).
     Стоит ДО fitHero: расчёт первого экрана меряет сгиб по низу .hero-btns. */
  (function(){
    var lead = doc.querySelector('.hero-lead') || doc.querySelector('.hero-text');
    if(!lead) return;
    /* усыновление чужой разметки (замер gap-parts.mjs 09.09.2026): на 7 страницах кнопки
       первого экрана лежали в безымянном <div style="display:flex"> — движок их не видел,
       строил ВТОРУЮ пару тех же кнопок, и расчёт сгиба мерил по ней: низ уезжал на 1003 px
       при экране 844. Блок с двумя и более .btn внутри подводки — это и есть кнопки
       первого экрана: помечаем его классом, дубль не строится, сгиб меряется по правде. */
    if(!doc.querySelector('.hero-btns')){
      var cand = lead.querySelectorAll('div, p');
      for(var i=0;i<cand.length;i++){
        if(cand[i].querySelectorAll(':scope > .btn, :scope > button, :scope > a.btn').length >= 2){
          cand[i].className = (cand[i].className ? cand[i].className + ' ' : '') + 'hero-btns';
          break;
        }
      }
    }
    if(doc.querySelector('.hero-btns')) return;
    if(!doc.getElementById('story') || !doc.getElementById('audioguide')) return;
    var box = el('div', 'hero-btns',
      '<button class="btn gold" type="button" data-mc-to="story">'
      + (T.readStory || 'Читать историю ↓') + '</button>'
      + '<button class="btn ghost" type="button" data-mc-to="audioguide">'
      + (T.listenGuide || '🎧 Слушать аудиогид') + '</button>');
    box.addEventListener('click', function(e){
      var b = e.target && e.target.closest ? e.target.closest('[data-mc-to]') : null;
      if(!b) return;
      var t = doc.getElementById(b.getAttribute('data-mc-to'));
      if(t) t.scrollIntoView({behavior:'smooth'});
    });
    lead.appendChild(box);
  })();

  /* ── 0. высота обложки: сцена + этикетка + заголовок + кнопки влезают в первый экран ──
     Считаем от реального верха визуала, поэтому работает при любой шапке и на любом экране.
     Резерв под этикетку сцены и первую строку h1 — 26% высоты окна, но не меньше 150 и не больше 210. */
  function fitHero(){
    var v = doc.querySelector('.hero-scene, .hero-visual, .hero .bg');
    /* вторая раскладка обложки (Луна-1, Луна-9, Лобачевский): визуал — сам блок .hero,
       заголовок лежит снаружи, в .hero-text. Ограничивать высоту можно ТОЛЬКО когда внутри
       .hero нет текста: иначе max-height обрежет заголовок вместо того, чтобы поднять его. */
    if(!v){
      var hero = doc.querySelector('.hero');
      if(hero && !hero.querySelector('h1, .hero-lead, .hero-text, .hook')){
        hero.className += ' mc-cover'; v = hero;
      }
    }
    if(!v) return;
    var vh = window.innerHeight || 700, y = window.pageYOffset || 0;
    var vr = v.getBoundingClientRect(), top = vr.top + y;
    /* Нижняя граница первого экрана — не заголовок, а ДВЕ КНОПКИ под ним (museum-core, 6-бис
       п.5: «кнопки, уехавшие за сгиб, считаются отсутствующими»). Замер 08.09.2026 на 390×844:
       у эталона Шухова низ .hero-btns был на 938 px при экране 844 — резерв считался по h1
       и про кнопки не знал. Нет кнопок в разметке — планка прежняя, по заголовку. */
    var h1 = doc.querySelector('h1'), last = doc.querySelector('.hero-btns') || h1, reserve = 0;
    if(h1 && last){
      var hr = h1.getBoundingClientRect(), lr = last.getBoundingClientRect();
      var gap = (hr.top + y) - (vr.bottom + y);   /* этикетка сцены, дата, имя — всё между */
      /* в первый экран должен попасть ВЕСЬ заголовок и начало хука, а не верхние 40 px строки:
         замер 04.08 — при резерве в одну строку у Шухова на 390 px было видно 41 px из h1 */
      var need = ((lr.bottom + y) - (hr.top + y)) + 28;
      /* gap < 0 — старый формат, где заголовок лежит внутри обложки: там резерв не нужен */
      /* потолок резерва 0.70 vh (было 0.58): при 0.58 кнопкам Шухова не хватало 94 px и они
         оставались за сгибом даже после учёта их высоты. Нижний предел сцены (200 px) держит
         обложку от вырождения в полоску, поэтому потолок можно поднимать безопасно. */
      if(gap > 0) reserve = Math.min(Math.round(vh * 0.70), gap + need);
    }
    if(!reserve) reserve = Math.max(150, Math.min(210, Math.round(vh * 0.26)));
    var h = Math.max(200, Math.round(vh - top - reserve));
    doc.documentElement.style.setProperty('--hero-fit', h + 'px');
  }
  fitHero();
  window.addEventListener('load', function(){ fitHero(); window.dispatchEvent(new Event('resize')); });
  var fitT; window.addEventListener('resize', function(){
    clearTimeout(fitT); fitT = setTimeout(fitHero, 160);
  });

  /* ── 1. кнопка возврата в музей ──
     Крошки ведут в тот же музей тем же текстом, поэтому кнопка при них — третий повтор
     названия в шапке и лишние 55 px до заголовка (разбор Шухова, 04.08). */
  var crumbHome = doc.querySelector('nav.crumbs a[href="' + (M.href || '') + '"]');
  var oldBack = doc.querySelector('.backbtn');
  if(oldBack && crumbHome && oldBack.getAttribute('href') === M.href && oldBack.parentNode){
    oldBack.parentNode.removeChild(oldBack);   /* кнопка, вшитая в HTML до появления крошек */
    oldBack = null;
  }
  if(!oldBack && M.href && !crumbHome){
    var back = el('a','backbtn','<span class="ar">←</span>'+(M.title||'Музей'));
    back.href = M.href;
    body.insertBefore(back, body.firstChild);
  }

  /* ── 2. строка «Поделиться» — сразу под обложкой ── */
  var anchor = doc.querySelector('.hero') || doc.querySelector('nav.crumbs') || doc.querySelector('header');
  var madeShare = false;
  if(!doc.querySelector('.sharerow') && anchor && anchor.parentNode){
    madeShare = true;
    var srow = el('div','sharerow',
      '<button class="sharebtn" type="button" id="sharebtn"><span>⤴</span>'+(T.share||'Поделиться страницей')+'</button>'
      + '<span class="sharehint" id="sharehint"></span>');
    anchor.parentNode.insertBefore(srow, anchor.nextSibling);
  }
  /* обработчик вешаем только на свою кнопку: где .sharerow был в HTML, там уже есть свой скрипт */
  if(madeShare) (function(){
    var h = doc.getElementById('sharehint');
    function hint(t){if(!h)return; h.textContent=t; h.style.display='inline';
      setTimeout(function(){h.style.display='none';}, 2800);}
    function share(){
      var url = location.href.split('#')[0];
      var s = C.share || {};
      var payload = {title: s.title || doc.title, text: s.text || '', url: url};
      if(navigator.share){navigator.share(payload).catch(function(){}); return;}
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){hint('Ссылка скопирована');}, function(){hint(url);});
        return;
      }
      hint(url);
    }
    ['sharebtn','sharefinal'].forEach(function(id){
      var b = doc.getElementById(id); if(b) b.addEventListener('click', share);
    });
  })();

  /* ── 3. липкие чипсы разделов ── */
  var nav = doc.getElementById('secnav');
  if(!nav){
    var secs = [].slice.call(doc.querySelectorAll('section[id],div[id="routewrap"],div[id="zoomwrap"]'));
    var chips = [];
    secs.forEach(function(s){
      var id = s.id;
      if(!id || SKIP[id]) return;
      if(Array.isArray(C.navIds) && C.navIds.indexOf(id) === -1) return;
      var lab = s.getAttribute('data-nav') || (C.labels && C.labels[id]) || LABEL[id];
      if(!lab) return;
      if(chips.some(function(c){return c.lab === lab;})) return;   /* «Игра 1/2» — один чип */
      chips.push({id:id, lab:lab});
    });
    if(chips.length > 2){
      nav = el('nav'); nav.id = 'secnav'; nav.setAttribute('aria-label','Разделы страницы');
      var row = el('div','row');
      if(M.href && C.showMuseumHome !== false){var hm = el('a','home', M.homeLabel || '← Музей'); hm.href = M.href; row.appendChild(hm);}
      chips.forEach(function(c){var a = el('a', null, c.lab); a.href = '#'+c.id; row.appendChild(a);});
      nav.appendChild(row);
      var prog = el('div','prog'); prog.id = 'secprog'; nav.appendChild(prog);
      /* страницы дней носят урезанную .daynav (6 ссылок, без «← Музей», подсветки и прогресса) —
         занимаем её место, чтобы не было двух липких панелей друг на друге */
      var old = doc.querySelector('.daynav');
      if(old && old.parentNode){
        old.parentNode.insertBefore(nav, old);
        old.parentNode.removeChild(old);
      } else {
        var host = doc.querySelector('.sharerow') || anchor;
        if(host && host.parentNode) host.parentNode.insertBefore(nav, host.nextSibling);
        else body.insertBefore(nav, body.firstChild);
      }
      /* если шапка сама липкая — встаём под неё, а не поверх */
      var top = 0;
      [].slice.call(doc.querySelectorAll('header')).forEach(function(hd){
        var cs = getComputedStyle(hd);
        if(cs.position === 'sticky' && parseInt(cs.top || '0', 10) === 0) top = Math.max(top, hd.offsetHeight);
      });
      if(top){
        nav.style.top = top + 'px';
        nav.style.zIndex = '25';
        var sm = doc.createElement('style');
        sm.textContent = 'section[id]{scroll-margin-top:' + (top + 52) + 'px}';
        doc.head.appendChild(sm);
      }
    }
  }
  if(nav){
    var nrow = nav.querySelector('.row'), nprog = doc.getElementById('secprog');
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var targets = links.map(function(a){return doc.getElementById(a.getAttribute('href').slice(1));});
    var navH = nav.offsetHeight, tick = 0;
    var upd = function(){
      var y = window.scrollY || doc.documentElement.scrollTop;
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? Math.min(100, y / h * 100) : 0;
      if(nprog) nprog.style.width = pct.toFixed(1) + '%';
      var cur = -1;
      for(var i=0;i<targets.length;i++){
        if(targets[i] && targets[i].getBoundingClientRect().top <= navH + 50) cur = i;
      }
      for(var j=0;j<links.length;j++) links[j].classList.toggle('on', j === cur);
      if(cur > -1 && nrow && !C.stableNav){
        var a = links[cur], l = a.offsetLeft, r = l + a.offsetWidth;
        if(l < nrow.scrollLeft + 10) nrow.scrollLeft = Math.max(0, l - 14);
        else if(r > nrow.scrollLeft + nrow.clientWidth - 10) nrow.scrollLeft = r - nrow.clientWidth + 14;
      }
      /* стрелки показываем, когда читатель уже втянулся: страницы дней длинные,
         поэтому порог в абсолютной прокрутке, а не в процентах */
      if(arrows.length){
        var on = y > window.innerHeight * 0.8;
        arrows.forEach(function(x){x.classList.toggle('show', on);});
      }
    };
    var arrows = [];

    /* ── 4. прилипшие стрелки «пред / след» ── */
    [['prev','←',C.prev],['next','→',C.next]].forEach(function(cfg){
      var d = cfg[2]; if(!d || !d.href) return;
      if(doc.querySelector('.mcnav.'+cfg[0])) return;
      var a = el('a','mcnav '+cfg[0]);
      a.href = d.href;
      a.setAttribute('aria-label', (cfg[0]==='prev'?'Предыдущий экспонат: ':'Следующий экспонат: ')+(d.title||''));
      var ar = el('span','ar', cfg[1]), tx = el('span','tx', d.title || '');
      if(cfg[0]==='prev'){a.appendChild(ar); a.appendChild(tx);} else {a.appendChild(tx); a.appendChild(ar);}
      body.appendChild(a); arrows.push(a);
    });

    addEventListener('scroll', function(){
      if(tick) return;
      tick = requestAnimationFrame(function(){tick = 0; upd();});
    }, {passive:true});
    addEventListener('resize', function(){navH = nav.offsetHeight; upd();});
    upd();
  }

  /* ── 5. строка «Случайное · Все экспонаты · В город-музей» ── */
  (function(){
    if(doc.querySelector('.wayrow')) return;
    var all = C.all || (M.href ? {href:M.href, label:'Все экспонаты'} : null);
    var pool = (C.random || []).filter(function(u){
      return u.split('/').pop() !== location.pathname.split('/').pop();
    });
    var row = el('div','wayrow');
    if(pool.length){
      var d = el('a','dice', T.dice || '🎲 Случайное');
      d.href = '#';
      d.addEventListener('click', function(e){
        e.preventDefault();
        location.href = pool[Math.floor(Math.random() * pool.length)];
      });
      row.appendChild(d);
    }
    if(all && all.href){var a2 = el('a', null, all.label || T.all || 'Все экспонаты'); a2.href = all.href; row.appendChild(a2);}
    var city = C.city || '../../index.html';
    var a3 = el('a', null, T.city || 'В город-музей'); a3.href = city; row.appendChild(a3);
    if(row.children.length < 2) return;

    /* по стандарту строка живёт в блоке «Куда дальше»; где его нет —
       ставим её после последнего смыслового блока, а не внутрь чужой секции */
    var inside = doc.getElementById('kuda-dalshe');
    var after = doc.getElementById('catalog') || doc.getElementById('calendar');
    if(inside) inside.appendChild(row);
    else if(after && after.parentNode) after.parentNode.insertBefore(row, after.nextSibling);
    else body.appendChild(row);
  })();
})();
