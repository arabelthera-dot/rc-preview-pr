/* museum-support.js — единый блок «Поддержать проект» для всех музеев.
   Эталон разметки и CSS — izobreteniya/day-05jan-shukhov.html (правка Сергея 31.07).

   Стандарт (PREFERENCES.md, правки Сергея 31.07 и 02.08):
     1. ГЛАВНЫЙ блок — в ПЕРВОЙ ТРЕТИ страницы (правка 02.08: «должно находиться в 1/3,
        внизу пусть остаётся дубляжом»). Не после «Итога дня» — тот уже в конце;
     2. блок в подвале — дубль, внутри «Куда дальше»;
     3. прилипшее сердечко «❤ Поддержать проект» справа снизу;
     4. название везде «Поддержать проект»; формулировка «дать денег» ЗАПРЕЩЕНА,
        третий способ — «поддержать проект рублём»;
     5. блок обязан ВЫДЕЛЯТЬСЯ из общего текста, но не резать глаз: золотая подложка,
        двойная рамка, левая золотая полоса, капс-заголовок Inter 10px / трекинг 3.4px.
        Стили идут с !important — иначе ручной CSS страницы (Айвазовский) красит блок
        в цвет фона и он сливается;
     6. светлая/тёмная тема определяется по фону страницы — цвет текста подбирается,
        а не берётся из --fg, которой на части страниц нет;
     7. ШРИФТ БЛОКА КОНТРАСТЕН ШРИФТУ СТРАНИЦЫ (правка Сергея 02.08). Жёстко заданный
        Playfair не годился: на Айвазовском текст Georgia, на v2 — Lora, оба серифные,
        и блок выглядел тем же шрифтом. Теперь класс шрифта страницы определяется на
        лету: сериф → блок гротеском (Inter), гротеск → блок серифом (Playfair).
        Цвет текста блока тоже сдвинут в тёплый (#f6ead2 против #e9e3d3 у статьи) —
        разница в 3 единицы, как было раньше, глазом не читается;
     8. ручные блоки старого образца («крошечная команда», кнопка «Как поддержать»)
        нормализуются в стандартную разметку — на месте, где стоят.

   Движок также ЧИНИТ вручную свёрстанные блоки: ссылка «Как поддержать»,
   ведущая на ../index.html (в превью-репо это страница парашюта Котельникова),
   заменяется на прокрутку к блоку поддержки. Баг найден Сергеем 02.08 на
   странице «Девятый вал».

   Подключение перед </body>:
     <script>window.MUSEUM_SUPPORT={
       museum:'Что изобрели русские первыми в мире',
       page:'странице Шухова',          // для темы письма
       peak:'#result'                    // необязательно: свой якорь ГЛАВНОГО блока
     };</script>
     <script src="../assets/museum-support.js"></script>
*/
(function(){
  var C = window.MUSEUM_SUPPORT || {};
  var doc = document, body = doc.body;
  if(!body) return;

  var MAIL   = C.mail   || 'arabelthera@gmail.com';
  var MUSEUM = C.museum || 'Русская цивилизация';
  var PAGE   = C.page   || doc.title;
  var EN     = (C.lang === 'en');

  var T = EN ? {
    label:'Support the project',
    heart:'Support the project',
    peak:'The museum is created by a small team. You can help in three ways: <b>share</b> this page, <b>report an inaccuracy</b>, or <b>support a new release</b>.',
    share:'⤴ Share this page',
    correct:'Report an inaccuracy',
    more:'Support a new release →',
    final:'The museum is created by a small team. You can support it in three ways — <b>share</b> the page with someone who will enjoy it; <b>help improve accuracy</b> if you spot a wrong date or figure (<a href="MAILTO">write to us</a>); <b>support a new release</b> — archive scans, filming and voice-over.',
    subject:MUSEUM + ' — note on ' + PAGE
  } : {
    label:'Поддержать проект',
    heart:'Поддержать проект',
    peak:'Музей создаёт небольшая команда. Поддержать проект можно тремя способами: <b>рассказать о странице</b>, <b>помочь исправить неточность</b> или <b>поддержать выпуск новых материалов</b>.',
    share:'⤴ Поделиться страницей',
    correct:'Сообщить об ошибке',
    more:'Поддержать выпуск →',
    final:'Музей создаёт небольшая команда. Поддержать его можно тремя способами — <b>рассказать</b> о странице; <b>помочь точности</b>, если нашли ошибку в дате или цифре (<a href="MAILTO">написать</a>); <b>поддержать выпуск новых материалов</b> — архивные сканы, съёмку и озвучку.',
    subject:'Музей «' + MUSEUM + '» — замечание по ' + PAGE
  };
  var MAILTO = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(T.subject);
  T.final = T.final.replace('MAILTO', MAILTO);

  /* ── тема страницы: светлая или тёмная (цвет текста нельзя брать из --fg) ── */
  function lum(c){
    var m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(c || '');
    if(!m) return null;
    if(m[4] !== undefined && parseFloat(m[4]) < 0.5) return null;   /* прозрачный фон */
    return (0.299*+m[1] + 0.587*+m[2] + 0.114*+m[3]) / 255;
  }
  var L = lum(getComputedStyle(body).backgroundColor);
  if(L === null) L = lum(getComputedStyle(doc.documentElement).backgroundColor);
  var LIGHT = (L !== null && L > 0.55);

  /* ── шрифт страницы: блок берёт ПРОТИВОПОЛОЖНЫЙ класс ──
     Georgia/Lora/PT Serif против Playfair — формально разные шрифты, глазом одинаковые. */
  function pageFont(){
    var p = doc.querySelector('article p, main p, section p, .wrap p, p');
    var f = p ? getComputedStyle(p).fontFamily : getComputedStyle(body).fontFamily;
    return f || '';
  }
  var PF = pageFont();
  /* решает ПЕРВОЕ семейство списка — оно и применяется. Хвост 'sans-serif' содержит
     подстроку 'serif', поэтому поиск по всей строке даёт ложный сериф (ловил на Шухове). */
  var FIRST = (PF.split(',')[0] || '').replace(/['"]/g, '').trim().toLowerCase();
  var SERIFS = /^(serif|georgia|lora|playfair|pt serif|merriweather|times|garamond|cormorant|literata|charter|noto serif|source serif|roboto slab|bitter|spectral|ibm plex serif|old standard|alegreya|ptserif)/;
  var SANSES = /^(sans-serif|system-ui|-apple-system|ui-sans|inter|roboto|helvetica|arial|segoe|open sans|montserrat|lato|pt sans|noto sans|manrope|rubik|golos|nunito|raleway|oswald|jost)/;
  var PAGE_SERIF = SERIFS.test(FIRST) ? true
    : SANSES.test(FIRST) ? false
    : /(^|,)\s*serif\s*$/i.test(PF);
  var FONT = PAGE_SERIF
    ? "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif"   /* страница серифом → блок гротеском */
    : "'Playfair Display',Georgia,serif";                        /* страница гротеском → блок серифом */
  var FSIZE = PAGE_SERIF ? '16.5px' : '17px';
  var MSIZE = PAGE_SERIF ? '16px' : '16.5px';   /* мобильный: у серифа кегль крупнее по рисунку */
  var FTRACK = PAGE_SERIF ? '.1px' : '0';
  var FLINE = PAGE_SERIF ? '1.58' : '1.62';

  /* цвет: заметный сдвиг в тёплый, а не оттенок того же бежевого, что у статьи */
  var FG   = LIGHT ? '#3b2c12' : '#f6ead2';       /* текст блока */
  var ACC  = LIGHT ? '#7a5a12' : '#e8c874';       /* выделения и ссылки */
  var LBL  = LIGHT ? '#8a6a1e' : '#d9b45c';       /* капс-заголовок */
  var BG1  = LIGHT ? 'rgba(201,168,76,.30)' : 'rgba(201,168,76,.24)';
  var BG2  = LIGHT ? 'rgba(201,168,76,.10)' : 'rgba(201,168,76,.06)';
  var BRD  = LIGHT ? 'rgba(150,116,30,.60)'  : 'rgba(201,168,76,.55)';
  var BTNB = LIGHT ? 'rgba(255,253,247,.92)' : 'rgba(18,21,28,.9)';
  var GLOW = LIGHT ? '0 2px 20px rgba(120,92,20,.14)' : '0 2px 22px rgba(0,0,0,.34),0 0 34px -14px rgba(201,168,76,.55)';

  /* ── шрифт качаем только тот, которым будет набран блок, и только если его нет ── */
  var NEED = PAGE_SERIF ? 'Inter' : 'Playfair';
  if(doc.documentElement.innerHTML.indexOf(NEED) < 0){
    var fl = doc.createElement('link');
    fl.rel = 'stylesheet';
    /* локальный fonts.css вместо fonts.googleapis.com (03.08): путь считаем от src самого движка,
       страницы лежат в подпапках музеев */
    var me = doc.currentScript || doc.querySelector('script[src*="museum-support"]');
    fl.href = (me ? me.src.replace(/museum-support\.js.*$/, '') : '../assets/') + 'fonts.css';
    doc.head.appendChild(fl);
  }

  /* ── CSS: !important, иначе ручной CSS страницы перекрашивает блок в фон ── */
  var I = ' !important;';
  var css = ''
  + '.support{position:relative' + I + 'display:block' + I
  + 'background:linear-gradient(180deg,' + BG1 + ',' + BG2 + ')' + I
  + 'border:1px solid ' + BRD + I + 'border-left:4px solid ' + LBL + I
  + 'border-radius:3px' + I + 'padding:24px 28px 22px' + I
  + 'margin:26px 0 22px' + I + 'scroll-margin-top:70px' + I
  + 'box-shadow:' + GLOW + I
  + 'font-family:' + FONT + I
  + 'font-size:' + FSIZE + I + 'line-height:' + FLINE + I + 'letter-spacing:' + FTRACK + I
  + 'text-align:left' + I + 'color:' + FG + I + '}'
  /* выпуск за колонку текста: блок читается как другой слой, а не как ещё одна карточка.
     Только на широком экране — на мобильном полей может не хватить и появится горизонтальная прокрутка. */
  + '@media(min-width:700px){.support{margin-left:-10px' + I + 'margin-right:-10px' + I + '}}'
  + ".support::before{content:''" + I + 'position:absolute' + I + 'inset:5px' + I
  + 'border:1px solid ' + (LIGHT ? 'rgba(150,116,30,.22)' : 'rgba(201,168,76,.18)') + I
  + 'border-radius:1px' + I + 'pointer-events:none' + I + '}'
  + '.support>*{position:relative' + I + '}'
  + ".support .sup-l{display:flex" + I + 'align-items:center' + I + 'gap:10px' + I
  + "font-family:'Inter',system-ui,sans-serif" + I + 'font-size:10px' + I
  + 'font-weight:700' + I + 'letter-spacing:3.4px' + I + 'text-transform:uppercase' + I
  + 'color:' + LBL + I + 'margin-bottom:11px' + I + '}'
  + ".support .sup-l::before{content:'❤'" + I + 'font-size:13px' + I + 'letter-spacing:0' + I + '}'
  + ".support .sup-l::after{content:''" + I + 'flex:1' + I + 'height:1px' + I
  + 'background:linear-gradient(90deg,' + BRD + ',transparent)' + I + '}'
  + '.support p{margin:0' + I + 'font-family:' + FONT + I + 'font-size:' + FSIZE + I
  + 'line-height:' + FLINE + I + 'letter-spacing:' + FTRACK + I + 'color:' + FG + I + '}'
  + '.support b{color:' + ACC + I + 'font-weight:700' + I + '}'
  + '.support a{color:' + ACC + I + '}'
  + ".support .sup-btns{display:flex" + I + 'gap:10px' + I + 'flex-wrap:wrap' + I
  + 'margin-top:15px' + I + "font-family:'Inter',system-ui,sans-serif" + I + '}'
  + '.support .sup-btns button,.support .sup-btns .sup-action{background:' + BTNB + I + 'border:1px solid ' + BRD + I
  + 'color:' + ACC + I + 'border-radius:22px' + I + 'padding:10px 17px' + I
  + 'font-size:14px' + I + 'cursor:pointer' + I + 'transition:background .2s' + I
  + 'text-decoration:none' + I + 'display:inline-flex' + I + 'align-items:center' + I + '}'
  + '.support .sup-btns button.gold{background:rgba(201,168,76,' + (LIGHT ? '.26' : '.18') + ')' + I + '}'
  + '.support .sup-btns button:hover,.support .sup-btns .sup-action:hover{background:rgba(201,168,76,' + (LIGHT ? '.36' : '.28') + ')' + I + '}'
  + '@media(max-width:600px){.support{padding:20px 18px' + I + 'font-size:' + MSIZE + I + '}'
  + '.support p{font-size:' + MSIZE + I + '}}'
  + "#heart{position:fixed;right:12px;bottom:82px;z-index:60;background:rgba(6,12,23,.92);border:1px solid rgba(201,168,76,.35);"
  + 'border-radius:26px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:17px;'
  + "color:#c8a24a;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);overflow:hidden;font-family:'Inter',system-ui,sans-serif;"
  + 'transition:transform .35s ease,width .3s ease,opacity .3s ease}'
  + '#heart .lbl{display:none;white-space:nowrap;margin-left:7px;font-size:13px;letter-spacing:.3px}'
  + '#heart.wide{width:auto;padding:0 17px}#heart.wide .lbl{display:inline}'
  + '#heart.tuck{transform:translateY(96px);opacity:0;pointer-events:none}'
  /* в первом экране блока поддержки ещё не было, а сердечко перекрывало текст этикетки
     сцены на 390 px (разбор Шухова 04.08) — до 0.6 экрана прокрутки его нет */
  + '#heart.atop{transform:translateY(96px);opacity:0;pointer-events:none}';
  var st = doc.createElement('style'); st.id = 'sup-css'; st.textContent = css;
  doc.head.appendChild(st);

  /* ── разметка блоков ── */
  function peakBlock(){
    var d = doc.createElement('div'); d.className = 'support';
    d.innerHTML = '<div class="sup-l">' + T.label + '</div><p>' + T.peak + '</p>'
      + '<div class="sup-btns">'
      + '<button class="gold" data-sup-share>' + T.share + '</button>'
      + '<a class="sup-action" href="' + MAILTO + '">' + T.correct + '</a>'
      + '<button data-sup-more>' + T.more + '</button></div>';
    return d;
  }
  function finalBlock(){
    var d = doc.createElement('div'); d.className = 'support';
    d.innerHTML = '<div class="sup-l">' + T.label + '</div><p>' + T.final + '</p>';
    return d;
  }

  function pick(sel){ for(var i=0;i<sel.length;i++){ var e=doc.querySelector(sel[i]); if(e) return e; } return null; }
  function hasSupport(el){ return !!(el && el.querySelector && el.querySelector('.support')); }
  function topOf(el){ var r = el.getBoundingClientRect(); return r.top + window.scrollY; }

  /* ── 0. ручные блоки старого образца → стандартная разметка на том же месте ──
        Айвазовский: «Музей делает крошечная команда» + кнопка «❤ Как поддержать»,
        без капс-заголовка и без трёх способов поддержки (правка Сергея 02.08). */
  var H0 = Math.max(doc.documentElement.scrollHeight, body.scrollHeight, 1);
  [].slice.call(doc.querySelectorAll('.support')).forEach(function(el){
    if(el.querySelector('.sup-l')) return;                       /* уже по стандарту */
    var top = el.getBoundingClientRect().top + window.scrollY;
    el.innerHTML = (top < H0 * 0.40 ? peakBlock() : finalBlock()).innerHTML;
  });

  /* чиним битые ссылки: href="../index.html" вёл на корень превью —
     страницу парашюта Котельникова. */
  [].slice.call(doc.querySelectorAll('.support a')).forEach(function(a){
    var h = a.getAttribute('href') || '';
    if(/(^|\/)index\.html?($|[?#])/i.test(h) || h === '../' || h === './'){
      a.setAttribute('href', '#support');
      a.dataset.supScroll = '1';
    }
  });

  /* ── 1. ГЛАВНЫЙ блок — в первой трети страницы ──
     placePeak() вызывается повторно после отрисовки: календари строят сетку скриптом,
     и при первом проходе высота страницы в разы меньше итоговой (ловил 02.08). */
  var DOCH = Math.max(doc.documentElement.scrollHeight, body.scrollHeight, 1);
  var peakHolder = null, peakEl = null;

  function placePeak(){
    /* место размечено в вёрстке (<div data-support-slot>) — блок встаёт туда один раз и больше
       не двигается: перестановка после дорисовки сетки календаря давала сдвиг вёрстки
       (CLS 0,26 на календаре костюма, 14.10). Резерв высоты слота — в CSS страницы. */
    var slot = doc.querySelector('[data-support-slot]');
    if(slot){
      if(!peakEl){
        peakEl = peakBlock();
        if(!doc.getElementById('support')) peakEl.id = 'support';
        slot.appendChild(peakEl);
      }
      return;
    }
    DOCH = Math.max(doc.documentElement.scrollHeight, body.scrollHeight, 1);
    var others = [].slice.call(doc.querySelectorAll('.support')).filter(function(e){ return e !== peakEl; });
    if(others.some(function(e){ return topOf(e) < DOCH * 0.40; })){   /* уже есть ручной блок вверху */
      if(peakHolder && peakHolder.parentNode) peakHolder.parentNode.removeChild(peakHolder);
      peakHolder = null; peakEl = null;
      return;
    }
    if(peakEl){                                    /* блок уже стоит и стоит верно — не трогаем */
      var tp = topOf(peakEl);
      if(tp >= DOCH * 0.10 && tp <= DOCH * 0.40) return;
    }
    var anchor = C.peak ? doc.querySelector(C.peak) : null;
    /* заданный якорь годится, только если он сам в первой трети (на Шухове #result на 84%) */
    if(anchor && topOf(anchor) > DOCH * 0.40) anchor = null;
    if(!anchor){
      /* Универсальный поиск: крупный смысловой блок, который ЗАКАНЧИВАЕТСЯ в первой трети.
         Работает и на страницах дня (section), и на индексах, где весь контент —
         один div на 50 000px и секций нет вовсе (izobreteniya/index.html). */
      var host0 = doc.querySelector('main') || body;
      var cands = [].slice.call(host0.querySelectorAll('section, article, div, li, p, figure'))
        .filter(function(e){
          if(e.offsetHeight < 110 || hasSupport(e) || e.closest('.support')) return false;
          if(e.id === 'heart' || e.closest('footer, header, nav')) return false;
          var bot = topOf(e) + e.offsetHeight;
          return bot >= DOCH * 0.16 && bot <= DOCH * 0.36;   /* низ — в первой трети */
        });
      /* из подходящих берём самый крупный: это верхний смысловой блок, а не строчка внутри */
      cands.sort(function(a, b){ return b.offsetHeight - a.offsetHeight; });
      anchor = cands[0] || null;
      /* короткая страница-сетка (календарь): ни один блок не кончается в первой трети —
         берём тот, что в первой трети НАЧИНАЕТСЯ, и ставим блок перед ним */
      if(!anchor){
        var c2 = [].slice.call(host0.querySelectorAll('section, article, div, figure'))
          .filter(function(e){
            if(e.offsetHeight < 110 || hasSupport(e) || e.closest('.support')) return false;
            if(e.id === 'heart' || e.closest('footer, header, nav')) return false;
            var t = topOf(e);
            return t >= DOCH * 0.12 && t <= DOCH * 0.36;
          });
        c2.sort(function(a, b){ return b.offsetHeight - a.offsetHeight; });
        if(c2[0]){ anchor = c2[0]; anchor.dataset.supBefore = '1'; }
      }
    }
    if(!anchor) return;

    if(!peakEl){
      peakEl = peakBlock();
      if(!doc.getElementById('support')) peakEl.id = 'support';   /* якорь для href="#support" */
      peakHolder = doc.createElement('div');
      peakHolder.style.cssText = 'max-width:860px;margin:0 auto;padding:0 18px';
      peakHolder.appendChild(peakEl);
    }
    if(C.peak && anchor === doc.querySelector(C.peak)){
      (anchor.querySelector('.wrap') || anchor).appendChild(peakHolder);
    } else {
      var host = anchor.parentNode;
      host.insertBefore(peakHolder, anchor.dataset.supBefore ? anchor : anchor.nextSibling);
      /* секция оказалась длинной и блок уехал вниз — ставим его ПЕРЕД секцией,
         но не выше 10%: над первым экраном блок режет глаз и мешает входу в тему */
      if(topOf(peakEl) > DOCH * 0.38 && topOf(anchor) < DOCH * 0.38){
        host.insertBefore(peakHolder, anchor);
        if(topOf(peakEl) < DOCH * 0.10) host.insertBefore(peakHolder, anchor.nextSibling);
      }
    }
  }

  placePeak();
  /* повторы: сетка календаря и ленивые картинки меняют высоту уже после первого прохода */
  window.addEventListener('load', function(){ placePeak(); setTimeout(placePeak, 900); });
  setTimeout(placePeak, 1400);

  /* ── 2. блок в подвале: дубль внутри «Куда дальше», иначе перед футером ── */
  var tail = pick(['#kuda-dalshe','#kuda','.kuda-dalshe']);
  var sups1 = [].slice.call(doc.querySelectorAll('.support'));
  var haveLate = sups1.some(function(e){ return topOf(e) > DOCH * 0.62; });
  if(!haveLate){
    if(tail && !hasSupport(tail)){
      (tail.querySelector('.wrap') || tail).appendChild(finalBlock());
    } else if(!tail){
      var ft = doc.querySelector('footer');
      var sec = doc.createElement('section');
      sec.style.cssText = 'padding:0 18px 26px;max-width:860px;margin:0 auto';
      sec.appendChild(finalBlock());
      if(ft) ft.parentNode.insertBefore(sec, ft); else body.appendChild(sec);
    }
  }

  /* ── 2б. СТАНДАРТ: ровно два размещения — первая треть и подвал (правка Сергея 02.08).
        Третий блок появлялся, когда ручной блок страницы уезжал из первой трети
        на узком экране и движок ставил свой сверху. Средние снимаем. ── */
  function keepTwo(){
    var all = [].slice.call(doc.querySelectorAll('.support'));
    if(all.length <= 2) return;
    all.slice(1, -1).forEach(function(el){
      if(el === peakEl) return;                 /* главный блок первой трети не трогаем */
      var box = el.parentNode;
      el.parentNode.removeChild(el);
      if(box && box !== body && box !== peakHolder && !box.children.length && box.parentNode)
        box.parentNode.removeChild(box);        /* пустая обёртка-холдер */
    });
  }
  keepTwo();
  window.addEventListener('load', function(){ keepTwo(); setTimeout(keepTwo, 1000); });
  setTimeout(keepTwo, 1500);

  /* ── 3. кнопки внутри блоков ── */
  var sups = [].slice.call(doc.querySelectorAll('.support'));
  if(!doc.getElementById('support') && sups.length) sups[0].id = 'support';

  function scrollToLast(){
    var all = doc.querySelectorAll('.support');
    var last = all[all.length-1];
    if(last) last.scrollIntoView({behavior:'smooth', block:'center'});
  }
  /* делегирование: блок может появиться позже (повторный placePeak на календарях) */
  body.addEventListener('click', function(ev){
    var t = ev.target;
    var share = t.closest && t.closest('[data-sup-share]');
    if(share){
      if(navigator.share) navigator.share({title:doc.title, url:location.href}).catch(function(){});
      else if(navigator.clipboard) navigator.clipboard.writeText(location.href).then(function(){
        share.textContent = EN ? 'Link copied ✓' : 'Ссылка скопирована ✓'; });
      if(typeof window.award === 'function') window.award('share', 5);
      return;
    }
    if(t.closest && (t.closest('[data-sup-more]') || t.closest('.support a[data-sup-scroll]'))){
      ev.preventDefault(); scrollToLast();
    }
  });

  /* ── 4. прилипшее сердечко ── */
  var h = doc.getElementById('heart');
  if(!h){
    h = doc.createElement('div');
    h.id = 'heart'; h.title = T.heart;
    h.setAttribute('role', 'complementary');
    h.setAttribute('aria-label', T.heart);
    h.innerHTML = '❤<span class="lbl">' + T.heart + '</span>';
    body.appendChild(h);
  } else {
    h.title = T.heart;
    h.setAttribute('role', 'complementary');
    h.setAttribute('aria-label', T.heart);
    var lbl = h.querySelector('.lbl');
    if(lbl) lbl.textContent = T.heart;       /* приводим подпись к стандарту */
  }
  /* сердечко прячется в первом экране — работает и там, где оно вшито в HTML */
  (function(){
    function topGuard(){
      h.classList.toggle('atop', (window.scrollY || 0) < (window.innerHeight || 700) * 0.6);
    }
    topGuard();
    window.addEventListener('scroll', topGuard, {passive:true});
    window.addEventListener('resize', topGuard);
  })();

  if(!h.dataset.supBound && C.heartBound !== true){   /* heartBound:true — сердечко уже привязано в HTML */
    h.dataset.supBound = '1';
    h.addEventListener('click', function(){
      var s = sups.filter(function(e){ return e.getBoundingClientRect().top > 60; })[0] || sups[sups.length-1];
      if(s) s.scrollIntoView({behavior:'smooth', block:'center'});
    });
    var last = window.scrollY, t = null;
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y > last + 6) h.classList.add('tuck'); else if(y < last - 6) h.classList.remove('tuck');
      last = y; clearTimeout(t); t = setTimeout(function(){ h.classList.remove('tuck'); }, 700);
      h.classList.toggle('wide', sups.some(function(e){
        var r = e.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; }));
    }, {passive:true});
  }
})();
