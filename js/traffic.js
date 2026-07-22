// ==========================================================================
// TRAFFIC ENGINE
// Spawns and updates oncoming vehicles. Everything here reads vehicle
// shape/speed/behaviour from config.VEHICLE_TYPES, so adding bus / van /
// police / ambulance / motorcycle later is a config + renderer change
// only — this file never needs to know a new kind exists.
// ==========================================================================
import {
  PH, LANES, laneCenterX, LANE_W, VEHICLE_TYPES,
  DIFFICULTY_SPEED_CAP, DIFFICULTY_SPEED_RATE,
  MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL_BASE, MAX_SPAWN_INTERVAL_RATE,
  SWERVE_MIN_ELAPSED, SWERVE_CHANCE, TRUCK_MIN_ELAPSED,
  STEER_DURATION, MAX_TILT
} from './config.js';
import { easeInOut, weightedPick } from './utils.js';

/**
 * Generates an active tracking structure for oncoming elements.
 * @returns {Object} Initial traffic states container.
 */
export function createTrafficState(){
  return { list: [], spawnTimer: 0.4, lastSpawnLane: -1 };
}

/**
 * Flushes active oncoming arrays and sets timers back to standard defaults on game restarts.
 * @param {Object} state - Current ongoing traffic tracking references.
 */
export function resetTraffic(state){
  state.list = [];
  state.spawnTimer = 0.4;
  state.lastSpawnLane = -1;
}

/**
 * Scans layout arrays to check if a target road coordinate zone is cleared of hitboxes.
 * @param {Array} list - Collection containing active onscreen elements.
 * @param {number} lane - Target grid point index candidate.
 * @param {number} y - Vertical point evaluation line.
 * @param {number} minGap - Proximity threshold limits required for safe clearing.
 * @param {Object|null} excludeCar - Active reference object to jump past during validation testing loops.
 * @returns {boolean} True if region is cleared; False if collision footprint conflicts exist.
 */
function laneClearAt(list, lane, y, minGap, excludeCar){
  const targetX = laneCenterX(lane);
  for (const t of list){
    if (t === excludeCar) continue;
    if (Math.abs(t.x - targetX) < LANE_W * 0.65){
      if (Math.abs(t.y - y) < minGap) return false;
    }
  }
  return true;
}

/**
 * Handles algorithmic creation, placement randomization, configuration setup, and tracking injections for incoming vehicles.
 * @param {Object} state - Core traffic state collection tracker.
 * @param {number} elapsed - Accumulated time value tracking overall run duration.
 */
function spawnCar(state, elapsed){
  const kind = elapsed > TRUCK_MIN_ELAPSED ? weightedPick(VEHICLE_TYPES) : 'car';
  const def = VEHICLE_TYPES[kind];
  const w = def.w, h = def.h;
  const spawnY = -h - 6;
  const minGap = h + 22;

  let lane = -1;
  const order = Array.from({ length: LANES }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const candidate of order){
    if (candidate === state.lastSpawnLane && order.length > 1) continue;
    if (laneClearAt(state.list, candidate, spawnY, minGap, null)){ lane = candidate; break; }
  }
  if (lane === -1){
    for (const candidate of order){
      if (laneClearAt(state.list, candidate, spawnY, minGap, null)){ lane = candidate; break; }
    }
  }
  if (lane === -1) return;
  state.lastSpawnLane = lane;

  const difficultySpeed = Math.min(elapsed * DIFFICULTY_SPEED_RATE, DIFFICULTY_SPEED_CAP);
  const speed = def.baseSpeed + difficultySpeed + Math.random() * def.speedVariance;

  const willSwerve = def.canSwerve && elapsed > SWERVE_MIN_ELAPSED && Math.random() < SWERVE_CHANCE;
  let targetLane = lane, swervePointY = 0;
  if (willSwerve){
    const dir = Math.random() < 0.5 ? -1 : 1;
    targetLane = lane + dir;
    if (targetLane < 0 || targetLane > LANES - 1) targetLane = lane - dir;
    swervePointY = -40 - Math.random() * 110;
  }

  state.list.push({
    id: Math.floor(Math.random() * 1000000), // Injected unique ID so renderer can assign different retro colors
    kind, def,
    lane, x: laneCenterX(lane), y: spawnY,
    w, h, speed,
    state: 'straight', 
    willSwerve, targetLane, swervePointY,
    signalTimer: 0.60,  
    changeElapsed: 0, 
    startLane: lane,
    blinkOn: false, 
    blinkClock: 0,
    angle: 0, 
    passed: false
  });
}

