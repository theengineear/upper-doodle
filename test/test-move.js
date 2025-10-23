import { UpperDoodle } from '../src/upper-doodle.js';
import { assertStateEqual, assertThrows, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_move', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._move(100, 200);
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._move('invalid', 0), 'viewX must be a number');
    assertThrows(() => element._move(0, 'invalid'), 'viewY must be a number');
    element.remove();
  });

  it('moves rectangle when dragging', async () => {
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
    await Promise.resolve();

    // First click to select the rectangle
    element._down(125, 125);
    await Promise.resolve();

    // Verify we're in move interaction
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

    // Move to absolute position (135, 145) in view coordinates while pointer is down
    element._move(135, 145);
    await Promise.resolve();

    // Check that rectangle moved after first move (delta of 10, 20)
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 110, y: 120, width: 50, height: 50,
          text: '',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (140, 155) - cumulative delta from start: (15, 30)
    element._move(140, 155);
    await Promise.resolve();

    // Check that rectangle moved cumulatively (total: 15, 30 from start position)
    const actual1b = element._value;
    const expected1b = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 115, y: 130, width: 50, height: 50,
          text: '',
        },
      },
    });
    assertStateEqual(actual1b, expected1b, ['elements']);

    // Release and verify it transitions back to selection
    element._up();
    await Promise.resolve();

    const actual2 = element._value;
    const expected2 = JSON.stringify({
      interaction: {
        type: 'selection',
        elementIds: ['rect-1'],
        startViewX: 125,
        startViewY: 125,
      },
    });
    assertStateEqual(actual2, expected2, ['interaction']);

    // Call _move again while in selection state (not dragging)
    element._move(200, 250);
    await Promise.resolve();

    // Verify the shape did NOT move (still at x: 115, y: 130)
    const actual3 = element._value;
    const expected3 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 115, y: 130, width: 50, height: 50,
          text: '',
        },
      },
    });
    assertStateEqual(actual3, expected3, ['elements']);

    element.remove();
  });

  it('moves diamond when dragging', async () => {
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
    await Promise.resolve();

    // Click to select the diamond
    element._down(125, 125);
    await Promise.resolve();

    // Verify we're in move interaction
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

    // Move to absolute position (140, 150) - delta from start (125, 125): (15, 25)
    element._move(140, 150);
    await Promise.resolve();

    // Check that diamond moved after first move
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 115, y: 125, width: 50, height: 50,
          text: '',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (150, 165) - cumulative delta from start: (25, 40)
    element._move(150, 165);
    await Promise.resolve();

    // Check that diamond moved cumulatively (total: 25, 40)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 125, y: 140, width: 50, height: 50,
          text: '',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    element.remove();
  });

  it('moves text when dragging', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a text element at (100, 100)
    const elements = JSON.stringify({
      'text-1': {
        id: 'text-1',
        type: 'text',
        x: 100, y: 100,
        text: 'Hello',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click to select the text (near start of text)
    element._down(110, 110);
    await Promise.resolve();

    // Verify we're in move interaction
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['text-1'],
        startViewX: 110,
        startViewY: 110,
        startPositions: {
          'text-1': { x: 100, y: 100 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Move to absolute position (130, 140) - delta from start (110, 110): (20, 30)
    element._move(130, 140);
    await Promise.resolve();

    // Check that text moved after first move
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'text-1': {
          id: 'text-1',
          type: 'text',
          x: 120, y: 130,
          text: 'Hello',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (138, 152) - cumulative delta from start: (28, 42)
    element._move(138, 152);
    await Promise.resolve();

    // Check that text moved cumulatively (total: 28, 42)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'text-1': {
          id: 'text-1',
          type: 'text',
          x: 128, y: 142,
          text: 'Hello',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    element.remove();
  });

  it('selects arrow when clicking on it', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import an arrow from (50, 50) to (150, 150)
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the middle of the arrow (100, 100)
    element._down(100, 100);
    await Promise.resolve();

    // Verify we're in move interaction
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['arrow-1'],
        startViewX: 100,
        startViewY: 100,
        startPositions: {
          'arrow-1': { x1: 50, y1: 50, x2: 150, y2: 150 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('moves arrow when dragging', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import an arrow from (50, 50) to (150, 150)
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow
    element._down(100, 100);
    await Promise.resolve();

    // Verify we're in move interaction
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'move',
        elementIds: ['arrow-1'],
        startViewX: 100,
        startViewY: 100,
        startPositions: {
          'arrow-1': { x1: 50, y1: 50, x2: 150, y2: 150 },
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Move to absolute position (120, 130) - delta from start (100, 100): (20, 30)
    element._move(120, 130);
    await Promise.resolve();

    // Check that arrow moved after first move (both endpoints should shift)
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 70, y1: 80, x2: 170, y2: 180,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (125, 140) - cumulative delta from start: (25, 40)
    element._move(125, 140);
    await Promise.resolve();

    // Check that arrow moved cumulatively (total: 25, 40)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 75, y1: 90, x2: 175, y2: 190,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    element.remove();
  });

  it('creates resize-arrow interaction when clicking on arrow tail', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import an arrow from (50, 50) to (150, 150)
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the tail (50, 50)
    element._down(50, 50);
    await Promise.resolve();

    // Verify we're in resize-arrow interaction
    const actual = element._value;
    const expected = JSON.stringify({
      down: true,
      interaction: {
        type: 'resize-arrow',
        elementId: 'arrow-1',
        handle: 'tail',
        startViewX: 50,
        startViewY: 50,
        startX1: 50,
        startY1: 50,
        startX2: 150,
        startY2: 150,
      },
    });
    assertStateEqual(actual, expected, ['down', 'interaction']);

    element.remove();
  });

  it('creates resize-arrow interaction when clicking on arrow head', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import an arrow from (50, 50) to (150, 150)
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the head (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Verify we're in resize-arrow interaction
    const actual = element._value;
    const expected = JSON.stringify({
      down: true,
      interaction: {
        type: 'resize-arrow',
        elementId: 'arrow-1',
        handle: 'head',
        startViewX: 150,
        startViewY: 150,
        startX1: 50,
        startY1: 50,
        startX2: 150,
        startY2: 150,
      },
    });
    assertStateEqual(actual, expected, ['down', 'interaction']);

    element.remove();
  });

  it('resize-arrow interaction moves arrow head', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import an arrow from (50, 50) to (150, 150)
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the head (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Move to absolute position (170, 180) - delta from start (150, 150): (20, 30)
    element._move(170, 180);
    await Promise.resolve();

    // Check that only the head moved after first move (tail should stay the same)
    // Since scene is default (k=1), view delta equals world delta
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 170, y2: 180,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (180, 185) - cumulative delta from start: (30, 35)
    element._move(180, 185);
    await Promise.resolve();

    // Check that head moved cumulatively (tail still unchanged, total: 30, 35)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 180, y2: 185,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release and verify it transitions to selection (keeping arrow selected)
    element._up();
    await Promise.resolve();

    const actual3 = element._value;
    const expected3 = JSON.stringify({
      interaction: {
        type: 'selection',
        elementIds: ['arrow-1'],
        startViewX: 150,
        startViewY: 150,
      },
    });
    assertStateEqual(actual3, expected3, ['interaction']);

    element.remove();
  });

  it('shows binding indicator when dragging arrow head over shape', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle and an arrow
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow head (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Move arrow head into the rectangle (to 225, 225 which is inside rect-1)
    element._move(225, 225);
    await Promise.resolve();

    // Verify bindingId is set in interaction state
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'resize-arrow',
        elementId: 'arrow-1',
        handle: 'head',
        startViewX: 150,
        startViewY: 150,
        startX1: 50,
        startY1: 50,
        startX2: 150,
        startY2: 150,
        bindingId: 'rect-1',
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('binds arrow head to shape when releasing over it', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle and an arrow
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow head (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Move arrow head into the rectangle (to 225, 225 which is inside rect-1)
    element._move(225, 225);
    await Promise.resolve();

    // Release to commit the binding
    element._up();
    await Promise.resolve();

    // Verify arrow target is now bound to rect-1
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 200, y: 200, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 225, y2: 225,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('binds arrow tail to shape when releasing over it', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle and an arrow
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow tail (50, 50)
    element._down(50, 50);
    await Promise.resolve();

    // Move arrow tail into the rectangle (to 210, 210 which is inside rect-1)
    element._move(210, 210);
    await Promise.resolve();

    // Release to commit the binding
    element._up();
    await Promise.resolve();

    // Verify arrow source is now bound to rect-1
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 200, y: 200, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 210, y1: 210, x2: 150, y2: 150,
          text: '',
          source: 'rect-1',
          target: null,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('does not bind arrow to another arrow', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import two arrows
    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 150, y2: 150,
        text: '',
        source: null,
        target: null,
      },
      'arrow-2': {
        id: 'arrow-2',
        type: 'arrow',
        x1: 200, y1: 200, x2: 250, y2: 250,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on arrow-1 head (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Move arrow-1 head onto arrow-2 (to 225, 225)
    element._move(225, 225);
    await Promise.resolve();

    // Verify bindingId is NOT set (arrows cannot bind to arrows)
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      interaction: {
        type: 'resize-arrow',
        elementId: 'arrow-1',
        handle: 'head',
        startViewX: 150,
        startViewY: 150,
        startX1: 50,
        startY1: 50,
        startX2: 150,
        startY2: 150,
        bindingId: null,
      },
    });
    assertStateEqual(actual1, expected1, ['interaction']);

    // Release
    element._up();
    await Promise.resolve();

    // Verify arrow target is still null
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 225, y2: 225,
          text: '',
          source: null,
          target: null,
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 200, y1: 200, x2: 250, y2: 250,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    element.remove();
  });

  it('unbinds arrow when moved outside bound shape', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle and an arrow with target bound to the rectangle
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 225, y2: 225,
        text: '',
        source: null,
        target: 'rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow to start moving it
    element._down(100, 100);
    await Promise.resolve();

    // Move the arrow far away so the target endpoint (x2, y2) is no longer in rect-1
    // Move by delta (100, 100) so x2 becomes 325, y2 becomes 325 (outside rect-1 which is 200-250)
    element._move(200, 200);
    await Promise.resolve();

    // Release to commit the unbinding
    element._up();
    await Promise.resolve();

    // Verify target is now null (unbound)
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 200, y: 200, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 150, y1: 150, x2: 325, y2: 325,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('maintains arrow binding when moved but still inside bound shape', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a large rectangle and an arrow with target bound to it
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 100, height: 100,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 225, y2: 225,
        text: '',
        source: null,
        target: 'rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow to start moving it
    element._down(100, 100);
    await Promise.resolve();

    // Move the arrow slightly so the target endpoint is still in rect-1
    // Move by delta (10, 10) so x2 becomes 235, y2 becomes 235 (still inside rect-1 which is 200-300)
    element._move(110, 110);
    await Promise.resolve();

    // Release
    element._up();
    await Promise.resolve();

    // Verify target is still bound to rect-1
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 200, y: 200, width: 100, height: 100,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 60, y1: 60, x2: 235, y2: 235,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('unbinds both source and target when arrow moved outside both shapes', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import two rectangles and an arrow bound to both
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'rect-2': {
        id: 'rect-2',
        type: 'rectangle',
        x: 400, y: 400, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 225, y1: 225, x2: 425, y2: 425,
        text: '',
        source: 'rect-1',
        target: 'rect-2',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the arrow to start moving it
    element._down(325, 325);
    await Promise.resolve();

    // Move the arrow far away so both endpoints are outside their bound shapes
    // Move by delta (-200, -200)
    element._move(125, 125);
    await Promise.resolve();

    // Release to commit the unbinding
    element._up();
    await Promise.resolve();

    // Verify both source and target are now null (unbound)
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 200, y: 200, width: 50, height: 50,
          text: '',
        },
        'rect-2': {
          id: 'rect-2',
          type: 'rectangle',
          x: 400, y: 400, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 25, y1: 25, x2: 225, y2: 225,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('maintains arrow binding when bound shape is moved away', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle and an arrow with target bound to the rectangle
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 225, y2: 225,
        text: '',
        source: null,
        target: 'rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the rectangle far from where arrow is (240, 240) to start moving it
    element._down(240, 240);
    await Promise.resolve();

    // First move by delta (50, 60) - from (240, 240) to (290, 300)
    element._move(290, 300);
    await Promise.resolve();

    // Check arrow head moved by first delta
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 250, y: 260, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 275, y2: 285,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Second move - cumulative delta from start (240, 240): (100, 100)
    element._move(340, 340);
    await Promise.resolve();

    // Check arrow head moved cumulatively (not compounded)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 300, y: 300, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 325, y2: 325,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release - arrow should stay bound
    element._up();
    await Promise.resolve();

    // Verify final state unchanged after release
    const actual3 = element._value;
    assertStateEqual(actual3, expected2, ['elements']);

    element.remove();
  });

  it('maintains arrow binding when bound shape moved but arrow endpoint still inside', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a large rectangle and an arrow with target bound to it
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 100, height: 100,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 50, y1: 50, x2: 225, y2: 225,
        text: '',
        source: null,
        target: 'rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on the rectangle to start moving it
    element._down(250, 250);
    await Promise.resolve();

    // First move by delta (-5, -8) - from (250, 250) to (245, 242)
    element._move(245, 242);
    await Promise.resolve();

    // Check arrow head moved by first delta
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 195, y: 192, width: 100, height: 100,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 220, y2: 217,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Second move - cumulative delta from start (250, 250): (-10, -10)
    element._move(240, 240);
    await Promise.resolve();

    // Check arrow head moved cumulatively (not compounded)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 190, y: 190, width: 100, height: 100,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 50, y1: 50, x2: 215, y2: 215,
          text: '',
          source: null,
          target: 'rect-1',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release
    element._up();
    await Promise.resolve();

    // Verify final state unchanged after release
    const actual3 = element._value;
    assertStateEqual(actual3, expected2, ['elements']);

    element.remove();
  });

  it('maintains both arrow bindings when shape is moved', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import two rectangles and an arrow bound to rect-1 at its source
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 50, height: 50,
        text: '',
      },
      'rect-2': {
        id: 'rect-2',
        type: 'rectangle',
        x: 400, y: 400, width: 50, height: 50,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 225, y1: 225, x2: 425, y2: 425,
        text: '',
        source: 'rect-1',
        target: 'rect-2',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on rect-1 (away from arrow endpoint) to move it
    element._down(210, 210);
    await Promise.resolve();

    // First move by delta (100, 120) - from (210, 210) to (310, 330)
    element._move(310, 330);
    await Promise.resolve();

    // Check arrow tail moved by first delta
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 300, y: 320, width: 50, height: 50,
          text: '',
        },
        'rect-2': {
          id: 'rect-2',
          type: 'rectangle',
          x: 400, y: 400, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 325, y1: 345, x2: 425, y2: 425,
          text: '',
          source: 'rect-1',
          target: 'rect-2',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Second move - cumulative delta from start (210, 210): (200, 200)
    element._move(410, 410);
    await Promise.resolve();

    // Check arrow tail moved cumulatively (not compounded)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 400, y: 400, width: 50, height: 50,
          text: '',
        },
        'rect-2': {
          id: 'rect-2',
          type: 'rectangle',
          x: 400, y: 400, width: 50, height: 50,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 425, y1: 425, x2: 425, y2: 425,
          text: '',
          source: 'rect-1',
          target: 'rect-2',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release - arrow should stay bound
    element._up();
    await Promise.resolve();

    // Verify final state unchanged after release
    const actual3 = element._value;
    assertStateEqual(actual3, expected2, ['elements']);

    element.remove();
  });

  it('maintains arrow binding when bound shape is moved (both endpoints)', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import two diamonds (at nice coordinates) and an arrow bound to both
    const elements = JSON.stringify({
      'diamond-1': {
        id: 'diamond-1',
        type: 'diamond',
        x: 100, y: 100, width: 80, height: 80,
        text: '',
      },
      'diamond-2': {
        id: 'diamond-2',
        type: 'diamond',
        x: 300, y: 100, width: 80, height: 80,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 180, y1: 140, x2: 300, y2: 140,
        text: '',
        source: 'diamond-1',
        target: 'diamond-2',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on diamond-2 to select it (center is at 340, 140)
    element._down(340, 140);
    await Promise.resolve();

    // First move by delta (25, 15) - from (340, 140) to (365, 155)
    element._move(365, 155);
    await Promise.resolve();

    // Check arrow head moved by first delta
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 100, y: 100, width: 80, height: 80,
          text: '',
        },
        'diamond-2': {
          id: 'diamond-2',
          type: 'diamond',
          x: 325, y: 115, width: 80, height: 80,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 180, y1: 140, x2: 325, y2: 155,
          text: '',
          source: 'diamond-1',
          target: 'diamond-2',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Second move - cumulative delta from start (340, 140): (50, 30)
    element._move(390, 170);
    await Promise.resolve();

    // Check arrow head moved cumulatively (not compounded)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 100, y: 100, width: 80, height: 80,
          text: '',
        },
        'diamond-2': {
          id: 'diamond-2',
          type: 'diamond',
          x: 350, y: 130, width: 80, height: 80,
          text: '',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 180, y1: 140, x2: 350, y2: 170,
          text: '',
          source: 'diamond-1',
          target: 'diamond-2',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release - arrow should stay bound
    element._up();
    await Promise.resolve();

    // Verify final state unchanged after release
    const actual3 = element._value;
    assertStateEqual(actual3, expected2, ['elements']);

    element.remove();
  });

  it('creates resize-box interaction when clicking on rectangle corner', async () => {
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
    await Promise.resolve();

    // Click on the bottom-right corner (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Verify we're in resize-box interaction
    const actual = element._value;
    const expected = JSON.stringify({
      down: true,
      interaction: {
        type: 'resize-box',
        elementId: 'rect-1',
        handle: 'se',
        startViewX: 150,
        startViewY: 150,
        startX: 100,
        startY: 100,
        startWidth: 50,
        startHeight: 50,
      },
    });
    assertStateEqual(actual, expected, ['down', 'interaction']);

    element.remove();
  });

  it('resize-box interaction resizes rectangle from southeast corner', async () => {
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
    await Promise.resolve();

    // Click on the bottom-right corner (150, 150)
    element._down(150, 150);
    await Promise.resolve();

    // Move to absolute position (170, 180) - delta from start (150, 150): (20, 30)
    element._move(170, 180);
    await Promise.resolve();

    // Check that rectangle resized (x, y unchanged, w and h grew)
    const actual1 = element._value;
    const expected1 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 100, y: 100, width: 70, height: 80,
          text: '',
        },
      },
    });
    assertStateEqual(actual1, expected1, ['elements']);

    // Move again to absolute position (180, 185) - cumulative delta from start: (30, 35)
    element._move(180, 185);
    await Promise.resolve();

    // Check cumulative resize (total: 30, 35)
    const actual2 = element._value;
    const expected2 = JSON.stringify({
      elements: {
        'rect-1': {
          id: 'rect-1',
          type: 'rectangle',
          x: 100, y: 100, width: 80, height: 85,
          text: '',
        },
      },
    });
    assertStateEqual(actual2, expected2, ['elements']);

    // Release and verify it transitions to selection
    element._up();
    await Promise.resolve();

    const actual3 = element._value;
    const expected3 = JSON.stringify({
      interaction: {
        type: 'selection',
        elementIds: ['rect-1'],
        startViewX: 150,
        startViewY: 150,
      },
    });
    assertStateEqual(actual3, expected3, ['interaction']);

    element.remove();
  });
});
