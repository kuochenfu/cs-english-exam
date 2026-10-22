---
name: English Review
description: A warm, game-like study companion for a Grade 4-5 student preparing for school English tests.
colors:
  bg: "#fff8ec"
  card: "#ffffff"
  paper: "#fffaf0"
  warm-hover: "#fff3df"
  border: "#f0e2c8"
  text: "#2d2a26"
  muted: "#625d55"
  accent: "#ff8b3d"
  primary: "#c2500a"
  primary-strong: "#8f3a06"
  primary-dark: "#a8460b"
  good: "#1d7650"
  good-line: "#2bb673"
  good-soft: "#d9f4e6"
  bad: "#b42323"
  bad-line: "#e54848"
  bad-soft: "#fbdcdc"
  info-ink: "#24577a"
  info-line: "#c9e6ff"
  info-strong: "#69b3e7"
  info-bg: "#eef8ff"
  boss: "#5b4aa8"
  info-ink-soft: "#54748c"
  info-wash: "#fbfdff"
  boss-strong: "#45348d"
  boss-line: "#d8d0ff"
  boss-line-strong: "#8e7be8"
  boss-bg: "#f5f2ff"
  good-wash: "#f0fbf4"
  good-wash-line: "#d3eadc"
  check-bg: "#edf7f0"
  check-line: "#c9dfcf"
  gold-bg: "#fff7d6"
  gold-line: "#ead77d"
  gold-ink: "#6b5710"
  badge-earned-bg: "#fff5cf"
  badge-earned-line: "#e9bb3f"
  badge-earned-ink: "#704f00"
  badge-earned-glow: "#c7982420"
  locked-bg: "#f4f1eb"
  locked-ink: "#655f56"
  pill-new-bg: "#ffe08a"
  pill-new-ink: "#6b4b00"
  pill-latest-bg: "#d9f0ff"
  mark-bg: "#fff0b3"
  mark-ink: "#473600"
  del-bg: "#ffe0e0"
  del-ink: "#7b1c1c"
  selection: "#ffd8b8"
  shadow: "rgba(0,0,0,0.08)"
typography:
  body:
    fontFamily: "Andika, system-ui, -apple-system, Segoe UI, PingFang TC, Microsoft JhengHei, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  site-title:
    fontFamily: "Andika"
    fontSize: "2rem"
    fontWeight: 700
  caption:
    fontFamily: "Andika"
    fontSize: "0.8rem"
  small:
    fontFamily: "Andika"
    fontSize: "0.9rem"
  base:
    fontFamily: "Andika"
    fontSize: "1rem"
  lead:
    fontFamily: "Andika"
    fontSize: "1.1rem"
  question:
    fontFamily: "Andika"
    fontSize: "1.2rem"
    fontWeight: 400
  card-title:
    fontFamily: "Andika"
    fontSize: "1.4rem"
    fontWeight: 700
  icon:
    fontSize: "3rem"
rounded:
  xs: "6px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
  choice:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
  choice-correct:
    backgroundColor: "{colors.good-soft}"
    textColor: "{colors.good}"
  choice-wrong:
    backgroundColor: "{colors.bad-soft}"
    textColor: "{colors.bad}"
  panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# English Review — Design System

## Overview

A single-page study app for one child, used at home on a laptop or iPad. The world is a warm paper desk with an orange "quest" accent: a cream page, white rounded panels, emoji as friendly signposts, and game layers (quest map, missions, boss review, cat-and-fox badges) in a cool blue so they read as "the game" next to the orange "study" layer. Calm enough for 20 minutes of practice, playful enough to come back tomorrow.

The source of truth is the `:root` block in `styles.css`. Never write a raw hex in a new rule; add or reuse a token.

## Colors

