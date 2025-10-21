/**
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Diamond} Diamond
 * @typedef {import('./types.js').Rectangle} Rectangle
 * @typedef {import('./types.js').Text} Text
 * @typedef {import('./types.js').Arrow} Arrow
 * @typedef {import('./types.js').Elements} Elements
 * @typedef {import('./types.js').Prefixes} Prefixes
 * @typedef {import('./types.js').TypeAbbreviation} TypeAbbreviation
 */

/**
 * @typedef {Object} ResolvedCurie
 * @property {'curie'} type
 * @property {string} uri
 */

/**
 * @typedef {Object} ResolvedDiamond
 * @property {'diamond'} type
 * @property {string} uri
 * @property {TypeAbbreviation} abbv
 */

/**
 * @typedef {Object} ResolvedArrow
 * @property {'arrow'} type
 * @property {string} uri
 * @property {string} minCount
 * @property {string} [maxCount]
 * @property {string} [primaryKey] - Primary key order (e.g., "PK1", "PK2")
 */

/**
 * @typedef {Object} ResolvedRectangle
 * @property {'rectangle'} type
 * @property {string} uri
 */

/**
 * @typedef {ResolvedDiamond|ResolvedArrow|ResolvedRectangle} ResolvedElement
 */

/**
 * @typedef {Object} ResolvedDiamondToTextArrow
 * @property {import('./types.js').DiamondToTextPredicate} predicate
 * @property {string} language
 */

import { TYPE_ABBREVIATIONS } from './types.js';
import { Validate } from './validate.js';

/**
 * Static class for generating RDF triples from diagram elements
 */
export class Triples {
  // Pattern for rectangle text (CURIE only)
  static #RECTANGLE_TEXT_PATTERN = /^(?<curie>[^ ]+)$/;

  // Pattern for diamond text (CURIE only)
  static #DIAMOND_TEXT_PATTERN = /^(?<curie>[^ ]+) \((?<abbv>DC|SC|E|V)\)$/;

  // Pattern for diamond → diamond arrow (CURIE with cardinality)
  static #DIAMOND_TO_DIAMOND_ARROW_PATTERN = /^(?<curie>[^ ]+) \((?<minCount>\d+)\.\.(?<maxCount>(?:n|\d+))\)$/;

  // Pattern for diamond → rectangle arrow (CURIE with cardinality)
  static #DIAMOND_TO_RECTANGLE_ARROW_PATTERN = /^(?<curie>[^ ]+) \((?:(?<minCount>\d+)\.\.(?<maxCount>(?:n|\d+))(?: (?<primaryKey>PK\d+))?)\)$/;

  // Pattern for diamond → text arrow (predicate with optional language tag)
  static #DIAMOND_TO_TEXT_ARROW_PATTERN = /^(?<predicate>[^ ]+)(?: @(?<language>[a-z]{2,3}))?$/;

  // Pattern for CURIE syntax
  static #CURIE_PATTERN = /^(?:(?<prefix>[0-9A-Za-z._-]*):)?(?<reference>[0-9A-Za-z._-]+)$/;

  // Patterns for RDF literal syntax (single, double, and triple-quoted)
  // Plain literal: "text" or 'text' or """text""" or '''text'''
  static #PLAIN_LITERAL_PATTERN = /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')$/;
  // Language-tagged literal: "text"@en or 'text'@en-US or """text"""@en
  static #LANGUAGE_LITERAL_PATTERN = /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')@[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/;
  // Datatyped literal: "text"^^xsd:string or '42'^^xsd:integer or """text"""^^xsd:string
  static #DATATYPE_LITERAL_PATTERN = /^(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\^\^.+$/;

  /**
   * Escape special characters in a literal string for N-Triples format.
   * According to N-Triples spec: https://www.w3.org/TR/n-triples/#grammar-production-STRING_LITERAL_QUOTE
   * @param {string} str - The string to escape
   * @returns {string} The escaped string
   */
  static #escapeNTriplesLiteral(str) {
    return str
      .replace(/\\/g, '\\\\')   // Backslash must be first
      .replace(/\n/g, '\\n')    // Newline
      .replace(/\r/g, '\\r')    // Carriage return
      .replace(/\t/g, '\\t')    // Tab
      .replace(/"/g, '\\"');    // Quote
  }

