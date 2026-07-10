(function(){
  "use strict";

  // ---------------------------------------------------------------
  // MOBILE VS DESKTOP DYNAMIC GEOMETRY SETUP
  // ---------------------------------------------------------------
  // Checks if the window viewport falls under mobile form factors (<= 768px wide)
  const isMobile = window.innerWidth <= 768;

  // As requested: locks onto 4 lanes for smartphones, expands to 5 lanes on PC desktops
  const LANES = isMobile ? 4 : 5;


  // ---------------------------------------------------------------
  // CANVAS DRAWING BOUNDARIES SETUP
  // ---------------------------------------------------------------
  // Accesses the DOM canvas. Disables anti-aliasing to make pixel boundaries blocky.
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Internal resolution width (PW) adjusts dynamically to fit the lane count
  const PW = isMobile ? 168 : 210; 
  const PH = 250;

  canvas.width = PW;
  canvas.height = PH;


  // ---------------------------------------------------------------
  // ROAD / LANE COORD CALCULATORS
  // ---------------------------------------------------------------
  const SHOULDER = 12; // Grass buffer thickness on the edges
  const LANE_AREA_W = PW - SHOULDER * 2; // Real roadway width area
  const LANE_W = LANE_AREA_W / LANES; // Step allocation per lane matching viewport

  // Finds the center X coordinate of any specific lane index
  function laneCenterX(lane){
    return SHOULDER + LANE_W * lane + LANE_W / 2;
  }


  // ---------------------------------------------------------------
  // SPRITE DIMENSIONS & CORE STATES
  // ---------------------------------------------------------------
  const CAR_W = 15, CAR_H = 24;
  const TRUCK_W = 22, TRUCK_H = 46;

  let state = 'start'; // Machine tracking status flag: 'start' | 'playing' | 'gameover'
  let elapsed = 0;
  let score = 0;
  let scoreDistanceAcc = 0;
  let best = 0;


  // ---------------------------------------------------------------
  // PLAYER INITIALIZATION PROPERTIES
  // ---------------------------------------------------------------
  let player = {
    lane: Math.floor(LANES / 2) - 1,
    x: 0,
    y: PH - 44,
    w: CAR_W,
    h: CAR_H
  };
  player.x = laneCenterX(player.lane);
  let playerTargetX = player.x; // Target node coordinates for steering lerps


  // ---------------------------------------------------------------
  // TRAFFIC ENGINE VARIABLES
  // ---------------------------------------------------------------
  let traffic = [];
  let spawnTimer = 0;
  let lastSpawnLane = -1;


  // ---------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // ---------------------------------------------------------------
  const overlayEl = document.getElementById('overlay');
  const scoreEl = document.getElementById('scoreVal');
  const bestEl = document.getElementById('bestVal');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');


  // ---------------------------------------------------------------
  // USER INTERFACE OVERLAY TOGGLES
  // ---------------------------------------------------------------
  // Draws the initial start screen layout
  function showStartOverlay(){
    overlayEl.classList.remove('hidden');
    overlayEl.innerHTML =
      '<h2>Ready?</h2>' +
      '<p>Tap the arrows (or press &larr; &rarr;) to change lanes. Other drivers will swerve into you without warning &mdash; dodge them!</p>' +
      '<button class="verify-btn" id="playBtn">START</button>';
    document.getElementById('playBtn').addEventListener('click', startGame);
  }

  // Draws the crash notification module screen
  function showGameOverOverlay(){
    overlayEl.classList.remove('hidden');
    overlayEl.innerHTML =
      '<h2>You crashed</h2>' +
      '<p>Distance: ' + score + (score >= best ? ' &mdash; new best!' : '') + '</p>' +
      '<button class="verify-btn" id="retryBtn">TRY AGAIN</button>';
    document.getElementById('retryBtn').addEventListener('click', startGame);
  }

  function hideOverlay(){
    overlayEl.classList.add('hidden');
  }


  // ---------------------------------------------------------------
  // GAME RUNTIME SYSTEMS
  // ---------------------------------------------------------------
  // Resets game state engines to spawn clean boards
  function startGame(){
    state = 'playing';
    elapsed = 0;
    score = 0;
    scoreDistanceAcc = 0;
    traffic = [];
    spawnTimer = 0.4;
    player.lane = Math.floor(LANES / 2) - 1;
    player.x = laneCenterX(player.lane);
    playerTargetX = player.x;
    hideOverlay();
  }

  // Halts state updates when collisions are verified
  function endGame(){
    state = 'gameover';
    if (score > best) best = score;
    bestEl.textContent = best;
    showGameOverOverlay();
  }


  // ---------------------------------------------------------------
  // INTERACTIVE INPUT CONTROLS
  // ---------------------------------------------------------------
  function moveLeft(){
    if (state !== 'playing') return;
    if (player.lane > 0){
      player.lane -= 1;
      playerTargetX = laneCenterX(player.lane);
    }
  }

  function moveRight(){
    if (state !== 'playing') return;
    if (player.lane < LANES - 1){
      player.lane += 1;
      playerTargetX = laneCenterX(player.lane);
    }
  }

  // Hooks touch event triggers onto the HTML controller block
  leftBtn.addEventListener('click', moveLeft);
  rightBtn.addEventListener('click', moveRight);

  // Maps keyboard inputs to support desktop navigation alternative paths
  window.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){
      e.preventDefault();
      moveLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){
      e.preventDefault();
      moveRight();
    } else if (e.key === ' ' || e.key === 'Enter'){
      if (state !== 'playing') startGame();
    }
  }, { passive: false });


  // ---------------------------------------------------------------
  // TRAFFIC ALGORITHMS & OBJECT GENERATOR
  // ---------------------------------------------------------------
  // Scans lane matrices to block cars from spawning over each other
  function laneClearAt(lane, y, minGap, excludeCar){
    const targetX = laneCenterX(lane);
    for (const t of traffic){
      if (t === excludeCar) continue;
      if (Math.abs(t.x - targetX) < LANE_W * 0.65){
        if (Math.abs(t.y - y) < minGap) return false;
      }
    }
    return true;
  }

  // Generates randomized traffic obstacle cars inside safe lane zones
  function spawnCar(){
    const isTruck = elapsed > 1.5 && Math.random() < 0.22;
    const w = isTruck ? TRUCK_W : CAR_W;
    const h = isTruck ? TRUCK_H : CAR_H;
    const spawnY = -h - 6;
    const minGap = h + 22;

    let lane = -1;
    // Builds a randomized search order matching the active dynamic lane allocation count
    const order = Array.from({length: LANES}, (_, i) => i).sort(() => Math.random() - 0.5);
    for (const candidate of order){
      if (candidate === lastSpawnLane && order.length > 1) continue;
      if (laneClearAt(candidate, spawnY, minGap, null)){
        lane = candidate;
        break;
      }
    }
    if (lane === -1){
      for (const candidate of order){
        if (laneClearAt(candidate, spawnY, minGap, null)){ lane = candidate; break; }
      }
    }
    if (lane === -1) return;

    lastSpawnLane = lane;

    // Speeds scale upwards dynamically over time to increase difficulty
    const difficultySpeed = Math.min(elapsed * 1.6, 45);
    const speed = (isTruck ? 34 : 40) + difficultySpeed + Math.random() * (isTruck ? 14 : 24);

    // AI Aggression Mechanics: decides if this obstacle car will cut into an adjacent lane
    const willSwerve = !isTruck && elapsed > 2.5 && Math.random() < 0.42;
    let targetLane = lane;
    let swervePointY = 0;
    if (willSwerve){
      const dir = Math.random() < 0.5 ? -1 : 1;
      targetLane = lane + dir;
      if (targetLane < 0 || targetLane > LANES - 1){
        targetLane = lane - dir;
      }
      swervePointY = -40 - Math.random() * 110;
    }

    traffic.push({
      kind: isTruck ? 'truck' : 'car',
      lane: lane,
      x: laneCenterX(lane),
      y: spawnY,
      w: w,
      h: h,
      speed: speed,
      state: 'straight',
      willSwerve: willSwerve,
      targetLane: targetLane,
      swervePointY: swervePointY,
      signalTimer: 0,
      changeElapsed: 0,
      startLane: lane,
      blinkOn: false,
      blinkClock: 0,
      angle: 0,
      passed: false
    });
  }


  // ---------------------------------------------------------------
  // TRAFFIC PHYSICS LOGIC LOOP UPDATER
  // ---------------------------------------------------------------
  function easeInOut(t){
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  const MAX_TILT = 0.30; // Radians to lean the vehicle model when merging lanes

  function updateBlink(c, dt){
    c.blinkClock += dt;
    if (c.blinkClock > 0.12){
      c.blinkClock = 0;
      c.blinkOn = !c.blinkOn;
    }
  }

  // Updates lane steering matrices and increments Y translation frames
  function updateTraffic(dt){
    for (let i = traffic.length - 1; i >= 0; i--){
      const c = traffic[i];

      // Swerve transition state machine triggers
      if (c.state === 'straight' && c.willSwerve && c.y > c.swervePointY){
        c.willSwerve = false;
        if (laneClearAt(c.targetLane, c.y, c.h + 24, c)){
          c.state = 'signaling';
          c.signalTimer = 0.55;
        }
      } else if (c.state === 'signaling'){
        c.signalTimer -= dt;
        updateBlink(c, dt);
        if (c.signalTimer <= 0){
          c.state = 'changing';
          c.changeElapsed = 0;
        }
      } else if (c.state === 'changing'){
        c.changeElapsed += dt;
        updateBlink(c, dt);
        const t = Math.min(1, c.changeElapsed / 0.42);
        const dir = c.targetLane > c.startLane ? 1 : -1;
        c.x = laneCenterX(c.startLane) + (laneCenterX(c.targetLane) - laneCenterX(c.startLane)) * easeInOut(t);
        c.angle = dir * Math.sin(t * Math.PI) * MAX_TILT;
        if (t >= 1){
          c.lane = c.targetLane;
          c.state = 'straight';
          c.blinkOn = false;
          c.angle = 0;
        }
      }

      c.y += c.speed * dt;

      // Pass detection rewards score adjustments
      if (!c.passed && c.y > player.y){
        c.passed = true;
        score += 5;
      }

      // Garbage collection routine deletes old items that slip past the bottom
      if (c.y > PH + 40){
        traffic.splice(i, 1);
      }
    }

    resolveTrafficSpacing();
  }

  // Anti-clipping system prevents faster cars from driving through slower cars ahead of them
  function resolveTrafficSpacing(){
    for (let i = 0; i < traffic.length; i++){
      for (let j = i + 1; j < traffic.length; j++){
        const a = traffic[i], b = traffic[j];
        if (a.state !== 'straight' || b.state !== 'straight') continue;
        const xOverlap = Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 2;
        if (!xOverlap) continue;

        const leader = a.y <= b.y ? a : b;
        const follower = a.y <= b.y ? b : a;
        const minGap = (leader.h + follower.h) / 2 + 5;
        const gap = follower.y - leader.y;
        if (gap < minGap){
          follower.y = leader.y + minGap;
        }
      }
    }
  }


  // ---------------------------------------------------------------
  // AABB COLLISION BOX CHECKERS
  // ---------------------------------------------------------------
  function checkCollisions(){
    const pad = 2; // Pixel padding allowance margin
    for (const c of traffic){
      const overlapX = Math.abs(c.x - player.x) < (c.w + player.w) / 2 - pad;
      const overlapY = Math.abs(c.y - player.y) < (c.h + player.h) / 2 - pad;
      if (overlapX && overlapY){
        endGame();
        return;
      }
    }
  }


  // ---------------------------------------------------------------
  // RENDER GRAPHICS COMPONENT UTILITIES
  // ---------------------------------------------------------------
  function px(v){ return Math.round(v); }

  // Shifts colors dynamically to draw highlights or shadows
  function shadeColor(color, percent){
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent) / 100;
    const R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
    const nR = Math.round((t - R) * p) + R;
    const nG = Math.round((t - G) * p) + G;
    const nB = Math.round((t - B) * p) + B;
    return '#' + (0x1000000 + nR * 0x10000 + nG * 0x100 + nB).toString(16).slice(1);
  }

  function drawWheels(w, h, frontY, rearY){
    ctx.fillStyle = '#1B1C2B';
    const ww = 3, wh = 6;
    ctx.fillRect(px(-w / 2 - 1), px(frontY), ww, wh);
    ctx.fillRect(px(w / 2 - 2), px(frontY), ww, wh);
    ctx.fillRect(px(-w / 2 - 1), px(rearY), ww, wh);
    ctx.fillRect(px(w / 2 - 2), px(rearY), ww, wh);
  }

  function drawCarBody(w, h, bodyColor, windowColor){
    drawWheels(w, h, -h / 2 + h * 0.14, h / 2 - h * 0.14 - 6);

    ctx.fillStyle = bodyColor;
    ctx.fillRect(px(-w / 2), px(-h / 2), px(w), px(h));

    ctx.fillStyle = shadeColor(bodyColor, -14);
    ctx.fillRect(px(-w / 2 + 2), px(-h / 2 + h * 0.14), px(w - 4), px(h * 0.6));

    const winW = w - 6;
    ctx.fillStyle = windowColor;
    ctx.fillRect(px(-winW / 2), px(-h / 2 + h * 0.18), px(winW), px(h * 0.22));

    ctx.fillStyle = windowColor;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(px(-winW / 2), px(h / 2 - h * 0.32), px(winW), px(h * 0.16));
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#FFE9A8';
    ctx.fillRect(px(-w / 2 + 1), px(-h / 2 + 1), 2, 2);
    ctx.fillRect(px(w / 2 - 3), px(-h / 2 + 1), 2, 2);
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(px(-w / 2 + 1), px(h / 2 - 3), 2, 2);
    ctx.fillRect(px(w / 2 - 3), px(h / 2 - 3), 2, 2);
  }

  function drawTruckBody(w, h){
    const cabH = h * 0.28;

    drawWheels(w, h, -h / 2 + cabH * 0.75, h / 2 - h * 0.18 - 6);

    ctx.fillStyle = '#8E2E27';
    ctx.fillRect(px(-w / 2), px(-h / 2), px(w), px(cabH));
    ctx.fillStyle = shadeColor('#8E2E27', -16);
    ctx.fillRect(px(-w / 2 + 1), px(-h / 2 + 1), px(w - 2), px(cabH * 0.32));

    ctx.fillStyle = '#2B2D45';
    ctx.fillRect(px(-w / 2 + 2), px(-h / 2 + cabH * 0.42), px(w - 4), px(cabH * 0.5));

    ctx.fillStyle = '#FFE9A8';
    ctx.fillRect(px(-w / 2 + 1), px(-h / 2 + 1), 2, 2);
    ctx.fillRect(px(w / 2 - 3), px(-h / 2 + 1), 2, 2);

    ctx.fillStyle = '#F2EEE2';
    ctx.fillRect(px(-w / 2), px(-h / 2 + cabH), px(w), px(h - cabH));
    ctx.fillStyle = shadeColor('#F2EEE2', -10);
    ctx.fillRect(px(-w / 2), px(-h / 2 + cabH + (h - cabH) * 0.46), px(w), 2);

    ctx.fillStyle = '#D8D3C2';
    ctx.fillRect(px(-w / 2), px(-h / 2 + cabH), px(w), 1);

    ctx.fillStyle = '#C0392B';
    ctx.fillRect(px(-w / 2 + 1), px(h / 2 - 3), 2, 2);
    ctx.fillRect(px(w / 2 - 3), px(h / 2 - 3), 2, 2);
  }

  // Double turn indicator lights rendering (fixes the bug and blinks on both top and bottom corners of the turning side)
  function drawTurnSignal(c){
    if (c.state !== 'signaling' && c.state !== 'changing') return;
    if (!c.blinkOn) return;
    const dir = c.targetLane > c.startLane ? 1 : -1;
    ctx.fillStyle = '#FFC94D';
    
    // Front turn signal pixel
    const sxTop = px(c.x + dir * (c.w / 2 + 1));
    const syTop = px(c.y - c.h / 2 + 2);
    ctx.fillRect(sxTop, syTop, 2, 2);

    // Rear turn signal pixel
    const sxBottom = px(c.x + dir * (c.w / 2 + 1));
    const syBottom = px(c.y + c.h / 2 - 4);
    ctx.fillRect(sxBottom, syBottom, 2, 2);
  }

  function drawVehicle(c){
    ctx.save();
    ctx.translate(px(c.x), px(c.y));
    if (c.angle) ctx.rotate(c.angle);
    if (c.kind === 'truck'){
      drawTruckBody(c.w, c.h);
    } else {
      drawCarBody(c.w, c.h, c.color || 'var(--red-car)', '#2B2D45');
    }
    ctx.restore();
    drawTurnSignal(c);
  }

  // Generates infinite scroll patterns deterministically to prevent per-frame grass flickering
  function hash(n){
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  }

  function drawGrass(xStart, width){
    ctx.fillStyle = '#6E9142';
    ctx.fillRect(px(xStart), 0, px(width), PH);
    const rowH = 5;
    const scrollRows = Math.floor(elapsed * 8);
    const subPixel = (elapsed * 8 * rowH) % rowH;
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


  // ---------------------------------------------------------------
  // CANVAS RE-DRAW FRAME DISPATCHER
  // ---------------------------------------------------------------
  function render(){
    ctx.clearRect(0, 0, PW, PH);

    ctx.fillStyle = '#8D8F95';
    ctx.fillRect(0, 0, PW, PH);

    drawGrass(0, SHOULDER);
    drawGrass(PW - SHOULDER, SHOULDER);

    // Draws scrolling canvas dashed highway partition lines recursively
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

    // Renders active traffic vectors
    for (const c of traffic){
      if (c.kind === 'truck'){
        drawVehicle(c);
      } else {
        c.color = c.color || '#D64B3F';
        drawVehicle(c);
      }
    }

    // Draws the main user character vehicle model
    ctx.save();
    ctx.translate(px(player.x), px(player.y));
    drawCarBody(player.w, player.h, '#F5F2E8', '#2B2D45');
    ctx.restore();
  }


  // ---------------------------------------------------------------
  // ENGINE TICK HEARTBEAT LOOP
  // ---------------------------------------------------------------
  let lastTime = performance.now();

  function loop(now){
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (state === 'playing'){
      elapsed += dt;

      // Linear interpolation (lerp) handles smooth user lane swapping animations
      player.x += (playerTargetX - player.x) * Math.min(1, dt * 12);

      spawnTimer -= dt;
      if (spawnTimer <= 0){
        spawnCar();
        const minInt = 0.4;
        const maxInt = Math.max(minInt, 1.0 - elapsed * 0.012);
        spawnTimer = minInt + Math.random() * (maxInt - minInt);
      }

      updateTraffic(dt);
      checkCollisions();

      // Updates score values passively as long as the state is active
      scoreDistanceAcc += dt * 10;
      while (scoreDistanceAcc >= 1){
        score += 1;
        scoreDistanceAcc -= 1;
      }
      scoreEl.textContent = score;
    } else {
      elapsed += dt * 0.5; // Smooth ambient background scrolling for the home menus
    }

    render();
    requestAnimationFrame(loop);
  }

  // Boot up structural components
  showStartOverlay();
  render();
  requestAnimationFrame(loop);

})();