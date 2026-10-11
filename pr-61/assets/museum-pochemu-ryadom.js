/* museum-pochemu-ryadom.js — M-06 «Почему они рядом?» для музея «Русские не сдаются».
   Первая реализация мехники M-06 (реестр docs/interactive/REGISTRY.md — была 💡, идея без кода).

   Кладёт рядом книгу и реального человека: список пунктов, по клику раскрывается две колонки —
   «В книге» и «На самом деле» — с источником. Точка может быть «переписано» (вымысел заменил
   правду) или «оставлено как было» (книга совпадает с реальностью) — честная рамка, не только
   список ошибок автора.

   Подключение — внутри пустой секции:
     <section class="block" id="pochemu-ryadom"></section>
     ...
     <script>window.MUSEUM_POCHEMU_RYADOM={
       heading:'Что Полевой переписал, а что оставил как было',
       lead:'...',
       hint:'Нажми на пункт — раскроются книга и реальность рядом.',
       bookLabel:'Повесть о настоящем человеке', realityLabel:'Алексей Маресьев',
       items:[
         { point:'Фамилия героя', book:'Мересьев — одна буква отличия от настоящей фамилии.',
           reality:'Маресьев.', changed:true, note:'Источник — aif.ru, 2024.' }
       ]
     };</script>
     <script src="../../assets/museum-pochemu-ryadom.js"></script>

   Если #pochemu-ryadom не найден, конфига нет или секция уже свёрстана вручную
   (есть .pr-list) — движок ничего не делает и не трогает страницу. Баллов не даёт — это
   музей характера, не викторина (баллы и так считает #quiz).
*/
(function(){
  var CFG = window.MUSEUM_POCHEMU_RYADOM;
  if(!CFG || !CFG.items || !CFG.items.length) return;
  var host = document.getElementById('pochemu-ryadom');
  if(!host || host.querySelector('.pr-list')) return;

  var css = ''
  + '.pr-list{display:flex;flex-direction:column;gap:10px}'
  + '.pr-item{text-align:left;background:var(--paper);border:1px solid #d5c9a8;border-radius:8px;'
  + 'padding:14px 18px;cursor:pointer;font-family:\'Inter\',sans-serif;width:100%}'
  + '.pr-item .pr-tag{display:inline-block;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;'
  + 'font-weight:700;padding:2px 8px;border-radius:999px;margin-right:10px;vertical-align:middle}'
  + '.pr-item .pr-tag.changed{background:rgba(201,90,56,.14);color:#a2551f}'
  + '.pr-item .pr-tag.kept{background:rgba(46,125,87,.14);color:#2e7d57}'
  + '.pr-item .pr-point{font-size:15.5px;color:var(--paper-ink);font-weight:600;vertical-align:middle}'
  + '.pr-detail{display:none;margin-top:4px;background:var(--paper);border:1px solid #d5c9a8;'
  + 'border-radius:8px;padding:20px;overflow:hidden}'
  + '.pr-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}'
  + '@media(max-width:640px){.pr-cols{grid-template-columns:1fr}}'
  + '.pr-col h4{margin:0 0 8px;font-family:\'Inter\',sans-serif;font-size:12px;letter-spacing:1.4px;'
  + 'text-transform:uppercase;color:var(--paper-mut)}'
  + '.pr-col p{margin:0;font-family:\'PT Serif\',Georgia,serif;font-size:16.5px;line-height:1.6;color:var(--paper-ink)}'
  + '.pr-note{margin-top:14px;font-size:13px;color:var(--paper-mut)}'
  + '.pr-note b{color:#a2551f;font-weight:700}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var bookLabel = CFG.bookLabel || 'В книге', realityLabel = CFG.realityLabel || 'На самом деле';

  var rows = CFG.items.map(function(item, i){
    var tag = item.changed
      ? '<span class="pr-tag changed">переписано</span>'
      : '<span class="pr-tag kept">оставлено как было</span>';
    return '<button class="pr-item" data-i="' + i + '" type="button" aria-expanded="false">'
      + tag + '<span class="pr-point">' + esc(item.point) + '</span></button>'
      + '<div class="pr-detail" id="prDetail' + i + '">'
      + '<div class="pr-cols">'
      + '<div class="pr-col"><h4>' + esc(bookLabel) + '</h4><p>' + esc(item.book) + '</p></div>'
      + '<div class="pr-col"><h4>' + esc(realityLabel) + '</h4><p>' + esc(item.reality) + '</p></div>'
      + '</div>'
      + (item.note ? '<div class="pr-note">' + esc(item.note) + '</div>' : '')
      + '</div>';
  }).join('');

  host.classList.add('block');
  host.innerHTML =
    '<div class="wrap">'
    + '<div class="kicker">Почему они рядом?</div>'
    + '<h2 style="margin-bottom:8px">' + esc(CFG.heading || 'Книга и реальность рядом') + '</h2>'
    + (CFG.lead ? '<p style="color:var(--muted);margin-top:0;max-width:62ch">' + esc(CFG.lead) + '</p>' : '')
    + '<div class="pr-list">' + rows + '</div>'
    + (CFG.hint ? '<p style="font-size:12px;color:var(--muted);margin:12px 0 0">' + esc(CFG.hint) + '</p>' : '')
    + '</div>';

  host.querySelectorAll('.pr-item').forEach(function(btn){
    btn.addEventListener('click', function(){
      var detail = document.getElementById('prDetail' + btn.dataset.i);
      var open = detail.style.display === 'block';
      detail.style.display = open ? 'none' : 'block';
      btn.setAttribute('aria-expanded', String(!open));
      if(!open) detail.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  });
})();