  /**
   * Validates RDF literal syntax
   * @param {string} text - Text to validate as literal
   * @returns {boolean} True if valid literal syntax
   */
  static #isValidLiteral(text) {
    if (!text) {
      return false;
    }
    return (
      this.#PLAIN_LITERAL_PATTERN.test(text) ||
      this.#LANGUAGE_LITERAL_PATTERN.test(text) ||
      this.#DATATYPE_LITERAL_PATTERN.test(text)
    );
  }

  /**
   * Checks if an element is external (prefix doesn't match domain)
   * @param {Diamond | Rectangle} element - Element to check
   * @param {string} domain - Current domain prefix
   * @returns {boolean} True if element is external
   */
  static #isExternal(element, domain) {
    // Only diamonds and rectangles can be external
    if (element.type !== 'diamond' && element.type !== 'rectangle') {
      return false;
    }
    const text = element.text || '';
    const colonIndex = text.indexOf(':');
    if (colonIndex === -1) {
      return false;
    }
    const prefix = text.substring(0, colonIndex).trim();
    return prefix !== domain;
  }

  /**
   * Resolves a CURIE string to a full URI
   * @param {string} domain - Domain prefix to use when no prefix is specified
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used (mutated to track usage)
   * @param {string} text - CURIE text to resolve
   * @returns {ResolvedCurie | undefined}
   */
  static #resolveCurie(domain, prefixes, usedPrefixes, text) {
    const match = text?.match(this.#CURIE_PATTERN);
    if (match && match.groups) {
      const { prefix, reference } = match.groups;
      if (prefix === undefined) {
        // No prefix declared — use the domain prefix
        const domainPrefixUri = prefixes[domain];
        if (!domainPrefixUri) {
          // Domain prefix not available, cannot resolve
          return undefined;
        }

        // Track that domain prefix is being used
        if (!usedPrefixes[domain]) {
          usedPrefixes[domain] = domainPrefixUri;
        }

        return { type: 'curie', uri: `${domainPrefixUri}${reference}` };
      } else if (prefix.length > 0) {
        // Check if prefix exists in available prefixes
        const prefixUri = prefixes[prefix];
        if (!prefixUri) {
          // Prefix not declared - cannot resolve
          return undefined;
        }

        // Track that this prefix is being used
        if (!usedPrefixes[prefix]) {
          usedPrefixes[prefix] = prefixUri;
        }

        return { type: 'curie', uri: `${prefixUri}${reference}` };
      }
      // Empty prefix (":something") is invalid, return undefined
    }
  }

  /**
   * Resolves a rectangle element to RDF terms
   * @param {string} domain - Domain prefix for unprefixed identifiers
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used
   * @param {Rectangle} element - Rectangle element to resolve
   * @returns {ResolvedRectangle | undefined}
   */
  static #resolveRectangle(domain, prefixes, usedPrefixes, element) {
    const text = element.text;
    const match = text?.match(this.#RECTANGLE_TEXT_PATTERN);
    if (match && match?.groups) {
      const { curie } = match.groups;
      const resolvedCurie = this.#resolveCurie(domain, prefixes, usedPrefixes, curie);
      if (resolvedCurie) {
        return { ...resolvedCurie, type: 'rectangle' };
      }
    }
  }

  /**
   * Resolves a diamond element to RDF terms
   * @param {string} domain - Domain prefix for unprefixed identifiers
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used
   * @param {Diamond} element - Diamond element to resolve
   * @returns {ResolvedDiamond | undefined}
   */
  static #resolveDiamond(domain, prefixes, usedPrefixes, element) {
    const text = element.text;
    const match = text?.match(this.#DIAMOND_TEXT_PATTERN);
    if (match && match.groups) {
      const { curie, abbv } = match.groups;
      Validate.isTypeAbbreviation(abbv); // This should never throw in runtime.
      const resolvedCurie = this.#resolveCurie(domain, prefixes, usedPrefixes, curie);
      if (resolvedCurie) {
        return { ...resolvedCurie, type: 'diamond', abbv };
      }
    }
  }

  /**
   * Resolves a diamond → diamond arrow element to RDF terms
   * @param {string} domain - Domain prefix for unprefixed identifiers
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used
   * @param {Arrow} element - Arrow element to resolve
   * @returns {ResolvedArrow | undefined}
   */
  static #resolveDiamondToDiamondArrow(domain, prefixes, usedPrefixes, element) {
    const text = element.text;
    const match = text?.match(this.#DIAMOND_TO_DIAMOND_ARROW_PATTERN);
    if (match && match.groups) {
      const { curie, minCount, maxCount } = match.groups;
      const resolvedCurie = this.#resolveCurie(domain, prefixes, usedPrefixes, curie);
      if (resolvedCurie) {
        if (maxCount === 'n') {
          return { ...resolvedCurie, type: 'arrow', minCount };
        } else {
          return { ...resolvedCurie, type: 'arrow', minCount, maxCount };
        }
      }
    }
  }

  /**
   * Resolves a diamond → rectangle arrow element to RDF terms
   * @param {string} domain - Domain prefix for unprefixed identifiers
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used
   * @param {Arrow} element - Arrow element to resolve
   * @returns {ResolvedArrow | undefined}
   */
  static #resolveDiamondToRectangleArrow(domain, prefixes, usedPrefixes, element) {
    const text = element.text;
    const match = text?.match(this.#DIAMOND_TO_RECTANGLE_ARROW_PATTERN);
    if (match && match.groups) {
      const { curie, minCount, maxCount, primaryKey } = match.groups;
      const resolvedCurie = this.#resolveCurie(domain, prefixes, usedPrefixes, curie);
      if (resolvedCurie) {
        if (maxCount === 'n') {
          // If primaryKey is present, use cardinality 1..1
          if (primaryKey) {
            return { ...resolvedCurie, type: 'arrow', minCount, primaryKey };
          }
          return { ...resolvedCurie, type: 'arrow', minCount };
        } else {
          // If primaryKey is present, use cardinality 1..1
          if (primaryKey) {
            return { ...resolvedCurie, type: 'arrow', minCount, maxCount, primaryKey };
          }
          return { ...resolvedCurie, type: 'arrow', minCount, maxCount };
        }
      }
    }
  }

  /**
   * Resolves a diamond → text arrow element to predicate and language
   * @param {string} text - Arrow text to resolve
   * @returns {ResolvedDiamondToTextArrow | undefined}
   */
  static #resolveDiamondToTextArrow(text) {
    const match = text?.match(this.#DIAMOND_TO_TEXT_ARROW_PATTERN);
    if (match && match.groups) {
      const { predicate, language = 'en' } = match.groups;
      // Only resolve if predicate is a known diamond-to-text predicate
      try {
        Validate.isDiamondToTextPredicate(predicate);
        return { predicate, language };
      } catch {
        return undefined;
      }
    }
  }

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
  static #diamondToRectangleTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement, primaryKeys) {
    // Skip triple generation if source is external (never use external URI as subject)
    if (this.#isExternal(sourceElement, domain)) {
      return [];
    }

    const subject = this.#resolveDiamondToRectangleArrow(domain, prefixes, usedPrefixes, element);
    const predicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:type');
    const object = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:Attribute');

    const minCountSubject = subject;
    const minCountPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:minCount');
    const minCountObject = subject?.minCount ? { value: subject?.minCount } : null;

    const maxCountSubject = subject;
    const maxCountPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:maxCount');
    const maxCountObject = subject?.maxCount ? { value: subject?.maxCount } : null;

    const datatypeSubject = subject;
    const datatypePredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:datatype');
    const datatypeObject = this.#resolveRectangle(domain, prefixes, usedPrefixes, targetElement);

    const attributeSubject = this.#resolveDiamond(domain, prefixes, usedPrefixes, sourceElement);
    const attributePredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:property');
    const attributeObject = subject;

    // Track primary key info (if present)
    if (subject?.primaryKey && attributeSubject) {
      const pkOrder = parseInt(subject.primaryKey.replace('PK', ''), 10);
      if (!primaryKeys.has(sourceElement.id)) {
        primaryKeys.set(sourceElement.id, []);
      }
      const pkArray = primaryKeys.get(sourceElement.id);
      if (pkArray) {
        pkArray.push({
          order: pkOrder,
          attributeUri: subject.uri,
          arrowId: element.id,
        });
      }
    }

    const triples = [];
    if (
      subject && predicate && object &&
      minCountSubject && minCountPredicate && minCountObject &&
      datatypeSubject && datatypePredicate && datatypeObject &&
      attributeSubject && attributePredicate && attributeObject
    ) {
      triples.push(
        `<${subject.uri}> <${predicate.uri}> <${object.uri}> .`,
        `<${minCountSubject.uri}> <${minCountPredicate.uri}> "${minCountObject.value}"^^<http://www.w3.org/2001/XMLSchema#integer> .`,
        `<${datatypeSubject.uri}> <${datatypePredicate.uri}> <${datatypeObject.uri}> .`,
        `<${attributeSubject.uri}> <${attributePredicate.uri}> <${attributeObject.uri}> .`,
      );
      if (maxCountSubject && maxCountPredicate && maxCountObject) {
        triples.push(
          `<${maxCountSubject.uri}> <${maxCountPredicate.uri}> "${maxCountObject.value}"^^<http://www.w3.org/2001/XMLSchema#integer> .`,
        );
      }
    }

    return triples;
  }

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
  static #diamondToDiamondTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement) {
    // Skip triple generation if source is external (never use external URI as subject)
    if (this.#isExternal(sourceElement, domain)) {
      return [];
    }

    const subject = this.#resolveDiamondToDiamondArrow(domain, prefixes, usedPrefixes, element);
    const predicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:type');
    const object = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:Relationship');

    const minCountSubject = subject;
    const minCountPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:minCount');
    const minCountObject = subject?.minCount ? { value: subject?.minCount } : null;

    const maxCountSubject = subject;
    const maxCountPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:maxCount');
    const maxCountObject = subject?.maxCount ? { value: subject?.maxCount } : null;

    const datatypeSubject = subject;
    const datatypePredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:class');
    const datatypeObject = this.#resolveDiamond(domain, prefixes, usedPrefixes, targetElement);

    const attributeSubject = this.#resolveDiamond(domain, prefixes, usedPrefixes, sourceElement);
    const attributePredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:property');
    const attributeObject = subject;

    const triples = [];
    if (
      subject && predicate && object &&
      minCountSubject && minCountPredicate && minCountObject &&
      datatypeSubject && datatypePredicate && datatypeObject &&
      attributeSubject && attributePredicate && attributeObject
    ) {
      triples.push(
        `<${subject.uri}> <${predicate.uri}> <${object.uri}> .`,
        `<${minCountSubject.uri}> <${minCountPredicate.uri}> "${minCountObject.value}"^^<http://www.w3.org/2001/XMLSchema#integer> .`,
        `<${datatypeSubject.uri}> <${datatypePredicate.uri}> <${datatypeObject.uri}> .`,
        `<${attributeSubject.uri}> <${attributePredicate.uri}> <${attributeObject.uri}> .`,
      );
      if (maxCountSubject && maxCountPredicate && maxCountObject) {
        triples.push(
          `<${maxCountSubject.uri}> <${maxCountPredicate.uri}> "${maxCountObject.value}"^^<http://www.w3.org/2001/XMLSchema#integer> .`,
        );
      }
    }

    return triples;
  }

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
  static #diamondToTextTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement) {
    // Skip triple generation if source is external (never use external URI as subject)
    if (this.#isExternal(sourceElement, domain)) {
      return [];
    }

    const resolvedDiamondToTextArrow = this.#resolveDiamondToTextArrow(element.text);
    if (!resolvedDiamondToTextArrow) {
      return [];
    }

    const subject = this.#resolveDiamond(domain, prefixes, usedPrefixes, sourceElement);
    const predicate = this.#resolveCurie(domain, prefixes, usedPrefixes, resolvedDiamondToTextArrow.predicate);
    const objectValue = targetElement.text;

    const triples = [];
    if (subject && predicate && objectValue) {
      triples.push(`<${subject.uri}> <${predicate.uri}> "${this.#escapeNTriplesLiteral(objectValue)}"@${resolvedDiamondToTextArrow.language} .`);
    }

    return triples;
  }

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
  static #textToTextTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement) {
    const invalidIds = /** @type {Set<string>} */ (new Set());

    // Extract raw text values
    const subjectText = sourceElement.text;
    const predicateText = element.text;
    const objectText = targetElement.text;

    // Resolve subject as CURIE
    let subject = null;
    const resolvedSubject = this.#resolveCurie(domain, prefixes, usedPrefixes, subjectText);
    if (resolvedSubject) {
      subject = `<${resolvedSubject.uri}>`;
    } else {
      invalidIds.add(sourceElement.id);
    }

    // Resolve predicate as CURIE
    let predicate = null;
    const resolvedPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, predicateText);
    if (resolvedPredicate) {
      predicate = `<${resolvedPredicate.uri}>`;
    } else {
      invalidIds.add(element.id);
    }

    // Resolve object as literal or CURIE
    let object = null;
    const isLiteral = objectText?.startsWith('"') || objectText?.startsWith("'");
    if (isLiteral) {
      // Validate literal syntax
      if (this.#isValidLiteral(objectText)) {
        object = objectText;
      } else {
        invalidIds.add(targetElement.id);
      }
    } else {
      // Try to resolve as CURIE
      const resolvedObject = this.#resolveCurie(domain, prefixes, usedPrefixes, objectText);
      if (resolvedObject) {
        object = `<${resolvedObject.uri}>`;
      } else {
        invalidIds.add(targetElement.id);
      }
    }

    // Generate triple only if all components are valid
    if (subject && predicate && object) {
      return { triple: `${subject} ${predicate} ${object} .`, invalidIds };
    }

    return { triple: null, invalidIds };
  }

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
  static #arrowToTriples(domain, prefixes, usedPrefixes, elements, element, primaryKeys) {
    const sourceElement = element.source ? elements[element.source] : undefined;
    const targetElement = element.target ? elements[element.target] : undefined;

    if (sourceElement && targetElement) {
      const sourceType = sourceElement?.type;
      const targetType = targetElement?.type;
      switch (sourceType) {
        case 'diamond':
          switch (targetType) {
            case 'rectangle':
              return this.#diamondToRectangleTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement, primaryKeys);
            case 'diamond':
              return this.#diamondToDiamondTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement);
            case 'text':
              return this.#diamondToTextTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement);
            case 'arrow':
            case 'tree':
              // It’s not technically possible to bind to these things. Ignore.
              break;
            default:
              Validate.unreachable(targetType);
          }
          break;
      }
    }

    return [];
  }

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
  static #enumerationTreeToTriples(domain, prefixes, usedPrefixes, elements, tree, invalid, resolvedRoot) {
    for (const item of tree.items) {
      if (item.parent !== tree.root) {
        invalid.add(tree.id);
        return [];
      }
    }

    // 4. Check all items are diamonds with 'V' class abbreviation
    const itemElements = [];
    for (const item of tree.items) {
      const itemElement = elements[item.element];
      if (!itemElement || itemElement.type !== 'diamond') {
        invalid.add(tree.id);
        return [];
      }

      const resolvedItem = this.#resolveDiamond(domain, prefixes, usedPrefixes, itemElement);
      if (!resolvedItem || resolvedItem.abbv !== 'V') {
        invalid.add(tree.id);
        return [];
      }

      itemElements.push(resolvedItem);
    }

    // 5. Generate N-Triples for upper:oneOf with RDF collection
    const triples = [];

    // If there are no items, don't generate any triples (empty enumeration)
    if (itemElements.length === 0) {
      return [];
    }

    // Resolve predicates we'll need
    const oneOfPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:oneOf');
    const rdfFirst = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:first');
    const rdfRest = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:rest');
    const rdfNil = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:nil');

    if (!oneOfPredicate || !rdfFirst || !rdfRest || !rdfNil) {
      invalid.add(tree.id);
      return [];
    }

    // Generate blank node IDs for list structure
    const blankNodes = itemElements.map((_, i) => `_:tree${tree.id}_${i}`);

    // Connect root to first list node
    triples.push(`<${resolvedRoot.uri}> <${oneOfPredicate.uri}> ${blankNodes[0]} .`);

    // Generate list structure
    for (let i = 0; i < itemElements.length; i++) {
      const item = itemElements[i];
      const currentNode = blankNodes[i];
      const nextNode = i < itemElements.length - 1 ? blankNodes[i + 1] : `<${rdfNil.uri}>`;

      triples.push(`${currentNode} <${rdfFirst.uri}> <${item.uri}> .`);
      triples.push(`${currentNode} <${rdfRest.uri}> ${nextNode} .`);
    }

    return triples;
  }

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
  // eslint-disable-next-line no-unused-vars
  static #sealedClassTreeToTriples(domain, prefixes, usedPrefixes, elements, tree, invalid, resolvedRoot) {
    return [];
  }

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
  static #treeToTriples(domain, prefixes, usedPrefixes, elements, tree, invalid) {
    const rootElement = elements[tree.root];
    if (!rootElement) {
      invalid.add(tree.id);
      return [];
    }
    if (rootElement.type !== 'diamond') {
      invalid.add(tree.id);
      return [];
    }
    const resolvedRoot = this.#resolveDiamond(domain, prefixes, usedPrefixes, rootElement);
    if (!resolvedRoot) {
      invalid.add(tree.id);
      return [];
    }

    switch(resolvedRoot.abbv) {
      case 'E':
        return Triples.#enumerationTreeToTriples(domain, prefixes, usedPrefixes, elements, tree, invalid, resolvedRoot);
      case 'SC':
        return Triples.#sealedClassTreeToTriples(domain, prefixes, usedPrefixes, elements, tree, invalid, resolvedRoot);
      case 'DC':
      case 'V':
        invalid.add(tree.id);
        return [];
      default:
        Validate.unreachable(resolvedRoot.abbv);
        invalid.add(tree.id);
        return [];
    }
  }

  /**
   * Converts a diamond element to RDF triples
   * @param {string} domain - Current domain prefix
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Prefixes} usedPrefixes - Prefix mappings being used
   * @param {Diamond} element - Diamond element to convert
   * @returns {string[]} Array of N-Triples strings
   */
  static #diamondToTriples(domain, prefixes, usedPrefixes, element) {
    // Skip triple generation for external diamonds (never use external URI as subject)
    if (this.#isExternal(element, domain)) {
      return [];
    }

    const triples = [];
    const subject = this.#resolveDiamond(domain, prefixes, usedPrefixes, element);
    const predicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:type');
    const object = subject
      ? this.#resolveCurie(domain, prefixes, usedPrefixes, TYPE_ABBREVIATIONS[subject.abbv])
      : null;
    if (subject && predicate && object) {
      triples.push(`<${subject.uri}> <${predicate.uri}> <${object.uri}> .`);
    }
    return triples;
  }

  /**
   * Generates N-Triples from diagram elements
   * @param {string} domain - Domain prefix for auto-generating namespace URIs
   * @param {Prefixes} prefixes - Available prefix mappings
   * @param {Elements} elements - All elements in the diagram
   * @returns {{ prefixes: Prefixes, nTriples: string, ignored: Set<string>, raw: Set<string>, invalid: Set<string>, keyed: Set<string> }}
   */
  static generate(domain, prefixes, elements) {
    // Track which prefixes are actually used
    const usedPrefixes = /** @type {Prefixes} */ ({});
    const triples = /** @type {string[]} */ ([]);
    const used = /** @type {Set<string>} */ (new Set());
    const raw = /** @type {Set<string>} */ (new Set());
    const invalid = /** @type {Set<string>} */ (new Set());
    // Track primary keys per diamond: Map<diamondId, Array<{order: number, attributeUri: string, arrowId: string}>>
    const primaryKeys = /** @type {Map<string, Array<{order: number, attributeUri: string, arrowId: string}>>} */ (new Map());

    // Generate domain model triples (only if upper, rdf, and domain prefixes are all available)
    const upperPrefix = prefixes['upper'];
    const rdfPrefix = prefixes['rdf'];
    const domainNamespaceUri = prefixes[domain];

    if (upperPrefix && rdfPrefix && domainNamespaceUri && domain) {
      // Mark prefixes as used
      usedPrefixes['upper'] = upperPrefix;
      usedPrefixes['rdf'] = rdfPrefix;
      usedPrefixes[domain] = domainNamespaceUri;

      // Generate domain model triples
      const rdfType = rdfPrefix + 'type';
      const upperDomainModel = upperPrefix + 'DomainModel';
      const upperDomainPredicate = upperPrefix + 'domain';

      triples.push(`<${domainNamespaceUri}> <${rdfType}> <${upperDomainModel}> .`);
      triples.push(`<${domainNamespaceUri}> <${upperDomainPredicate}> "${domain}" .`);
    }

    // First pass: collect all diamonds and trees and process them
    for (const element of Object.values(elements)) {
      if (element.type === 'diamond') {
        const diamondTriples = this.#diamondToTriples(domain, prefixes, usedPrefixes, element);
        if (diamondTriples.length > 0) {
          triples.push(...diamondTriples);
          used.add(element.id);
        } else {
          // Diamond couldn't generate triples - check if it has syntax errors
          // (independently of whether it's external, since external diamonds with invalid syntax
          // should still be marked as invalid)
          const resolved = this.#resolveDiamond(domain, prefixes, usedPrefixes, element);
          if (!resolved) {
            // Invalid syntax
            invalid.add(element.id);
          }
          // External diamonds don't generate triples, but aren't marked as invalid
          // (they'll be marked as ignored since they're not in the used set)
        }
      } else if (element.type === 'tree') {
        const treeTriples = this.#treeToTriples(domain, prefixes, usedPrefixes, elements, element, invalid);
        if (treeTriples.length > 0) {
          triples.push(...treeTriples);
          used.add(element.id);
        }
      }
    }

    // Second pass: process arrows and their targets
    for (const element of Object.values(elements)) {
      if (element.type === 'arrow') {
        const sourceElement = element.source ? elements[element.source] : undefined;
        const targetElement = element.target ? elements[element.target] : undefined;

        if (sourceElement && targetElement) {
          // Check if this is a raw (text → text) pattern first
          if (sourceElement.type === 'text' && targetElement.type === 'text') {
            // This is raw turtle-style RDF - generate raw triple
            const result = this.#textToTextTriples(domain, prefixes, usedPrefixes, element, sourceElement, targetElement);

            // Mark all elements as raw
            raw.add(element.id);
            raw.add(sourceElement.id);
            raw.add(targetElement.id);

            // If triple was generated, add it and mark elements as used
            if (result.triple) {
              triples.push(result.triple);
              used.add(element.id);
              used.add(sourceElement.id);
              used.add(targetElement.id);
            }

            // Mark any elements with syntax errors as invalid
            for (const invalidId of result.invalidIds) {
              invalid.add(invalidId);
            }

            continue; // Skip standard triple generation for raw patterns
          }

          const arrowResult = this.#arrowToTriples(domain, prefixes, usedPrefixes, elements, element, primaryKeys);

          if (arrowResult.length > 0) {
            triples.push(...arrowResult);
            used.add(element.id);
            used.add(sourceElement.id);
            used.add(targetElement.id);
          } else {
            // Arrow couldn't generate triples - check if arrow or target has syntax errors
            // (Don't cascade invalid status from source or if source is external)
            if (sourceElement.type === 'diamond' && !invalid.has(sourceElement.id) && !this.#isExternal(sourceElement, domain)) {
              // Source is valid, so check if arrow or target has syntax errors
              const sourceType = sourceElement.type;
              const targetType = targetElement.type;

              if (sourceType === 'diamond' && targetType === 'rectangle') {
                // Check if arrow text is invalid
                const resolvedArrow = this.#resolveDiamondToRectangleArrow(domain, prefixes, usedPrefixes, element);
                if (!resolvedArrow) {
                  invalid.add(element.id);
                }
                // Check if target text is invalid
                const resolvedTarget = this.#resolveRectangle(domain, prefixes, usedPrefixes, targetElement);
                if (!resolvedTarget && !used.has(targetElement.id)) {
                  invalid.add(targetElement.id);
                }
              } else if (sourceType === 'diamond' && targetType === 'diamond') {
                // Check if arrow text is invalid
                const resolvedArrow = this.#resolveDiamondToDiamondArrow(domain, prefixes, usedPrefixes, element);
                if (!resolvedArrow) {
                  invalid.add(element.id);
                }
                // Check if target text is invalid (target diamond already checked in first pass)
              } else if (sourceType === 'diamond' && targetType === 'text') {
                // Check if arrow text is invalid
                const resolvedArrow = this.#resolveDiamondToTextArrow(element.text);
                if (!resolvedArrow) {
                  invalid.add(element.id);
                }
              }
            }
          }
        }
        // If arrow is missing source or target, it will be marked ignored
        // (handled by not being in used set)
      }
    }

    // Calculate ignored as inverse of used
    const ignored = /** @type {Set<string>} */ (new Set());
    for (const id of Object.keys(elements)) {
      if (!used.has(id)) {
        ignored.add(id);
      }
    }

    // Third pass: generate primary key list triples for diamonds
    for (const [diamondId, pkArray] of primaryKeys.entries()) {
      if (pkArray.length === 0) {
        continue;
      }

      const diamondElement = elements[diamondId];
      if (!diamondElement || diamondElement.type !== 'diamond') {
        continue;
      }

      const diamondSubject = this.#resolveDiamond(domain, prefixes, usedPrefixes, diamondElement);
      const pkPredicate = this.#resolveCurie(domain, prefixes, usedPrefixes, 'upper:primaryKey');
      const rdfFirst = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:first');
      const rdfRest = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:rest');
      const rdfNil = this.#resolveCurie(domain, prefixes, usedPrefixes, 'rdf:nil');

      if (diamondSubject && pkPredicate && rdfFirst && rdfRest && rdfNil) {
        // Sort by order and create RDF list using proper N-Triples blank nodes
        const sortedPks = pkArray.sort((a, b) => a.order - b.order);

        // Validate primary key sequence
        let firstInvalidIndex = -1;
        for (let i = 0; i < sortedPks.length; i++) {
          const expectedOrder = i + 1;
          const actualOrder = sortedPks[i].order;
          if (actualOrder !== expectedOrder) {
            // Found invalid sequence - mark this arrow and all subsequent arrows as invalid
            firstInvalidIndex = i;
            break;
          }
        }

        // Mark invalid arrows
        if (firstInvalidIndex !== -1) {
          for (let i = firstInvalidIndex; i < sortedPks.length; i++) {
            invalid.add(sortedPks[i].arrowId);
          }
        }

        // Generate blank node IDs for list structure
        const blankNodes = sortedPks.map((_, i) => `_:pk${diamondId}_${i}`);

        // Connect diamond to first list node
        triples.push(`<${diamondSubject.uri}> <${pkPredicate.uri}> ${blankNodes[0]} .`);

        // Generate list structure
        for (let i = 0; i < sortedPks.length; i++) {
          const pk = sortedPks[i];
          const currentNode = blankNodes[i];
          const nextNode = i < sortedPks.length - 1 ? blankNodes[i + 1] : `<${rdfNil.uri}>`;

          triples.push(`${currentNode} <${rdfFirst.uri}> <${pk.attributeUri}> .`);
          triples.push(`${currentNode} <${rdfRest.uri}> ${nextNode} .`);
        }
      }
    }

    const deduplicatedTriples = [...new Set(triples)];
    const sortedDeduplicatedTriples = deduplicatedTriples.toSorted();
    const nTriples = sortedDeduplicatedTriples.join('\n') + '\n';

    // Create set of CURIEs that have primary keys
    const keyedCuries = /** @type {Set<string>} */ (new Set());
    for (const diamondId of primaryKeys.keys()) {
      const diamondElement = elements[diamondId];
      if (diamondElement && diamondElement.type === 'diamond') {
        const resolved = this.#resolveDiamond(domain, prefixes, usedPrefixes, diamondElement);
        if (resolved) {
          keyedCuries.add(resolved.uri);
        }
      }
    }

    // Create set of diamond IDs that have primary keys (includes all diamonds with matching CURIEs)
    const keyed = /** @type {Set<string>} */ (new Set());
    for (const element of Object.values(elements)) {
      if (element.type === 'diamond') {
        const resolved = this.#resolveDiamond(domain, prefixes, usedPrefixes, element);
        if (resolved && keyedCuries.has(resolved.uri)) {
          keyed.add(element.id);
        }
      }
    }

    return { prefixes: usedPrefixes, nTriples, ignored, raw, invalid, keyed };
  }
}
