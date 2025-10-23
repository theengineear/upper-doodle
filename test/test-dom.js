import { UpperDoodle } from '../src/upper-doodle.js';
import { assertDOM, html, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('DOM', () => {
  it('renders exact DOM for diamond with label', async () => {
    const diamondData = JSON.stringify({
      'test-diamond': {
        id: 'test-diamond',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'Test (DC)',
      },
    });
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(diamondData) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="test-diamond" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">Test (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for rectangle with label', async () => {
    const rectangleData = JSON.stringify({
      'test-rectangle': {
        id: 'test-rectangle',
        type: 'rectangle',
        x: 100, y: 100, width: 200, height: 100,
        text: 'Test',
      },
    });
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(rectangleData) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="test-rectangle" data-type="rectangle" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="200" y="150">
                  <tspan x="200" dy="0">Test</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for arrow with label', async () => {
    const arrowData = JSON.stringify({
      'test-arrow': {
        id: 'test-arrow',
        type: 'arrow',
        x1: 50, y1: 50, x2: 250, y2: 150,
        text: 'Test',
        source: null,
        target: null,
      },
    });
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(arrowData) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="test-arrow" data-type="arrow" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="150" y="100">
                  <tspan x="150" dy="0">Test</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for text element', async () => {
    const textData = JSON.stringify({
      'test-text': {
        id: 'test-text',
        type: 'text',
        x: 50, y: 100,
        text: 'Test',
      },
    });
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(textData) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="test-text" data-type="text" data-ignored>
              <text x="50" y="100">
                <tspan x="50" dy="0">Test</tspan>
              </text>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for diamond selection box', async () => {
    const state = {
      persistent: {
        prefixes: {},
        domain: 'test',
        elements: {
          'diamond-1': {
            id: 'diamond-1',
            type: 'diamond',
            x: 100, y: 100, width: 50, height: 50,
            text: '',
          },
        },
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: {
          type: 'selection',
          elementIds: ['diamond-1'],
          startViewX: 125,
          startViewY: 125,
        },
      },
    };
    const valueAsJSON = UpperDoodle._valueFromObject(state);

    const element = createTestElement();
    document.body.append(element);
    element._value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond-1" data-type="diamond" data-ignored data-invalid>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
            </g>
          </g>
          <g id="ui">
            <rect class="outline" x="104" y="104" width="42" height="42" rx="4" ry="4"></rect>
            <circle class="handle" data-handle="nw" cx="104" cy="104" r="4"></circle>
            <circle class="handle" data-handle="ne" cx="146" cy="104" r="4"></circle>
            <circle class="handle" data-handle="se" cx="146" cy="146" r="4"></circle>
            <circle class="handle" data-handle="sw" cx="104" cy="146" r="4"></circle>
          </g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for rectangle selection box', async () => {
    const state = {
      persistent: {
        prefixes: {},
        domain: 'test',
        elements: {
          'rect-1': {
            id: 'rect-1',
            type: 'rectangle',
            x: 100, y: 100, width: 200, height: 100,
            text: '',
          },
        },
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: {
          type: 'selection',
          elementIds: ['rect-1'],
          startViewX: 200,
          startViewY: 150,
        },
      },
    };
    const valueAsJSON = UpperDoodle._valueFromObject(state);

    const element = createTestElement();
    document.body.append(element);
    element._value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="rect-1" data-type="rectangle" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
            </g>
          </g>
          <g id="ui">
            <rect class="outline" x="104" y="104" width="192" height="92" rx="4" ry="4"></rect>
            <circle class="handle" data-handle="nw" cx="104" cy="104" r="4"></circle>
            <circle class="handle" data-handle="ne" cx="296" cy="104" r="4"></circle>
            <circle class="handle" data-handle="se" cx="296" cy="196" r="4"></circle>
            <circle class="handle" data-handle="sw" cx="104" cy="196" r="4"></circle>
          </g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for arrow selection box', async () => {
    const state = {
      persistent: {
        prefixes: {},
        domain: 'test',
        elements: {
          'arrow-1': {
            id: 'arrow-1',
            type: 'arrow',
            x1: 50, y1: 50, x2: 250, y2: 150,
            text: '',
            source: null,
            target: null,
          },
        },
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: {
          type: 'selection',
          elementIds: ['arrow-1'],
          startViewX: 150,
          startViewY: 100,
        },
      },
    };
    const valueAsJSON = UpperDoodle._valueFromObject(state);

    const element = createTestElement();
    document.body.append(element);
    element._value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="arrow-1" data-type="arrow" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
            </g>
          </g>
          <g id="ui">
            <circle class="handle" data-handle="tail" cx="50" cy="50" r="4"></circle>
            <circle class="handle" data-handle="head" cx="250" cy="150" r="4"></circle>
          </g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('renders exact DOM for text selection box', async () => {
    const state = {
      persistent: {
        prefixes: {},
        domain: 'test',
        elements: {
          'text-1': {
            id: 'text-1',
            type: 'text',
            x: 50, y: 100,
            text: 'Test',
          },
        },
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: {
          type: 'selection',
          elementIds: ['text-1'],
          startViewX: 68,
          startViewY: 95,
        },
      },
    };
    const valueAsJSON = UpperDoodle._valueFromObject(state);

    const element = createTestElement();
    document.body.append(element);
    element._value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="text-1" data-type="text" data-ignored>
              <text x="50" y="100">
                <tspan x="50" dy="0">Test</tspan>
              </text>
            </g>
          </g>
          <g id="ui">
            <rect class="outline" x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
          </g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks valid text-to-text patterns as data-raw (not ignored)', async () => {
    // Setup: text → arrow → text (raw turtle-style RDF with valid CURIEs)
    const elements = JSON.stringify({
      '01-text1': {
        id: '01-text1',
        type: 'text',
        x: 100, y: 160,
        text: 'test:Movie',
      },
      '02-arrow1': {
        id: '02-arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:label',
        source: '01-text1',
        target: '03-text2',
      },
      '03-text2': {
        id: '03-text2',
        type: 'text',
        x: 380, y: 160,
        text: '"Movie"',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: all three elements are marked as data-raw but NOT data-ignored
    // (raw because they're turtle-style RDF, not ignored because they produce valid triples)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-text1" data-type="text" data-raw>
              <text x="100" y="160">
                <tspan x="100" dy="0">test:Movie</tspan>
              </text>
            </g>
            <g data-id="02-arrow1" data-type="arrow" data-raw>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="300" y="160">
                  <tspan x="300" dy="0">upper:label</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-text2" data-type="text" data-raw>
              <text x="380" y="160">
                <tspan x="380" dy="0">"Movie"</tspan>
              </text>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks invalid text-to-text patterns as data-raw and data-invalid', async () => {
    // Setup: text → arrow → text with invalid CURIE syntax
    const elements = JSON.stringify({
      '01-text1': {
        id: '01-text1',
        type: 'text',
        x: 100, y: 160,
        text: 'movie: Movie', // Invalid: space after colon
      },
      '02-arrow1': {
        id: '02-arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:label',
        source: '01-text1',
        target: '03-text2',
      },
      '03-text2': {
        id: '03-text2',
        type: 'text',
        x: 380, y: 160,
        text: '"Movie"',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: text1 is marked as data-invalid due to syntax error
    // All three are marked data-raw and data-ignored (ignored because triple couldn't be generated)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-text1" data-type="text" data-raw data-ignored data-invalid>
              <text x="100" y="160">
                <tspan x="100" dy="0">movie: Movie</tspan>
              </text>
            </g>
            <g data-id="02-arrow1" data-type="arrow" data-raw data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="300" y="160">
                  <tspan x="300" dy="0">upper:label</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-text2" data-type="text" data-raw data-ignored>
              <text x="380" y="160">
                <tspan x="380" dy="0">"Movie"</tspan>
              </text>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks invalid literal syntax as data-invalid', async () => {
    // Setup: text → arrow → text with invalid literal (missing closing quote)
    const elements = JSON.stringify({
      '01-text1': {
        id: '01-text1',
        type: 'text',
        x: 100, y: 160,
        text: 'test:Movie',
      },
      '02-arrow1': {
        id: '02-arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:label',
        source: '01-text1',
        target: '03-text2',
      },
      '03-text2': {
        id: '03-text2',
        type: 'text',
        x: 380, y: 160,
        text: '"Movie', // Invalid: missing closing quote
      },
    });

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: text2 is marked as data-invalid due to invalid literal syntax
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-text1" data-type="text" data-raw data-ignored>
              <text x="100" y="160">
                <tspan x="100" dy="0">test:Movie</tspan>
              </text>
            </g>
            <g data-id="02-arrow1" data-type="arrow" data-raw data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="300" y="160">
                  <tspan x="300" dy="0">upper:label</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-text2" data-type="text" data-raw data-ignored data-invalid>
              <text x="380" y="160">
                <tspan x="380" dy="0">"Movie</tspan>
              </text>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('generates raw RDF triples from text-to-text patterns', async () => {
    // Setup: text → arrow → text (raw turtle-style RDF with double quotes)
    const elements = {
      'text1': {
        id: 'text1',
        type: 'text',
        x: 100, y: 160,
        text: 'test:Movie',
      },
      'arrow1': {
        id: 'arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:label',
        source: 'text1',
        target: 'text2',
      },
      'text2': {
        id: 'text2',
        type: 'text',
        x: 380, y: 160,
        text: '"Movie"',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: elements };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const nTriples = element.valueAsNTriples;

    // Verify: triple is generated with expanded URIs
    const expectedTriple = '<https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#label> "Movie" .';
    if (!nTriples.includes(expectedTriple)) {
      throw new Error(`Expected triple not found. Got:\n${nTriples}`);
    }

    element.remove();
  });

  it('generates raw RDF triples with single-quoted literals', async () => {
    // Setup: text → arrow → text (with single-quoted literal)
    const elements = {
      'text1': {
        id: 'text1',
        type: 'text',
        x: 100, y: 160,
        text: 'test:Movie',
      },
      'arrow1': {
        id: 'arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:label',
        source: 'text1',
        target: 'text2',
      },
      'text2': {
        id: 'text2',
        type: 'text',
        x: 380, y: 160,
        text: "'Movie'",
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: elements };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const nTriples = element.valueAsNTriples;

    // Verify: triple is generated with single-quoted literal
    const expectedTriple = "<https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#label> 'Movie' .";
    if (!nTriples.includes(expectedTriple)) {
      throw new Error(`Expected triple not found. Got:\n${nTriples}`);
    }

    element.remove();
  });

  it('generates raw RDF triples with triple-quoted literals', async () => {
    // Setup: text → arrow → text (with triple-quoted literal)
    const elements = {
      'text1': {
        id: 'text1',
        type: 'text',
        x: 100, y: 160,
        text: 'test:Movie',
      },
      'arrow1': {
        id: 'arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'upper:description',
        source: 'text1',
        target: 'text2',
      },
      'text2': {
        id: 'text2',
        type: 'text',
        x: 380, y: 160,
        text: '"""A movie with "quotes" inside"""',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: elements };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const nTriples = element.valueAsNTriples;

    // Verify: triple is generated with triple-quoted literal
    const expectedTriple = '<https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#description> """A movie with "quotes" inside""" .';
    if (!nTriples.includes(expectedTriple)) {
      throw new Error(`Expected triple not found. Got:\n${nTriples}`);
    }

    element.remove();
  });

  it('marks only elements with syntax errors as invalid, not their connected elements', async () => {
    // Setup: diamond (source) → arrow → rectangle (target)
    // Start with VALID RDF text
    const validElements = {
      '01-diamond1': {
        id: '01-diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'test:Movie (DC)',
      },
      '02-arrow1': {
        id: '02-arrow1',
        type: 'arrow',
        x1: 220, y1: 160, x2: 380, y2: 160,
        text: 'test:hasTitle (1..1)',
        source: '01-diamond1',
        target: '03-rect1',
      },
      '03-rect1': {
        id: '03-rect1',
        type: 'rectangle',
        x: 380, y: 100, width: 120, height: 120,
        text: 'xsd:string',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: validElements };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Step 1: Verify valid elements
    // Note: rectangle has data-external because 'xsd' prefix doesn't match 'test' domain
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-diamond1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">test:Movie (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="02-arrow1" data-type="arrow">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="300" y="160">
                  <tspan x="300" dy="0">test:hasTitle (1..1)</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-rect1" data-type="rectangle" data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="440" y="160">
                  <tspan x="440" dy="0">xsd:string</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    // Step 2: Change diamond text to INVALID (add space after colon)
    const invalidElements = {
      ...validElements,
      '01-diamond1': {
        ...validElements['01-diamond1'],
        text: 'movie: Movie', // Invalid CURIE (space after colon)
      },
    };

    const valueAsObject2 = { ...createDefaultDoc(), elements: invalidElements };
    const valueAsJSON2 = UpperDoodle.valueFromObject(valueAsObject2);
    element.value = valueAsJSON2;

    await Promise.resolve();

    // Step 3: Verify only diamond has data-invalid (syntax error), others only data-ignored
    // Note: diamond also has data-external because 'movie' prefix doesn't match 'test' domain
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-diamond1" data-type="diamond" data-ignored data-invalid data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">movie: Movie</tspan>
                </text>
              </g>
            </g>
            <g data-id="02-arrow1" data-type="arrow" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="300" y="160">
                  <tspan x="300" dy="0">test:hasTitle (1..1)</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-rect1" data-type="rectangle" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="440" y="160">
                  <tspan x="440" dy="0">xsd:string</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks diamonds with matching domain prefix as internal (no data-external)', async () => {
    const elements = {
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'test:Title (DC)',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = {
      domain: 'test',
      prefixes: {
        test: 'https://github.com/theengineear/onto/test#',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        upper: 'https://github.com/theengineear/ns/upper#',
      },
      elements,
      nTriples: '',
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: diamond with matching domain does NOT have data-external (and is valid)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">test:Title (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks diamonds with non-matching domain prefix as external (with data-external)', async () => {
    const elements = {
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'other:Actor (DC)',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = {
      domain: 'test',
      prefixes: {
        test: 'https://github.com/theengineear/onto/test#',
        other: 'https://github.com/theengineear/onto/other#',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        upper: 'https://github.com/theengineear/ns/upper#',
      },
      elements,
      nTriples: '',
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: diamond with non-matching domain has data-external and data-ignored
    // (ignored because external diamonds don't generate triples)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">other:Actor (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('does not mark diamonds without colons as external', async () => {
    const elements = {
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'NoPrefix (DC)',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { domain: 'movie', prefixes: {}, elements, nTriples: '' };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: diamond without colon does NOT have data-external (but is invalid due to missing CURIE syntax)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond" data-ignored data-invalid>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">NoPrefix (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('updates data-external when domain changes', async () => {
    const elements = {
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'other:Actor (DC)',
      },
    };

    const element = createTestElement();
    document.body.append(element);

    // Step 1: Set domain to 'test' - diamond should be external (since it uses 'other' prefix)
    const valueAsObject = {
      domain: 'test',
      prefixes: {
        test: 'https://github.com/theengineear/onto/test#',
        other: 'https://github.com/theengineear/onto/other#',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        upper: 'https://github.com/theengineear/ns/upper#',
      },
      elements,
      nTriples: '',
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    let svg = element.shadowRoot.getElementById('svg');

    // Verify: diamond has data-external and data-ignored when domain is 'test'
    // (ignored because external diamonds don't generate triples)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">other:Actor (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    // Step 2: Change domain to 'other' using _domain method - diamond should no longer be external
    element._domain('other');

    // Wait for invalidate's Promise.resolve() and subsequent render
    await Promise.resolve();

    svg = element.shadowRoot.getElementById('svg');

    // Verify: diamond does NOT have data-external when domain is 'other' (and is valid)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">other:Actor (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks rectangles with matching domain prefix as internal (no data-external)', async () => {
    const elements = {
      'rect1': {
        id: 'rect1',
        type: 'rectangle',
        x: 100, y: 100, width: 120, height: 120,
        text: 'xsd:string',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { domain: 'xsd', prefixes: {}, elements, nTriples: '' };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: rectangle with matching domain does NOT have data-external
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="rect1" data-type="rectangle" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">xsd:string</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks rectangles with non-matching domain prefix as external (with data-external)', async () => {
    const elements = {
      'rect1': {
        id: 'rect1',
        type: 'rectangle',
        x: 100, y: 100, width: 120, height: 120,
        text: 'custom:CustomType',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { domain: 'xsd', prefixes: {}, elements, nTriples: '' };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: rectangle with non-matching domain has data-external attribute
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="rect1" data-type="rectangle" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">custom:CustomType</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks rectangles with non-matching domain as external, but not arrows or text', async () => {
    const elements = {
      '01-rect1': {
        id: '01-rect1',
        type: 'rectangle',
        x: 100, y: 100, width: 120, height: 120,
        text: 'person:Name',
      },
      '02-arrow1': {
        id: '02-arrow1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 250, y2: 150,
        text: 'person:hasName',
        source: null,
        target: null,
      },
      '03-text1': {
        id: '03-text1',
        type: 'text',
        x: 50, y: 100,
        text: 'person:Actor',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { domain: 'movie', prefixes: {}, elements, nTriples: '' };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: rectangle has data-external (mismatched prefix), arrows and text don't
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-rect1" data-type="rectangle" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">person:Name</tspan>
                </text>
              </g>
            </g>
            <g data-id="02-arrow1" data-type="arrow" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="150" y="100">
                  <tspan x="150" dy="0">person:hasName</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-text1" data-type="text" data-ignored>
              <text x="50" y="100">
                <tspan x="50" dy="0">person:Actor</tspan>
              </text>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('handles multiple diamonds with mixed internal/external status', async () => {
    const elements = {
      'diamond1': {
        id: 'diamond1',
        type: 'diamond',
        x: 100, y: 100, width: 120, height: 120,
        text: 'test:Title (DC)',
      },
      'diamond2': {
        id: 'diamond2',
        type: 'diamond',
        x: 300, y: 100, width: 120, height: 120,
        text: 'other:Actor (DC)',
      },
      'diamond3': {
        id: 'diamond3',
        type: 'diamond',
        x: 500, y: 100, width: 120, height: 120,
        text: 'test:Genre (DC)',
      },
    };

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = {
      domain: 'test',
      prefixes: {
        test: 'https://github.com/theengineear/onto/test#',
        other: 'https://github.com/theengineear/onto/other#',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        upper: 'https://github.com/theengineear/ns/upper#',
      },
      elements,
      nTriples: '',
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: test:Title is internal (generates triples), other:Actor is external (ignored, doesn't generate triples), test:Genre is internal (generates triples)
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="diamond1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="160" y="160">
                  <tspan x="160" dy="0">test:Title (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="diamond2" data-type="diamond" data-ignored data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="360" y="160">
                  <tspan x="360" dy="0">other:Actor (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="diamond3" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="560" y="160">
                  <tspan x="560" dy="0">test:Genre (DC)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks diamonds with primary keys with data-keyed and prepends key icon', async () => {
    // Setup: two diamonds with same CURIE, only one has a primary key arrow
    // Both should get the key icon since they represent the same class
    const elements = JSON.stringify({
      '01-diamond-1': {
        id: '01-diamond-1',
        type: 'diamond',
        x: 10, y: 10, width: 100, height: 100,
        text: 'test:Movie (DC)',
      },
      '02-diamond-1-copy': {
        id: '02-diamond-1-copy',
        type: 'diamond',
        x: 10, y: 200, width: 100, height: 100,
        text: 'test:Movie (DC)',
      },
      '03-rectangle-1': {
        id: '03-rectangle-1',
        type: 'rectangle',
        x: 200, y: 10, width: 100, height: 60,
        text: 'xsd:string',
      },
      '04-arrow-1': {
        id: '04-arrow-1',
        type: 'arrow',
        x1: 110, y1: 60, x2: 200, y2: 60,
        text: 'test:title (1..1 PK1)',
        source: '01-diamond-1',
        target: '03-rectangle-1',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: both diamonds have data-keyed attribute and 🔑 emoji prepended to label
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-diamond-1" data-type="diamond" data-keyed>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="60" y="60">
                  <tspan x="60" dy="0">🔑 test:Movie (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="02-diamond-1-copy" data-type="diamond" data-keyed>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="60" y="250">
                  <tspan x="60" dy="0">🔑 test:Movie (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-rectangle-1" data-type="rectangle" data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="250" y="40">
                  <tspan x="250" dy="0">xsd:string</tspan>
                </text>
              </g>
            </g>
            <g data-id="04-arrow-1" data-type="arrow">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="155" y="60">
                  <tspan x="155" dy="0">test:title (1..1 PK1)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  it('marks primary key arrows as invalid when sequence is not sequential', async () => {
    // Setup: PK1, PK3, PK4 (missing PK2)
    const elements = JSON.stringify({
      '01-diamond-1': {
        id: '01-diamond-1',
        type: 'diamond',
        x: 10, y: 10, width: 100, height: 100,
        text: 'test:Movie (DC)',
      },
      '02-rectangle-1': {
        id: '02-rectangle-1',
        type: 'rectangle',
        x: 200, y: 10, width: 100, height: 60,
        text: 'xsd:string',
      },
      '03-rectangle-2': {
        id: '03-rectangle-2',
        type: 'rectangle',
        x: 400, y: 10, width: 100, height: 60,
        text: 'xsd:integer',
      },
      '04-rectangle-3': {
        id: '04-rectangle-3',
        type: 'rectangle',
        x: 600, y: 10, width: 100, height: 60,
        text: 'xsd:boolean',
      },
      '05-arrow-1': {
        id: '05-arrow-1',
        type: 'arrow',
        x1: 110, y1: 60, x2: 200, y2: 60,
        text: 'test:title (1..1 PK1)',
        source: '01-diamond-1',
        target: '02-rectangle-1',
      },
      '06-arrow-2': {
        id: '06-arrow-2',
        type: 'arrow',
        x1: 110, y1: 80, x2: 400, y2: 80,
        text: 'test:year (1..1 PK3)',
        source: '01-diamond-1',
        target: '03-rectangle-2',
      },
      '07-arrow-3': {
        id: '07-arrow-3',
        type: 'arrow',
        x1: 110, y1: 100, x2: 600, y2: 100,
        text: 'test:active (1..1 PK4)',
        source: '01-diamond-1',
        target: '04-rectangle-3',
      },
    });

    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    // Verify: arrow-1 is valid, arrow-2 and arrow-3 are invalid
    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-diamond-1" data-type="diamond" data-keyed>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="60" y="60">
                  <tspan x="60" dy="0">🔑 test:Movie (DC)</tspan>
                </text>
              </g>
            </g>
            <g data-id="02-rectangle-1" data-type="rectangle" data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="250" y="40">
                  <tspan x="250" dy="0">xsd:string</tspan>
                </text>
              </g>
            </g>
            <g data-id="03-rectangle-2" data-type="rectangle" data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="450" y="40">
                  <tspan x="450" dy="0">xsd:integer</tspan>
                </text>
              </g>
            </g>
            <g data-id="04-rectangle-3" data-type="rectangle" data-external>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="650" y="40">
                  <tspan x="650" dy="0">xsd:boolean</tspan>
                </text>
              </g>
            </g>
            <g data-id="05-arrow-1" data-type="arrow">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="155" y="60">
                  <tspan x="155" dy="0">test:title (1..1 PK1)</tspan>
                </text>
              </g>
            </g>
            <g data-id="06-arrow-2" data-type="arrow" data-invalid>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="255" y="80">
                  <tspan x="255" dy="0">test:year (1..1 PK3)</tspan>
                </text>
              </g>
            </g>
            <g data-id="07-arrow-3" data-type="arrow" data-invalid>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <rect x="__skip__" y="__skip__" width="__skip__" height="__skip__" rx="4" ry="4"></rect>
                <text x="355" y="100">
                  <tspan x="355" dy="0">test:active (1..1 PK4)</tspan>
                </text>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  // Tree layout with 2 children (flat hierarchy):
  //     0              100             200             300
  //   0 ┼───────────────┼───────────────┼───────────────┼─────────────
  //     │                               │ 50 →  │
  //     │                               │       ┌───────────────┐
  //     │                               │       │ A (100x100)   │
  //     │                               │       │               │
  //     │                               │  ┌────┤       *       │
  // 100 ┼               ┌───────────────┐  │    │   (300, 90)   │
  //     │               │ Root (100x100)│  │    │               │
  //     │               │               │  │    └───────────────┘
  //     │               │       *       ├──┤     ↑↓ 20px
  //     │               │   (150, 150)  │  │    ┌───────────────┐
  //     │               │               │  │    │ B (100x100)   │
  // 200 ┼               └───────────────┘  │    │               │
  //     │                                  └────┤       *       │
  //     │                                       │   (300, 210)  │
  //     │                                       │               │
  //     │                                       └───────────────┘
  //     │
  // 300 ┼
  //
  // Children are centered as a group around root's centerY (150):
  //   - Total children height: 100 + 20 + 100 = 220
  //   - Start Y: 150 - 110 = 40
  //   - Child 1 Y: 40, center: 40 + 50 = 90
  //   - Child 2 Y: 40 + 100 + 20 = 160, center: 160 + 50 = 210
  it('renders exact DOM for tree with two children', async () => {
    const treeData = {
      '01-root-diamond': {
        id: '01-root-diamond',
        type: 'diamond',
        x: 100 , y: 100, width: 100, height: 100,
        text: 'test:Root (E)',
      },
      '02-child-1': {
        id: '02-child-1',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:Child1 (V)',
      },
      '03-child-2': {
        id: '03-child-2',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:Child2 (V)',
      },
      '04-test-tree': {
        id: '04-test-tree',
        type: 'tree',
        root: '01-root-diamond',
        items: [
          { parent: '01-root-diamond', element: '02-child-1' },
          { parent: '01-root-diamond', element: '03-child-2' },
        ],
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: treeData };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-root-diamond" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="150" y="150">
                  <tspan x="150" dy="0">test:Root (E)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text class="add-tree-item" x="176" y="188">⊕</text>
              </g>
            </g>
            <g data-id="02-child-1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="290" y="90">
                  <tspan x="290" dy="0">test:Child1 (V)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text class="add-tree-item" x="316" y="128">⊕</text>
              </g>
            </g>
            <g data-id="03-child-2" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="290" y="210">
                  <tspan x="290" dy="0">test:Child2 (V)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text class="add-tree-item" x="316" y="248">⊕</text>
              </g>
            </g>
            <g data-id="04-test-tree" data-type="tree">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });

  // Tree layout with hierarchical structure (Root → A → C, D and Root → B):
  //        0              100             200             300             400             500
  //      0 ┼───────────────┼───────────────┼───────────────┼───────────────┼───────────────┼─────
  //        │                               │ 50 →  │               │ 50 →  │
  //        │                               │       │               │       ┌───────────────┐
  //        │                               │       │               │       │ C (100x100)   │
  //    100 ┼                               │       │               │       │               │
  //        │                               │       ┌───────────────┐       │       *       │
  //        │                               │       │ A (100x100)   │       │   (450, 130)  │
  //        │                               │       │               │   ┌───┤               │
  //        │                               │  ┌────┤       *       ├───┤   └───────────────┘
  //    200 ┼               ┌───────────────┐  │    │   (300, 190)  │   │    ↑↓ 20px
  //        │               │ Root (100x100)│  │    │               │   │   ┌───────────────┐
  //        │               │               │  │    └───────────────┘   │   │ D (100x100)   │
  //        │               │       *       ├──┤                        │   │               │
  //        │               │   (150, 250)  │  │                        └───┤       *       │
  //    300 ┼               │               │  │                            │   (450, 250)  │
  //        │               └───────────────┘  │                            │               │
  //        │                                  │                            └───────────────┘
  //        │                                  │                             ↑↓ 20px
  //        │                                  │    ┌───────────────┐
  //    400 ┼                                  │    │ B (100x100)   │
  //        │                                  │    │               │
  //        │                                  └────┤       *       │
  //        │                                       │   (300, 370)  │
  //        │                                       │               │
  //        │                                       └───────────────┘
  //    500 ┼
  //
  // Root's children (A and B) are centered as a group around root's centerY (250):
  //   - A branch height: 220 (spans C + gap + D)
  //   - B branch height: 100
  //   - Total children height: 220 + 20 + 100 = 340
  //   - Start Y: 250 - 170 = 80
  //   - A branch: 80 to 300 (220px)
  //   - B branch: 320 to 420 (100px), B center: 370
  //
  // A branch layout (spans 80 to 300):
  //   - C Y: 80, center: 130
  //   - Gap: 180 to 200 (20px)
  //   - D Y: 200, center: 250
  //   - A is centered between its children: (130 + 250) / 2 = 190
  //   - A Y: 140, center: 190
  it('renders exact DOM for hierarchical tree', async () => {
    const treeData = {
      '01-root-diamond': {
        id: '01-root-diamond',
        type: 'diamond',
        x: 100, y: 200, width: 100, height: 100,
        text: 'test:Root (SC)',
      },
      '02-child-1': {
        id: '02-child-1',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:A (SC)',
      },
      '03-child-2': {
        id: '03-child-2',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:B (DC)',
      },
      '04-grandchild-1': {
        id: '04-grandchild-1',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:C (DC)',
      },
      '05-grandchild-2': {
        id: '05-grandchild-2',
        type: 'diamond',
        x: 1000, y: 1000, width: 100, height: 100, // x and y don't matter
        text: 'test:D (DC)',
      },
      '06-test-tree': {
        id: '06-test-tree',
        type: 'tree',
        root: '01-root-diamond',
        items: [
          { parent: '01-root-diamond', element: '02-child-1' },
          { parent: '01-root-diamond', element: '03-child-2' },
          { parent: '02-child-1', element: '04-grandchild-1' },
          { parent: '02-child-1', element: '05-grandchild-2' },
        ],
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const valueAsObject = { ...createDefaultDoc(), elements: treeData };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    await Promise.resolve();

    const svg = element.shadowRoot.getElementById('svg');

    assertDOM(svg, html`
      <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g id="world" transform="translate(0, 0) scale(1, 1)">
          <g id="content">
            <g data-id="01-root-diamond" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="150" y="250">
                  <tspan x="150" dy="0">test:Root (SC)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text x="176" y="288" class="add-tree-item">⊕</text>
              </g>
            </g>
            <g data-id="02-child-1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="290" y="190">
                  <tspan x="290" dy="0">test:A (SC)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text x="316" y="228" class="add-tree-item">⊕</text>
              </g>
            </g>
            <g data-id="03-child-2" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="290" y="370">
                  <tspan x="290" dy="0">test:B (DC)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text x="316" y="408" class="add-tree-item">⊕</text>
              </g>
            </g>
            <g data-id="04-grandchild-1" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="430" y="130">
                  <tspan x="430" dy="0">test:C (DC)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text x="456" y="168" class="add-tree-item">⊕</text>
              </g>
            </g>
            <g data-id="05-grandchild-2" data-type="diamond">
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="label">
                <text x="430" y="250">
                  <tspan x="430" dy="0">test:D (DC)</tspan>
                </text>
              </g>
              <g class="tree-actions">
                <text x="456" y="288" class="add-tree-item">⊕</text>
              </g>
            </g>
            <g data-id="06-test-tree" data-type="tree" data-ignored>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
              <g class="rough">
                <path d="__skip__"></path>
              </g>
            </g>
          </g>
          <g id="ui"></g>
        </g>
      </svg>
    `);

    element.remove();
  });
});
