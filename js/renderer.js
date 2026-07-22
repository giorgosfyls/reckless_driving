// ==========================================================================
// RENDERER
// All canvas drawing lives here. Vehicles are drawn via a lookup table
// keyed by the `draw` name in config.VEHICLE_TYPES — adding a new
// vehicle kind later just means adding a new draw function + registering
// it in DRAW_FNS, with zero changes to the render loop itself.
// ==========================================================================
import { PW, PH, SHOULDER, LANE_W, LANES } from './config.js';
import { px, shadeColor, hash } from './utils.js';

// Retro-arcade grayscale color palette for traffic vehicles.
// Pure white (#F5F2E8) is excluded to remain strictly unique to the player.
const TRAFFIC_COLORS = [
  '#E5E8E8', // Platinum Gray (Very light, high contrast)
  '#BDC3C7', // Silver Gray (Classic metallic retro)
  '#95A5A6', // Concrete Gray (Cool, pale tone)
  '#7F8C8D', // Slate Gray (Medium dark)
  '#5D6D7E', // Steel Blue-Gray (Slightly blueish tint for variety)
  '#34495E', // Wet Asphalt (Dark blue-gray)
  '#2C3E50', // Charcoal (Very dark, sleek)
  '#1C2833'  // Carbon/Off-Black (Deepest gray before pure black)
];

/**
 * Draws four pixel-aligned vehicle wheel rectangles centered relative to parent dimensions.
 */
function drawWheels(ctx, w, h, frontY, rearY){
  ctx.fillStyle = '#1B1C2B'; // Standardized deep charcoal palette selection for rubber components
  const ww = 3, wh = 5;       // Fixed box metric measurements configuration for standard tires
  ctx.fillRect(px(-w / 2 - 1), px(frontY), ww, wh);     // Front Left Wheel
  ctx.fillRect(px(w / 2 - ww + 1), px(frontY), ww, wh);  // Front Right Wheel
  ctx.fillRect(px(-w / 2 - 1), px(rearY), ww, wh);      // Rear Left Wheel
  ctx.fillRect(px(w / 2 - ww + 1), px(rearY), ww, wh);   // Rear Right Wheel
}

/**
 * Renders standard sedan vehicle body profiles using modular pixel layer offsets.
 * All traffic vehicles now receive the premium roof shadow and rear window translucency details.
 */
function drawCarBody(ctx, c, bodyColor){
  const { w, h } = c;
  const windowColor = '#2B2D45'; // Dark tint hue configuration for windshield glass fields
  drawWheels(ctx, w, h, -h / 2 + h * 0.14, h / 2 - h * 0.14 - 5);

  // Render core primary structural sheet metal body frame
  ctx.fillStyle = bodyColor;
  ctx.fillRect(px(-w / 2), px(-h / 2), px(w), px(h));

  // Render raised inner roof shadow plate layer (Premium Detail - 14% Darker)
  ctx.fillStyle = shadeColor(bodyColor, -14);
  ctx.fillRect(px(-w / 2 + 1.5), px(-h / 2 + h * 0.14), px(w - 3), px(h * 0.6));

  // Render front windshield frame fields
  const winW = w - 4;
  ctx.fillStyle = windowColor;
  ctx.fillRect(px(-winW / 2), px(-h / 2 + h * 0.18), px(winW), px(h * 0.22));

  // Render trailing rear window panel elements with transparency (Premium Detail)
  ctx.fillStyle = windowColor;
  ctx.globalAlpha = 0.8; // Applies mild 80% translucency to the rear window glass element
  ctx.fillRect(px(-winW / 2), px(h / 2 - h * 0.32), px(winW), px(h * 0.16));
  ctx.globalAlpha = 1;

  // Render headlights and brake lights pixels
  ctx.fillStyle = '#FFE9A8'; // Soft amber headlight color choice
  ctx.fillRect(px(-w / 2 + 0.5), px(-h / 2 + 0.5), 1.5, 1.5);
  ctx.fillRect(px(w / 2 - 2), px(-h / 2 + 0.5), 1.5, 1.5);
  ctx.fillStyle = '#C0392B'; // Crimson brake light color selection
  ctx.fillRect(px(-w / 2 + 0.5), px(h / 2 - 2), 1.5, 1.5);
  ctx.fillRect(px(w / 2 - 2), px(h / 2 - 2), 1.5, 1.5);
}

