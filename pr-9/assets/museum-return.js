/* Причина вернуться завтра — общий движок возврата всех музеев.
   museum-core §1-sexies п.4; механика возврата утверждена Сергеем 09.08.2026
   (docs/interactive/REGISTRY.md, раздел «Механика возврата», M-99). Наряд mehanika-vozvrata-2809.

   Три части, каждая показывается только когда ей есть что сказать:
     1. «Открытые дни» — отметка в коллекции этого музея. Хранится в localStorage
        посетителя, без сервера и без очков (счёт страницы из 100 не трогается).
     2. Намёк на завтрашний экспонат — следующий день из утверждённого календаря музея
        (window.MUSEUM_CALENDAR). Нет завтрашнего дня в календаре — намёка нет:
        «скоро появится» и выдуманный анонс — брак (правило 06.09).
     3. Загадка с ответом завтра — ответ открывается на следующий календарный день
        после первого показа загадки этому посетителю.

   Подключение — одна строка ПОСЛЕ файла календаря музея:
     <script src="../../assets/museum-return.js" data-museum="literatura" data-day="01-01"></script>
   data-museum — ключ коллекции (по умолчанию <html data-museum>), data-day — «ММ-ДД» этой
   страницы (по умолчанию window.MUSEUM_CALENDAR_INITIAL). Загадка — по желанию, до строки:
     window.MUSEUM_RETURN = {riddle: {q: 'Вопрос', a: 'Ответ', src: 'Источник'}};
   Блок встаёт в <div id="return"> если он есть, иначе перед секцией календаря #calendar
   (порядок слотов §6: … → календарь → «Куда дальше»).

   Недатированный музей (window.MUSEUM_CALENDAR.dated === false, «Русские не сдаются»):
   ключ «ММ-ДД» там — месяц и номер единицы, а не дата. Подпись — «День 12 · Январь», как
   в витрине календаря (museum-calendar-page.js); намёк «Завтра — день 13 · Январь» берёт
   следующую единицу состава по порядку ключей. Писать «12 января» там, где даты нет, —
   брак (строка museum-return-dated-false-0810). */
