import '../src/upper-doodle.js';
import { assertStateEqual, assertThrows, createTestElement } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_create', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._create('rectangle');
    element._create('diamond');
    element._create('arrow');
    element._create('text');
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._create(123), 'type must be a string');
    assertThrows(() => element._create('invalid'), 'type must be one of: rectangle, diamond, arrow, text, tree');
    element.remove();
  });

  it('creates adding interaction when creating diamond', () => {
    const element = createTestElement();
    document.body.append(element);

    // Create a diamond
    const previewId = element._create('diamond');

    // Check that we have an adding interaction with a preview element
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding',
        element: {
          id: previewId,
          type: 'diamond',
          x: 0, y: 0, width: 100, height: 100,
          text: '',
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('updates preview position when moving mouse, but before click', () => {
    const element = createTestElement();
    document.body.append(element);

    // Create a diamond (preview at 0, 0)
    const previewId = element._create('diamond');

    // Move mouse to (150, 200)
    element._move(150, 200);

    // Check that preview element position updated to center on cursor
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding',
        element: {
          id: previewId,
          type: 'diamond',
          x: 100, y: 150, width: 100, height: 100,
          text: '',
        },
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('updates preview position when clicking at different positions', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Create diamond and click at (100, 100) to add first diamond
    const firstId = element._create('diamond');
    element._down(100, 100);
    element._up();
    await Promise.resolve();

    // Create diamond again and click at (200, 200) to add second diamond
    const secondId = element._create('diamond');
    element._down(200, 200);
    element._up();
    await Promise.resolve();

    // Check that both elements were added at correct positions
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [firstId]: {
          id: firstId,
          type: 'diamond',
          x: 50, y: 50, width: 100, height: 100,
          text: '',
        },
        [secondId]: {
          id: secondId,
          type: 'diamond',
          x: 150, y: 150, width: 100, height: 100,
          text: '',
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('finalizes element on down and enters edit mode', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Create diamond and click at (300, 300) to finalize
    const elementId = element._create('diamond');
    element._down(300, 300);
    await Promise.resolve();

    // Check that element was added and we're in edit mode
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [elementId]: {
          id: elementId,
          type: 'diamond',
          x: 250, y: 250, width: 100, height: 100,
          text: '',
        },
      },
      interaction: {
        type: 'edit',
        elementId: elementId,
      },
    });
    assertStateEqual(actual, expected, ['elements', 'interaction']);

    element.remove();
  });
});
