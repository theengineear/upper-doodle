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
    /**
     * Compute scale factor from wheel event
     * @param {WheelEvent} event - Wheel event
     * @returns {number} Scale factor (dk)
     */
    static "__#private@#computeWheelZoom"(event: WheelEvent): number;
    /**
     * Recursively sort object keys according to canonical ordering rules
     * @param {any} value - Value to canonicalize
     * @returns {any} Value with sorted keys
     */
    static "__#private@#canonicalizeValue"(value: any): any;
    /**
     * Convert a full state object to canonical JSON string (internal use)
     * @param {StateShape} state - Full state object
     * @returns {string} Canonical JSON string
     */
    static _valueFromObject(state: StateShape): string;
    /**
     * Convert a JSON string to canonical JSON string for full state (internal use)
     * Parses the input, validates it, and re-serializes in canonical form
     * @param {string} json - JSON string to canonicalize
     * @returns {string} Canonical JSON string
     * @throws {TypeError} If JSON is invalid
     */
    static _valueFromJSON(json: string): string;
    /**
     * Convert a document object to canonical JSON string
     * @param {Object} obj - Document object with prefixes, domain, elements, and nTriples
     * @param {Object.<string, string>} obj.prefixes - Prefix mappings
     * @param {string} obj.domain - Default domain prefix
     * @param {Object.<string, Element>} obj.elements - Elements map
     * @param {string} obj.nTriples - Custom N-Triples document
     * @returns {string} Canonical JSON string
     */
    static valueFromObject(obj: {
        prefixes: {
            [x: string]: string;
        };
        domain: string;
        elements: {
            [x: string]: Element;
        };
        nTriples: string;
    }): string;
    /**
     * Convert a JSON string to canonical JSON string
     * Parses the input, validates it, and re-serializes in canonical form
     * @param {string} json - JSON string to canonicalize
     * @returns {string} Canonical JSON string
     * @throws {TypeError} If JSON is invalid
     */
    static valueFromJSON(json: string): string;
    /**
     * Called when component is connected to DOM
     */
    connectedCallback(): void;
    /**
     * Called when component is disconnected from DOM
     */
    disconnectedCallback(): void;
    /**
     * Zoom with two touch points (pinch gesture)
     * @param {number} viewX1 - First touch point X coordinate
     * @param {number} viewY1 - First touch point Y coordinate
     * @param {number} viewX2 - Second touch point X coordinate
     * @param {number} viewY2 - Second touch point Y coordinate
     */
    _zoom(viewX1: number, viewY1: number, viewX2: number, viewY2: number): void;
    /**
     * Pan with two touch points
     * @param {number} viewX1 - First touch point X coordinate
     * @param {number} viewY1 - First touch point Y coordinate
     * @param {number} viewX2 - Second touch point X coordinate
     * @param {number} viewY2 - Second touch point Y coordinate
     */
    _pan(viewX1: number, viewY1: number, viewX2: number, viewY2: number): void;
    /**
     * Create a new element
     * @param {string} type - Element type (rectangle, diamond, arrow, text)
     * @returns {string} UUID of the element that will be created
     */
    _create(type: string): string;
    /**
     * Enter planting mode (click on a diamond to make it a tree root)
     */
    _plant(): void;
    /**
     * Pointer down at view coordinates
     * @param {number} viewX - View X coordinate
     * @param {number} viewY - View Y coordinate
     */
    _down(viewX: number, viewY: number): void;
    /**
     * Move pointer to view coordinates
     * @param {number} viewX - View X coordinate
     * @param {number} viewY - View Y coordinate
     */
    _move(viewX: number, viewY: number): void;
    /**
     * Pointer up (end current interaction)
     */
    _up(): void;
    /**
     * Cancel current interaction (e.g., on blur/focus loss)
     * Clears all interaction state without committing changes
     */
    _cancel(): void;
    /**
     * Finish current interaction, committing any pending changes
     * Similar to _cancel but commits unfinished edits before clearing
     */
    _finish(): void;
    /**
     * Delete currently selected elements
     */
    _delete(): void;
    /**
     * Copy currently selected elements to clipboard as JSON
     * @returns {Promise<void>}
     */
    _copy(): Promise<void>;
    /**
     * Paste from clipboard - creates elements or text based on clipboard content
     * @returns {Promise<void>}
     */
    _paste(): Promise<void>;
    /**
     * Enter edit mode for currently selected element
     */
    _edit(): void;
    /**
     * Overwrite text value of currently edited element
     * @param {string} newText - New text value
     */
    _overwrite(newText: string): void;
    /**
     * Update the domain
     * @param {string} newDomain - New domain value
     */
    _domain(newDomain: string): void;
    /**
     * Return best match (or null) at a given set of view coordinates
     * @param {number} viewX - View X coordinate
     * @param {number} viewY - View Y coordinate
     * @returns {({ id: string, feature: 'element'|'handle-head'|'handle-tail'|'handle-ne'|'handle-se'|'handle-sw'|'handle-nw'|'branch'})|null} - the UUID of the element and specific hit feature
     */
    _hit(viewX: number, viewY: number): ({
        id: string;
        feature: "element" | "handle-head" | "handle-tail" | "handle-ne" | "handle-se" | "handle-sw" | "handle-nw" | "branch";
    }) | null;
    render(): void;
    /**
     * Set document value (prefixes, domain, elements, nTriples from canonical JSON string)
     * @param {string} value - Canonical JSON string
     * @throws {TypeError} If value is not canonical or invalid
     */
    set value(value: string);
    /**
     * Get canonical document value (prefixes, domain, elements, nTriples as JSON string)
     * @returns {string} Canonical JSON string
     */
    get value(): string;
    /**
     * Get document value as parsed object
     * @returns {{ prefixes: Object.<string, string>, domain: string, elements: Object.<string, Element>, nTriples: string }}
     */
    get valueAsObject(): {
        prefixes: {
            [x: string]: string;
        };
        domain: string;
        elements: {
            [x: string]: Element;
        };
        nTriples: string;
    };
    /**
     * Get document value as N-Triples format
     * @returns {string} N-Triples string
     */
    get valueAsNTriples(): string;
    /**
     * Get document value as Turtle format
     * @returns {string} Turtle string
     */
    get valueAsTurtle(): string;
    /**
     * Set full state from canonical JSON string (internal use)
     * @param {string} value - Canonical JSON string
     * @throws {TypeError} If value is not canonical or invalid
     */
    set _value(value: string);
    /**
     * Get full state as canonical JSON string (internal use)
     * @returns {string} Canonical JSON string
     */
    get _value(): string;
    /**
     * Get full state as parsed object (internal use)
     * @returns {StateShape}
     */
    get _valueAsObject(): StateShape;
    /**
     * Get document value as N-Triples format (internal use, delegates to public)
     * @returns {string} N-Triples string
     */
    get _valueAsNTriples(): string;
    /**
     * Get document value as Turtle format (internal use, delegates to public)
     * @returns {string} Turtle string
     */
    get _valueAsTurtle(): string;
    /**
     * Recalculate aspect ratio correction based on current SVG dimensions.
     * Call this method when the component is resized.
     */
    resize(): void;
    #private;
}
export type Element = import("./utils/types.js").Element;
export type Elements = import("./utils/types.js").Elements;
export type Rectangle = import("./utils/types.js").Rectangle;
export type Diamond = import("./utils/types.js").Diamond;
export type Arrow = import("./utils/types.js").Arrow;
export type StateShape = import("./utils/types.js").StateShape;
export type Interaction = import("./utils/types.js").Interaction;
export type AddingInteraction = import("./utils/types.js").AddingInteraction;
export type AddingArrowInteraction = import("./utils/types.js").AddingArrowInteraction;
export type PlantingInteraction = import("./utils/types.js").PlantingInteraction;
export type MoveInteraction = import("./utils/types.js").MoveInteraction;
export type SelectionInteraction = import("./utils/types.js").SelectionInteraction;
export type ResizeArrowInteraction = import("./utils/types.js").ResizeArrowInteraction;
export type ResizeBoxInteraction = import("./utils/types.js").ResizeBoxInteraction;
export type ViewTransform = import("./utils/types.js").ViewTransform;
export type References = {
    container: HTMLDivElement;
    focus: HTMLButtonElement;
    tools: HTMLDivElement;
    domain: HTMLInputElement;
    diamond: HTMLButtonElement;
    rectangle: HTMLButtonElement;
    arrow: HTMLButtonElement;
    tree: HTMLButtonElement;
    svg: SVGSVGElement;
    world: SVGGElement;
    content: SVGGElement;
    ui: SVGGElement;
    form: HTMLFormElement;
    textarea: HTMLTextAreaElement;
};
