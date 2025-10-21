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
  static #undoStack = [];

  /** @type {PersistentState[]} */
  static #redoStack = [];

  /** @type {number} */
  static #maxHistory = 10;
  /**
   * Update persistent or ephemeral state properties
   * @param {StateShape} state - Current state
   * @param {Partial<PersistentState> & Partial<EphemeralState>} update - Properties to update
   * @returns {StateShape} New state object
   */
  static update(state, update) {
    const persistentKeys = ['prefixes', 'domain', 'elements', 'scene'];
    /** @type {Partial<PersistentState>} */
    const persistentUpdate = {};
    /** @type {Partial<EphemeralState>} */
    const ephemeralUpdate = {};

    for (const [key, value] of Object.entries(update)) {
      if (persistentKeys.includes(key)) {
        // @ts-ignore - We know key is valid for PersistentState based on persistentKeys check
        persistentUpdate[key] = value;
      } else {
        // @ts-ignore - We know key is valid for EphemeralState
        ephemeralUpdate[key] = value;
      }
    }

    return {
      persistent: { ...state.persistent, ...persistentUpdate },
      ephemeral: { ...state.ephemeral, ...ephemeralUpdate },
    };
  }

  /**
   * Add a new element to the state
   * @param {StateShape} state - Current state
   * @param {Element} element - Element to add
   * @returns {StateShape} New state object
   */
  static addElement(state, element) {
    return {
      persistent: {
        ...state.persistent,
        elements: {
          ...state.persistent.elements,
          [element.id]: element,
        },
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Update a single element by ID
   * @param {StateShape} state - Current state
   * @param {string} id - Element ID to update
   * @param {Object} update - Properties to update
   * @returns {StateShape} New state object
   */
  static updateElement(state, id, update) {
    const element = state.persistent.elements[id];
    if (!element) {
      return state;
    }
    return {
      persistent: {
        ...state.persistent,
        elements: {
          ...state.persistent.elements,
          [id]: /** @type {Element} */ ({ ...element, ...update }),
        },
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Update multiple elements at once
   * @param {StateShape} state - Current state
   * @param {Elements} update - Map of element ID to element object
   * @returns {StateShape} New state object
   */
  static updateElements(state, update) {
    return {
      persistent: {
        ...state.persistent,
        elements: {
          ...state.persistent.elements,
          ...update,
        },
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Replace all elements
   * @param {StateShape} state - Current state
   * @param {Elements} elements - New elements map
   * @returns {StateShape} New state object
   */
  static setElements(state, elements) {
    return {
      persistent: {
        ...state.persistent,
        elements,
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Delete an element by ID
   * @param {StateShape} state - Current state
   * @param {string} id - Element ID to delete
   * @returns {StateShape} New state object
   */
  static deleteElement(state, id) {
    const { [id]: deleted, ...remainingElements } = state.persistent.elements;
    // Explicitly void deleted to satisfy linter
    void deleted;
    return {
      persistent: {
        ...state.persistent,
        elements: remainingElements,
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Delete multiple elements by ID
   * @param {StateShape} state - Current state
   * @param {string[]} ids - Element IDs to delete
   * @returns {StateShape} New state object
   */
  static deleteElements(state, ids) {
    const idsSet = new Set(ids);
    const elements = /** @type {Elements} */ ({});
    for (const [id, element] of Object.entries(state.persistent.elements)) {
      if (!idsSet.has(id)) {
        elements[id] = element;
      }
    }
    return {
      persistent: {
        ...state.persistent,
        elements,
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Set the current interaction
   * @param {StateShape} state - Current state
   * @param {Interaction} interaction - New interaction
   * @returns {StateShape} New state object
   */
  static setInteraction(state, interaction) {
    return {
      persistent: state.persistent,
      ephemeral: {
        ...state.ephemeral,
        interaction,
      },
    };
  }

  /**
   * Clear the current interaction
   * @param {StateShape} state - Current state
   * @returns {StateShape} New state object
   */
  static clearInteraction(state) {
    return {
      persistent: state.persistent,
      ephemeral: {
        ...state.ephemeral,
        interaction: null,
      },
    };
  }

  /**
   * Update the scene transform
   * @param {StateShape} state - Current state
   * @param {ViewTransform} scene - New scene transform
   * @returns {StateShape} New state object
   */
  static setScene(state, scene) {
    return {
      persistent: {
        ...state.persistent,
        scene,
      },
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Update pointer position and down state
   * @param {StateShape} state - Current state
   * @param {number|null} viewX - View X coordinate (null if not tracking)
   * @param {number|null} viewY - View Y coordinate (null if not tracking)
   * @param {boolean} [down] - Pointer down state (optional, preserves current if omitted)
   * @returns {StateShape} New state object
   */
  static setPointer(state, viewX, viewY, down) {
    return {
      persistent: state.persistent,
      ephemeral: {
        ...state.ephemeral,
        viewX,
        viewY,
        down: down !== undefined ? down : state.ephemeral.down,
      },
    };
  }

  /**
   * Set pointer down state
   * @param {StateShape} state - Current state
   * @param {boolean} down - Pointer down state
   * @returns {StateShape} New state object
   */
  static setPointerDown(state, down) {
    return {
      persistent: state.persistent,
      ephemeral: {
        ...state.ephemeral,
        down,
      },
    };
  }

  // ============================================================================
  // History Management
  // ============================================================================

  /**
   * Save current persistent state to undo stack
   * Clears redo stack when a new action is taken
   * @param {StateShape} state - Current state
   * @returns {void}
   */
  static snapshot(state) {
    // Push current persistent state to undo stack
    State.#undoStack.push(state.persistent);

    // Limit stack size to maxHistory
    if (State.#undoStack.length > State.#maxHistory) {
      State.#undoStack.shift();
    }

    // Clear redo stack on new action
    State.#redoStack = [];
  }

  /**
   * Restore previous state from undo stack
   * @param {StateShape} state - Current state
   * @returns {StateShape|null} New state with restored persistent state, or null if stack is empty
   */
  static undo(state) {
    if (State.#undoStack.length === 0) {
      return null;
    }

    // Push current state to redo stack
    State.#redoStack.push(state.persistent);

    // Pop previous state from undo stack
    // We've already checked length > 0, so pop() will not return undefined
    const previousPersistent = /** @type {PersistentState} */ (State.#undoStack.pop());

    return {
      persistent: previousPersistent,
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Restore next state from redo stack
   * @param {StateShape} state - Current state
   * @returns {StateShape|null} New state with restored persistent state, or null if stack is empty
   */
  static redo(state) {
    if (State.#redoStack.length === 0) {
      return null;
    }

    // Push current state to undo stack
    State.#undoStack.push(state.persistent);

    // Pop next state from redo stack
    // We've already checked length > 0, so pop() will not return undefined
    const nextPersistent = /** @type {PersistentState} */ (State.#redoStack.pop());

    return {
      persistent: nextPersistent,
      ephemeral: state.ephemeral,
    };
  }

  /**
   * Check if undo is available
   * @returns {boolean} True if undo stack is not empty
   */
  static canUndo() {
    return State.#undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean} True if redo stack is not empty
   */
  static canRedo() {
    return State.#redoStack.length > 0;
  }

  /**
   * Clear redo stack (used when new action is taken after undo)
   * @returns {void}
   */
  static clearRedo() {
    State.#redoStack = [];
  }

  /**
   * Clear all history (both undo and redo stacks)
   * @returns {void}
   */
  static clearHistory() {
    State.#undoStack = [];
    State.#redoStack = [];
  }
}
