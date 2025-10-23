import { Validate } from '../src/utils/validate.js';
import { assertThrows } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('Validate.defined', () => {
  it('accepts defined values', () => {
    Validate.defined(0);
    Validate.defined('');
    Validate.defined(false);
    Validate.defined({});
    Validate.defined([]);
  });

  it('throws for null', () => {
    assertThrows(() => Validate.defined(null), 'object must be defined');
  });

  it('throws for undefined', () => {
    assertThrows(() => Validate.defined(undefined), 'object must be defined');
  });

  it('uses custom name in error message', () => {
    assertThrows(() => Validate.defined(null, 'customField'), 'customField must be defined');
  });
});

describe('Validate.coordinate', () => {
  it('accepts number coordinates', () => {
    Validate.coordinate(0);
    Validate.coordinate(100);
    Validate.coordinate(-50);
    Validate.coordinate(3.14);
  });

  it('throws for non-number values', () => {
    assertThrows(() => Validate.coordinate('100'), 'coordinate must be a number');
    assertThrows(() => Validate.coordinate(null), 'coordinate must be a number');
    assertThrows(() => Validate.coordinate(undefined), 'coordinate must be a number');
    assertThrows(() => Validate.coordinate({}), 'coordinate must be a number');
  });

  it('uses custom name in error message', () => {
    assertThrows(() => Validate.coordinate('x', 'xCoord'), 'xCoord must be a number');
  });
});

describe('Validate.string', () => {
  it('accepts string values', () => {
    Validate.string('');
    Validate.string('hello');
    Validate.string('123');
  });

  it('throws for non-string values', () => {
    assertThrows(() => Validate.string(123), 'value must be a string');
    assertThrows(() => Validate.string(null), 'value must be a string');
    assertThrows(() => Validate.string(undefined), 'value must be a string');
    assertThrows(() => Validate.string({}), 'value must be a string');
  });

  it('uses custom name in error message', () => {
    assertThrows(() => Validate.string(123, 'id'), 'id must be a string');
  });
});

