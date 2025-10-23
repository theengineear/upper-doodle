/**
 * @fileoverview UpperDoodle Web Component - A minimal drawing component for UPPER ontology modeling with rough.js styling
 */

import styleSheet from './upper-doodle.css.js';
import template from './upper-doodle.html.js';
import { Validate } from './utils/validate.js';
import { Coordinates } from './utils/coordinates.js';
import { Drawing } from './utils/drawing.js';
import { Font } from './utils/font.js';
import { Hit } from './utils/hit.js';
import { State } from './utils/state.js';
import { Turtle } from './utils/turtle.js';
import { Triples } from './utils/triples.js';

const TREE_VERTICAL_GAP = 20;  // Inter-item spacing
const TREE_HORIZONTAL_GAP = 40;  // Inter-column spacing

/**
 * @typedef {import('./utils/types.js').Element} Element
 * @typedef {import('./utils/types.js').Elements} Elements
 * @typedef {import('./utils/types.js').Rectangle} Rectangle
 * @typedef {import('./utils/types.js').Diamond} Diamond
 * @typedef {import('./utils/types.js').Arrow} Arrow
 * @typedef {import('./utils/types.js').StateShape} StateShape
 * @typedef {import('./utils/types.js').Interaction} Interaction
 * @typedef {import('./utils/types.js').AddingInteraction} AddingInteraction
 * @typedef {import('./utils/types.js').AddingArrowInteraction} AddingArrowInteraction
 * @typedef {import('./utils/types.js').PlantingInteraction} PlantingInteraction
 * @typedef {import('./utils/types.js').MoveInteraction} MoveInteraction
 * @typedef {import('./utils/types.js').SelectionInteraction} SelectionInteraction
 * @typedef {import('./utils/types.js').ResizeArrowInteraction} ResizeArrowInteraction
 * @typedef {import('./utils/types.js').ResizeBoxInteraction} ResizeBoxInteraction
 * @typedef {import('./utils/types.js').ViewTransform} ViewTransform
 */

/**
 * @typedef {Object} References
 * @property {HTMLDivElement} container
 * @property {HTMLButtonElement} focus
 * @property {HTMLDivElement} tools
 * @property {HTMLInputElement} domain
 * @property {HTMLButtonElement} diamond
 * @property {HTMLButtonElement} rectangle
 * @property {HTMLButtonElement} arrow
 * @property {HTMLButtonElement} tree
 * @property {SVGSVGElement} svg
 * @property {SVGGElement} world
 * @property {SVGGElement} content
 * @property {SVGGElement} ui
 * @property {HTMLFormElement} form
 * @property {HTMLTextAreaElement} textarea
 */

/**
 * Web component for visual authoring of diagrams with sketch-style rendering.
 *
 * @example
 * ```html
 * <upper-doodle></upper-doodle>
 * ```
 */
export class UpperDoodle extends HTMLElement {
  #initialized = false;
  #invalid = false;
  #rafPending = false;

  // Invalidation flags for selective rendering (start as true for initial render)
  #invalidWorld = true;   // Scene transform (pan/zoom)
  #invalidContent = true; // Elements changed (add/update/remove)
  #invalidUi = true;      // Selection UI, handles, binding indicators
  #invalidCursor = true;  // Cursor style needs updating
  #invalidPreview = true; // Preview element needs updating (adding interaction)
  #invalidEdit = true;    // Edit mode state needs updating
  #invalidDomain = true;  // Domain input value needs updating

  /** @type {References} */
  #references = /** @type {any} */ (null);

  #prevKx = 1;
  #prevKy = 1;
  #kx = 1; // Aspect ratio correction for X (viewport-specific, not serialized)
  #ky = 1; // Aspect ratio correction for Y (viewport-specific, not serialized)

