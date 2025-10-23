import { UpperDoodle } from '../src/upper-doodle.js';
import { minify, assertJSONEqual } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('UpperDoodle.valueFromObject', () => {
  it('Rectangle element properties are in canonical order', () => {
    // Create element with properties in random order
    const unordered = {
      domain: 'test',
      prefixes: { test: 'https://test.com#' },
      elements: {
        'rect-1': {
          text: 'Test',
          height: 100,
          width: 200,
          y: 50,
          x: 10,
          type: 'rectangle',
          id: 'rect-1',
        },
      },
      nTriples: '',
    };

    const actual = UpperDoodle.valueFromObject(unordered);
    assertJSONEqual(minify`\
      {
        "domain": "test",
        "elements": {
          "rect-1": {
            "id": "rect-1",
            "type": "rectangle",
            "x": 10,
            "y": 50,
            "width": 200,
            "height": 100,
            "text": "Test"
          }
        },
        "nTriples": "",
        "prefixes": {
          "test": "https://test.com#"
        }
      }
    `, actual);
  });

  it('Arrow element properties are in canonical order', () => {
    const unordered = {
      domain: 'test',
      prefixes: { test: 'https://test.com#' },
      elements: {
        'arrow-1': {
          text: 'Arrow',
          target: 'shape-2',
          source: 'shape-1',
          y2: 200,
          x2: 300,
          y1: 100,
          x1: 100,
          type: 'arrow',
          id: 'arrow-1',
        },
      },
      nTriples: '',
    };

    const actual = UpperDoodle.valueFromObject(unordered);
    assertJSONEqual(minify`{\
      "domain":"test",
      "elements":{\
        "arrow-1":{\
          "id":"arrow-1",
          "type":"arrow",
          "x1":100,
          "y1":100,
          "x2":300,
          "y2":200,
          "source":"shape-1",
          "target":"shape-2",
          "text":"Arrow"
        }
      },
      "nTriples":"",
      "prefixes":{\
        "test":"https://test.com#"
      }
    }`, actual);
  });

  it('Tree element properties are in canonical order', () => {
    const unordered = {
      domain: 'test',
      prefixes: { test: 'https://test.com#' },
      elements: {
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
          items: [
            { element: 'child-1', parent: 'root-id' },
            { element: 'child-2', parent: 'root-id' },
          ],
          root: 'root-id',
          type: 'tree',
          id: 'tree-1',
        },
      },
      nTriples: '',
    };

    const actual = UpperDoodle.valueFromObject(unordered);
    assertJSONEqual(minify`
      {
        "domain": "test",
        "elements": {
          "child-1": {
            "id": "child-1",
            "type": "diamond",
            "x": 100,
            "y": 100,
            "width": 100,
            "height": 100,
            "text": "Child 1"
          },
          "child-2": {
            "id": "child-2",
            "type": "diamond",
            "x": 200,
            "y": 100,
            "width": 100,
            "height": 100,
            "text": "Child 2"
          },
          "root-id": {
            "id": "root-id",
            "type": "diamond",
            "x": 0, "y": 0,
            "width": 100, "height": 100,
            "text": "Root"
          },
          "tree-1": {
            "id": "tree-1",
            "type": "tree",
            "root": "root-id",
            "items": [
              {
                "parent": "root-id",
                "element": "child-1"
              },
              {
                "parent": "root-id",
                "element": "child-2"
              }
            ]
          }
        },
        "nTriples": "",
        "prefixes": {
          "test": "https://test.com#"
        }
      }
    `, actual);
  });

  it('Identical objects produce identical JSON strings', () => {
    const doc1 = {
      domain: 'test',
      prefixes: { test: 'https://test.com#', upper: 'https://upper.com#' },
      elements: {
        'b-elem': { id: 'b-elem', type: 'rectangle', x: 100, y: 100, width: 200, height: 100, text: '' },
        'a-elem': { id: 'a-elem', type: 'diamond', x: 50, y: 50, width: 100, height: 100, text: 'First' },
      },
      nTriples: '',
    };

    // Same document with different property order
    const doc2 = {
      prefixes: { upper: 'https://upper.com#', test: 'https://test.com#' },
      elements: {
        'a-elem': { text: 'First', height: 100, width: 100, y: 50, x: 50, type: 'diamond', id: 'a-elem' },
        'b-elem': { text: '', height: 100, width: 200, y: 100, x: 100, type: 'rectangle', id: 'b-elem' },
      },
      domain: 'test',
      nTriples: '',
    };

    const canonical1 = UpperDoodle.valueFromObject(doc1);
    const canonical2 = UpperDoodle.valueFromObject(doc2);

    if (canonical1 !== canonical2) {
      throw new Error(`Expected identical JSON strings, got:\n${canonical1}\n\nvs\n\n${canonical2}`);
    }
  });
});
