/**
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Elements} Elements
 * @typedef {import('./types.js').Tree} Tree
 */
/**
 * Drawing utilities for rendering elements with rough.js
 */
export class Drawing {
    /** Padding around text for background rectangles and bounding boxes (in pixels) */
    static "__#private@#TEXT_PADDING": number;
    /** Minimum shape dimensions to prevent rough.js errors (in pixels) */
    static "__#private@#MIN_SHAPE_SIZE": number;
    /**
     * Generate a simple numeric hash from a UUID string for use as rough.js seed
     * @param {string} uuid - UUID string
     * @returns {number} Hash value
     */
    static "__#private@#hashUUID"(uuid: string): number;
    /**
     * Check if a shape element is external (different domain prefix)
     * @param {Element} element - Element to check
     * @param {string} domain - Current domain
     * @returns {boolean} True if element is external
     */
    static "__#private@#isExternal"(element: Element, domain: string): boolean;
    /**
     * Check if only position/size changed (common during dragging)
     * @param {Element} element - New element state
     * @param {Element} prevElement - Previous element state
     * @returns {boolean} True if only geometry changed
     */
    static "__#private@#isGeometryOnlyChange"(element: Element, prevElement: Element): boolean;
    /**
     * Get bounding box from element coordinates
     * @param {SVGSVGElement | null} svg - SVG element for accurate text measurement (null for approximate measurement)
     * @param {Element} element - Element with coordinates
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box with positive dimensions
     */
    static getBoundingBox(svg: SVGSVGElement | null, element: Element): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Draw element based on type (rectangle, diamond, arrow, text, tree)
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {Element} element - Element to draw
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} raw - Set of raw element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
     * @param {string} domain - Current domain for checking external elements
     * @param {Elements} elements - All elements (needed for tree rendering)
     * @returns {SVGElement} The drawn SVG element
     */
    static drawElement(svg: SVGSVGElement, element: Element, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, keyed: Set<string>, domain: string, elements?: Elements): SVGElement;
    /**
     * Update an existing element in place (helper for incremental rendering)
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {Element} element - Element to update
     * @param {Element} prevElement - Previous element state
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} raw - Set of raw element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
     * @param {string} domain - Current domain for checking external elements
     * @param {Elements} elements - All elements (needed for tree rendering)
     */
    static updateElement(svg: SVGSVGElement, element: Element, prevElement: Element, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, keyed: Set<string>, domain: string, elements?: Elements): void;
    /**
     * Draw selection UI for an element
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {Element} element - Element to draw selection for
     * @returns {{handleTail?: SVGElement, handleHead?: SVGElement, outline?: SVGElement, handleNw?: SVGElement, handleNe?: SVGElement, handleSe?: SVGElement, handleSw?: SVGElement}} Selection UI elements
     */
    static drawSelection(svg: SVGSVGElement, element: Element): {
        handleTail?: SVGElement;
        handleHead?: SVGElement;
        outline?: SVGElement;
        handleNw?: SVGElement;
        handleNe?: SVGElement;
        handleSe?: SVGElement;
        handleSw?: SVGElement;
    };
    /**
     * Draw binding indicator (dashed box around bindable element)
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {Element} element - Element to draw binding indicator for
     * @returns {SVGElement} Binding indicator element
     */
    static drawBindingIndicator(svg: SVGSVGElement, element: Element): SVGElement;
    /**
     * Create label text element (for embedding in shape groups)
     * @param {SVGSVGElement} svg - SVG element for measuring (needed for getBBox)
     * @param {Element} element - Element to label
     * @returns {SVGGElement} Group element with class="label" containing text (and optional background rect for arrows)
     */
    static "__#private@#createLabelText"(svg: SVGSVGElement, element: Element): SVGGElement;
    /**
     * Create text label for element (deprecated - used only during preview)
     * @param {Element} element - Element to label
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @returns {SVGGElement} Group element containing text (and background rect for arrows)
     * @deprecated Use #createLabelText instead
     */
    static createLabel(element: Element, ignored: Set<string>, invalid: Set<string>): SVGGElement;
    /**
     * Get bounding box for arrow element
     * @param {import('./types.js').Arrow} element - Arrow element with x1/y1/x2/y2
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box
     */
    static "__#private@#getArrowBoundingBox"(element: import("./types.js").Arrow): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Get bounding box for text element
     * @param {import('./types.js').Text} element - Text element with x/y
     * @param {SVGSVGElement | null} svg - SVG element for measuring text (null for approximate)
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box
     */
    static "__#private@#getTextBoundingBox"(element: import("./types.js").Text, svg: SVGSVGElement | null): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Get bounding box for shape element (rectangle, diamond)
     * @param {import('./types.js').Rectangle | import('./types.js').Diamond} element - Shape element with x/y/w/h
     * @returns {{x: number, y: number, width: number, height: number}} Bounding box with positive dimensions
     */
    static "__#private@#getShapeBoundingBox"(element: import("./types.js").Rectangle | import("./types.js").Diamond): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Create rounded rectangle path
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {string} SVG path string
     */
    static createRoundedRectPath(x: number, y: number, width: number, height: number): string;
    /**
   * Create circle path using SVG arc commands
   * @param {number} cx - Center x coordinate
   * @param {number} cy - Center y coordinate
   * @param {number} diameter - Circle diameter
   * @returns {string} SVG path string
   */
    static createCirclePath(cx: number, cy: number, diameter: number): string;
    /**
     * Create arrow path with arrowhead
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {number} headLength - Arrowhead length
     * @returns {string} SVG path string
     */
    static "__#private@#createArrowPath"(x1: number, y1: number, x2: number, y2: number, headLength?: number): string;
    /**
     * Normalize a vector to unit length
     * @param {{x: number, y: number}} vector - Vector to normalize
     * @returns {{x: number, y: number}} Normalized vector
     */
    static "__#private@#normalize"(vector: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
    /**
     * Create rounded diamond path
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} w - Width
     * @param {number} h - Height
     * @returns {string} SVG path string
     */
    static "__#private@#createRoundedDiamondPath"(x: number, y: number, w: number, h: number): string;
    /**
     * Draw rectangle element
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {import('./types.js').Rectangle} element - Rectangle element
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} raw - Set of raw element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {string} domain - Current domain for checking external elements
     * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
     */
    static "__#private@#drawRectangle"(svg: SVGSVGElement, element: import("./types.js").Rectangle, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, domain: string): SVGElement;
    /**
   * Draw diamond element
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {import('./types.js').Diamond} element - Diamond element
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
   * @param {string} domain - Current domain for checking external elements
   * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
   */
    static "__#private@#drawDiamond"(svg: SVGSVGElement, element: import("./types.js").Diamond, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, keyed: Set<string>, domain: string): SVGElement;
    /**
     * Draw arrow element
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {import('./types.js').Arrow} element - Arrow element with x1, y1, x2, y2
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} raw - Set of raw element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {string} _domain - Current domain for checking external elements (unused for arrows)
     * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
     */
    static "__#private@#drawArrow"(svg: SVGSVGElement, element: import("./types.js").Arrow, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, _domain: string): SVGElement;
    /**
     * Draw text element
     * @param {import('./types.js').Text} element - Text element to draw
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} raw - Set of raw element IDs
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {string} _domain - Current domain for checking external elements (unused for text)
     * @returns {SVGGElement} Group element containing background rect and text
     */
    static "__#private@#drawText"(element: import("./types.js").Text, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, _domain: string): SVGGElement;
    /**
     * Draw tree branch lines connecting parent to children
     * @param {SVGSVGElement} svg - SVG element to draw on
     * @param {Tree} tree - Tree element to draw
     * @param {Set<string>} ignored - Set of ignored element IDs
     * @param {Set<string>} _raw - Set of raw element IDs (unused for trees)
     * @param {Set<string>} invalid - Set of invalid element IDs
     * @param {string} _domain - Current domain for checking external elements (unused for trees)
     * @param {Elements} elements - All elements in diagram
     * @returns {SVGElement} Group containing tree branch paths
     */
    static "__#private@#drawTree"(svg: SVGSVGElement, tree: Tree, ignored: Set<string>, _raw: Set<string>, invalid: Set<string>, _domain: string, elements: Elements): SVGElement;
    /**
     * Compute tree layout positions.
     * Returns an object mapping element IDs to {x, y} positions.
     * Includes both the root element and all child elements.
     * @param {Elements} elements - All elements in the diagram
     * @param {Tree} tree - The tree element
     * @param {number} verticalGap - How much space between elements vertically
     * @param {number} horizontalGap - How much space between elements horizontally
     * @returns {{[key: string]: {x: number, y: number}}} Object mapping element IDs to positions
     */
    static layoutTree(elements: Elements, tree: Tree, verticalGap: number, horizontalGap: number): {
        [key: string]: {
            x: number;
            y: number;
        };
    };
    /**
     * Get direct children of an element in a tree.
     * @param {Tree} tree - The tree element
     * @param {string} parentId - ID of the parent element (can be root or item)
     * @returns {string[]} Array of child element IDs
     */
    static "__#private@#getTreeChildren"(tree: Tree, parentId: string): string[];
}
export type Element = import("./types.js").Element;
export type Elements = import("./types.js").Elements;
export type Tree = import("./types.js").Tree;
