/* Календарь музея — ПОМЕСЯЧНЫЙ вид, по образцу музея «Что изобрели русские первыми в мире».
   Стандарт с 30.07.2026 (требование Сергея, третий заход): на странице музея показывается
   ОДИН месяц — сетка чисел 1…31, стрелками переход в соседний месяц. Тап по числу открывает
   запись этого дня под сеткой. Пустые дни видны и не прячутся.

   Почему так, а не годовым списком карточек (museum-calendar-year.js): при 365 заполненных
   днях список превращается в бесконечную стену текста. Здесь размер блока постоянный —
   пять-шесть строк чисел плюс одна карточка, сколько бы дней ни было заполнено.

   Как подключить:
     <section id="calendar"><h2 …>…</h2><div id="calbox"></div></section>
     <script src="../assets/museum-calendar-month.js"></script>
     <script src="calendar-<музей>.js"></script>   // window.MUSEUM_CALENDAR

   Данные — общий формат всех музеев:
     "09-20": {t:"Заголовок", y:1648, d:"Текст.", href:"…html", link:"Подпись ссылки"} */
(function () {
  var MON  = ['Январь','Февраль','Март','Апрель','Май','Июнь',
              'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MONR = ['января','февраля','марта','апреля','мая','июня',
              'июля','августа','сентября','октября','ноября','декабря'];
  var DIM  = [31,29,31,30,31,30,31,31,30,31,30,31];

  var CSS = '' +
    '#calbox .calhead{display:flex;align-items:center;justify-content:space-between;gap:10px;' +
      'border-bottom:1px solid rgba(212,175,55,.25);padding-bottom:9px}' +
    '#calbox .calmname{font-family:Georgia,serif;font-size:17px;color:var(--gold);flex:1;text-align:center}' +
    '#calbox .calmname i{display:block;font-style:normal;font-size:11.5px;opacity:.75;color:var(--txt);margin-top:2px}' +
    '#calbox .calnav{flex:none;width:38px;height:38px;border-radius:50%;cursor:pointer;' +
      'background:rgba(233,227,211,.06);border:1px solid rgba(212,175,55,.3);color:var(--gold);' +
      'font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}' +
    '#calbox .calnav:hover{background:rgba(212,175,55,.14)}' +
    /* minmax(0,1fr), а не 1fr: в узком контейнере (например в карточке на титульной музея)
       1fr считается по контенту и колонки разъезжаются — ловил 30.07 на титульной искусства */
    '#calbox .calgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin:12px 0 0}' +
    '#calbox .cday{position:relative;aspect-ratio:1/1;border-radius:10px;cursor:pointer;' +
      'background:rgba(233,227,211,.04);border:1px solid rgba(233,227,211,.10);color:var(--txt);' +
      'font-family:Georgia,serif;font-size:14px;opacity:.4;padding:0}' +
    '#calbox .cday.full{opacity:1;cursor:pointer;color:var(--gold);' +
      'background:rgba(212,175,55,.12);border-color:rgba(212,175,55,.45)}' +
    '#calbox .cday.full:hover{background:rgba(212,175,55,.22)}' +
    '#calbox .cday.full::after{content:"";position:absolute;left:50%;bottom:5px;width:4px;height:4px;' +
      'margin-left:-2px;border-radius:50%;background:var(--gold)}' +
    /* выбранный и сегодняшний день читаются всегда, даже если запись ещё не заведена */
    '#calbox .cday.on{opacity:1;background:var(--gold);color:#151310;border-color:var(--gold)}' +
    '#calbox .cday.today{opacity:.85}' +
    '#calbox .cday.on::after{background:#151310}' +
    '#calbox .cday.today{box-shadow:0 0 0 2px rgba(212,175,55,.55)}' +
    '#calbox .calcard{margin-top:14px;background:rgba(233,227,211,.05);' +
      'border:1px solid rgba(233,227,211,.14);border-radius:12px;padding:13px 15px}' +
    '#calbox .calcard .cdate{font-size:12px;letter-spacing:.06em;text-transform:uppercase;' +
      'color:var(--gold);opacity:.85;margin-bottom:5px}' +
    '#calbox .calcard h3{font-family:Georgia,serif;font-size:16px;margin:0 0 6px;font-weight:400}' +
    '#calbox .calcard h3 span{font-size:13px;opacity:.55}' +
    '#calbox .calcard p{font-size:13px;line-height:1.55;margin:0;opacity:.85}' +
    '#calbox .calcard a{display:inline-block;margin-top:8px;font-size:13px}' +
    '#calbox .calcard.empty h3{opacity:.7}' +
    '#calbox .caljump{background:none;border:none;padding:0;margin-top:8px;cursor:pointer;' +
      'color:var(--gold);font-size:13px;text-decoration:underline;font-family:inherit}' +
    '#calbox .calfoot{font-size:12px;opacity:.75;margin-top:10px;text-align:center}';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
    return many;
  }

  function start() {
    var box = document.getElementById('calbox');
    if (!box) return;

    var data = window.MUSEUM_CALENDAR || {};
    /* текст пустого дня — свой у каждого музея: задаётся в файле данных строкой
       window.MUSEUM_CALENDAR_EMPTY. Иначе в галерее искусства висело «основание острога». */
    var emptyTxt = window.MUSEUM_CALENDAR_EMPTY ||
      'Календарь наполняется: к каждому дню года мы привязываем событие этого музея.';
    var today = new Date(), tm = today.getMonth(), td = today.getDate();
    var tk = pad(tm + 1) + '-' + pad(td);
    var total = Object.keys(data).length;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    /* Выпуск может попросить открыть собственную дату вместо текущего месяца.
       Это нужно на странице дня: обещание «нажми 1 января» не должно требовать
       от посетителя семь раз листать календарь от августа. */
    var initial = /^\d{2}-\d{2}$/.test(window.MUSEUM_CALENDAR_INITIAL || '')
      ? window.MUSEUM_CALENDAR_INITIAL : null;
    var view = initial ? parseInt(initial.slice(0, 2), 10) - 1 : tm;
    var sel = initial;      // выбранный день, ключ ММ-ДД

    /* сколько дней от сегодня вперёд по кругу года до ключа ММ-ДД */
    function ahead(k) {
      var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
      var t = new Date(today.getFullYear(), tm, td);
      var d = new Date(today.getFullYear(), mm - 1, dd);
      if (d < t) d = new Date(today.getFullYear() + 1, mm - 1, dd);
      return Math.round((d - t) / 86400000);
    }

    function nearest() {
      var keys = Object.keys(data), best = null, bd = 1e9;
      keys.forEach(function (k) { var a = ahead(k); if (a < bd) { bd = a; best = k; } });
      return best ? { k: best, days: bd } : null;
    }

    function cardHtml(k) {
      var it = data[k];
      var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
      var head = dd + ' ' + MONR[mm - 1] + (k === tk ? ' · сегодня' : '');
      if (it) {
        return '<div class="calcard"><div class="cdate">' + head + '</div>' +
          '<h3>' + esc(it.t) + (it.y ? ' <span>' + it.y + '</span>' : '') + '</h3>' +
          '<p>' + esc(it.d) + '</p>' +
          (it.href ? '<a href="' + esc(it.href) + '">' + esc(it.link || 'Открыть →') + '</a>' : '') +
          '</div>';
      }
      var n = nearest();
      return '<div class="calcard empty"><div class="cdate">' + head + '</div>' +
        '<h3>На этот день записи пока нет</h3>' +
        '<p>' + esc(emptyTxt) + '</p>' +
        (n ? '<button class="caljump" data-k="' + n.k + '">Ближайшая запись · через ' + n.days +
             ' ' + plural(n.days, 'день', 'дня', 'дней') + ' →</button>' : '') +
        '</div>';
    }

    function render() {
      var cnt = 0, cells = '';
      for (var d = 1; d <= DIM[view]; d++) {
        var k = pad(view + 1) + '-' + pad(d), it = data[k];
        if (it) cnt++;
        cells += '<button class="cday' + (it ? ' full' : '') + (k === tk ? ' today' : '') +
          (k === sel ? ' on' : '') + '" data-k="' + k + '"' +
          ' title="' + (it ? esc(it.t) : 'запись готовится') + '">' + d + '</button>';
      }
      box.innerHTML =
        '<div class="calhead">' +
          '<button class="calnav" data-step="-1" aria-label="Предыдущий месяц">‹</button>' +
          '<div class="calmname">' + MON[view] +
            '<i>' + (cnt ? 'занято ' + cnt + ' ' + plural(cnt, 'день', 'дня', 'дней') +
                           ' из ' + DIM[view] : 'дней пока нет') + '</i></div>' +
          '<button class="calnav" data-step="1" aria-label="Следующий месяц">›</button>' +
        '</div>' +
        '<div class="calgrid">' + cells + '</div>' +
        (sel ? cardHtml(sel) : '') +
        '<div class="calfoot">Заполнено ' + total + ' ' + plural(total, 'день', 'дня', 'дней') +
          ' из 365 — каждый готовый повод для ролика и поста</div>';

      box.querySelectorAll('.calnav').forEach(function (b) {
        b.addEventListener('click', function () {
          view = (view + parseInt(b.dataset.step, 10) + 12) % 12;
          sel = null;
          render();
        });
      });
      box.querySelectorAll('.cday').forEach(function (b) {
        b.addEventListener('click', function () { sel = b.dataset.k; render(); });
      });
      var jump = box.querySelector('.caljump');
      if (jump) jump.addEventListener('click', function () {
        sel = jump.dataset.k;
        view = parseInt(sel.slice(0, 2), 10) - 1;
        render();
      });
    }

    /* Без заданной даты открываем сегодняшний день: есть запись — показываем её,
       нет — карточка честно говорит об этом и ведёт к ближайшей. */
    if (!sel) sel = tk;
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
