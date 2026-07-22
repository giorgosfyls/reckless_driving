// ==========================================================================
// UI
// DOM-facing bits: start/game-over overlays and the Distance/Best HUD.
// No game logic lives here — it only reads/writes the DOM.
// ==========================================================================

/**
 * Selects and encapsulates DOM nodes to handle text overrides and status changes.
 * @returns {Object} Operational UI manipulation handles.
 */
export function createUI(){
  const overlayEl = document.getElementById('overlay');
  const scoreEl = document.getElementById('scoreVal');
  const bestEl = document.getElementById('bestVal');

  /**
   * Generates dynamic HTML node layouts creating the primary startup game guide overlay banner.
   * @param {Function} onPlay - Target action fired when pressing the start button.
   */
  function showStart(onPlay){
    overlayEl.classList.remove('hidden');
    overlayEl.innerHTML =
      '<h2>Ready?</h2>' +
      '<p>Tap the arrows (or press &larr; &rarr;) to change lanes. Other drivers will swerve into you without warning &mdash; dodge them!</p>' +
      '<button class="verify-btn" id="playBtn">START</button>';
    document.getElementById('playBtn').addEventListener('click', onPlay);
  }

  /**
   * Generates dynamic HTML layouts creating the crash metrics wrap screen.
   * @param {number} score - Achieved performance point total for the current session.
   * @param {number} best - High record benchmark scale.
   * @param {Function} onRetry - Reset action fired when pressing the restart button.
   */
  function showGameOver(score, best, onRetry){
    overlayEl.classList.remove('hidden');
    overlayEl.innerHTML =
      '<h2>You crashed</h2>' +
      '<p>Distance: ' + score + (score >= best ? ' &mdash; new best!' : '') + '</p>' +
      '<button class="verify-btn" id="retryBtn">TRY AGAIN</button>';
    document.getElementById('retryBtn').addEventListener('click', onRetry);
  }

  /**
   * Adds visibility hiding flags to shift screens out of sight lines.
   */
  function hide(){
    overlayEl.classList.add('hidden');
  }

  /**
   * Updates current distance value string counters inside assigned text elements.
   */
  function setScore(score){
    scoreEl.textContent = score;
  }

  /**
   * Updates maximum high record text indicators across active visual layers.
   */
  function setBest(best){
    bestEl.textContent = best;
  }

  return { showStart, showGameOver, hide, setScore, setBest };
}