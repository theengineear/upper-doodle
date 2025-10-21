import { TYPE_ABBREVIATIONS, DIAMOND_TO_TEXT_PREDICATES, ELEMENT_TYPES } from './types.js';

/**
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Arrow} Arrow
 * @typedef {import('./types.js').Diamond} Diamond
 * @typedef {import('./types.js').Rectangle} Rectangle
 * @typedef {import('./types.js').Text} Text
 * @typedef {import('./types.js').Tree} Tree
 * @typedef {import('./types.js').ViewTransform} ViewTransform
 * @typedef {import('./types.js').Interaction} Interaction
 * @typedef {import('./types.js').StateShape} StateShape
 */

/**
 * Get direct children of an element in the tree.
 * @param {Tree} tree - The tree element
 * @param {string} parentId - ID of the parent element (can be root or item)
 * @returns {string[]} Array of child element IDs
 */
const getChildren = (tree, parentId) => {
  return tree.items
    .filter(item => item.parent === parentId)
    .map(item => item.element);
};

/**
 * Validate tree structure.
 * Checks:
 * - Root element exists and is a diamond
 * - All item elements exist and are diamonds
 * - All parents exist (either as root or in items list)
 * - No circular references
 * @param {import('./types.js').Elements} elements - All elements in the diagram
 * @param {Tree} tree - The tree element to validate
 * @returns {boolean} True if tree structure is valid
 */
