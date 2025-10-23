import { assert } from '@netflix/x-test/x-test.js';

/**
 * @param {TemplateStringsArray} strings 
 */
export const dedent = (strings, ...values) => {
  if (values.length) {
    throw new Error('No interpolation allowed.');
  }
  const lines = strings.join('').split('\n');
  const indent = lines[0].match(/^ */)[0].length;
  const trimmedLines = [];
  for (const line of lines) {
    trimmedLines.push(line.slice(indent));
  }
  return trimmedLines.slice(0, -1).join('\n');
};

/**
 * Note, this is _very_ loosely coded for simplicity. Complex input will
 * produce unexpected / wrong results.
 * @param {TemplateStringsArray} strings
 */
export const minify = (strings, ...values) => {
  if (values.length) {
    throw new Error('No interpolation allowed.');
  }
  return strings
    .join('')
    .replaceAll(/\n/g, '')
    .replaceAll(/: /g, ':')
    .replaceAll(/, /g, ',')
    .replaceAll(/{ /g, '{')
    .replaceAll(/ }/g, '}')
    .replaceAll(/ {2,}/g, '');
};

/**
 * Find first difference between two objects
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} path - Current path (e.g., "actual.elements")
 * @returns {{type: string, path: string, actual: *, expected: *}|null}
 */
const findFirstDifference = (actual, expected, path = 'actual') => {
  // Primitives that are equal
  if (actual === expected) {
    return null;
  }

  // Type mismatch or null handling
  if (typeof actual !== typeof expected || actual === null || expected === null) {
    return { type: 'value', path, actual, expected };
  }

  // Both are objects/arrays - check structure
  if (typeof actual === 'object') {
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);

    // Check for extra keys in actual
    for (const key of actualKeys) {
      if (!(key in expected)) {
        return { type: 'extra', path: `${path}.${key}`, actual: actual[key] };
      }
    }

    // Check for missing keys in actual
    for (const key of expectedKeys) {
      if (!(key in actual)) {
        return { type: 'missing', path: `${path}.${key}`, expected: expected[key] };
      }
    }

    // Check values recursively
    for (const key of expectedKeys) {
      const diff = findFirstDifference(actual[key], expected[key], `${path}.${key}`);
      if (diff) {
        return diff;
      }
    }

    // All keys and values match
    return null;
  }

  // Different primitive values
  return { type: 'value', path, actual, expected };
};

export const html = (strings, ...values) => {
  if (values.length) {
    throw new Error('No interpolation!');
  }
  return strings.join('');
};

/**
 * Assert that two state strings are equal, with helpful diff on failure
 * @param {string} actual - Actual state JSON string
 * @param {string} expected - Expected state JSON string
 * @param {string[]} [check] - Optional array of top-level keys to check (default: check all keys)
 */
export const assertStateEqual = (actual, expected, check) => {
  let actualObj = JSON.parse(actual);
  let expectedObj = JSON.parse(expected);

  // If check array is provided, validate and filter both objects to only include those keys
  if (check && Array.isArray(check)) {
    // Validate that all keys in check array are valid state keys
    const validStateKeys = ['elements', 'scene', 'tool', 'viewX', 'viewY', 'down', 'interaction'];
    for (const key of check) {
      if (!validStateKeys.includes(key)) {
        throw new Error(`Invalid state key in check array: "${key}". Valid keys are: ${validStateKeys.join(', ')}`);
      }
    }

    const filterKeys = (obj) => {
      const filtered = {};
      for (const key of check) {
        if (key in obj) {
          filtered[key] = obj[key];
        }
      }
      return filtered;
    };
    actualObj = filterKeys(actualObj);
    expectedObj = filterKeys(expectedObj);
  }

  // Sort object keys for consistent comparison (elements are now sorted in canonical form)
  const sortKeys = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    }
    return Object.fromEntries(
      Object.entries(obj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  };

  const actualFiltered = JSON.stringify(sortKeys(actualObj));
  const expectedFiltered = JSON.stringify(sortKeys(expectedObj));
  const pass = actualFiltered === expectedFiltered;
  let message = '';

  if (!pass) {
    const diff = findFirstDifference(actualObj, expectedObj);

    if (diff) {
      if (diff.type === 'extra') {
        message = `Expected "${diff.path}" NOT to exist.`;
      } else if (diff.type === 'missing') {
        message = `Expected "${diff.path}" to exist.`;
      } else if (diff.type === 'value') {
        const actualStr = JSON.stringify(diff.actual);
        const expectedStr = JSON.stringify(diff.expected);
        message = `Expected "${diff.path}" to be ${expectedStr}, got ${actualStr}.`;
      }
    }
  }
  assert(pass, message);
};

