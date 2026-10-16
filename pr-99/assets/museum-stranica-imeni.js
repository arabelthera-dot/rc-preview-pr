/* museum-stranica-imeni.js — M-86 «Страница имени» для музея «Русские не сдаются».
   Первая реализация механики M-86 (реестр docs/interactive/REGISTRY.md — была 💡, идея без кода).

   Посетитель открывает проверяемую карточку каждого из погибших: звание, должность, где родился,
   кем призван, где похоронен, награда и источник с номером в списке. Имена идут по алфавиту —
   без рейтингов, без деления на «главных» и «остальных». Поиск — по фамилии, имени, городу или
   области. Карточку можно открыть мышью, Enter или пробелом; открытая карточка встаёт под списком.

   Вклад семей (материалы с пометкой «не проверено») в этой реализации не принимается: правила прав
   пользовательского контента не утверждены — только проверяемые сведения из источника.

   Подключение — внутри секции:
     <section class="block" id="imena">
       ...
       <div class="si-box"></div>
       <noscript>…полный список имён текстом…</noscript>
     </section>
     <script>window.MUSEUM_STRANICA_IMENI={
       mount:'imena',
       source:'«Шаг в бессмертие» (О. Дементьев, В. Клевцов) — Централизованная библиотечная система Пскова',
       url:'https://…',
       people:[ {n:1, name:'Фамилия Имя Отчество', rank:'гвардии …', role:'…', born:'Родился …',
                 called:'Призван …', buried:'Похоронен …', award:'Герой России (посмертно)'} ]
     };</script>
     <script src="../../assets/museum-stranica-imeni.js"></script>

   Поля и подписи настраиваются (день 29, «Молодая гвардия»: школа, подполье, судьба вместо призыва
   и места похорон); без них — как в первой реализации:
     fields:[['born','Родился'],['called','Призыв'],['buried','Похоронен'],['award','Награда']],
     search:['name','born','buried','called'], searchLabel, placeholder, listLabel,
     meta:'Карточка · № {n} в списке книги', linkText:'страница книги'.
   У человека может быть свой url — тогда ссылка в карточке ведёт на его страницу в источнике.

   Нет секции, конфига или .si-box, либо список уже стоит — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_STRANICA_IMENI;
  if(!CFG || !CFG.people || !CFG.people.length) return;
  var host = document.getElementById(CFG.mount || 'imena');
  if(!host) return;
  var box = host.querySelector('.si-box');
  if(!box || box.querySelector('.si-list')) return;

  var css = ''
  + '.si-search{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 12px}'
  + '.si-search label{font:14px \'Inter\',sans-serif;color:var(--muted)}'
  + '.si-search input{flex:1 1 220px;min-width:0;background:#0e1724;border:1px solid #2e4057;border-radius:8px;'
  + 'color:#e7dcc0;padding:10px 12px;font:15px \'Inter\',sans-serif}'
  + '.si-search input:focus-visible{outline:3px solid #fff;outline-offset:1px}'
  + '.si-count{font:14px \'Inter\',sans-serif;color:var(--muted);margin:0 0 10px}'
  + '.si-count b{color:#f2c45a}'
  + '.si-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;'
  + 'max-height:420px;overflow-y:auto;padding-right:4px}'
  + '.si-name{width:100%;text-align:left;background:#101a27;border:1px solid #2e4057;border-radius:6px;color:#e7dcc0;'
  + 'font:14px/1.35 \'Inter\',sans-serif;padding:8px 10px;cursor:pointer}'
  + '.si-name:hover{border-color:#c9a84c}'
  + '.si-name:focus-visible{outline:3px solid #fff;outline-offset:1px}'
  + '.si-name.seen{border-color:#6d5a2e}'
  + '.si-name[aria-pressed="true"]{background:#f2c45a;color:#1b1b1b;border-color:#f2c45a}'
  + '.si-name small{display:block;color:var(--muted);font-size:12px}'
  + '.si-name[aria-pressed="true"] small{color:#3b3320}'
  + '.si-card{margin-top:14px;background:var(--paper);border:1px solid #d5c9a8;border-radius:8px;padding:18px 20px;color:var(--paper-ink)}'
  + '.si-card .si-meta{font:12px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--paper-mut)}'
  + '.si-card h3{margin:6px 0 4px;font-family:\'Inter\',sans-serif;font-size:19px;color:var(--paper-ink)}'
  + '.si-card .si-role{margin:0 0 10px;font:600 14px \'Inter\',sans-serif;color:#a2551f}'
  + '.si-card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-family:\'PT Serif\',Georgia,serif;font-size:16px;line-height:1.5}'
  + '.si-card dt{font:600 13px/1.9 \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.si-card dd{margin:0;color:var(--paper-ink)}'
  + '.si-card .si-src{margin-top:12px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.si-card .si-src a{color:#7a3d12}'
  + '@media(max-width:600px){.si-card dl{grid-template-columns:1fr}.si-card dt{line-height:1.4}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function norm(s){ return String(s||'').toLowerCase().replace(/ё/g,'е'); }

  var FIELDS = CFG.fields || [['born','Родился'], ['called','Призыв'], ['buried','Похоронен'], ['award','Награда']];
  var SEARCH = CFG.search || ['name', 'born', 'buried', 'called'];

  var P = CFG.people.slice().sort(function(a, b){ return a.name.localeCompare(b.name, 'ru'); });
  var total = P.length, seen = {}, seenCount = 0, cur = -1;

  var search = document.createElement('div');
  search.className = 'si-search';
  search.innerHTML = '<label for="siQuery">' + esc(CFG.searchLabel || 'Найти по фамилии, городу или области') + '</label>'
    + '<input id="siQuery" type="search" autocomplete="off" placeholder="' + esc(CFG.placeholder || 'Например: Псков или Иванов') + '">';
  var count = document.createElement('p');
  count.className = 'si-count';
  count.setAttribute('aria-live', 'polite');
  var list = document.createElement('ul');
  list.className = 'si-list';
  list.setAttribute('aria-label', CFG.listLabel || 'Имена погибших, по алфавиту');
  var buttons = P.map(function(p, i){
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'si-name';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = esc(p.name) + '<small>' + esc(p.rank) + '</small>';
    b.addEventListener('click', function(){ show(i); });
    li.appendChild(b);
    list.appendChild(li);
    p._hay = norm(SEARCH.map(function(k){ return p[k]; }).join(' '));
    return b;
  });
  var card = document.createElement('div');
  card.className = 'si-card';
  card.setAttribute('aria-live', 'polite');
  card.hidden = true;
  box.appendChild(search); box.appendChild(count); box.appendChild(list); box.appendChild(card);

  var input = search.querySelector('input');
  var shown = total;
  input.addEventListener('input', function(){
    var q = norm(input.value.trim());
    shown = 0;
    P.forEach(function(p, i){
      var ok = !q || p._hay.indexOf(q) >= 0;
      buttons[i].parentNode.hidden = !ok;
      if(ok) shown++;
    });
    renderCount();
  });

  function renderCount(){
    count.innerHTML = 'Открыто карточек: <b class="si-n">' + seenCount + '</b> из ' + total
      + (shown < total ? ' · найдено: ' + shown : '');
  }

  function row(k, v){ return v ? '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>' : ''; }

  function show(i){
    var p = P[i];
    if(cur >= 0) buttons[cur].setAttribute('aria-pressed', 'false');
    cur = i;
    buttons[i].setAttribute('aria-pressed', 'true');
    var url = p.url || CFG.url;
    card.innerHTML = '<div class="si-meta">' + esc((CFG.meta || 'Карточка · № {n} в списке книги').replace('{n}', p.n)) + '</div>'
      + '<h3>' + esc(p.name) + '</h3>'
      + '<p class="si-role">' + esc(p.rank) + (p.role ? ' · ' + esc(p.role) : '') + '</p>'
      + '<dl>' + FIELDS.map(function(f){ return row(f[1], p[f[0]]); }).join('') + '</dl>'
      + '<div class="si-src">Источник: ' + esc(CFG.source)
      + (url ? ' — <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(CFG.linkText || 'страница книги') + '</a>' : '') + '.</div>';
    card.hidden = false;
    if(!seen[i]){
      seen[i] = true;
      seenCount++;
      buttons[i].classList.add('seen');
    }
    renderCount();
  }
  renderCount();
})();
