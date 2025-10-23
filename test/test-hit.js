import { UpperDoodle } from '../src/upper-doodle.js';
import { assertThrows, assertHit, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_hit', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._hit(100, 200);
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._hit('invalid', 0), 'viewX must be a number');
    assertThrows(() => element._hit(0, 'invalid'), 'viewY must be a number');
    element.remove();
  });

  it('returns null when hitting empty canvas', () => {
    const element = createTestElement();
    document.body.append(element);

    const result = element._hit(500, 500);
    assertHit(result, null);

    element.remove();
  });

  it('hits rectangle body', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit center of rectangle
    const result = element._hit(125, 125);
    assertHit(result, { id: 'rect-1', feature: 'element' });

    element.remove();
  });

  it('hits rectangle nw handle', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit northwest corner (handle is at 104, 104)
    const result = element._hit(104, 104);
    assertHit(result, { id: 'rect-1', feature: 'handle-nw' });

    element.remove();
  });

  it('hits rectangle ne handle', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit northeast corner (handle is at 146, 104)
    const result = element._hit(146, 104);
    assertHit(result, { id: 'rect-1', feature: 'handle-ne' });

    element.remove();
  });

  it('hits rectangle se handle', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit southeast corner (handle is at 146, 146)
    const result = element._hit(146, 146);
    assertHit(result, { id: 'rect-1', feature: 'handle-se' });

    element.remove();
  });

  it('hits rectangle sw handle', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit southwest corner (handle is at 104, 146)
    const result = element._hit(104, 146);
    assertHit(result, { id: 'rect-1', feature: 'handle-sw' });

    element.remove();
  });

  it('hits diamond body', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit center of diamond
    const result = element._hit(125, 125);
    assertHit(result, { id: 'diamond-1', feature: 'element' });

    element.remove();
  });

  it('hits arrow body', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 100, y1: 100, x2: 200, y2: 200,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Hit middle of arrow
    const result = element._hit(150, 150);
    assertHit(result, { id: 'arrow-1', feature: 'element' });

    element.remove();
  });

  it('hits arrow tail handle', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 100, y1: 100, x2: 200, y2: 200,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Hit tail (x1, y1)
    const result = element._hit(100, 100);
    assertHit(result, { id: 'arrow-1', feature: 'handle-tail' });

    element.remove();
  });

  it('hits arrow head handle', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 100, y1: 100, x2: 200, y2: 200,
        text: '',
        source: null,
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Hit head (x2, y2)
    const result = element._hit(200, 200);
    assertHit(result, { id: 'arrow-1', feature: 'handle-head' });

    element.remove();
  });

  it('hits text body', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit text element (hit center to avoid handle)
    const result = element._hit(115, 110);
    assertHit(result, { id: 'text-1', feature: 'element' });

    element.remove();
  });

  it('returns topmost element when overlapping', async () => {
    const element = createTestElement();
    document.body.append(element);

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
    await Promise.resolve();

    // Hit overlapping area (both rectangles contain this point)
    const result = element._hit(120, 120);
    // rect-2 is on top (added last)
    assertHit(result, { id: 'rect-2', feature: 'element' });

    element.remove();
  });

  it('works with zoomed in view', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Zoom in 2x at center (500, 500)
    element._zoom(450, 500, 550, 500);
    element._zoom(350, 500, 650, 500);
    element._up();
    await Promise.resolve();

    // After 2x zoom, world coordinate 125 appears at different view coordinates
    // Calculate view coordinates for world point (125, 125)
    const state = JSON.parse(element._value);
    const scene = state.scene;
    const viewX = 125 * scene.k + scene.x;
    const viewY = 125 * scene.k + scene.y;

    const result = element._hit(viewX, viewY);
    assertHit(result, { id: 'rect-1', feature: 'element' });

    element.remove();
  });

  it('works with panned view', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Pan right by 50 pixels
    element._pan(450, 500, 550, 500);
    element._pan(500, 500, 600, 500);
    element._up();
    await Promise.resolve();

    // After pan, world coordinate 125 appears at different view coordinates
    const state = JSON.parse(element._value);
    const scene = state.scene;
    const viewX = 125 * scene.k + scene.x;
    const viewY = 125 * scene.k + scene.y;

    const result = element._hit(viewX, viewY);
    assertHit(result, { id: 'rect-1', feature: 'element' });

    element.remove();
  });

  it('returns null when hitting outside element bounds', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit far outside the rectangle
    const result = element._hit(500, 500);
    assertHit(result, null);

    element.remove();
  });

  it('handles prioritize over element body', async () => {
    const element = createTestElement();
    document.body.append(element);

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

    // Hit exactly at the corner of the bounding box
    // The handle should be detected, not the element body
    const result = element._hit(100, 100);
    assertHit(result, { id: 'rect-1', feature: 'handle-nw' });

    element.remove();
  });

  it('arrow handle inside shape hits arrow handle when arrow is not selected', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      '01-rect-1': {
        id: '01-rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 200, height: 100,
        text: '',
      },
      '02-arrow-1': {
        id: '02-arrow-1',
        type: 'arrow',
        x1: 100, y1: 250,
        x2: 250, y2: 250, // Arrow head is inside rectangle
        text: '',
        source: null,
        target: '01-rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Hit arrow head position (inside rectangle) with no selection
    // Even without selection priority, handles still get detected normally
    const result = element._hit(250, 250);
    assertHit(result, { id: '02-arrow-1', feature: 'handle-head' });

    element.remove();
  });

  it('arrow handle inside shape hits arrow handle when arrow is selected', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 200, height: 100,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 100, y1: 250,
        x2: 250, y2: 250, // Arrow head is inside rectangle
        text: '',
        source: null,
        target: 'rect-1',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Select the arrow by clicking its tail (outside rectangle)
    element._down(100, 250);
    element._up();
    await Promise.resolve();

    // Now hit arrow head position (inside rectangle)
    // Should prioritize arrow handle since arrow is selected
    const result = element._hit(250, 250);
    assertHit(result, { id: 'arrow-1', feature: 'handle-head' });

    element.remove();
  });

  it('arrow tail handle is prioritized when arrow is selected', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 200, height: 100,
        text: '',
      },
      'arrow-1': {
        id: 'arrow-1',
        type: 'arrow',
        x1: 250, y1: 250, // Arrow tail is inside rectangle
        x2: 500, y2: 250,
        text: '',
        source: 'rect-1',
        target: null,
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Select the arrow by clicking its head (outside rectangle)
    element._down(500, 250);
    element._up();
    await Promise.resolve();

    // Now hit arrow tail position (inside rectangle)
    // Should prioritize arrow handle since arrow is selected
    const result = element._hit(250, 250);
    assertHit(result, { id: 'arrow-1', feature: 'handle-tail' });

    element.remove();
  });

  it('shape handle is prioritized when shape is selected', async () => {
    const element = createTestElement();
    document.body.append(element);

    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: '',
      },
      'rect-2': {
        id: 'rect-2',
        type: 'rectangle',
        x: 150, y: 150, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Select rect-1 by clicking its unique area (not overlapping with rect-2)
    element._down(120, 120);
    element._up();
    await Promise.resolve();

    // Hit rect-1's SE corner (handle at 196, 196)
    // Should prioritize rect-1's handle since rect-1 is selected
    const result = element._hit(196, 196);
    assertHit(result, { id: 'rect-1', feature: 'handle-se' });

    element.remove();
  });
});
