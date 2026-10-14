#!/usr/bin/env python3
"""Тесты tools/kalendar-sborka.py: разбор строки таблицы и сохранение доп.полей дня.
Запуск: python3 tools/test-kalendar-sborka.py (нужен node для теста записи)."""
import importlib.util
import os
import subprocess
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ks', os.path.join(HERE, 'kalendar-sborka.py'))
ks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ks)

TABLE = """| Дата | Тема дня / Событие / Экспонат | Хук | Механика |
|---|---|---|---|
| ✓ 1 янв | **Ёлочный базар** — Кустодиев | Ёлки продают \\| и дарят | зум |
| 2 янв | «Тройка» — Перов | Трое детей тянут бочку | — |
| 3 фев | чужой месяц | хук | — |
"""


class ParseTest(unittest.TestCase):
    def test_row(self):
        rows, warns = ks.parse_table_text(TABLE, '01')
        self.assertEqual(sorted(rows), ['01-01', '01-02'])
        self.assertEqual(rows['01-01'], {'t': 'Ёлочный базар — Кустодиев', 'd': 'Ёлки продают | и дарят'})
        self.assertTrue(any('3 фев' in w for w in warns))

    def test_hook_column_by_header(self):
        text = '| Дата | Экспонат | Механика | Хук дня |\n|---|---|---|---|\n| 5 мая | Победа | карта | Хук |\n'
        rows, _ = ks.parse_table_text(text, '05')
        self.assertEqual(rows['05-05'], {'t': 'Победа', 'd': 'Хук'})

    def test_table_without_hook_ignored(self):
        rows, _ = ks.parse_table_text('| Дата | Было | Стало |\n| 1 янв | а | б |\n', '01')
        self.assertEqual(rows, {})

    def test_strip_title(self):
        t = 'Башня, 1720-е [У] · `nevyansk` · музей'
        self.assertEqual(ks.strip_title(t, [r'\s*\[У\]', r'\s*·\s*`.*$']), 'Башня, 1720-е')


class WriteTest(unittest.TestCase):
    def test_merge_keeps_extra_fields_and_lines(self):
        src = ('/* шапка */\nwindow.MUSEUM_CALENDAR = {\n  "07-29": {t: "старое", y: 1817, d: "x { } ;", '
               'href: "a.html", link: "→"},\n  "12-31": {t: "чужой", d: "оставить"}\n};\n'
               'window.MUSEUM_CALENDAR_EMPTY = "пусто";\nwindow.MUSEUM_PUBLISHED = [1];\n')
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(src)
            path = f.name
        try:
            cal = ks.read_calendar(path)
            new = ks.merge(cal, {'07-29': {'t': 'Новое', 'd': 'Хук'}, '01-01': {'t': 'Т', 'd': 'Д'}})
            span = ks.find_object_span(src)
            out = src[:span[0]] + ks.render_calendar(new) + src[span[1]:]
            open(path, 'w', encoding='utf-8').write(out)
            got = ks.read_calendar(path)
            self.assertEqual(got['07-29'], {'t': 'Новое', 'y': 1817, 'd': 'Хук', 'href': 'a.html', 'link': '→'})
            self.assertEqual(got['12-31'], {'t': 'чужой', 'd': 'оставить'})
            self.assertEqual(got['01-01'], {'t': 'Т', 'd': 'Д'})
            self.assertTrue(out.startswith('/* шапка */\n'))
            self.assertIn('window.MUSEUM_CALENDAR_EMPTY = "пусто";\nwindow.MUSEUM_PUBLISHED = [1];', out)
            subprocess.run(['node', '--check', path], check=True)
        finally:
            os.unlink(path)

    def test_diff(self):
        days = {'01-01': {'t': 'А', 'd': 'Б'}, '01-02': {'t': 'В', 'd': 'Г'}, '01-03': {'t': 'Д', 'd': 'Е'}}
        cal = {'01-01': {'t': 'А', 'd': 'Б', 'y': 1}, '01-02': {'t': 'В', 'd': 'другое'}}
        self.assertEqual(ks.diff(days, cal), [('01-02', 'd'), ('01-03', 'нет на сайте')])


if __name__ == '__main__':
    unittest.main()
