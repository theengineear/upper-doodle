/**
 * Coordinate system conversion utilities.
 *
 * This component uses a three-stage coordinate system: client → view → world
 *
 * **1. CLIENT COORDINATES (browser viewport)**
 * - Origin: top-left of browser window
 * - Units: CSS pixels
 * - Source: event.clientX, event.clientY
 * - Example: Mouse click at (800, 600) in browser window
 *
 * **2. VIEW COORDINATES (SVG viewBox)**
 * - Origin: top-left of SVG viewBox (always "0 0 1000 1000")
 * - Units: view units (0-1000 range)
 * - Used for: SVG rendering coordinate space (fixed viewport)
 * - Example: Point at (500, 500) is center of view
 * - Note: preserveAspectRatio="none" stretches viewBox to fill SVG pixel dimensions
 *
 * **3. WORLD COORDINATES (infinite canvas)**
 * - Origin: arbitrary point in infinite drawing space
 * - Units: world units (square proportions maintained via aspect correction)
 * - Used for: Element storage (elements[].x1, y1, x2, y2)
 * - Example: Rectangle from (0, 100) to (200, 300)
 *
 * **THE SCENE TRANSFORM (scene = {x, y, k} + aspect correction {kx, ky})**
 *
 * The scene transform maps WORLD → VIEW for rendering with aspect correction:
 * ```
 * viewX = worldX * scene.k * kx + scene.x
 * viewY = worldY * scene.k * ky + scene.y
 * ```
 *
 * Where:
 * - k = zoom scale (1 = 1:1, 2 = 2x zoomed in, 0.5 = zoomed out)
 * - kx, ky = aspect ratio correction factors (maintain square proportions in world)
 * - x, y = view offsets after scaling
 *
 * **Aspect Correction (kx, ky)**
 * - Ensures 1 world unit = 1 world unit in X and Y (square geometry)
 * - For 16:9 viewport: kx=1, ky=0.5625 (compress Y to maintain squares)
 * - For 9:16 viewport: kx=0.5625, ky=1 (compress X to maintain squares)
 * - Calculated from SVG pixel dimensions, not serialized in state
 *
 * **Key insight: The VIEW IS FIXED, the WORLD MOVES.**
 * - Pan right = move world left (decrease x)
 * - Zoom in = scale world up (increase k)
 * - Elements stay at same world coordinates
 * - Only the scene transform changes to show different parts
 *
 * **INVERSE TRANSFORM (view → world for interactions)**
 * ```
 * worldX = (viewX - scene.x) / (scene.k * kx)
 * worldY = (viewY - scene.y) / (scene.k * ky)
 * ```
 *
 * @example
 * After zoom 2x at center (500, 500) on 16:9 display:
 * - scene = {x: -500, y: -500, k: 2}
 * - kx = 1, ky = 0.5625 (aspect correction)
 * - View (500, 500) still maps to world (500, 500)
 * - Squares in world space appear as squares on screen
 */
export class Coordinates {
  /**
   * Convert client coordinates to view coordinates
   * @param {SVGSVGElement} svgElement - SVG element reference
   * @param {number} clientX - Client X coordinate (from event.clientX)
   * @param {number} clientY - Client Y coordinate (from event.clientY)
   * @returns {{viewX: number, viewY: number}} View coordinates
   */
  static clientToView(svgElement, clientX, clientY) {
    const rect = svgElement.getBoundingClientRect();
    const viewBox = svgElement.viewBox.baseVal;

    const elementX = clientX - rect.left;
    const elementY = clientY - rect.top;

    const viewX = elementX * (viewBox.width / rect.width);
    const viewY = elementY * (viewBox.height / rect.height);

    return { viewX, viewY };
  }

  /**
   * Convert view coordinates to world coordinates
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   * @param {{x: number, y: number, k: number}} scene - Scene transform
   * @param {number} [kx=1] - Aspect ratio correction for X
   * @param {number} [ky=1] - Aspect ratio correction for Y
   * @returns {{x: number, y: number}} World coordinates
   */
  static viewToWorld(viewX, viewY, scene, kx = 1, ky = 1) {
    const x = (viewX - scene.x) / (scene.k * kx);
    const y = (viewY - scene.y) / (scene.k * ky);

    return { x, y };
  }

  /**
   * Convert world coordinates to view coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {{x: number, y: number, k: number}} scene - Scene transform
   * @param {number} [kx=1] - Aspect ratio correction for X
   * @param {number} [ky=1] - Aspect ratio correction for Y
   * @returns {{viewX: number, viewY: number}} View coordinates
   */
  static worldToView(x, y, scene, kx = 1, ky = 1) {
    const viewX = x * scene.k * kx + scene.x;
    const viewY = y * scene.k * ky + scene.y;

    return { viewX, viewY };
  }
}
