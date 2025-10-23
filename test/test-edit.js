import { UpperDoodle } from '../src/upper-doodle.js';
import { assertStateEqual, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_edit', () => {
  it('enters edit mode when single element is selected', () => {
    const element = createTestElement();
    document.body.append(element);

    // Create and select a rectangle
    const rectangleData = JSON.stringify({
      '1': {
        id: '1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: 'Hello',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(rectangleData) };
    let valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Select the element
    const flat = JSON.parse(element._value);
    const state = {
      persistent: {
        prefixes: flat.prefixes,
        domain: flat.domain,
        elements: flat.elements,
        scene: flat.scene,
        nTriples: flat.nTriples,
      },
      ephemeral: {
        viewX: flat.viewX,
        viewY: flat.viewY,
        down: flat.down,
        interaction: {
          type: 'selection',
          elementIds: ['1'],
          startViewX: 150,
          startViewY: 150,
        },
      },
    };
    valueAsJSON = UpperDoodle._valueFromObject(state);
    element._value = valueAsJSON;

    // Enter edit mode
    element._edit();

    // Verify we're in edit mode
    const newState = JSON.parse(element._value);
    assertStateEqual(
      JSON.stringify(newState.interaction),
      JSON.stringify({ type: 'edit', elementId: '1' })
    );

    element.remove();
  });

  it('does nothing when no element is selected', () => {
    const element = createTestElement();
    document.body.append(element);

    const rectangleData = JSON.stringify({
      '1': {
        id: '1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: 'Hello',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(rectangleData) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Try to edit without selection
    element._edit();

    const state = JSON.parse(element._value);
    assertStateEqual(JSON.stringify(state.interaction), JSON.stringify(null));

    element.remove();
  });

  it('does nothing when multiple elements are selected', () => {
    const element = createTestElement();
    document.body.append(element);

    const data = JSON.stringify({
      '1': {
        id: '1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: 'Hello',
      },
      '2': {
        id: '2',
        type: 'rectangle',
        x: 200, y: 200, width: 100, height: 100,
        text: 'World',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(data) };
    let valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Select both elements
    const flat = JSON.parse(element._value);
    const state = {
      persistent: {
        prefixes: flat.prefixes,
        domain: flat.domain,
        elements: flat.elements,
        scene: flat.scene,
        nTriples: flat.nTriples,
      },
      ephemeral: {
        viewX: flat.viewX,
        viewY: flat.viewY,
        down: flat.down,
        interaction: {
          type: 'selection',
          elementIds: ['1', '2'],
          startViewX: 150,
          startViewY: 150,
        },
      },
    };
    valueAsJSON = UpperDoodle._valueFromObject(state);
    element._value = valueAsJSON;

    // Try to edit - should do nothing
    element._edit();

    const newState = JSON.parse(element._value);
    assertStateEqual(JSON.stringify(newState.interaction.type), JSON.stringify('selection'));
    assertStateEqual(JSON.stringify(newState.interaction.elementIds), JSON.stringify(['1', '2']));

    element.remove();
  });

  it('allows overwriting text in edit mode', () => {
    const element = createTestElement();
    document.body.append(element);

    const rectangleData = JSON.stringify({
      '1': {
        id: '1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: 'Hello',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(rectangleData) };
    let valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;

    // Select and enter edit mode
    const flat = JSON.parse(element._value);
    const state = {
      persistent: {
        prefixes: flat.prefixes,
        domain: flat.domain,
        elements: flat.elements,
        scene: flat.scene,
        nTriples: flat.nTriples,
      },
      ephemeral: {
        viewX: flat.viewX,
        viewY: flat.viewY,
        down: flat.down,
        interaction: {
          type: 'selection',
          elementIds: ['1'],
          startViewX: 150,
          startViewY: 150,
        },
      },
    };
    valueAsJSON = UpperDoodle._valueFromObject(state);
    element._value = valueAsJSON;
    element._edit();

    // Overwrite text
    element._overwrite('New text');

    const newState = JSON.parse(element._value);
    assertStateEqual(JSON.stringify(newState.elements['1'].text), JSON.stringify('New text'));

    element.remove();
  });
});
