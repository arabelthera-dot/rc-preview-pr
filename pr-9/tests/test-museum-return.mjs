#!/usr/bin/env node
/* Регрессионный тест движка возврата (assets/museum-return.js).
   Два режима: датированный музей («12 января», «Завтра, 13 января») и недатированный
   (dated:false — «День 12 · Январь», «Завтра — день 13 · Январь», следующая единица
   состава, а не календарный +1). Строка museum-return-dated-false-0810.
   Запуск: node tests/test-museum-return.mjs */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ENGINE = readFileSync(new URL('../assets/museum-return.js', import.meta.url), 'utf8');
let fail = 0;
const ok = (c, msg) => { if (!c) { fail++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

function run(cal, day) {
  const box = { id: 'return', innerHTML: '', setAttribute() {}, querySelector: () => null };
  const store = {};
  const document = {
    readyState: 'complete',
    currentScript: { getAttribute: (n) => ({ 'data-museum': 'test', 'data-day': day })[n] || null },
    documentElement: { getAttribute: () => null },
    getElementById: (id) => (id === 'return' ? box : null),
    createElement: () => ({}),
    head: { appendChild() {} },
  };
  const localStorage = { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } };
  vm.runInNewContext(ENGINE, { window: { MUSEUM_CALENDAR: cal }, document, localStorage, Date, JSON, Object });
  return box.innerHTML;
}

console.log('датированный музей');
let h = run({ '01-12': { t: 'Матросов', href: 'a.html' }, '01-13': { t: 'Рогозов' } }, '01-12');
ok(h.includes('12 января · Матросов'), 'чип — календарная дата');
ok(h.includes('Завтра, 13 января'), 'намёк — завтрашняя дата');

console.log('недатированный музей (dated:false)');
const und = { total: 365, dated: false,
  '01-12': { t: 'Матросов', href: 'a.html' }, '01-14': { t: 'Рогозов' }, '01-31': { t: 'Последний' },
  '02-01': { t: 'Февраль-1' } };
h = run(und, '01-12');
ok(h.includes('День 12 · Январь · Матросов'), 'чип — «День 12 · Январь»');
ok(!/\d+ января/.test(h), 'ни одной календарной даты');
ok(h.includes('Завтра — день 14 · Январь'), 'намёк — следующая единица состава, а не +1');
ok(h.includes('из 1 в календаре'), 'служебные total/dated не считаются днями');
h = run(und, '01-31');
ok(h.includes('Завтра — день 1 · Февраль'), 'переход через месяц по составу');
h = run(und, '02-01');
ok(!h.includes('Завтра'), 'после последней единицы намёка нет');

if (fail) { console.log(`ПРОВАЛ: ${fail}`); process.exit(1); }
console.log('все проверки зелёные');
