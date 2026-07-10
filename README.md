# DriveCheck — Steer and Don't Crash (v1)

A CAPTCHA-style verification widget that replaces "click the traffic lights" with a tiny playable driving game. The user steers a car left/right with arrow buttons (or ← → / A / D keys) to dodge oncoming traffic on a canvas-rendered highway. Surviving a short distance / crashing at least once is treated as proof of human reflexes rather than a click.

## Links

- 📂 Source Code: https://github.com/username/project
- 🌐 Live Demo: [https://project-demo.com](https://giorgosfyls.github.io/reckless_driving/)

## Files

| File | Purpose |
|---|---|
| `reckless-driving-captcha.html` | Markup: card shell, canvas, score display, on-screen controls |
| `style.css` | Visual theme (pixel-art palette), responsive layout (mobile full-screen vs. boxed desktop widget) |
| `script.js` | Game engine: canvas rendering, traffic AI, collision detection, input handling, scoring |

## How it works

- **Rendering**: a single `<canvas>` is drawn at a small fixed internal resolution (168×250 on mobile, 210×250 on desktop) with `image-rendering: pixelated` for a crisp retro look, then scaled up via CSS to fill its container.
- **Layout**: mobile viewports (≤768px) get an edge-to-edge full-screen card; desktop (≥769px) gets a fixed-size 440×720 boxed widget centered on the page.
- **Gameplay loop**: `requestAnimationFrame` drives a `dt`-based update — traffic spawns into free lanes, some cars randomly "swerve" into an adjacent lane, difficulty (speed/spawn rate) ramps with elapsed time, and distance traveled is the score.
- **States**: `start` → `playing` → `gameover`, each with its own overlay (Ready / You Crashed) rendered over the canvas.

## v1 fix log

- **Tablet-width layout bug**: at viewport widths around 768px, the game canvas would balloon far taller than the screen, forcing the whole page to scroll and blowing up the pixel art.
  - First pass: `.card-body` and `.road-wrap` are flex items with the default `min-height: auto`, so the browser was sizing them off the canvas's *intrinsic* aspect ratio (168×250). Added `min-height: 0` / `min-width: 0` to that part of the flex chain — this killed the extreme blow-up, but left a smaller residual bug: `.road-wrap` was still sizing itself partly off the canvas (a flex child with a percentage `height: 100%` creates a circular sizing dependency inside a flex container), which pushed the on-screen arrow controls and footer out of the card and off-screen.
  - Final fix: took the `<canvas>` out of the flex layout entirely with `position: absolute; inset: 0;` inside the already-`position: relative` `.road-wrap`. The canvas now fills whatever box `.road-wrap` ends up with, with zero influence on that box's size in either direction, so the flex column (`road-wrap` / stats / controls / footer) lays out correctly at every screen width.

## Known constraints / not yet handled in v1

- No server-side verification — this is a front-end game only; wiring up a pass/fail signal to a backend is a follow-up.
- No accessible/non-visual fallback for users who can't play a reflex game.
- Lane count is fixed per device class (4 mobile / 5 desktop) rather than fully responsive.

## Coming soon

Updates are on the way — stay tuned.
