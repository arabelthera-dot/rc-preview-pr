#!/usr/bin/env python3
"""Предпросмотр заявки rc-museum-preview (deploy preview, как у Vercel/Netlify).

Файлы заявки кладутся в rc-preview-pr/pr-N/ с той же раскладкой папок; ссылки на файлы,
которых в заявке нет (общие движки, картинки, соседние страницы), переписываются на живой сайт.
Закрыта заявка — папка pr-N удаляется. Ссылка — комментарием в заявке.
Выключатель: переменная репо PR_PREVIEW_OFF=1.
"""
import json, os, posixpath, random, re, shutil, subprocess, sys, time, urllib.parse, urllib.request

REPO = os.environ.get("GITHUB_REPOSITORY", "arabelthera-dot/rc-museum-preview")
LIVE = "https://arabelthera-dot.github.io/rc-museum-preview/"
PREV_REPO = "arabelthera-dot/rc-preview-pr"
PREV = "https://arabelthera-dot.github.io/rc-preview-pr/"
MARK = "<!-- pr-preview -->"
N = os.environ["PR"].strip()
SKIP = re.compile(r"^(#|[a-z][a-z0-9+.-]*:|//|\{|\$|$)", re.I)


def gh(*a, inp=None):
    return subprocess.run(["gh", "api", *a], check=True, capture_output=True, text=True, input=inp).stdout


def git(*a, cwd="site"):
    subprocess.run(["git", *a], cwd=cwd, check=True)


def fix(page, val, changed):
    if val.startswith("#") and len(val) > 1:  # якорь своей страницы: <base> увёл бы его на живой сайт
        return f"{PREV}pr-{N}/{page}{val}"
    if SKIP.match(val.strip()) and not val.startswith("/rc-museum-preview/"):
        return val
    m = re.match(r"([^?#]*)(.*)", val.strip())
    path, tail = m.group(1), m.group(2)
    if path.startswith("/rc-museum-preview/"):
        res = path[len("/rc-museum-preview/"):]
    elif path.startswith("/"):
        return val
    else:
        res = posixpath.normpath(posixpath.join(posixpath.dirname(page), path))
        if res.startswith(".."):
            return val
    if res in changed:
        return f"{PREV}pr-{N}/{res}{tail}"
    return LIVE + res + tail


def rewrite(page, html, changed):
    def attr(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        if name.lower() in ("srcset", "imagesrcset", "data-srcset"):
            parts = []
            for p in val.split(","):
                bits = p.strip().split(None, 1)
                if bits:
                    bits[0] = fix(page, bits[0], changed)
                parts.append(" ".join(bits))
            return f"{name}={q}{', '.join(parts)}{q}"
        return f"{name}={q}{fix(page, val, changed)}{q}"
    html = re.sub(r"\b(src|href|poster|data-src|srcset|imagesrcset|data-srcset)=([\"'])(.*?)\2", attr, html, flags=re.I | re.S)
    html = re.sub(r"url\((['\"]?)([^'\")]+)\1\)",
                  lambda m: f"url({m.group(1)}{fix(page, m.group(2), changed)}{m.group(1)})", html)
    return re.sub(r"<head([^>]*)>", r'<head\1><meta name="robots" content="noindex">'
                  f'<base href="{LIVE}{posixpath.dirname(page)}/">', html, count=1, flags=re.I)


def main():
    if os.environ.get("PR_PREVIEW_OFF") == "1":
        print("выключено PR_PREVIEW_OFF=1"); return
    pr = json.loads(gh(f"repos/{REPO}/pulls/{N}"))
    files = [json.loads(l) for l in gh("--paginate", f"repos/{REPO}/pulls/{N}/files",
                                        "--jq", ".[]|{filename,status}").splitlines() if l]
    key = os.path.expanduser("~/.pp_key")
    with open(key, "w") as f:
        f.write(os.environ["DEPLOY_KEY"].strip() + "\n")
    os.chmod(key, 0o600)
    os.environ["GIT_SSH_COMMAND"] = f"ssh -i {key} -o StrictHostKeyChecking=accept-new"
    subprocess.run(["git", "clone", "-q", f"git@github.com:{PREV_REPO}.git", "site"], check=True)
    git("config", "user.name", "pr-preview")
    git("config", "user.email", "pr-preview@users.noreply.github.com")
    out = os.path.join("site", f"pr-{N}")
    shutil.rmtree(out, ignore_errors=True)
    pages = []
    if pr["state"] == "open":
        head, sha = pr["head"]["repo"]["full_name"], pr["head"]["sha"]
        live = [f["filename"] for f in files if f["status"] != "removed"]
        changed = set(live)
        for p in live:
            url = f"https://raw.githubusercontent.com/{head}/{sha}/{urllib.parse.quote(p)}"
            data = urllib.request.urlopen(url, timeout=60).read()
            dst = os.path.join(out, p)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if p.endswith(".html"):
                data = rewrite(p, data.decode("utf-8"), changed).encode("utf-8")
                pages.append(p)
            with open(dst, "wb") as f:
                f.write(data)
        links = "".join(f'<li><a href="{p}">{p}</a></li>' for p in pages)
        with open(os.path.join(out, "index.html"), "w") as f:
            f.write(f'<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">'
                    f'<meta name="rc-sha" content="{sha}"><title>Заявка №{N}</title><h1>Заявка №{N}: {pr["title"]}</h1><ul>{links}</ul>')
    git("add", "-A")
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd="site").returncode:
        git("commit", "-qm", f"pr-{N}: {'обновлено' if pr['state'] == 'open' else 'заявка закрыта, удалено'}")
        # соседние заявки пишут в то же репо параллельно (пачка переоткрытий — десятки сразу):
        # повтор с растущей паузой и случайным разбросом, чтобы прогоны не толкались в одну секунду
        for i in range(10):
            if subprocess.run(["git", "push", "-q", "origin", "HEAD:main"], cwd="site").returncode == 0:
                break
            time.sleep(min(30, 2 ** i) * random.uniform(0.5, 1.5))
            git("pull", "-q", "--rebase", "origin", "main")
        else:
            sys.exit("push не прошёл 10 раз")
    if pr["state"] != "open":
        return
    body = MARK + f"\n**Предпросмотр заявки** — страницы открываются с телефона до слияния (обновление ~1 мин после пуша):\n"
    body += "".join(f"\n- {PREV}pr-{N}/{p}" for p in pages) or f"\n- {PREV}pr-{N}/ (страниц в заявке нет)"
    old = [c for c in json.loads(gh(f"repos/{REPO}/issues/{N}/comments", "--paginate")) if MARK in (c.get("body") or "")]
    if old:
        gh("-X", "PATCH", f"repos/{REPO}/issues/comments/{old[0]['id']}", "--input", "-", inp=json.dumps({"body": body}))
    else:
        gh("-X", "POST", f"repos/{REPO}/issues/{N}/comments", "--input", "-", inp=json.dumps({"body": body}))
    print("\n".join(f"{PREV}pr-{N}/{p}" for p in pages))


if __name__ == "__main__":
    main()