describe('Validate.element', () => {
  it('accepts valid rectangle element', () => {
    Validate.element({
      id: 'rect-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: 'Test',
    });
  });

  it('accepts valid diamond element', () => {
    Validate.element({
      id: 'diamond-1',
      type: 'diamond',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: 'Test',
    });
  });

  it('accepts valid arrow element', () => {
    Validate.element({
      id: 'arrow-1',
      type: 'arrow',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      source: null,
      target: null,
      text: 'Arrow',
    });
  });

  it('accepts valid text element', () => {
    Validate.element({
      id: 'text-1',
      type: 'text',
      x: 0,
      y: 0,
      text: 'Hello',
    });
  });

  it('accepts valid tree element', () => {
    Validate.element({
      id: 'tree-1',
      type: 'tree',
      root: 'root-id',
      items: [],
    });
  });

  it('throws for missing id', () => {
    assertThrows(
      () => Validate.element({ type: 'rectangle', x: 0, y: 0, width: 100, height: 100, text: '' }),
      'element must have type and id properties'
    );
  });

  it('throws for missing type', () => {
    assertThrows(
      () => Validate.element({ id: 'rect-1', x: 0, y: 0, width: 100, height: 100, text: '' }),
      'element must have type and id properties'
    );
  });

  it('throws for invalid type', () => {
    assertThrows(
      () => Validate.element({ id: 'invalid', type: 'invalid', text: '' }),
      'element.type must be one of: rectangle, diamond, arrow, text, tree'
    );
  });

  it('throws for missing text on non-tree elements', () => {
    assertThrows(
      () => Validate.element({ id: 'rect-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 }),
      'element must have text property'
    );
  });

  it('throws for extra fields on rectangle', () => {
    assertThrows(
      () => Validate.element({
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        text: '',
        extra: 'field',
      }),
      'element.extra is not a valid field'
    );
  });

  it('throws for missing width on rectangle', () => {
    assertThrows(
      () => Validate.element({ id: 'rect-1', type: 'rectangle', x: 0, y: 0, height: 100, text: '' }),
      'element.width is required'
    );
  });

  it('throws for width below minimum', () => {
    assertThrows(
      () => Validate.element({ id: 'rect-1', type: 'rectangle', x: 0, y: 0, width: 10, height: 100, text: '' }),
      'element.width absolute value must be at least 24px'
    );
  });

  it('throws for height below minimum', () => {
    assertThrows(
      () => Validate.element({ id: 'rect-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 10, text: '' }),
      'element.height absolute value must be at least 24px'
    );
  });

  it('throws for missing arrow coordinates', () => {
    assertThrows(
      () => Validate.element({ id: 'arrow-1', type: 'arrow', source: null, target: null, text: '' }),
      'element.x1 is required'
    );
  });

  it('throws for invalid arrow source type', () => {
    assertThrows(
      () => Validate.element({
        id: 'arrow-1',
        type: 'arrow',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        source: 123,
        target: null,
        text: '',
      }),
      'element.source must be a string or null'
    );
  });

  it('throws for missing tree root', () => {
    assertThrows(
      () => Validate.element({ id: 'tree-1', type: 'tree', items: [] }),
      'element.root is required'
    );
  });

  it('throws for non-array tree items', () => {
    assertThrows(
      () => Validate.element({ id: 'tree-1', type: 'tree', root: 'root-id', items: 'not-array' }),
      'element.items must be an array'
    );
  });

  it('throws for invalid tree item structure', () => {
    assertThrows(
      () => Validate.element({
        id: 'tree-1',
        type: 'tree',
        root: 'root-id',
        items: [{ parent: 'root-id' }],
      }),
      'element.items[0] must have parent and element properties'
    );
  });

  it('throws for tree with x/y coordinates', () => {
    assertThrows(
      () => Validate.element({
        id: 'tree-1',
        type: 'tree',
        root: 'root-id',
        items: [],
        x: 0,
        y: 0,
      }),
      'element.x is not a valid field'
    );
  });
});

describe('Validate.elements', () => {
  it('accepts valid elements object', () => {
    Validate.elements({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        text: '',
      },
    });
  });

  it('throws for array instead of object', () => {
    assertThrows(() => Validate.elements([]), 'elements must be an object (not an array)');
  });

  it('throws for null', () => {
    assertThrows(() => Validate.elements(null), 'elements must be an object (not an array)');
  });

  it('throws when key does not match element id', () => {
    assertThrows(
      () => Validate.elements({
        'rect-1': {
          id: 'rect-2',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: '',
        },
      }),
      "elements['rect-1'].id must match the key 'rect-1'"
    );
  });

  it('validates tree structure - throws for missing root element', () => {
    assertThrows(
      () => Validate.elements({
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'missing-root',
          items: [],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('validates tree structure - throws for non-diamond root', () => {
    assertThrows(
      () => Validate.elements({
        'root-id': {
          id: 'root-id',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: 'Root',
        },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'root-id',
          items: [],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('validates tree structure - throws for missing item element', () => {
    assertThrows(
      () => Validate.elements({
        'root-id': {
          id: 'root-id',
          type: 'diamond',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: 'Root',
        },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'root-id',
          items: [{ parent: 'root-id', element: 'missing-child' }],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('validates tree structure - throws for non-diamond item', () => {
    assertThrows(
      () => Validate.elements({
        'root-id': {
          id: 'root-id',
          type: 'diamond',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: 'Root',
        },
        'child-1': {
          id: 'child-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: 'Child',
        },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'root-id',
          items: [{ parent: 'root-id', element: 'child-1' }],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('validates tree structure - throws for self-reference', () => {
    assertThrows(
      () => Validate.elements({
        'root-id': {
          id: 'root-id',
          type: 'diamond',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: 'Root',
        },
        'child-1': {
          id: 'child-1',
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: 'Child',
        },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'root-id',
          items: [{ parent: 'child-1', element: 'child-1' }],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('validates tree structure - throws for cycle', () => {
    assertThrows(
      () => Validate.elements({
        'root-id': {
          id: 'root-id',
          type: 'diamond',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: 'Root',
        },
        'child-1': {
          id: 'child-1',
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: 'Child 1',
        },
        'child-2': {
          id: 'child-2',
          type: 'diamond',
          x: 200,
          y: 100,
          width: 100,
          height: 100,
          text: 'Child 2',
        },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'root-id',
          items: [
            { parent: 'root-id', element: 'child-1' },
            { parent: 'child-1', element: 'child-2' },
            { parent: 'child-2', element: 'child-1' },
          ],
        },
      }),
      "elements['tree-1'] has invalid tree structure (check that root and all items exist, are diamonds, and no cycles exist)"
    );
  });

  it('accepts valid tree structure', () => {
    Validate.elements({
      'root-id': {
        id: 'root-id',
        type: 'diamond',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        text: 'Root',
      },
      'child-1': {
        id: 'child-1',
        type: 'diamond',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        text: 'Child 1',
      },
      'child-2': {
        id: 'child-2',
        type: 'diamond',
        x: 200,
        y: 100,
        width: 100,
        height: 100,
        text: 'Child 2',
      },
      'tree-1': {
        id: 'tree-1',
        type: 'tree',
        root: 'root-id',
        items: [
          { parent: 'root-id', element: 'child-1' },
          { parent: 'root-id', element: 'child-2' },
        ],
      },
    });
  });
});

describe('Validate.scene', () => {
  it('accepts valid scene object', () => {
    Validate.scene({ x: 0, y: 0, k: 1 });
    Validate.scene({ x: 100, y: -50, k: 2.5 });
  });

  it('throws for non-object', () => {
    assertThrows(() => Validate.scene(null), 'scene must be an object');
    assertThrows(() => Validate.scene('scene'), 'scene must be an object');
  });

  it('throws for missing x', () => {
    assertThrows(() => Validate.scene({ y: 0, k: 1 }), 'scene must have x, y, and k properties');
  });

  it('throws for missing y', () => {
    assertThrows(() => Validate.scene({ x: 0, k: 1 }), 'scene must have x, y, and k properties');
  });

  it('throws for missing k', () => {
    assertThrows(() => Validate.scene({ x: 0, y: 0 }), 'scene must have x, y, and k properties');
  });

  it('throws for extra fields', () => {
    assertThrows(() => Validate.scene({ x: 0, y: 0, k: 1, extra: 'field' }), 'scene.extra is not a valid field');
  });

  it('throws for non-number x', () => {
    assertThrows(() => Validate.scene({ x: '0', y: 0, k: 1 }), 'scene.x must be a number');
  });

  it('throws for non-number y', () => {
    assertThrows(() => Validate.scene({ x: 0, y: '0', k: 1 }), 'scene.y must be a number');
  });

  it('throws for non-number k', () => {
    assertThrows(() => Validate.scene({ x: 0, y: 0, k: '1' }), 'scene.k must be a number');
  });
});

describe('Validate.prefixes', () => {
  it('accepts valid prefixes object', () => {
    Validate.prefixes({});
    Validate.prefixes({ test: 'https://test.com#' });
    Validate.prefixes({
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    });
  });

  it('throws for non-object', () => {
    assertThrows(() => Validate.prefixes(null), 'prefixes must be an object (not an array)');
    assertThrows(() => Validate.prefixes([]), 'prefixes must be an object (not an array)');
  });

  it('throws for non-string value', () => {
    assertThrows(() => Validate.prefixes({ test: 123 }), "prefixes['test'] must be a string, got number");
  });
});

describe('Validate.domain', () => {
  it('accepts string domain', () => {
    Validate.domain('test');
    Validate.domain('my-domain');
  });

  it('throws for non-string', () => {
    assertThrows(() => Validate.domain(123), 'domain must be a string');
    assertThrows(() => Validate.domain(null), 'domain must be a string');
    assertThrows(() => Validate.domain({}), 'domain must be a string');
  });
});

describe('Validate.document', () => {
  it('accepts valid document', () => {
    Validate.document({
      domain: 'test',
      prefixes: { test: 'https://test.com#' },
      elements: {},
      nTriples: '',
    });
  });

  it('throws for non-object', () => {
    assertThrows(() => Validate.document(null), 'document must be an object');
    assertThrows(() => Validate.document([]), 'document must be an object');
  });

  it('throws for missing prefixes', () => {
    assertThrows(
      () => Validate.document({ domain: 'test', elements: {} }),
      'document.prefixes is required'
    );
  });

  it('throws for missing domain', () => {
    assertThrows(
      () => Validate.document({ prefixes: {}, elements: {} }),
      'document.domain is required'
    );
  });

  it('throws for missing elements', () => {
    assertThrows(
      () => Validate.document({ domain: 'test', prefixes: {} }),
      'document.elements is required'
    );
  });

  it('throws for unexpected keys', () => {
    assertThrows(
      () => Validate.document({
        domain: 'test',
        prefixes: {},
        elements: {},
        nTriples: '',
        extra: 'field',
      }),
      'unexpected key in document: extra'
    );
  });

  it('validates nested prefixes', () => {
    assertThrows(
      () => Validate.document({
        domain: 'test',
        prefixes: { test: 123 },
        elements: {},
        nTriples: '',
      }),
      "prefixes['test'] must be a string, got number"
    );
  });

  it('validates nested elements', () => {
    assertThrows(
      () => Validate.document({
        domain: 'test',
        prefixes: {},
        elements: { 'rect-1': { id: 'rect-1' } },
        nTriples: '',
      }),
      "elements['rect-1'] must have type and id properties"
    );
  });
});

describe('Validate.elementType', () => {
  it('accepts valid element types', () => {
    Validate.elementType('rectangle');
    Validate.elementType('diamond');
    Validate.elementType('arrow');
    Validate.elementType('text');
    Validate.elementType('tree');
  });

  it('throws for non-string', () => {
    assertThrows(() => Validate.elementType(123), 'type must be a string');
  });

  it('throws for invalid type', () => {
    assertThrows(
      () => Validate.elementType('invalid'),
      'type must be one of: rectangle, diamond, arrow, text, tree'
    );
  });
});

describe('Validate.hasElementType', () => {
  it('accepts element with matching type', () => {
    const element = {
      id: 'rect-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: '',
    };
    Validate.hasElementType(element, 'rectangle');
  });

  it('throws for element with non-matching type', () => {
    const element = {
      id: 'rect-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      text: '',
    };
    assertThrows(
      () => Validate.hasElementType(element, 'diamond'),
      "element.type must be 'diamond', got 'rectangle'"
    );
  });
});
