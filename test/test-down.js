import { UpperDoodle } from '../src/upper-doodle.js';
import { assertStateEqual, assertThrows, assertDOMChildElementCount, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_down', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._down(100, 200);
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._down('invalid', 0), 'viewX must be a number');
    assertThrows(() => element._down(0, 'invalid'), 'viewY must be a number');
    element.remove();
  });

  it('selects rectangle', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle at (100, 100) with size 50x50
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Wait for render
    await Promise.resolve();

    // Click inside the rectangle (center at 125, 125)
    element._down(125, 125);

    // Wait for render
    await Promise.resolve();

    // Check interaction state
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['rect-1'],
        startViewX: 125,
        startViewY: 125,
        startPositions: {
          'rect-1': { x: 100, y: 100 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Verify selection UI was rendered (1 box + 4 corner dots)
    const ui = element.shadowRoot.getElementById('ui');
    assertDOMChildElementCount(ui, 5);

    element.remove();
  });

  it('selects diamond', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a diamond at (100, 100) with size 50x50
    const elements = JSON.stringify({
      'diamond-1': {
        id: 'diamond-1',
        type: 'diamond',
        x: 100, y: 100, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Wait for render
    await Promise.resolve();

    // Click inside the diamond (center at 125, 125)
    element._down(125, 125);

    // Wait for render
    await Promise.resolve();

    // Check interaction state
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['diamond-1'],
        startViewX: 125,
        startViewY: 125,
        startPositions: {
          'diamond-1': { x: 100, y: 100 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Verify selection UI was rendered (1 box + 4 corner dots)
    const ui = element.shadowRoot.getElementById('ui');
    assertDOMChildElementCount(ui, 5);

    element.remove();
  });

  it('deselects when clicking outside', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle at (100, 100) with size 50x50
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Wait for render
    await Promise.resolve();

    // First select the rectangle
    element._down(125, 125);
    await Promise.resolve();

    // Click outside the rectangle (starts a selection box)
    element._down(200, 200);
    await Promise.resolve();

    // Release pointer (empty selection box becomes null)
    element._up();
    await Promise.resolve();

    // Check interaction state - should be null after releasing with empty selection
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: null,
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Verify selection UI was cleared
    const ui = element.shadowRoot.getElementById('ui');
    assertDOMChildElementCount(ui, 0);

    element.remove();
  });

  it('selects topmost element when overlapping', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import two overlapping rectangles
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        text: '',
      },
      'rect-2': {
        id: 'rect-2',
        type: 'rectangle',
        x: 110, y: 110, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Wait for render
    await Promise.resolve();

    // Click in overlapping area (both contain this point, but rect-2 is on top)
    element._down(120, 120);
    await Promise.resolve();

    // Check interaction state - should select rect-2 (topmost)
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['rect-2'],
        startViewX: 120,
        startViewY: 120,
        startPositions: {
          'rect-2': { x: 110, y: 110 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('maintains selection when clicking on already-selected element', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a large rectangle and a small rectangle inside it
    const elements = JSON.stringify({
      'large-rect': {
        id: 'large-rect',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: '',
      },
      'small-rect': {
        id: 'small-rect',
        type: 'rectangle',
        x: 120, y: 120, width: 24, height: 24,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Wait for render
    await Promise.resolve();

    // First, click on the small rectangle to select it
    element._down(130, 130);
    await Promise.resolve();
    element._up();
    await Promise.resolve();

    // Verify small-rect is selected
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'selection',
        elementIds: ['small-rect'],
        startViewX: 130,
        startViewY: 130,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Now click on the same position again (both rectangles overlap here, but small-rect should stay selected)
    element._down(130, 130);
    await Promise.resolve();
    element._up();
    await Promise.resolve();

    // Verify small-rect is STILL selected (not large-rect)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      interaction: {
        type: 'selection',
        elementIds: ['small-rect'],
        startViewX: 130,
        startViewY: 130,
      },
    });
    assertStateEqual(actual2, expected2, ['interaction']);

    element.remove();
  });
});