/**
 * Assert that a callback throws an error with a specific message
 * @param {Function} callback - Function that should throw
 * @param {string} expectedMessage - Expected error message
 * @param {{ startsWith: boolean }} [options] - Optional options.
 */
export const assertThrows = (callback, expectedMessage, options) => {
  let threw = false;
  try {
    callback();
  } catch (error) {
    threw = true;
    if (options?.startsWith === true) {
      assert(error.message.startsWith(expectedMessage), error.message);
    } else {
      assert(error.message === expectedMessage, error.message);
    }
  }
  assert(threw, 'no error was thrown');
};

/**
 * Generate a descriptive label for a DOM element
 * @param {Element} element - DOM element
 * @returns {string} - Descriptive label (e.g., "#myId", ".myClass", "div")
 */
const getElementLabel = (element) => {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.classList.length > 0) {
    return `.${element.classList[0]}`;
  }
  if (element.tagName) {
    return element.tagName.toLowerCase();
  }
  return 'element';
};

/**
 * Assert that a DOM element has a specific number of child elements
 * @param {Element} element - DOM element to check
 * @param {number} count - Expected number of child elements
 */
export const assertDOMChildElementCount = (element, count) => {
  const label = getElementLabel(element);
  const actual = element.childElementCount;
  assert(actual === count, `Expected ${label} to have ${count.toLocaleString()} children, got ${actual.toLocaleString()}`);
};

/**
 * Assert that a DOM element has a specific type (via data-type attribute)
 * @param {Element} element - DOM element to check
 * @param {string} type - Expected element type
 */
export const assertDOMIsElementType = (element, type) => {
  const label = getElementLabel(element);
  const actualType = element.getAttribute('data-type');
  assert(actualType === type, `Expected ${label} to have data-type="${type}", got "${actualType}"`);
};

/**
 * Assert that a DOM element has specific text content
 * @param {Element} element - DOM element to check
 * @param {string} text - Expected text content
 */
export const assertDOMHasText = (element, text) => {
  const label = getElementLabel(element);
  const actual = element.textContent;
  assert(actual === text, `Expected ${label} text to be '${text}', got '${actual}'`);
};

/**
 * Convert an element to a descriptive string with attributes
 * @param {Element} element - DOM element
 * @returns {string} - Descriptive string (e.g., "g[data-type='rectangle']")
 */
const toElementString = (element) => {
  const tag = element.localName || element.nodeName.toLowerCase();
  const attributes = Array.from(element.attributes)
    .filter(({ name }) => name === 'id' || name === 'class' || name.startsWith('data-'))
    .map(({ name, value }) => value ? `${name}="${value}"` : name);
  return `${tag}${attributes.length ? `[${attributes.join('][')}]` : ''}`;
};

/**
 * Compare two DOM nodes recursively, checking structure, attributes, and text content
 * @param {Node} actual - Actual DOM node
 * @param {Node} expected - Expected DOM node
 * @param {string} path - Current path for error reporting
 * @returns {{match: boolean, message: string}} - Comparison result
 */
