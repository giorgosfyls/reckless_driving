// ==========================================================================
// COLLISION
// Simple AABB overlap test between the player and every traffic vehicle.
// ==========================================================================

/**
 * Runs structural Axis-Aligned Bounding Box overlapping check passes between tracking boundaries.
 * Includes a small pixel buffer pad configuration setting to prevent frustrating near-miss collision penalties.
 * @param {Object} player - Player entity state record containing position coordinates and hitboxes.
 * @param {Array} trafficList - Collection database recording currently tracking onscreen obstacles.
 * @returns {boolean} True if intersecting footprints are found; False otherwise.
 */
export function checkCollisions(player, trafficList){
  const pad = 2; // Tolerance value reducing structural bounding dimensions to support near-miss saves
  for (const c of trafficList){
    // Evaluates horizontal plane intersection conditions
    const overlapX = Math.abs(c.x - player.x) < (c.w + player.w) / 2 - pad;
    // Evaluates vertical plane intersection conditions
    const overlapY = Math.abs(c.y - player.y) < (c.h + player.h) / 2 - pad;
    
    if (overlapX && overlapY) return true; // Collision confirmed
  }
  return false; // Tracks paths are safely cleared
}