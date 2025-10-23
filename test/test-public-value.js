import { UpperDoodle } from '../src/upper-doodle.js';
import {
  assertStateEqual,
  assertThrows,
  assertDOMChildElementCount,
  assertDOMIsElementType,
  assertDOMHasText,
  createTestElement,
  minify,
} from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('.value setter', () => {
  it('accepts valid document', () => {
    // Use valueFromJSON to get proper canonical form
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "abcd": {
            "id": "abcd",
            "type": "arrow",
            "x1": 0,
            "y1": 0,
            "x2": 100,
            "y2": 100,
            "source": null,
            "target": null,
            "text": "foo"
          }
        },
        "nTriples": ""
      }
    `);
    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;
    element.remove();
  });

  it('throws for missing target on arrow', () => {
    const invalidJSON = minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#"
        },
        "elements": {
          "abcd": {
            "id": "abcd",
            "type": "arrow",
            "x1": 0,
            "y1": 0,
            "x2": 100,
            "y2": 100,
            "source": null,
            "text": "foo"
          }
        },
        "nTriples": ""
      }
    `;
    const element = createTestElement();
    document.body.append(element);
    const callback = () => { element.value = invalidJSON; };
    const expectedMessage = 'elements[\'abcd\'].target is required';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for element with extra fields', () => {
    const invalidJSON = minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#"
        },
        "elements": {
          "rect-1": {
            "id": "rect-1",
            "type": "rectangle",
            "x": 0,
            "y": 0,
            "width": 100,
            "height": 100,
            "text": "",
            "extraField": "invalid"
          }
        },
        "nTriples": ""
      }
    `;
    const element = createTestElement();
    document.body.append(element);
    const callback = () => { element.value = invalidJSON; };
    const expectedMessage = 'elements[\'rect-1\'].extraField is not a valid field';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for tree with x/y coordinates', () => {
    const invalidJSON = minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#"
        },
        "elements": {
          "root-id": {
            "id": "root-id",
            "type": "diamond",
            "x": 0,
            "y": 0,
            "width": 100,
            "height": 100,
            "text": "Root"
          },
          "tree-1": {
            "id": "tree-1",
            "type": "tree",
            "x": 10,
            "y": 20,
            "root": "root-id",
            "items": []
          }
        },
        "nTriples": ""
      }
    `;
    const element = createTestElement();
    document.body.append(element);
    const callback = () => { element.value = invalidJSON; };
    const expectedMessage = 'elements[\'tree-1\'].x is not a valid field';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('renders rectangle', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "rect1": {
            "id": "rect1",
            "type": "rectangle",
            "x": 100,
            "y": 100,
            "width": 200,
            "height": 100,
            "text": "Hello"
          }
        },
        "nTriples": ""
      }
    `);

    const expected = JSON.stringify({
      'rect1': {
        id: 'rect1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        text: 'Hello',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;

    // Verify state was updated
    const actual = JSON.stringify(element.valueAsObject.elements);
    assertStateEqual(actual, expected);

    // Wait for async render to complete
    await Promise.resolve();

    // Verify SVG content was rendered
    const content = element.shadowRoot.getElementById('content');

    // Should have one rectangle element with label inside
    assertDOMChildElementCount(content, 1);
    const rectGroup = content.children[0];
    assertDOMIsElementType(rectGroup, 'rectangle');
    assertDOMHasText(rectGroup.querySelector('text'), 'Hello');

    element.remove();
  });

  it('renders arrow', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "arrow1": {
            "id": "arrow1",
            "type": "arrow",
            "x1": 50,
            "y1": 50,
            "x2": 250,
            "y2": 150,
            "source": null,
            "target": null,
            "text": "World"
          }
        },
        "nTriples": ""
      }
    `);

    const expected = JSON.stringify({
      'arrow1': {
        id: 'arrow1',
        type: 'arrow',
        x1: 50,
        y1: 50,
        x2: 250,
        y2: 150,
        source: null,
        target: null,
        text: 'World',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;

    // Verify state was updated
    const actual = JSON.stringify(element.valueAsObject.elements);
    assertStateEqual(actual, expected);

    // Wait for async render to complete
    await Promise.resolve();

    // Verify SVG content was rendered
    const content = element.shadowRoot.getElementById('content');

    // Should have one arrow element with label inside
    assertDOMChildElementCount(content, 1);
    const arrowGroup = content.children[0];
    assertDOMIsElementType(arrowGroup, 'arrow');
    assertDOMHasText(arrowGroup.querySelector('text'), 'World');

    element.remove();
  });

  it('renders diamond', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "diamond1": {
            "id": "diamond1",
            "type": "diamond",
            "x": 100,
            "y": 100,
            "width": 120,
            "height": 120,
            "text": "Diamond (DC)"
          }
        },
        "nTriples": ""
      }
    `);

    const expected = JSON.stringify({
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100,
        y: 100,
        width: 120,
        height: 120,
        text: 'Diamond (DC)',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;

    // Verify state was updated
    const actual = JSON.stringify(element.valueAsObject.elements);
    assertStateEqual(actual, expected);

    // Wait for async render to complete
    await Promise.resolve();

    // Verify SVG content was rendered
    const content = element.shadowRoot.getElementById('content');

    // Should have one diamond element with label inside
    assertDOMChildElementCount(content, 1);
    const diamondGroup = content.children[0];
    assertDOMIsElementType(diamondGroup, 'diamond');
    assertDOMHasText(diamondGroup.querySelector('text'), 'Diamond (DC)');

    element.remove();
  });

  it('renders text', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`\
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "text1": {
            "id": "text1",
            "type": "text",
            "x": 50,
            "y": 100,
            "text": "Hello"
          }
        },
        "nTriples": ""
      }
    `);

    const expected = JSON.stringify({
      'text1': {
        id: 'text1',
        type: 'text',
        x: 50,
        y: 100,
        text: 'Hello',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;

    // Verify state was updated
    const actual = JSON.stringify(element.valueAsObject.elements);
    assertStateEqual(actual, expected);

    // Wait for async render to complete
    await Promise.resolve();

    // Verify SVG content was rendered
    const content = element.shadowRoot.getElementById('content');

    // Should have one text element in content layer
    assertDOMChildElementCount(content, 1);
    const textGroup = content.children[0];
    assertDOMIsElementType(textGroup, 'text');
    assertDOMHasText(textGroup.querySelector('text'), 'Hello');

    element.remove();
  });
});

describe('.value getter and .valueAsObject', () => {
  it('returns empty elements after initialization', () => {
    const element = createTestElement();
    document.body.append(element);
    const actual = JSON.stringify(element.valueAsObject.elements);
    const expected = JSON.stringify({});
    assertStateEqual(actual, expected);
    element.remove();
  });

  it('returns exact value given by .value setter', () => {
    const valueAsObject = {
      prefixes: {},
      domain: 'test',
      elements: {
        'abcd': {
          id: 'abcd',
          type: 'arrow',
          x1: 0, y1: 0, x2: 100, y2: 100,
          text: 'foo',
          source: null,
          target: null,
        },
      },
      nTriples: '',
    };
    const expected = JSON.stringify({
      'abcd': {
        id: 'abcd',
        type: 'arrow',
        x1: 0, y1: 0, x2: 100, y2: 100,
        text: 'foo',
        source: null,
        target: null,
      },
    });
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    const element = createTestElement();
    document.body.append(element);
    element.value = valueAsJSON;
    const actual = JSON.stringify(element.valueAsObject.elements);
    assertStateEqual(actual, expected);
    element.remove();
  });
});
