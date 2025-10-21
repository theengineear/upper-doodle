/**
 * @fileoverview Type definitions and constants for upper-doodle component
 */

/**
 * Valid element types
 * @type {ReadonlyArray<'rectangle' | 'diamond' | 'arrow' | 'text' | 'tree'>}
 */
export const ELEMENT_TYPES = ['rectangle', 'diamond', 'arrow', 'text', 'tree'];

/**
 * Valid upper predicates from diamond element to text element.
 * @type {ReadonlyArray<'upper:label' | 'upper:description'>}
 */
export const DIAMOND_TO_TEXT_PREDICATES = ['upper:label', 'upper:description'];

/**
 * @typedef {typeof DIAMOND_TO_TEXT_PREDICATES[number]} DiamondToTextPredicate
 */

/**
 * Valid class type abbreviations and their mapping to upper classes.
 * @type {{ DC: 'upper:DirectClass', SC: 'upper:SealedClass', E: 'upper:Enumeration', V: 'upper:EnumValue' }}
 */
export const TYPE_ABBREVIATIONS = {
  DC: 'upper:DirectClass',
  SC: 'upper:SealedClass',
  E: 'upper:Enumeration',
  V: 'upper:EnumValue',
};

/**
 * @typedef {keyof TYPE_ABBREVIATIONS} TypeAbbreviation
 */

/**
 * @typedef {Object} Diamond
 * @property {string} id - Unique element identifier (UUID)
 * @property {'diamond'} type - Element type
 * @property {number} x - X coordinate (top-left)
 * @property {number} y - Y coordinate (top-left)
 * @property {number} width - Width (can be negative during creation)
 * @property {number} height - Height (can be negative during creation)
 * @property {string} text - Text label content
 */

/**
 * @typedef {Object} Arrow
 * @property {string} id - Unique element identifier (UUID)
 * @property {'arrow'} type - Element type
 * @property {number} x1 - Start X coordinate
 * @property {number} y1 - Start Y coordinate
 * @property {number} x2 - End X coordinate
 * @property {number} y2 - End Y coordinate
 * @property {string} text - Text label content
 * @property {string|null} source - UUID of shape this arrow's tail is bound to
 * @property {string|null} target - UUID of shape this arrow's head is bound to
 */

/**
 * @typedef {Object} Tree
 * @property {string} id - Unique element identifier (UUID)
 * @property {'tree'} type - Element type
 * @property {string} root - The root element id (e.g., the enumeration)
 * @property {{ parent: string, element: string }[]} items - List of items, parent and element are existing element ids.
 */

/**
 * @typedef {Object} Rectangle
 * @property {string} id - Unique element identifier (UUID)
 * @property {'rectangle'} type - Element type
 * @property {number} x - X coordinate (top-left)
 * @property {number} y - Y coordinate (top-left)
 * @property {number} width - Width (can be negative during creation)
 * @property {number} height - Height (can be negative during creation)
 * @property {string} text - Text label content
 */

/**
 * @typedef {Object} Text
 * @property {string} id - Unique element identifier (UUID)
 * @property {'text'} type - Element type
 * @property {number} x - X coordinate (top-left)
 * @property {number} y - Y coordinate (top-left)
 * @property {string} text - Text content
 */

/**
 * @typedef {Diamond|Arrow|Rectangle|Text|Tree} Element
 */

/**
 * @typedef {{ [key: string]: Element }} Elements
 */

/**
 * @typedef {Object} MoveInteraction
 * @property {'move'} type - Interaction type
 * @property {string[]} elementIds - IDs of elements being moved
 * @property {number} startViewX - Starting view X coordinate
 * @property {number} startViewY - Starting view Y coordinate
 * @property {Object.<string, {x?: number, y?: number, x1?: number, y1?: number, x2?: number, y2?: number}>} startPositions - Original positions of elements being moved
 */

/**
 * @typedef {Object} SelectionInteraction
 * @property {'selection'} type - Interaction type
 * @property {string[]} elementIds - IDs of selected elements
 * @property {number} startViewX - Starting view X coordinate
 * @property {number} startViewY - Starting view Y coordinate
 */

/**
 * @typedef {Object} ResizeBoxInteraction
 * @property {'resize-box'} type - Interaction type
 * @property {string} elementId - ID of element being resized
 * @property {'nw'|'ne'|'se'|'sw'} handle - Which corner handle is being dragged
 * @property {number} startViewX - Starting view X coordinate
 * @property {number} startViewY - Starting view Y coordinate
 * @property {number} startX - Element's starting X coordinate
 * @property {number} startY - Element's starting Y coordinate
 * @property {number} startWidth - Element's starting width
 * @property {number} startHeight - Element's starting height
 */