- **Orange family.** `--accent` (#ff8b3d) is decorative only: progress fills, hover borders, the featured test. Never put text on it. `--primary` (#c2500a) is the button fill; white text on it reaches 4.7:1. `--primary-strong` is hover. `--primary-dark` (#a8460b) is orange *text*: headings, links, labels. It passes 4.5:1 on every light surface, including `--border`.
- **Feedback.** `--good` / `--bad` are text colors that pass AA on white and on their soft fills. The `-line` variants are borders, and the `-soft` variants are answer backgrounds. Always pair color with a glyph (✓ / ✗ / ✅ / ❌); color never carries meaning alone.
- **Game layer.** `--info-*` colors are for the quest map, missions, stars, rewards and the grammar guide. `--boss*` is only for Boss Review. `--gold-*` is for verb chips and earned badges.
- **Neutrals.** `--muted` (#625d55) is the only secondary text color. It reaches 5.1:1 even on the `--border` tag fill.

## Typography

Andika (SIL OFL), self-hosted in `assets/fonts/`, Latin + Latin Extended, 400/700 + 400 italic. It was designed for beginning readers: single-story a and g, clear I/l/1, and generous spacing. It renders the same in every browser and covers the phonics marks (ō, ô, â, ä). Chinese text falls back to PingFang TC or Microsoft JhengHei.

- Body text is 18px with a 1.5 line height. Reading passages are capped at 70ch.
- Type ramp (rem): 0.8 caption · 0.9 small · 1 base · 1.1 lead · 1.2 question · 1.4 card title · 2 site title · 3 emoji icon. Use these steps only.
- Headings use weight 700 and orange (`--primary-dark`) for screen titles. Game-layer headings use `--info-ink`.
- Answer choices are regular weight, so the bold action buttons stand apart from the content.

## Layout

- `main` is centered at max 820px with a 16px gutter. The sticky top nav holds four equal buttons. Below 480px they flex to one row.
- Topic and test pickers use auto-fit grids (`minmax(190–220px, 1fr)`), which give two columns on a phone.
- A screen leads with its action. Long reference material, such as the grammar quick guide, collapses into `<details>`, so the practice buttons are always within the first screen.
- At 640px or narrower, grammar notes stack (key above body).

## Elevation & Depth

The app is flat by default. Soft offset shadows (`0 8px 18px rgba(0,0,0,.08)`) appear only on hover lift and on images and posters. There are no hard offset shadows and no glow.

## Shapes

Rounded corners everywhere, on one scale: 6px marks, 10px chips and inputs, 12px inner boxes, 14px buttons, 18px panels and cards, and 999px pills. Borders are 2px in `--border`. There are no colored side-stripes; callouts use a full dashed `--accent` border instead.

## Components

- **Buttons:** primary (filled `--primary`), ghost (transparent, muted text, 2px border), small (`.small`), link (`.link`, underlined, padded to a usable target). Every button has a 3px `--primary-dark` focus ring.
- **Quiz choice:** white with a 2px border. After answering, the right choice turns `--good-soft` with ✓ and the picked wrong choice turns `--bad-soft` with ✗. A correct answer auto-advances after 0.7s. A wrong answer waits for a focused **Next →** button. Feedback is a `role="status"` live region.
- **Reading question:** `.qa-block` card containing `.qa-choice` radio rows; the checked row gets a `--primary` border.
- **Voice picker:** `.voice-picker` label + select + Test button, wrapping on narrow screens.
- **Progress bar:** `--border` track with an `--accent` fill, animated with `transform: scaleX`, and exposed as `role="progressbar"`.
- **Anchor chart:** poster figure, guide grid, steps, dashed tip box, worked examples, and a green "Try it yourself" box.

## Do's and Don'ts

- **Do** add a token before using a new color, and check that it reaches 4.5:1 for text.
- **Do** give a child time: never auto-advance past a wrong answer.
- **Do** use classes in `styles.css`; `app.js` has only data-driven inline styles (the progress-bar scale).
- **Don't** put text on `--accent`.
- **Don't** use colored `border-left` callouts or gradient text.
- **Don't** load fonts or scripts from third-party CDNs; keep the app double-click-and-go.
- **Don't** ship PNG photos or posters; use WebP (`cwebp -q 86`) or JPEG, and `loading="lazy"` for images in lists.
