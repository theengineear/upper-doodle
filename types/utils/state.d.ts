/**
 * @fileoverview Immutable state update helpers for UpperDoodle component
 * @typedef {import('./types.js').StateShape} StateShape
 * @typedef {import('./types.js').PersistentState} PersistentState
 * @typedef {import('./types.js').EphemeralState} EphemeralState
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Elements} Elements
 * @typedef {import('./types.js').Interaction} Interaction
 * @typedef {import('./types.js').ViewTransform} ViewTransform
 */
/**
 * Pure helper functions for immutable state updates.
 * Each method takes a state object and returns a new state object.
 * Never mutates the input state.
 */
export class State {
    /** @type {PersistentState[]} */
    static "__#private@#undoStack": PersistentState[];
    /** @type {PersistentState[]} */
    static "__#private@#redoStack": PersistentState[];
    /** @type {number} */
    static "__#private@#maxHistory": number;
    /**
     * Update persistent or ephemeral state properties
     * @param {StateShape} state - Current state
     * @param {Partial<PersistentState> & Partial<EphemeralState>} update - Properties to update
     * @returns {StateShape} New state object
     */
    static update(state: StateShape, update: Partial<PersistentState> & Partial<EphemeralState>): StateShape;
    /**
     * Add a new element to the state
     * @param {StateShape} state - Current state
     * @param {Element} element - Element to add
     * @returns {StateShape} New state object
     */
    static addElement(state: StateShape, element: Element): StateShape;
    /**
     * Update a single element by ID
     * @param {StateShape} state - Current state
     * @param {string} id - Element ID to update
     * @param {Object} update - Properties to update
     * @returns {StateShape} New state object
     */
    static updateElement(state: StateShape, id: string, update: Object): StateShape;
    /**
     * Update multiple elements at once
     * @param {StateShape} state - Current state
     * @param {Elements} update - Map of element ID to element object
     * @returns {StateShape} New state object
     */
    static updateElements(state: StateShape, update: Elements): StateShape;
    /**
     * Replace all elements
     * @param {StateShape} state - Current state
     * @param {Elements} elements - New elements map
     * @returns {StateShape} New state object
     */
    static setElements(state: StateShape, elements: Elements): StateShape;
    /**
     * Delete an element by ID
     * @param {StateShape} state - Current state
     * @param {string} id - Element ID to delete
     * @returns {StateShape} New state object
     */
    static deleteElement(state: StateShape, id: string): StateShape;
    /**
     * Delete multiple elements by ID
     * @param {StateShape} state - Current state
     * @param {string[]} ids - Element IDs to delete
     * @returns {StateShape} New state object
     */
    static deleteElements(state: StateShape, ids: string[]): StateShape;
    /**
     * Set the current interaction
     * @param {StateShape} state - Current state
     * @param {Interaction} interaction - New interaction
     * @returns {StateShape} New state object
     */
    static setInteraction(state: StateShape, interaction: Interaction): StateShape;
    /**
     * Clear the current interaction
     * @param {StateShape} state - Current state
     * @returns {StateShape} New state object
     */
    static clearInteraction(state: StateShape): StateShape;
    /**
     * Update the scene transform
     * @param {StateShape} state - Current state
     * @param {ViewTransform} scene - New scene transform
     * @returns {StateShape} New state object
     */
    static setScene(state: StateShape, scene: ViewTransform): StateShape;
    /**
     * Update pointer position and down state
     * @param {StateShape} state - Current state
     * @param {number|null} viewX - View X coordinate (null if not tracking)
     * @param {number|null} viewY - View Y coordinate (null if not tracking)
     * @param {boolean} [down] - Pointer down state (optional, preserves current if omitted)
     * @returns {StateShape} New state object
     */
    static setPointer(state: StateShape, viewX: number | null, viewY: number | null, down?: boolean): StateShape;
    /**
     * Set pointer down state
     * @param {StateShape} state - Current state
     * @param {boolean} down - Pointer down state
     * @returns {StateShape} New state object
     */
    static setPointerDown(state: StateShape, down: boolean): StateShape;
    /**
     * Save current persistent state to undo stack
     * Clears redo stack when a new action is taken
     * @param {StateShape} state - Current state
     * @returns {void}
     */
    static snapshot(state: StateShape): void;
    /**
     * Restore previous state from undo stack
     * @param {StateShape} state - Current state
     * @returns {StateShape|null} New state with restored persistent state, or null if stack is empty
     */
    static undo(state: StateShape): StateShape | null;
    /**
     * Restore next state from redo stack
     * @param {StateShape} state - Current state
     * @returns {StateShape|null} New state with restored persistent state, or null if stack is empty
     */
    static redo(state: StateShape): StateShape | null;
    /**
     * Check if undo is available
     * @returns {boolean} True if undo stack is not empty
     */
    static canUndo(): boolean;
    /**
     * Check if redo is available
     * @returns {boolean} True if redo stack is not empty
     */
    static canRedo(): boolean;
    /**
     * Clear redo stack (used when new action is taken after undo)
     * @returns {void}
     */
    static clearRedo(): void;
    /**
     * Clear all history (both undo and redo stacks)
     * @returns {void}
     */
    static clearHistory(): void;
}
export type StateShape = import("./types.js").StateShape;
export type PersistentState = import("./types.js").PersistentState;
export type EphemeralState = import("./types.js").EphemeralState;
export type Element = import("./types.js").Element;
export type Elements = import("./types.js").Elements;
export type Interaction = import("./types.js").Interaction;
export type ViewTransform = import("./types.js").ViewTransform;