/**
 * @typedef {Object} ResizeArrowInteraction
 * @property {'resize-arrow'} type - Interaction type
 * @property {string} elementId - ID of arrow being resized
 * @property {'tail'|'head'} handle - Which end of the arrow is being dragged
 * @property {number} startViewX - Starting view X coordinate
 * @property {number} startViewY - Starting view Y coordinate
 * @property {number} startX1 - Arrow's starting x1 coordinate
 * @property {number} startY1 - Arrow's starting y1 coordinate
 * @property {number} startX2 - Arrow's starting x2 coordinate
 * @property {number} startY2 - Arrow's starting y2 coordinate
 * @property {string|null} [bindingId] - ID of element being hovered for binding
 */

/**
 * @typedef {Object} EditInteraction
 * @property {'edit'} type - Interaction type
 * @property {string} elementId - ID of element being edited
 */

/**
 * @typedef {Object} AddingInteraction
 * @property {'adding'} type - Interaction type
 * @property {Element} element - Preview element being added (for single element)
 * @property {Element[]} [elements] - Multiple preview elements (for multi-element paste)
 * @property {{ x: number, y: number }} [groupCenter] - Center point of element group (for multi-element paste)
 */

/**
 * @typedef {Object} AddingArrowInteraction
 * @property {'adding-arrow'} type - Interaction type
 * @property {string} arrowId - UUID of arrow being created
 * @property {'placing-tail'|'placing-head'} step - Current step in arrow creation
 * @property {number|null} x1 - Tail X coordinate (null in placing-tail step)
 * @property {number|null} y1 - Tail Y coordinate (null in placing-tail step)
 * @property {string|null} source - Source element ID (binding target)
 * @property {string|null} target - Target element ID (binding target)
 */

/**
 * @typedef {Object} PlantingInteraction
 * @property {'planting'} type - Interaction type
 */

/**
 * @typedef {Object} ZoomInteraction
 * @property {'zoom'} type - Interaction type
 * @property {number} startViewX1 - First touch point starting view X coordinate
 * @property {number} startViewY1 - First touch point starting view Y coordinate
 * @property {number} startViewX2 - Second touch point starting view X coordinate
 * @property {number} startViewY2 - Second touch point starting view Y coordinate
 * @property {number} startDistance - Starting distance between touch points
 * @property {ViewTransform} startScene - Scene state at interaction start
 */

/**
 * @typedef {Object} PanInteraction
 * @property {'pan'} type - Interaction type
 * @property {number} startViewX1 - First touch point starting view X coordinate
 * @property {number} startViewY1 - First touch point starting view Y coordinate
 * @property {number} startViewX2 - Second touch point starting view X coordinate
 * @property {number} startViewY2 - Second touch point starting view Y coordinate
 * @property {number} startMidpointX - Starting midpoint X coordinate
 * @property {number} startMidpointY - Starting midpoint Y coordinate
 * @property {ViewTransform} startScene - Scene state at interaction start
 */

/**
 * @typedef {MoveInteraction|SelectionInteraction|ResizeBoxInteraction|ResizeArrowInteraction|EditInteraction|AddingInteraction|AddingArrowInteraction|PlantingInteraction|ZoomInteraction|PanInteraction} Interaction
 */

/**
 * @typedef {Object} ViewTransform
 * @property {number} x - Pan X offset
 * @property {number} y - Pan Y offset
 * @property {number} k - Scale factor
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} x - Left edge X coordinate
 * @property {number} y - Top edge Y coordinate
 * @property {number} width - Width
 * @property {number} height - Height
 */

/**
 * Persistent state that gets saved in undo/redo history
 * @typedef {Object} PersistentState
 * @property {Prefixes} prefixes - Prefix mappings for namespace URIs
 * @property {string} domain - Default domain prefix for new elements
 * @property {Object.<string, Element>} elements - Object mapping element IDs to elements
 * @property {ViewTransform} scene - Scene/viewport transform (pan and zoom)
 */

/**
 * Ephemeral state that is NOT saved in undo/redo history
 * @typedef {Object} EphemeralState
 * @property {number|null} viewX - Current pointer view X coordinate (null if not tracking)
 * @property {number|null} viewY - Current pointer view Y coordinate (null if not tracking)
 * @property {boolean} down - Is pointer currently down
 * @property {Interaction|null} interaction - Current interaction state (selection, move, etc.)
 */

/**
 * Complete application state (persistent + ephemeral)
 * @typedef {Object} StateShape
 * @property {PersistentState} persistent - State that gets saved in undo/redo
 * @property {EphemeralState} ephemeral - State that is NOT saved in undo/redo
 */

/** @typedef {{ [key: string]: string }} Prefixes */
