"""
Genera los íconos de BurnScope (SVG y PNG) a partir de la misma ilustración:
una lupa en llamas con brillo y destellos ("glimmering").

Uso (requiere Python 3 con Playwright y Chromium; sólo se necesita si cambias el logo):
    python3 scripts/make-icons.py

Salida en public/icons/: icon.svg, icon-192.png, icon-512.png,
icon-512-maskable.png y apple-touch-icon.png.
La versión en React del logo está en src/shared/components/Logo.tsx: si cambias
la ilustración, actualiza ambos archivos.
"""

import pathlib
import tempfile

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)


def star(x: float, y: float, s: float, fill: str, opacity: float = 1.0) -> str:
    """Destello de cuatro puntas."""
    return (
        f'<path d="M{x} {y - s} Q{x} {y} {x + s} {y} Q{x} {y} {x} {y + s} '
        f'Q{x} {y} {x - s} {y} Q{x} {y} {x} {y - s}Z" fill="{fill}" opacity="{opacity}"/>'
    )


ART = f"""
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12408a"/>
      <stop offset="1" stop-color="#061a3f"/>
    </linearGradient>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe27a"/>
      <stop offset="0.45" stop-color="#ff9a3c"/>
      <stop offset="1" stop-color="#e0362c"/>
    </linearGradient>
    <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffbe0"/>
      <stop offset="1" stop-color="#ffc94a"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff3c4"/>
      <stop offset="0.5" stop-color="#ffc247"/>
      <stop offset="1" stop-color="#c47a16"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffb347" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="232" cy="232" r="205" fill="url(#halo)"/>
  <!-- mango -->
  <path d="M322 322 L428 428" stroke="#7a4a12" stroke-width="46" stroke-linecap="round"/>
  <path d="M322 322 L428 428" stroke="url(#rim)" stroke-width="34" stroke-linecap="round"/>
  <path d="M336 312 L420 396" stroke="#fff6d6" stroke-width="6" stroke-linecap="round" opacity="0.7"/>
  <!-- cristal -->
  <circle cx="222" cy="222" r="128" fill="#bfe3ff" fill-opacity="0.12"/>
  <!-- llama dentro de la lupa -->
  <g filter="url(#glow)">
    <path d="M222 112C238 156 286 182 286 246C286 285 258 314 222 314C186 314 158 285 158 246C158 210 182 196 194 164C204 182 211 187 215 176C219 160 218 136 222 112Z" fill="url(#flame)"/>
    <path d="M222 204C232 230 256 244 256 274C256 294 241 308 222 308C203 308 188 294 188 274C188 254 200 248 207 231C213 241 218 240 222 204Z" fill="url(#core)"/>
  </g>
  <!-- llamas que salen del aro -->
  <g filter="url(#glow)">
    <path d="M338 58C352 92 396 106 388 156C383 188 354 196 342 178C331 162 344 148 332 128C323 113 337 90 338 58Z" fill="url(#flame)"/>
    <path d="M342 126C350 142 370 150 366 172C363 184 350 188 344 180C339 172 346 166 341 156C338 150 343 140 342 126Z" fill="url(#core)"/>
  </g>
  <!-- aro -->
  <circle cx="222" cy="222" r="128" fill="none" stroke="#7a4a12" stroke-width="38"/>
  <circle cx="222" cy="222" r="128" fill="none" stroke="url(#rim)" stroke-width="28"/>
  <path d="M130 170A108 108 0 0 1 200 112" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
  <!-- destellos -->
  {star(414, 92, 30, '#fff7d6')}
  {star(92, 332, 20, '#ffe9a0', 0.95)}
  {star(452, 262, 15, '#ffffff', 0.9)}
  {star(120, 62, 13, '#ffffff', 0.85)}
  {star(402, 186, 10, '#ffe9a0', 0.9)}
"""


def svg(size: int, *, rounded: bool, scale: float) -> str:
    radius = 112 if rounded else 0
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}" '
        f'role="img" aria-label="BurnScope">\n'
        f'  <rect width="512" height="512" rx="{radius}" fill="url(#bg)"/>\n'
        f'  <g transform="translate(256 256) scale({scale}) translate(-256 -256)">{ART}</g>\n'
        f'</svg>\n'
    )


def main() -> None:
    # El SVG redondeado es el favicon / ícono vectorial.
    (OUT / 'icon.svg').write_text(svg(512, rounded=True, scale=0.94), encoding='utf-8')

    targets = [
        ('icon-192.png', 192, 0.94),
        ('icon-512.png', 512, 0.94),
        ('icon-512-maskable.png', 512, 0.74),  # zona segura de los íconos "maskable"
        ('apple-touch-icon.png', 180, 0.94),
    ]
    with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
        browser = p.chromium.launch()
        for name, size, scale in targets:
            page = browser.new_page(viewport={'width': size, 'height': size}, device_scale_factor=1)
            html = (
                '<html><body style="margin:0;background:#061a3f">'
                + svg(size, rounded=False, scale=scale)
                + '</body></html>'
            )
            path = pathlib.Path(tmp) / 'icon.html'
            path.write_text(html, encoding='utf-8')
            page.goto(path.as_uri())
            page.screenshot(path=str(OUT / name), clip={'x': 0, 'y': 0, 'width': size, 'height': size})
            page.close()
        browser.close()
    print('Íconos generados en', OUT)


if __name__ == '__main__':
    main()
