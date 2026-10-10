/* Страница-календарь музея — общий движок для ВСЕХ музеев.
   Рисует год целиком: 12 месяцев, сетка дней, заполненные дни — золотые и кликабельные.
   Данные берёт из window.MUSEUM_CALENDAR (файл музея calendar-<тема>.js).

   Два вида музея, поведение различает сам музей своим конфигом:
     • датированный (по умолчанию) — ключи "ММ-ДД" это календарные дни месяца,
       длины месяцев берутся из календаря, счётчик «из 365». Без конфига движок
       работает ровно как раньше — ни одна существующая страница не меняется;
     • недатированный (`dated: false`) — календарных дат у музея нет, «День N» это
       номер единицы состава:
         window.MUSEUM_CALENDAR = { total: 365, dated: false, "01-01": {…} };
       Год рисуется как в году — 365 дней (31,28,31,30…), подпись единицы «День N».
       Записи, чей номер больше числа дней месяца, в год не входят — но из музея не
       пропадают: идут отдельным блоком «Сверх года» (решение Сергея 10.09.2026:
       «оставляй 365, как в году должно быть; они остаются»). Молча ничего не режем.

   Подключение:
     <div id="calyear"></div><div id="calcard"></div>
     <script src="calendar-<тема>.js"></script>
     <script src="../assets/museum-calendar-page.js"></script>  */