(function () {
  var me = document.currentScript;
  var MONR = ['января','февраля','марта','апреля','мая','июня',
              'июля','августа','сентября','октября','ноября','декабря'];
  var MON  = ['Январь','Февраль','Март','Апрель','Май','Июнь',
              'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var DIM  = [31,29,31,30,31,30,31,31,30,31,30,31];

  var CSS = '' +
    '#return{margin:28px auto;max-width:760px;padding:0 16px}' +
    '#return .rt-box{background:rgba(233,227,211,.05);border:1px solid rgba(212,175,55,.3);' +
      'border-radius:14px;padding:16px 18px}' +
    '#return h2{font-family:Georgia,serif;font-weight:400;font-size:20px;margin:0 0 12px;color:var(--gold)}' +
    '#return .rt-part{padding:12px 0;border-top:1px solid rgba(233,227,211,.12)}' +
    '#return .rt-part:first-of-type{border-top:0;padding-top:0}' +
    '#return .rt-lbl{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);' +
      'opacity:.85;margin-bottom:6px}' +
    '#return p{font-size:15px;line-height:1.55;margin:0}' +
    '#return .rt-days{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;padding:0;list-style:none}' +
    '#return .rt-days a,#return .rt-days span{display:inline-block;min-height:32px;line-height:32px;' +
      'padding:0 10px;border-radius:16px;font-size:13px;border:1px solid rgba(212,175,55,.45);' +
      'background:rgba(212,175,55,.12);color:var(--gold);text-decoration:none}' +
    '#return .rt-days .rt-now{background:var(--gold);color:#151310}' +
    '#return .rt-q{font-family:Georgia,serif;font-size:16px}' +
    '#return .rt-form{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}' +
    '#return .rt-form input{flex:1 1 180px;min-height:44px;padding:0 12px;border-radius:10px;' +
      'border:1px solid rgba(233,227,211,.3);background:rgba(0,0,0,.2);color:var(--txt);font:inherit;font-size:15px}' +
    '#return .rt-form button{min-height:44px;padding:0 16px;border-radius:10px;cursor:pointer;' +
      'border:1px solid var(--gold);background:rgba(212,175,55,.15);color:var(--gold);font:inherit;font-size:15px}' +
    '#return .rt-note{font-size:13px;opacity:.7;margin-top:8px}' +
    '#return .rt-ans{margin-top:10px;padding:10px 12px;border-left:3px solid var(--gold);' +
      'background:rgba(212,175,55,.08)}' +
    '#return .rt-src{font-size:12px;opacity:.6;margin-top:6px}';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function plural(n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
    return many;
  }
  /* местная дата посетителя, а не UTC: «завтра» наступает у него в полночь */
  function localDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function human(key) { var p = key.split('-'); return (+p[1]) + ' ' + MONR[+p[0] - 1]; }
  function nextKey(key) {
    var m = +key.slice(0, 2), d = +key.slice(3, 5) + 1;
    if (d > DIM[m - 1]) { d = 1; m = m === 12 ? 1 : m + 1; }
    return pad(m) + '-' + pad(d);
  }

  /* localStorage бывает закрыт (Safari в приватном окне, запрет cookie) — тогда движок
     показывает то же самое, только не помнит визит: страница не должна падать */
  function load(k) {
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  function start() {
    var cal = window.MUSEUM_CALENDAR || {};
    var dated = cal.dated !== false;
    /* подпись дня: дата у датированного музея, номер единицы — у недатированного */
    var label = function (key) {
      var p = key.split('-');
      return dated ? human(key) : 'День ' + (+p[1]) + ' · ' + MON[+p[0] - 1];
    };
    /* следующий день: календарный +1 или следующая единица состава (без круга года:
       после последней единицы намёка нет — выдумывать «завтра» нельзя) */
    var after = function (key) {
      if (dated) return nextKey(key);
      var ks = Object.keys(cal).filter(function (k) { return /^\d\d-\d\d$/.test(k); }).sort();
      for (var i = 0; i < ks.length; i++) if (ks[i] > key) return ks[i];
      return null;
    };
    var cfg = window.MUSEUM_RETURN || {};
    var attr = function (n) { return me && me.getAttribute('data-' + n); };
    var museum = attr('museum') || cfg.museum || document.documentElement.getAttribute('data-museum');
    var day = attr('day') || cfg.day || window.MUSEUM_CALENDAR_INITIAL;
    if (!museum || !/^\d\d-\d\d$/.test(day || '')) return;   // без ключа коллекции и дня — молчим

    var KEY = 'rc-return:' + museum;
    var st = load(KEY);
    st.days = st.days || {};
    st.riddles = st.riddles || {};
    var today = localDate(new Date());
    if (!st.days[day]) st.days[day] = today;

    var parts = [];

    /* 1. Коллекция открытых дней. Знаменатель — дни календаря со страницей: пустые слоты
       года не превращают коллекцию в «1 из 365». */
    var total = 0, hrefs = {};
    for (var k in cal) if (cal[k] && cal[k].href) { total++; hrefs[k] = cal[k].href; }
    var opened = Object.keys(st.days).sort();
    var n = opened.length;
    var chips = opened.map(function (k) {
      var t = cal[k] && cal[k].t ? cal[k].t : label(k);
      var chip = esc(label(k)) + ' · ' + esc(t);
      if (k === day) return '<li><span class="rt-now" aria-current="page">' + chip + '</span></li>';
      return hrefs[k] ? '<li><a href="' + esc(hrefs[k]) + '">' + chip + '</a></li>' : '<li><span>' + chip + '</span></li>';
    }).join('');
    parts.push('<div class="rt-part"><div class="rt-lbl">Твои открытые дни</div>' +
      '<p>Открыто ' + n + ' ' + plural(n, 'день', 'дня', 'дней') +
      (total ? ' из ' + total + ' в календаре музея' : '') + '. Отметка хранится только в этом браузере.</p>' +
      '<ul class="rt-days">' + chips + '</ul></div>');

    /* 2. Намёк на завтра — только из календаря. Поле tease (если задано) — короткий намёк
       без раскрытия; иначе заголовок дня. Хук d не повторяем: он для самой страницы дня. */
    var nk = after(day), nx = nk && cal[nk];
    if (nx && nx.t) {
      var tease = nx.tease ? esc(nx.tease) : '«' + esc(nx.t) + '»' + (nx.y ? ' <span>(' + esc(nx.y) + ')</span>' : '');
      parts.push('<div class="rt-part"><div class="rt-lbl">' +
        (dated ? 'Завтра, ' + esc(human(nk)) : 'Завтра — ' + esc(label(nk).replace('День', 'день'))) + '</div>' +
        '<p>' + tease + '</p></div>');
    }

    /* 3. Загадка: день первого показа запоминается; ответ — с любого следующего дня */
    var r = cfg.riddle;
    if (r && r.q && r.a) {
      var rs = st.riddles[day] || (st.riddles[day] = {seen: today});
      var open = rs.seen < today;
      var html = '<div class="rt-part"><div class="rt-lbl">Загадка с ответом завтра</div>' +
        '<p class="rt-q">' + esc(r.q) + '</p>';
      if (open) {
        html += (rs.guess ? '<p class="rt-note">Твой вариант: ' + esc(rs.guess) + '</p>' : '') +
          '<div class="rt-ans"><p><b>Ответ.</b> ' + esc(r.a) + '</p>' +
          (r.src ? '<p class="rt-src">Источник: ' + esc(r.src) + '</p>' : '') + '</div>';
      } else {
        html += '<form class="rt-form" action="#"><input id="rt-guess" name="guess" autocomplete="off" aria-label="Твой вариант ответа" placeholder="Твой вариант" value="' + esc(rs.guess || '') + '">' +
          '<button type="submit">Запомнить</button></form>' +
          '<p class="rt-note" id="rt-when">Ответ откроется здесь завтра — вернись на эту страницу.' +
          (rs.guess ? ' Твой вариант сохранён.' : '') + '</p>';
      }
      parts.push(html + '</div>');
    }

    save(KEY, st);

    var box = document.getElementById('return');
    if (!box) {
      box = document.createElement('section');
      box.id = 'return';
      var calSec = document.getElementById('calendar');
      var anchor = calSec || document.getElementById('kuda-dalshe');
      if (anchor) anchor.parentNode.insertBefore(box, anchor);
      else (document.querySelector('main') || document.body).appendChild(box);
    }
    box.setAttribute('aria-labelledby', 'rt-title');

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    box.innerHTML = '<div class="rt-box"><h2 id="rt-title">Вернись завтра</h2>' + parts.join('') + '</div>';

    var form = box.querySelector('.rt-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = form.querySelector('input').value.trim().slice(0, 200);
      st.riddles[day].guess = v;
      var ok = save(KEY, st);
      box.querySelector('#rt-when').textContent = ok
        ? (v ? 'Твой вариант сохранён. Ответ откроется здесь завтра.' : 'Ответ откроется здесь завтра — вернись на эту страницу.')
        : 'Браузер не даёт сохранить вариант (приватный режим?). Ответ всё равно откроется завтра.';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
