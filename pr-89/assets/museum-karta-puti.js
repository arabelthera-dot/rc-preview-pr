/* museum-karta-puti.js — M-72 «Интерактивная карта пути» для музея «Русские не сдаются».
   До сих пор M-72 жила инлайном в podvig-kolovrat.html (три точки, без счёта); здесь — движок
   из конфига, чтобы карта пути не копировалась со страницы на страницу.

   Посетитель идёт по маршруту подвига: на схеме — точки пути с номерами, под схемой — карточка
   текущей точки (дата, что здесь случилось, источник). «Дальше» ведёт к следующей точке, точку на
   схеме можно открыть и напрямую (мышью, Enter или пробелом). Пройдены все точки — открывается
   карточка финала. Схема рисуется из конфига: фон (ходы, линия поверхности) и маршрут через точки.
   Если схема условная, это говорит подпись note — она выводится всегда.

   Подключение — внутри секции:
     <section class="block" id="karta">
       ...
       <div class="kp-box"></div>
       <noscript>…текстовый эквивалент…</noscript>
     </section>
     <script>window.MUSEUM_KARTA_PUTI={
       mount:'karta', title:'Путь разведчика', label:'Схема пути …',
       note:'Условная схема, не план местности.',
       viewBox:'0 0 400 460',
       back:[ {d:'M…', cls:'kp-tunnel'} ],          // фон: ходы, линии; cls — kp-tunnel | kp-laz | kp-ground
       marks:[ {x:12, y:62, text:'поверхность'} ],  // подписи фона
       route:false,                                 // не тянуть линию маршрута через точки (по умолчанию тянет)
       points:[ {x:60, y:80, label:'Вход', date:'ноябрь 1941', title:'…', text:'…', src:'…'} ],
                // подпись точки — справа; side:'left' — слева; lx/ly/anchor — своё место подписи
       finale:{ title:'…', text:'…', src:'…' }
     };</script>
     <script src="../../assets/museum-karta-puti.js"></script>

   Стили схемы — классы .route-map/.rm-* из nesdayutsya-style.css (общие с картой Коловрата).
   Нет секции, конфига или .kp-box, либо схема уже стоит — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_KARTA_PUTI;
  if(!CFG || !CFG.points || !CFG.points.length) return;
  var host = document.getElementById(CFG.mount || 'karta');
  if(!host) return;
  var box = host.querySelector('.kp-box');
  if(!box || box.querySelector('.route-map')) return;

  var css = ''
  + '.kp-tunnel{fill:none;stroke:#2c3a4c;stroke-width:16;stroke-linecap:round;stroke-linejoin:round}'
  + '.kp-laz{fill:none;stroke:#2c3a4c;stroke-width:5;stroke-linecap:round}'
  + '.kp-ground{fill:none;stroke:#8a7a55;stroke-width:2}'
  + '.kp-mark{fill:var(--muted);font:11px \'Inter\',sans-serif;letter-spacing:.5px}'
  + '.kp-route{fill:none;stroke:rgba(201,168,76,.5);stroke-width:2;stroke-dasharray:6 6}'
  + '.kp-route-done{fill:none;stroke:#f2c45a;stroke-width:2.5}'
  + '.rm-node .kp-num{fill:#e7dcc0;font:700 12px \'Inter\',sans-serif;pointer-events:none}'
  + '.rm-node.seen circle{stroke:#f2c45a}'
  + '.rm-node.seen .kp-num{fill:#f2c45a}'
  + '.rm-node[aria-current="step"] circle{fill:#f2c45a;stroke:#f2c45a}'
  + '.rm-node[aria-current="step"] .kp-num{fill:#1b1b1b}'
  + '.rm-node:focus-visible circle{stroke:#fff;stroke-width:3}'
  + '.kp-note{margin:8px 0 0;font:12.5px/1.5 \'Inter\',sans-serif;color:var(--muted)}'
  + '.kp-card{margin-top:12px;background:var(--paper);border:1px solid #d5c9a8;border-radius:8px;padding:16px 18px;color:var(--paper-ink)}'
  + '.kp-card .kp-meta{font:12px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--paper-mut)}'
  + '.kp-card h3{margin:6px 0 8px;font-family:\'Inter\',sans-serif;font-size:18px;color:var(--paper-ink)}'
  + '.kp-card p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.kp-card .kp-src{margin-top:10px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.kp-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;'
  + 'font:14px \'Inter\',sans-serif;color:var(--muted)}'
  + '.kp-nav b{color:#f2c45a}'
  + '.kp-final{border-color:#a2551f;box-shadow:0 0 0 1px rgba(162,85,31,.25)}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent){
    var e = document.createElementNS(NS, name);
    for(var k in attrs) e.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(e);
    return e;
  }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var P = CFG.points, total = P.length, cur = -1, seen = {}, seenCount = 0;
  var wrap = document.createElement('div');
  wrap.className = 'route-map';
  if(CFG.title){
    var head = document.createElement('div');
    head.className = 'rm-head';
    head.textContent = CFG.title;
    wrap.appendChild(head);
  }
  var svg = el('svg', {viewBox: CFG.viewBox || '0 0 400 400', role: 'group',
                       'aria-label': CFG.label || CFG.title || 'Карта пути'}, wrap);
  (CFG.back || []).forEach(function(b){ el('path', {d: b.d, 'class': b.cls || 'kp-tunnel'}, svg); });
  (CFG.marks || []).forEach(function(m){
    var t = el('text', {x: m.x, y: m.y, 'class': 'kp-mark'}, svg);
    t.textContent = m.text;
  });
  var done = null;
  if(CFG.route !== false){
    el('polyline', {points: P.map(function(p){ return p.x + ',' + p.y; }).join(' '), 'class': 'kp-route'}, svg);
    done = el('polyline', {points: P[0].x + ',' + P[0].y, 'class': 'kp-route-done'}, svg);
  }
  var nodes = P.map(function(p, i){
    var g = el('g', {'class': 'rm-node', tabindex: '0', role: 'button',
                     'aria-label': (i + 1) + '. ' + p.label + ', ' + p.date}, svg);
    el('circle', {cx: p.x, cy: p.y, r: 13, fill: '#0b1624', stroke: '#c9a84c', 'stroke-width': 2}, g);
    var n = el('text', {x: p.x, y: p.y + 4, 'text-anchor': 'middle', 'class': 'kp-num'}, g);
    n.textContent = String(i + 1);
    var right = p.side !== 'left';
    var l = el('text', {x: p.lx != null ? p.lx : p.x + (right ? 20 : -20), y: p.ly != null ? p.ly : p.y + 4,
                        'text-anchor': p.anchor || (right ? 'start' : 'end'), 'class': 'rm-label'}, g);
    l.textContent = p.label;
    g.addEventListener('click', function(){ show(i); });
    g.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); show(i); }
    });
    return g;
  });
  if(CFG.note){
    var note = document.createElement('p');
    note.className = 'kp-note';
    note.textContent = CFG.note;
    wrap.appendChild(note);
  }
  var card = document.createElement('div');
  card.className = 'kp-card';
  card.setAttribute('aria-live', 'polite');
  var nav = document.createElement('div');
  nav.className = 'kp-nav';
  nav.innerHTML = '<span>Пройдено <b class="kp-n">0</b> из ' + total + '</span>'
    + '<button type="button" class="btn gold kp-next">Дальше →</button>';
  var fin = document.createElement('div');
  fin.className = 'kp-card kp-final';
  fin.hidden = true;
  wrap.appendChild(card); wrap.appendChild(nav); wrap.appendChild(fin);
  box.appendChild(wrap);
  // Зона нажатия — вся точка вместе с подписью: промежуток между кружком и текстом не «мёртвый».
  nodes.forEach(function(g){
    var bb = g.getBBox();
    var hit = el('rect', {x: bb.x - 4, y: bb.y - 4, width: bb.width + 8, height: bb.height + 8,
                          fill: 'transparent', 'pointer-events': 'all'});
    g.insertBefore(hit, g.firstChild);
  });
  var next = nav.querySelector('.kp-next');
  next.addEventListener('click', function(){ if(cur < total - 1) show(cur + 1); });

  function show(i){
    var p = P[i];
    cur = i;
    nodes.forEach(function(g, j){ g.setAttribute('aria-current', j === i ? 'step' : 'false'); });
    card.innerHTML = '<div class="kp-meta">Точка ' + (i + 1) + ' из ' + total + ' · ' + esc(p.date) + '</div>'
      + '<h3>' + esc(p.title || p.label) + '</h3>'
      + '<p>' + esc(p.text) + '</p>'
      + (p.src ? '<div class="kp-src">Источник: ' + esc(p.src) + '</div>' : '');
    next.disabled = i === total - 1;
    next.textContent = i === total - 1 ? 'Конец пути' : 'Дальше →';
    if(!seen[i]){
      seen[i] = true;
      seenCount++;
      nodes[i].classList.add('seen');
      nav.querySelector('.kp-n').textContent = String(seenCount);
      var last = 0;
      while(last + 1 < total && seen[last + 1]) last++;
      if(done) done.setAttribute('points', P.slice(0, last + 1).map(function(q){ return q.x + ',' + q.y; }).join(' '));
      if(seenCount === total && CFG.finale){
        fin.innerHTML = '<h3>' + esc(CFG.finale.title) + '</h3><p>' + esc(CFG.finale.text) + '</p>'
          + (CFG.finale.src ? '<div class="kp-src">Источник: ' + esc(CFG.finale.src) + '</div>' : '');
        fin.hidden = false;
      }
    }
  }
  show(0);
})();
