// ==========================================================================
// INPUT
// Wires keyboard and on-screen buttons to steering/start callbacks.
// Knows nothing about game state — just forwards intent.
// ==========================================================================

/**
 * Attaches physical mouse clicks, touch interactions, and key listener systems directly to control triggers.
 */
export function bindInput({ leftBtn, rightBtn, onLeft, onRight, onConfirm }){
  // Hook up responsive click behaviors to on-screen steering HUD elements
  leftBtn.addEventListener('click', onLeft);
  rightBtn.addEventListener('click', onRight);

  // Hook up keyboard capture bindings to evaluate navigation controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){
      e.preventDefault(); // Inhibits natural browser screen horizontal scrolling shifts
      onLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){
      e.preventDefault(); // Inhibits natural browser screen horizontal scrolling shifts
      onRight();
    } else if (e.key === ' ' || e.key === 'Enter'){
      onConfirm(); // Standard select action keys to toggle overlay menus
    }
  }, { passive: false }); // Configured explicitly as non-passive to allow calling preventDefault() reliably
}