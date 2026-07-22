// ==========================================================================
// PLAYER
// Owns the player's state and its smooth "lean into the turn, then
// straighten out" steering animation.
// ==========================================================================
import { LANES, PLAYER_W, PLAYER_H, PLAYER_Y, STEER_DURATION, MAX_TILT, laneCenterX } from './config.js';
import { easeInOut, lerp } from './utils.js';

/**
 * Instantiates the state engine for the player unit at initialization.
 * @returns {Object} Fresh player configurations positioned in the center lane.
 */
export function createPlayer(){
  const player = {
    lane: Math.floor(LANES / 2), // Default initialization locked to the middle lane
    x: 0,
    y: PLAYER_Y,
    w: PLAYER_W,
    h: PLAYER_H,
    angle: 0,                    // Rotation tracking variable in radians
    // Animation vector timelines
    startX: 0,
    targetX: 0,
    turnDir: 0,                  // -1 represents leftward translation, 1 represents rightward translation
    turnElapsed: STEER_DURATION // Starts fully resting in lane
  };
  // Align positions instantly on center grid point
  player.x = player.startX = player.targetX = laneCenterX(player.lane);
  return player;
}

/**
 * Resets the player state machine cleanly on transition out of a game over state.
 * @param {Object} player - The current player state reference.
 */
export function resetPlayer(player){
  player.lane = Math.floor(LANES / 2);
  player.x = player.startX = player.targetX = laneCenterX(player.lane);
  player.angle = 0;
  player.turnDir = 0;
  player.turnElapsed = STEER_DURATION;
}

/**
 * Evaluates boundary condition and fires steering sequence to the left lane.
 * @param {Object} player - The active player state.
 */
export function moveLeft(player){
  if (player.lane <= 0) return; // Edge constraint check preventing off-road out-of-bounds
  steerTo(player, player.lane - 1, -1);
}

/**
 * Evaluates boundary condition and fires steering sequence to the right lane.
 * @param {Object} player - The active player state.
 */
export function moveRight(player){
  if (player.lane >= LANES - 1) return; // Edge constraint check preventing off-road out-of-bounds
  steerTo(player, player.lane + 1, 1);
}

/**
 * Configures the linear interpolation state targets for a lane transition sequence.
 * @param {Object} player - The active player state.
 * @param {number} newLane - Destination index target.
 * @param {number} dir - Numerical direction multiplier tracking alignment paths.
 */
function steerTo(player, newLane, dir){
  player.lane = newLane;
  player.startX = player.x;
  player.targetX = laneCenterX(newLane);
  player.turnDir = dir;
  player.turnElapsed = 0; // Rewind timeline to initialize interpolation processing loops
}

/**
 * Processes execution frames to compute smooth positioning shifts and rotational body lean curves.
 * Synced mathematically to reflect identical lane-change dynamics used by AI traffic systems.
 * @param {Object} player - The active player state.
 * @param {number} dt - Time delta increment since the preceding tick frame execution.
 */
export function updatePlayer(player, dt){
  // SAFETY: If the screen shrinks and lanes decrease, safely bring the player to the last available lane
  if (player.lane >= LANES) {
    player.lane = LANES - 1;
    player.targetX = laneCenterX(player.lane);
  }

  if (player.turnElapsed < STEER_DURATION){
    player.turnElapsed = Math.min(STEER_DURATION, player.turnElapsed + dt);
    const t = player.turnElapsed / STEER_DURATION;
    
    // Smooth parametric positional shifting using cosine easing
    player.x = lerp(player.startX, player.targetX, easeInOut(t));
    
    // Calculates rotational angle via a sine curve wrapper to simulate a natural body-roll sway
    player.angle = player.turnDir * Math.sin(t * Math.PI) * MAX_TILT;
  } else {
    // Stabilize position at the center of the current lane
    player.x = laneCenterX(player.lane);
    player.angle = 0;
  }
}