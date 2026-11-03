# STYLE — Cranellz visual and motion spec

This is the pixel-and-millisecond spec for the Cranellz UI. It keeps the original VHS shelf concept intact and only changes branding, data binding and bilingual text. Anything not mentioned here follows `PRD.md`.

**Golden rules**
- One `requestAnimationFrame` loop plus the Web Animations API. No CSS keyframes.
- **No opacity fades on the public site.** Every reveal is a mask slide, a clip or a scale.
- Everything on `/` is `position: fixed` and laid out from the viewport centre using `--H`.
- "Leon Vasari" never appears. All brand strings come from `site_settings`.

---

## 1. Tokens

```css
:root {
  --paper:  #EDEBE6;  /* page background */
  --sheet:  #F4F2ED;  /* detail sheet, reader, admin */
  --ink:    #141414;  /* text, borders, cursor ring */
  --muted:  #6D6A63;  /* meta line, italic credit */
  --cobalt: #1F3FB0;  /* logo, tab indicator, subtitles, play ring, OPEN cursor, Read button */
  --rule:   rgba(20,20,20,.9);
  --ease:   cubic-bezier(.2,.8,.2,1);
  --ease-sheet: cubic-bezier(.76,0,.18,1);
  --H: min(46vh, 31vw);
}
@media (max-width: 767px) { :root { --H: min(60vw, 40svh); } }
```

Category accents (used only on generated tapes and admin chips):

| Category | Accent |
|---|---|
| MAIN | `--cobalt` #1F3FB0 |
| SEGUE | vermilion #D2462A |
| TALE | ochre #B88A2E |
| COMP | ink #141414 |
| SIDE / EXPL | moss #4E6B3A |
| EVNT | vermilion #D2462A |

## 2. Typography

| Family | Weights | Use | Loading |
|---|---|---|---|
| Newsreader (variable, opsz 6–72) | 400, 400 italic | Titles, synopsis, reader body, credit | Self-hosted WOFF2, Latin + Latin-Ext (covers Indonesian) |
| Inter Tight (variable) | 500, 600 | All labels, tabs, buttons, meta | Self-hosted WOFF2, Latin + Latin-Ext |
| Noto Sans JP | 500 | Japanese decorative labels, JP original titles | Google Fonts, unicode-range slices |
| Noto Sans SC | 500 | Chinese original titles | Google Fonts, unicode-range slices |
| Noto Serif SC | 700 | `brand_cjk` logo line only | Google Fonts `&text=` built from settings |

- Sans stack: `"Inter Tight", "Noto Sans JP", "Noto Sans SC", system-ui, sans-serif`
- Serif stack: `"Newsreader", Georgia, serif`
- `lang="en"` / `lang="id"` on content containers; `lang="zh-Hans"` / `lang="ja"` on original titles.
- Indonesian strings run ~15–25 % longer than English. Every masked line must tolerate this (see §7 clamps).

### Label system
- `.lbl` — Inter Tight 600, 10.5px, line-height 1, letter-spacing .09em, uppercase.
- `.box` — inline-flex, 21px tall, 0 8px padding, 1px `--rule` border.

## 3. Bilingual UI strings

Chrome labels use the pattern **PRIMARY / SECONDARY**. The primary half follows the active language; the secondary half is the decorative Japanese from the original design and never changes.

| Key | en | id | Decorative JP |
|---|---|---|---|
| back | BACK | KEMBALI | 戻る |
| all | ALL | SEMUA | すべて |
| close | CLOSE | TUTUP | 閉じる |
| open (cursor) | OPEN | BUKA | 開く |
| read | READ THE STORY | BACA CERITA | 物語を読む |
| writeup_coming | WRITE-UP COMING | SEGERA HADIR | 準備中 |
| next | NEXT | BERIKUTNYA | 次へ |
| empty | NOTHING HERE YET | BELUM ADA | まだありません |
| ver | VER. | VER. | — |
| archive | ARCHIVE | ARSIP | — |

Language switch: a `.box` pair `EN | ID` in the top bar; the active one is filled cobalt with white text, swapped with the same `.45s` colour transition as the tabs.