const compareNodes = (actual, expected, path = 'root') => {
  // Check node type
  if (actual.nodeType !== expected.nodeType) {
    return {
      match: false,
      message: `Node type mismatch at ${path}: expected ${expected.nodeType}, got ${actual.nodeType}`,
    };
  }

  // For text nodes, compare text content
  if (actual.nodeType === Node.TEXT_NODE) {
    const actualText = actual.textContent.trim();
    const expectedText = expected.textContent.trim();
    if (actualText !== expectedText) {
      return {
        match: false,
        message: `Text content mismatch at ${path}: expected "${expectedText}", got "${actualText}"`,
      };
    }
    return { match: true };
  }

  // For element nodes, compare tag name, attributes, and children
  if (actual.nodeType === Node.ELEMENT_NODE) {
    // Check tag name
    if (actual.tagName !== expected.tagName) {
      return {
        match: false,
        message: `Tag name mismatch at ${path}: expected <${expected.tagName.toLowerCase()}>, got <${actual.tagName.toLowerCase()}>`,
      };
    }

    // Check attributes
    const actualAttrs = Array.from(actual.attributes).sort((a, b) => a.name.localeCompare(b.name));
    const expectedAttrs = Array.from(expected.attributes).sort((a, b) => a.name.localeCompare(b.name));

    if (actualAttrs.length !== expectedAttrs.length) {
      const actualNames = actualAttrs.map((a) => a.name);
      const expectedNames = expectedAttrs.map((a) => a.name);
      const extra = actualNames.filter((n) => !expectedNames.includes(n));
      const missing = expectedNames.filter((n) => !actualNames.includes(n));

      let details = '';
      if (extra.length > 0) {
        details = `, extra: [${extra.join(', ')}]`;
      }
      if (missing.length > 0) {
        details += `, missing: [${missing.join(', ')}]`;
      }

      return {
        match: false,
        message: `Attribute count mismatch at ${path}: expected ${expectedAttrs.length} attributes, got ${actualAttrs.length}${details}`,
      };
    }

    for (let i = 0; i < expectedAttrs.length; i++) {
      if (actualAttrs[i].name !== expectedAttrs[i].name) {
        return {
          match: false,
          message: `Attribute name mismatch at ${path}: expected "${expectedAttrs[i].name}", got "${actualAttrs[i].name}"`,
        };
      }

      const expectedValue = expectedAttrs[i].value;
      const actualValue = actualAttrs[i].value;

      // Skip comparison if expected value is "__skip__"
      if (expectedValue === '__skip__') {
        continue;
      }

      // Check for approximate number matching: __number__
      const approxMatch = expectedValue.match(/^__(.+)__$/);
      if (approxMatch) {
        const expectedNum = parseFloat(approxMatch[1]);
        const actualNum = parseFloat(actualValue);

        if (!isNaN(expectedNum) && !isNaN(actualNum)) {
          // Calculate 2% tolerance
          const tolerance = Math.abs(expectedNum * 0.02);
          const diff = Math.abs(actualNum - expectedNum);

          if (diff > tolerance) {
            return {
              match: false,
              message: `Attribute value mismatch at ${path} [${actualAttrs[i].name}]: expected ~${expectedNum} (±2%), got ${actualNum} (diff: ${diff.toFixed(2)})`,
            };
          }
          continue;
        }
      }

      // Exact comparison
      if (actualValue !== expectedValue) {
        return {
          match: false,
          message: `Attribute value mismatch at ${path} [${actualAttrs[i].name}]: expected "${expectedValue}", got "${actualValue}"`,
        };
      }
    }

    // Check children (filter out empty text nodes)
    const actualChildren = Array.from(actual.childNodes).filter(
      (node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== '',
    );
    const expectedChildren = Array.from(expected.childNodes).filter(
      (node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim() !== '',
    );

    if (actualChildren.length !== expectedChildren.length) {
      const expectedWord = expectedChildren.length === 1 ? 'child' : 'children';
      const actualWord = actualChildren.length === 1 ? 'child' : 'children';
      return {
        match: false,
        message: `Child count mismatch at ${path}: expected ${expectedChildren.length} ${expectedWord}, got ${actualChildren.length} ${actualWord}`,
      };
    }

    // Recursively compare children
    for (let i = 0; i < expectedChildren.length; i++) {
      const childElement = expectedChildren[i].nodeType === Node.ELEMENT_NODE ? expectedChildren[i] : null;
      const childPath = childElement
        ? `${path} > ${toElementString(childElement)}`
        : `${path} > ${expectedChildren[i].nodeName.toLowerCase()}[${i}]`;
      const result = compareNodes(actualChildren[i], expectedChildren[i], childPath);
      if (!result.match) {
        return result;
      }
    }
  }

  return { match: true };
};

/**
 * Assert that a DOM element matches the expected markup structure.
 * Compares DOM tree structure, attributes, and text content (not properties).
 * @param {Element} element - DOM element to check
 * @param {string} markup - Expected HTML markup
 */
export const assertDOM = (element, markup) => {
  const label = getElementLabel(element);

  // Parse expected markup into DOM
  const template = document.createElement('template');
  template.innerHTML = markup;
  const expected = template.content.firstElementChild;

  if (!expected) {
    assert(false, `Failed to parse expected markup for ${label}`);
    return;
  }

  // Compare the DOM trees
  const result = compareNodes(element, expected, label);
  assert(result.match, result.message || 'DOM structure mismatch');
};

/**
 * Assert that a hit test result matches the expected result
 * @param {null|{id: string, feature: string}} actual - Actual hit result
 * @param {null|{id: string, feature: string}} expected - Expected hit result
 */
export const assertHit = (actual, expected) => {
  // Both null - pass
  if (actual === null && expected === null) {
    return;
  }

  // One is null, the other isn't - fail
  if (actual === null && expected !== null) {
    assert(false, `Expected to hit {id: '${expected.id}', feature: '${expected.feature}'}, got null`);
    return;
  }

  if (actual !== null && expected === null) {
    assert(false, `Expected null, got {id: '${actual.id}', feature: '${actual.feature}'}`);
    return;
  }

  // Both are objects - compare id and feature
  if (actual.id !== expected.id) {
    assert(false, `Expected id '${expected.id}', got '${actual.id}'`);
    return;
  }

  if (actual.feature !== expected.feature) {
    assert(false, `Expected feature '${expected.feature}', got '${actual.feature}'`);
    return;
  }

  // All checks passed
  assert(true);
};

/**
 * Parse ASCII diagram into expected layout positions.
 * Format:
 * - Grid markers: ┼───┼ mark y=0
 * - Left margin: │ marks x=0
 * - Boxes: ┌────┐ with element ID inside
 * - Scale: 1 char = 4px horizontal, 1 line = 10px vertical
 *
 * @param {string} ascii - ASCII diagram string
 * @returns {{[key: string]: {x: number, y: number}}}
 */
export const stringToTreeLayout = (ascii) => {
  const lines = ascii.split('\n');
  const result = {};

  // Find y=0 reference (row with ┼───┼)
  let yZeroRow = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('┼') && lines[i].includes('─')) {
      yZeroRow = i;
      break;
    }
  }

  if (yZeroRow === -1) {
    throw new Error('Could not find y=0 reference line (┼───┼)');
  }

  // Find x=0 reference (column with │)
  let xZeroCol = -1;
  for (const line of lines) {
    const idx = line.indexOf('│');
    if (idx !== -1) {
      xZeroCol = idx;
      break;
    }
  }

  if (xZeroCol === -1) {
    throw new Error('Could not find x=0 reference column (│)');
  }

  // Find all boxes (┌ characters)
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === '┌') {
        // Found top-left corner of a box
        // Find top-right corner (┐)
        let topRightCol = col + 1;
        while (topRightCol < line.length && line[topRightCol] !== '┐') {
          topRightCol++;
        }
        if (topRightCol >= line.length) {continue;}

        // Find bottom-left corner (└)
        let bottomRow = row + 1;
        while (bottomRow < lines.length && lines[bottomRow][col] !== '└') {
          bottomRow++;
        }
        if (bottomRow >= lines.length) {continue;}

        // Extract label (element ID inside box, trimmed)
        let label = '';
        for (let r = row + 1; r < bottomRow; r++) {
          if (r < lines.length) {
            const contentLine = lines[r].slice(col + 1, topRightCol);
            const trimmed = contentLine.replace(/[│]/g, '').trim();
            if (trimmed) {
              label = trimmed;
              break;
            }
          }
        }

        if (label) {
          // Calculate position in pixels
          // Position is measured from top-left corner (┌)
          const xPx = (col - xZeroCol) * 4;
          const yPx = (row - yZeroRow) * 10;

          result[label] = { x: xPx, y: yPx };
        }
      }
    }
  }

  return result;
};

