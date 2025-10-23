/**
 * Static class for generating RDF triples from diagram elements
 */
export class Triples {
    static "__#private@#RECTANGLE_TEXT_PATTERN": RegExp;
    static "__#private@#DIAMOND_TEXT_PATTERN": RegExp;
    static "__#private@#DIAMOND_TO_DIAMOND_ARROW_PATTERN": RegExp;
    static "__#private@#DIAMOND_TO_RECTANGLE_ARROW_PATTERN": RegExp;
    static "__#private@#DIAMOND_TO_TEXT_ARROW_PATTERN": RegExp;
    static "__#private@#CURIE_PATTERN": RegExp;
    static "__#private@#PLAIN_LITERAL_PATTERN": RegExp;
    static "__#private@#LANGUAGE_LITERAL_PATTERN": RegExp;
    static "__#private@#DATATYPE_LITERAL_PATTERN": RegExp;
    /**
     * Escape special characters in a literal string for N-Triples format.
     * According to N-Triples spec: https://www.w3.org/TR/n-triples/#grammar-production-STRING_LITERAL_QUOTE
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
     */
    static "__#private@#escapeNTriplesLiteral"(str: string): string;
    /**
     * Validates RDF literal syntax
     * @param {string} text - Text to validate as literal
     * @returns {boolean} True if valid literal syntax
     */
    static "__#private@#isValidLiteral"(text: string): boolean;
    /**
     * Checks if an element is external (prefix doesn't match domain)
     * @param {Diamond | Rectangle} element - Element to check
     * @param {string} domain - Current domain prefix
     * @returns {boolean} True if element is external
     */
    static "__#private@#isExternal"(element: Diamond | Rectangle, domain: string): boolean;
    /**
     * Resolves a CURIE string to a full URI
     * @param {string} domain - Domain prefix to use when no prefix is specified
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used (mutated to track usage)
     * @param {string} text - CURIE text to resolve
     * @returns {ResolvedCurie | undefined}
     */
    static "__#private@#resolveCurie"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, text: string): ResolvedCurie | undefined;
    /**
     * Resolves a rectangle element to RDF terms
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Rectangle} element - Rectangle element to resolve
     * @returns {ResolvedRectangle | undefined}
     */
    static "__#private@#resolveRectangle"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Rectangle): ResolvedRectangle | undefined;
    /**
     * Resolves a diamond element to RDF terms
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Diamond} element - Diamond element to resolve
     * @returns {ResolvedDiamond | undefined}
     */
    static "__#private@#resolveDiamond"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Diamond): ResolvedDiamond | undefined;
    /**
     * Resolves a diamond → diamond arrow element to RDF terms
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to resolve
     * @returns {ResolvedArrow | undefined}
     */
    static "__#private@#resolveDiamondToDiamondArrow"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow): ResolvedArrow | undefined;
    /**
     * Resolves a diamond → rectangle arrow element to RDF terms
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to resolve
     * @returns {ResolvedArrow | undefined}
     */
    static "__#private@#resolveDiamondToRectangleArrow"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow): ResolvedArrow | undefined;
    /**
     * Resolves a diamond → text arrow element to predicate and language
     * @param {string} text - Arrow text to resolve
     * @returns {ResolvedDiamondToTextArrow | undefined}
     */
    static "__#private@#resolveDiamondToTextArrow"(text: string): ResolvedDiamondToTextArrow | undefined;
    /**
     * Converts a diamond → rectangle arrow to RDF triples
     * @param {string} domain - Current domain prefix
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to convert
     * @param {Diamond} sourceElement - Source diamond element
     * @param {Rectangle} targetElement - Target rectangle element
     * @param {Map<string, Array<{order: number, attributeUri: string, arrowId: string}>>} primaryKeys - Map to track primary keys per diamond
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#diamondToRectangleTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow, sourceElement: Diamond, targetElement: Rectangle, primaryKeys: Map<string, Array<{
        order: number;
        attributeUri: string;
        arrowId: string;
    }>>): string[];
    /**
     * Converts a diamond → diamond arrow to RDF triples
     * @param {string} domain - Current domain prefix
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to convert
     * @param {Diamond} sourceElement - Source diamond element
     * @param {Diamond} targetElement - Target diamond element
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#diamondToDiamondTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow, sourceElement: Diamond, targetElement: Diamond): string[];
    /**
     * Converts a diamond → text arrow to RDF triples
     * @param {string} domain - Current domain prefix
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to convert
     * @param {Diamond} sourceElement - Source diamond element
     * @param {Text} targetElement - Target text element
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#diamondToTextTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow, sourceElement: Diamond, targetElement: Text): string[];
    /**
     * Converts a raw text → text arrow to RDF triple
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Arrow} element - Arrow element to convert
     * @param {Text} sourceElement - Source text element
     * @param {Text} targetElement - Target text element
     * @returns {{ triple: string | null, invalidIds: Set<string> }}
     */
    static "__#private@#textToTextTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Arrow, sourceElement: Text, targetElement: Text): {
        triple: string | null;
        invalidIds: Set<string>;
    };
    /**
     * Converts an arrow element to RDF triples
     * @param {string} domain - Current domain prefix
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Elements} elements - All elements in the diagram
     * @param {Arrow} element - Arrow element to convert
     * @param {Map<string, Array<{order: number, attributeUri: string, arrowId: string}>>} primaryKeys - Map to track primary keys per diamond
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#arrowToTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, elements: Elements, element: Arrow, primaryKeys: Map<string, Array<{
        order: number;
        attributeUri: string;
        arrowId: string;
    }>>): string[];
    /**
     * Converts a tree element to RDF triples for enumerations (upper:oneOf)
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Elements} elements - All elements in the diagram
     * @param {import('./types.js').Tree} tree - Tree element to convert
     * @param {Set<string>} invalid - Set to track invalid element IDs
     * @param {ResolvedDiamond} resolvedRoot - Resolved tree root
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#enumerationTreeToTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, elements: Elements, tree: import("./types.js").Tree, invalid: Set<string>, resolvedRoot: ResolvedDiamond): string[];
    /**
     * Converts a tree element to RDF triples for sealed class hierarchies
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Elements} elements - All elements in the diagram
     * @param {import('./types.js').Tree} tree - Tree element to convert
     * @param {Set<string>} invalid - Set to track invalid element IDs
     * @param {ResolvedDiamond} resolvedRoot - Resolved tree root
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#sealedClassTreeToTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, elements: Elements, tree: import("./types.js").Tree, invalid: Set<string>, resolvedRoot: ResolvedDiamond): string[];
    /**
     * Converts a tree element to RDF triples for enumerations (upper:oneOf)
     * @param {string} domain - Domain prefix for unprefixed identifiers
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Elements} elements - All elements in the diagram
     * @param {import('./types.js').Tree} tree - Tree element to convert
     * @param {Set<string>} invalid - Set to track invalid element IDs
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#treeToTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, elements: Elements, tree: import("./types.js").Tree, invalid: Set<string>): string[];
    /**
     * Converts a diamond element to RDF triples
     * @param {string} domain - Current domain prefix
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Prefixes} usedPrefixes - Prefix mappings being used
     * @param {Diamond} element - Diamond element to convert
     * @returns {string[]} Array of N-Triples strings
     */
    static "__#private@#diamondToTriples"(domain: string, prefixes: Prefixes, usedPrefixes: Prefixes, element: Diamond): string[];
    /**
     * Generates N-Triples from diagram elements
     * @param {string} domain - Domain prefix for auto-generating namespace URIs
     * @param {Prefixes} prefixes - Available prefix mappings
     * @param {Elements} elements - All elements in the diagram
     * @param {string} customNTriples - Custom N-Triples to merge into output
     * @returns {{ prefixes: Prefixes, nTriples: string, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, keyed: Set<string> }}
     */
    static generate(domain: string, prefixes: Prefixes, elements: Elements, customNTriples: string): {
        prefixes: Prefixes;
        nTriples: string;
        ignored: Set<string>;
        raw: Set<string>;
        invalid: Set<string>;
        keyed: Set<string>;
    };
}
export type Element = import("./types.js").Element;
export type Diamond = import("./types.js").Diamond;
export type Rectangle = import("./types.js").Rectangle;
export type Text = import("./types.js").Text;
export type Arrow = import("./types.js").Arrow;
export type Elements = import("./types.js").Elements;
export type Prefixes = import("./types.js").Prefixes;
export type TypeAbbreviation = import("./types.js").TypeAbbreviation;
export type ResolvedCurie = {
    type: "curie";
    uri: string;
};
export type ResolvedDiamond = {
    type: "diamond";
    uri: string;
    abbv: TypeAbbreviation;
};
export type ResolvedArrow = {
    type: "arrow";
    uri: string;
    minCount: string;
    maxCount?: string | undefined;
    /**
     * - Primary key order (e.g., "PK1", "PK2")
     */
    primaryKey?: string | undefined;
};
export type ResolvedRectangle = {
    type: "rectangle";
    uri: string;
};
export type ResolvedElement = ResolvedDiamond | ResolvedArrow | ResolvedRectangle;
export type ResolvedDiamondToTextArrow = {
    predicate: import("./types.js").DiamondToTextPredicate;
    language: string;
};
