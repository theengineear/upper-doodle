import { UpperDoodle } from '../src/upper-doodle.js';
import { assertStateEqual, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_cancel', () => {
  it('accepts no arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._cancel();
    element.remove();
  });

  it('clears interaction state', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Import a rectangle
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

    // Start moving the rectangle
    element._down(125, 125);
    element._move(135, 145);
    await Promise.resolve();

    // Cancel the interaction
    element._cancel();
    await Promise.resolve();

    // Verify all interaction state is cleared
    const afterCancel = element._value;
    const expected = JSON.stringify({
      down: false,
      viewX: null,
      viewY: null,
      interaction: null,
    });
    assertStateEqual(afterCancel, expected, ['down', 'viewX', 'viewY', 'interaction']);

    element.remove();
  });

  it('clears zoom interaction', () => {
    const element = createTestElement();
    document.body.append(element);

    // Start zoom interaction
    element._zoom(400, 500, 600, 500);

    // Cancel the interaction
    element._cancel();

    // Verify interaction is cleared
    const afterCancel = element._value;
    const expected = JSON.stringify({
      interaction: null,
    });
    assertStateEqual(afterCancel, expected, ['interaction']);

    element.remove();
  });

  it('clears pan interaction', () => {
    const element = createTestElement();
    document.body.append(element);

    // Start pan interaction
    element._pan(400, 500, 600, 500);

    // Cancel the interaction
    element._cancel();

    // Verify interaction is cleared
    const afterCancel = element._value;
    const expected = JSON.stringify({
      interaction: null,
    });
    assertStateEqual(afterCancel, expected, ['interaction']);

    element.remove();
  });
});
