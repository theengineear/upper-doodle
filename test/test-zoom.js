import '../src/upper-doodle.js';
import { assertStateEqual, assertThrows, createTestElement } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_zoom', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._zoom(0, 0, 100, 100);
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._zoom('invalid', 0, 100, 100), 'viewX1 must be a number');
    assertThrows(() => element._zoom(0, 'invalid', 100, 100), 'viewY1 must be a number');
    assertThrows(() => element._zoom(0, 0, 'invalid', 100), 'viewX2 must be a number');
    assertThrows(() => element._zoom(0, 0, 100, 'invalid'), 'viewY2 must be a number');
    element.remove();
  });

  it('creates zoom interaction on first call', () => {
    const element = createTestElement();
    document.body.append(element);

    // First call initializes zoom interaction with two touch points
    element._zoom(400, 500, 600, 500);

    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'zoom',
        startViewX1: 400,
        startViewY1: 500,
        startViewX2: 600,
        startViewY2: 500,
        startDistance: 200,
        startScene: { x: 0, y: 0, k: 1 },
      },
    });

    assertStateEqual(actual, expected, ['interaction']);
    element.remove();
  });

  it('updates scene correctly when zooming at center', () => {
    const element = createTestElement();
    document.body.append(element);

    // Simulate pinch gesture: start with points 100 units apart, end with them 200 units apart (2x zoom)
    // Points are horizontal at y=500, centered at x=500
    const centerX = 500, centerY = 500;
    const startDistance = 100;
    const endDistance = 200;

    // First call to initialize zoom interaction
    element._zoom(
      centerX - startDistance / 2, centerY,
      centerX + startDistance / 2, centerY
    );

    // Second call to apply 2x zoom
    element._zoom(
      centerX - endDistance / 2, centerY,
      centerX + endDistance / 2, centerY
    );

    const actual = element._value;
    const expected = JSON.stringify({
      elements: {},
      scene: { x: -500, y: -500, k: 2 },
      viewX: null,
      viewY: null,
      down: false,
    });

    assertStateEqual(actual, expected, ['elements', 'scene', 'viewX', 'viewY', 'down']);
    element.remove();
  });
});
