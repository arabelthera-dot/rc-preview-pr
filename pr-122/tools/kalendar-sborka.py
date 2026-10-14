#!/usr/bin/env python3
"""Сборка календаря сайта из утверждённых таблиц control/pilot-<музей>/*.html.

  python3 tools/kalendar-sborka.py [--check]        сверка всех музеев (код 1 при расхождении)
  python3 tools/kalendar-sborka.py --write [slug]   записать t/d утверждённых дней в файл данных

Настройка — tools/kalendar-sborka.json. Таблица: markdown в <pre>, заголовок
«| Дата | Название | Хук | ... |», строки дней «| 1 янв | ... |» (допускаются префикс «✓ » и хвост «★»).
t = вторая колонка без «**», d = колонка, в заголовке которой есть «Хук».
title_strip / hook_strip — регулярки служебных хвостов названия и хука (по музею).
Месяц утверждён, если в файле есть отметка из approval_markers или он в approved_override.
Запись меняет только t и d утверждённых дней; прочие поля дня, прочие ключи и все
остальные строки файла сохраняются как есть. Объект читается через node (vm).
"""
import html
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, 'tools', 'kalendar-sborka.json')

MONTH_ABBR = {
    '01': ('янв',), '02': ('фев',), '03': ('мар',), '04': ('апр',), '05': ('мая', 'май'),
    '06': ('июн',), '07': ('июл',), '08': ('авг',), '09': ('сен',), '10': ('окт',),
    '11': ('ноя',), '12': ('дек',),
}
DAY_RE = re.compile(r'^(?:✓\s*)?(\d{1,2})\s+([а-яё]+)\.?(?:\s*[★☆*✓✅]+)?$', re.I)
IDENT_RE = re.compile(r'^[A-Za-z_$][A-Za-z0-9_$]*$')
CAL_RE = re.compile(r'window\.MUSEUM_CALENDAR\s*=\s*')


# ---------- таблицы ----------

def split_row(line):
    """'| a | b \\| c |' -> ['a', 'b | c']"""
    s = line.strip()
    if s.startswith('|'):
        s = s[1:]
    if s.endswith('|') and not s.endswith('\\|'):
        s = s[:-1]
    cells = re.split(r'(?<!\\)\|', s)
    return [c.replace('\\|', '|').strip() for c in cells]


def clean(text):
    return re.sub(r'\s+', ' ', text.replace('**', '')).strip()


def pre_text(raw_html):
    """Текст всех <pre> файла (сущности раскрыты)."""
    parts = re.findall(r'<pre[^>]*>(.*?)</pre>', raw_html, flags=re.S | re.I)
    return '\n'.join(html.unescape(re.sub(r'<[^>]+>', '', p)) for p in parts)


def parse_table_text(text, mm):
    """Возвращает ({'MM-DD': {'t','d'}}, предупреждения). Берёт только таблицы,
    у которых заголовок начинается с «Дата» и есть колонка «Хук»."""
    rows, warns = {}, []
    hook_col = None
    for line in text.split('\n'):
        if not line.lstrip().startswith('|'):
            hook_col = None if not line.strip() else hook_col
            continue
        cells = split_row(line)
        if not cells:
            continue
        first = clean(cells[0])
        if first.lower() == 'дата':
            hook_col = next((i for i, c in enumerate(cells) if 'хук' in c.lower()), None)
            continue
        if hook_col is None or set(first) <= set('-: '):
            continue
        m = DAY_RE.match(first)
        if not m:
            continue
        day, abbr = int(m.group(1)), m.group(2).lower()
        if not abbr.startswith(MONTH_ABBR[mm]):
            warns.append(f'{mm}: строка «{first}» другого месяца — пропущена')
            continue
        if hook_col >= len(cells):
            warns.append(f'{mm}-{day:02d}: нет колонки хука')
            continue
        key = f'{mm}-{day:02d}'
        t, d = clean(cells[1]), clean(cells[hook_col])
        if not t or not d:
            warns.append(f'{key}: пустое название или хук')
            continue
        if key in rows:
            warns.append(f'{key}: день повторён в таблице — взята последняя строка')
        rows[key] = {'t': t, 'd': d}
    return rows, warns


def strip_title(t, patterns):
    """Убирает служебные хвосты названия (метки [У], `slug` · источник) по title_strip музея."""
    for pat in patterns:
        t = re.sub(pat, '', t)
    return clean(t)


def approved_days(museum, markers):
    days, warns, months_ok, months_no = {}, [], [], []
    override = set(museum.get('approved_override', []))
    for mm, fname in sorted(museum['months'].items()):
        path = os.path.join(ROOT, museum['tables'], fname)
        if not os.path.exists(path):
            warns.append(f'{mm}: нет файла {fname}')
            months_no.append(mm)
            continue
        raw = open(path, encoding='utf-8').read()
        if mm not in override and not any(mk in raw for mk in markers):
            months_no.append(mm)
            continue
        rows, w = parse_table_text(pre_text(raw), mm)
        warns += w
        for row in rows.values():
            row['t'] = strip_title(row['t'], museum.get('title_strip', []))
            row['d'] = strip_title(row['d'], museum.get('hook_strip', []))
        if not rows:
            warns.append(f'{mm}: утверждён, но строк дней не найдено')
        months_ok.append(mm)
        days.update(rows)
    return days, warns, months_ok, months_no


# ---------- файл данных ----------

