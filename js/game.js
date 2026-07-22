// ==========================================================================
// GAME
// The state machine ('start' | 'playing' | 'gameover') and per-frame
// update step. Owns no DOM/canvas references directly — those are
// injected so this module stays testable and UI-agnostic.
// ==========================================================================
import { createPlayer, resetPlayer, moveLeft as playerMoveLeft, moveRight as playerMoveRight, updatePlayer } from './player.js';
import { createTrafficState, resetTraffic, updateTraffic, maybeSpawn } from './traffic.js';
import { checkCollisions } from './collision.js';
import { render } from './renderer.js';

/**
 * Initializes state records and bundles engine pipeline loop control hooks.
 * @param {Object} ui - Injected modular user interface abstraction system.
 * @returns {Object} Core execution lifecycle controller handles.
 */
export function createGame(ui){
  const player = createPlayer();
  const traffic = createTrafficState();

  // Core state tracker engine configuration block
  const g = {
    state: 'start', // State machine values: 'start' | 'playing' | 'gameover'
    elapsed: 0,     // Total driving duration run clock tracking metrics
    score: 0,       // Current game pass rewards points balance
    scoreDistanceAcc: 0, // Accumulates floating delta ticks until converting into distance points
    best: 0         // Persistent cross-session record high tracker
  };

  /**
   * Fires layout resets and updates state configurations to start active gameplay loops.
   */
  function start(){
    g.state = 'playing';
    g.elapsed = 0;
    g.score = 0;
    g.scoreDistanceAcc = 0;
    resetPlayer(player);
    resetTraffic(traffic);
    ui.hide(); // Clears layout blocking menus out of view fields
    ui.setScore(0);
  }

  /**
   * Shifts state parameters into halt configurations and prompts dashboard view changes on player crash.
   */
  function end(){
    g.state = 'gameover';
    if (g.score > g.best) g.best = g.score; // High score override evaluation pass
    ui.setBest(g.best);
    ui.showGameOver(g.score, g.best, start);
  }

  // Wrapped interface pass hooks filtering controller navigation intents
  function moveLeft(){ if (g.state === 'playing') playerMoveLeft(player); }
  function moveRight(){ if (g.state === 'playing') playerMoveRight(player); }
  function confirm(){ if (g.state !== 'playing') start(); }

  /**
   * Primary frame core tick handler executed regularly via main master step requests.
   * @param {number} dt - Floating-point segment tracking frame delta timings.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context reference.
   */
  function tick(dt, ctx){
    if (g.state === 'playing'){
      g.elapsed += dt;
      updatePlayer(player, dt);

      maybeSpawn(traffic, dt, g.elapsed);
      // Process positions updates and capture accumulated bypass rewards metrics
      g.score += updateTraffic(traffic, dt, g.elapsed, player.y);

      // Runs collision verification passes across active hitboxes
      if (checkCollisions(player, traffic.list)){
        end();
      } else {
        // Procedural point reward tracking processing based on distance traveled over time
        g.scoreDistanceAcc += dt * 10;
        while (g.scoreDistanceAcc >= 1){
          g.score += 1;
          g.scoreDistanceAcc -= 1;
        }
        ui.setScore(g.score); // Pushes updated point totals to DOM output text elements
      }
    } else {
      g.elapsed += dt * 0.5; // Runs ambient background scrolling animation while menus are open
    }

    // Refresh rendering viewport output frames
    render(ctx, { elapsed: g.elapsed, traffic: traffic.list, player });
  }

  ui.showStart(start); // Deploy entry startup banner layout overlays

  return { tick, moveLeft, moveRight, confirm };
}