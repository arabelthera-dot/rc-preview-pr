/* museum-zum-podlinnika.js — M-84 «Зум подлинника» для музея «Русские не сдаются».
   В реестре M-84 была 💡 (зум скана рукописи); здесь — первая реализация из конфига: подлинный
   предмет на снимке и точки, на которые стоит посмотреть вблизи.

   Посетитель рассматривает снимок: под ним — кнопки точек («Табличка», «Надпись», …). Нажатие
   плавно приближает снимок к точке и открывает карточку: что здесь видно, расшифровка надписи
   (read), источник. «Дальше» ведёт к следующей точке, «Целиком» возвращает весь снимок. На снимке
   целиком точки отмечены номерами — их тоже можно нажать. Рассмотрены все точки — открывается
   карточка финала. Если снимок мал и надпись на нём не читается, это говорит note — она выводится
   всегда, а текст надписи даёт read по источнику.

   Подключение — внутри секции:
     <section class="block" id="zum">
       ...
       <div class="zp-box"></div>
       <noscript>…текстовый эквивалент…</noscript>
     </section>
     <script>window.MUSEUM_ZUM_PODLINNIKA={
       mount:'zum', title:'…', image:'kadr.jpg', width:367, height:489,
       alt:'Что на снимке — для чтеца экрана', credit:'Автор, год. Основание прав.',
       note:'Снимок небольшой: надпись на кресте — расшифровкой по источнику.',
       points:[ {x:171, y:155, scale:3, label:'Табличка', title:'…', text:'…', read:'…', src:'…'} ],
                // x/y — точка в пикселях исходного снимка; scale — во сколько раз приблизить (1–4)
       finale:{ title:'…', text:'…', src:'…' }
     };</script>
     <script src="../../assets/museum-zum-podlinnika.js"></script>

   Нет секции, конфига или .zp-box, либо снимок уже стоит — движок ничего не делает.
   Баллов не даёт: счёт страницы ведёт викторина (#quiz).
*/
(function(){
  var CFG = window.MUSEUM_ZUM_PODLINNIKA;
  if(!CFG || !CFG.image || !CFG.points || !CFG.points.length) return;
  var host = document.getElementById(CFG.mount || 'zum');
  if(!host) return;
  var box = host.querySelector('.zp-box');
  if(!box || box.querySelector('.zp-stage')) return;

  var W = CFG.width, H = CFG.height;
  var css = ''
  + '.zp-wrap{max-width:440px;margin:0 auto}'
  + '.zp-head{font:600 13px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}'
  + '.zp-stage{position:relative;width:100%;overflow:hidden;border-radius:6px;background:#111;aspect-ratio:' + W + '/' + H + '}'
  + '.zp-layer{position:absolute;inset:0;transform-origin:0 0;transition:transform .6s ease}'
  + '.zp-layer img{display:block;width:100%;height:100%;object-fit:cover}'
  + '.zp-pin{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:2px solid #c9a84c;'
  + 'background:rgba(11,22,36,.82);color:#e7dcc0;font:700 13px/26px \'Inter\',sans-serif;text-align:center;cursor:pointer;padding:0}'
  + '.zp-pin.seen{border-color:#f2c45a;color:#f2c45a}'
  + '.zp-pin[aria-current="step"]{background:#f2c45a;color:#1b1b1b}'
  + '.zp-pin:focus-visible,.zp-chip:focus-visible{outline:3px solid #fff;outline-offset:2px}'
  + '.zp-stage.zoomed .zp-pin{display:none}'
  + '.zp-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
  + '.zp-chip{min-height:44px;padding:8px 14px;border-radius:22px;border:1px solid #c9a84c;background:transparent;'
  + 'color:var(--ink,#e7dcc0);font:14px \'Inter\',sans-serif;cursor:pointer}'
  + '.zp-chip.seen{border-color:#f2c45a}'
  + '.zp-chip[aria-pressed="true"]{background:#f2c45a;color:#1b1b1b;border-color:#f2c45a}'
  + '.zp-note,.zp-credit{margin:8px 0 0;font:12.5px/1.5 \'Inter\',sans-serif;color:var(--muted)}'
  + '.zp-card{margin-top:12px;background:var(--paper);border:1px solid #d5c9a8;border-radius:8px;padding:16px 18px;color:var(--paper-ink)}'
  + '.zp-card .zp-meta{font:12px \'Inter\',sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:var(--paper-mut)}'
  + '.zp-card h3{margin:6px 0 8px;font-family:\'Inter\',sans-serif;font-size:18px;color:var(--paper-ink)}'
  + '.zp-card p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.zp-card .zp-read{margin-top:10px;padding:10px 12px;border-left:3px solid #a2551f;font-style:italic}'
  + '.zp-card .zp-src{margin-top:10px;font:13px \'Inter\',sans-serif;color:var(--paper-mut)}'
  + '.zp-nav{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:12px;'
  + 'font:14px \'Inter\',sans-serif;color:var(--muted)}'
  + '.zp-nav b{color:#f2c45a}'
  + '.zp-nav .zp-btns{display:flex;gap:8px}'
  + '.zp-final{border-color:#a2551f;box-shadow:0 0 0 1px rgba(162,85,31,.25)}'
  + '@media (prefers-reduced-motion:reduce){.zp-layer{transition:none}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  var P = CFG.points, total = P.length, cur = -1, seen = {}, seenCount = 0;
  var wrap = document.createElement('div');
  wrap.className = 'zp-wrap';
  if(CFG.title){
    var head = document.createElement('div');
    head.className = 'zp-head';
    head.textContent = CFG.title;
    wrap.appendChild(head);
  }
  var stage = document.createElement('div');
  stage.className = 'zp-stage';
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', CFG.alt || CFG.title || 'Снимок подлинника');
  var layer = document.createElement('div');
  layer.className = 'zp-layer';
  var img = document.createElement('img');
  img.src = CFG.image;
  img.width = W; img.height = H;
  img.alt = CFG.alt || '';
  layer.appendChild(img);
  stage.appendChild(layer);
  var pins = P.map(function(p, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'zp-pin';
    b.textContent = String(i + 1);
    b.style.left = (p.x / W * 100) + '%';
    b.style.top = (p.y / H * 100) + '%';
    b.setAttribute('aria-label', (i + 1) + '. ' + p.label);
    b.addEventListener('click', function(){ show(i); });
    stage.appendChild(b);
    return b;
  });
  wrap.appendChild(stage);
  if(CFG.credit){
    var cr = document.createElement('p');
    cr.className = 'zp-credit';
    cr.textContent = CFG.credit;
    wrap.appendChild(cr);
  }
  var chips = document.createElement('div');
  chips.className = 'zp-chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Что рассмотреть вблизи');
  var chipEls = P.map(function(p, i){
    var c = document.createElement('button');
    c.type = 'button';
    c.className = 'zp-chip';
    c.setAttribute('aria-pressed', 'false');
    c.textContent = (i + 1) + ' · ' + p.label;
    c.addEventListener('click', function(){ show(i); });
    chips.appendChild(c);
    return c;
  });
  wrap.appendChild(chips);
  if(CFG.note){
    var note = document.createElement('p');
    note.className = 'zp-note';
    note.textContent = CFG.note;
    wrap.appendChild(note);
  }
  var card = document.createElement('div');
  card.className = 'zp-card';
  card.setAttribute('aria-live', 'polite');
  var nav = document.createElement('div');
  nav.className = 'zp-nav';
  nav.innerHTML = '<span>Рассмотрено <b class="zp-n">0</b> из ' + total + '</span>'
    + '<span class="zp-btns"><button type="button" class="btn ghost zp-whole">Целиком</button>'
    + '<button type="button" class="btn gold zp-next">Дальше →</button></span>';
  var fin = document.createElement('div');
  fin.className = 'zp-card zp-final';
  fin.hidden = true;
  wrap.appendChild(card); wrap.appendChild(nav); wrap.appendChild(fin);
  box.appendChild(wrap);

  var next = nav.querySelector('.zp-next');
  var whole = nav.querySelector('.zp-whole');
  next.addEventListener('click', function(){ if(cur < total - 1) show(cur + 1); });
  whole.addEventListener('click', home);

  // Приближение — сдвиг и масштаб слоя: точка встаёт в центр кадра, края снимка не уходят внутрь.
  function zoom(p){
    var s = clamp(p.scale || 2, 1, 4);
    var tx = clamp(50 - p.x / W * s * 100, (1 - s) * 100, 0);
    var ty = clamp(50 - p.y / H * s * 100, (1 - s) * 100, 0);
    layer.style.transform = 'translate(' + tx + '%,' + ty + '%) scale(' + s + ')';
    stage.classList.toggle('zoomed', s > 1);
    stage.dataset.zoom = String(s);
  }
  function home(){
    layer.style.transform = '';
    stage.classList.remove('zoomed');
    stage.dataset.zoom = '1';
  }

  function show(i){
    var p = P[i];
    cur = i;
    zoom(p);
    pins.forEach(function(b, j){ b.setAttribute('aria-current', j === i ? 'step' : 'false'); });
    chipEls.forEach(function(c, j){ c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    card.innerHTML = '<div class="zp-meta">Точка ' + (i + 1) + ' из ' + total + ' · ' + esc(p.label) + '</div>'
      + '<h3>' + esc(p.title || p.label) + '</h3>'
      + '<p>' + esc(p.text) + '</p>'
      + (p.read ? '<p class="zp-read">' + esc(p.read) + '</p>' : '')
      + (p.src ? '<div class="zp-src">Источник: ' + esc(p.src) + '</div>' : '');
    next.disabled = i === total - 1;
    next.textContent = i === total - 1 ? 'Всё рассмотрено' : 'Дальше →';
    if(!seen[i]){
      seen[i] = true;
      seenCount++;
      pins[i].classList.add('seen');
      chipEls[i].classList.add('seen');
      nav.querySelector('.zp-n').textContent = String(seenCount);
      if(seenCount === total && CFG.finale){
        fin.innerHTML = '<h3>' + esc(CFG.finale.title) + '</h3><p>' + esc(CFG.finale.text) + '</p>'
          + (CFG.finale.src ? '<div class="zp-src">Источник: ' + esc(CFG.finale.src) + '</div>' : '');
        fin.hidden = false;
      }
    }
  }
  show(0);
})();