(function () {
  var MON = ['Январь','Февраль','Март','Апрель','Май','Июнь',
             'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MONR = ['января','февраля','марта','апреля','мая','июня',
              'июля','августа','сентября','октября','ноября','декабря'];
  var DAYS = [31,29,31,30,31,30,31,31,30,31,30,31];
  var YEAR = [31,28,31,30,31,30,31,31,30,31,30,31];   /* год как в году — 365 дней */
  var KEY = /^\d{2}-\d{2}$/;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function start() {
    var host = document.getElementById('calyear');
    var card = document.getElementById('calcard');
    if (!host && !card) return;   // страница без календаря вовсе

    /* конфиг музея — тоже поля того же объекта, поэтому записи дней отбираем
       строго по ключу "ММ-ДД", иначе счётчик посчитал бы и months, и total */
    var cfg = window.MUSEUM_CALENDAR || {};
    var data = {};
    Object.keys(cfg).forEach(function (k) { if (KEY.test(k)) data[k] = cfg[k]; });

    /* длины месяцев и счётчик можно задать отдельным объектом MUSEUM_CALENDAR_META:
       в MUSEUM_CALENDAR их держать нельзя — тот же объект читает месячный движок
       и считает total по числу ключей, лишние поля ломают ему счётчик.
       Нет META — работает ровно как раньше, ни одна страница не меняется. */
    var meta = window.MUSEUM_CALENDAR_META || cfg;
    var dated = meta.dated !== false;
    /* датированный музей живёт по своим данным; недатированный — по обычному году:
       365 дней, как и должно быть в году */
    var mLen = dated
      ? ((meta.months && meta.months.length === 12) ? meta.months : DAYS)
      : YEAR;
    var total = dated ? (meta.total || 365) : 365;

    var today = new Date(), tk = pad(today.getMonth() + 1) + '-' + pad(today.getDate());

    /* номер единицы недатированного музея может быть больше числа дней месяца —
       такие записи в год не входят, но из музея не пропадают (блок «Сверх года») */
    function beyondYear(k) {
      return parseInt(k.slice(3), 10) > YEAR[parseInt(k.slice(0, 2), 10) - 1];
    }
    var allKeys = Object.keys(data).sort();
    var beyond = dated ? [] : allKeys.filter(beyondYear);
    var filled = dated ? allKeys.length : allKeys.length - beyond.length;

    /* счётчик всегда про год: 365. Записи сверх года посчитаны отдельно и не молчат */
    var h = '<div class="calstat">' + 'Заполнено дней: <b>' + filled + '</b> из ' + total +
      ' · ' + (dated ? 'каждый заполненный день' : 'каждый день года') +
      ' — готовый повод для ролика и поста' +
      (beyond.length
        ? ' · сверх года ещё ' + beyond.length + ' ' +
          plural(beyond.length, 'запись', 'записи', 'записей') + ' — они остаются в музее'
        : '') + '</div>';

    /* годовая сетка рисуется только там, где для неё есть место (#calyear).
       На витрине музея его нет — там живёт одна карточка сегодняшнего дня. */
    for (var m = 0; host && m < 12; m++) {
      var cnt = 0, cells = '';
      for (var d = 1; d <= mLen[m]; d++) {
        var k = pad(m + 1) + '-' + pad(d);
        var it = data[k];
        if (it) cnt++;
        var lbl = it ? it.t : 'запись готовится';
        if (!dated) lbl = 'День ' + d + (it ? ' — ' + it.t : '');
        cells += '<button class="cday' + (it ? ' full' : '') +
                 (dated && k === tk ? ' today' : '') + '"' +
                 (it ? ' data-k="' + k + '"' : ' disabled') +
                 ' title="' + lbl.replace(/"/g, '') + '">' + d + '</button>';
      }
      h += '<section class="cmon"><h2>' + MON[m] +
           '<span class="cnt">' + (cnt ? cnt + ' ' + plural(cnt, 'запись', 'записи', 'записей') : '—') + '</span></h2>' +
           '<div class="cgrid">' + cells + '</div></section>';
    }
    /* записи сверх года — отдельным блоком: в году 365 дней, и терять их нельзя */
    if (!dated && beyond.length) {
      var chips = '';
      beyond.forEach(function (k) {
        var it = data[k];
        var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
        chips += '<button class="cday full cextra" data-k="' + k + '" title="' +
                 ('День ' + dd + ' · ' + MON[mm - 1] + ' — ' + it.t).replace(/"/g, '') + '">' +
                 dd + ' · ' + MON[mm - 1] + '</button>';
      });
      h += '<section class="cmon beyond"><h2>Сверх года<span class="cnt">' + beyond.length +
           ' ' + plural(beyond.length, 'запись', 'записи', 'записей') +
           '</span></h2><div class="cgrid cgrid-wide">' + chips + '</div></section>';
    }

    if (host) host.innerHTML = h;

    /* сколько дней от сегодня до ключа MM-DD (вперёд по кругу года) */
    function daysAhead(k) {
      var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
      var y = today.getFullYear();
      var t = new Date(y, today.getMonth(), today.getDate());
      var d = new Date(y, mm - 1, dd);
      if (d < t) d = new Date(y + 1, mm - 1, dd);
      return Math.round((d - t) / 86400000);
    }

    function plural(n, one, few, many) {
      var n10 = n % 10, n100 = n % 100;
      if (n10 === 1 && n100 !== 11) return one;
      if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
      return many;
    }

    /* графы 4 и 5 стандарта витрины (museum-core §1-бис-3): что посетитель делает
       руками и откуда факт. Поля дня mech и src переносит генератор музея из
       утверждённой месячной таблицы; нет поля — строки нет, ничего не выдумываем.
       Стиль строкой: страницы музеев свои, движок не требует от них новых правил. */
    function row(label, v) {
      if (!v) return '';
      return '<div class="crow" style="margin-top:8px;font-size:13px;line-height:1.5">' +
        '<span style="color:var(--gold,#c9a24a);opacity:.85;letter-spacing:1px;' +
        'text-transform:uppercase;font-size:10.5px;margin-right:6px">' + label + '</span>' +
        v + '</div>';
    }

    function show(k, note) {
      var it = data[k];
      if (!it || !card) return;
      var mm = parseInt(k.slice(0, 2), 10), dd = parseInt(k.slice(3), 10);
      /* у датированного музея подпись — календарный день, у недатированного —
         номер единицы состава: писать «5 января» там, где даты нет, нельзя */
      var when = dated
        ? dd + ' ' + MONR[mm - 1] + (k === tk ? ' · <b>сегодня</b>' : '')
        : 'День ' + dd + ' · ' + MON[mm - 1];
      card.innerHTML = '<div class="cdate">' + (note ? note + ' · ' : '') + when + '</div>' +
        '<h3>' + it.t + (it.y ? ' <span class="caly">' + it.y + '</span>' : '') + '</h3>' +
        '<p>' + it.d + '</p>' +
        row('Механика', it.mech) + row('Источник', it.src) +
        (it.href ? '<a href="' + it.href + '">' + (it.link || 'Открыть →') + '</a>' : '');
      card.style.display = 'block';
      if (host) {
        host.querySelectorAll('.cday').forEach(function (b) { b.classList.remove('on'); });
        var b = host.querySelector('.cday[data-k="' + k + '"]');
        if (b) b.classList.add('on');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    if (host) host.querySelectorAll('.cday[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { show(b.dataset.k); });
    });

    /* при открытии — сегодняшний день; если на сегодня записи нет, честно
       показываем БЛИЖАЙШУЮ будущую (по кругу года) и пишем, через сколько дней.
       У недатированного музея «сегодня» и «через N дней» смысла не имеют —
       открываем первую единицу состава. */
    var keys = Object.keys(data).sort();
    if (!dated) {
      if (keys.length) show(keys[0]);
    } else if (data[tk]) {
      show(tk);
    } else if (keys.length) {
      var next = keys[0], best = daysAhead(keys[0]);
      keys.forEach(function (k) {
        var dh = daysAhead(k);
        if (dh < best) { best = dh; next = k; }
      });
      show(next, 'Ближайшая запись · через ' + best + ' ' +
                 plural(best, 'день', 'дня', 'дней'));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
