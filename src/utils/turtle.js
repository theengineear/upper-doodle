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
  // Examples:
  //   <subject> <predicate> <object> .
  //   <http://example.com/person> <http://example.com/name> "John" .
  static #LINE_PATTERN = /^\s*(?<subjectSource>\S+)\s+(?<predicateSource>\S+)\s+(?<objectSource>.+)\s+\.\s*$/;

  // Examples:
  //   <http://example.com/person>
  //   _:b1
  static #SUBJECT_PATTERN = /^(<[^>]+>|_:[^\s]+)$/;

  // Examples:
  //   <http://example.com/name>
  static #PREDICATE_PATTERN = /^<[^>]+>$/;

  // Examples:
  //   <http://example.com/thing>
  //   "John"^^<http://www.w3.org/2001/XMLSchema#string>
  //   "hello"@en
  //   _:b2
  //   "Line 1\nLine 2"@en  (with escaped newlines)
  static #OBJECT_PATTERN = /^(<[^>]+>|"(?:[^"\\]|\\.)*?"(?:\^\^<[^>]+>|@[a-z-]+)?|_:[^\s]+)$/;

  // Examples:
  //   ""
  //   "   "
  static #EMPTY_LINE_PATTERN = /^\s*$/;

  // Examples:
  //   "# This is a comment"
  //   "   # Another comment"
  static #COMMENT_LINE_PATTERN = /^\s*#/;

  // Examples:
  //   "John"
  //   "John"^^<http://www.w3.org/2001/XMLSchema#string>
  //   "hello"@en
  //   "Line 1\nLine 2"  (escaped newlines from N-Triples)
  static #LITERAL_PATTERN = /^"(?<literalValue>(?:[^"\\]|\\.)*?)"(?:\^\^<(?<datatype>[^>]+)>|@(?<language>[a-z-]+))?$/;

  // Predicate ordering: known predicates come first in this order, then alphabetical
  static #PREDICATE_ORDER = [
    'rdf:type',
    'upper:domain',
    'upper:label',
    'upper:description',
    'upper:keyedOn',
    'upper:primaryKey',
    'upper:property',
    'upper:class',
    'upper:datatype',
    'upper:minCount',
    'upper:maxCount',
    'upper:comment',
  ];

  // Cache for generated turtle strings
  static #cache = new Map();

  /**
   * Throws an error with context about the source line
   * @param {string} source - The source line that caused the error
   * @param {string} message - Error message
   * @throws {Error} Always throws
   */
  static #throwError(source, message) {
    throw new Error(`${message}\nSource: ${source}`);
  }

  /**
   * Unescape N-Triples literal escape sequences back to their original characters
   * @param {string} str - The escaped string from N-Triples
   * @returns {string} The unescaped string
   */
  static #unescapeNTriplesLiteral(str) {
    return str
      .replace(/\\t/g, '\t')    // Tab
      .replace(/\\r/g, '\r')    // Carriage return
      .replace(/\\n/g, '\n')    // Newline
      .replace(/\\"/g, '"')     // Quote
      .replace(/\\\\/g, '\\');  // Backslash must be last
  }

  /**
   * Shortens a full URI to a CURIE using the provided prefixes
   * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
   * @param {string} uri - Full URI to shorten
   * @returns {string} Shortened CURIE (e.g., "rdf:type")
   * @throws {Error} If no matching prefix is found
   */
  static #shortenUri(prefixes, uri) {
    for (const [prefix, namespace] of Object.entries(prefixes)) {
      if (uri.startsWith(namespace)) {
        const localName = uri.slice(namespace.length);
        return `${prefix}:${localName}`;
      }
    }

    // No matching prefix found - this is an error
    throw new Error(`No prefix found for URI: ${uri}`);
  }

  /**
   * Parses N-Triples format string into structured triple objects
   * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
   * @param {string} nTriplesString - N-Triples formatted string
   * @returns {Triple[]} Array of parsed triples
   */
  static #parseNTriples(prefixes, nTriplesString) {
    const lines = nTriplesString.split('\n');
    const statements = [];

    for (const line of lines) {
      if (!this.#EMPTY_LINE_PATTERN.test(line) && !this.#COMMENT_LINE_PATTERN.test(line)) {
        const match = line.match(this.#LINE_PATTERN);

        if (!match) {
          this.#throwError(line, 'Invalid N-Triples syntax - expected format: <subject> <predicate> <object> .');
        }

        // @ts-ignore - groups is guaranteed to exist after pattern match
        const { subjectSource, predicateSource, objectSource } = match.groups;

        if (!this.#SUBJECT_PATTERN.test(subjectSource)) {
          this.#throwError(line, 'Invalid subject - must be URI or blank node');
        }

        if (!this.#PREDICATE_PATTERN.test(predicateSource)) {
          this.#throwError(line, 'Invalid predicate - must be URI');
        }

        if (!this.#OBJECT_PATTERN.test(objectSource)) {
          this.#throwError(line, 'Invalid object - must be URI, literal, or blank node');
        }

        /** @type {SubjectNode} */
        let subject;
        /** @type {URINode} */
        let predicate;
        /** @type {ObjectNode} */
        let object;

        try {
          subject = subjectSource.startsWith('_:')
            ? { type: 'blank', value: subjectSource, key: subjectSource }
            : { type: 'uri', value: subjectSource, curie: this.#shortenUri(prefixes, subjectSource.slice(1, -1)), key: subjectSource };
        } catch (error) {
          const err = /** @type {Error} */ (error);
          this.#throwError(line, `Error parsing subject: ${err.message}`);
          continue; // throwError always throws, but TS doesn't know that
        }

        try {
          predicate = { type: 'uri', value: predicateSource, curie: this.#shortenUri(prefixes, predicateSource.slice(1, -1)), key: predicateSource };
        } catch (error) {
          const err = /** @type {Error} */ (error);
          this.#throwError(line, `Error parsing predicate: ${err.message}`);
          continue; // throwError always throws, but TS doesn't know that
        }

        try {
          if (objectSource.startsWith('<') && objectSource.endsWith('>')) {
            const uri = objectSource.slice(1, -1);
            object = {
              type: 'uri',
              value: objectSource,
              curie: this.#shortenUri(prefixes, uri),
              key: objectSource,
            };
          } else if (objectSource.startsWith('_:')) {
            object = { type: 'blank', value: objectSource, key: objectSource };
          } else if (objectSource.startsWith('"')) {
            // Parse literal with optional datatype or language tag
            const literalMatch = objectSource.match(this.#LITERAL_PATTERN);
            if (!literalMatch) {
              throw new Error(`Malformed literal: ${objectSource}`);
            }

            // @ts-ignore - groups is guaranteed to exist after pattern match
            const { literalValue, datatype, language } = literalMatch.groups;
            // Unescape the literal value from N-Triples format
            const unescapedValue = this.#unescapeNTriplesLiteral(literalValue);
            /** @type {LiteralNode} */
            const literalObj = { type: 'literal', value: unescapedValue, key: objectSource };

            if (datatype) {
              literalObj.datatype = datatype;
            }
            if (language) {
              literalObj.language = language;
            }
            object = literalObj;
          } else {
            throw new Error(`Unknown object type: ${objectSource}`);
          }
        } catch (error) {
          const err = /** @type {Error} */ (error);
          this.#throwError(line, `Error parsing object: ${err.message}`);
          continue; // throwError always throws, but TS doesn't know that
        }

        statements.push({
          subject,
          predicate,
          object,
          source: line,
        });
      }
    }

    return statements;
  }

  /**
   * Removes duplicate triples based on subject, predicate, and object keys
   * @param {Triple[]} triples - Array of triples
   * @returns {Triple[]} Deduplicated array of triples
   */
  static #deduplicateTriples(triples) {
    const seen = new Set();
    const deduplicated = [];

    for (const triple of triples) {
      const key = `${triple.subject.key} ${triple.predicate.key} ${triple.object.key}`;

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(triple);
      }
    }

    return deduplicated;
  }

  /**
   * Sorts predicates within a subject group according to PREDICATE_ORDER
   * @param {SubjectGroup} group - Subject group to sort
   * @returns {SubjectGroup} Sorted subject group
   */
  static #sortGroup(group) {
    // Sort predicates: known predicates first, then alphabetically
    const sortedPredicates = [...group.predicates];

    sortedPredicates.sort((a, b) => {
      const aCurie = a.predicate.curie;
      const bCurie = b.predicate.curie;

      const aIndex = this.#PREDICATE_ORDER.indexOf(aCurie);
      const bIndex = this.#PREDICATE_ORDER.indexOf(bCurie);

      // If both are in known list, sort by their position in the list
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in known list, it comes first
      if (aIndex !== -1 && bIndex === -1) {return -1;}
      if (aIndex === -1 && bIndex !== -1) {return 1;}

      // Neither in known list, sort alphabetically
      const predicateComparison = aCurie.localeCompare(bCurie);
      if (predicateComparison !== 0) {return predicateComparison;}

      // If same predicate, sort by object
      const aSort = ('curie' in a.object ? a.object.curie : undefined) || a.object.value;
      const bSort = ('curie' in b.object ? b.object.curie : undefined) || b.object.value;
      return aSort.localeCompare(bSort);
    });

    return {
      subject: group.subject,
      predicates: sortedPredicates,
    };
  }

  /**
   * Sorts subject groups alphabetically by subject key
   * @param {Object.<string, SubjectGroup>} groups - Map of subject key to group
   * @returns {Object.<string, SubjectGroup>} Sorted map of groups
   */
  static #sortGroups(groups) {
    const groupEntries = Object.entries(groups);

    // Sort groups alphabetically by subject key (classes with uppercase come first naturally)
    groupEntries.sort(([aKey], [bKey]) => {
      return aKey.localeCompare(bKey);
    });

    // Apply sortGroup to each group
    return Object.fromEntries(
      groupEntries.map(([key, group]) => [key, this.#sortGroup(group)])
    );
  }

  /**
   * Groups triples by their subject
   * @param {Triple[]} triples - Array of triples
   * @returns {Object.<string, SubjectGroup>} Map of subject key to group
   */
  static #groupTriples(triples) {
    /** @type {Object.<string, SubjectGroup>} */
    const groups = {};

    for (const triple of triples) {
      const subjectKey = triple.subject.key;

      if (!groups[subjectKey]) {
        groups[subjectKey] = {
          subject: triple.subject,
          predicates: [],
        };
      }

      // Don't group by predicate - add each triple as a separate predicate entry
      groups[subjectKey].predicates.push({
        predicate: triple.predicate,
        object: triple.object,
      });
    }

    return groups;
  }

  /**
   * Converts prefix map to Turtle @prefix declarations
   * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
   * @returns {string} Turtle prefix declarations
   */
  static #prefixesToTurtleSnippet(prefixes) {
    const prefixEntries = Object.entries(prefixes);

    // Sort prefixes alphabetically by prefix name
    prefixEntries.sort(([aPrefix], [bPrefix]) => aPrefix.localeCompare(bPrefix));

    // Find the longest prefix to determine padding
    const maxPrefixLength = Math.max(...prefixEntries.map(([prefix]) => prefix.length));

    const prefixLines = prefixEntries.map(([prefix, namespace]) => {
      const paddedPrefix = `@prefix ${prefix}:`.padEnd(maxPrefixLength + 10); // 10 = "@prefix " + ":"
      return `${paddedPrefix} <${namespace}> .`;
    });

    return prefixLines.join('\n');
  }

  /**
   * Converts a subject group to Turtle format
   * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
   * @param {SubjectGroup} group - Subject group to convert
   * @param {Object.<string, SubjectGroup>} groups - All subject groups (for list detection)
   * @returns {string} Turtle representation of the group
   */
  static #groupToTurtleSnippet(prefixes, group, groups) {
    const subjectStr = ('curie' in group.subject ? group.subject.curie : undefined) || group.subject.value;
    const predicates = group.predicates;

    // Find the longest predicate for alignment (all predicates are now indented)
    const maxPredicateLength = predicates.length > 0
      ? Math.max(...predicates.map(predicateData => {
          let predicateStr = predicateData.predicate.curie || predicateData.predicate.value;
          // Replace rdf:type with 'a' for length calculation
          if (predicateStr === 'rdf:type') {
            predicateStr = 'a';
          }
          return predicateStr.length;
        }))
      : 0;

    const predicateLines = predicates.map((predicateData) => {
      let predicateStr = predicateData.predicate.curie || predicateData.predicate.value;

      // Replace rdf:type with 'a'
      if (predicateStr === 'rdf:type') {
        predicateStr = 'a';
      }

      // Format single object
      const obj = predicateData.object;
      let objectStr;

      if (obj.type === 'literal') {
        // Use Turtle shortcuts for common datatypes
        if (obj.datatype) {
          if (obj.datatype === 'http://www.w3.org/2001/XMLSchema#integer' && /^-?\d+$/.test(obj.value)) {
            objectStr = obj.value; // No quotes for integers
          } else if (obj.datatype === 'http://www.w3.org/2001/XMLSchema#decimal' && /^-?\d*\.\d+$/.test(obj.value)) {
            objectStr = obj.value; // No quotes for decimals
          } else if (obj.datatype === 'http://www.w3.org/2001/XMLSchema#double' && /^-?\d*\.?\d+[eE][+-]?\d+$/.test(obj.value)) {
            objectStr = obj.value; // No quotes for scientific notation
          } else if (obj.datatype === 'http://www.w3.org/2001/XMLSchema#boolean' && (obj.value === 'true' || obj.value === 'false')) {
            objectStr = obj.value; // No quotes for booleans
          } else {
            // Check if the value contains newlines
            const hasNewlines = obj.value.includes('\n');

            if (hasNewlines) {
              // Use triple quotes for multi-line literals
              const indent = '        '; // 8 spaces for alignment
              const lines = obj.value.split('\n');
              const indentedLines = lines.map(line => `${indent}${line}`).join('\n');
              objectStr = `"""\n${indentedLines}\n${indent}"""`;
            } else if (obj.value.length > 80) {
              // Word wrap long single-line content
              const maxLineLength = 80;
              const indent = '        '; // 8 spaces for alignment
              const words = obj.value.split(' ');
              const lines = [];
              let currentLine = '';

              for (const word of words) {
                if (currentLine && (currentLine + ' ' + word).length > maxLineLength) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = currentLine ? currentLine + ' ' + word : word;
                }
              }
              if (currentLine) {
                lines.push(currentLine);
              }

              // Use triple quotes for wrapped literals
              const wrappedText = lines.join(`\n${indent}`);
              objectStr = `"""\n${indent}${wrappedText}\n${indent}"""`;
            } else {
              // Short single-line literal - use regular quotes
              objectStr = `"${obj.value}"`;
            }

            if (obj.datatype) {
              const datatypeCurie = this.#shortenUri(prefixes, obj.datatype);
              objectStr += `^^${datatypeCurie}`;
            }
          }
        } else {
          // Plain literal without datatype
          const hasNewlines = obj.value.includes('\n');
          if (hasNewlines) {
            // Use triple quotes for multi-line literals
            const indent = '        '; // 8 spaces for alignment
            const lines = obj.value.split('\n');
            const indentedLines = lines.map(line => `${indent}${line}`).join('\n');
            objectStr = `"""\n${indentedLines}\n${indent}"""`;
          } else {
            objectStr = `"${obj.value}"`;
          }
        }

        if (obj.language) {
          objectStr += `@${obj.language}`;
        }
      } else {
        // Check if this object is an RDF list head
        if (obj.type === 'blank' && this.#isListNode(obj, groups)) {
          objectStr = this.#serializeList(obj, groups);
        } else {
          objectStr = ('curie' in obj ? obj.curie : undefined) || obj.value;
        }
      }

      // All predicates: indented and padded for alignment
      const paddedPredicate = predicateStr.padEnd(maxPredicateLength);
      return `    ${paddedPredicate} ${objectStr} ;`;
    });

    // Add the subject on its own line and the final period on its own line
    predicateLines.unshift(subjectStr);
    predicateLines.push('.');

    return predicateLines.join('\n');
  }

  /**
   * Detects if a blank node is an RDF list node
   * @param {SubjectNode} node - Node to check
   * @param {Object.<string, SubjectGroup>} groups - All subject groups
   * @returns {boolean} True if node is a list node
   */
  static #isListNode(node, groups) {
    if (node.type !== 'blank') {
      return false;
    }

    const group = groups[node.key];
    if (!group) {
      return false;
    }

    // A list node has both rdf:first and rdf:rest predicates
    const hasFirst = group.predicates.some(p =>
      p.predicate.curie === 'rdf:first' || p.predicate.value === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#first>'
    );
    const hasRest = group.predicates.some(p =>
      p.predicate.curie === 'rdf:rest' || p.predicate.value === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#rest>'
    );

    return hasFirst && hasRest;
  }

  /**
   * Serializes an RDF list starting from a head node
   * @param {BlankNode} headNode - Starting node of the list
   * @param {Object.<string, SubjectGroup>} groups - All subject groups
   * @returns {string} Turtle list syntax
   */
  static #serializeList(headNode, groups) {
    const items = [];
    let currentNode = headNode;

    // Traverse the list structure
    while (currentNode && currentNode.type === 'blank') {
      const group = groups[currentNode.key];
      if (!group) {
        break;
      }

      // Get rdf:first (the item)
      const firstPred = group.predicates.find(p =>
        p.predicate.curie === 'rdf:first' || p.predicate.value === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#first>'
      );
      if (firstPred) {
        const itemStr = ('curie' in firstPred.object ? firstPred.object.curie : undefined) || firstPred.object.value;
        items.push(itemStr);
      }

      // Get rdf:rest (next node or rdf:nil)
      const restPred = group.predicates.find(p =>
        p.predicate.curie === 'rdf:rest' || p.predicate.value === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#rest>'
      );
      if (!restPred) {
        break;
      }

      // Check if we reached rdf:nil (end of list)
      const restCurie = 'curie' in restPred.object ? restPred.object.curie : undefined;
      if (restCurie === 'rdf:nil' ||
          restPred.object.value === '<http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>') {
        break;
      }

      // Move to next node (must be a blank node to continue)
      if (restPred.object.type !== 'blank') {
        break;
      }
      currentNode = restPred.object;
    }

    return `( ${items.join(' ')} )`;
  }

  /**
   * Generates Turtle format from N-Triples input
   * @param {Prefixes} prefixes - Mapping of prefix names to namespace URIs
   * @param {string} nTriples - N-Triples formatted string
   * @returns {string} Turtle formatted string
   */
  static generate(prefixes, nTriples) {
    // Check cache first
    if (this.#cache.has(nTriples)) {
      return this.#cache.get(nTriples);
    }

    const triples = this.#deduplicateTriples(this.#parseNTriples(prefixes, nTriples));
    const groups = this.#sortGroups(this.#groupTriples(triples));

    // Filter out list nodes from groups (they'll be inlined)
    /** @type {Object.<string, SubjectGroup>} */
    const filteredGroups = {};
    for (const [key, group] of Object.entries(groups)) {
      if (!this.#isListNode(group.subject, groups)) {
        filteredGroups[key] = group;
      }
    }

    const snippets = [];
    snippets.push(this.#prefixesToTurtleSnippet(prefixes));
    snippets.push(...Object.values(filteredGroups).map(group => this.#groupToTurtleSnippet(prefixes, group, groups)));
    const turtle = snippets.join('\n\n') + '\n';

    // Store in cache
    this.#cache.set(nTriples, turtle);

    return turtle;
  }
}
