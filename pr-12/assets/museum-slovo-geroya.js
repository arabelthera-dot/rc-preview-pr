/* museum-slovo-geroya.js — M-22 «Слово героя» для музея «Русские не сдаются».
   Стена с подлинными надписями защитников, выцарапанными по кирпичу. Надписи — текстом
   (HTML), не картинкой: соблюдает «текст не поверх картинки» и доступность.

   Клик по надписи раскрывает её «паспорт»: полный текст, место находки, примечание об
   авторе и озвучку (edge-tts). Баллов нет — это музей характера, не игра.

   Подключение — внутри пустой секции:
     <section class="block" id="slovo-geroya"></section>
     ...
     <script>window.MUSEUM_SLOVO_GEROYA={
       heading:'Что выцарапали на кирпиче',
       lead:'Подлинные надписи защитников крепости…',
       hint:'Нажми на надпись — раскроется, где её нашли, и можно послушать.',
       note:'Озвучено синтезом речи — временно, до записи голосом автора музея.',
       bgImage:'brest-kirpich-kladka.jpg',   // реальное фото кирпичной стены (фон .sg-wall); нет — рисуется кирпич-градиент
       wall:[
         { text:'…', text2:'…', place:'…', note:'…', audio:'slovo-geroya-1.mp3' }
       ],
       // необязательно: подписи для записей, которые не выцарапаны на стене
       // (последние слова со слов очевидцев, газетный очерк). По умолчанию —
       // «Надпись» / «Где найдено.» / «Кто автор.», как у Брестской крепости.
       labels:{ num:'Запись', place:'Где хранится.', note:'Кто записал.' },
       plainWall:true   // необязательно: ровный фон вместо кирпича
     };</script>
     <script src="../../assets/museum-slovo-geroya.js"></script>

   Если #slovo-geroya не найден, конфига нет или секция уже свёрстана вручную
   (есть .sg-wall) — движок ничего не делает и не трогает страницу.
*/
(function(){
  var CFG = window.MUSEUM_SLOVO_GEROYA;
  if(!CFG || !CFG.wall || !CFG.wall.length) return;
  var host = document.getElementById('slovo-geroya');
  if(!host || host.querySelector('.sg-wall')) return;

  // plainWall:true — ровный тёмный фон без кирпичной кладки: для слов, записанных со слов
  // очевидцев или в газете, а не выцарапанных на стене (день 8, Петрищево).
  var wallBg = CFG.plainWall
    ? 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,.05), transparent 62%),'
      + 'linear-gradient(170deg,#1a2230 0%,#121925 55%,#0b111a 100%)'
    : CFG.bgImage
    ? 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,.06), transparent 62%),'
      + 'linear-gradient(165deg, rgba(26,13,7,.62), rgba(12,7,4,.78)),'
      + 'url("' + CFG.bgImage + '") center/cover no-repeat'
    : 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,.07), transparent 62%),'
      + 'repeating-linear-gradient(0deg, rgba(0,0,0,.17) 0 2px, transparent 2px 32px),'
      + 'repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 2px, transparent 2px 64px),'
      + 'linear-gradient(170deg,#4c2a1a 0%,#331b12 52%,#231108 100%)';
  var css = ''
  + '.sg-wall{position:relative;overflow:hidden;border:1px solid rgba(201,168,76,.20);border-radius:12px;'
  + 'padding:clamp(22px,4.5vw,42px);box-shadow:inset 0 0 80px rgba(0,0,0,.55),0 14px 44px rgba(0,0,0,.35);'
  + 'background:' + wallBg + '}'
  + '.sg-wall::after{content:\'\';position:absolute;inset:0;pointer-events:none;'
  + 'background:radial-gradient(ellipse at 80% 110%, rgba(201,168,76,.10), transparent 55%)}'
  + '.sg-scratch{display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;'
  + 'font-family:var(--mono);color:#e9dcc0;font-size:clamp(14.5px,2.3vw,19px);line-height:1.55;'
  + 'letter-spacing:.2px;margin:0 0 24px;padding:0;'
  + 'text-shadow:0 2px 3px rgba(0,0,0,.85),0 -1px 0 rgba(255,255,255,.10);'
  + 'transform:rotate(-.7deg);transition:transform .22s ease,color .22s ease}'
  + '.sg-scratch:nth-child(even){transform:rotate(.8deg)}'
  + '.sg-scratch:last-child{margin-bottom:0}'
  + '.sg-scratch:hover,.sg-scratch:focus-visible{color:#f5ead0;transform:rotate(0deg) translateX(4px);outline:none}'
  + '.sg-scratch .sg-num{display:block;color:var(--gold);font-size:11px;letter-spacing:2.4px;'
  + 'text-transform:uppercase;font-family:\'Inter\',sans-serif;font-weight:700;margin-bottom:8px;opacity:.78}'
  + '.sg-detail{display:none;margin-top:22px;background:var(--paper);color:var(--paper-ink);'
  + 'border:1px solid #d5c9a8;border-radius:4px;padding:26px 28px;position:relative}'
  + '.sg-detail::before{content:\'\';position:absolute;inset:5px;border:1px solid rgba(43,35,23,.12);'
  + 'border-radius:1px;pointer-events:none}'
  + '.sg-detail>*{position:relative}'
  + '.sg-detail .sg-t{font-family:\'PT Serif\',Georgia,serif;font-size:19px;line-height:1.68;'
  + 'color:var(--paper-ink);white-space:pre-line}'
  + '.sg-detail .sg-t + .sg-t{margin-top:14px}'
  + '.sg-detail .sg-meta{margin-top:16px;font-family:\'Inter\',sans-serif;font-size:13.5px;'
  + 'color:var(--paper-mut);line-height:1.65}'
  + '.sg-detail .sg-meta b{color:#a2551f;font-weight:700}'
  + '.sg-detail audio{margin-top:18px;width:100%;border-radius:8px}'
  + '@media(max-width:600px){.sg-detail{padding:20px 18px}.sg-detail .sg-t{font-size:17px}}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var L = CFG.labels || {};
  var NUM = L.num || 'Надпись', PLACE = L.place || 'Где найдено.', NOTE = L.note || 'Кто автор.';

  var scratches = CFG.wall.map(function(item, i){
    var body = '<span class="sg-num">' + esc(NUM) + ' ' + ['I','II','III','IV','V','VI'][i] + '</span>' + esc(item.text);
    if(item.text2) body += '\n' + esc(item.text2);
    return '<button class="sg-scratch" data-i="' + i + '" type="button" '
      + 'aria-label="' + esc(NUM + ' ' + ['I','II','III','IV','V','VI'][i] + ': ' + item.text) + '">'
      + body.replace(/\n/g, '<br>') + '</button>';
  }).join('');

  host.classList.add('block');
  host.innerHTML =
    '<div class="wrap">'
    + '<div class="kicker">Слово героя</div>'
    + '<h2 style="margin-bottom:8px">' + esc(CFG.heading || 'Что выцарапали на кирпиче') + '</h2>'
    + (CFG.lead ? '<p style="color:var(--muted);margin-top:0;max-width:62ch">' + esc(CFG.lead) + '</p>' : '')
    + '<div class="sg-wall">' + scratches + '</div>'
    + '<div class="sg-detail" id="sgDetail"></div>'
    + (CFG.hint ? '<p style="font-size:12px;color:var(--muted);margin:12px 0 0">' + esc(CFG.hint) + '</p>' : '')
    + (CFG.note ? '<p style="font-size:12px;color:var(--muted);opacity:.75;margin:8px 0 0">' + esc(CFG.note) + '</p>' : '')
    + '</div>';

  var detail = document.getElementById('sgDetail');
  var buttons = host.querySelectorAll('.sg-scratch');
  var active = null;

  function open(item){
    var t = '<div class="sg-t">' + esc(item.text).replace(/\n/g, '<br>') + '</div>';
    if(item.text2) t += '<div class="sg-t">' + esc(item.text2).replace(/\n/g, '<br>') + '</div>';
    var meta = '';
    if(item.place) meta += '<div class="sg-meta"><b>' + esc(PLACE) + '</b> ' + esc(item.place) + '</div>';
    if(item.note) meta += '<div class="sg-meta"><b>' + esc(NOTE) + '</b> ' + esc(item.note) + '</div>';
    var audio = item.audio ? '<audio controls preload="none" src="' + esc(item.audio) + '"></audio>' : '';
    detail.innerHTML = t + meta + audio;
    detail.style.display = 'block';
    detail.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = CFG.wall[+btn.dataset.i];
      if(active === btn){ detail.style.display = detail.style.display === 'block' ? 'none' : 'block'; return; }
      buttons.forEach(function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      active = btn;
      open(item);
    });
  });
})();
