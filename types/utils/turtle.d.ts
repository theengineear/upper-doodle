/**
 * @typedef {Object} Prefixes
 * @property {string} [key] - Prefix name to namespace URI mapping
 */
/**
 * @typedef {'uri' | 'blank' | 'literal'} NodeType
 */
/**
 * @typedef {Object} URINode
 * @property {'uri'} type
 * @property {string} value - Full URI with angle brackets
 * @property {string} curie - Shortened URI using prefix
 * @property {string} key - Same as value, used for deduplication
 */
/**
 * @typedef {Object} BlankNode
 * @property {'blank'} type
 * @property {string} value - Blank node identifier (e.g., "_:b1")
 * @property {string} key - Same as value, used for deduplication
 */
/**
 * @typedef {Object} LiteralNode
 * @property {'literal'} type
 * @property {string} value - The literal value
 * @property {string} key - Full serialized form
 * @property {string} [datatype] - URI of the datatype
 * @property {string} [language] - Language tag
 */
/**
 * @typedef {URINode | BlankNode} SubjectNode
 */
/**
 * @typedef {URINode | BlankNode | LiteralNode} ObjectNode
 */
/**
 * @typedef {Object} Triple
 * @property {SubjectNode} subject
 * @property {URINode} predicate
 * @property {ObjectNode} object
 * @property {string} source - Original line from input
 */
/**
 * @typedef {Object} PredicateData
 * @property {URINode} predicate
 * @property {ObjectNode} object
 */
/**
 * @typedef {Object} SubjectGroup
 * @property {SubjectNode} subject
 * @property {PredicateData[]} predicates
 */
/**
 * Static class for Turtle format generation
 */
export class Turtle {
    static "__#private@#LINE_PATTERN": RegExp;
    static "__#private@#SUBJECT_PATTERN": RegExp;
    static "__#private@#PREDICATE_PATTERN": RegExp;
    static "__#private@#OBJECT_PATTERN": RegExp;
    static "__#private@#EMPTY_LINE_PATTERN": RegExp;
    static "__#private@#COMMENT_LINE_PATTERN": RegExp;
    static "__#private@#LITERAL_PATTERN": RegExp;
    static "__#private@#PREDICATE_ORDER": string[];
    static "__#private@#cache": Map<any, any>;
    /**
     * Throws an error with context about the source line
     * @param {string} source - The source line that caused the error
     * @param {string} message - Error message
     * @throws {Error} Always throws
     */
    static "__#private@#throwError"(source: string, message: string): void;
    /**
     * Unescape N-Triples literal escape sequences back to their original characters
     * @param {string} str - The escaped string from N-Triples
     * @returns {string} The unescaped string
     */
    static "__#private@#unescapeNTriplesLiteral"(str: string): string;
    /**
     * Shortens a full URI to a CURIE using the provided prefixes
     * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
     * @param {string} uri - Full URI to shorten
     * @returns {string} Shortened CURIE (e.g., "rdf:type")
     * @throws {Error} If no matching prefix is found
     */
    static "__#private@#shortenUri"(prefixes: Prefixes, uri: string): string;
    /**
     * Parses N-Triples format string into structured triple objects
     * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
     * @param {string} nTriplesString - N-Triples formatted string
     * @returns {Triple[]} Array of parsed triples
     */
    static "__#private@#parseNTriples"(prefixes: Prefixes, nTriplesString: string): Triple[];
    /**
     * Removes duplicate triples based on subject, predicate, and object keys
     * @param {Triple[]} triples - Array of triples
     * @returns {Triple[]} Deduplicated array of triples
     */
    static "__#private@#deduplicateTriples"(triples: Triple[]): Triple[];
    /**
     * Sorts predicates within a subject group according to PREDICATE_ORDER
     * @param {SubjectGroup} group - Subject group to sort
     * @returns {SubjectGroup} Sorted subject group
     */
    static "__#private@#sortGroup"(group: SubjectGroup): SubjectGroup;
    /**
     * Sorts subject groups alphabetically by subject key
     * @param {Object.<string, SubjectGroup>} groups - Map of subject key to group
     * @returns {Object.<string, SubjectGroup>} Sorted map of groups
     */
    static "__#private@#sortGroups"(groups: {
        [x: string]: SubjectGroup;
    }): {
        [x: string]: SubjectGroup;
    };
    /**
     * Groups triples by their subject
     * @param {Triple[]} triples - Array of triples
     * @returns {Object.<string, SubjectGroup>} Map of subject key to group
     */
    static "__#private@#groupTriples"(triples: Triple[]): {
        [x: string]: SubjectGroup;
    };
    /**
     * Converts prefix map to Turtle @prefix declarations
     * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
     * @returns {string} Turtle prefix declarations
     */
    static "__#private@#prefixesToTurtleSnippet"(prefixes: Prefixes): string;
    /**
     * Converts a subject group to Turtle format
     * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
     * @param {SubjectGroup} group - Subject group to convert
     * @param {Object.<string, SubjectGroup>} groups - All subject groups (for list detection)
     * @returns {string} Turtle representation of the group
     */
    static "__#private@#groupToTurtleSnippet"(prefixes: Prefixes, group: SubjectGroup, groups: {
        [x: string]: SubjectGroup;
    }): string;
    /**
     * Detects if a blank node is an RDF list node
     * @param {SubjectNode} node - Node to check
     * @param {Object.<string, SubjectGroup>} groups - All subject groups
     * @returns {boolean} True if node is a list node
     */
    static "__#private@#isListNode"(node: SubjectNode, groups: {
        [x: string]: SubjectGroup;
    }): boolean;
    /**
     * Serializes an RDF list starting from a head node
     * @param {BlankNode} headNode - Starting node of the list
     * @param {Object.<string, SubjectGroup>} groups - All subject groups
     * @returns {string} Turtle list syntax
     */
    static "__#private@#serializeList"(headNode: BlankNode, groups: {
        [x: string]: SubjectGroup;
    }): string;
    /**
     * Generates Turtle format from N-Triples input
     * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
     * @param {string} nTriples - N-Triples formatted string
     * @returns {string} Turtle formatted string
     */
    static generate(prefixes: Prefixes, nTriples: string): string;
}
export type Prefixes = {
    /**
     * - Prefix name to namespace URI mapping
     */
    key?: string | undefined;
};
export type NodeType = "uri" | "blank" | "literal";
export type URINode = {
    type: "uri";
    /**
     * - Full URI with angle brackets
     */
    value: string;
    /**
     * - Shortened URI using prefix
     */
    curie: string;
    /**
     * - Same as value, used for deduplication
     */
    key: string;
};
export type BlankNode = {
    type: "blank";
    /**
     * - Blank node identifier (e.g., "_:b1")
     */
    value: string;
    /**
     * - Same as value, used for deduplication
     */
    key: string;
};
export type LiteralNode = {
    type: "literal";
    /**
     * - The literal value
     */
    value: string;
    /**
     * - Full serialized form
     */
    key: string;
    /**
     * - URI of the datatype
     */
    datatype?: string | undefined;
    /**
     * - Language tag
     */
    language?: string | undefined;
};
export type SubjectNode = URINode | BlankNode;
export type ObjectNode = URINode | BlankNode | LiteralNode;
export type Triple = {
    subject: SubjectNode;
    predicate: URINode;
    object: ObjectNode;
    /**
     * - Original line from input
     */
    source: string;
};
export type PredicateData = {
    predicate: URINode;
    object: ObjectNode;
};
export type SubjectGroup = {
    subject: SubjectNode;
    predicates: PredicateData[];
};
