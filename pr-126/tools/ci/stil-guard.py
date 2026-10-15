#!/usr/bin/env python3
"""Сторож заплаток: вид страниц правится в общих файлах assets/*.css, не внутри страницы.

Сергей, 15.10.2026: «изменяя сейчас страницы так чтобы это действовало постоянно как автоматика
как во всем мире сделано». Мировой приём — «храповик» (ratchet) линтера: старые свои стили
страницы не трогаем, но заявка не может их УВЕЛИЧИТЬ. Новое правило вида — только в общем
файле assets/*.css, тогда оно действует на все страницы сразу.

Два правила для изменённых страниц заявки (muzei/**.html и index.html в корне):
  1. старая страница: свои стили (<style>…</style> и style="…") можно ТОЛЬКО удалять — любая вставка
     или замена внутри них = заплатка, даже без роста объёма (дыра 15.10: три цвета на месте прошли);
  1а. новая страница: своих стилей нет совсем; разрешён только style="--токен:значение" (данные, не вид).
  2. шрифты не блокируют первый экран: assets/fonts.css — только с media="print" onload.
Исключение — метка заявки «stil-soglasovano», ставится ТОЛЬКО после «да» Сергея на заявке.

Запуск:  python3 tools/ci/stil-guard.py check <base-ref> <файлы…>
         python3 tools/ci/stil-guard.py fix-fonts <файлы…>   — перевести шрифты на неблокирующие
"""
import difflib
import re, subprocess, sys

STYLE_BLOCK = re.compile(r"<style\b[^>]*>(.*?)</style>", re.S | re.I)
STYLE_ATTR = re.compile(r"""\sstyle\s*=\s*("[^"]*"|'[^']*')""", re.I)
FONTS_BLOCKING = re.compile(r"""<link\s+rel="stylesheet"\s+href="([^"]*assets/fonts\.css)"\s*>""")
FONTS_FIXED = r"""<link rel="stylesheet" href="\1" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="\1"></noscript>"""


def style_parts(text):
    return STYLE_BLOCK.findall(text) + [m[1:-1] for m in STYLE_ATTR.findall(text)]


def only_deleted(old, new):
    """Новое получено из старого одними удалениями (храповик: стили страницы только уходят)."""
    sm = difflib.SequenceMatcher(None, "\x00".join(style_parts(old)), "\x00".join(style_parts(new)), autojunk=False)
    return all(op in ("equal", "delete") for op, *_ in sm.get_opcodes())


TOKEN_ONLY = re.compile(r"^\s*(--[\w-]+\s*:[^;]+;?\s*)+$")


def own_style(text):
    return sum(len(m) for m in STYLE_BLOCK.findall(text)) + sum(len(m) for m in STYLE_ATTR.findall(text))


def blocking_fonts(text):
    # внутри <noscript> блокирующая ссылка законна — это запасной путь без JS
    return len(FONTS_BLOCKING.findall(re.sub(r"<noscript>.*?</noscript>", "", text, flags=re.S)))


def base_text(ref, path):
    r = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def check(ref, files):
    bad = []
    for f in files:
        try:
            new = open(f, encoding="utf-8").read()
        except FileNotFoundError:
            continue
        if blocking_fonts(new):
            bad.append(f"{f}: шрифты блокируют первый экран — запусти `python3 tools/ci/stil-guard.py fix-fonts {f}`")
        old = base_text(ref, f)
        before, after = (own_style(old) if old is not None else None), own_style(new)
        if before is None:
            vid = [x for x in STYLE_BLOCK.findall(new)] + \
                  [m[1:-1] for m in STYLE_ATTR.findall(new) if not TOKEN_ONLY.match(m[1:-1])]
            if vid:
                bad.append(f"{f}: новая страница со своими стилями ({len(vid)} мест) — заплатка с рождения. "
                           "Вид — только в общем assets/*.css; в странице разрешён лишь style=\"--токен:значение\"")
        elif not only_deleted(old, new):
            bad.append(f"{f}: свои стили страницы изменены (было {before} байт, стало {after}) — заплатка. "
                       "В старой странице стили можно только удалять; правило вида — в общий assets/*.css")
    for b in bad:
        print(f"::error::{b}")
    print(f"страниц проверено: {len(files)}, нарушений: {len(bad)}")
    return 1 if bad else 0


def fix_fonts(files):
    n = 0
    for f in files:
        t = open(f, encoding="utf-8").read()
        u = FONTS_BLOCKING.sub(FONTS_FIXED, t)
        if u != t:
            open(f, "w", encoding="utf-8").write(u)
            n += 1
    print(f"шрифты переведены на неблокирующие: {n} страниц")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("check", "fix-fonts"):
        sys.exit(__doc__)
    if sys.argv[1] == "check":
        sys.exit(check(sys.argv[2], [f for f in sys.argv[3:] if f.endswith(".html")]))
    sys.exit(fix_fonts(sys.argv[2:]))
