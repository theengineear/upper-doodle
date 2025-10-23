import '../src/upper-doodle.js';
import { assertStateEqual, assertThrows, createTestElement } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_pan', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._pan(0, 0, 100, 100);
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._pan('invalid', 0, 100, 100), 'viewX1 must be a number');
    assertThrows(() => element._pan(0, 'invalid', 100, 100), 'viewY1 must be a number');
    assertThrows(() => element._pan(0, 0, 'invalid', 100), 'viewX2 must be a number');
    assertThrows(() => element._pan(0, 0, 100, 'invalid'), 'viewY2 must be a number');
    element.remove();
  });

  it('creates pan interaction on first call', () => {
    const element = createTestElement();
    document.body.append(element);

    // First call initializes pan interaction with two touch points
    element._pan(400, 500, 600, 500);

    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'pan',
        startViewX1: 400,
        startViewY1: 500,
        startViewX2: 600,
        startViewY2: 500,
        startMidpointX: 500,
        startMidpointY: 500,
        startScene: { x: 0, y: 0, k: 1 },
      },
    });

    assertStateEqual(actual, expected, ['interaction']);
    element.remove();
  });

  it('pans scene when midpoint moves', () => {
    const element = createTestElement();
    document.body.append(element);

    // Simulate two-finger pan: start with horizontal points centered at (500, 500)
    // Move midpoint by (50, 30) to pan the scene
    const centerX = 500, centerY = 500;
    const offset = 50;

    // First call to initialize pan interaction
    element._pan(
      centerX - offset, centerY,
      centerX + offset, centerY
    );

    // Second call: move both points by (50, 30) - midpoint moves to (550, 530)
    element._pan(
      centerX - offset + 50, centerY + 30,
      centerX + offset + 50, centerY + 30
    );

    const actual = element._value;
    const expected = JSON.stringify({
      elements: {},
      scene: { x: 50, y: 30, k: 1 },
      viewX: null,
      viewY: null,
      down: false,
    });

    assertStateEqual(actual, expected, ['elements', 'scene', 'viewX', 'viewY', 'down']);
    element.remove();
  });
});
