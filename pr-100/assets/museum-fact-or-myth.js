/* museum-fact-or-myth.js — M-97 «Факт или миф?»
   Не викторина со счётом и не «угадай правильный ответ»: посетитель видит спорную
   деталь подвига, сам сначала решает, как она устроена (подтверждённый документ или
   легенда, сложившаяся позже), — и только потом получает честный разбор. Ни «верно»,
   ни «неверно» не показывается: реальная история часто не «да/нет», а «подтверждено
   отчасти» или «источники расходятся». Цель — не проверить посетителя, а показать,
   как вообще проверяется история.

   Конфиг (перед подключением движка):
     window.MUSEUM_FACT_OR_MYTH = {
       mount: 'factOrMyth',
       title: 'Факт или миф?',
       lead:  '...',                    // 1–2 фразы ввода
       mechanic: 'M-23',                // метка для аналитики; без неё — 'M-97'
                                        // (день 30 — M-23 «Правда или миф» на этом же движке)
       items: [
         {
           text: 'Утверждение, которое обычно повторяют о подвиге...',
           options: ['Подтверждено документом', 'Легенда, сложившаяся позже'],
           reveal: 'Честный разбор: что подтверждено, а что нет, и откуда это известно.'
         }
       ]
     };

   Разметка руками не пишется — движок рендерит всё в контейнер. */
(function () {
  'use strict';
  function init() {
    var cfg = window.MUSEUM_FACT_OR_MYTH;
    if (!cfg || !cfg.mount || !cfg.items || !cfg.items.length) return;
    var mount = document.getElementById(cfg.mount);
    if (!mount) return;

    ensureStyles();

    var idx = 0;
    var answered = false;

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function render() {
      if (idx >= cfg.items.length) { renderEnd(); return; }
      answered = false;
      var it = cfg.items[idx];
      var html = '';
      html += '<div class="fm-progress">' + (idx + 1) + ' из ' + cfg.items.length + '</div>';
      html += '<p class="fm-text">' + esc(it.text) + '</p>';
      html += '<div class="fm-options">';
      (it.options || ['Факт', 'Миф']).forEach(function (o, i) {
        html += '<button type="button" class="fm-opt" data-i="' + i + '">' + esc(o) + '</button>';
      });
      html += '</div>';
      html += '<div class="fm-reveal" hidden></div>';
      mount.innerHTML = html;
      bind(it);
    }

    function bind(it) {
      [].forEach.call(mount.querySelectorAll('.fm-opt'), function (btn) {
        btn.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          [].forEach.call(mount.querySelectorAll('.fm-opt'), function (b) { b.disabled = true; });
          btn.classList.add('fm-picked');
          var rv = mount.querySelector('.fm-reveal');
          rv.hidden = false;
          rv.innerHTML = '<b>Что известно на самом деле</b><p>' + esc(it.reveal) + '</p>' +
            '<button type="button" class="fm-next">' + (idx + 1 < cfg.items.length ? 'Дальше' : 'Итог') + '</button>';
          rv.querySelector('.fm-next').addEventListener('click', function () { idx++; render(); });
        });
      });
    }

    function renderEnd() {
      var html = '<div class="fm-progress">Итог</div>';
      html += '<p class="fm-end">Ни один пункт здесь не был «правильным ответом» — история не устроена как тест. ' +
        'У каждой детали своя степень достоверности: что-то подтверждено документом, что-то — только пересказом. ' +
        'Сам подвиг это не отменяет и не преуменьшает.</p>';
      html += '<button type="button" class="fm-reset">Пройти заново</button>';
      mount.innerHTML = html;
      mount.querySelector('.fm-reset').addEventListener('click', function () { idx = 0; render(); });
      if (typeof window.rcEvent === 'function') { try { window.rcEvent('rc_game', { mechanic: cfg.mechanic || 'M-97' }); } catch (e) {} }
    }

    render();
  }

  function ensureStyles() {
    if (document.getElementById('fm-style')) return;
    var css = [
      '#factOrMyth{position:relative}',
      '.fm-progress{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a93a6);margin-bottom:12px}',
      '.fm-text{font-size:18px;line-height:1.6;max-width:64ch;margin:0 0 18px}',
      '.fm-options{display:flex;flex-wrap:wrap;gap:10px;max-width:64ch}',
      '.fm-opt{background:var(--surface,#0d1626);border:1px solid rgba(201,168,76,.28);color:var(--fg,#e8ecf4);padding:12px 16px;border-radius:10px;font-size:15px;cursor:pointer;transition:border-color .18s,background .18s}',
      '.fm-opt:hover:not(:disabled){border-color:var(--gold,#c9a84c);background:rgba(201,168,76,.07)}',
      '.fm-opt:disabled{cursor:default;opacity:.55}',
      '.fm-opt.fm-picked{border-color:var(--gold,#c9a84c);opacity:1;background:rgba(201,168,76,.12)}',
      '.fm-reveal{margin-top:16px;max-width:64ch;background:rgba(201,168,76,.08);border-left:3px solid var(--gold,#c9a84c);padding:14px 16px;border-radius:8px;font-size:16px;line-height:1.6}',
      '.fm-reveal b{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold,#c9a84c);margin-bottom:6px}',
      '.fm-reveal p{margin:0}',
      '.fm-next{margin-top:12px;background:none;border:1px solid rgba(201,168,76,.4);color:var(--gold,#c9a84c);padding:8px 16px;border-radius:8px;font-size:14px;cursor:pointer}',
      '.fm-next:hover{background:rgba(201,168,76,.12)}',
      '.fm-end{font-size:16px;line-height:1.6;max-width:64ch;margin:0 0 16px}',
      '.fm-reset{background:none;border:1px solid rgba(201,168,76,.4);color:var(--gold,#c9a84c);padding:9px 18px;border-radius:8px;font-size:14px;cursor:pointer;transition:background .18s}',
      '.fm-reset:hover{background:rgba(201,168,76,.12)}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'fm-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
