#!/usr/bin/env node
/* Регрессионный тест общего движка витрины календаря (assets/museum-calendar-page.js).
   Два режима: датированный музей (без конфига, как было до правки) и недатированный
   («День N»; год — 365 дней, записи сверх года идут отдельным блоком).
   Запуск: node tests/test-museum-calendar-page.mjs
   Рамка: решение Сергея 10.09.2026 — «оставляй 365, как в году должно быть;
   они остаются» (строка engine-vitrina-376-1010, вопрос снят). */
import { readFileSync } from 'node:fs';

const HERE = new URL('.', import.meta.url);
const ENGINE = readFileSync(new URL('../assets/museum-calendar-page.js', HERE), 'utf8');
const DATA = readFileSync(new URL('../muzei/ne-sdayutsya/calendar-nesdayutsya.js', HERE), 'utf8');

const BTN = /<button class="([^"]*)"([^>]*)>(\d+)<\/button>/g;
const SECTION = /<section class="cmon"><h2>([^<]+)<span class="cnt">([^<]*)<\/span><\/h2><div class="cgrid">(.*?)<\/div><\/section>/gs;

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

function makeEl(id) {
  const el = {
    id, style: {}, _html: '', labels: [],
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, scrollIntoView() {},
    querySelectorAll(sel) {
      const all = this._btns || [];
      if (sel.includes('data-k')) return all.filter((b) => b.dataset.k);
      return all;
    },
    querySelector(sel) {
      const m = sel.match(/data-k="([^"]+)"/);
      return (this._btns || []).find((b) => b.dataset.k === (m ? m[1] : null)) || null;
    },
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html; },
    set(html) {
      this._html = html;
      this._btns = [];
      let m;
      BTN.lastIndex = 0;
      while ((m = BTN.exec(html))) {
        const tag = m[2];
        const k = attr(tag, 'data-k');
        el._btns.push({
          dataset: k ? { k } : {},
          title: attr(tag, 'title') || '',
          label: m[3],
          addEventListener() {},
          classList: { _s: new Set(m[1].split(/\s+/).filter(Boolean)),
            contains(c) { return this._s.has(c); }, add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); } },
        });
      }
    },
  });
  return el;
}

function render(museumCalendar) {
  const host = makeEl('calyear');
  const card = makeEl('calcard');
  const window = { MUSEUM_CALENDAR: museumCalendar };
  const document = {
    readyState: 'complete',
    getElementById: (id) => (id === 'calyear' ? host : id === 'calcard' ? card : null),
    addEventListener() {},
  };
  new Function('window', 'document', ENGINE)(window, document);
  const sections = [...host.innerHTML.matchAll(SECTION)].map((s) => ({
    month: s[1], cnt: s[2], cells: [...s[3].matchAll(BTN)].length,
    filled: (s[3].match(/data-k=/g) || []).length,
  }));
  return { host, card, sections, html: host.innerHTML };
}

let fails = 0;
function check(name, cond, extra = '') {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : ' — ' + extra));
  if (!cond) fails++;
}
/* подпись счётчика зависит от режима: у датированного музея — «Заполнено дней»,
   у недатированного — «Открыто» (там «день» это номер единицы состава, не день года) */
const stat = (html) => (html.match(/(?:Заполнено дней|Открыто): <b>(\d+)<\/b> из (\d+)/) || []).slice(1, 3);