NODE_READ = r"""
const fs=require('fs'),vm=require('vm');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),ctx);
process.stdout.write(JSON.stringify(ctx.window.MUSEUM_CALENDAR||null));
"""


def read_calendar(path):
    out = subprocess.run(['node', '-e', NODE_READ, path], capture_output=True, text=True, check=True)
    return json.loads(out.stdout) or {}


def find_object_span(src):
    """(start, end) выражения `window.MUSEUM_CALENDAR = {...};` с учётом строк и комментариев."""
    m = CAL_RE.search(src)
    if not m:
        return None
    i = m.end()
    if src[i] != '{':
        raise ValueError('MUSEUM_CALENDAR — не литерал объекта')
    depth, q = 0, None
    j = i
    while j < len(src):
        ch = src[j]
        if q:
            if ch == '\\':
                j += 2
                continue
            if ch == q:
                q = None
        elif ch in '"\'`':
            q = ch
        elif src.startswith('//', j):
            j = src.index('\n', j)
            continue
        elif src.startswith('/*', j):
            j = src.index('*/', j) + 2
            continue
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                j += 1
                break
        j += 1
    if j < len(src) and src[j] == ';':
        j += 1
    return m.start(), j


def fmt_value(v):
    return json.dumps(v, ensure_ascii=False)


def render_calendar(cal):
    blocks = []
    for key in sorted(cal):
        day = cal[key]
        order = ['t'] + [k for k in day if k != 't']
        lines = []
        for k in order:
            if k not in day:
                continue
            name = k if IDENT_RE.match(k) else fmt_value(k)
            lines.append(f'    {name}: {fmt_value(day[k])}')
        blocks.append(f'  {fmt_value(key)}: {{\n' + ',\n'.join(lines) + '\n  }')
    return 'window.MUSEUM_CALENDAR = {\n\n' + ',\n\n'.join(blocks) + '\n\n};'


def merge(cal, days):
    """t и d утверждённых дней поверх существующих; прочие поля и ключи сохраняются."""
    out = {k: dict(v) for k, v in cal.items()}
    for key, row in days.items():
        day = out.setdefault(key, {})
        if 'd' not in day:
            # новый день: t, d в начале
            out[key] = {'t': row['t'], 'd': row['d'], **{k: v for k, v in day.items() if k not in ('t', 'd')}}
        else:
            day['t'], day['d'] = row['t'], row['d']
    return out


def new_file_text(museum):
    title = museum.get('data_title', museum['slug'])
    return (f'/* Данные календаря музея «{title}».\n'
            '   Ключ — "ММ-ДД" по новому стилю. t и d собираются из утверждённых таблиц\n'
            f'   {museum["tables"]} инструментом tools/kalendar-sborka.py --write. */\n'
            'window.MUSEUM_CALENDAR = {};\n\n'
            '/* Текст карточки дня, для которого записи ещё нет. */\n'
            'window.MUSEUM_CALENDAR_EMPTY = "На этот день события ещё нет — календарь пополняется.";\n')


# ---------- режимы ----------

def diff(days, cal):
    bad = []
    for key in sorted(days):
        site = cal.get(key)
        if site is None:
            bad.append((key, 'нет на сайте'))
        elif clean(str(site.get('t', ''))) != days[key]['t']:
            bad.append((key, 't'))
        elif clean(str(site.get('d', ''))) != days[key]['d']:
            bad.append((key, 'd'))
    return bad


def main(argv):
    cfg = json.load(open(CONFIG, encoding='utf-8'))
    markers = cfg['approval_markers']
    write = '--write' in argv
    only = [a for a in argv if not a.startswith('--')]
    verbose = '-v' in argv or '--verbose' in argv
    fail = False
    for museum in cfg['museums']:
        slug = museum['slug']
        if only and slug not in only:
            continue
        days, warns, ok, no = approved_days(museum, markers)
        path = os.path.join(ROOT, museum['data'])
        exists = os.path.exists(path)
        if write and days:
            src = open(path, encoding='utf-8').read() if exists else new_file_text(museum)
            if not exists:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                open(path, 'w', encoding='utf-8').write(src)
            cal = read_calendar(path)
            span = find_object_span(src)
            if span is None:
                sys.exit(f'{slug}: в {museum["data"]} нет window.MUSEUM_CALENDAR')
            src = src[:span[0]] + render_calendar(merge(cal, days)) + src[span[1]:]
            open(path, 'w', encoding='utf-8').write(src)
            print(f'{slug}: записано {len(days)} утверждённых дней в {museum["data"]}'
                  + ('' if exists else ' (файл создан; страницы календаря нет)'))
        cal = read_calendar(path) if os.path.exists(path) else {}
        bad = diff(days, cal)
        if bad:
            fail = True
        keys = ', '.join(f'{k} ({why})' for k, why in bad[:15]) + (' …' if len(bad) > 15 else '')
        print(f'{slug}: утверждено {len(days)} дней (месяцы {",".join(ok) or "—"}; '
              f'не утверждены {",".join(no) or "—"}), в календаре сайта {len(cal)}'
              f'{"" if os.path.exists(path) else " (файла нет)"}, расходятся {len(bad)}'
              + (f' ({keys})' if bad else ''))
        for w in warns if verbose else warns[:5]:
            print(f'  ! {w}')
        if not verbose and len(warns) > 5:
            print(f'  ! … ещё {len(warns) - 5} предупреждений (-v)')
    for slug, why in cfg.get('excluded', {}).items():
        if not only:
            print(f'{slug}: не собирается — {why}')
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
