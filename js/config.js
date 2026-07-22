// ==========================================================================
// CONFIG
// Single source of truth for canvas geometry and the vehicle registry.
// ==========================================================================

export const PW = 220;
export const PH = 320;

// We change LANES and LANE_W to let so they can be updated dynamically!
export let LANES = 5; 
export const SHOULDER = 14; 

export let LANE_AREA_W = PW - SHOULDER * 2; 
export let LANE_W = LANE_AREA_W / LANES;      

/**
 * Updates the number of lanes dynamically based on the window/screen width
 * and recalculates the lane widths.
 */
export function updateDynamicLayout() {
  const width = window.innerWidth;

  if (width < 375) {
    LANES = 3; // < 375px: 3 lanes
  } else if (width >= 375 && width <= 768) {
    LANES = 4; // >= 375px and <= 768px: 4 lanes
  } else if (width > 768 && width <= 1440) {
    LANES = 5; // > 768px and <= 1440px: 5 lanes
  } else {
    LANES = 6; // > 1440px: 6 lanes
  }

  // Recalculate dependent layout metrics
  LANE_AREA_W = PW - SHOULDER * 2;
  LANE_W = LANE_AREA_W / LANES;
}

// Initialize layout once on load
updateDynamicLayout();

/**
 * Calculates the exact horizontal center pixel for a specific lane index.
 * @param {number} lane - The zero-indexed lane number (0 to LANES-1).
 * @returns {number} The X coordinate corresponding to the center of the lane.
 */
export function laneCenterX(lane){
  // Clamp lane safely within current dynamic limits
  const safeLane = Math.max(0, Math.min(lane, LANES - 1));
  return SHOULDER + LANE_W * safeLane + LANE_W / 2;
}

// Player hitbox dimensions (Original sizes preserved)
export const PLAYER_W = 16; 
export const PLAYER_H = 27; 
export const PLAYER_Y = PH - 65; 

// Shared lane-change parameters
export const STEER_DURATION = 0.24; 
export const MAX_TILT = 0.18;       

// Obstacle registry (Original sizes preserved)
export const VEHICLE_TYPES = {
  car: {
    enabled: true,
    weight: 70,
    w: 16,           
    h: 26,           
    baseSpeed: 52,
    speedVariance: 18,
    canSwerve: true,
    draw: 'drawCarBody'
  },
  truck: {
    enabled: true,
    weight: 30,
    w: 22,           
    h: 44,           
    baseSpeed: 34,
    speedVariance: 10,
    canSwerve: false,
    draw: 'drawTruckBody'
  },
  van:        { enabled: false, weight: 0, w: 18, h: 30, baseSpeed: 38, speedVariance: 20, canSwerve: true,  draw: 'drawCarBody', color: '#7A8AA8' },
  police:     { enabled: false, weight: 0, w: 16, h: 26, baseSpeed: 46, speedVariance: 26, canSwerve: true,  draw: 'drawCarBody', color: '#2B2D45' },
  ambulance:  { enabled: false, weight: 0, w: 18, h: 30, baseSpeed: 40, speedVariance: 18, canSwerve: true,  draw: 'drawCarBody', color: '#F2EEE2' },
  motorcycle: { enabled: false, weight: 0, w: 8,  h: 16, baseSpeed: 48, speedVariance: 30, canSwerve: true,  draw: 'drawCarBody', color: '#2A2C40' }
};

export const DIFFICULTY_SPEED_CAP = 45;      
export const DIFFICULTY_SPEED_RATE = 1.6;     
export const MIN_SPAWN_INTERVAL = 0.4;       
export const MAX_SPAWN_INTERVAL_BASE = 1.6;  
export const MAX_SPAWN_INTERVAL_RATE = 0.04; 

export const SWERVE_MIN_ELAPSED = 1.5; 
export const SWERVE_CHANCE = 0.35;     
export const TRUCK_MIN_ELAPSED = 3.0;