const validateTreeStructure = (elements, tree) => {
  // Check root exists
  const root = elements[tree.root];
  if (!root) {
    return false;
  }

  // Check root is a diamond
  if (root.type !== 'diamond') {
    return false;
  }

  // Build set of all element IDs in tree (root + items)
  const treeElementIds = new Set([tree.root]);
  for (const item of tree.items) {
    treeElementIds.add(item.element);
  }

  // Check all items
  for (const treeItem of tree.items) {
    // Check item element exists
    const element = elements[treeItem.element];
    if (!element) {
      return false;
    }

    // Check item is a diamond
    if (element.type !== 'diamond') {
      return false;
    }

    // Check parent exists in tree (either root or another item)
    if (!treeElementIds.has(treeItem.parent)) {
      return false;
    }

    // Check for self-reference
    if (treeItem.element === treeItem.parent) {
      return false;
    }
  }

  // Check for cycles using depth-first search
  const visited = new Set();
  const recursionStack = new Set();

  /**
   * Detect cycle using DFS
   * @param {string} nodeId - Current node ID
   * @returns {boolean} True if cycle detected
   */
  const hasCycle = (nodeId) => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const children = getChildren(tree, nodeId);
    for (const childId of children) {
      if (!visited.has(childId)) {
        if (hasCycle(childId)) {
          return true;
        }
      } else if (recursionStack.has(childId)) {
        // Found a back edge (cycle)
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  // Check for cycles starting from root
  if (hasCycle(tree.root)) {
    return false;
  }

  return true;
};

/**
 * Minimum shape dimensions (in pixels)
 * Shapes are inset by 16px total (8px per side), so the rendered shape must be at least 8px
 * This means the bounding box must be at least 24px (16px inset + 8px minimum shape size)
 */
const MIN_SHAPE_DIMENSION = 24;

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
  static defined(value, name) {
    name ??= 'object';
    if (value === null || value === undefined) {
      throw new Error(`${name} must be defined`);
    }
  }

  /**
   * Validates a coordinate value
   * @param {unknown} coordinate - Value to validate as a coordinate
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts coordinate is number}
   */
  static coordinate(coordinate, name) {
    name ??= 'coordinate';
    if (typeof coordinate !== 'number') {
      throw new TypeError(`${name} must be a number`);
    }
  }

  /**
   * Validates a coordinate delta value
   * @param {unknown} coordinateDelta - Value to validate as a coordinate delta
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts coordinateDelta is number}
   */
  static coordinateDelta(coordinateDelta, name) {
    name ??= 'coordinateDelta';
    if (typeof coordinateDelta !== 'number') {
      throw new TypeError(`${name} must be a number`);
    }
  }

  /**
   * Validates a scale factor value
   * @param {unknown} scaleFactor - Value to validate as a scale factor
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts scaleFactor is number}
   */
  static scaleFactor(scaleFactor, name) {
    name ??= 'scaleFactor';
    if (typeof scaleFactor !== 'number') {
      throw new TypeError(`${name} must be a number`);
    }
  }

  /**
   * Validates a string value
   * @param {unknown} value - Value to validate as a string
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts value is string}
   */
  static string(value, name) {
    name ??= 'value';
    if (typeof value !== 'string') {
      throw new TypeError(`${name} must be a string`);
    }
  }

  /**
   * Validates a key string
   * @param {unknown} key - Value to validate as a key
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts key is string}
   */
  static key(key, name) {
    name ??= 'key';
    if (typeof key !== 'string') {
      throw new TypeError(`${name} must be a string`);
    }
  }

  /**
   * Validates an element object
   * @param {unknown} element - Value to validate as an element
   * @param {string} [name] - Name to use in error messages
   * @returns {asserts element is Element}
   */
  static element(element, name) {
    name ??= 'element';
    if (!element || typeof element !== 'object') {
      throw new TypeError(`${name} must be an object`);
    }

    // Type narrow: check that required properties exist
    if (!('type' in element) || !('id' in element)) {
      throw new TypeError(`${name} must have type and id properties`);
    }

    // Trees don't have text property, others do
    if (element.type !== 'tree' && !('text' in element)) {
      throw new TypeError(`${name} must have text property`);
    }

    // Define valid types
    if (typeof element.type !== 'string' || !/** @type {readonly string[]} */ (ELEMENT_TYPES).includes(element.type)) {
      throw new TypeError(`${name}.type must be one of: ${ELEMENT_TYPES.join(', ')}`);
    }

    // Define required fields based on element type
    const baseFields = ['id', 'type', 'text'];
    const baseFieldsNoText = ['id', 'type'];
    const shapeCoordinateFields = ['x', 'y', 'width', 'height'];
    const textCoordinateFields = ['x', 'y'];
    const arrowCoordinateFields = ['x1', 'y1', 'x2', 'y2'];
    const arrowSpecificFields = ['source', 'target'];
    const treeSpecificFields = ['root', 'items'];

    let expectedFields;
    switch (element.type) {
      case 'arrow':
        expectedFields = [
          ...baseFields,
          ...arrowCoordinateFields,
          ...arrowSpecificFields,
        ];
        break;
      case 'text':
        expectedFields = [
          ...baseFields,
          ...textCoordinateFields,
        ];
        break;
      case 'rectangle':
      case 'diamond':
        expectedFields = [
          ...baseFields,
          ...shapeCoordinateFields,
        ];
        break;
      case 'tree':
        expectedFields = [
          ...baseFieldsNoText,
          ...treeSpecificFields,
        ];
        break;
      default:
        throw new TypeError(`${name}.type must be one of: ${ELEMENT_TYPES.join(', ')}`);
    }

    // Check for missing fields
    for (const field of expectedFields) {
      if (!(field in element)) {
        throw new TypeError(`${name}.${field} is required`);
      }
    }

    // Check for extra fields
    const actualFields = Object.keys(element);
    for (const field of actualFields) {
      if (!expectedFields.includes(field)) {
        throw new TypeError(`${name}.${field} is not a valid field`);
      }
    }

    // Validate field types
    if (typeof element.id !== 'string') {
      throw new TypeError(`${name}.id must be a string`);
    }

    // Validate coordinate fields based on type
    if (element.type === 'arrow') {
      // Type narrow for arrow coordinates
      if (
        !('x1' in element) ||
        !('y1' in element) ||
        !('x2' in element) ||
        !('y2' in element) ||
        !('source' in element) ||
        !('target' in element)
      ) {
        throw new TypeError(`${name} must have arrow coordinate fields`);
      }
      if (typeof element.x1 !== 'number') {
        throw new TypeError(`${name}.x1 must be a number`);
      }
      if (typeof element.y1 !== 'number') {
        throw new TypeError(`${name}.y1 must be a number`);
      }
      if (typeof element.x2 !== 'number') {
        throw new TypeError(`${name}.x2 must be a number`);
      }
      if (typeof element.y2 !== 'number') {
        throw new TypeError(`${name}.y2 must be a number`);
      }
    } else if (element.type === 'text') {
      // Type narrow for text coordinates
      if (!('x' in element) || !('y' in element)) {
        throw new TypeError(`${name} must have text coordinate fields`);
      }
      // Text elements
      if (typeof element.x !== 'number') {
        throw new TypeError(`${name}.x must be a number`);
      }
      if (typeof element.y !== 'number') {
        throw new TypeError(`${name}.y must be a number`);
      }
    } else if (element.type === 'rectangle' || element.type === 'diamond') {
      // Type narrow for shape coordinates
      if (!('x' in element) || !('y' in element) || !('width' in element) || !('height' in element)) {
        throw new TypeError(`${name} must have shape coordinate fields`);
      }
      // Shapes: rectangle, diamond
      if (typeof element.x !== 'number') {
        throw new TypeError(`${name}.x must be a number`);
      }
      if (typeof element.y !== 'number') {
        throw new TypeError(`${name}.y must be a number`);
      }
      if (typeof element.width !== 'number') {
        throw new TypeError(`${name}.width must be a number`);
      }
      if (typeof element.height !== 'number') {
        throw new TypeError(`${name}.height must be a number`);
      }

      // Validate minimum dimensions (negative values are allowed during creation)
      if (Math.abs(element.width) < MIN_SHAPE_DIMENSION) {
        throw new TypeError(`${name}.width absolute value must be at least ${MIN_SHAPE_DIMENSION}px`);
      }
      if (Math.abs(element.height) < MIN_SHAPE_DIMENSION) {
        throw new TypeError(`${name}.height absolute value must be at least ${MIN_SHAPE_DIMENSION}px`);
      }
    }
    // Note: trees don't have coordinate fields, so no validation needed

    if (element.type !== 'tree') {
      if (!('text' in element) || typeof element.text !== 'string') {
        throw new TypeError(`${name}.text must be a string`);
      }
    }

    // Validate tree-specific fields
    if (element.type === 'tree') {
      if (!('root' in element) || !('items' in element)) {
        throw new TypeError(`${name} must have root and items properties`);
      }
      if (typeof element.root !== 'string') {
        throw new TypeError(`${name}.root must be a string`);
      }
      if (!Array.isArray(element.items)) {
        throw new TypeError(`${name}.items must be an array`);
      }
      for (let i = 0; i < element.items.length; i++) {
        const item = element.items[i];
        if (!item || typeof item !== 'object') {
          throw new TypeError(`${name}.items[${i}] must be an object`);
        }
        if (!('parent' in item) || !('element' in item)) {
          throw new TypeError(`${name}.items[${i}] must have parent and element properties`);
        }
        if (typeof item.parent !== 'string') {
          throw new TypeError(`${name}.items[${i}].parent must be a string`);
        }
        if (typeof item.element !== 'string') {
          throw new TypeError(`${name}.items[${i}].element must be a string`);
        }
      }
    }

    // Validate arrow-specific fields
    if (element.type === 'arrow') {
      if (!('source' in element) || !('target' in element)) {
        throw new TypeError(`${name} must have source and target properties`);
      }
      if (element.source !== null && typeof element.source !== 'string') {
        throw new TypeError(`${name}.source must be a string or null`);
      }

      if (element.target !== null && typeof element.target !== 'string') {
        throw new TypeError(`${name}.target must be a string or null`);
      }
    }
  }

  /**
   * Validates an elements object (map of id to element)
   * @param {unknown} elements - Value to validate as an elements object
   * @returns {asserts elements is Record<string, Element>}
   */
  static elements(elements) {
    if (!elements || typeof elements !== 'object' || Array.isArray(elements)) {
      throw new TypeError('elements must be an object (not an array)');
    }

    for (const [id, element] of Object.entries(elements)) {
      Validate.element(element, `elements['${id}']`);
      // Ensure the key matches the element's id
      if (element.id !== id) {
        throw new TypeError(`elements['${id}'].id must match the key '${id}'`);
      }
    }

    // Validate tree structures (check that referenced elements exist, no cycles, etc.)
    // Cast to Elements after validation
    const validElements = /** @type {import('./types.js').Elements} */ (elements);
    for (const [id, element] of Object.entries(validElements)) {
      if (element.type === 'tree') {
        const isValid = validateTreeStructure(validElements, element);
        if (!isValid) {
          throw new TypeError(`elements['${id}'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)`);
        }
      }
    }
  }

  /**
   * Validates a scene/view transform object
   * @param {unknown} scene - Value to validate as a scene object
   * @returns {asserts scene is ViewTransform}
   */
  static scene(scene) {
    if (!scene || typeof scene !== 'object') {
      throw new TypeError('scene must be an object');
    }

    // Type narrow: check required properties
    if (!('x' in scene) || !('y' in scene) || !('k' in scene)) {
      throw new TypeError('scene must have x, y, and k properties');
    }

    // Check for extra scene fields
    const requiredSceneFields = ['x', 'y', 'k'];
    const actualSceneFields = Object.keys(scene);
    for (const field of actualSceneFields) {
      if (!requiredSceneFields.includes(field)) {
        throw new TypeError(`scene.${field} is not a valid field`);
      }
    }

    // Validate scene field types
    if (typeof scene.x !== 'number') {
      throw new TypeError('scene.x must be a number');
    }

    if (typeof scene.y !== 'number') {
      throw new TypeError('scene.y must be a number');
    }

    if (typeof scene.k !== 'number') {
      throw new TypeError('scene.k must be a number');
    }
  }

  /**
   * Validates an element type string
   * @param {unknown} type - Value to validate as an element type
   * @returns {asserts type is 'rectangle' | 'diamond' | 'arrow' | 'text' | 'tree'}
   */
  static elementType(type) {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (!/** @type {readonly string[]} */ (ELEMENT_TYPES).includes(type)) {
      throw new TypeError(`type must be one of: ${ELEMENT_TYPES.join(', ')}`);
    }
  }

  /**
   * Validates that a predicate is a known diamond-to-text predicate type
   * @param {unknown} predicate - Value to validate as a diamond-to-text predicate
   * @returns {asserts predicate is import('./types.js').DiamondToTextPredicate}
   */
  static isDiamondToTextPredicate(predicate) {
    for (const value of DIAMOND_TO_TEXT_PREDICATES) {
      if (predicate === value) {
        return;
      }
    }
    throw new TypeError(`element.text must be one of: ${DIAMOND_TO_TEXT_PREDICATES.join(', ')}, got '${predicate}'`);
  }

  /**
   * Validates that a type abbreviation is a known type-abbreviation type
   * @param {unknown} abbv - Value to validate as a type-abbreviation
   * @returns {asserts abbv is import('./types.js').TypeAbbreviation}
   */
  static isTypeAbbreviation(abbv) {
    for (const key of Object.keys(TYPE_ABBREVIATIONS)) {
      if (abbv === key) {
        return;
      }
    }
    throw new TypeError(`abbv must be one of: ${Object.keys(TYPE_ABBREVIATIONS).join(', ')}, got '${abbv}'`);
  }

  /**
   * Type guard that validates an element has a specific type
   * @template {Element['type']} T
   * @param {Element} element - Element to validate
   * @param {T} expectedType - Expected element type
   * @returns {asserts element is Extract<Element, {type: T}>}
   */
  static hasElementType(element, expectedType) {
    if (element.type !== expectedType) {
      throw new TypeError(`element.type must be '${expectedType}', got '${element.type}'`);
    }
  }

  /**
   * Validates a view X coordinate (number or null)
   * @param {unknown} viewX - Value to validate as viewX
   * @returns {asserts viewX is number | null}
   */
  static viewX(viewX) {
    if (viewX !== null && typeof viewX !== 'number') {
      throw new TypeError('viewX must be a number or null');
    }
  }

  /**
   * Validates a view Y coordinate (number or null)
   * @param {unknown} viewY - Value to validate as viewY
   * @returns {asserts viewY is number | null}
   */
  static viewY(viewY) {
    if (viewY !== null && typeof viewY !== 'number') {
      throw new TypeError('viewY must be a number or null');
    }
  }

  /**
   * Validates a boolean down state
   * @param {unknown} down - Value to validate as a boolean
   * @returns {asserts down is boolean}
   */
  static down(down) {
    if (typeof down !== 'boolean') {
      throw new TypeError('down must be a boolean');
    }
  }

  /**
   * Validates an interaction object
   * @param {unknown} interaction - Value to validate as an interaction
   * @returns {asserts interaction is Interaction | null}
   */
  static interaction(interaction) {
    if (interaction !== null && typeof interaction !== 'object') {
      throw new TypeError('interaction must be an object or null');
    }

    if (interaction !== null) {
      // Type narrow: check required property
      if (!('type' in interaction)) {
        throw new TypeError('interaction.type is required');
      }

      // Validate required fields
      if (typeof interaction.type !== 'string') {
        throw new TypeError('interaction.type must be a string');
      }

      // Validate optional fields if present
      if ('elementIds' in interaction) {
        if (!Array.isArray(interaction.elementIds)) {
          throw new TypeError('interaction.elementIds must be an array');
        }
        for (const id of interaction.elementIds) {
          if (typeof id !== 'string') {
            throw new TypeError('interaction.elementIds must contain only strings');
          }
        }
      }

      if ('elementId' in interaction) {
        if (typeof interaction.elementId !== 'string') {
          throw new TypeError('interaction.elementId must be a string');
        }
      }
    }
  }

  /**
   * Validates a prefixes object (map of prefix to URI)
   * @param {unknown} prefixes - Value to validate as prefixes
   * @returns {asserts prefixes is Record<string, string>}
   */
  static prefixes(prefixes) {
    if (!prefixes || typeof prefixes !== 'object' || Array.isArray(prefixes)) {
      throw new TypeError('prefixes must be an object (not an array)');
    }

    for (const [prefix, uri] of Object.entries(prefixes)) {
      if (typeof prefix !== 'string') {
        throw new TypeError(`prefix key must be a string, got ${typeof prefix}`);
      }
      if (typeof uri !== 'string') {
        throw new TypeError(`prefixes['${prefix}'] must be a string, got ${typeof uri}`);
      }
    }
  }

  /**
   * Validates a domain string
   * @param {unknown} domain - Value to validate as domain
   * @returns {asserts domain is string}
   */
  static domain(domain) {
    if (typeof domain !== 'string') {
      throw new TypeError('domain must be a string');
    }
  }

  /**
   * Validates a document object (prefixes, domain, elements)
   * @param {unknown} doc - Value to validate as document
   * @returns {asserts doc is { prefixes: Record<string, string>, domain: string, elements: Record<string, Element> }}
   */
  static document(doc) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      throw new TypeError('document must be an object');
    }

    // Check all required keys exist
    const requiredKeys = ['prefixes', 'domain', 'elements'];
    for (const key of requiredKeys) {
      if (!(key in doc)) {
        throw new TypeError(`document.${key} is required`);
      }
    }

    // Check for unexpected keys
    const actualKeys = Object.keys(doc);
    for (const key of actualKeys) {
      if (!requiredKeys.includes(key)) {
        throw new TypeError(`unexpected key in document: ${key}`);
      }
    }

    // Cast to Record to access properties for validation
    const record = /** @type {Record<string, unknown>} */ (doc);

    // Validate each property
    Validate.prefixes(record.prefixes);
    Validate.domain(record.domain);
    Validate.elements(record.elements);
  }

  /**
   * Validates a complete state object
   * @param {unknown} state - Value to validate as a state
   * @returns {asserts state is StateShape}
   */
  static state(state) {
    // Validate state structure - must be an object
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      throw new TypeError('state must be an object');
    }

    // Check for required top-level keys
    if (!('persistent' in state) || !('ephemeral' in state)) {
      throw new TypeError('state must have persistent and ephemeral properties');
    }

    // Check for unexpected keys
    const actualKeys = Object.keys(state);
    const expectedKeys = ['persistent', 'ephemeral'];
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key)) {
        throw new TypeError(`unexpected key in state: ${key}`);
      }
    }

    // Cast to Record to access properties
    const record = /** @type {Record<string, unknown>} */ (state);

    // Validate persistent state
    const persistent = record.persistent;
    if (!persistent || typeof persistent !== 'object' || Array.isArray(persistent)) {
      throw new TypeError('state.persistent must be an object');
    }

    const persistentRecord = /** @type {Record<string, unknown>} */ (persistent);
    const persistentKeys = ['prefixes', 'domain', 'elements', 'scene'];
    for (const key of persistentKeys) {
      if (!(key in persistent)) {
        throw new TypeError(`state.persistent.${key} is required`);
      }
    }

    const actualPersistentKeys = Object.keys(persistent);
    for (const key of actualPersistentKeys) {
      if (!persistentKeys.includes(key)) {
        throw new TypeError(`unexpected key in state.persistent: ${key}`);
      }
    }

    Validate.prefixes(persistentRecord.prefixes);
    Validate.domain(persistentRecord.domain);
    Validate.elements(persistentRecord.elements);
    Validate.scene(persistentRecord.scene);

    // Validate ephemeral state
    const ephemeral = record.ephemeral;
    if (!ephemeral || typeof ephemeral !== 'object' || Array.isArray(ephemeral)) {
      throw new TypeError('state.ephemeral must be an object');
    }

    const ephemeralRecord = /** @type {Record<string, unknown>} */ (ephemeral);
    const ephemeralKeys = ['viewX', 'viewY', 'down', 'interaction'];
    for (const key of ephemeralKeys) {
      if (!(key in ephemeral)) {
        throw new TypeError(`state.ephemeral.${key} is required`);
      }
    }

    const actualEphemeralKeys = Object.keys(ephemeral);
    for (const key of actualEphemeralKeys) {
      if (!ephemeralKeys.includes(key)) {
        throw new TypeError(`unexpected key in state.ephemeral: ${key}`);
      }
    }

    Validate.viewX(ephemeralRecord.viewX);
    Validate.viewY(ephemeralRecord.viewY);
    Validate.down(ephemeralRecord.down);
    Validate.interaction(ephemeralRecord.interaction);
  }

  /**
   * Validates an event is of a specific type
   * @template {Event} T
   * @param {Event} event - The event to check
   * @param {new (...args: any[]) => T} EventType - The expected event constructor
   * @returns {asserts event is T}
   */
  static eventType(event, EventType) {
    if (!(event instanceof EventType)) {
      throw new TypeError(
        `Expected ${EventType.name}, got ${event.constructor.name}`
      );
    }
  }

  /**
   * Exhaustiveness check helper - forces TypeScript to ensure all cases are handled
   * @param {never} value - Should be unreachable if all cases handled
   * @returns {never}
   */
  static unreachable(value) {
    throw new Error(`Unhandled case: ${value}`);
  }
}
