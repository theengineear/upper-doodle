/**
 * Validation helper class for UpperDoodle
 */
export class Validate {
    /**
     * Validates a value's existence
     * @template T
     * @param {T} value - Value to validate is defined
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts value is NonNullable<T>}
     */
    static defined<T>(value: T, name?: string): asserts value is NonNullable<T>;
    /**
     * Validates a coordinate value
     * @param {unknown} coordinate - Value to validate as a coordinate
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts coordinate is number}
     */
    static coordinate(coordinate: unknown, name?: string): asserts coordinate is number;
    /**
     * Validates a coordinate delta value
     * @param {unknown} coordinateDelta - Value to validate as a coordinate delta
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts coordinateDelta is number}
     */
    static coordinateDelta(coordinateDelta: unknown, name?: string): asserts coordinateDelta is number;
    /**
     * Validates a scale factor value
     * @param {unknown} scaleFactor - Value to validate as a scale factor
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts scaleFactor is number}
     */
    static scaleFactor(scaleFactor: unknown, name?: string): asserts scaleFactor is number;
    /**
     * Validates a string value
     * @param {unknown} value - Value to validate as a string
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts value is string}
     */
    static string(value: unknown, name?: string): asserts value is string;
    /**
     * Validates a key string
     * @param {unknown} key - Value to validate as a key
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts key is string}
     */
    static key(key: unknown, name?: string): asserts key is string;
    /**
     * Validates an element object
     * @param {unknown} element - Value to validate as an element
     * @param {string} [name] - Name to use in error messages
     * @returns {asserts element is Element}
     */
    static element(element: unknown, name?: string): asserts element is Element;
    /**
     * Validates an elements object (map of id to element)
     * @param {unknown} elements - Value to validate as an elements object
     * @returns {asserts elements is Record<string, Element>}
     */
    static elements(elements: unknown): asserts elements is Record<string, Element>;
    /**
     * Validates a scene/view transform object
     * @param {unknown} scene - Value to validate as a scene object
     * @returns {asserts scene is ViewTransform}
     */
    static scene(scene: unknown): asserts scene is ViewTransform;
    /**
     * Validates an element type string
     * @param {unknown} type - Value to validate as an element type
     * @returns {asserts type is 'rectangle' | 'diamond' | 'arrow' | 'text' | 'tree'}
     */
    static elementType(type: unknown): asserts type is "rectangle" | "diamond" | "arrow" | "text" | "tree";
    /**
     * Validates that a predicate is a known diamond-to-text predicate type
     * @param {unknown} predicate - Value to validate as a diamond-to-text predicate
     * @returns {asserts predicate is import('./types.js').DiamondToTextPredicate}
     */
    static isDiamondToTextPredicate(predicate: unknown): asserts predicate is import("./types.js").DiamondToTextPredicate;
    /**
     * Validates that a type abbreviation is a known type-abbreviation type
     * @param {unknown} abbv - Value to validate as a type-abbreviation
     * @returns {asserts abbv is import('./types.js').TypeAbbreviation}
     */
    static isTypeAbbreviation(abbv: unknown): asserts abbv is import("./types.js").TypeAbbreviation;
    /**
     * Type guard that validates an element has a specific type
     * @template {Element['type']} T
     * @param {Element} element - Element to validate
     * @param {T} expectedType - Expected element type
     * @returns {asserts element is Extract<Element, {type: T}>}
     */
    static hasElementType<T extends Element["type"]>(element: Element, expectedType: T): asserts element is Extract<Element, {
        type: T;
    }>;
    /**
     * Validates a view X coordinate (number or null)
     * @param {unknown} viewX - Value to validate as viewX
     * @returns {asserts viewX is number | null}
     */
    static viewX(viewX: unknown): asserts viewX is number | null;
    /**
     * Validates a view Y coordinate (number or null)
     * @param {unknown} viewY - Value to validate as viewY
     * @returns {asserts viewY is number | null}
     */
    static viewY(viewY: unknown): asserts viewY is number | null;
    /**
     * Validates a boolean down state
     * @param {unknown} down - Value to validate as a boolean
     * @returns {asserts down is boolean}
     */
    static down(down: unknown): asserts down is boolean;
    /**
     * Validates an interaction object
     * @param {unknown} interaction - Value to validate as an interaction
     * @returns {asserts interaction is Interaction | null}
     */
    static interaction(interaction: unknown): asserts interaction is Interaction | null;
    /**
     * Validates a prefixes object (map of prefix to URI)
     * @param {unknown} prefixes - Value to validate as prefixes
     * @returns {asserts prefixes is Record<string, string>}
     */
    static prefixes(prefixes: unknown): asserts prefixes is Record<string, string>;
    /**
     * Validates a domain string
     * @param {unknown} domain - Value to validate as domain
     * @returns {asserts domain is string}
     */
    static domain(domain: unknown): asserts domain is string;
    /**
     * Canonicalizes an N-Triples string by:
     * - Trimming leading/trailing whitespace from each line
     * - Removing empty lines
     * - Removing comment lines (starting with #)
     * - Sorting lines alphabetically
     * - Adding final newline if non-empty
     * @param {string} nTriples - N-Triples string to canonicalize
     * @returns {string} Canonicalized N-Triples string
     */
    static canonicalizeNTriples(nTriples: string): string;
    /**
     * Validates an N-Triples string
     * @param {unknown} nTriples - Value to validate as N-Triples
     * @returns {asserts nTriples is string}
     */
    static nTriples(nTriples: unknown): asserts nTriples is string;
    /**
     * Validates a document object (prefixes, domain, elements, nTriples)
     * @param {unknown} doc - Value to validate as document
     * @returns {asserts doc is { prefixes: Record<string, string>, domain: string, elements: Record<string, Element>, nTriples: string }}
     */
    static document(doc: unknown): asserts doc is {
        prefixes: Record<string, string>;
        domain: string;
        elements: Record<string, Element>;
        nTriples: string;
    };
    /**
     * Validates a complete state object
     * @param {unknown} state - Value to validate as a state
     * @returns {asserts state is StateShape}
     */
    static state(state: unknown): asserts state is StateShape;
    /**
     * Validates an event is of a specific type
     * @template {Event} T
     * @param {Event} event - The event to check
     * @param {new (...args: any[]) => T} EventType - The expected event constructor
     * @returns {asserts event is T}
     */
    static eventType<T extends Event>(event: Event, EventType: new (...args: any[]) => T): asserts event is T;
    /**
     * Exhaustiveness check helper - forces TypeScript to ensure all cases are handled
     * @param {never} value - Should be unreachable if all cases handled
     * @returns {never}
     */
    static unreachable(value: never): never;
}
export type Element = import("./types.js").Element;
export type Arrow = import("./types.js").Arrow;
export type Diamond = import("./types.js").Diamond;
export type Rectangle = import("./types.js").Rectangle;
export type Text = import("./types.js").Text;
export type Tree = import("./types.js").Tree;
export type ViewTransform = import("./types.js").ViewTransform;
export type Interaction = import("./types.js").Interaction;
export type StateShape = import("./types.js").StateShape;