/**
 * Renders multi-segment heavy logistics transport truck profiles.
 */
function drawTruckBody(ctx, c){
  const { w, h } = c;
  const cabH = h * 0.28; // Isolates cab engine dimensions from trailing cargo beds
  drawWheels(ctx, w, h, -h / 2 + cabH * 0.75, h / 2 - h * 0.18 - 5);

  // Render engine cab framing section
  ctx.fillStyle = '#8E2E27';
  ctx.fillRect(px(-w / 2), px(-h / 2), px(w), px(cabH));
  ctx.fillStyle = shadeColor('#8E2E27', -16);
  ctx.fillRect(px(-w / 2 + 1), px(-h / 2 + 1), px(w - 2), px(cabH * 0.32));

  // Render primary front cab windshield asset fields
  ctx.fillStyle = '#2B2D45';
  ctx.fillRect(px(-w / 2 + 1.5), px(-h / 2 + cabH * 0.42), px(w - 3), px(cabH * 0.5));

  // Render front engine headlights marker sets
  ctx.fillStyle = '#FFE9A8';
  ctx.fillRect(px(-w / 2 + 0.5), px(-h / 2 + 0.5), 1.5, 1.5);
  ctx.fillRect(px(w / 2 - 2), px(-h / 2 + 0.5), 1.5, 1.5);

  // Render secondary rear cargo container bed structures
  ctx.fillStyle = '#F2EEE2';
  ctx.fillRect(px(-w / 2), px(-h / 2 + cabH), px(w), px(h - cabH));
  ctx.fillStyle = shadeColor('#F2EEE2', -10);
  ctx.fillRect(px(-w / 2), px(-h / 2 + cabH + (h - cabH) * 0.46), px(w), 2);

  // Render mechanical hinge separation borders separating components
  ctx.fillStyle = '#D8D3C2';
  ctx.fillRect(px(-w / 2), px(-h / 2 + cabH), px(w), 1);

  // Render trailing brake signal layout grids
  ctx.fillStyle = '#C0392B';
  ctx.fillRect(px(-w / 2 + 0.5), px(h / 2 - 2), 1.5, 1.5);
  ctx.fillRect(px(w / 2 - 2), px(h / 2 - 2), 1.5, 1.5);
}

// Router map matching configuration draw keys to absolute execution loops
const DRAW_FNS = {
  drawCarBody: (ctx, c) => {
    // Generate a consistent random color index per traffic car based on its unique ID.
    // hash() returns a fraction in [0, 1) — must be scaled + floored into a valid
    // integer array index, NOT used with `%` (0.37 % 7 is still 0.37, not an index).
    const colorIndex = Math.floor(Math.abs(hash(c.id || 0)) * TRAFFIC_COLORS.length);
    const assignedColor = TRAFFIC_COLORS[colorIndex];
    drawCarBody(ctx, c, assignedColor);
  },
  drawTruckBody: (ctx, c) => drawTruckBody(ctx, c)
};

/**
 * Draws flashing turn signals on vehicles that are signaling or changing lanes.
 * Turn signals are perfectly symmetrical on both sides of the car body (1px exact gap).
 */
function drawTurnSignal(ctx, c){
  if (c.state !== 'signaling' && c.state !== 'changing') return; 
  if (!c.blinkOn) return; // Skips rendering on off-blink cycles
  const dir = c.targetLane > c.startLane ? 1 : -1; 
  ctx.fillStyle = '#FF9F43'; // Bright retro orange indicator color
  
  const flashSize = 3;
  const gap = 1; // Spacing gap in pixels between the vehicle body and indicator
  
  // Symmetrical X calculations so left/right signals mirror each other perfectly
  let x;
  if (dir > 0) {
    x = c.w / 2 + gap; // Right indicator (aligned outside the right body edge)
  } else {
    x = -c.w / 2 - gap - flashSize; // Left indicator (aligned outside the left body edge)
  }
  
  // Front corner blinker
  ctx.fillRect(px(x), px(-c.h / 2 + 2), flashSize, flashSize); 
  
  // Rear corner blinker
  ctx.fillRect(px(x), px(c.h / 2 - 5), flashSize, flashSize); 
}

