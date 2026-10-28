"""의과학과 교수진 이름 북: data/profs.json -> namebook.html -> namebook.pdf

    pip install segno
    python3 build.py            # HTML + PDF (Chrome/Chromium 있으면)
    python3 build.py --html     # HTML만
"""
import html, json, os, shutil, subprocess, sys
from pathlib import Path

import segno

ROOT = Path(__file__).resolve().parent
PER_PAGE = 6
KINDS = ["기초", "임상"]
KIND_TITLE = {"기초": "기초의학 교실", "임상": "임상의학 교실"}

e = html.escape


def qr_svg(url):
    # viewBox만 두고 크기는 CSS가 정한다
    return segno.make(url, error="m").svg_inline(omitsize=True, border=0, dark="#1f2430")


def card(p):
    kws = "".join(f"<li>{e(k)}</li>" for k in p["keywords"])
    links = "".join(f'<a href="{e(url)}">{e(label)} →</a>' for url, label in p["links"])
    contact = ""
    if p["contact"]:
        who, info = p["contact"]
        contact = f'<p class="contact"><span>담당자</span> {e(who)}' + (f"<br>{e(info)}" if info else "") + "</p>"
    return f"""<article class="card" id="{e(p['name'])}">
  <img class="photo" src="{e(p['photo'])}" alt="">
  <div class="id">
    <h3><span class="name">{e(p['name'])}</span><span class="rank">{e(p['rank'])}</span></h3>
    <p class="dept">{e(p['dept'])}</p>
    {contact}
  </div>
  <div class="about">
    <p class="line">{e(p['line'])}</p>
    <ul class="kw">{kws}</ul>
    <p class="go">{links}</p>
  </div>
</article>"""


def page(no, label, title, body, cls=""):
    return f"""<section class="page {cls}">
  <header><p class="label">{e(label)}</p><h2>{e(title)}</h2></header>
  {body}
  <footer><span>경북대학교 일반대학원 의과학과</span><span>{no}</span></footer>
</section>"""


def build():
    data = json.loads((ROOT / "data/profs.json").read_text(encoding="utf-8"))
    meta, profs = data["meta"], data["profs"]
    profs.sort(key=lambda p: (KINDS.index(p["kind"]), p["dept"], p["name"]))

    # 기초·임상은 각각 새 쪽에서 시작
    pages, where = [], {}
    for kind in KINDS:
        group = [p for p in profs if p["kind"] == kind]
        for i in range(0, len(group), PER_PAGE):
            chunk = group[i:i + PER_PAGE]
            no = len(pages) + 2
            for p in chunk:
                where[p["name"]] = no
            pages.append(page(no, "의과학과 교수진", KIND_TITLE[kind],
                              '<div class="grid">' + "".join(card(p) for p in chunk) + "</div>",
                              "cont" if i else ""))

    n_kind = {k: sum(p["kind"] == k for p in profs) for k in KINDS}
    n_dept = len({p["dept"] for p in profs})
    index = "".join(f'<li><a href="#{e(n)}"><span>{e(n)}</span><i></i><b>{where[n]}</b></a></li>'
                    for n in sorted(where))
    cover = page(1, meta["school"], meta["title"], f"""
  <p class="lead">{e(meta['lead'])}</p>
  <div class="stats">
    <div><b>{len(profs)}</b><span>교수진</span></div>
    <div><b>{n_kind['기초']}</b><span>기초의학</span></div>
    <div><b>{n_kind['임상']}</b><span>임상의학</span></div>
    <div><b>{n_dept}</b><span>교실·센터</span></div>
  </div>
  <div class="cover-body">
    <div class="index"><h3>교수님 찾아보기 <small>가나다순 · 쪽</small></h3><ol>{index}</ol></div>
    <aside class="home">
      <figure class="qr big">{qr_svg(meta['bookUrl'])}</figure>
      <p class="book"><b>휴대폰으로 보기</b><br>나에게 맞는 연구실 찾기 테스트도 있어요<br><a href="{e(meta['bookUrl'])}">{e(meta['bookUrl'].split('//')[1].rstrip('/')).replace('/', '/<wbr>')}</a></p>
      <p class="how">카드 아래 링크를 누르면 연구실 홈페이지나 교수 소개 페이지가 열려요.</p>
      <p class="how">의과학과 홈페이지<br><a href="{e(meta['deptUrl'])}">{e(meta['deptUrl'].split('//')[1].rstrip('/'))}</a></p>
    </aside>
  </div>""", "cover")

    # 화면 맨 앞의 관심 분야 테스트 (인쇄에서는 숨김)
    quiz = json.loads((ROOT / "data/quiz.json").read_text(encoding="utf-8"))
    quiz["profs"] = [{k: p[k] for k in ("name", "rank", "dept", "photo", "keywords", "style", "topics")}
                     | {"page": where[p["name"]]} for p in profs]
    quiz_json = json.dumps(quiz, ensure_ascii=False).replace("</", "<\\/")

    css = (ROOT / "style.css").read_text(encoding="utf-8")
    js = (ROOT / "quiz.js").read_text(encoding="utf-8")
    out = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(meta['title'])}</title>
<style>{css}</style></head>
<body>
<section class="quiz" id="quiz"></section>
<div id="book"></div>
{cover}
{''.join(pages)}
<script id="quiz-data" type="application/json">{quiz_json}</script>
<script>{js}</script>
</body></html>"""
    (ROOT / "namebook.html").write_text(out, encoding="utf-8")
    print(f"namebook.html: {len(profs)}명, {len(pages) + 1}쪽")


def pdf():
    chrome = os.environ.get("CHROME") or next(
        (c for c in ["/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", "google-chrome",
                     "chromium", "chromium-browser",
                     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
         if shutil.which(c) or Path(c).exists()), None)
    if not chrome:
        print("Chrome을 찾지 못했어요. namebook.html을 브라우저에서 열어 PDF로 인쇄해 주세요.")
        return
    subprocess.run([chrome, "--headless", "--no-sandbox", "--no-pdf-header-footer",
                    "--virtual-time-budget=5000", f"--print-to-pdf={ROOT / 'namebook.pdf'}",
                    (ROOT / "namebook.html").as_uri()], check=True, capture_output=True)
    print("namebook.pdf")


if __name__ == "__main__":
    build()
    if "--html" not in sys.argv:
        pdf()
