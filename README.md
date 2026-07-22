````markdown
# DriveCheck (v2.0)

A CAPTCHA-style verification widget that replaces **"click the traffic lights"** with a tiny playable driving game. The user steers a car left/right to dodge oncoming traffic on a canvas-rendered highway — surviving proves human reflexes instead of a simple click.

## DEMO

- 🌐 **Live Demo:** https://giorgosfyls.github.io/reckless_driving/

---

# Project Structure

```text
DriveCheck/
│
├── index.html
│
├── css/
│   ├── variables.css   — color/spacing/breakpoint design tokens
│   ├── layout.css      — page centering, card shell, flex column
│   ├── ui.css          — banner, overlays, HUD stat pills, footer
│   ├── controls.css    — steering buttons
│   ├── game.css        — canvas rendering rules
│   ├── responsive.css  — breakpoints, phones → ultrawide
│   └── style.css       — imports all of the above, in cascade order
│
├── js/ (ES Modules)
│   ├── config.js       — canvas size, lanes, vehicle registry, tuning constants
│   ├── utils.js        — math/color helpers
│   ├── input.js        — keyboard + button wiring
│   ├── player.js       — player state, smooth lane-change steering
│   ├── traffic.js      — spawn/AI/spacing, driven entirely by config
│   ├── collision.js    — AABB overlap check
│   ├── renderer.js     — all canvas drawing & color maps
│   ├── ui.js           — overlay + HUD DOM updates
│   ├── game.js         — state machine tying the above together
│   └── main.js         — bootstrap, requestAnimationFrame loop
│
└── assets/
```

> `js/main.js` is loaded as `<script type="module">`, so it **must be served over HTTP** (not opened directly via `file://`). Any static file server will work.

---

# v2.0 Changes & Performance Upgrades

## Fully Responsive Layout

Dedicated breakpoints for:

- Phones
- Small tablets
- Tablets
- Laptops
- Desktop
- 2K
- 4K
- Ultrawide monitors

Everything is powered by CSS custom properties (`css/responsive.css`), allowing the same markup to scale cleanly across all screen sizes.

---

## Responsive Dynamic Lanes

The highway automatically adjusts its lane count based on screen width.

| Screen Width | Lanes |
|--------------|------:|
| < 375px | 3 |
| 375px – 768px | 4 |
| 768px – 1440px | 5 |
| > 1440px | 6 |

---

## Optimized Vehicle Scaling

Resolved a scaling bug that caused vehicles to appear too large on tablets and phones.

- Sedan width reduced from **16px → 12px**
- Truck width reduced from **22px → 14px**

This preserves proper lane boundaries and improves steering precision.

---

## Player Color Exclusivity

The retro-white player paint (`#F5F2E8`) is now reserved exclusively for the player's vehicle, making it instantly recognizable in heavy traffic.

---

## Grayscale Retro Traffic Palette

Traffic vehicles now cycle through a curated grayscale palette including:

- Platinum Gray
- Silver
- Slate
- Charcoal
- Carbon Black

This provides high visual contrast while maintaining a clean retro aesthetic.

---

## Bulletproof Color Assignment

The color selection system inside `renderer.js` was rewritten to eliminate edge cases caused by the previous hashing logic.

### Fixed Runtime Error

```text
Cannot read properties of undefined (reading 'slice')
```

### Result

- ✅ No runtime crashes
- ✅ Stable rendering
- ✅ Reliable fallback handling

---

## Shared Premium Vehicle Details

Previously player-exclusive details are now applied to all traffic vehicles.

Includes:

- 3D roof shadow plate (14% darker)
- Rear glass overlay (80% opacity)

This creates a more cohesive visual style.

---

## Symmetrical Indicator Alignment

Fixed a pixel-art positioning issue where left turn indicators appeared compressed against the vehicle body.

Indicators now feature:

- Pixel-perfect symmetry
- Consistent spacing
- Proper alignment

---

## Smooth Player Steering

The player car now:

- Leans into lane changes
- Smoothly eases between lanes
- Straightens naturally afterward

This matches the traffic AI steering animation.

---

## Advanced Traffic AI Lane Changes

Traffic vehicles now perform multi-stage lane changes.

Sequence:

1. Static indicator warning (0.6s)
2. Indicator begins blinking
3. Smooth lane transition
4. Steering tilt animation

Uses the same configuration values as the player:

- `STEER_DURATION`
- `MAX_TILT`
- Steering easing functions

---

## Pixel-Snapped Rendering

All vehicles are rendered using integer pixel snapping via `px()`.

Benefits:

- No blurry subpixel artifacts
- Crisp pixel-art rendering
- Consistent visuals during rotation

---

## Improved Touch Controls

Steering buttons now scale dynamically using:

- `--btn-size`
- `--btn-gap`

Resulting in:

- Better thumb ergonomics
- Improved usability on phones and tablets

---

## Canvas Layout Fix

The canvas now uses:

```css
position: absolute;
```

inside a:

```css
position: relative;
```

road container.

This completely eliminates layout distortion across tablet and desktop breakpoints.

---

## Cleaner HUD

Distance and Best score indicators are now displayed above the road as a dedicated HUD header instead of competing with the Game Over overlay.

---

## Extensible Traffic Engine

Vehicle definitions are fully data-driven through the `VEHICLE_TYPES` registry in `config.js`.

Already staged:

- Bus
- Van
- Police
- Ambulance
- Motorcycle

To enable a new vehicle type:

1. Set `enabled: true`
2. Add a matching draw function inside `renderer.js`

No changes are required in:

- `traffic.js`
- `collision.js`

---

# Not Yet Released (Planned for v2.1+)

- ❌ Additional vehicle types (new cars, SUVs, vans, buses, motorcycles, emergency vehicles)
- ❌ Day / Night cycle
- ❌ Sirens and emergency vehicle status indicators
- ❌ Smoke and particle effects
- ❌ Screen shake and crash impact feedback
- ❌ Dynamic weather (rain, fog, etc.)

---

# Coming Soon

More gameplay improvements, new vehicle types, visual polish, accessibility enhancements, and additional gameplay mechanics are currently in development.

Stay tuned for future updates.
````