## 4. Paper grain

Fixed full-screen layer, `z-index 40`, `pointer-events none`, above shelf and caption, under the detail sheet. 220×220 inline SVG tile: `feTurbulence` fractalNoise, baseFrequency .85, 3 octaves, stitchTiles → `feColorMatrix` to rgb(.45,.42,.38) at alpha .22. `mix-blend-mode: multiply`, `opacity .55`.

## 5. Layout (desktop)

### 5.1 Top bar
- 84px tall, 32px side padding, grid `1fr auto 1fr`.
- **Left:** `.box` link "BACK / 戻る" (hidden if `back_link_url` empty).
- **Centre logo:** cobalt stack, 5px gap. Line 1 `brand_cjk` in Noto Serif SC 700 22px, ls .04em. Line 2 "CRANELLZ" Inter Tight 600 9px, ls .34em with matching left padding. If `brand_cjk` is empty: line 1 "Cranellz" Newsreader 26px ls −.01em, line 2 "STORY ARCHIVE / ARSIP CERITA".
- **Right:** language switch `EN | ID`, 8px gap, then the category filter `.lbl` button ("ALL STORIES ▾" / "SEMUA CERITA ▾"). Its menu is a stack of `.box` rows with shared borders, revealed by `clip-path: inset(0 0 100% 0) → inset(0)` over 450ms `--ease`.

### 5.2 Version tabs
- Centred, top `50% − H/2 − 86px`. Boxed `.lbl` buttons, 23px tall, 0 11px padding, `margin-left: −1px`, no wrap.
- Labels: "ALL / すべて" then each group (`1.X`, `2.X`, `3.X`, …). More than 7 groups → 6 newest + "EARLIER".
- Cobalt indicator behind the buttons; `width` and `translateX` track the active tab over `.6s var(--ease)`. Active text turns white over `.45s`. The active tab is always the active story's group; ALL is never active.

### 5.3 Shelf geometry
- Section: full width, top `50% − H/2 − 40px`, height `H + 80px`, `perspective: 2200px`, `perspective-origin: 50% 50%`, `touch-action: pan-y`.
- Zero-size `.stage` at 50%/50%, `preserve-3d`. Zero-size `.tape`, `preserve-3d`, `will-change: transform`.

| Name | Value |
|---|---|
| H | resolved `--H` (off-screen probe) |
| ws | H × 142 / 840 |
| d | H × 474 / 900 |
| gap | H × 0.03 |

- Spine face `.sp`: width ws, left −ws/2, top −H/2, `translateZ(d/2)`, `backface-visibility: hidden`, radius 2px.
- Cover face `.cv`: width d, left −d/2, `rotateY(90deg) translateZ(ws/2)`, shadow `0 30px 60px -28px rgba(20,16,10,.55)`.
- Shading: black `::after`, opacity `--shade` (spine `o×.55`, cover `(1−o)×.5`).

### 5.4 Tape placement and turning

```
x(r)   = r·(ws+gap) + (d − ws + 1.6·gap)·B(r)
B(r)   = |r|<1 ? (r + sin(πr)/π)/2 : sign(r)·0.5
o      = smoothstep(max(0, 1 − |r|)),  smoothstep(x) = x²(3 − 2x)
rotY   = −90°·o + tiltY·o
rotX   = tiltX·o
rotZ   = −4.5°·o
tz     = o·0.2H
ty     = −o·0.025H − lift·0.045H
transform = translate3d(x, ty, tz) rotateZ(rotZ) rotateX(rotX) rotateY(rotY)
z-index   = round(100 − |r|·4)
```

- **Endless loop:** N stories in the current filter, `copies = max(3, ceil(40/N))`, loop length `L = N·copies`. A fixed pool of 40 tape elements is bound each frame to virtual indices with `r = wrap(v − s, L)` in −20…+20. Cull beyond `W/2 + 1.5d`.
- **Hover lift:** non-active tapes ease lift to 1 at `1 − e^(−12·dt)`.
- **Tilt:** on-cover zone = within `0.55d` of centre horizontally, `0.55H` vertically, detail closed, `|T − s| < .3`. On cover: `tiltY → (mx − W/2)/(0.55d)·9°`, `tiltX → −(my − cy)/(H/2)·6°`. Elsewhere: `tiltY → (mx − W/2)/W·5°`, `tiltX → 0`. Ease `1 − e^(−7·dt)`.

