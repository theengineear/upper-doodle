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
    static "__#private@#distance"(x1: number, y1: number, x2: number, y2: number): number;
    /**
     * Test if a point hits a bounding box
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {BoundingBox} bbox - Bounding box
     * @returns {boolean} True if point hits the bounding box
     */
    static testBox(x: number, y: number, bbox: BoundingBox): boolean;
    /**
     * Test if point is near an arrow line
     * @param {Arrow} arrow - Arrow element to test
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {boolean} True if point is within hit distance of arrow line
     */
    static testArrow(arrow: Arrow, x: number, y: number): boolean;
    /**
     * Check if point is near an arrow handle (tail or head)
     * @param {Arrow} arrow - Arrow element to test
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {null|'tail'|'head'} Which handle is hit, or null if neither
     */
    static testArrowHandle(arrow: Arrow, x: number, y: number): null | "tail" | "head";
    /**
     * Test if point is near a handle position
     * @param {number} x - Target, world X coordinate
     * @param {number} y - Target, world Y coordinate
     * @param {number} handleX - Handle, world X coordinate
     * @param {number} handleY - Handle, world Y coordinate
     * @returns {boolean} True if point hits the handle
     */
    static testHandle(x: number, y: number, handleX: number, handleY: number): boolean;
    /**
     * Check if point is near a box handle (corner)
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {BoundingBox} bbox - Bounding box
     * @returns {'nw'|'ne'|'se'|'sw'|null} Which corner handle is hit, or null if none
     */
    static testBoxHandle(x: number, y: number, bbox: BoundingBox): "nw" | "ne" | "se" | "sw" | null;
    /**
     * Check if a bounding box is fully contained within a selection box
     * @param {BoundingBox} bbox - Element bounding box
     * @param {BoundingBox} selectionBox - Selection box in world coordinates
     * @returns {boolean} True if bbox is fully inside the selection box
     */
    static isBoxInsideBox(bbox: BoundingBox, selectionBox: BoundingBox): boolean;
}
export type Arrow = import("./types.js").Arrow;
export type BoundingBox = import("./types.js").BoundingBox;
