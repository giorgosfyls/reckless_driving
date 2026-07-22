// ==========================================================================
// MAIN
// Entry point: grabs DOM refs, sets up the canvas, wires input, and
// drives the requestAnimationFrame loop.
// ==========================================================================
import { PW, PH, updateDynamicLayout } from './config.js';
import { createUI } from './ui.js';
import { createGame } from './game.js';
import { bindInput } from './input.js';

(function(){
  "use strict";

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error("Canvas element with id 'game' not found!");
    return;
  }
  const ctx = canvas.getContext('2d');
  
  ctx.imageSmoothingEnabled = false;

  canvas.width = PW;
  canvas.height = PH;

  const ui = createUI();
  const game = createGame(ui);

  // Resize function to handle dynamic lanes layout on window resize
  function handleResize() {
    updateDynamicLayout();
  }

  // Bind resize listener
  window.addEventListener('resize', handleResize);
  
  // Run once initially to establish the starting lane count
  handleResize();

  bindInput({
    leftBtn: document.getElementById('leftBtn'),
    rightBtn: document.getElementById('rightBtn'),
    onLeft: game.moveLeft,
    onRight: game.moveRight,
    onConfirm: game.confirm
  });

  let lastTime = performance.now();
  
  function loop(now){
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    
    game.tick(dt, ctx);            
    requestAnimationFrame(loop);   
  }
  
  requestAnimationFrame(loop);
})();