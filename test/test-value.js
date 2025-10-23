import { UpperDoodle } from '../src/upper-doodle.js';
import {
  assertStateEqual,
  assertThrows,
  createTestElement,
  createDefaultDoc,
} from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('._value setter', () => {
  it('throws for missing state.prefixes', () => {
    const state = {
      persistent: {
        // prefixes: {}, // Missing!
        domain: 'test',
        elements: {},
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const callback = () => {
      const valueAsJSON = UpperDoodle._valueFromObject(state);
      element._value = valueAsJSON;
    };
    const expectedMessage = 'state.persistent.prefixes is required';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for missing state.domain', () => {
    const state = {
      persistent: {
        prefixes: {},
        // domain: 'test', // Missing!
        elements: {},
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const callback = () => {
      const valueAsJSON = UpperDoodle._valueFromObject(state);
      element._value = valueAsJSON;
    };
    const expectedMessage = 'state.persistent.domain is required';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for missing state.elements', () => {
    const state = {
      persistent: {
        prefixes: {},
        domain: 'test',
        // elements: {}, // Missing!
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const callback = () => {
      const valueAsJSON = UpperDoodle._valueFromObject(state);
      element._value = valueAsJSON;
    };
    const expectedMessage = 'state.persistent.elements is required';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for extra state keys', () => {
    const state = {
      persistent: {
        ...createDefaultDoc(),
        scene: { x: 0, y: 0, k: 1 },
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
      dne: 'does not exist',
    };
    const element = createTestElement();
    document.body.append(element);
    const callback = () => {
      const valueAsJSON = UpperDoodle._valueFromObject(state);
      element._value = valueAsJSON;
    };
    const expectedMessage = 'unexpected key in state: dne';
    assertThrows(callback, expectedMessage);
    element.remove();
  });

  it('throws for invalid elements', () => {
    const state = {
      persistent: {
        ...createDefaultDoc(),
        elements: {
          'abcd': {
            id: 'abcd',
            type: 'arrow',
            x1: 0, y1: 0, x2: 100, y2: 100,
            text: 'foo',
            source: null,
            // target: null, // Arrows should have a target field!
          },
        },
        scene: { x: 0, y: 0, k: 1 },
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
    };
    const element = createTestElement();
    document.body.append(element);
    const callback = () => {
      const valueAsJSON = UpperDoodle._valueFromObject(state);
      element._value = valueAsJSON;
    };
    const expectedMessage = 'elements[\'abcd\'].target is required';
    assertThrows(callback, expectedMessage);
    element.remove();
  });
});

describe('._value getter', () => {
  it('returns expected value after initialization', () => {
    const expected = JSON.stringify({
      domain: 'domain',
      down: false,
      elements: {},
      interaction: null,
      nTriples: '',
      prefixes: {},
      scene: { x: 0, y: 0, k: 1 },
      viewX: null,
      viewY: null,
    });
    const element = createTestElement();
    document.body.append(element);
    const actual = element._value;
    assertStateEqual(actual, expected);
    element.remove();
  });

  it('returns exact value given by ._value setter', () => {
    const state = {
      persistent: {
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
        scene: { x: 0, y: 0, k: 1 },
        nTriples: '',
      },
      ephemeral: {
        viewX: null,
        viewY: null,
        down: false,
        interaction: null,
      },
    };
    const valueAsJSON = UpperDoodle._valueFromObject(state);
    const element = createTestElement();
    document.body.append(element);
    element._value = valueAsJSON;
    const actual = element._value;
    assertStateEqual(actual, valueAsJSON);
    element.remove();
  });
});
