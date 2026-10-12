/* museum-ozhivshaya-scena.js — M-76 «Ожившая сцена» для музея «Русские не сдаются».
   В реестре M-76 была 💡 («кадр подсвечивается и зумится по мере скролла с голосом аудиогида»,
   апгрейд M-73 scrolltelling); здесь — первая реализация из конфига.

   Один кадр стоит на месте (sticky), под ним — такты сцены. Посетитель листает такты, и кадр
   «оживает»: плавно наезжает на точку такта (Ken Burns), вокруг неё гаснет свет, на табло — время
   такта по источнику. Тревожный такт (tone:'alarm') подсвечен красным. Такты можно листать
   кнопками «Назад/Дальше» и клавишами ←/→ на сцене. Кнопка «Слушать» включает аудиогид
   страницы с остановки текущего такта — пока голос звучит, сцена идёт за ним (такт с той же
   остановкой). Пройдены все такты — открывается финал.

   Подключение — внутри секции:
     <section class="block" id="scena">
       ...
       <div class="oz-box"></div>
       <noscript>…текстовый эквивалент всех тактов…</noscript>
     </section>
     <script>window.MUSEUM_OZHIVSHAYA_SCENA={
       mount:'scena', title:'…', image:'kadr.jpg', width:1600, height:589,
       alt:'Что на кадре — для чтеца экрана', credit:'Автор, год. Основание прав.',
       ratio:'4/3',            // окно сцены; кадр заполняет его целиком
       beats:[ {time:'11:28:13', title:'…', text:'…', x:240, y:230, scale:1.8, tone:'alarm', stop:0} ],
               // x/y — точка в пикселях кадра; scale — наезд (1 — кадр заполняет окно, 0 — кадр целиком);
               // stop — номер остановки аудиогида (с нуля), необязательно
       finale:{ title:'…', text:'…', src:'…' }
     };</script>
     <script src="../../assets/museum-ozhivshaya-scena.js"></script>

   Нет секции, конфига или .oz-box, либо сцена уже стоит — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_OZHIVSHAYA_SCENA;
  if(!CFG || !CFG.image || !CFG.beats || !CFG.beats.length) return;
  var host = document.getElementById(CFG.mount || 'scena');
  if(!host) return;
  var box = host.querySelector('.oz-box');
  if(!box || box.querySelector('.oz-stage')) return;

  var W = CFG.width, H = CFG.height, B = CFG.beats, total = B.length;
  var css = ''
  + '.oz-wrap{max-width:1100px;margin:0 auto}'
  + '.oz-head{font:600 13px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}'
  + '.oz-sticky{position:sticky;top:64px;z-index:2;background:rgba(6,13,24,.96);padding:6px 0 8px}'
  + '.oz-stage{position:relative;width:100%;overflow:hidden;border-radius:8px;background:#06080c;aspect-ratio:' + (CFG.ratio || '4/3') + ';'
  + 'border:1px solid rgba(201,168,76,.35);transition:border-color .4s}'
  + '.oz-stage:focus-visible{outline:3px solid #fff;outline-offset:2px}'
  + '.oz-stage.alarm{border-color:#c0392b;box-shadow:0 0 0 1px rgba(192,57,43,.45)}'
  + '.oz-layer{position:absolute;left:0;top:0;transform-origin:0 0;transition:transform 1.6s cubic-bezier(.4,0,.2,1)}'
  + '.oz-layer img{display:block;width:100%;height:100%}'
  + '.oz-light{position:absolute;inset:0;pointer-events:none;transition:background 1.2s}'
  + '.oz-time{position:absolute;left:10px;top:10px;padding:5px 10px;border-radius:6px;background:rgba(6,8,12,.82);'
  + 'color:#f2c45a;font:700 15px/1.2 \'Inter\',monospace;letter-spacing:.5px}'
  + '.oz-stage.alarm .oz-time{color:#ff8a7a}'
  + '.oz-count{position:absolute;right:10px;top:10px;padding:5px 10px;border-radius:6px;background:rgba(6,8,12,.82);'
  + 'color:#e7dcc0;font:13px/1.2 \'Inter\',sans-serif}'
  + '.oz-cap{margin:8px 0 0;font:15px/1.5 \'Inter\',sans-serif;color:var(--ink,#e7dcc0);min-height:1.5em}'
  + '.oz-cap b{color:#f2c45a}'
  + '.oz-ctrl{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'
  + '.oz-ctrl .btn{min-height:44px}'
  + '.oz-credit{margin:8px 0 0;font:12.5px/1.5 \'Inter\',sans-serif;color:var(--muted)}'
  + '.oz-steps{list-style:none;margin:18px 0 0;padding:0}'
  + '.oz-step{margin:0 0 38vh;padding:14px 16px;border-left:3px solid rgba(201,168,76,.3);border-radius:0 8px 8px 0;'
  + 'background:rgba(255,255,255,.02);cursor:pointer;transition:border-color .3s,background .3s}'
  + '.oz-step:last-child{margin-bottom:12px}'
  + '.oz-step[aria-current="step"]{border-left-color:#f2c45a;background:rgba(201,168,76,.08)}'
  + '.oz-step.alarm[aria-current="step"]{border-left-color:#c0392b;background:rgba(192,57,43,.08)}'
  + '.oz-step .oz-t{font:700 13px \'Inter\',sans-serif;letter-spacing:1px;color:#f2c45a}'
  + '.oz-step h3{margin:4px 0 6px;font-family:\'Inter\',sans-serif;font-size:18px;color:#fff}'
  + '.oz-step p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--ink,#e7dcc0)}'
  + '.oz-final{margin-top:12px;background:var(--paper);border:1px solid #a2551f;border-radius:8px;padding:16px 18px;color:var(--paper-ink)}'
  + '.oz-final h3{margin:0 0 8px;font-family:\'Inter\',sans-serif;font-size:18px;color:var(--paper-ink)}'
  + '.oz-final p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.oz-final .oz-src{margin-top:10px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '@media (min-width:900px){.oz-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:28px;align-items:start}'
  + '.oz-grid .oz-sticky{order:2;top:72px}.oz-grid .oz-steps{order:1;margin-top:0;padding-top:20vh}.oz-step{margin-bottom:45vh}}'
  + '@media (max-width:640px){.oz-sticky{top:56px}.oz-step{margin-bottom:30vh}'
  + '.oz-ctrl{flex-wrap:nowrap}.oz-ctrl .btn{flex:1 1 0;min-width:0;padding:8px 10px;font-size:14px;white-space:nowrap}}'
  + '@media (prefers-reduced-motion:reduce){.oz-layer,.oz-light,.oz-stage,.oz-step{transition:none}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function el(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    return e;
  }

  var cur = -1, seen = {}, seenCount = 0;
  var wrap = el('div', 'oz-wrap');
  if(CFG.title) wrap.appendChild(el('div', 'oz-head', CFG.title));
  var grid = el('div', 'oz-grid');
  var sticky = el('div', 'oz-sticky');
  var stage = el('div', 'oz-stage');
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-roledescription', 'сцена');
  stage.setAttribute('aria-label', (CFG.alt || CFG.title || 'Сцена') + '. Стрелки влево и вправо листают такты.');
  var layer = el('div', 'oz-layer');
  var img = document.createElement('img');
  img.src = CFG.image;
  img.width = W; img.height = H;
  img.alt = CFG.alt || '';
  layer.appendChild(img);
  var light = el('div', 'oz-light');
  var timeEl = el('div', 'oz-time');
  var countEl = el('div', 'oz-count');
  stage.appendChild(layer); stage.appendChild(light); stage.appendChild(timeEl); stage.appendChild(countEl);
  sticky.appendChild(stage);
  var cap = el('p', 'oz-cap');
  cap.setAttribute('aria-live', 'polite');
  sticky.appendChild(cap);
  var ctrl = el('div', 'oz-ctrl');
  var prevBtn = el('button', 'btn ghost oz-prev', '← Назад'); prevBtn.type = 'button';
  var nextBtn = el('button', 'btn gold oz-next', 'Дальше →'); nextBtn.type = 'button';
  var voiceBtn = el('button', 'btn ghost oz-voice', '▶ Слушать'); voiceBtn.type = 'button';
  voiceBtn.setAttribute('aria-label', 'Слушать сцену голосом аудиогида');
  ctrl.appendChild(prevBtn); ctrl.appendChild(nextBtn);
  var hasGuide = !!document.getElementById('audioguide');
  if(hasGuide) ctrl.appendChild(voiceBtn);
  sticky.appendChild(ctrl);
  grid.appendChild(sticky);

  var list = el('ol', 'oz-steps');
  var steps = B.map(function(b, i){
    var li = el('li', 'oz-step' + (b.tone === 'alarm' ? ' alarm' : ''));
    li.dataset.idx = i;
    li.appendChild(el('div', 'oz-t', (i + 1) + ' · ' + (b.time || '')));
    li.appendChild(el('h3', null, b.title));
    li.appendChild(el('p', null, b.text));
    li.addEventListener('click', function(){ show(i); });
    list.appendChild(li);
    return li;
  });
  grid.appendChild(list);
  wrap.appendChild(grid);
  if(CFG.credit) wrap.appendChild(el('p', 'oz-credit', CFG.credit));
  var fin = el('div', 'oz-final');
  fin.hidden = true;
  if(CFG.finale){
    fin.appendChild(el('h3', null, CFG.finale.title));
    fin.appendChild(el('p', null, CFG.finale.text));
    if(CFG.finale.src) fin.appendChild(el('div', 'oz-src', CFG.finale.src));
  }
  wrap.appendChild(fin);
  box.appendChild(wrap);

  // Ken Burns: кадр заполняет окно (scale ≥ 1) или виден целиком (scale 0); точка такта — в центре окна
  function place(b){
    var sw = stage.clientWidth, sh = stage.clientHeight;
    if(!sw || !sh) return;
    var cover = Math.max(sw / W, sh / H), contain = Math.min(sw / W, sh / H);
    var k = b.scale === 0 ? contain : cover * (b.scale || 1);
    var iw = W * k, ih = H * k;
    var tx = sw / 2 - b.x * k, ty = sh / 2 - b.y * k;
    tx = iw <= sw ? (sw - iw) / 2 : Math.min(0, Math.max(sw - iw, tx));
    ty = ih <= sh ? (sh - ih) / 2 : Math.min(0, Math.max(sh - ih, ty));
    layer.style.width = W + 'px'; layer.style.height = H + 'px';
    layer.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    var px = ((b.x * k + tx) / sw * 100).toFixed(1), py = ((b.y * k + ty) / sh * 100).toFixed(1);
    light.style.background = b.scale === 0 ? 'none'
      : 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(0,0,0,0) 22%, rgba(0,0,0,.55) 70%)';
  }

  function show(i){
    i = Math.max(0, Math.min(total - 1, i));
    if(i === cur) return;
    cur = i;
    var b = B[i];
    place(b);
    stage.classList.toggle('alarm', b.tone === 'alarm');
    timeEl.textContent = b.time || '';
    countEl.textContent = 'Такт ' + (i + 1) + ' из ' + total;
    cap.innerHTML = '';
    var t = el('b', null, b.title);
    cap.appendChild(t);
    cap.appendChild(document.createTextNode(' — ' + (b.short || b.text)));
    steps.forEach(function(s, j){
      if(j === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
    if(!seen[i]){ seen[i] = true; seenCount++; }
    if(seenCount === total && CFG.finale) fin.hidden = false;
  }

  prevBtn.addEventListener('click', function(){ show(cur - 1); });
  nextBtn.addEventListener('click', function(){ show(cur + 1); });
  stage.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight'){ e.preventDefault(); show(cur + 1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); show(cur - 1); }
  });
  window.addEventListener('resize', function(){ if(cur >= 0) place(B[cur]); });
  img.addEventListener('load', function(){ if(cur >= 0) place(B[cur]); });

  // прокрутка: такт, пересёкший середину экрана, становится текущим
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting) show(+en.target.dataset.idx); });
    }, {rootMargin: '-45% 0px -45% 0px'});
    steps.forEach(function(s){ io.observe(s); });
  }

  // голос: сцена идёт за остановками аудиогида. Конфиг и плеер аудиогида (museum-audioguide.js)
  // на странице идут после сцены — поэтому их ищем после загрузки или при первом нажатии.
  if(hasGuide){
    var byStop = {}, lastStop = -1, agAudio = null, agStops = [];
    B.forEach(function(b, i){ if(b.stop != null && !(b.stop in byStop)) byStop[b.stop] = i; });
    var bind = function(){
      if(agAudio) return agAudio;
      agAudio = document.getElementById('agaudio');
      agStops = (window.MUSEUM_AUDIOGUIDE && window.MUSEUM_AUDIOGUIDE.stops) || [];
      if(!agAudio || !agStops.length){ agAudio = null; return null; }
      agAudio.addEventListener('timeupdate', function(){
        if(agAudio.paused) return;
        var t = agAudio.currentTime, k = -1;
        agStops.forEach(function(s, j){ if(s.t <= t) k = j; });
        if(k !== lastStop){ lastStop = k; if(k in byStop) show(byStop[k]); }
      });
      agAudio.addEventListener('play', function(){ voiceBtn.textContent = '❚❚ Пауза'; });
      agAudio.addEventListener('pause', function(){ voiceBtn.textContent = '▶ Слушать'; });
      return agAudio;
    };
    if(document.readyState === 'complete') bind(); else window.addEventListener('load', bind);
    voiceBtn.addEventListener('click', function(){
      var a = bind();
      if(!a){ voiceBtn.disabled = true; return; }
      if(!a.paused){ a.pause(); return; }
      var stop = B[Math.max(cur, 0)].stop;
      var navBtns = document.querySelectorAll('#audioguide .agnav button');
      lastStop = -1;
      if(stop != null && navBtns[stop]) navBtns[stop].click();
      else { var play = document.getElementById('agbtn'); if(play) play.click(); }
    });
  }

  show(0);
})();
