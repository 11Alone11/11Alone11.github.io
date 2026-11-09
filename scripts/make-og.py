#!/usr/bin/env python3
"""Генерация OG-картинок 1200x630 через Chrome (headless)."""
import pathlib, subprocess

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "src/assets/img/og"

CARDS = [
    ("og-home", "Антон Стасюк", "Frontend-разработчик · React / Vue · TypeScript", "Anton Stasiuk · 11alone11.github.io"),
    ("og-cv", "Резюме", "Антон Стасюк — frontend-разработчик: опыт, стек, образование", "11alone11.github.io/cv"),
    ("og-abw", "abw.by", "Маркетплейс автомобилей · TypeScript, Nuxt 4, Core Web Vitals", "2024 — 2025"),
    ("og-beerzhevik", "БИРЖЕВИК", "PWA с ценами в реальном времени · WebSocket, JWT, роли", "2024"),
    ("og-veloman", "veloman.by", "Интернет-магазин с нуля · Nuxt 3 SSR, Pinia, SEO", "2023 — 2024"),
]

ROW = """
<div class="card">
  <p class="kicker">Антон Стасюк — портфолио</p>
  <h1 class="title">{title}</h1>
  <p class="lead">{lead}</p>
  <p class="foot">{foot}</p>
</div>"""

HTML = """<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
@font-face {{
  font-family: "Literata";
  src: url("file://{base}/src/assets/fonts/literata-cyrillic.woff2") format("woff2");
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}}
@font-face {{
  font-family: "Literata";
  src: url("file://{base}/src/assets/fonts/literata-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF;
}}
@font-face {{
  font-family: "Inter";
  src: url("file://{base}/src/assets/fonts/inter-cyrillic.woff2") format("woff2");
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}}
@font-face {{
  font-family: "Inter";
  src: url("file://{base}/src/assets/fonts/inter-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF;
}}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; }}
body {{ background: #F6F4EF; }}
.card {{
  width: 1200px; height: 630px; padding: 72px 80px;
  background: #F6F4EF; color: #14161A;
  display: flex; flex-direction: column;
  border-left: 12px solid #2F9E6E;
  font-family: "Inter", system-ui, sans-serif;
}}
.kicker {{ margin: 0 0 28px; font-size: 20px; letter-spacing: .16em; text-transform: uppercase; color: #5B6270; }}
.title {{ margin: 0; font-family: "Literata", Georgia, serif; font-weight: 600; font-size: 92px; line-height: 1.04; letter-spacing: -.02em; max-width: 16ch; }}
.lead {{ margin: 26px 0 0; font-size: 27px; line-height: 1.35; color: #2A2E35; max-width: 30ch; }}
.foot {{ margin: auto 0 0; font-family: ui-monospace, Menlo, monospace; font-size: 22px; color: #5B6270; }}
</style></head><body>
{cards}
</body></html>"""


def main() -> None:
    cards = "".join(ROW.format(title=t, lead=l, foot=f) for _, t, l, f in CARDS)
    page = BASE / "_og.html"
    page.write_text(HTML.format(base=BASE, cards=cards), encoding="utf-8")

    shot = BASE / "_og.png"
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless", "--no-sandbox", "--disable-gpu", "--disable-crash-reporter",
        "--disable-breakpad", "--user-data-dir=/tmp/chrome-og", "--crash-dumps-dir=/tmp/chrome-crash",
        "--hide-scrollbars", "--force-device-scale-factor=1",
        f"--window-size=1200,{630 * len(CARDS)}", f"--screenshot={shot}",
        "--run-all-compositor-stages-before-draw", "--virtual-time-budget=8000",
        page.as_uri(),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    from PIL import Image
    im = Image.open(shot)
    for i, (name, *_rest) in enumerate(CARDS):
        im.crop((0, i * 630, 1200, (i + 1) * 630)).save(OUT / f"{name}.png")
        print("saved", name)

    page.unlink()
    shot.unlink()


if __name__ == "__main__":
    main()
