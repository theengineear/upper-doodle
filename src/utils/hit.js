/**
 * @typedef {import('./types.js').Arrow} Arrow
 * @typedef {import('./types.js').BoundingBox} BoundingBox
 */

/**
 * Hit testing utilities for pure geometric queries
 */
export class Hit {
  /**
   * Calculate Euclidean distance between two points
   * @param {number} x1 - First point X coordinate
   * @param {number} y1 - First point Y coordinate
   * @param {number} x2 - Second point X coordinate
   * @param {number} y2 - Second point Y coordinate
   * @returns {number} Distance between points
   */
  static #distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  /**
   * Test if a point hits a bounding box
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {BoundingBox} bbox - Bounding box
   * @returns {boolean} True if point hits the bounding box
   */
  static testBox(x, y, bbox) {
    // Simple bounding box test
    if (x < bbox.x || x > bbox.x + bbox.width) {
      return false;
    }
    if (y < bbox.y || y > bbox.y + bbox.height) {
      return false;
    }

    // For now, just use bounding box test
    // A more sophisticated approach would test against actual shape geometry
    return true;
  }

  /**
   * Test if point is near an arrow line
   * @param {Arrow} arrow - Arrow element to test
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {boolean} True if point is within hit distance of arrow line
   */
  static testArrow(arrow, x, y) {
    const { x1, y1, x2, y2 } = arrow;

    // Calculate distance from point to line segment
    // Vector from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    // Handle degenerate case (zero-length line)
    if (lengthSquared === 0) {
      const dist = Hit.#distance(x, y, x1, y1);
      return dist <= 8; // Hit distance threshold
    }

    // Parameter t represents position along line segment (0 to 1)
    // Project point onto line segment
    let t = ((x - x1) * dx + (y - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

    // Find closest point on line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Calculate distance from point to closest point on line
    const distance = Hit.#distance(x, y, closestX, closestY);

    // Hit if within 8 pixels of the line
    return distance <= 8;
  }

  /**
   * Check if point is near an arrow handle (tail or head)
   * @param {Arrow} arrow - Arrow element to test
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {null|'tail'|'head'} Which handle is hit, or null if neither
   */
  static testArrowHandle(arrow, x, y) {
    const handleThreshold = 8; // Within 8px of handle center

    // Check tail (x1, y1)
    const tailDist = Hit.#distance(x, y, arrow.x1, arrow.y1);
    if (tailDist <= handleThreshold) {
      return 'tail';
    }

    // Check head (x2, y2)
    const headDist = Hit.#distance(x, y, arrow.x2, arrow.y2);
    if (headDist <= handleThreshold) {
      return 'head';
    }

    return null;
  }

  /**
   * Test if point is near a handle position
   * @param {number} x - Target, world X coordinate
   * @param {number} y - Target, world Y coordinate
   * @param {number} handleX - Handle, world X coordinate
   * @param {number} handleY - Handle, world Y coordinate
   * @returns {boolean} True if point hits the handle
   */
  static testHandle(x, y, handleX, handleY) {
    const threshold = 8; // Within 8px of handle center
    const dist = Hit.#distance(x, y, handleX, handleY);
    return dist <= threshold;
  }

  /**
   * Check if point is near a box handle (corner)
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {BoundingBox} bbox - Bounding box
   * @returns {'nw'|'ne'|'se'|'sw'|null} Which corner handle is hit, or null if none
   */
  static testBoxHandle(x, y, bbox) {
    const margin = 4;
    // TODO: We may get a `@type {const}` for this in the future.
    const handles = /** @type {readonly ['nw', 'ne', 'se', 'sw']} */ (['nw', 'ne', 'se', 'sw']);
    for (const handle of handles) {
      switch (handle) {
        case 'nw':
          // Top-left (northwest)
          if (Hit.testHandle(x, y, bbox.x + margin, bbox.y + margin)) {
            return handle;
          }
          break;
        case 'ne':
          // Top-right (northeast)
          if (Hit.testHandle(x, y, bbox.x + bbox.width - margin, bbox.y + margin)) {
            return handle;
          }
          break;
        case 'se':
          // Bottom-right (southeast)
          if (Hit.testHandle(x, y, bbox.x + bbox.width - margin, bbox.y + bbox.height - margin)) {
            return handle;
          }
          break;
        case 'sw':
          // Bottom-left (southwest)
          if (Hit.testHandle(x, y, bbox.x + margin, bbox.y + bbox.height - margin)) {
            return handle;
          }
          break;
        default:
          // Exhaustiveness check
          throw new Error(`Unhandled handle: ${handle}`);
      }
    }

    return null;
  }

  /**
   * Check if a bounding box is fully contained within a selection box
   * @param {BoundingBox} bbox - Element bounding box
   * @param {BoundingBox} selectionBox - Selection box in world coordinates
   * @returns {boolean} True if bbox is fully inside the selection box
   */
  static isBoxInsideBox(bbox, selectionBox) {
    // Check if element bbox is fully contained in selection box
    return (
      bbox.x >= selectionBox.x &&
      bbox.y >= selectionBox.y &&
      bbox.x + bbox.width <= selectionBox.x + selectionBox.width &&
      bbox.y + bbox.height <= selectionBox.y + selectionBox.height
    );
  }
}