/**
 * Convert a tree layout object to an ASCII diagram string.
 * @param {Object} elements - All elements in the diagram
 * @param {Object} tree - The tree element
 * @param {{[key: string]: {x: number, y: number}}} layout - Layout from Tree.layout()
 * @returns {string} ASCII diagram representation
 */
export const treeLayoutToString = (elements, tree, layout) => {
  if (Object.keys(layout).length === 0) {
    return '(empty layout)';
  }

  // Find bounds of all elements (including origin)
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;

  for (const [elementId, pos] of Object.entries(layout)) {
    const element = elements[elementId];
    if (element && (element.type === 'diamond' || element.type === 'rectangle')) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + element.width);
      maxY = Math.max(maxY, pos.y + element.height);
    }
  }

  // Add padding and convert to grid coordinates
  // Ensure the grid includes the origin (0, 0)
  const gridMinX = Math.min(0, Math.floor(minX / 4));
  const gridMinY = Math.min(0, Math.floor(minY / 10));
  const gridMaxX = Math.max(0, Math.ceil(maxX / 4)) + 8;
  const gridMaxY = Math.max(0, Math.ceil(maxY / 10)) + 8;

  const width = gridMaxX - gridMinX;
  const height = gridMaxY - gridMinY;

  // Create empty grid
  const grid = Array(height)
    .fill(null)
    .map(() => ' '.repeat(width).split(''));

  // Calculate where the origin (0, 0) falls within the grid
  const xZeroCol = 0 - gridMinX;
  const yZeroRow = 0 - gridMinY;

  // Top reference line
  if (yZeroRow >= 0 && yZeroRow < height) {
    grid[yZeroRow][0] = '┼';
    for (let col = 1; col < width - 1; col++) {
      grid[yZeroRow][col] = '─';
    }
    grid[yZeroRow][width - 1] = '┼';
  }

  // Left margin
  if (xZeroCol >= 0 && xZeroCol < width) {
    for (let row = 0; row < height; row++) {
      if (row !== yZeroRow && row !== height - 1) {
        grid[row][xZeroCol] = '│';
      }
    }
  }

  // Bottom reference line
  if (xZeroCol >= 0 && xZeroCol < width) {
    grid[height - 1][xZeroCol] = '┼';
  }

  // Draw boxes for each element in layout (including root)
  for (const [elementId, { x, y }] of Object.entries(layout)) {
    const element = elements[elementId];
    if (!element || (element.type !== 'diamond' && element.type !== 'rectangle')) {
      continue;
    }

    const col = Math.round(x / 4) - gridMinX;
    const row = Math.round(y / 10) - gridMinY;

    // Calculate box dimensions based on element size
    const boxWidth = Math.round(element.width / 4);
    const boxHeight = Math.round(element.height / 10);
    const boxRightCol = col + boxWidth;
    const boxBottomRow = row + boxHeight;

    // Draw box if it fits in the grid
    if (row >= 0 && boxBottomRow < height && col >= 0 && boxRightCol < width) {
      // Top line
      grid[row][col] = '┌';
      for (let c = col + 1; c < boxRightCol; c++) {
        grid[row][c] = '─';
      }
      grid[row][boxRightCol] = '┐';

      // Middle lines with label in upper-left corner
      const labelRow = row + 1;
      const labelText = elementId.substring(0, 1);
      const labelStart = col + 1;

      for (let r = row + 1; r < boxBottomRow; r++) {
        grid[r][col] = '│';
        if (r === labelRow) {
          // Draw label in upper-left corner
          for (let i = 0; i < labelText.length && labelStart + i < boxRightCol; i++) {
            grid[r][labelStart + i] = labelText[i];
          }
        }
        grid[r][boxRightCol] = '│';
      }

      // Bottom line
      grid[boxBottomRow][col] = '└';
      for (let c = col + 1; c < boxRightCol; c++) {
        grid[boxBottomRow][c] = '─';
      }
      grid[boxBottomRow][boxRightCol] = '┘';
    }
  }

  return grid.map((row) => row.join('')).join('\n');
};

