// ==========================================================================
// UTILS — small shared helpers used by renderer.js, player.js, traffic.js
// ==========================================================================

/**
 * Standard pixel snapping utility enforcing absolute integer outputs.
 * Essential for rendering crisp, stable pixel-art textures that do not blur across fractional subpixels.
 * @param {number} v - Base float coordinate number.
 * @returns {number} Pixel-snapped integer value.
 */
export function px(v){
  // Math.round ensures shapes don't jitter unnaturally due to floor or ceiling bias
  return Math.round(v);
}

/**
 * Standard Linear Interpolation helper calculation formula.
 * @param {number} a - Starting baseline origin value.
 * @param {number} b - Target destination end point value.
 * @param {number} t - Progress step indicator percentage range normalized between 0 and 1.
 * @returns {number} Interpolated numerical value between the two points.
 */
export function lerp(a, b, t){
  return a + (b - a) * t;
}

/**
 * Quadratic Ease-In-Ease-Out easing translation math function profile.
 * Creates an acceleration phase at launch followed by a decelerating drift phase into target positions.
 * @param {number} t - Normalized progress scalar timeline variable index.
 * @returns {number} Eased scaling value factor.
 */
export function easeInOut(t){
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Deterministic pseudo-random trigonometric hash value mapping algorithm.
 * Guarantees zero flickering drops or shifting artifacts when tracking procedural parallax scrolls across re-renders.
 * @param {number} n - Seed identifier number input.
 * @returns {number} Normalized fractional remainder result bounded tightly between 0 and 1.
 */
export function hash(n){
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Modifies an existing hexadecimal color code block by a signed percentage scale.
 * Used to compute dynamic variations for roof lighting effects and shadowed accents.
 * @param {string} color - Source hex value string (formatted as '#RRGGBB').
 * @param {number} percent - Level factor to lighten (positive values) or deepen (negative values) color outputs (-100 to 100).
 * @returns {string} Processed modification color string output.
 */
export function shadeColor(color, percent){
  const f = parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
  const nR = Math.round((t - R) * p) + R;
  const nG = Math.round((t - G) * p) + G;
  const nB = Math.round((t - B) * p) + B;
  return '#' + (0x1000000 + nR * 0x10000 + nG * 0x100 + nB).toString(16).slice(1);
}

/**
 * Selects a randomized property key choice from an options map based on relative weighting profiles.
 * @param {Object} registry - Configuration data object map structure containing weight parameters.
 * @returns {string} Selected option key string identifier.
 */
export function weightedPick(registry){
  // Filter map data properties to construct an array containing only enabled entries
  const entries = Object.entries(registry).filter(([, v]) => v.enabled);
  const total = entries.reduce((sum, [, v]) => sum + v.weight, 0);
  let r = Math.random() * total;
  
  for (const [key, v] of entries){
    r -= v.weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0]; // Safe recovery loop default fallback path
}