/**
 * Manages interval timers processing the active state machine cycles for turn signals.
 */
function updateBlink(c, dt){
  c.blinkClock += dt;
  if (c.blinkClock > 0.08){ 
    c.blinkClock = 0; 
    c.blinkOn = !c.blinkOn; 
  }
}

/**
 * Post-movement correction layer preventing overlapping vehicle packs from clustering via trailing speeds.
 */
function resolveTrafficSpacing(list){
  for (let i = 0; i < list.length; i++){
    for (let j = i + 1; j < list.length; j++){
      const a = list[i], b = list[j];
      if (a.state !== 'straight' || b.state !== 'straight') continue;
      if (Math.abs(a.x - b.x) >= (a.w + b.w) / 2 - 2) continue;
      
      const leader = a.y <= b.y ? a : b;
      const follower = a.y <= b.y ? b : a;
      const minGap = (leader.h + follower.h) / 2 + 5;
      const gap = follower.y - leader.y;
      
      if (gap < minGap) follower.y = leader.y + minGap;
    }
  }
}

/**
 * Calculates physics offsets, processes behavior paths, cleans off-screen elements, and maps point triggers.
 */
export function updateTraffic(state, dt, elapsed, playerY){
  let scoreGained = 0;
  const list = state.list;

  for (let i = list.length - 1; i >= 0; i--){
    const c = list[i];

    if (c.state === 'straight' && c.willSwerve && c.y > c.swervePointY){
      c.willSwerve = false;
      if (c.targetLane >= 0 && c.targetLane < LANES && laneClearAt(list, c.targetLane, c.y, c.h + 24, c)){
        c.state = 'signaling';
        c.signalTimer = 0.60; 
      }
    } 
    else if (c.state === 'signaling'){
      c.signalTimer -= dt;
      updateBlink(c, dt);
      if (c.signalTimer <= 0){ 
        if (c.targetLane >= LANES) c.targetLane = LANES - 1;
        c.state = 'changing'; 
        c.changeElapsed = 0; 
      }
    } 
    else if (c.state === 'changing'){
      c.changeElapsed += dt;
      updateBlink(c, dt);
      
      const t = Math.min(1, c.changeElapsed / STEER_DURATION);
      const dir = c.targetLane > c.startLane ? 1 : -1;
      
      const startX = laneCenterX(Math.min(c.startLane, LANES - 1));
      const endX = laneCenterX(Math.min(c.targetLane, LANES - 1));
      
      c.x = startX + (endX - startX) * easeInOut(t);
      c.angle = dir * Math.sin(t * Math.PI) * MAX_TILT;
      
      if (t >= 1){ 
        c.lane = Math.min(c.targetLane, LANES - 1); 
        c.state = 'straight'; 
        c.blinkOn = false; 
        c.angle = 0; 
      }
    }

    c.y += c.speed * dt;

    if (!c.passed && c.y > playerY){
      c.passed = true;
      scoreGained += 5;
    }
    if (c.y > PH + 40) list.splice(i, 1);
  }

  resolveTrafficSpacing(list);
  return scoreGained;
}

/**
 * Coordinates internal cadence timers tracking automated vehicle generations.
 */
export function maybeSpawn(state, dt, elapsed){
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0){
    spawnCar(state, elapsed);
    const maxInt = Math.max(MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL_BASE - elapsed * MAX_SPAWN_INTERVAL_RATE);
    state.spawnTimer = MIN_SPAWN_INTERVAL + Math.random() * (maxInt - MIN_SPAWN_INTERVAL);
  }
}