### 5.5 Play ring
42px circle, 1px cobalt border, fill `rgba(237,235,230,.75)`, 12px play triangle +2px right. Centre at `left = W/2 − 0.5d − 6px`, `top = shelfCentre + 0.36H`. Scale `smoothstep(max(0, 1 − |T − s|·3))`.

### 5.6 Caption
- Stack at top `50% + H/2 + 30px`, gap 9px, `aria-live="polite"`. Each line an `overflow:hidden` mask, `width: min(92vw, 760px)`, centred.
- **Title:** active-language title, Newsreader 31px, lh 1.12, ls −.01em, single line with ellipsis.
- **Subtitle (cobalt `.lbl` 500):** other-language title; if `original_title` exists append ` / ` + original title.
- **Meta:** Inter Tight 500 11px, ls .08em: `CATEGORY · VER. 3.7 · CH. IV · ACT IV`.
- **Swap:** new span from `translateY(dir·105%)` to 0; older spans to `translateY(−dir·105%)` then removed. 650ms, `--ease`, `fill: both`. `dir` = +1 moving right.
- **Language switch:** the same swap runs with `dir = +1` on all three lines; the shelf does not move.

### 5.7 Arrows
44px buttons at `top: 50% + H/2 + 40px`, 20px from the edges. 18×10 SVG, 1.2px stroke: `M5 1 L1 5 L5 9` + shaft to x17, mirrored for right.

### 5.8 Footer
32px from sides, 26px from bottom, space-between, `.lbl`. Left "© CRANELLZ · UNOFFICIAL FAN ARCHIVE" / "© CRANELLZ · ARSIP PENGGEMAR TIDAK RESMI"; full disclaimer appears in a `.box` tooltip on hover/focus via clip slide. Right: social links separated by " / ".

## 6. Generated typographic tape (no art uploaded)

- **Spine:** card `#E6DFCF` + grain. Top band 14% of H in the category accent with the category code in white Inter Tight 600 9px. Title vertical (`writing-mode: vertical-rl`) in Newsreader 400, `scaleX(.85)`, size fitted to the spine height. Below: `chapter_label` `.lbl` 8px. Bottom: "CRANELLZ" `.lbl` 7px + boxed "VHS".
- **Cover:** same card. Top "A CRANELLZ ARCHIVE" `.lbl` 8px. Title Newsreader, fitted to 3 lines max, in the **active language**. A duotone block (category accent at 100% + ink halftone dots 2px at 18% opacity) filling the middle 45%. Version `.lbl` bottom left, boxed "VHS" bottom right.
- Language switch re-renders cover text through the caption swap motion on the visible cover only.

## 7. Custom cursor (fine pointers only)

58×58px, margins −29px, `z-index 100`, follows at `1 − e^(−16·dt)`. 1.5px ink ring, 6px ink dot, hidden label "OPEN / 開く" (or "BUKA / 開く") Inter Tight 600 10px lh 1.25 ls .1em white.

| State | Ring | Dot | Label |
|---|---|---|---|
| default | 1, ink border | 1 | 0 |
| `.spine` | .72 | 1 | 0 |
| `.btn` | .55 | 0 | 0 |
| `.open` | 1.75, cobalt fill + border | 0 | 1 |

Transitions: ring transform/background/border `.5s/.4s/.4s --ease`; dot/label `.4s/.45s`.

## 8. Detail sheet

