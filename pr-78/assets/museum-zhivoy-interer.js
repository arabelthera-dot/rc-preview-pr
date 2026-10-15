/* museum-zhivoy-interer.js — M-41 «Живой интерьер» для музея «Русские не сдаются».
   Первая реализация механики M-41 (реестр docs/interactive/REGISTRY.md — была 💡, идея без кода).

   Посетитель «заходит» в помещение: поверх схемы стоят точки-предметы, по нажатию предмет
   подсвечивается и рядом раскрывается карточка — что это, что с ним случилось, источник.
   Счётчик «осмотрено N из M»; когда осмотрено всё — открывается итоговая карточка.

   Схема — статичная разметка внутри секции (видна и без JavaScript), движок только
   расставляет кнопки по координатам в процентах от рамки схемы:
     <section class="block" id="interer">
       ...
       <div class="zi-stage"><svg viewBox="0 0 800 420" ...>…</svg></div>
       <noscript>…текстовый эквивалент…</noscript>
     </section>
     <script>window.MUSEUM_ZHIVOY_INTERER={
       mount:'interer',
       hint:'Нажми на предмет на схеме.',
       items:[ { id:'reaktor', x:48.5, y:58, label:'Реактор', title:'…', text:'…', src:'rg.ru, 2021' } ],
       finale:{ title:'…', text:'…' }
     };</script>
     <script src="../../assets/museum-zhivoy-interer.js"></script>

   Предмет на схеме может нести data-zi="<id>" — тогда он подсвечивается вместе с кнопкой.
   Нет секции, конфига или .zi-stage, либо кнопки уже стоят — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_ZHIVOY_INTERER;
  if(!CFG || !CFG.items || !CFG.items.length) return;
  var host = document.getElementById(CFG.mount || 'interer');
  if(!host) return;
  var stage = host.querySelector('.zi-stage');
  if(!stage || stage.querySelector('.zi-dot')) return;

  var css = ''
  + '.zi-stage{position:relative;max-width:880px;margin:0 auto}'
  + '.zi-stage svg{display:block;width:100%;height:auto}'
  + '.zi-dot{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;'
  + 'border:2px solid #f2c45a;background:rgba(242,196,90,.22);color:#fff;font:700 14px \'Inter\',sans-serif;'
  + 'cursor:pointer;padding:0;box-shadow:0 0 0 0 rgba(242,196,90,.6);animation:ziPulse 2.4s infinite}'
  + '.zi-dot.seen{animation:none;background:rgba(46,125,87,.55);border-color:#7fd1a4}'
  + '.zi-dot[aria-pressed="true"]{background:#f2c45a;color:#1b1b1b;animation:none}'
  + '.zi-dot:focus-visible{outline:3px solid #fff;outline-offset:2px}'
  + '@keyframes ziPulse{0%{box-shadow:0 0 0 0 rgba(242,196,90,.55)}70%{box-shadow:0 0 0 12px rgba(242,196,90,0)}100%{box-shadow:0 0 0 0 rgba(242,196,90,0)}}'
  + '@media(prefers-reduced-motion:reduce){.zi-dot{animation:none}}'
  + '[data-zi].zi-on{filter:drop-shadow(0 0 6px #f2c45a)}'
  + '.zi-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:880px;'
  + 'margin:12px auto 0;font:14px \'Inter\',sans-serif;color:var(--muted)}'
  + '.zi-bar b{color:#f2c45a}'
  + '.zi-card{max-width:880px;margin:12px auto 0;background:var(--paper);border:1px solid #d5c9a8;'
  + 'border-radius:8px;padding:18px 20px;color:var(--paper-ink)}'
  + '.zi-card h3{margin:0 0 8px;font-family:\'Inter\',sans-serif;font-size:17px;color:var(--paper-ink)}'
  + '.zi-card p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.zi-card .zi-src{margin-top:10px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.zi-card.zi-final{border-color:#a2551f;box-shadow:0 0 0 1px rgba(162,85,31,.25)}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var total = CFG.items.length, seen = {}, seenCount = 0;
  var bar = document.createElement('div');
  bar.className = 'zi-bar';
  bar.innerHTML = '<span>' + esc(CFG.hint || 'Нажми на предмет на схеме.') + '</span>'
    + '<span aria-live="polite">Осмотрено <b class="zi-n">0</b> из ' + total + '</span>';
  var card = document.createElement('div');
  card.className = 'zi-card';
  card.setAttribute('aria-live', 'polite');
  card.hidden = true;
  var fin = document.createElement('div');
  fin.className = 'zi-card zi-final';
  fin.hidden = true;
  stage.parentNode.insertBefore(bar, stage.nextSibling);
  bar.parentNode.insertBefore(card, bar.nextSibling);
  card.parentNode.insertBefore(fin, card.nextSibling);

  var dots = CFG.items.map(function(item, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'zi-dot';
    b.style.left = item.x + '%';
    b.style.top = item.y + '%';
    b.textContent = String(i + 1);
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', (i + 1) + '. ' + item.label);
    b.title = item.label;
    b.addEventListener('click', function(){ open(i); });
    stage.appendChild(b);
    return b;
  });

  function open(i){
    var item = CFG.items[i];
    dots.forEach(function(d, j){ d.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    Array.prototype.forEach.call(stage.querySelectorAll('[data-zi]'), function(el){
      el.classList.toggle('zi-on', el.getAttribute('data-zi') === item.id);
    });
    card.innerHTML = '<h3>' + (i + 1) + '. ' + esc(item.title || item.label) + '</h3>'
      + '<p>' + esc(item.text) + '</p>'
      + (item.src ? '<div class="zi-src">Источник: ' + esc(item.src) + '</div>' : '');
    card.hidden = false;
    if(!seen[item.id]){
      seen[item.id] = true;
      seenCount++;
      dots[i].classList.add('seen');
      bar.querySelector('.zi-n').textContent = String(seenCount);
      if(seenCount === total && CFG.finale){
        fin.innerHTML = '<h3>' + esc(CFG.finale.title) + '</h3><p>' + esc(CFG.finale.text) + '</p>'
          + (CFG.finale.src ? '<div class="zi-src">Источник: ' + esc(CFG.finale.src) + '</div>' : '');
        fin.hidden = false;
      }
    }
  }
})();
