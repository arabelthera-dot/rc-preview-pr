/* museum-sudba-obekta.js — M-05 «Судьба объекта» для музея «Русские не сдаются».
   Первая реализация механики M-05 (реестр docs/interactive/REGISTRY.md — была 💡, идея без кода).

   Посетитель идёт за одним предметом по его пути: лента станций (место · дата), под ней карточка
   текущей станции — где предмет, что с ним случилось, источник. «Дальше» ведёт к следующей
   станции, точку на ленте можно открыть и напрямую. Когда пройдены все станции, открывается
   карточка «Что стало с предметом».

   Подключение — внутри секции:
     <section class="block" id="sudba">
       ...
       <div class="so-box"></div>
       <noscript>…текстовый эквивалент…</noscript>
     </section>
     <script>window.MUSEUM_SUDBA_OBEKTA={
       mount:'sudba',
       object:'танк «Боевая подруга»',
       stations:[ { place:'Томск', date:'1942', where:'Ещё не построен', text:'…', src:'…' } ],
       finale:{ title:'…', text:'…', src:'…' }
     };</script>
     <script src="../../assets/museum-sudba-obekta.js"></script>

   Нет секции, конфига или .so-box, либо лента уже стоит — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_SUDBA_OBEKTA;
  if(!CFG || !CFG.stations || !CFG.stations.length) return;
  var host = document.getElementById(CFG.mount || 'sudba');
  if(!host) return;
  var box = host.querySelector('.so-box');
  if(!box || box.querySelector('.so-track')) return;

  var css = ''
  + '.so-track{display:flex;gap:0;overflow-x:auto;padding:6px 2px 10px;margin:0 0 12px;list-style:none}'
  + '.so-track li{flex:1 0 92px;position:relative;text-align:center}'
  + '.so-track li:before{content:"";position:absolute;top:17px;left:-50%;width:100%;height:2px;background:#3d5168}'
  + '.so-track li:first-child:before{display:none}'
  + '.so-track li.seen:before{background:#f2c45a}'
  + '.so-st{position:relative;z-index:1;width:34px;height:34px;border-radius:50%;border:2px solid #6f8aa6;'
  + 'background:#101a27;color:#cfd8e3;font:700 14px \'Inter\',sans-serif;cursor:pointer;padding:0}'
  + '.so-track li.seen .so-st{border-color:#f2c45a;color:#f2c45a}'
  + '.so-track li .so-st[aria-current="step"]{background:#f2c45a;color:#1b1b1b;border-color:#f2c45a}'
  + '.so-st:focus-visible{outline:3px solid #fff;outline-offset:2px}'
  + '.so-pl{display:block;margin-top:6px;font:12px/1.3 \'Inter\',sans-serif;color:var(--muted)}'
  + '.so-card{background:var(--paper);border:1px solid #d5c9a8;border-radius:8px;padding:18px 20px;color:var(--paper-ink)}'
  + '.so-card .so-meta{font:12px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--paper-mut)}'
  + '.so-card h3{margin:6px 0 4px;font-family:\'Inter\',sans-serif;font-size:18px;color:var(--paper-ink)}'
  + '.so-card .so-where{margin:0 0 10px;font:600 14px \'Inter\',sans-serif;color:#a2551f}'
  + '.so-card p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.so-card .so-src{margin-top:10px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.so-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;'
  + 'font:14px \'Inter\',sans-serif;color:var(--muted)}'
  + '.so-nav b{color:#f2c45a}'
  + '.so-final{margin-top:12px;border-color:#a2551f;box-shadow:0 0 0 1px rgba(162,85,31,.25)}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var S = CFG.stations, total = S.length, cur = -1, seen = {}, seenCount = 0;
  var track = document.createElement('ol');
  track.className = 'so-track';
  track.setAttribute('aria-label', 'Путь: ' + (CFG.object || 'предмет'));
  var items = S.map(function(st, i){
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'so-st';
    b.textContent = String(i + 1);
    b.setAttribute('aria-label', (i + 1) + '. ' + st.place + ', ' + st.date);
    b.addEventListener('click', function(){ show(i); });
    var pl = document.createElement('span');
    pl.className = 'so-pl';
    pl.textContent = st.place;
    li.appendChild(b); li.appendChild(pl);
    track.appendChild(li);
    return li;
  });
  var card = document.createElement('div');
  card.className = 'so-card';
  card.setAttribute('aria-live', 'polite');
  var nav = document.createElement('div');
  nav.className = 'so-nav';
  nav.innerHTML = '<span aria-live="polite">Пройдено <b class="so-n">0</b> из ' + total + '</span>'
    + '<button type="button" class="btn gold so-next">Дальше →</button>';
  var fin = document.createElement('div');
  fin.className = 'so-card so-final';
  fin.hidden = true;
  box.appendChild(track); box.appendChild(card); box.appendChild(nav); box.appendChild(fin);
  var next = nav.querySelector('.so-next');
  next.addEventListener('click', function(){ if(cur < total - 1) show(cur + 1); });

  function show(i){
    var st = S[i];
    cur = i;
    items.forEach(function(li, j){
      li.querySelector('.so-st').setAttribute('aria-current', j === i ? 'step' : 'false');
    });
    card.innerHTML = '<div class="so-meta">Станция ' + (i + 1) + ' из ' + total + ' · ' + esc(st.date) + '</div>'
      + '<h3>' + esc(st.place) + '</h3>'
      + '<div class="so-where">' + esc(st.where) + '</div>'
      + '<p>' + esc(st.text) + '</p>'
      + (st.src ? '<div class="so-src">Источник: ' + esc(st.src) + '</div>' : '');
    next.disabled = i === total - 1;
    next.textContent = i === total - 1 ? 'Конец пути' : 'Дальше →';
    if(!seen[i]){
      seen[i] = true;
      seenCount++;
      items[i].classList.add('seen');
      nav.querySelector('.so-n').textContent = String(seenCount);
      if(seenCount === total && CFG.finale){
        fin.innerHTML = '<h3>' + esc(CFG.finale.title) + '</h3><p>' + esc(CFG.finale.text) + '</p>'
          + (CFG.finale.src ? '<div class="so-src">Источник: ' + esc(CFG.finale.src) + '</div>' : '');
        fin.hidden = false;
      }
    }
  }
  show(0);
})();