/**
 * Assert that actual tree layout matches expected ASCII diagram.
 * @param {Object} elements - All elements in the diagram
 * @param {Object} tree - The tree element
 * @param {{[key: string]: {x: number, y: number}}} layout - Actual layout from Tree.layout()
 * @param {string} diagram - ASCII diagram with expected positions
 */
export const assertTreeLayout = (elements, tree, layout, diagram) => {
  const expected = stringToTreeLayout(diagram);

  // Check each expected element (including root)
  for (const [elementId, expectedPos] of Object.entries(expected)) {
    const actualPos = layout[elementId];
    if (!actualPos) {
      const actualDiagram = treeLayoutToString(elements, tree, layout);
      assert(
        false,
        `No position found for element "${elementId}"\n\nExpected:\n${diagram}\n\nActual layout:\n${actualDiagram}`
      );
      return;
    }

    const xTolerance = 4; // Each character is 4, we expect to be able to draw to the closest character.
    const yTolerance = 10; // Each line is 10, we expect to be able to draw to the closest line.
    if (Math.abs(actualPos.x - expectedPos.x) > xTolerance) {
      const actualDiagram = treeLayoutToString(elements, tree, layout);
      assert(
        false,
        `Position mismatch for "${elementId}": expected x=${expectedPos.x}, got x=${actualPos.x}\n\nExpected:\n${diagram}\n\nActual:\n${actualDiagram}`
      );
      return;
    }
    if (Math.abs(actualPos.y - expectedPos.y) > yTolerance) {
      const actualDiagram = treeLayoutToString(elements, tree, layout);
      assert(
        false,
        `Position mismatch for "${elementId}": expected y=${expectedPos.y}, got y=${actualPos.y}\n\nExpected:\n${diagram}\n\nActual:\n${actualDiagram}`
      );
      return;
    }
  }

  // Check that we have the expected number of items (including root)
  const expectedCount = Object.keys(expected).length;
  const actualCount = Object.keys(layout).length;
  if (actualCount !== expectedCount) {
    assert(
      false,
      `Layout size mismatch: expected ${expectedCount} items, got ${actualCount}`
    );
    return;
  }

  // All checks passed
  assert(true);
};