- `.detail`: fixed, `z-index 60`, `--sheet`, `visibility:hidden` until open. Grid 2 equal columns, gap 4vw, padding `110px 6vw 56px 7vw`.
- Close `.box` at (32px, 31px). Logo copy centred in an 84px band.
- **Left column** (centred vertically, max-width 520px, gap 18px, each line masked):
  1. Cobalt `.lbl` subtitle (other-language title / original title)
  2. Title Newsreader `clamp(40px, 5.2vw, 84px)`, lh 1, ls −.025em, max 3 lines
  3. Muted `.lbl` meta: `CATEGORY / VER. 3.7 / CH. IV · ACT IV / REGION`
  4. Character tags: `.box` chips, max 6 then "+N"
  5. Synopsis Newsreader 17px lh 1.5, max-width 42ch
  6. Italic credit Newsreader 15px muted: "Archived by Cranellz · Released 30 Sep 2026" / "Diarsipkan oleh Cranellz · Rilis 30 Sep 2026" (dates via `Intl.DateTimeFormat` in the active locale)
  7. 44px `.box` button, cobalt, 0 20px padding, margin-top 10px: READ THE STORY / 物語を読む
- **Poster:** height `min(100%, 78vh)`, aspect 474/900, SVG viewBox `0 0 474 900`, clipped `<image>` masked by the ink mask: mask user space (−200, −200, 874×1300), seven white circles, filter `feTurbulence` fractalNoise .011, 3 octaves, seed 7 → `feDisplacementMap` scale 120 (R,G).

| Blob | cx | cy | delay ms |
|---|---|---|---|
| 1 | 150 | 330 | 0 |
| 2 | 340 | 600 | 120 |
| 3 | 250 | 120 | 220 |
| 4 | 90 | 760 | 300 |
| 5 | 400 | 250 | 360 |
| 6 | 260 | 860 | 420 |
| 7 | 230 | 470 | 180 |

### Open / close timing
| Step | Spec |
|---|---|
| Sheet open | WAAPI 1050ms `--ease-sheet`, from `clip-path: inset(<cover rect> round 3px)` + `rotate(-4.5deg)` to `inset(0 round 0)` + `rotate(0)`; `transform-origin` = cover centre |
| Text rise | each line `translateY(110%) → 0`, 900ms `--ease`, delay `620 + i·75` ms |
| Ink bleed | starts at 520ms; radius 0 → 720 over 1250ms after own delay, `1 − (1 − p)³`; loop ends at 2.4s |
| Close | reverse to current cover rect + `rotate(-4.5deg)`, 850ms `--ease-sheet`; then hide and cancel animations |

## 9. Reader

- Same `.detail` element. Transition in: left-column lines `0 → translateY(-110%)` 600ms staggered 50ms; ink blobs shrink 700ms ease-in cubic; then the sheet scrolls.
- Sticky 64px header: BACK / KEMBALI left, logo centre, progress `.lbl` right.
- Column max-width 64ch, padding `120px 24px 160px`. Body Newsreader 19px lh 1.65.
- Nodes: h2/h3 as `.lbl` section markers ("PART 2" / "BAGIAN 2"); blockquote with 1px cobalt left rule; **dialogue** = speaker cobalt `.lbl` above Newsreader line; **choice** = stacked `.box` options; images revealed by a small ink mask.
- Paragraph reveal on viewport entry: mask slide 700ms `--ease`, once.

## 10. Responsive (≤ 767px)

- Top bar 64px, 16px padding, logo 17px / 7.5px, labels 9px. Category filter collapses to a "▾" box; language switch stays.
- Tabs at `50% − H/2 − 70px`, 0 7px padding, 9px text; overflow scrolls inside its own mask.
- Caption title 24px. Arrows 6px from edges. Footer 16px sides, 18px bottom, 9px labels.
- Detail: single scrolling column, padding `84px 22px 40px`, gap 24px, poster first at 46svh, title 40px, synopsis 16px, Close at (16px, 21px), logo band 64px.
- Reader body 17px, padding `96px 20px 120px`. No custom cursor on touch.

## 11. Reduced motion

`prefers-reduced-motion: reduce`: spring and lift k = 1; caption and language swaps replace text instantly; sheet, text rises and reader reveals run at 1ms with no delay; ink starts 5s in the past.

## 12. Admin

Same tokens and type on `--sheet`, native cursor, fades allowed. Story editor shows EN and ID as two tabs styled as the version tabs (cobalt sliding indicator), each with a completeness dot (empty / partial / complete). Live preview pane renders the real shelf at 60% scale with its own EN|ID toggle.