/**
 * Isolates canvas transformations to handle independent obstacle positions and rotations safely.
 */
function drawTrafficVehicle(ctx, c){
  const drawFn = DRAW_FNS[(c.def && c.def.draw)] || DRAW_FNS.drawCarBody; 
  ctx.save(); 
  ctx.translate(px(c.x), px(c.y)); // Pixel-snapped coordinates for authentic retro rendering
  if (c.angle) ctx.rotate(c.angle); 
  drawFn(ctx, c); 
  drawTurnSignal(ctx, c); // Drawn inside the rotated state matrix
  ctx.restore(); 
}

/**
 * Renders the player unit vehicle container centered on active coordinate positions.
 */
function drawPlayerVehicle(ctx, player){
  ctx.save(); 
  ctx.translate(px(player.x), px(player.y)); // Pixel-snapped translations for player
  if (player.angle) ctx.rotate(player.angle); 
  drawCarBody(ctx, player, '#F5F2E8'); // Unique, distinct clean white body color for the player
  ctx.restore(); 
}

/**
 * Procedurally computes pixel clusters to render stylized moving grass shoulder segments.
 */
function drawGrass(ctx, elapsed, xStart, width){
  ctx.fillStyle = '#6E9142'; // Solid baseline grass meadow color
  ctx.fillRect(px(xStart), 0, px(width), PH); 
  const rowH = 5;
  const scrollRows = Math.floor(elapsed * 8);
  const subPixel = (elapsed * 8 * rowH) % rowH; // Calculates sub-pixel vertical parallax offsets
  const rows = Math.ceil(PH / rowH) + 2;
  
  for (let r = -1; r <= rows; r++){
    const globalRow = r + scrollRows;
    const y = px(r * rowH - subPixel);
    const h1 = hash(globalRow * 3.1 + xStart * 0.13); 
    const h2 = hash(globalRow * 5.7 + xStart * 0.31 + 11); 
    const bx1 = px(xStart + h1 * (width - 3)); 
    const bx2 = px(xStart + h2 * (width - 3)); 
    
    ctx.fillStyle = (globalRow % 2 === 0) ? '#557331' : '#86AE55'; 
    ctx.fillRect(bx1, y, 2, 2); 
    ctx.fillStyle = (globalRow % 2 === 0) ? '#86AE55' : '#557331'; 
    ctx.fillRect(bx2, y + 2, 2, 2); 
  }
}

/**
 * Master rendering orchestrator executing pipeline drawing loops to construct active UI frames.
 */
export function render(ctx, { elapsed, traffic, player }){
  ctx.clearRect(0, 0, PW, PH); // Clear frame buffers cleanly

  // Fill asphalt base road tracks
  ctx.fillStyle = '#8D8F95'; 
  ctx.fillRect(0, 0, PW, PH); 

  // Render procedural sidebar elements
  drawGrass(ctx, elapsed, 0, SHOULDER); 
  drawGrass(ctx, elapsed, PW - SHOULDER, SHOULDER); 

  // Render road lane marker divider strokes
  ctx.strokeStyle = '#F2F0E8'; 
  ctx.lineWidth = 2; 
  ctx.setLineDash([9, 8]); 
  ctx.lineDashOffset = -((elapsed * 70) % 17); 
  
  for (let i = 1; i < LANES; i++){
    const x = px(SHOULDER + LANE_W * i); 
    ctx.beginPath(); 
    ctx.moveTo(x, 0); 
    ctx.lineTo(x, PH); 
    ctx.stroke(); 
  }
  ctx.setLineDash([]); 

  // Render traffic and player onto active frame layers
  for (const c of traffic) drawTrafficVehicle(ctx, c); 
  drawPlayerVehicle(ctx, player); 
}