/**
 * Create an upper-doodle element with proper test dimensions (1000×1000px)
 * This ensures kx = ky = 1 for predictable coordinate transforms
 * @returns {HTMLElement} The created element
 */
export const createTestElement = () => {
  const element = document.createElement('upper-doodle');
  element.style.width = '1000px';
  element.style.height = '1000px';
  return element;
};

/**
 * Create a default document structure for tests
 * @returns {{ domain: string, prefixes: Record<string, string>, elements: Record<string, any>, nTriples: string }}
 */
export const createDefaultDoc = () => {
  return {
    domain: 'test',
    prefixes: {
      test: 'https://github.com/theengineear/onto/test#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      upper: 'https://github.com/theengineear/ns/upper#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
    elements: {},
    nTriples: '',
  };
};

/**
 * Assert that the actual object matches the expected one. Treat as plain object.
 * Checks both value equality and key ordering.
 * @param {object} expected - Expected object
 * @param {object} actual - Actual object
 */
export const assertOrderedObjectEqual = (expected, actual) => {
  // First check deep equality with helpful error messages
  const valueDiff = findFirstDifference(actual, expected);
  if (valueDiff) {
    let message = '';
    if (valueDiff.type === 'extra') {
      message = `Unexpected property at "${valueDiff.path}": ${JSON.stringify(valueDiff.actual)}`;
    } else if (valueDiff.type === 'missing') {
      message = `Missing property at "${valueDiff.path}": expected ${JSON.stringify(valueDiff.expected)}`;
    } else if (valueDiff.type === 'value') {
      message = `Value mismatch at "${valueDiff.path}": expected ${JSON.stringify(valueDiff.expected)}, got ${JSON.stringify(valueDiff.actual)}`;
    }
    assert(false, message);
    return;
  }

  // Then check key ordering recursively
  const checkKeyOrder = (actualObj, expectedObj, path = 'root') => {
    // Handle non-object values
    if (actualObj === null || expectedObj === null || typeof actualObj !== 'object' || typeof expectedObj !== 'object') {
      return null;
    }

    // Handle arrays
    if (Array.isArray(actualObj) && Array.isArray(expectedObj)) {
      for (let i = 0; i < expectedObj.length; i++) {
        const result = checkKeyOrder(actualObj[i], expectedObj[i], `${path}[${i}]`);
        if (result) {
          return result;
        }
      }
      return null;
    }

    // Handle objects - check key order
    const actualKeys = Object.keys(actualObj);
    const expectedKeys = Object.keys(expectedObj);

    // Keys should be in the same order
    for (let i = 0; i < expectedKeys.length; i++) {
      if (actualKeys[i] !== expectedKeys[i]) {
        return {
          path,
          expectedOrder: expectedKeys,
          actualOrder: actualKeys,
        };
      }
    }

    // Recursively check nested objects
    for (const key of expectedKeys) {
      const result = checkKeyOrder(actualObj[key], expectedObj[key], `${path}.${key}`);
      if (result) {
        return result;
      }
    }

    return null;
  };

  const orderDiff = checkKeyOrder(actual, expected);
  if (orderDiff) {
    const message = `Key order mismatch at "${orderDiff.path}":\n  Expected: [${orderDiff.expectedOrder.join(', ')}]\n  Actual:   [${orderDiff.actualOrder.join(', ')}]`;
    assert(false, message);
  }
};

/**
 * Assert that the actual JSON string matches the expected one.
 * Checks both structural equality (with key ordering) and exact string equality.
 * @param {string} expected - Expected JSON string
 * @param {string} actual - Actual JSON string
 */
export const assertJSONEqual = (expected, actual) => {
  // 1. Parse both JSON strings with helpful error messages
  let parsedExpected;
  let parsedActual;

  try {
    parsedExpected = JSON.parse(expected);
  } catch (error) {
    assert(false, `Failed to parse expected JSON: ${error.message}\n${expected}`);
    return;
  }

  try {
    parsedActual = JSON.parse(actual);
  } catch (error) {
    assert(false, `Failed to parse actual JSON: ${error.message}\n${actual}`);
    return;
  }

  // 2. Check structural equality and key ordering
  assertOrderedObjectEqual(parsedExpected, parsedActual);

  // 3. Check exact string equality (ensures formatting is consistent)
  if (expected !== actual) {
    // Provide a helpful diff showing where strings diverge
    let diffPos = 0;
    while (diffPos < expected.length && diffPos < actual.length && expected[diffPos] === actual[diffPos]) {
      diffPos++;
    }

    const contextStart = Math.max(0, diffPos - 20);
    const contextEnd = Math.min(Math.max(expected.length, actual.length), diffPos + 20);

    const expectedContext = expected.substring(contextStart, contextEnd);
    const actualContext = actual.substring(contextStart, contextEnd);

    assert(
      false,
      `JSON strings differ at position ${diffPos}:\n  Expected: ...${expectedContext}...\n  Actual:   ...${actualContext}...`
    );
  }
};