/* ── 1. Датированный музей: конфига нет, движок обязан вести себя как раньше ── */
console.log('Режим 1: датированный музей (без конфига)');
{
  const dated = { '01-01': { t: 'День первый', d: 'хук' }, '03-15': { t: 'День второй', d: 'хук' } };
  const r = render(dated);
  const [filled, total] = stat(r.html);
  check('счётчик «2 из 365»', filled === '2' && total === '365', stat(r.html).join('/'));
  check('длина января 31, марта 31, февраля 29',
    r.sections[0].cells === 31 && r.sections[1].cells === 29 && r.sections[2].cells === 31,
    r.sections.slice(0, 3).map((s) => s.cells).join(','));
  /* 366, а не 365: в списке движка февраль 29 (високосный). Так было до правки,
     и трогать это нельзя — обратная совместимость важнее косметики счётчика. */
  check('всего клеток 366 — ровно как было до правки',
    r.sections.reduce((a, s) => a + s.cells, 0) === 366,
    String(r.sections.reduce((a, s) => a + s.cells, 0)));
  check('заполненных клеток 2', r.sections.reduce((a, s) => a + s.filled, 0) === 2);
  check('карточка подписана календарным днём («1 января»), а не «День 1»',
    /\d+ (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/.test(r.card.innerHTML) &&
    !/День \d+ ·/.test(r.card.innerHTML),
    r.card.innerHTML.slice(0, 90));
}

/* ── 2. Недатированный музей: год — 365 дней, единицы сверх года — отдельно ── */
console.log('Режим 2: «Русские не сдаются» — год 365 дней, 376 записей, 11 сверх года');
{
  const window = {};
  new Function('window', DATA)(window);
  const data = window.MUSEUM_CALENDAR;
  const r = render(data);
  const [filled, total] = stat(r.html);
  const keys = Object.keys(data).filter((k) => /^\d{2}-\d{2}$/.test(k)).length;
  const BEYOND = r.html.match(
    /<section class="cmon beyond"><h2>Сверх года<span class="cnt">([^<]*)<\/span><\/h2><div class="cgrid cgrid-wide">(.*?)<\/div><\/section>/s);
  const chips = BEYOND ? [...BEYOND[2].matchAll(/data-k="(\d{2}-\d{2})"/g)].map((m) => m[1]) : [];
  const cells = r.sections.reduce((a, s) => a + s.cells, 0);

  check('в данных 376 записей — состав не урезан', keys === 376, String(keys));
  check('месяцы как в году: январь 31, февраль 28, март 31',
    r.sections[0].cells === 31 && r.sections[1].cells === 28 && r.sections[2].cells === 31,
    r.sections.slice(0, 3).map((s) => s.cells).join(','));
  check('всего клеток 365 — год как в году', cells === 365, String(cells));
  check('счётчик «365 из 365»', filled === '365' && total === '365', [filled, total].join('/'));
  check('в счётчике сказано про записи сверх года, и что они остаются',
    /сверх года ещё 11 записей/.test(r.html) && /они остаются в музее/.test(r.html),
    (r.html.match(/<div class="calstat">.*?<\/div>/s) || [''])[0].slice(0, 200));
  check('блок «Сверх года» есть и в нём 11 записей', chips.length === 11, String(chips.length));
  check('32-й день января в сетку года не влез, но из музея не пропал',
    !r.host._btns.some((b) => b.dataset.k === '01-32') && chips.includes('01-32'),
    chips.join(','));
  check('подпись единицы года — «День N», без числа месяца',
    (r.host._btns.find((b) => b.dataset.k === '01-05') || {}).title.startsWith('День 5 —'),
    (r.host._btns.find((b) => b.dataset.k === '01-05') || {}).title);
  check('метки «сегодня» нет ни на одной клетке', !/class="cday full today/.test(r.html));
  check('карточка открывает первую единицу состава', /День 1 · Январь/.test(r.card.innerHTML),
    r.card.innerHTML.slice(0, 80));
}

console.log('Режим 3: графы «Механика» и «Источник» в карточке дня (museum-core §1-бис-3)');
{
  const full = { '01-01': { t: 'Экспонат', d: 'хук', mech: 'проводишь пальцем — проявляется подпись',
                            src: 'Третьяковская галерея, карточка ж-123' } };
  const r = render(full);
  check('строка «Механика» с текстом механики', /Механика<\/span>проводишь пальцем/.test(r.card.innerHTML),
    r.card.innerHTML.slice(0, 300));
  check('строка «Источник» с текстом источника', /Источник<\/span>Третьяковская/.test(r.card.innerHTML));
  const bare = render({ '01-01': { t: 'Экспонат', d: 'хук' } });
  check('нет полей — нет строк, карточка как раньше', !/class="crow"/.test(bare.card.innerHTML));
}

console.log(fails ? '\nПРОВАЛЕНО проверок: ' + fails : '\nВсе проверки пройдены.');
process.exit(fails ? 1 : 0);