  /** @type {StateShape} */
  #state = {
    persistent: {
      prefixes: {},
      domain: 'domain',
      elements: {},
      scene: { x: 0, y: 0, k: 1 },
      nTriples: '',
    },
    ephemeral: {
      viewX: null,
      viewY: null,
      down: false,
      interaction: null,
    },
  };

  /** @type {StateShape | null} */
  #prevState = null;

  /** @type {Set<string>} Cached set of ignored element IDs (not used in any triple) */
  #ignored = new Set();

  /** @type {Set<string>} Cached set of raw element IDs (text/arrows in turtle-style RDF) */
  #raw = new Set();

  /** @type {Set<string>} Cached set of invalid element IDs (malformed syntax) */
  #invalidSyntax = new Set();

  /** @type {Set<string>} Cached set of diamond IDs that have primary keys */
  #keyed = new Set();

  /** @type {EventListener} */
  #handleWheel = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handleClick = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handleKeyDown = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handleDblClick = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handlePointerMove = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handlePointerDown = /** @type {any} */ (null);

  /** @type {EventListener} */
  #handlePointerUp = /** @type {any} */ (null);

  /** @type {ShadowRoot} */
  #root = /** @type {any} */ (null);

  /**
   * Called when component is connected to DOM
   */
  connectedCallback() {
    if (!this.#initialized) {
      this.#initialized = true;
      this.#upgradeProperties();
      Font.load();
      this.#initializeDOM();
      this.#updateAspectCorrection(); // Initialize aspect correction based on SVG size
      this.#defineEventHandlers();
      this.setAttribute('tabindex', '0');
      this.render();
    }
    this.#setupEventHandlers();
  }

  /**
   * Called when component is disconnected from DOM
   */
  disconnectedCallback() {
    this.#teardownEventHandlers();
  }

  /**
   * Zoom with two touch points (pinch gesture)
   * @param {number} viewX1 - First touch point X coordinate
   * @param {number} viewY1 - First touch point Y coordinate
   * @param {number} viewX2 - Second touch point X coordinate
   * @param {number} viewY2 - Second touch point Y coordinate
   */
  _zoom(viewX1, viewY1, viewX2, viewY2) {
    Validate.coordinate(viewX1, 'viewX1');
    Validate.coordinate(viewY1, 'viewY1');
    Validate.coordinate(viewX2, 'viewX2');
    Validate.coordinate(viewY2, 'viewY2');

    const interaction = this.#state.ephemeral.interaction;

    // First call - initialize zoom interaction
    if (!interaction || interaction.type !== 'zoom') {
      const startDistance = Math.sqrt(
        (viewX2 - viewX1) ** 2 + (viewY2 - viewY1) ** 2
      );

      this.#state = State.setInteraction(this.#state, {
        type: 'zoom',
        startViewX1: viewX1,
        startViewY1: viewY1,
        startViewX2: viewX2,
        startViewY2: viewY2,
        startDistance,
        startScene: { ...this.#state.persistent.scene },
      });

      this.#invalidateUi();
      return;
    }

    // Subsequent calls - compute scale from distance ratio
    const currentDistance = Math.sqrt(
      (viewX2 - viewX1) ** 2 + (viewY2 - viewY1) ** 2
    );

    const scale = currentDistance / interaction.startDistance;

    // Compute zoom center from initial touch points (stays fixed)
    const centerX = (interaction.startViewX1 + interaction.startViewX2) / 2;
    const centerY = (interaction.startViewY1 + interaction.startViewY2) / 2;

    // Apply zoom from original scene state
    const startScene = interaction.startScene;
    const k = startScene.k * scale;

    // Convert center point to world coordinates using start scene
    const worldX = (centerX - startScene.x) / startScene.k;
    const worldY = (centerY - startScene.y) / startScene.k;

    // Compute new scene position to keep world point at center
    const x = centerX - worldX * k;
    const y = centerY - worldY * k;

    this.#state = State.setScene(this.#state, { x, y, k });

    this.#invalidateWorld();
  }

  /**
   * Pan with two touch points
   * @param {number} viewX1 - First touch point X coordinate
   * @param {number} viewY1 - First touch point Y coordinate
   * @param {number} viewX2 - Second touch point X coordinate
   * @param {number} viewY2 - Second touch point Y coordinate
   */
  _pan(viewX1, viewY1, viewX2, viewY2) {
    Validate.coordinate(viewX1, 'viewX1');
    Validate.coordinate(viewY1, 'viewY1');
    Validate.coordinate(viewX2, 'viewX2');
    Validate.coordinate(viewY2, 'viewY2');

    const interaction = this.#state.ephemeral.interaction;

    // First call - initialize pan interaction
    if (!interaction || interaction.type !== 'pan') {
      const startMidpointX = (viewX1 + viewX2) / 2;
      const startMidpointY = (viewY1 + viewY2) / 2;

      this.#state = State.setInteraction(this.#state, {
        type: 'pan',
        startViewX1: viewX1,
        startViewY1: viewY1,
        startViewX2: viewX2,
        startViewY2: viewY2,
        startMidpointX,
        startMidpointY,
        startScene: { ...this.#state.persistent.scene },
      });

      this.#invalidateUi();
      return;
    }

    // Subsequent calls - compute delta from midpoint movement
    const currentMidpointX = (viewX1 + viewX2) / 2;
    const currentMidpointY = (viewY1 + viewY2) / 2;

    const deltaX = currentMidpointX - interaction.startMidpointX;
    const deltaY = currentMidpointY - interaction.startMidpointY;

    // Apply pan from original scene state
    const startScene = interaction.startScene;
    const x = startScene.x + deltaX;
    const y = startScene.y + deltaY;
    const k = startScene.k;

    this.#state = State.setScene(this.#state, { x, y, k });

    this.#invalidateWorld();
  }

  /**
   * Create a new element
   * @param {string} type - Element type (rectangle, diamond, arrow, text)
   * @returns {string} UUID of the element that will be created
   */
  _create(type) {
    Validate.elementType(type);

    const previewId = crypto.randomUUID();

    switch (type) {
      case 'arrow':
        // If already in adding-arrow mode, cancel it first (user clicked arrow tool again)
        if (this.#state.ephemeral.interaction?.type === 'adding-arrow') {
          this._cancel();
        }

        this.#state = State.setInteraction(this.#state, {
          type: 'adding-arrow',
          arrowId: previewId,
          step: 'placing-tail',
          x1: null,
          y1: null,
          source: null,
          target: null,
        });

        this.#invalidateCursor();
        this.#invalidatePreview();
        break;
      case 'text':
        this.#state = State.setInteraction(this.#state, {
          type: 'adding',
          element: {
            id: previewId,
            type: 'text',
            x: 0,
            y: 0,
            text: 'text',
          },
        });
        break;
      case 'rectangle':
      case 'diamond':
        this.#state = State.setInteraction(this.#state, {
          type: 'adding',
          element: {
            id: previewId,
            type,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            text: '',
          },
        });
        break;
      case 'tree':
        throw new Error('Trees cannot be created via _create(). Use planting interaction instead.');
      default:
        Validate.unreachable(type);
    }

    this.#invalidatePreview();
    return previewId;
  }

  /**
   * Enter planting mode (click on a diamond to make it a tree root)
   */
  _plant() {
    this.#state = State.setInteraction(this.#state, {
      type: 'planting',
    });

    this.#invalidateCursor();
  }

  /**
   * Pointer down at view coordinates
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  _down(viewX, viewY) {
    Validate.coordinate(viewX, 'viewX');
    Validate.coordinate(viewY, 'viewY');

    // Finish any pending edit before starting a new interaction
    this._finish();

    // Convert view coordinates to world coordinates
    const { x, y } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

    // Check if we're in adding interaction - finalize the element
    const currentInteraction = this.#state.ephemeral.interaction;
    if (currentInteraction && currentInteraction.type === 'adding') {
      this.#finalizeAddingInteraction(currentInteraction, x, y, viewX, viewY);
      return;
    }

    // Check if we're in planting interaction - plant a tree on the clicked diamond
    if (currentInteraction && currentInteraction.type === 'planting') {
      this.#finalizePlantingInteraction(viewX, viewY);
      return;
    }

    // Check if we're in adding-arrow interaction - multi-step arrow placement
    if (currentInteraction && currentInteraction.type === 'adding-arrow') {
      this.#handleAddingArrowClick(currentInteraction, x, y);
      return;
    }

    // Find what element/feature was hit (with stable selection support)
    const hit = this.#findHitWithStableSelection(viewX, viewY, currentInteraction);

    // Create interaction based on what was hit
    if (hit) {
      this.#startInteractionFromHit(hit, viewX, viewY, currentInteraction);
    } else {
      this.#startSelectionBoxInteraction(viewX, viewY);
    }

    this.#invalidateUi();
  }

  /**
   * Finalize adding interaction - position and place the preview element(s)
   * @param {AddingInteraction} interaction
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  #finalizeAddingInteraction(interaction, x, y, viewX, viewY) {
    // Handle multi-element group
    if (interaction.elements) {
      // Snapshot state BEFORE adding elements
      State.snapshot(this.#state);

      const newElementIds = [];
      let nextState = this.#state;

      for (const element of interaction.elements) {
        newElementIds.push(element.id);
        nextState = State.addElement(nextState, element);
      }

      // Select all newly added elements
      this.#state = State.update(nextState, {
        down: true,
        viewX,
        viewY,
        interaction: {
          type: 'selection',
          elementIds: newElementIds,
          startViewX: viewX,
          startViewY: viewY,
        },
      });

      this.#invalidateContent();
      this.#invalidateUi();
      this.#invalidatePreview();
      return;
    }

    // Handle single element
    const finalElement = this.#positionElementForPlacement(interaction.element, x, y);

    // Snapshot state BEFORE adding element (so undo can restore to this point)
    State.snapshot(this.#state);

    // Add element and set new state
    const nextState = State.addElement(this.#state, finalElement);
    this.#state = State.update(nextState, {
      down: true,
      viewX,
      viewY,
      interaction: {
        type: 'selection',
        elementIds: [finalElement.id],
        startViewX: viewX,
        startViewY: viewY,
      },
    });

    this.#invalidateContent();
    this.#invalidateUi();
    this.#invalidatePreview();

    // Automatically enter edit mode for text, rectangle, and diamond elements
    if (finalElement.type !== 'arrow') {
      this._edit();
    }
  }

  /**
   * Finalize planting interaction - create a tree with the clicked diamond as root
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  #finalizePlantingInteraction(viewX, viewY) {
    // Hit test to find what was clicked
    const hit = this._hit(viewX, viewY);

    // If nothing was hit or it's not an element body, exit planting mode without doing anything
    if (!hit || hit.feature !== 'element') {
      this.#state = State.clearInteraction(this.#state);
      this.#invalidateCursor();
      return;
    }

    const clickedElement = this.#state.persistent.elements[hit.id];
    if (!clickedElement || clickedElement.type !== 'diamond') {
      this.#state = State.clearInteraction(this.#state);
      this.#invalidateCursor();
      return;
    }

    // Check if the diamond is already part of a tree
    let existingTree = null;
    for (const element of Object.values(this.#state.persistent.elements)) {
      if (element.type === 'tree') {
        if (element.root === hit.id || element.items.some(item => item.element === hit.id)) {
          existingTree = element;
          break;
        }
      }
    }
    if (existingTree) {
      // Diamond is already in a tree, just exit planting mode
      this.#state = State.clearInteraction(this.#state);
      this.#invalidateCursor();
      return;
    }

    // Create a new tree with this diamond as the root
    const treeId = crypto.randomUUID();
    /** @type {import('./utils/types.js').Tree} */
    const treeElement = {
      id: treeId,
      type: 'tree',
      root: hit.id,
      items: [],
    };

    // Snapshot state BEFORE adding tree element
    State.snapshot(this.#state);

    // Add tree element and apply tree layouts
    let nextState = State.addElement(this.#state, treeElement);
    const elementsWithTreeLayouts = this.#applyTreeLayouts(nextState.persistent.elements);
    nextState = State.update(nextState, {
      elements: elementsWithTreeLayouts,
    });

    // Clear planting interaction
    this.#state = State.clearInteraction(nextState);

    this.#invalidateContent();
    this.#invalidateCursor();
  }

  /**
   * Handle click during adding-arrow interaction (multi-step arrow placement)
   * @param {AddingArrowInteraction} interaction
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   */
  #handleAddingArrowClick(interaction, x, y) {
    if (interaction.step === 'placing-tail') {
      // Step 1: User clicked to place tail
      // Detect source binding at click position
      const elements = this.#state.persistent.elements;
      const sourceBinding = this.#findBindingTarget(elements, interaction.arrowId, x, y);

      // Transition to step 2 (placing-head)
      this.#state = State.setInteraction(this.#state, {
        ...interaction,
        step: 'placing-head',
        x1: x,
        y1: y,
        source: sourceBinding,
        target: null,
      });

      this.#invalidatePreview();
      this.#invalidateUi();
    } else {
      // Step 2: User clicked to place head
      // Type guard: x1 and y1 must be set in placing-head step
      if (interaction.x1 === null || interaction.y1 === null) {
        throw new Error('Unexpected: x1/y1 should be set in placing-head step');
      }

      // Validate minimum distance (30px)
      const distance = Math.sqrt((x - interaction.x1) ** 2 + (y - interaction.y1) ** 2);
      const MIN_DISTANCE = 30;

      if (distance < MIN_DISTANCE) {
        // Distance too short, stay in placing-head step
        return;
      }

      // Detect target binding at click position
      const elements = this.#state.persistent.elements;
      const targetBinding = this.#findBindingTarget(elements, interaction.arrowId, x, y);

      // Update interaction with final target binding
      const updatedInteraction = {
        ...interaction,
        target: targetBinding,
      };

      // Finalize arrow creation
      this.#finalizeAddingArrow(updatedInteraction, x, y);
    }
  }

  /**
   * Finalize adding-arrow interaction - create arrow and open text editor
   * @param {AddingArrowInteraction} interaction
   * @param {number} x2 - Head X coordinate
   * @param {number} y2 - Head Y coordinate
   */
  #finalizeAddingArrow(interaction, x2, y2) {
    // Type guard: x1 and y1 must be set before finalization
    if (interaction.x1 === null || interaction.y1 === null) {
      throw new Error('Cannot finalize arrow: x1/y1 not set');
    }

    // Create arrow element
    /** @type {Arrow} */
    const arrow = {
      id: interaction.arrowId,
      type: 'arrow',
      x1: interaction.x1,
      y1: interaction.y1,
      x2,
      y2,
      text: '',
      source: interaction.source,
      target: interaction.target,
    };

    // Snapshot state BEFORE adding arrow
    State.snapshot(this.#state);

    // Add arrow and select it
    let nextState = State.addElement(this.#state, arrow);
    nextState = State.setInteraction(nextState, {
      type: 'selection',
      elementIds: [arrow.id],
      startViewX: 0, // Not used for programmatic selection
      startViewY: 0, // Not used for programmatic selection
    });

    this.#state = nextState;

    this.#invalidateContent();
    this.#invalidatePreview();
    this.#invalidateCursor();

    // Call _edit() to position textarea and enter edit mode
    this._edit();
  }

  /**
   * Center an arrow element at the specified world coordinates
   * @param {Arrow} arrow - Arrow element to center
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Arrow} Arrow centered at the specified coordinates
   */
  #centerArrowAt(arrow, x, y) {
    const dx = arrow.x2 - arrow.x1;
    const dy = arrow.y2 - arrow.y1;
    return {
      ...arrow,
      x1: x - dx / 2,
      y1: y - dy / 2,
      x2: x + dx / 2,
      y2: y + dy / 2,
    };
  }

  /**
   * Center a shape element at the specified world coordinates
   * @param {Rectangle | Diamond} shape - Shape element to center
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Rectangle | Diamond} Shape centered at the specified coordinates
   */
  #centerShapeAt(shape, x, y) {
    return {
      ...shape,
      x: x - shape.width / 2,
      y: y - shape.height / 2,
    };
  }

  /**
   * Position an element at the specified world coordinates
   * @param {Element} element - Element to position
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Element} Positioned element
   */
  #positionElementForPlacement(element, x, y) {
    if (element.type === 'arrow') {
      return this.#centerArrowAt(element, x, y);
    } else if (element.type === 'text') {
      // For text, position at click point
      return {
        ...element,
        x,
        y,
      };
    } else if (element.type === 'tree') {
      throw new Error('Trees cannot be positioned via #positionElementForPlacement');
    } else {
      // For shapes (rectangle, diamond), center on pointer
      return this.#centerShapeAt(element, x, y);
    }
  }

  /**
   * Find hit with stable selection support
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   * @param {Interaction | null} currentInteraction - Current interaction
   * @returns {({id: string, feature: 'element'|'handle-head'|'handle-tail'|'handle-ne'|'handle-se'|'handle-sw'|'handle-nw'|'branch'})|null} Hit result or null
   */
  #findHitWithStableSelection(viewX, viewY, currentInteraction) {
    // Check if we're clicking on any of the already-selected elements (stable selection)
    // This provides stable selection - clicking on a selected element keeps the selection
    // even if there are other elements at the same position
    let hit = null;
    if (
      currentInteraction &&
      currentInteraction.type === 'selection' &&
      currentInteraction.elementIds.length > 0
    ) {
      // Check if we hit any of the currently selected elements
      const testHit = this._hit(viewX, viewY);
      if (testHit && currentInteraction.elementIds.includes(testHit.id)) {
        hit = testHit;
      }
    }

    // If we didn't hit a selected element, find any element at coordinates
    if (!hit) {
      hit = this._hit(viewX, viewY);
    }

    return hit;
  }

  /**
   * Start an interaction based on hit result
   * @param {{ id: string, feature: 'element'|'handle-head'|'handle-tail'|'handle-ne'|'handle-se'|'handle-sw'|'handle-nw'|'branch' }} hit - Hit result
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   * @param {Interaction | null} currentInteraction - Current interaction
   */
  #startInteractionFromHit(hit, viewX, viewY, currentInteraction) {
    const hitElement = this.#state.persistent.elements[hit.id];
    if (!hitElement) {
      // Element not found (shouldn't happen, but handle gracefully)
      this.#state = State.setPointerDown(this.#state, true);
      return;
    }

    if (hit.feature === 'branch') {
      this.#handleAddChildButtonClick(hit.id, viewX, viewY);
    } else if (hit.feature === 'handle-tail' || hit.feature === 'handle-head') {
      this.#startResizeArrowInteraction(hitElement, hit.feature, viewX, viewY);
    } else if (
      hit.feature === 'handle-nw' ||
      hit.feature === 'handle-ne' ||
      hit.feature === 'handle-se' ||
      hit.feature === 'handle-sw'
    ) {
      this.#startResizeBoxInteraction(hitElement, hit.feature, viewX, viewY);
    } else {
      this.#startMoveInteraction(hitElement, viewX, viewY, currentInteraction);
    }
  }

  /**
   * Start resize-arrow interaction
   * @param {Element} hitElement - Element being resized
   * @param {'handle-tail' | 'handle-head'} feature - Which handle was hit
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  #startResizeArrowInteraction(hitElement, feature, viewX, viewY) {
    // Type guard: handle-tail and handle-head features only exist on arrows
    if (hitElement.type !== 'arrow') {
      throw new Error('Unexpected: handle-tail/handle-head on non-arrow element');
    }

    this.#state = State.update(this.#state, {
      down: true,
      interaction: {
        type: 'resize-arrow',
        elementId: hitElement.id,
        handle: feature === 'handle-tail' ? 'tail' : 'head',
        startViewX: viewX,
        startViewY: viewY,
        startX1: hitElement.x1,
        startY1: hitElement.y1,
        startX2: hitElement.x2,
        startY2: hitElement.y2,
      },
    });
  }

  /**
   * Start resize-box interaction
   * @param {Element} hitElement - Element being resized
   * @param {'handle-nw' | 'handle-ne' | 'handle-se' | 'handle-sw'} feature - Which handle was hit
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  #startResizeBoxInteraction(hitElement, feature, viewX, viewY) {
    // Type guard: box handles only exist on shape elements (not arrows or text)
    if (hitElement.type === 'arrow') {
      throw new Error('Unexpected: handle-nw/ne/se/sw on arrow element');
    }

    // Text elements cannot be resized - they auto-size to content
    if (hitElement.type === 'text') {
      return;
    }

    // Get initial bounding box for resize operation
    const bbox = Drawing.getBoundingBox(this.#references.svg, hitElement);

    this.#state = State.update(this.#state, {
      down: true,
      interaction: {
        type: 'resize-box',
        elementId: hitElement.id,
        handle: feature === 'handle-ne' ? 'ne'
              : feature === 'handle-nw' ? 'nw'
              : feature === 'handle-se' ? 'se'
              :                           'sw',
        startViewX: viewX,
        startViewY: viewY,
        startX: bbox.x,
        startY: bbox.y,
        startWidth: bbox.width,
        startHeight: bbox.height,
      },
    });
  }

  /**
   * Start move interaction
   * @param {Element} hitElement - Element being moved
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   * @param {Interaction | null} currentInteraction - Current interaction
   */
  #startMoveInteraction(hitElement, viewX, viewY, currentInteraction) {
    // If we have a current selection that includes this element, move all selected elements
    let elementIdsToMove = [hitElement.id];
    if (
      currentInteraction &&
      currentInteraction.type === 'selection' &&
      currentInteraction.elementIds.includes(hitElement.id)
    ) {
      elementIdsToMove = currentInteraction.elementIds;
    }

    const startPositions = this.#buildStartPositions(elementIdsToMove);

    this.#state = State.update(this.#state, {
      down: true,
      interaction: {
        type: 'move',
        elementIds: elementIdsToMove,
        startViewX: viewX,
        startViewY: viewY,
        startPositions,
      },
    });
  }

  /**
   * Build start positions map for move interaction (including bound arrows)
   * @param {string[]} elementIds - IDs of elements to move
   * @returns {MoveInteraction['startPositions']} Start positions map
   */
  #buildStartPositions(elementIds) {
    const startPositions = /** @type {MoveInteraction['startPositions']} */ ({});

    // Store start positions for moved elements
    for (const elementId of elementIds) {
      const element = this.#state.persistent.elements[elementId];
      if (!element) {continue;}

      if (element.type === 'arrow') {
        startPositions[elementId] = {
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2,
        };
      } else if (element.type === 'tree') {
        // Trees don't have coordinates - skip for now
        // TODO: Implement tree movement constraints
        continue;
      } else {
        startPositions[elementId] = {
          x: element.x,
          y: element.y,
        };
      }
    }

    // Also store start positions for arrows bound to moved shapes
    for (const elementId of elementIds) {
      const movedElement = this.#state.persistent.elements[elementId];
      if (!movedElement || movedElement.type === 'arrow') {
        continue;
      }

      // Find arrows bound to this shape
      for (const el of Object.values(this.#state.persistent.elements)) {
        if (el.type !== 'arrow') {
          continue;
        }

        const arrow = /** @type {Arrow} */ (el);
        // Only store if not already stored (i.e., arrow itself is not being moved)
        if (!startPositions[arrow.id] && (arrow.source === movedElement.id || arrow.target === movedElement.id)) {
          startPositions[arrow.id] = {
            x1: arrow.x1,
            y1: arrow.y1,
            x2: arrow.x2,
            y2: arrow.y2,
          };
        }
      }
    }

    return startPositions;
  }

  /**
   * Start selection box interaction (empty selection)
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  #startSelectionBoxInteraction(viewX, viewY) {
    this.#state = State.update(this.#state, {
      down: true,
      interaction: {
        type: 'selection',
        elementIds: [],
        startViewX: viewX,
        startViewY: viewY,
      },
    });
  }

  /**
   * Move pointer to view coordinates
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   */
  _move(viewX, viewY) {
    Validate.coordinate(viewX, 'viewX');
    Validate.coordinate(viewY, 'viewY');

    const interaction = this.#state.ephemeral.interaction;
    if (!interaction) {
      return;
    }

    // Update state with new view coordinates
    this.#state = State.setPointer(this.#state, viewX, viewY);

    // Invalidate cursor when pointer position changes
    this.#invalidateCursor();

    // Handle adding interaction (preview follows pointer)
    if (interaction.type === 'adding') {
      this.#handleAddingMove(interaction);
      this.#invalidatePreview();
      return;
    }

    // Handle adding-arrow interaction (multi-step arrow creation)
    if (interaction.type === 'adding-arrow') {
      this.#handleAddingArrowMove(interaction);
      this.#invalidatePreview();
      this.#invalidateUi(); // For binding indicators
      return;
    }

    // For interactions that need deltas, compute from start position
    if (!('startViewX' in interaction) || !('startViewY' in interaction)) {
      return;
    }

    const totalViewDx = viewX - interaction.startViewX;
    const totalViewDy = viewY - interaction.startViewY;

    // Convert view delta to world delta
    const { k } = this.#state.persistent.scene;
    const dx = totalViewDx / (k * this.#kx);
    const dy = totalViewDy / (k * this.#ky);

    // Dispatch to appropriate handler based on interaction type
    if (interaction.type === 'move') {
      this.#handleMoveInteraction(interaction, dx, dy);
    } else if (interaction.type === 'resize-arrow') {
      this.#handleResizeArrowInteraction(interaction, dx, dy);
    } else if (interaction.type === 'resize-box') {
      this.#handleResizeBoxInteraction(interaction, dx, dy);
    } else if (interaction.type === 'selection' && this.#state.ephemeral.down) {
      this.#handleSelectionBoxInteraction(interaction);
    }

    this.#invalidateUi();
  }

  /**
   * Handle adding interaction - update preview element(s) to follow pointer
   * @param {AddingInteraction} interaction
   */
  #handleAddingMove(interaction) {
    if (this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
      return;
    }

    // Convert view coordinates to world coordinates
    const { x, y } = Coordinates.viewToWorld(
      this.#state.ephemeral.viewX,
      this.#state.ephemeral.viewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );

    // Handle multi-element group
    if (interaction.elements && interaction.groupCenter) {
      const dx = x - interaction.groupCenter.x;
      const dy = y - interaction.groupCenter.y;

      const updatedElements = interaction.elements.map(element => {
        if (element.type === 'arrow') {
          return {
            ...element,
            x1: element.x1 + dx,
            y1: element.y1 + dy,
            x2: element.x2 + dx,
            y2: element.y2 + dy,
          };
        } else if (element.type === 'tree') {
          // Trees don't have coordinates - return unchanged
          // TODO: Implement tree movement constraints
          return element;
        } else {
          return {
            ...element,
            x: element.x + dx,
            y: element.y + dy,
          };
        }
      });

      this.#state = State.setInteraction(this.#state, {
        ...interaction,
        elements: updatedElements,
        element: updatedElements[0],
        groupCenter: { x, y },
      });
      return;
    }

    // Handle single element
    let updatedElement;
    if (interaction.element.type === 'arrow') {
      updatedElement = this.#centerArrowAt(interaction.element, x, y);
    } else if (interaction.element.type === 'text') {
      // For text, position at pointer
      updatedElement = {
        ...interaction.element,
        x,
        y,
      };
    } else if (interaction.element.type === 'tree') {
      // Trees don't move during adding - return unchanged
      updatedElement = interaction.element;
    } else {
      // For shapes (rectangle, diamond), center on pointer
      updatedElement = this.#centerShapeAt(interaction.element, x, y);
    }

    this.#state = State.setInteraction(this.#state, {
      ...interaction,
      element: updatedElement,
    });
  }

  /**
   * Handle adding-arrow interaction - update preview and detect binding targets
   * @param {AddingArrowInteraction} interaction
   */
  #handleAddingArrowMove(interaction) {
    if (this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
      return;
    }

    // Convert view coordinates to world coordinates
    const { x, y } = Coordinates.viewToWorld(
      this.#state.ephemeral.viewX,
      this.#state.ephemeral.viewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );

    if (interaction.step === 'placing-tail') {
      // Step 1: Arrow tail follows cursor, detect potential source binding
      const elements = this.#state.persistent.elements;
      const bindingTarget = this.#findBindingTarget(elements, interaction.arrowId, x, y);

      this.#state = State.setInteraction(this.#state, {
        ...interaction,
        source: bindingTarget,
        // x1/y1 stay null until user clicks to place tail
      });
    } else {
      // Step 2: Tail is fixed, head follows cursor
      // Detect binding target at cursor position
      const elements = this.#state.persistent.elements;
      const bindingTarget = this.#findBindingTarget(elements, interaction.arrowId, x, y);

      this.#state = State.setInteraction(this.#state, {
        ...interaction,
        target: bindingTarget,
      });
    }
  }

  /**
   * Handle move interaction - update positions of all moving elements
   * @param {MoveInteraction} interaction
   * @param {number} dx - World delta X
   * @param {number} dy - World delta Y
   */
  #handleMoveInteraction(interaction, dx, dy) {
    // Note: Complex logic with multiple element updates, using mutable copy
    const elements = { ...this.#state.persistent.elements };

    // Update positions of moved elements
    for (const elementId of interaction.elementIds) {
      const element = elements[elementId];
      if (!element) {
        continue;
      }

      const startPos = interaction.startPositions[elementId];
      if (!startPos) {
        continue;
      }

      // Update position based on element type
      if (element.type === 'arrow') {
        // Type guard: startPos for arrows has x1, y1, x2, y2
        if (
          startPos.x1 === undefined ||
          startPos.y1 === undefined ||
          startPos.x2 === undefined ||
          startPos.y2 === undefined
        ) {
          continue;
        }
        elements[elementId] = {
          ...element,
          x1: startPos.x1 + dx,
          y1: startPos.y1 + dy,
          x2: startPos.x2 + dx,
          y2: startPos.y2 + dy,
        };
      } else if (element.type === 'tree') {
        // Trees don't have coordinates - skip
        continue;
      } else {
        // Type guard: startPos for non-arrows has x, y
        if (startPos.x === undefined || startPos.y === undefined) {
          continue;
        }
        elements[elementId] = {
          ...element,
          x: startPos.x + dx,
          y: startPos.y + dy,
        };
      }
    }

    // Update arrows bound to moved shapes (maintain bindings)
    for (const elementId of interaction.elementIds) {
      const movedElement = elements[elementId];
      if (!movedElement || movedElement.type === 'arrow') {
        continue; // Only process moved shapes, not arrows
      }

      // Find arrows bound to this shape and move their endpoints
      for (const el of Object.values(this.#state.persistent.elements)) {
        if (el.type !== 'arrow') {
          continue;
        }

        // Type guard: el is an Arrow at this point
        const arrow = /** @type {Arrow} */ (el);

        // Check if this arrow is bound to the moved shape
        if (arrow.source !== movedElement.id && arrow.target !== movedElement.id) {
          continue;
        }

        // Get arrow's start position from interaction
        const startPos = interaction.startPositions[arrow.id];
        if (!startPos || startPos.x1 === undefined || startPos.y1 === undefined ||
            startPos.x2 === undefined || startPos.y2 === undefined) {
          continue;
        }

        // Get current arrow state (might have been updated if bound to multiple moved shapes)
        const currentArrow = /** @type {Arrow} */ (elements[arrow.id] || arrow);

        // Update arrow tail if bound to this moved shape
        const newX1 = arrow.source === movedElement.id ? startPos.x1 + dx : currentArrow.x1;
        const newY1 = arrow.source === movedElement.id ? startPos.y1 + dy : currentArrow.y1;

        // Update arrow head if bound to this moved shape
        const newX2 = arrow.target === movedElement.id ? startPos.x2 + dx : currentArrow.x2;
        const newY2 = arrow.target === movedElement.id ? startPos.y2 + dy : currentArrow.y2;

        elements[arrow.id] = {
          ...currentArrow,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
      }
    }

    this.#state = State.update(this.#state, { elements });

    this.#invalidateContent();
  }

  /**
   * Handle resize-arrow interaction - update arrow endpoint and check for binding
   * @param {ResizeArrowInteraction} interaction
   * @param {number} dx - World delta X
   * @param {number} dy - World delta Y
   */
  #handleResizeArrowInteraction(interaction, dx, dy) {
    const element = this.#state.persistent.elements[interaction.elementId];

    // Type guard: resize-arrow only applies to arrows
    if (!element || element.type !== 'arrow') {
      return;
    }

    // Calculate new endpoint position based on which handle is being dragged
    let newX, newY, update;
    if (interaction.handle === 'tail') {
      newX = interaction.startX1 + dx;
      newY = interaction.startY1 + dy;
      update = { x1: newX, y1: newY };
    } else if (interaction.handle === 'head') {
      newX = interaction.startX2 + dx;
      newY = interaction.startY2 + dy;
      update = { x2: newX, y2: newY };
    } else {
      return;
    }

    // Update element and get new state
    const nextState = State.updateElement(this.#state, interaction.elementId, update);

    // Check for binding with nearby elements
    const bindingId = this.#findBindingTarget(nextState.persistent.elements, interaction.elementId, newX, newY);

    // Update interaction with binding
    this.#state = State.update(nextState, {
      interaction: {
        ...interaction,
        bindingId,
      },
    });

    this.#invalidateContent();
  }

  /**
   * Find a binding target for an arrow endpoint
   * @param {Record<string, Element>} elements - Elements map
   * @param {string} arrowId - Arrow element ID to exclude
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {string | null} Element ID to bind to, or null
   */
  #findBindingTarget(elements, arrowId, x, y) {
    for (const el of Object.values(elements)) {
      // Skip the arrow itself and other arrows
      if (el.id === arrowId || el.type === 'arrow') {
        continue;
      }

      // Only bind to diamonds and rectangles (not text or tree)
      if (el.type !== 'diamond' && el.type !== 'rectangle') {
        continue;
      }

      // Check if endpoint is within this element's bounding box
      if (this.#hitTest(el, x, y)) {
        return el.id;
      }
    }
    return null;
  }

  /**
   * Handle resize-box interaction - update box dimensions
   * @param {ResizeBoxInteraction} interaction
   * @param {number} dx - World delta X
   * @param {number} dy - World delta Y
   */
  #handleResizeBoxInteraction(interaction, dx, dy) {
    const element = this.#state.persistent.elements[interaction.elementId];

    // Type guard: resize-box only applies to shape elements (not arrows or text)
    if (!element || element.type === 'arrow' || element.type === 'text') {
      return;
    }

    // Calculate new dimensions based on which handle is being dragged
    const { newX, newY, newWidth, newHeight } = this.#calculateResizedBox(interaction, dx, dy);

    // Update element dimensions
    this.#state = State.updateElement(this.#state, interaction.elementId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });

    this.#invalidateContent();
  }

  /**
   * Calculate new box dimensions for resize operation
   * @param {ResizeBoxInteraction} interaction
   * @param {number} dx - World delta X
   * @param {number} dy - World delta Y
   * @returns {{ newX: number, newY: number, newWidth: number, newHeight: number }}
   */
  #calculateResizedBox(interaction, dx, dy) {
    let newX = interaction.startX;
    let newY = interaction.startY;
    let newWidth = interaction.startWidth;
    let newHeight = interaction.startHeight;

    switch (interaction.handle) {
      case 'nw': // Top-left: x and y change, w and h adjust oppositely
        newX = interaction.startX + dx;
        newY = interaction.startY + dy;
        newWidth = interaction.startWidth - dx;
        newHeight = interaction.startHeight - dy;
        break;
      case 'ne': // Top-right: only y changes, w adjusts with dx, h adjusts oppositely
        newY = interaction.startY + dy;
        newWidth = interaction.startWidth + dx;
        newHeight = interaction.startHeight - dy;
        break;
      case 'se': // Bottom-right: x and y stay same, w and h grow
        newWidth = interaction.startWidth + dx;
        newHeight = interaction.startHeight + dy;
        break;
      case 'sw': // Bottom-left: only x changes, w adjusts oppositely, h grows
        newX = interaction.startX + dx;
        newWidth = interaction.startWidth - dx;
        newHeight = interaction.startHeight + dy;
        break;
    }

    return { newX, newY, newWidth, newHeight };
  }

  /**
   * Handle selection box interaction - find elements inside selection box
   * @param {SelectionInteraction} interaction
   */
  #handleSelectionBoxInteraction(interaction) {
    if (this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
      return;
    }

    // Convert selection box corners from view to world coordinates
    const start = Coordinates.viewToWorld(
      interaction.startViewX,
      interaction.startViewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );
    const current = Coordinates.viewToWorld(
      this.#state.ephemeral.viewX,
      this.#state.ephemeral.viewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );

    // Calculate normalized selection box
    const selectionBox = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };

    // Find all elements fully inside the selection box
    const selectedIds = [];
    for (const element of Object.values(this.#state.persistent.elements)) {
      const bbox = Drawing.getBoundingBox(this.#references.svg, element);
      if (Hit.isBoxInsideBox(bbox, selectionBox)) {
        selectedIds.push(element.id);
      }
    }

    // Update interaction with selected element IDs
    this.#state = State.setInteraction(this.#state, {
      ...interaction,
      elementIds: selectedIds,
    });
  }

  /**
   * Pointer up (end current interaction)
   */
  _up() {
    const interaction = this.#state.ephemeral.interaction;
    let nextInteraction = null;

    // Snapshot BEFORE modifying state for meaningful actions
    if (interaction && (interaction.type === 'move' || interaction.type === 'resize-arrow' || interaction.type === 'resize-box')) {
      State.snapshot(this.#state);
    }

    // Handle different interaction types
    if (interaction && interaction.type === 'move') {
      this.#finalizeMove(interaction);
      nextInteraction = this.#createSelectionFromInteraction(interaction);
    } else if (interaction && interaction.type === 'resize-arrow') {
      this.#finalizeResizeArrow(interaction);
      nextInteraction = this.#createSelectionFromInteraction(interaction);
    } else if (interaction && interaction.type === 'resize-box') {
      this.#finalizeResizeBox(interaction);
      nextInteraction = this.#createSelectionFromInteraction(interaction);
    } else if (interaction && interaction.type === 'edit') {
      nextInteraction = interaction;
    } else if (interaction && interaction.type === 'adding-arrow') {
      // Preserve adding-arrow interaction (multi-step arrow creation)
      nextInteraction = interaction;
    } else if (interaction && interaction.type === 'selection') {
      nextInteraction = interaction.elementIds.length > 0 ? interaction : null;
    }

    this.#state = State.update(this.#state, {
      down: false,
      interaction: nextInteraction,
    });

    this.#invalidateUi();
  }

  /**
   * Finalize move interaction - unbind arrows that no longer hit their targets
   * @param {MoveInteraction} interaction
   */
  #finalizeMove(interaction) {
    // Note: Helper methods mutate elements in place
    let elements = { ...this.#state.persistent.elements };
    let needsUpdate = false;

    // Check arrows bound to moved shapes
    for (const movedElementId of interaction.elementIds) {
      const movedElement = elements[movedElementId];
      if (!movedElement || movedElement.type === 'arrow') {
        continue; // Skip arrows, only process shapes/text
      }

      needsUpdate = this.#unbindArrowsFromMovedShape(elements, movedElementId, movedElement) || needsUpdate;
    }

    // Check moved arrows
    for (const movedElementId of interaction.elementIds) {
      const movedElement = elements[movedElementId];
      if (!movedElement || movedElement.type !== 'arrow') {
        continue; // Only process arrows
      }

      needsUpdate = this.#unbindMovedArrow(elements, movedElementId, movedElement) || needsUpdate;
    }

    // Check if any moved element is in a tree - if so, recalculate tree layouts
    const movedTreeElement = interaction.elementIds.some(id => this.#isInAnyTree(id));
    if (movedTreeElement) {
      if (needsUpdate) {
        // Apply updates first, then recalculate tree layouts
        this.#state = State.update(this.#state, { elements });
      }
      elements = this.#applyTreeLayouts(this.#state.persistent.elements);
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.#state = State.update(this.#state, { elements });
      this.#invalidateContent();
    }
  }

  /**
   * Finalize resize-box interaction - recalculate tree layouts if element is in a tree
   * @param {ResizeBoxInteraction} interaction
   */
  #finalizeResizeBox(interaction) {
    // Check if resized element is part of any tree
    const isInTree = this.#isInAnyTree(interaction.elementId);

    if (isInTree) {
      // Recalculate tree layouts to update positions of tree children
      const elementsWithTreeLayouts = this.#applyTreeLayouts(this.#state.persistent.elements);
      this.#state = State.update(this.#state, { elements: elementsWithTreeLayouts });
      this.#invalidateContent();
    }
  }

  /**
   * Check if element is a tree root
   * @param {string} elementId - Element ID to check
   * @returns {boolean} True if element is a tree root
   */
  /**
   * Check if element is part of any tree (root or child)
   * @param {string} elementId - Element ID to check
   * @returns {boolean} True if element is in any tree
   */
  #isInAnyTree(elementId) {
    for (const element of Object.values(this.#state.persistent.elements)) {
      if (element.type !== 'tree') {
        continue;
      }

      // Check if element is the root or a child
      if (element.root === elementId || element.items.some(item => item.element === elementId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Unbind arrows connected to a moved shape if they no longer intersect
   * @param {Record<string, Element>} elements - Elements map
   * @param {string} shapeId - ID of moved shape
   * @param {Element} shape - The moved shape element
   * @returns {boolean} True if any arrows were unbound
   */
  #unbindArrowsFromMovedShape(elements, shapeId, shape) {
    let needsUpdate = false;

    for (const element of Object.values(elements)) {
      if (element.type !== 'arrow') {
        continue;
      }

      const arrow = element;
      let newSource = arrow.source;
      let newTarget = arrow.target;

      // Check if arrow's source is bound to this moved shape
      if (arrow.source === shapeId && !this.#hitTest(shape, arrow.x1, arrow.y1)) {
        newSource = null;
        needsUpdate = true;
      }

      // Check if arrow's target is bound to this moved shape
      if (arrow.target === shapeId && !this.#hitTest(shape, arrow.x2, arrow.y2)) {
        newTarget = null;
        needsUpdate = true;
      }

      if (newSource !== arrow.source || newTarget !== arrow.target) {
        elements[arrow.id] = {
          ...arrow,
          source: newSource,
          target: newTarget,
        };
      }
    }

    return needsUpdate;
  }

  /**
   * Unbind a moved arrow if its endpoints no longer hit their bound shapes
   * @param {Record<string, Element>} elements - Elements map
   * @param {string} arrowId - ID of moved arrow
   * @param {Arrow} arrow - The moved arrow element
   * @returns {boolean} True if arrow was unbound
   */
  #unbindMovedArrow(elements, arrowId, arrow) {
    let newSource = arrow.source;
    let newTarget = arrow.target;
    let needsUpdate = false;

    // Check if source binding should be maintained
    if (arrow.source) {
      const sourceElement = elements[arrow.source];
      if (sourceElement && !this.#hitTest(sourceElement, arrow.x1, arrow.y1)) {
        newSource = null;
        needsUpdate = true;
      }
    }

    // Check if target binding should be maintained
    if (arrow.target) {
      const targetElement = elements[arrow.target];
      if (targetElement && !this.#hitTest(targetElement, arrow.x2, arrow.y2)) {
        newTarget = null;
        needsUpdate = true;
      }
    }

    if (newSource !== arrow.source || newTarget !== arrow.target) {
      elements[arrowId] = {
        ...arrow,
        source: newSource,
        target: newTarget,
      };
    }

    return needsUpdate;
  }

  /**
   * Finalize resize-arrow interaction - commit or remove arrow binding
   * @param {ResizeArrowInteraction} interaction
   */
  #finalizeResizeArrow(interaction) {
    const element = this.#state.persistent.elements[interaction.elementId];

    // Type guard: resize-arrow only applies to arrows
    if (!element || element.type !== 'arrow') {
      return;
    }

    const arrow = element;

    // Note: Helper methods mutate elements in place
    const elements = { ...this.#state.persistent.elements };

    // Commit binding if one was detected during drag
    if (interaction.bindingId) {
      this.#commitArrowBinding(elements, interaction, arrow);
    } else {
      this.#removeStaleArrowBinding(elements, interaction, arrow);
    }

    this.#state = State.update(this.#state, { elements });

    this.#invalidateContent();
  }

  /**
   * Commit arrow binding to a shape
   * @param {Record<string, Element>} elements - Elements map
   * @param {ResizeArrowInteraction} interaction
   * @param {Arrow} arrow - The arrow element
   */
  #commitArrowBinding(elements, interaction, arrow) {
    if (interaction.handle === 'tail') {
      elements[interaction.elementId] = {
        ...arrow,
        source: interaction.bindingId ?? null,
      };
    } else if (interaction.handle === 'head') {
      elements[interaction.elementId] = {
        ...arrow,
        target: interaction.bindingId ?? null,
      };
    }
  }

  /**
   * Remove arrow binding if endpoint no longer hits the bound shape
   * @param {Record<string, Element>} elements - Elements map
   * @param {ResizeArrowInteraction} interaction
   * @param {Arrow} arrow - The arrow element
   */
  #removeStaleArrowBinding(elements, interaction, arrow) {
    let shouldUnbind = false;

    if (interaction.handle === 'tail' && arrow.source) {
      const sourceShape = elements[arrow.source];
      if (sourceShape && !this.#hitTest(sourceShape, arrow.x1, arrow.y1)) {
        shouldUnbind = true;
      }
    } else if (interaction.handle === 'head' && arrow.target) {
      const targetShape = elements[arrow.target];
      if (targetShape && !this.#hitTest(targetShape, arrow.x2, arrow.y2)) {
        shouldUnbind = true;
      }
    }

    if (shouldUnbind) {
      if (interaction.handle === 'tail') {
        elements[interaction.elementId] = {
          ...arrow,
          source: null,
        };
      } else if (interaction.handle === 'head') {
        elements[interaction.elementId] = {
          ...arrow,
          target: null,
        };
      }
    }
  }

  /**
   * Create a selection interaction from a completed interaction
   * @param {MoveInteraction | ResizeArrowInteraction | ResizeBoxInteraction} interaction
   * @returns {SelectionInteraction}
   */
  #createSelectionFromInteraction(interaction) {
    const elementIds = 'elementIds' in interaction
      ? interaction.elementIds
      : [interaction.elementId];

    return {
      type: 'selection',
      elementIds,
      startViewX: interaction.startViewX,
      startViewY: interaction.startViewY,
    };
  }

  /**
   * Cancel current interaction (e.g., on blur/focus loss)
   * Clears all interaction state without committing changes
   */
  _cancel() {
    this.#state = State.update(this.#state, {
      down: false,
      viewX: null,
      viewY: null,
      interaction: null,
    });

    this.#invalidateUi();
    this.#invalidatePreview();
    this.#invalidateEdit();
    this.#invalidateCursor();
  }

  /**
   * Finish current interaction, committing any pending changes
   * Similar to _cancel but commits unfinished edits before clearing
   */
  _finish() {
    const interaction = this.#state.ephemeral.interaction;

    // If we're in edit mode, commit the current textarea value and exit
    if (interaction && interaction.type === 'edit') {
      // Snapshot BEFORE committing edit
      State.snapshot(this.#state);

      const textareaValue = this.#references.textarea.value;
      this._overwrite(textareaValue);

      // Check if the edited element is a text element with only whitespace
      const element = this.#state.persistent.elements[interaction.elementId];
      if (element && element.type === 'text' && element.text.trim() === '') {
        this.#deleteEmptyTextElement(interaction.elementId);
      } else {
        // Clear interaction state after edit
        this.#state = State.update(this.#state, {
          down: false,
          interaction: null,
        });
      }

      this.#invalidateEdit();
      this.#invalidateUi();
    }
  }

  /**
   * Delete an empty text element and unbind any connected arrows
   * Note: Assumes snapshot was already taken by caller
   * @param {string} elementId - ID of empty text element to delete
   */
  #deleteEmptyTextElement(elementId) {
    // Delete element
    const nextState = State.deleteElement(this.#state, elementId);

    // Unbind any arrows that were connected to this element
    // Note: #unbindArrowsFromDeletedElements mutates elements in place
    const elements = { ...nextState.persistent.elements };
    this.#unbindArrowsFromDeletedElements(elements, [elementId]);

    // Update state with unbound arrows and clear interaction
    this.#state = State.update(nextState, {
      elements,
      down: false,
      interaction: null,
    });

    this.#invalidateContent();
  }

  /**
   * Handle click on add-child button - create a new child element in the tree
   * @param {string} parentId - ID of the parent element
   * @param {number} viewX - View X coordinate (for pointer state)
   * @param {number} viewY - View Y coordinate (for pointer state)
   */
  #handleAddChildButtonClick(parentId, viewX, viewY) {
    // Find the tree containing this parent element
    const tree = this.#findTreeContainingElement(parentId);
    if (!tree) {
      // Element is not in a tree (shouldn't happen, but handle gracefully)
      this.#state = State.setPointerDown(this.#state, true);
      return;
    }

    // Snapshot BEFORE adding the child
    State.snapshot(this.#state);

    // Create a new diamond element
    const childId = crypto.randomUUID();
    const newChild = {
      id: childId,
      type: /** @type {const} */ ('diamond'),
      x: 0, // Position will be set by tree layout
      y: 0,
      width: 150,
      height: 150,
      text: '',
    };

    // Add the child element
    const nextState = State.addElement(this.#state, newChild);

    // Update the tree to include the new child
    const updatedTree = {
      ...tree,
      items: [...tree.items, { parent: parentId, element: childId }],
    };

    // Update elements with the modified tree
    const elements = {
      ...nextState.persistent.elements,
      [tree.id]: updatedTree,
    };

    // Apply tree layouts to reposition all elements
    const elementsWithLayouts = this.#applyTreeLayouts(elements);

    // Update state
    this.#state = State.update(nextState, {
      elements: elementsWithLayouts,
      down: true,
    });

    // Select the newly added element
    this.#state = State.setInteraction(this.#state, {
      type: 'selection',
      elementIds: [childId],
      startViewX: viewX,
      startViewY: viewY,
    });

    this.#invalidateContent();
    this.#invalidateUi();
  }

  /**
   * Test if coordinates hit an add-child button for any tree element
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {({id: string, feature: 'branch'})|null} Hit result or null
   */
  #testAddChildButtonHit(x, y) {
    const elements = this.#state.persistent.elements;

    // Test all elements that are in trees
    for (const elementId of Object.keys(elements)) {
      const element = elements[elementId];

      // Skip non-tree elements and tree elements themselves
      if (element.type === 'tree' || element.type === 'arrow' || element.type === 'text') {
        continue;
      }

      // Check if this element is in any tree
      if (!this.#isInAnyTree(elementId)) {
        continue;
      }

      // Get bounding box
      const bbox = Drawing.getBoundingBox(this.#references.svg, element);

      // Calculate button position (lower right corner inside bounding box)
      const paddingX = 24; // Distance from right edge
      const paddingY = 12; // Distance from bottom edge
      const buttonX = bbox.x + bbox.width - paddingX;
      const buttonY = bbox.y + bbox.height - paddingY;

      // Test if point is within button area (roughly 20x20 px hitbox centered on button)
      const hitboxSize = 10; // Radius in world coordinates
      if (Math.abs(x - buttonX) <= hitboxSize && Math.abs(y - buttonY) <= hitboxSize) {
        return { id: elementId, feature: 'branch' };
      }
    }

    return null;
  }

  /**
   * Find the tree that contains the given element (either as root or as an item)
   * @param {string} elementId - Element ID to search for
   * @returns {import('./utils/types.js').Tree|null} Tree element if found, null otherwise
   */
  #findTreeContainingElement(elementId) {
    const elements = this.#state.persistent.elements;
    for (const element of Object.values(elements)) {
      if (element.type === 'tree') {
        // Check if it's the root
        if (element.root === elementId) {
          return element;
        }
        // Check if it's in items
        if (element.items.some(item => item.element === elementId)) {
          return element;
        }
      }
    }
    return null;
  }

  /**
   * Get all descendant element IDs of a parent in a tree (recursive)
   * @param {import('./utils/types.js').Tree} tree - The tree element
   * @param {string} parentId - The parent element ID
   * @returns {string[]} Array of descendant element IDs
   */
  #getAllDescendantsInTree(tree, parentId) {
    const descendants = [];
    // Find direct children
    const children = tree.items.filter(item => item.parent === parentId).map(item => item.element);

    for (const childId of children) {
      descendants.push(childId);
      // Recursively get descendants of this child
      descendants.push(...this.#getAllDescendantsInTree(tree, childId));
    }

    return descendants;
  }

  /**
   * Get all element IDs in a tree (root + all items)
   * @param {import('./utils/types.js').Tree} tree - The tree element
   * @returns {string[]} Array of all element IDs in the tree
   */
  #getAllElementsInTree(tree) {
    const elementIds = [tree.root];
    elementIds.push(...tree.items.map(item => item.element));
    return elementIds;
  }

  /**
   * Delete currently selected elements
   */
  _delete() {
    const interaction = this.#state.ephemeral.interaction;

    // Only allow deletion if there's a selection
    if (!interaction || interaction.type !== 'selection') {
      return;
    }

    // Snapshot BEFORE deleting
    State.snapshot(this.#state);

    // Get element IDs to delete
    const elementIds = interaction.elementIds;

    // Track all elements to delete (may expand due to tree deletion rules)
    const allElementIdsToDelete = new Set(elementIds);
    // Track trees to update (for non-root deletions)
    /** @type {Map<string, import('./utils/types.js').Tree>} */
    const treesToUpdate = new Map();

    // Process each element to handle tree deletion logic
    for (const elementId of elementIds) {
      const tree = this.#findTreeContainingElement(elementId);

      if (!tree) {
        // Element is not in any tree, will be deleted normally
        continue;
      }

      // Check if this element is the root of the tree
      if (tree.root === elementId) {
        // CASE 1: Deleting the root of a tree
        // Delete all elements in the tree and the tree itself
        const treeElementIds = this.#getAllElementsInTree(tree);
        for (const id of treeElementIds) {
          allElementIdsToDelete.add(id);
        }
        // Mark the tree element itself for deletion
        allElementIdsToDelete.add(tree.id);
      } else {
        // CASE 2: Deleting a non-root element in a tree
        // Delete the element and all its descendants from the tree
        const descendants = this.#getAllDescendantsInTree(tree, elementId);

        // Add element and descendants to deletion list
        allElementIdsToDelete.add(elementId);
        for (const descendantId of descendants) {
          allElementIdsToDelete.add(descendantId);
        }

        // Update the tree to remove these items
        // (we'll apply all tree updates after processing all elements)
        const elementsToRemove = new Set([elementId, ...descendants]);
        const updatedTree = {
          ...tree,
          items: tree.items.filter(item => !elementsToRemove.has(item.element)),
        };
        treesToUpdate.set(tree.id, updatedTree);
      }
    }

    // Delete elements
    let nextState = State.deleteElements(this.#state, Array.from(allElementIdsToDelete));

    // Update trees that had items removed (but weren't deleted entirely)
    let needsTreeLayoutRecalc = false;
    if (treesToUpdate.size > 0) {
      const updatedElements = { ...nextState.persistent.elements };
      for (const [treeId, updatedTree] of treesToUpdate) {
        if (updatedElements[treeId]) {
          updatedElements[treeId] = updatedTree;
        }
      }
      nextState = State.setElements(nextState, updatedElements);
      needsTreeLayoutRecalc = true;
    }

    // Unbind any arrows that were connected to deleted elements
    // Note: #unbindArrowsFromDeletedElements mutates elements in place
    let elements = { ...nextState.persistent.elements };
    this.#unbindArrowsFromDeletedElements(elements, Array.from(allElementIdsToDelete));

    // Recalculate tree layouts if we modified any trees
    if (needsTreeLayoutRecalc) {
      elements = this.#applyTreeLayouts(elements);
    }

    // Update state with unbound arrows and clear interaction
    this.#state = State.update(nextState, {
      elements,
      interaction: null,
    });

    this.#invalidateContent();
    this.#invalidateUi();
  }

  /**
   * Copy currently selected elements to clipboard as JSON
   * @returns {Promise<void>}
   */
  async _copy() {
    const interaction = this.#state.ephemeral.interaction;

    // Only allow copy if there's a selection
    if (!interaction || interaction.type !== 'selection' || interaction.elementIds.length === 0) {
      return;
    }

    // Get selected elements
    const elements = interaction.elementIds.map(id => this.#state.persistent.elements[id]).filter(Boolean);

    if (elements.length === 0) {
      return;
    }

    // Calculate bounding box center for relative positioning
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      if (element.type === 'arrow') {
        minX = Math.min(minX, element.x1, element.x2);
        minY = Math.min(minY, element.y1, element.y2);
        maxX = Math.max(maxX, element.x1, element.x2);
        maxY = Math.max(maxY, element.y1, element.y2);
      } else if (element.type === 'tree') {
        // Trees don't have coordinates - skip
        continue;
      } else {
        // Shapes and text have x, y, width, height (or just x, y for text)
        const x = element.x;
        const y = element.y;
        const width = element.type === 'text' ? 0 : (element.width || 0);
        const height = element.type === 'text' ? 0 : (element.height || 0);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      }
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create clipboard data with elements and center point
    const clipboardData = {
      type: 'upper-doodle-elements',
      version: 1,
      centerX,
      centerY,
      elements,
    };

    // Write to clipboard
    try {
      await navigator.clipboard.writeText(JSON.stringify(clipboardData, null, 2));
    } catch {
      // Silently fail if clipboard access is denied
    }
  }

  /**
   * Paste from clipboard - creates elements or text based on clipboard content
   * @returns {Promise<void>}
   */
  async _paste() {
    // Read from clipboard
    let clipboardText;
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch {
      // Silently fail if clipboard access is denied
      return;
    }

    if (!clipboardText) {
      return;
    }

    // Try to parse as JSON (element data)
    let clipboardData;
    try {
      clipboardData = JSON.parse(clipboardText);
    } catch {
      // Not JSON - treat as plain text and create a text element
      this.#pasteAsText(clipboardText);
      return;
    }

    // Check if it's our element data format
    if (clipboardData && clipboardData.type === 'upper-doodle-elements' && Array.isArray(clipboardData.elements)) {
      this.#pasteElements(clipboardData);
    } else {
      // Unknown JSON format - treat as text
      this.#pasteAsText(clipboardText);
    }
  }

  /**
   * Paste clipboard content as a text element
   * @param {string} text - Text to paste
   */
  #pasteAsText(text) {
    const previewId = crypto.randomUUID();

    // Get cursor position or use viewport center
    const viewX = this.#state.ephemeral.viewX ?? this.#references.svg.clientWidth / 2;
    const viewY = this.#state.ephemeral.viewY ?? this.#references.svg.clientHeight / 2;

    const { x, y } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

    // Create text element at cursor
    this.#state = State.setInteraction(this.#state, {
      type: 'adding',
      element: {
        id: previewId,
        type: 'text',
        x,
        y,
        text: text,
      },
    });

    this.#invalidatePreview();
  }

  /**
   * Paste elements from clipboard data
   * @param {{ elements: Element[], centerX: number, centerY: number }} clipboardData - Clipboard data with elements array
   */
  #pasteElements(clipboardData) {
    const { elements, centerX, centerY } = clipboardData;

    if (elements.length === 0) {
      return;
    }

    // Get cursor position or use viewport center
    const viewX = this.#state.ephemeral.viewX ?? this.#references.svg.clientWidth / 2;
    const viewY = this.#state.ephemeral.viewY ?? this.#references.svg.clientHeight / 2;

    const { x: targetX, y: targetY } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

    // Calculate offset from original center to new position
    const offsetX = targetX - centerX;
    const offsetY = targetY - centerY;

    // Create preview elements with fresh UUIDs and updated positions
    const previewElements = elements.map(element => {
      const previewId = crypto.randomUUID();

      if (element.type === 'arrow') {
        return {
          ...element,
          id: previewId,
          x1: element.x1 + offsetX,
          y1: element.y1 + offsetY,
          x2: element.x2 + offsetX,
          y2: element.y2 + offsetY,
          source: null,
          target: null,
        };
      } else if (element.type === 'tree') {
        // Trees cannot be copied - skip
        return null;
      } else {
        return {
          ...element,
          id: previewId,
          x: element.x + offsetX,
          y: element.y + offsetY,
        };
      }
    }).filter((el) => el !== null);

    // Type assertion: after filtering nulls, all elements are valid
    const validPreviewElements = /** @type {Element[]} */ (previewElements);

    // Create adding interaction with single or multiple elements
    if (validPreviewElements.length === 1) {
      this.#state = State.setInteraction(this.#state, {
        type: 'adding',
        element: validPreviewElements[0],
      });
    } else {
      this.#state = State.setInteraction(this.#state, {
        type: 'adding',
        element: validPreviewElements[0], // Keep for compatibility
        elements: validPreviewElements,
        groupCenter: { x: targetX, y: targetY },
      });
    }

    this.#invalidatePreview();
  }

  /**
   * Unbind arrows connected to deleted elements
   * @param {Record<string, Element>} elements - Elements map (mutated in place)
   * @param {string[]} deletedElementIds - IDs of deleted elements
   */
  #unbindArrowsFromDeletedElements(elements, deletedElementIds) {
    for (const el of Object.values(elements)) {
      if (el.type === 'arrow') {
        const sourceDeleted = el.source && deletedElementIds.includes(el.source);
        const targetDeleted = el.target && deletedElementIds.includes(el.target);

        if (sourceDeleted || targetDeleted) {
          elements[el.id] = {
            ...el,
            source: sourceDeleted ? null : el.source,
            target: targetDeleted ? null : el.target,
          };
        }
      }
    }
  }

  /**
   * Enter edit mode for currently selected element
   */
  _edit() {
    const interaction = this.#state.ephemeral.interaction;

    // Only allow editing if there's a single selected element
    if (!interaction || interaction.type !== 'selection' || interaction.elementIds.length !== 1) {
      return;
    }

    const elementId = interaction.elementIds[0];
    const element = this.#state.persistent.elements[elementId];
    if (!element) {
      return;
    }

    // Trees cannot be edited via this method
    if (element.type === 'tree') {
      return;
    }

    // Get element bounding box in world coordinates
    const bbox = Drawing.getBoundingBox(this.#references.svg, element);

    // Calculate midpoint in world coordinates
    const midX = bbox.x + bbox.width / 2;
    const midY = bbox.y + bbox.height / 2;

    // Convert midpoint to view coordinates (SVG viewBox space)
    const { viewX, viewY } = Coordinates.worldToView(midX, midY, this.#state.persistent.scene, this.#kx, this.#ky);

    // Convert view coordinates to container pixel coordinates
    const svg = this.#references.svg;
    const svgRect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const containerRect = this.#references.container.getBoundingClientRect();

    // Map from viewBox coordinates to actual SVG pixel coordinates
    const svgPixelX = (viewX / viewBox.width) * svgRect.width;
    const svgPixelY = (viewY / viewBox.height) * svgRect.height;

    // Convert to container-relative coordinates
    const containerX = svgRect.left - containerRect.left + svgPixelX;
    const containerY = svgRect.top - containerRect.top + svgPixelY;

    // Calculate textarea dimensions (reasonable size for editing)
    const textareaWidth = 200;
    const textareaHeight = 100;

    // Position the form
    const form = this.#references.form;
    form.style.left = `${containerX}px`;
    form.style.top = `${containerY}px`;

    // Configure the textarea
    const textarea = this.#references.textarea;
    textarea.value = element.text;
    textarea.style.width = `${textareaWidth}px`;
    textarea.style.height = `${textareaHeight}px`;

    // Focus the textarea
    textarea.focus();
    textarea.select();

    // Update state to edit mode
    this.#state = State.setInteraction(this.#state, {
      type: 'edit',
      elementId,
    });

    this.#invalidateUi();
    this.#invalidateEdit();
  }

  /**
   * Overwrite text value of currently edited element
   * @param {string} newText - New text value
   */
  _overwrite(newText) {
    Validate.string(newText, 'newText');

    const interaction = this.#state.ephemeral.interaction;

    // Only allow overwrite if we're in edit mode
    if (!interaction || interaction.type !== 'edit') {
      return;
    }

    const elementId = interaction.elementId;

    // Find the element being edited
    const element = this.#state.persistent.elements[elementId];
    if (!element) {
      return;
    }

    // Update the element with new text value
    this.#state = State.updateElement(this.#state, elementId, {
      text: newText,
    });

    this.#invalidateContent();
  }

  /**
   * Update the domain
   * @param {string} newDomain - New domain value
   */
  _domain(newDomain) {
    Validate.string(newDomain, 'newDomain');

    this.#state = State.update(this.#state, { domain: newDomain });
    this.#invalidateAll();
  }

  /**
   * Return best match (or null) at a given set of view coordinates
   * @param {number} viewX - View X coordinate
   * @param {number} viewY - View Y coordinate
   * @returns {({ id: string, feature: 'element'|'handle-head'|'handle-tail'|'handle-ne'|'handle-se'|'handle-sw'|'handle-nw'|'branch'})|null} - the UUID of the element and specific hit feature
   */
  _hit(viewX, viewY) {
    Validate.coordinate(viewX, 'viewX');
    Validate.coordinate(viewY, 'viewY');

    // Convert view coordinates to world coordinates
    const { x, y } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

    // PRIORITY: Check for add-child button hits first (these are in UI layer)
    const addChildButtonHit = this.#testAddChildButtonHit(x, y);
    if (addChildButtonHit) {
      return addChildButtonHit;
    }

    // PRIORITY: If exactly one element is selected, prioritize its handles
    // This allows clicking handles even when they overlap with other elements
    const interaction = this.#state.ephemeral.interaction;
    if (interaction && interaction.type === 'selection' && interaction.elementIds.length === 1) {
      const selectedElement = this.#state.persistent.elements[interaction.elementIds[0]];
      if (selectedElement) {
        // Check handles for the selected element first
        if (selectedElement.type === 'arrow') {
          const arrowHandle = Hit.testArrowHandle(selectedElement, x, y);
          if (arrowHandle === 'tail') {
            return { id: selectedElement.id, feature: 'handle-tail' };
          } else if (arrowHandle === 'head') {
            return { id: selectedElement.id, feature: 'handle-head' };
          }
        } else if (selectedElement.type !== 'text') {
          // Check box handles for shapes (not text)
          const bbox = Drawing.getBoundingBox(this.#references.svg, selectedElement);
          const boxHandle = Hit.testBoxHandle(x, y, bbox);
          if (boxHandle === 'nw') {
            return { id: selectedElement.id, feature: 'handle-nw' };
          } else if (boxHandle === 'ne') {
            return { id: selectedElement.id, feature: 'handle-ne' };
          } else if (boxHandle === 'se') {
            return { id: selectedElement.id, feature: 'handle-se' };
          } else if (boxHandle === 'sw') {
            return { id: selectedElement.id, feature: 'handle-sw' };
          }
        }
      }
    }

    // Find element at world coordinates
    const element = this.#findElementAt(x, y);
    if (!element) {
      return null;
    }

    // Determine which feature was hit (handle or element body)
    /** @type {'element'|'handle-head'|'handle-tail'|'handle-ne'|'handle-se'|'handle-sw'|'handle-nw'} */
    let feature = 'element';

    if (element.type === 'arrow') {
      // Check if hitting an arrow handle
      const arrowHandle = Hit.testArrowHandle(element, x, y);
      if (arrowHandle === 'tail') {
        feature = 'handle-tail';
      } else if (arrowHandle === 'head') {
        feature = 'handle-head';
      }
    } else if (element.type !== 'text') {
      // Check if hitting a box handle (shapes only, not text)
      const bbox = Drawing.getBoundingBox(this.#references.svg, element);
      const boxHandle = Hit.testBoxHandle(x, y, bbox);
      if (boxHandle === 'nw') {
        feature = 'handle-nw';
      } else if (boxHandle === 'ne') {
        feature = 'handle-ne';
      } else if (boxHandle === 'se') {
        feature = 'handle-se';
      } else if (boxHandle === 'sw') {
        feature = 'handle-sw';
      }
    }

    return { id: element.id, feature };
  }

  render() {
    // Re-render anything that is flagged as invalid.
    if (this.#invalidContent) { this.#renderContent(); }
    if (this.#invalidPreview) { this.#renderPreview(); }
    if (this.#invalidWorld)   { this.#renderWorld(); }
    if (this.#invalidUi)      { this.#renderUi(); }
    if (this.#invalidEdit)    { this.#renderEdit(); }
    if (this.#invalidCursor)  { this.#renderCursor(); }
    if (this.#invalidDomain)  { this.#renderDomain(); }

    // Update previous state pointer.
    this.#prevState = this.#state;

    // Reset all invalidation flags.
    this.#invalidWorld = false;
    this.#invalidContent = false;
    this.#invalidUi = false;
    this.#invalidCursor = false;
    this.#invalidPreview = false;
    this.#invalidEdit = false;
    this.#invalidDomain = false;
  }

  /**
   * Update ignored, raw, invalid syntax, and keyed sets by running Triples.generate()
   * @param {Elements} elements - Current elements to analyze
   */
  #updateSemanticSets(elements) {
    const { ignored, raw, invalid, keyed } = Triples.generate(this.#state.persistent.domain, this.#state.persistent.prefixes, elements, this.#state.persistent.nTriples);
    this.#ignored = ignored;
    this.#raw = raw;
    this.#invalidSyntax = invalid;
    this.#keyed = keyed;
  }

  /**
   * Apply tree layouts to elements
   * For each tree in elements, compute its layout and update the positions of its items
   * @param {Elements} elements - Elements to apply tree layouts to
   * @returns {Elements} New elements object with tree layouts applied
   */
  #applyTreeLayouts(elements) {
    // Find all trees
    const trees = Object.values(elements).filter(el => el.type === 'tree');

    if (trees.length === 0) {
      return elements; // No trees, return unchanged
    }

    // Create a new elements object with updated positions
    const updatedElements = { ...elements };

    for (const tree of trees) {
      // Compute layout for this tree
      const layout = Drawing.layoutTree(elements, tree, TREE_VERTICAL_GAP, TREE_HORIZONTAL_GAP);

      // Track if any positions changed
      let hasChanges = false;

      // Apply layout positions to tree items
      for (const [elementId, position] of Object.entries(layout)) {
        const element = updatedElements[elementId];
        if (element && (element.type === 'diamond' || element.type === 'rectangle')) {
          // Check if position actually changed
          if (element.x !== position.x || element.y !== position.y) {
            hasChanges = true;
          }
          updatedElements[elementId] = {
            ...element,
            x: position.x,
            y: position.y,
          };
        }
      }

      // If any positions changed, touch the tree to trigger branch re-render
      if (hasChanges) {
        updatedElements[tree.id] = { ...tree };
      }
    }

    return updatedElements;
  }

  /**
   * Helper to check if two Sets are equal
   * @param {Set<string>} a
   * @param {Set<string>} b
   * @returns {boolean}
   */
  #setsEqual(a, b) {
    if (a.size !== b.size) {
      return false;
    }
    for (const item of a) {
      if (!b.has(item)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Render content (add, update, remove elements in DOM)
   */
  #renderContent() {
    // Current and previous elements are already objects
    const currentElements = this.#state.persistent.elements;
    const prevElements = this.#prevState?.persistent.elements ?? {};

    // Check if domain changed (affects external status of all diamonds and rectangles)
    const currentDomain = this.#state.persistent.domain;
    const prevDomain = this.#prevState?.persistent.domain;
    const domainChanged = currentDomain !== prevDomain;

    // Save previous semantic sets BEFORE updating
    const prevIgnored = new Set(this.#ignored);
    const prevRaw = new Set(this.#raw);
    const prevInvalidSyntax = new Set(this.#invalidSyntax);
    const prevKeyed = new Set(this.#keyed);

    // Update semantic sets (ignored, raw, invalid, keyed) by analyzing current elements
    this.#updateSemanticSets(currentElements);

    // Detect which elements had their semantic state change
    const elementsWithChangedSemantics = new Set();

    // Check if any semantic sets changed
    const ignoredChanged = !this.#setsEqual(this.#ignored, prevIgnored);
    const rawChanged = !this.#setsEqual(this.#raw, prevRaw);
    const invalidChanged = !this.#setsEqual(this.#invalidSyntax, prevInvalidSyntax);
    const keyedChanged = !this.#setsEqual(this.#keyed, prevKeyed);

    if (ignoredChanged || rawChanged || invalidChanged || keyedChanged) {
      // Find elements whose semantic state changed
      for (const id of Object.keys(currentElements)) {
        const wasIgnored = prevIgnored.has(id);
        const isIgnored = this.#ignored.has(id);
        const wasRaw = prevRaw.has(id);
        const isRaw = this.#raw.has(id);
        const wasInvalid = prevInvalidSyntax.has(id);
        const isInvalid = this.#invalidSyntax.has(id);
        const wasKeyed = prevKeyed.has(id);
        const isKeyed = this.#keyed.has(id);

        if (wasIgnored !== isIgnored || wasRaw !== isRaw || wasInvalid !== isInvalid || wasKeyed !== isKeyed) {
          elementsWithChangedSemantics.add(id);
        }
      }
    }

    // Create union of all element IDs (current and previous)
    const allIds = new Set([
      ...Object.keys(currentElements),
      ...Object.keys(prevElements),
    ]);

    // Single loop to handle add, update, and remove
    for (const id of allIds) {
      const currentElement = currentElements[id];
      const prevElement = prevElements[id];
      const semanticsChanged = elementsWithChangedSemantics.has(id);

      // Check if this element needs re-rendering due to domain change
      // All elements should be re-rendered when domain changes since domain affects
      // data attributes like data-external, data-ignored, etc.
      const affectedByDomainChange = domainChanged && currentElement;

      // Re-render if element changed OR its semantic state changed OR domain changed
      if (currentElement !== prevElement || semanticsChanged || affectedByDomainChange) {
        if (!prevElement) {
          // Add: element is new
          this.#renderElement(currentElement, this.#ignored, this.#raw, this.#invalidSyntax, this.#keyed);
        } else if (!currentElement) {
          // Remove: element was deleted
          const shapeNode = this.#references.content.querySelector(`[data-id="${id}"]`);
          if (shapeNode) {shapeNode.remove();}

          const labelNode = this.#references.content.querySelector(`[data-id="${id}"]`);
          if (labelNode) {labelNode.remove();}
        } else {
          // Update: element changed (reference inequality means immutable state changed)
          Drawing.updateElement(this.#references.svg, currentElement, prevElement, this.#ignored, this.#raw, this.#invalidSyntax, this.#keyed, this.#state.persistent.domain, this.#state.persistent.elements);
        }
      }
    }

    // Fire change event if elements array reference changed or domain changed (top-level change detection)
    if (
      !this.#prevState ||
      this.#state.persistent.elements !== this.#prevState.persistent.elements ||
      this.#state.persistent.domain !== this.#prevState.persistent.domain
    ) {
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    }
  }

  /**
   * Render preview element(s) for adding interaction
   */
  #renderPreview() {
    const interaction = this.#state.ephemeral.interaction;

    if (interaction && interaction.type === 'adding') {
      // Check if we need to update the preview
      const currentInteraction = interaction;
      const prevInteraction = this.#prevState?.ephemeral.interaction;

      // For multi-element, check the elements array; for single, check element
      const currentData = currentInteraction.elements || [currentInteraction.element];
      const prevData = prevInteraction?.type === 'adding'
        ? (prevInteraction.elements || [prevInteraction.element])
        : null;

      const previewChanged = !prevInteraction ||
        prevInteraction.type !== 'adding' ||
        JSON.stringify(currentData) !== JSON.stringify(prevData);

      if (previewChanged) {
        // Remove all old preview elements
        const oldPreviews = this.#references.content.querySelectorAll('[data-preview="true"]');
        oldPreviews.forEach(node => node.remove());

        // Render new preview(s)
        const previewElements = currentInteraction.elements || [currentInteraction.element];
        for (const previewElement of previewElements) {
          const node = Drawing.drawElement(this.#references.svg, previewElement, new Set(), new Set(), new Set(), new Set(), this.#state.persistent.domain, this.#state.persistent.elements);
          node.setAttribute('data-id', previewElement.id);
          node.setAttribute('data-preview', 'true');
          node.style.opacity = '0.5';
          this.#references.content.appendChild(node);
        }
      }
    } else if (interaction && interaction.type === 'adding-arrow') {
      // Handle adding-arrow preview
      if (this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
        return;
      }

      // Convert view coordinates to world coordinates
      const { x, y } = Coordinates.viewToWorld(
        this.#state.ephemeral.viewX,
        this.#state.ephemeral.viewY,
        this.#state.persistent.scene,
        this.#kx,
        this.#ky
      );

      // Create preview arrow based on current step
      /** @type {Arrow} */
      let previewArrow;
      if (interaction.step === 'placing-tail') {
        // Step 1: Tail at cursor, fixed 100px horizontal
        previewArrow = {
          id: interaction.arrowId,
          type: 'arrow',
          x1: x,
          y1: y,
          x2: x + 100,
          y2: y,
          text: '',
          source: null,
          target: null,
        };
      } else {
        // Step 2: Tail fixed, head follows cursor
        // Type guard: x1 and y1 must be set in placing-head step
        if (interaction.x1 === null || interaction.y1 === null) {
          throw new Error('Unexpected: x1/y1 should be set in placing-head step');
        }

        previewArrow = {
          id: interaction.arrowId,
          type: 'arrow',
          x1: interaction.x1,
          y1: interaction.y1,
          x2: x,
          y2: y,
          text: '',
          source: interaction.source,
          target: interaction.target,
        };
      }

      // Remove old preview and render new one
      const oldPreviews = this.#references.content.querySelectorAll('[data-preview="true"]');
      oldPreviews.forEach(node => node.remove());

      const node = Drawing.drawElement(this.#references.svg, previewArrow, new Set(), new Set(), new Set(), new Set(), this.#state.persistent.domain, this.#state.persistent.elements);
      node.setAttribute('data-id', previewArrow.id);
      node.setAttribute('data-preview', 'true');
      node.style.opacity = '0.5';
      this.#references.content.appendChild(node);
    } else {
      // Remove all preview elements if we're not in adding mode
      const oldPreviews = this.#references.content.querySelectorAll('[data-preview="true"]');
      oldPreviews.forEach(node => node.remove());
    }
  }

  /**
   * Render world transform (pan/zoom)
   */
  #renderWorld() {
    // Update scene transform if changed (also reapply on any render to pick up aspect changes)
    if (!this.#prevState ||
        this.#state.persistent.scene.x !== this.#prevState.persistent.scene.x ||
        this.#state.persistent.scene.y !== this.#prevState.persistent.scene.y ||
        this.#state.persistent.scene.k !== this.#prevState.persistent.scene.k ||
        this.#kx !== this.#prevKx ||
        this.#ky !== this.#prevKy
      ) {
      const { x, y, k } = this.#state.persistent.scene;
      // Apply aspect correction (kx, ky) to maintain square proportions
      this.#references.world.setAttribute('transform', `translate(${x}, ${y}) scale(${k * this.#kx}, ${k * this.#ky})`);
    }
  }

  /**
   * Render edit mode state (data-edit attribute and focus)
   */
  #renderEdit() {
    const wasInEditMode = this.#prevState?.ephemeral.interaction?.type === 'edit';
    const isInEditMode = this.#state.ephemeral.interaction && this.#state.ephemeral.interaction.type === 'edit';

    if (isInEditMode) {
      this.#references.container.setAttribute('data-edit', '');

      // If we just entered edit mode, focus the textarea
      if (!wasInEditMode) {
        this.#references.textarea.focus();
        this.#references.textarea.select();
      }
    } else {
      this.#references.container.removeAttribute('data-edit');
    }
  }

  /**
   * Render cursor based on pointer position
   */
  #renderCursor() {
    if (!this.#prevState ||
        this.#state.ephemeral.viewX !== this.#prevState.ephemeral.viewX ||
        this.#state.ephemeral.viewY !== this.#prevState.ephemeral.viewY) {
      const cursor = this.#deriveCursor();
      this.#references.container.setAttribute('data-cursor', cursor);
    }
  }

  /**
   * Render domain input value from state
   */
  #renderDomain() {
    if (!this.#prevState || this.#state.persistent.domain !== this.#prevState.persistent.domain) {
      this.#references.domain.value = this.#state.persistent.domain;
    }
  }

  /**
   * Compute scale factor from wheel event
   * @param {WheelEvent} event - Wheel event
   * @returns {number} Scale factor (dk)
   */
  static #computeWheelZoom(event) {
    // Exponential scaling: 50% per 100 pixels of wheel delta
    return Math.pow(2, -event.deltaY / 100);
  }

  #upgradeProperties() {
    for (const property of Reflect.ownKeys(this)) {
      if (Object.hasOwn(this, property)) {
        const value = /** @type {any} */ (this)[property];
        delete /** @type {any} */ (this)[property];
        /** @type {any} */ (this)[property] = value;
      }
    }
  }

  /**
   * @template {keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap} T
   * @param {string} id
   * @param {T} expectedTag
   * @returns {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : T extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[T] : Element}
   */
  #getElement(id, expectedTag) {
    const el = this.#root.querySelector(`#${id}`);
    Validate.defined(el, id);
    if (el.tagName.toLowerCase() !== expectedTag) {
      throw new Error(`Expected ${id} to be <${expectedTag}>, got <${el.tagName.toLowerCase()}>`);
    }
    return /** @type {any} */ (el);
  }

  /**
   * Initialize component DOM structure
   */
  #initializeDOM() {
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    Validate.defined(this.shadowRoot);
    this.#root = this.shadowRoot;
    this.#root.adoptedStyleSheets = [styleSheet];
    this.#root.append(template.content.cloneNode(true));

    this.#references = {
      container: this.#getElement('container', 'div'),
      focus: this.#getElement('focus', 'button'),
      tools: this.#getElement('tools', 'div'),
      domain: this.#getElement('domain', 'input'),
      diamond: this.#getElement('diamond', 'button'),
      rectangle: this.#getElement('rectangle', 'button'),
      arrow: this.#getElement('arrow', 'button'),
      tree: this.#getElement('tree', 'button'),
      svg: this.#getElement('svg', 'svg'),
      world: this.#getElement('world', 'g'),
      content: this.#getElement('content', 'g'),
      ui: this.#getElement('ui', 'g'),
      form: this.#getElement('form', 'form'),
      textarea: this.#getElement('textarea', 'textarea'),
    };
  }

  /**
   * Define event handler functions (called once during initialization)
   */
  #defineEventHandlers() {
    this.#handleClick = (event) => {
      Validate.eventType(event, MouseEvent);
      switch (event.target) {
        case this.#references.diamond:   this._create('diamond');   break;
        case this.#references.rectangle: this._create('rectangle'); break;
        case this.#references.arrow:     this._create('arrow');     break;
        case this.#references.tree:      this._plant();             break;
        default:
          if (
            event.target instanceof Element &&
            this.#references.svg.contains(event.target)
          ) {
            this.#references.focus.focus();
          }
      }
    };

    this.#handleWheel = (event) => {
      Validate.eventType(event, WheelEvent);

      // IMPORTANT: non-passive + preventDefault to stop page scroll/zoom
      event.preventDefault();

      // Convert client coordinates to view coordinates
      const { clientX, clientY } = event;
      const { viewX, viewY } = Coordinates.clientToView(this.#references.svg, clientX, clientY);

      if (event.ctrlKey) {
        // Pinch-to-zoom gesture (Ctrl+wheel)
        const scale = UpperDoodle.#computeWheelZoom(event);

        // Convert cursor position to world coordinates using current scene
        const { x: worldX, y: worldY } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

        // Apply zoom
        const newK = this.#state.persistent.scene.k * scale;

        // Calculate new scene position to keep world point under cursor
        const newX = viewX - worldX * newK * this.#kx;
        const newY = viewY - worldY * newK * this.#ky;

        this.#state = State.setScene(this.#state, { x: newX, y: newY, k: newK });

        this.#invalidateWorld();
      } else {
        // Two-finger scroll gesture (pan)
        const svg = this.#references.svg;
        const viewBox = svg.viewBox.baseVal;
        const rect = svg.getBoundingClientRect();

        // Convert pixel deltas to view deltas (negative because scroll direction is inverted)
        const viewDx = -event.deltaX * (viewBox.width / rect.width);
        const viewDy = -event.deltaY * (viewBox.height / rect.height);

        this.#state = State.setScene(this.#state, {
          x: this.#state.persistent.scene.x + viewDx,
          y: this.#state.persistent.scene.y + viewDy,
          k: this.#state.persistent.scene.k,
        });

        this.#invalidateWorld();
      }
    };

    this.#handleDblClick = (event) => {
      Validate.eventType(event, MouseEvent);

      // Only handle double-clicks on the SVG
      if (
        !(event.target instanceof Element) ||
        !this.#references.svg.contains(event.target)
      ) {
        return;
      }

      // Convert client coordinates to view coordinates
      const { clientX, clientY } = event;
      const { viewX, viewY } = Coordinates.clientToView(this.#references.svg, clientX, clientY);

      // Convert view coordinates to world coordinates
      const { x, y } = Coordinates.viewToWorld(viewX, viewY, this.#state.persistent.scene, this.#kx, this.#ky);

      // Find element at coordinates
      const hitElement = this.#findElementAt(x, y);

      if (hitElement) {
        // Select the element
        this.#state = State.setInteraction(this.#state, {
          type: 'selection',
          elementIds: [hitElement.id],
          startViewX: viewX,
          startViewY: viewY,
        });

        this.#invalidateUi();

        // Enter edit mode
        this._edit();
      }
    };

    this.#handlePointerDown = (event) => {
      Validate.eventType(event, PointerEvent);

      if (
        !(event.target instanceof Element) ||
        this.#references.form.contains(event.target) ||
        !this.#references.svg.contains(event.target)
      ) {
        return;
      }

      // Prevent default browser behavior (e.g., touch scrolling, pinch-zoom)
      event.preventDefault();

      const { clientX, clientY } = event;
      const { viewX, viewY } = Coordinates.clientToView(this.#references.svg, clientX, clientY);

      // Call _down
      this._down(viewX, viewY);
    };

    this.#handlePointerMove = (event) => {
      Validate.eventType(event, PointerEvent);

      if (
        !(event.target instanceof Element) ||
        !this.#references.svg.contains(event.target) ||
        this.#rafPending
      ) {
        return;
      }

      this.#rafPending = true;
      requestAnimationFrame(() => {
        this.#rafPending = false;

        // Convert client coordinates to view coordinates
        const { clientX, clientY } = event;
        const { viewX, viewY } = Coordinates.clientToView(this.#references.svg, clientX, clientY);

        // If there's an interaction, handle it via _move
        // (includes 'adding' without down, and 'move'/'resize-*' with down)
        if (this.#state.ephemeral.interaction) {
          this._move(viewX, viewY);
        }
        // Otherwise just update viewX/viewY state for cursor tracking
        else if (this.#state.ephemeral.viewX !== viewX || this.#state.ephemeral.viewY !== viewY) {
          this.#state = State.setPointer(this.#state, viewX, viewY);
          this.#invalidateCursor();
        }
      });
    };

    this.#handlePointerUp = (event) => {
      Validate.eventType(event, PointerEvent);

      if (
        !(event.target instanceof Element) ||
        this.#references.form.contains(event.target)
      ) {
        return;
      }
      this._up();
    };

    // Textarea change handler
    this.#references.textarea.addEventListener('change', (event) => {
      Validate.eventType(event, Event);

      this._overwrite(this.#references.textarea.value);
    });

    // Textarea keydown handler for Enter key behavior
    this.#references.textarea.addEventListener('keydown', (event) => {
      Validate.eventType(event, KeyboardEvent);

      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        this._cancel();
        return;
      }

      // Handle Enter key
      if (event.key === 'Enter') {
        // Allow newline if Shift or Option/Alt keys are pressed
        if (event.shiftKey || event.altKey) {
          return; // Let the default behavior happen (insert newline)
        }

        // Otherwise, complete the edit
        event.preventDefault();
        this._overwrite(this.#references.textarea.value);
        this._finish();
      }
    });

    // Form submit handler
    this.#references.form.addEventListener('submit', (event) => {
      Validate.eventType(event, SubmitEvent);

      event.preventDefault();
    });

    // Domain input change handler
    this.#references.domain.addEventListener('change', (event) => {
      Validate.eventType(event, Event);

      const newDomain = this.#references.domain.value;
      this._domain(newDomain);
    });

    // Keyboard handler
    this.#handleKeyDown = (event) => {
      Validate.eventType(event, KeyboardEvent);

      if (
        !(event.target instanceof Element) ||
        this.#references.textarea.contains(event.target) ||
        this.#references.domain.contains(event.target)
      ) {
        return;
      }

      // Cmd/Ctrl+Shift+Z: redo
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'z') {
        this.#redo();
        event.preventDefault();
        return;
      }

      // Cmd/Ctrl+Z: undo
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        this.#undo();
        event.preventDefault();
        return;
      }

      // Cmd/Ctrl+C: copy
      if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
        this._copy();
        event.preventDefault();
        return;
      }

      // Cmd/Ctrl+V: paste
      if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
        this._paste();
        event.preventDefault();
        return;
      }

      // Escape: cancel current interaction
      if (event.key === 'Escape') {
        this._cancel();
        event.preventDefault();
        return;
      }

      // Delete/Backspace: delete selected elements
      if (event.key === 'Delete' || event.key === 'Backspace') {
        this._delete();
        event.preventDefault();
      }
    };
  }

  /**
   * Set up event handlers for interaction (called on connectedCallback)
   */
  #setupEventHandlers() {
    this.#root.addEventListener('click', this.#handleClick);
    this.#references.svg.addEventListener('wheel', this.#handleWheel, { passive: false });
    this.#root.addEventListener('dblclick', this.#handleDblClick);
    this.#root.addEventListener('pointermove', this.#handlePointerMove);
    this.#root.addEventListener('pointerdown', this.#handlePointerDown);
    this.#root.addEventListener('pointerup', this.#handlePointerUp);
    this.#root.addEventListener('keydown', this.#handleKeyDown);
  }

  /**
   * Tear down event handlers (called on disconnectedCallback)
   */
  #teardownEventHandlers() {
    this.#root.removeEventListener('click', this.#handleClick);
    this.#references.svg.removeEventListener('wheel', this.#handleWheel);
    this.#root.removeEventListener('dblclick', this.#handleDblClick);
    this.#root.removeEventListener('pointermove', this.#handlePointerMove);
    this.#root.removeEventListener('pointerdown', this.#handlePointerDown);
    this.#root.removeEventListener('pointerup', this.#handlePointerUp);
    this.#root.removeEventListener('keydown', this.#handleKeyDown);
  }

  /**
   * Recursively sort object keys according to canonical ordering rules
   * @param {any} value - Value to canonicalize
   * @returns {any} Value with sorted keys
   */
  static #canonicalizeValue(value) {
    // Handle null and primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle arrays - recursively canonicalize each element
    if (Array.isArray(value)) {
      return value.map(item => UpperDoodle.#canonicalizeValue(item));
    }

    // Handle objects - sort keys according to canonical order
    const entries = Object.entries(value);

    // Define canonical property order
    /** @type {Record<string, number>} */
    const propertyOrder = {
      // Document-level properties
      'domain': 0,
      'elements': 1,
      'nTriples': 2,
      'prefixes': 3,
      'down': 4,
      'interaction': 5,
      'scene': 6,
      'viewX': 7,
      'viewY': 8,

      // Element common properties (always first)
      'id': 10,
      'type': 11,

      // Position properties (rectangles, diamonds, text)
      'x': 20,
      'y': 21,
      'width': 22,
      'height': 23,

      // Arrow position properties
      'x1': 20,
      'y1': 21,
      'x2': 22,
      'y2': 23,

      // Arrow bindings
      'source': 30,
      'target': 31,

      // Tree-specific properties
      'root': 40,
      'items': 41,

      // Tree item properties
      'parent': 50,
      'element': 51,

      // Text content (last property for all element types)
      'text': 60,
    };

    // Sort entries by canonical order, then alphabetically for unknown properties
    const sortedEntries = entries.sort(([keyA], [keyB]) => {
      const orderA = propertyOrder[keyA] ?? 1000;
      const orderB = propertyOrder[keyB] ?? 1000;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Same priority or both unknown - sort alphabetically
      return keyA.localeCompare(keyB);
    });

    // Recursively canonicalize values and reconstruct object
    return Object.fromEntries(
      sortedEntries.map(([key, val]) => [key, UpperDoodle.#canonicalizeValue(val)])
    );
  }

  /**
   * Convert a full state object to canonical JSON string (internal use)
   * @param {StateShape} state - Full state object
   * @returns {string} Canonical JSON string
   */
  static _valueFromObject(state) {
    // Validate state first
    Validate.state(state);

    // Create canonical structure with sorted element keys
    const canonical = {
      domain: state.persistent.domain,
      down: state.ephemeral.down,
      elements: Object.fromEntries(
        Object.entries(state.persistent.elements)
          .sort(([a], [b]) => a.localeCompare(b))
      ),
      interaction: state.ephemeral.interaction,
      nTriples: state.persistent.nTriples,
      prefixes: Object.fromEntries(
        Object.entries(state.persistent.prefixes)
          .sort(([a], [b]) => a.localeCompare(b))
      ),
      scene: state.persistent.scene,
      viewX: state.ephemeral.viewX,
      viewY: state.ephemeral.viewY,
    };

    // Recursively canonicalize all nested objects
    const fullyCanonical = UpperDoodle.#canonicalizeValue(canonical);

    // Serialize without spaces for canonical form
    return JSON.stringify(fullyCanonical);
  }

  /**
   * Convert a JSON string to canonical JSON string for full state (internal use)
   * Parses the input, validates it, and re-serializes in canonical form
   * @param {string} json - JSON string to canonicalize
   * @returns {string} Canonical JSON string
   * @throws {TypeError} If JSON is invalid
   */
  static _valueFromJSON(json) {
    // Parse the JSON (in flat canonical format)
    const flat = /** @type {any} */ (JSON.parse(json));

    // Convert from flat format to nested state structure
    const state = {
      persistent: {
        prefixes: flat.prefixes,
        domain: flat.domain,
        elements: flat.elements,
        scene: flat.scene,
        nTriples: flat.nTriples,
      },
      ephemeral: {
        viewX: flat.viewX,
        viewY: flat.viewY,
        down: flat.down,
        interaction: flat.interaction,
      },
    };

    // Validate nested structure
    Validate.state(state);

    // Return canonical form (flat format)
    return UpperDoodle._valueFromObject(state);
  }

  /**
   * Convert a document object to canonical JSON string
   * @param {Object} obj - Document object with prefixes, domain, elements, and nTriples
   * @param {Object.<string, string>} obj.prefixes - Prefix mappings
   * @param {string} obj.domain - Default domain prefix
   * @param {Object.<string, Element>} obj.elements - Elements map
   * @param {string} obj.nTriples - Custom N-Triples document
   * @returns {string} Canonical JSON string
   */
  static valueFromObject(obj) {
    // Validate the document structure first
    Validate.document(obj);

    // Extract and validate required properties
    const { prefixes, domain, elements, nTriples } = obj;

    // Canonicalize nTriples
    const canonicalNTriples = Validate.canonicalizeNTriples(nTriples);

    // Create canonical structure with sorted element keys
    const canonical = {
      domain,
      elements: Object.fromEntries(
        Object.entries(elements)
          .sort(([a], [b]) => a.localeCompare(b))
      ),
      nTriples: canonicalNTriples,
      prefixes: Object.fromEntries(
        Object.entries(prefixes)
          .sort(([a], [b]) => a.localeCompare(b))
      ),
    };

    // Recursively canonicalize all nested objects
    const fullyCanonical = UpperDoodle.#canonicalizeValue(canonical);

    // Serialize without spaces for canonical form
    return JSON.stringify(fullyCanonical);
  }

  /**
   * Convert a JSON string to canonical JSON string
   * Parses the input, validates it, and re-serializes in canonical form
   * @param {string} json - JSON string to canonicalize
   * @returns {string} Canonical JSON string
   * @throws {TypeError} If JSON is invalid
   */
  static valueFromJSON(json) {
    // Parse and validate the JSON
    const obj = /** @type {unknown} */ (JSON.parse(json));
    Validate.document(obj);

    // Canonicalize
    return UpperDoodle.valueFromObject(obj);
  }

  /**
   * Get canonical document value (prefixes, domain, elements, nTriples as JSON string)
   * @returns {string} Canonical JSON string
   */
  get value() {
    return UpperDoodle.valueFromObject({
      prefixes: this.#state.persistent.prefixes,
      domain: this.#state.persistent.domain,
      elements: this.#state.persistent.elements,
      nTriples: this.#state.persistent.nTriples,
    });
  }

  /**
   * Set document value (prefixes, domain, elements, nTriples from canonical JSON string)
   * @param {string} value - Canonical JSON string
   * @throws {TypeError} If value is not canonical or invalid
   */
  set value(value) {
    // Validate that value is canonical
    const canonicalValue = UpperDoodle.valueFromJSON(value);
    if (value !== canonicalValue) {
      throw new TypeError('Value must be in canonical form. Use UpperDoodle.valueFromJSON() to canonicalize.');
    }

    // Parse and validate document structure
    const obj = /** @type {unknown} */ (JSON.parse(value));
    Validate.document(obj);

    // Canonicalize nTriples
    const canonicalNTriples = Validate.canonicalizeNTriples(obj.nTriples);

    // Apply tree layouts to elements before setting state
    const elementsWithTreeLayouts = this.#applyTreeLayouts(obj.elements);

    // Update state with new document properties
    this.#state = State.update(this.#state, {
      prefixes: obj.prefixes,
      domain: obj.domain,
      elements: elementsWithTreeLayouts,
      nTriples: canonicalNTriples,
    });

    // Clear undo/redo history when importing new document
    State.clearHistory();

    this.#invalidateAll();
  }

  /**
   * Get document value as parsed object
   * @returns {{ prefixes: Object.<string, string>, domain: string, elements: Object.<string, Element>, nTriples: string }}
   */
  get valueAsObject() {
    return {
      prefixes: this.#state.persistent.prefixes,
      domain: this.#state.persistent.domain,
      elements: this.#state.persistent.elements,
      nTriples: this.#state.persistent.nTriples,
    };
  }

  /**
   * Get document value as N-Triples format
   * @returns {string} N-Triples string
   */
  get valueAsNTriples() {
    const { nTriples } = Triples.generate(
      this.#state.persistent.domain,
      this.#state.persistent.prefixes,
      this.#state.persistent.elements,
      this.#state.persistent.nTriples
    );
    return nTriples;
  }

  /**
   * Get document value as Turtle format
   * @returns {string} Turtle string
   */
  get valueAsTurtle() {
    const { prefixes, nTriples } = Triples.generate(
      this.#state.persistent.domain,
      this.#state.persistent.prefixes,
      this.#state.persistent.elements,
      this.#state.persistent.nTriples
    );
    return Turtle.generate(prefixes, nTriples);
  }

  /**
   * Get full state as canonical JSON string (internal use)
   * @returns {string} Canonical JSON string
   */
  get _value() {
    return UpperDoodle._valueFromObject(this.#state);
  }

  /**
   * Set full state from canonical JSON string (internal use)
   * @param {string} value - Canonical JSON string
   * @throws {TypeError} If value is not canonical or invalid
   */
  set _value(value) {
    // Validate that value is canonical
    const canonicalValue = UpperDoodle._valueFromJSON(value);
    if (value !== canonicalValue) {
      throw new TypeError('Value must be in canonical form. Use UpperDoodle._valueFromJSON() to canonicalize.');
    }

    // Parse and convert flat format to nested state structure
    const flat = JSON.parse(value);
    const state = {
      persistent: {
        prefixes: flat.prefixes,
        domain: flat.domain,
        elements: flat.elements,
        scene: flat.scene,
        nTriples: flat.nTriples,
      },
      ephemeral: {
        viewX: flat.viewX,
        viewY: flat.viewY,
        down: flat.down,
        interaction: flat.interaction,
      },
    };

    // Note: Already validated in _valueFromJSON above
    this.#state = state;
    this.#invalidateAll();
  }

  /**
   * Get full state as parsed object (internal use)
   * @returns {StateShape}
   */
  get _valueAsObject() {
    return this.#state;
  }

  /**
   * Get document value as N-Triples format (internal use, delegates to public)
   * @returns {string} N-Triples string
   */
  get _valueAsNTriples() {
    return this.valueAsNTriples;
  }

  /**
   * Get document value as Turtle format (internal use, delegates to public)
   * @returns {string} Turtle string
   */
  get _valueAsTurtle() {
    return this.valueAsTurtle;
  }

  /**
   * Calculate aspect ratio correction based on SVG pixel dimensions.
   * Updates #kx and #ky to maintain square proportions in world space.
   * Call this when the SVG element is resized.
   */
  #updateAspectCorrection() {
    const { clientWidth, clientHeight } = this.#references.svg;
    if (clientWidth > 0 && clientHeight > 0) {
      this.#prevKx = this.#kx;
      this.#prevKy = this.#ky;
      this.#kx = 1000 / clientWidth;
      this.#ky = 1000 / clientHeight;
    }
  }

  /**
   * Recalculate aspect ratio correction based on current SVG dimensions.
   * Call this method when the component is resized.
   */
  resize() {
    this.#updateAspectCorrection();
    this.#invalidateWorld();
  }

  /**
   * Undo the last action
   * Restores previous persistent state from undo stack
   * @returns {void}
   */
  #undo() {
    const previousState = State.undo(this.#state);
    if (previousState) {
      this.#state = previousState;
      this.#invalidateContent();
      this.#invalidateUi();
    }
  }

  /**
   * Redo the last undone action
   * Restores next persistent state from redo stack
   * @returns {void}
   */
  #redo() {
    const nextState = State.redo(this.#state);
    if (nextState) {
      this.#state = nextState;
      this.#invalidateContent();
      this.#invalidateUi();
    }
  }

  /**
   * Find element at world coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Element|null} Element at coordinates, or null if none
   */
  #findElementAt(x, y) {
    // Check elements in reverse order (top to bottom in render order)
    // Object.values returns in insertion order, so reverse for hit testing
    const elementsArray = Object.values(this.#state.persistent.elements);
    for (let i = elementsArray.length - 1; i >= 0; i--) {
      const element = elementsArray[i];

      if (this.#hitTest(element, x, y)) {
        return element;
      }
    }

    return null;
  }

  /**
   * Test if point is inside element
   * @param {Element} element - Element to test
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {boolean} True if point is inside element
   */
  #hitTest(element, x, y) {
    // Arrows use distance-to-line test
    if (element.type === 'arrow') {
      return Hit.testArrow(element, x, y);
    }

    // Other elements use bounding box test
    const bbox = Drawing.getBoundingBox(this.#references.svg, element);
    return Hit.testBox(x, y, bbox);
  }

  /**
   * Derive cursor style from current pointer position
   * @returns {string} CSS cursor value
   */
  #deriveCursor() {
    // Check for planting interaction first
    const interaction = this.#state.ephemeral.interaction;
    if (interaction && interaction.type === 'planting') {
      return 'crosshair';
    }

    // Check for adding-arrow interaction
    if (interaction && interaction.type === 'adding-arrow') {
      return 'crosshair';
    }

    // If no pointer position is tracked, use default cursor
    if (this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
      return 'default';
    }

    const hit = this._hit(this.#state.ephemeral.viewX, this.#state.ephemeral.viewY);
    if (!hit) {
      return 'default';
    }

    // Map feature to cursor
    switch (hit.feature) {
      case 'element':
        return 'move';
      case 'handle-tail': return 'move';
      case 'handle-head': return 'move';
      case 'handle-nw':   return 'nwse-resize';
      case 'handle-se':   return 'nwse-resize';
      case 'handle-ne':   return 'nesw-resize';
      case 'handle-sw':   return 'nesw-resize';
      case 'branch': return 'pointer';
      default:
        Validate.unreachable(hit.feature);
    }
  }

  /**
   * Render UI (selection boxes around selected elements)
   */
  #renderUi() {
    // Clear existing selection UI
    this.#references.ui.replaceChildren();

    // Always render add-child buttons for tree elements
    this.#renderTreeAddChildButtons();

    // Only render selection UI if there's a selection, move, resize, edit, or adding-arrow interaction
    const interaction = this.#state.ephemeral.interaction;
    if (
      !interaction ||
      (
        interaction.type !== 'selection' &&
        interaction.type !== 'move' &&
        interaction.type !== 'resize-arrow' &&
        interaction.type !== 'resize-box' &&
        interaction.type !== 'edit' &&
        interaction.type !== 'adding-arrow'
      )
    ) {
      return;
    }

    // Render element selection handles
    this.#renderElementHandles(interaction);

    // Render binding indicators (arrow connections)
    this.#renderBindingIndicators(interaction);

    // Render live selection box (during drag)
    this.#renderLiveSelectionBox(interaction);
  }

  /**
   * Render add-child buttons (plus signs) for all tree elements
   */
  #renderTreeAddChildButtons() {
    const elements = this.#state.persistent.elements;

    // Find all elements that are in trees
    for (const elementId of Object.keys(elements)) {
      const element = elements[elementId];

      // Skip non-tree elements and tree elements themselves
      if (element.type === 'tree' || element.type === 'arrow' || element.type === 'text') {
        continue;
      }

      // Check if this element is in any tree
      if (!this.#isInAnyTree(elementId)) {
        continue;
      }

      // Get bounding box
      const bbox = Drawing.getBoundingBox(this.#references.svg, element);

      // Calculate position in the lower right corner inside the bounding box
      const paddingX = 24; // Distance from right edge
      const paddingY = 12; // Distance from bottom edge
      const plusX = bbox.x + bbox.width - paddingX;
      const plusY = bbox.y + bbox.height - paddingY;

      // Create tree-actions group to hold action buttons
      const actionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      actionsGroup.setAttribute('class', 'tree-actions');

      // Create text element for the add-tree-item button
      const plusSign = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      plusSign.setAttribute('x', String(plusX));
      plusSign.setAttribute('y', String(plusY));
      plusSign.setAttribute('class', 'add-tree-item');
      plusSign.textContent = '⊕'; // Heavy plus sign

      actionsGroup.appendChild(plusSign);

      // Find the element's DOM node and append the actions group to it
      const elementNode = this.#references.content.querySelector(`[data-id="${elementId}"]`);
      if (elementNode) {
        elementNode.appendChild(actionsGroup);
      }
    }
  }

  /**
   * Render selection handles for selected elements
   * @param {Interaction} interaction - Current interaction
   */
  #renderElementHandles(interaction) {
    // Get element IDs to render (resize-arrow, resize-box, and edit use elementId, others use elementIds)
    let elementIds;
    if (interaction.type === 'resize-arrow' || interaction.type === 'resize-box' || interaction.type === 'edit') {
      elementIds = [interaction.elementId];
    } else if (interaction.type === 'selection' || interaction.type === 'move') {
      elementIds = interaction.elementIds;
    } else {
      // zoom, pan, adding interactions don't render element handles
      return;
    }

    for (const elementId of elementIds) {
      const element = this.#state.persistent.elements[elementId];
      if (!element) {continue;}

      // Use Drawing.drawSelection to get selection UI elements
      const selection = Drawing.drawSelection(this.#references.svg, element);

      // Append all returned elements to UI
      if (element.type === 'arrow') {
        if (selection.handleTail) {
          this.#references.ui.appendChild(selection.handleTail);
        }
        if (selection.handleHead) {
          this.#references.ui.appendChild(selection.handleHead);
        }
      } else {
        if (selection.outline) {
          this.#references.ui.appendChild(selection.outline);
        }
        if (selection.handleNw) {
          this.#references.ui.appendChild(selection.handleNw);
        }
        if (selection.handleNe) {
          this.#references.ui.appendChild(selection.handleNe);
        }
        if (selection.handleSe) {
          this.#references.ui.appendChild(selection.handleSe);
        }
        if (selection.handleSw) {
          this.#references.ui.appendChild(selection.handleSw);
        }
      }
    }
  }

  /**
   * Render binding indicators (dashed boxes around arrow connections)
   * @param {Interaction} interaction - Current interaction
   */
  #renderBindingIndicators(interaction) {
    // During resize-arrow: show dashed box for bindingId only
    if (interaction.type === 'resize-arrow' && interaction.bindingId) {
      const bindingElement = this.#state.persistent.elements[interaction.bindingId];
      if (bindingElement) {
        const bindingRect = Drawing.drawBindingIndicator(
          this.#references.svg,
          bindingElement
        );
        this.#references.ui.appendChild(bindingRect);
      }
    }
    // During adding-arrow: show binding indicators
    else if (interaction.type === 'adding-arrow') {
      if (interaction.step === 'placing-tail') {
        // Show potential source binding (current hover)
        if (interaction.source) {
          const sourceElement = this.#state.persistent.elements[interaction.source];
          if (sourceElement) {
            const bindingRect = Drawing.drawBindingIndicator(
              this.#references.svg,
              sourceElement
            );
            this.#references.ui.appendChild(bindingRect);
          }
        }
      } else if (interaction.step === 'placing-head') {
        // Show source binding (if set from placing tail)
        if (interaction.source) {
          const sourceElement = this.#state.persistent.elements[interaction.source];
          if (sourceElement) {
            const bindingRect = Drawing.drawBindingIndicator(
              this.#references.svg,
              sourceElement
            );
            this.#references.ui.appendChild(bindingRect);
          }
        }
        // Show target binding (current hover)
        if (interaction.target) {
          const targetElement = this.#state.persistent.elements[interaction.target];
          if (targetElement) {
            const bindingRect = Drawing.drawBindingIndicator(
              this.#references.svg,
              targetElement
            );
            this.#references.ui.appendChild(bindingRect);
          }
        }
      }
    }
    // During selection: show dashed boxes for arrow's source and target
    else if (interaction.type === 'selection' && interaction.elementIds.length === 1) {
      const selectedElement = this.#state.persistent.elements[interaction.elementIds[0]];
      if (selectedElement && selectedElement.type === 'arrow') {
        this.#renderArrowBindings(selectedElement);
      }
    }
  }

  /**
   * Render binding indicators for an arrow's source and target
   * @param {Arrow} arrow - Arrow element
   */
  #renderArrowBindings(arrow) {
    const bindingIds = [];
    if (arrow.source) {
      bindingIds.push(arrow.source);
    }
    if (arrow.target) {
      bindingIds.push(arrow.target);
    }

    for (const bindingId of bindingIds) {
      const bindingElement = this.#state.persistent.elements[bindingId];
      if (bindingElement) {
        const bindingRect = Drawing.drawBindingIndicator(
          this.#references.svg,
          bindingElement,
        );
        this.#references.ui.appendChild(bindingRect);
      }
    }
  }

  /**
   * Render live selection box during active drag
   * @param {Interaction} interaction - Current interaction
   */
  #renderLiveSelectionBox(interaction) {
    // Only render during active selection box drag
    if (interaction.type !== 'selection' || !this.#state.ephemeral.down || this.#state.ephemeral.viewX === null || this.#state.ephemeral.viewY === null) {
      return;
    }

    // Convert selection box corners from view to world coordinates
    const start = Coordinates.viewToWorld(
      interaction.startViewX,
      interaction.startViewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );
    const current = Coordinates.viewToWorld(
      this.#state.ephemeral.viewX,
      this.#state.ephemeral.viewY,
      this.#state.persistent.scene,
      this.#kx,
      this.#ky
    );

    // Calculate normalized selection box in world coordinates
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);
    const width = x2 - x1;
    const height = y2 - y1;

    // Create selection box rectangle
    const selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selectionBox.setAttribute('x', String(x1));
    selectionBox.setAttribute('y', String(y1));
    selectionBox.setAttribute('width', String(width));
    selectionBox.setAttribute('height', String(height));
    selectionBox.setAttribute('fill', 'rgba(59, 130, 246, 0.1)'); // Light blue fill
    selectionBox.setAttribute('stroke', '#4A9EFF'); // Blue stroke
    selectionBox.setAttribute('stroke-width', '1');
    selectionBox.setAttribute('stroke-dasharray', '4 4'); // Dashed outline

    this.#references.ui.appendChild(selectionBox);
  }

  /**
   * Render a single element (helper for incremental rendering)
   * @param {Element} element - Element to render
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
   */
  #renderElement(element, ignored, raw, invalid, keyed) {
    // Draw the element (shape, arrow, or text) - labels are now embedded in the returned node
    const node = Drawing.drawElement(this.#references.svg, element, ignored, raw, invalid, keyed, this.#state.persistent.domain, this.#state.persistent.elements);
    node.setAttribute('data-id', element.id);

    // All elements go in content layer
    this.#references.content.appendChild(node);
  }

  /**
   * Mark world transform as invalid (pan/zoom changes)
   */
  #invalidateWorld() {
    this.#invalidWorld = true;
    this.#invalidate();
  }

  /**
   * Mark content as invalid (elements added/removed/updated)
   */
  #invalidateContent() {
    this.#invalidContent = true;
    this.#invalidate();
  }

  /**
   * Mark UI as invalid (selection handles, binding indicators need update)
   */
  #invalidateUi() {
    this.#invalidUi = true;
    this.#invalidate();
  }

  /**
   * Mark cursor as invalid (cursor style needs update)
   */
  #invalidateCursor() {
    this.#invalidCursor = true;
    this.#invalidate();
  }

  /**
   * Mark preview as invalid (preview element needs update)
   */
  #invalidatePreview() {
    this.#invalidPreview = true;
    this.#invalidate();
  }

  /**
   * Mark edit mode as invalid (edit mode state needs update)
   */
  #invalidateEdit() {
    this.#invalidEdit = true;
    this.#invalidate();
  }

  /**
   * Mark domain input as invalid (domain input value needs update)
   */
  #invalidateDomain() {
    this.#invalidDomain = true;
    this.#invalidate();
  }

  /**
   * Mark all rendering systems as invalid (used when importing new state)
   */
  #invalidateAll() {
    this.#invalidWorld = true;
    this.#invalidContent = true;
    this.#invalidUi = true;
    this.#invalidCursor = true;
    this.#invalidPreview = true;
    this.#invalidEdit = true;
    this.#invalidDomain = true;
    this.#invalidate();
  }

  async #invalidate() {
    if (!this.#invalid) {
      this.#invalid = true;
      await Promise.resolve();
      this.#invalid = false;
      this.render();
    }
  }
}

customElements.define('upper-doodle', UpperDoodle);
