#!/usr/bin/env python3
"""Замок «страница сайта правится только через двойник».

Страница дня, которую ведёт конвейер (есть запись в platform/catalog/days/ проекта), обязана
собираться из данных байт в байт. Правка такой страницы в заявке сайта мимо данных — красный:
сначала заявка в AI_Projects (данные дня, sync-day.mjs), потом страница сюда.

Код заявки не исполняется: её HTML-файлы только читаются как данные и сверяются сборщиком
из main проекта. Страницы, которые конвейер не ведёт, не проверяются.

Окружение: PR, GH_TOKEN, PROJ (папка russian-civilization из AI_Projects), TWIN_CHECK_OFF=1 — выключить.
Проверка: python3 .github/twin_check.py --self-test
"""
import base64, glob, json, os, subprocess, sys

REPO = os.environ.get("GITHUB_REPOSITORY", "arabelthera-dot/rc-museum-preview")


def gh(*a):
    return subprocess.run(["gh", "api", *a], check=True, capture_output=True, text=True).stdout


def museums(proj):
    out = set()
    for f in glob.glob(os.path.join(proj, "platform/catalog/days/*.json")):
        m = json.load(open(f, encoding="utf-8")).get("museum")
        if m:
            out.add(m)
    return sorted(out)


def differ(proj, museum):
    r = subprocess.run(["node", "platform/scripts/build-museum.mjs", museum, "--check", "--json"],
                       cwd=proj, capture_output=True, text=True)
    try:
        check = json.loads(r.stdout)["check"] or {}
    except (ValueError, KeyError):
        sys.exit(f"✗ сборщик проекта не ответил по музею {museum}:\n{(r.stderr or r.stdout)[-1500:]}")
    return check.get("differ", [])


def verdict(proj, pages):
    """pages: {путь на сайте: текст из заявки}. Возвращает список строк-нарушений."""
    for path, text in pages.items():
        dest = os.path.join(proj, "rc-museum-preview", path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as fh:
            fh.write(text)
    bad = []
    for m in museums(proj):
        for d in differ(proj, m):
            bad.append(f"{m}-{d['slug']}: страница расходится со сборкой из данных со строки {d['line']}")
    return bad


def pr_pages(pr):
    files = json.loads(gh(f"repos/{REPO}/pulls/{pr}/files", "--paginate", "--slurp"))
    files = [f for page in files for f in page]
    head = json.loads(gh(f"repos/{REPO}/pulls/{pr}"))["head"]
    pages = {}
    for f in files:
        if f["status"] == "removed" or not f["filename"].endswith(".html"):
            continue
        raw = json.loads(gh(f"repos/{head['repo']['full_name']}/contents/{f['filename']}?ref={head['sha']}"))
        pages[f["filename"]] = base64.b64decode(raw["content"]).decode("utf-8")
    return pages


def self_test():
    proj = os.environ["PROJ"]
    name = "05jan"
    day = json.load(open(os.path.join(proj, "platform/catalog/days/izobreteniya-05jan.json"), encoding="utf-8"))
    path = f"muzei/izobreteniya/{day['file']}"
    text = open(os.environ["PAGE"], encoding="utf-8").read()
    assert verdict(proj, {path: text}) == [], "принятая страница должна совпасть"
    lines = text.split("\n")
    lines[49] += " "
    bad = verdict(proj, {path: "\n".join(lines)})
    assert bad and name in bad[0] and "строки 50" in bad[0], bad
    other = {path: text, "muzei/izobreteniya/day-02jan-x.html": "<p>ручная</p>"}
    assert verdict(proj, other) == [], "страница вне конвейера не проверяется"
    print("twin_check self-test: 3/3")


def main():
    if os.environ.get("TWIN_CHECK_OFF") == "1":
        print("замок двойника выключен (TWIN_CHECK_OFF=1)")
        return
    proj = os.environ.get("PROJ", "")
    if not os.path.isdir(os.path.join(proj, "platform")):
        print("::notice::нет доступа к данным проекта (секрет TWIN_READ_KEY) — замок спит")
        return
    pages = pr_pages(os.environ["PR"])
    if not pages:
        print("страниц в заявке нет")
        return
    bad = verdict(proj, pages)
    if bad:
        print("✗ Страница дня правится мимо двойника. Сначала заявка в AI_Projects: данные дня "
              "(node platform/scripts/sync-day.mjs <день>), после слияния — страница сюда.")
        for b in bad:
            print("  · " + b)
        sys.exit(1)
    print(f"✓ двойник: {len(pages)} стр. в заявке, расхождений со сборкой нет")


if __name__ == "__main__":
    self_test() if "--self-test" in sys.argv else main()
