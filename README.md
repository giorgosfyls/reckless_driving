# DriveCheck — Steer and Don't Crash (v1.1)

A client-side CAPTCHA-style verification widget that replaces traditional "click the traffic lights" puzzles with a tiny playable retro driving game or an accessible audio challenge fallback.

## DEMO
- 🌐 Live Demo: [https://project-demo.com](https://giorgosfyls.github.io/reckless_driving/)

## Files

| File | Purpose |
|---|---|
| `index.html` | Structural markup, canvas wrapper, interactive visual container, and screen-reader compliant audio verification layout. |
| `style.css` | Retro design theme (pixel-art tokens), responsive layouts, flexbox structures, and fallback interface styling. |
| `script.js` | Main controller: game engine loop, dynamic lane resizing calculations and traffic collision engines. |

## How it works

- **Rendering**: A single `<canvas>` is drawn at a dynamically calculated internal resolution based on the viewport, using `image-rendering: pixelated` for a crisp retro look, then scaled up via CSS to fill its container.
- **Layout**: Mobile viewports (≤768px) get an edge-to-edge full-screen card; desktop (≥769px) gets a fixed-size 440×720 boxed widget centered on the page.
- **Gameplay loop**: `requestAnimationFrame` drives a `dt`-based update — traffic spawns into free lanes, some cars randomly "swerve" into an adjacent lane, difficulty (speed/spawn rate) ramps with elapsed time, and distance traveled is the score.
- **States**: `start` → `playing` → `gameover`, each with its own overlay (Ready / You Crashed) rendered over the canvas.

## Key Updates & Features in v1.1

- **Dynamic Responsive Lanes**: Removed the hardcoded device limits. The roadway layout is computed on execution and screen resize, fluidly adapting the highway structure from 3 up to 6 playable lanes based on active canvas container dimensions.
- **Non-Visual Accessible Fallback**: Introduced a robust, screen-reader friendly "Audio Verification" screen. If a user cannot play a reflex-based game, they can switch layouts to hear a sequence of 4 generated code digits spoken via speech synthesis and submit the text input to pass client-side validation.
- **Clean Codebase**: Refactored the code with fully documented, English-only comments for international usability.

## v1.0 Fix Log

- **Tablet-width layout bug**: At viewport widths around 768px, the game canvas would balloon far taller than the screen, forcing the whole page to scroll and blowing up the pixel art.
  - *First pass*: `.card-body` and `.road-wrap` are flex items with the default `min-height: auto`, so the browser was sizing them off the canvas's *intrinsic* aspect ratio (168×250). Added `min-height: 0` / `min-width: 0` to that part of the flex chain — this killed the extreme blow-up, but left a smaller residual bug: `.road-wrap` was still sizing itself partly off the canvas (a flex child with a percentage `height: 100%` creates a circular sizing dependency inside a flex container), which pushed the on-screen arrow controls and footer out of the card and off-screen.
  - *Final fix*: Took the `<canvas>` out of the flex layout entirely with `position: absolute; inset: 0;` inside the already-`position: relative` `.road-wrap`. The canvas now fills whatever box `.road-wrap` ends up with, with zero influence on that box's size in either direction, so the flex column layout (`road-wrap` / stats / controls / footer) functions correctly at every screen width.

## Known constraints / not yet handled

- **Server-side verification**: This remains a front-end demonstration of the CAPTCHA interaction. Securing the pass/fail signal using backend cryptographic tokens (e.g., JWT) is a separate future module.