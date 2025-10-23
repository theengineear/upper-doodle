import '../src/upper-doodle.js';
import { assertStateEqual, createTestElement, createDefaultDoc } from './shared.js';
import { describe, it, assert } from '@netflix/x-test/x-test.js';

/**
 * Create test element with two 100x100 diamond elements spaced 200px apart (center to center)
 * Diamond 1: x=100, y=100, center=(150, 150)
 * Diamond 2: x=300, y=100, center=(350, 150)
 * @returns {{element: HTMLElement, diamond1Id: string, diamond2Id: string}}
 */
function createTestElementWithDiamonds() {
  const element = createTestElement();
  document.body.append(element);

  const diamond1Id = 'diamond-1';
  const diamond2Id = 'diamond-2';

  const doc = createDefaultDoc();
  doc.elements[diamond1Id] = {
    id: diamond1Id,
    type: 'diamond',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    text: '',
  };
  doc.elements[diamond2Id] = {
    id: diamond2Id,
    type: 'diamond',
    x: 300,
    y: 100,
    width: 100,
    height: 100,
    text: '',
  };

  element.value = element.constructor.valueFromJSON(JSON.stringify(doc));

  return { element, diamond1Id, diamond2Id };
}

describe('_create arrow (multi-step workflow)', () => {
  it('creates adding-arrow interaction with placing-tail step', async () => {
    const { element, diamond1Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // Initially, no binding detected
    let actual = element._value;
    let expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-tail',
        x1: null,
        y1: null,
        source: null,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Move mouse over diamond-1 (center at 150, 150)
    element._move(150, 150);

    // Should detect source binding and show dashed outline
    actual = element._value;
    expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-tail',
        x1: null,
        y1: null,
        source: diamond1Id,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    // Wait for render cycle before checking DOM
    await Promise.resolve();

    // Verify binding indicator is in the DOM
    const bindingIndicator = element.shadowRoot.querySelector('.binding-indicator');
    assert(!!bindingIndicator, 'Expected binding indicator for diamond-1 to be visible');

    element.remove();
  });

  it('first click places tail and transitions to placing-head step', async () => {
    const { element, diamond1Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // First click at (150, 150) to place tail (inside diamond-1)
    element._down(150, 150);
    element._up();
    await Promise.resolve();

    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-head',
        x1: 150,
        y1: 150,
        source: diamond1Id,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('second click (far enough) finalizes arrow and opens edit mode', async () => {
    const { element, diamond1Id, diamond2Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // First click at (150, 150) to place tail (inside diamond-1)
    element._down(150, 150);
    element._up();
    await Promise.resolve();

    // Move over diamond-2 (center at 350, 150) before placing head
    element._move(350, 150);
    await Promise.resolve();

    // Should show TWO binding indicators: source (diamond-1) and target (diamond-2)
    const bindingIndicators = element.shadowRoot.querySelectorAll('.binding-indicator');
    assert(bindingIndicators.length === 2, `Expected 2 binding indicators, got ${bindingIndicators.length}`);

    // Second click at (250, 250) to place head (distance = ~141px > 30px minimum)
    element._down(250, 250);
    element._up();
    await Promise.resolve();

    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [diamond1Id]: {
          id: diamond1Id,
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [diamond2Id]: {
          id: diamond2Id,
          type: 'diamond',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [arrowId]: {
          id: arrowId,
          type: 'arrow',
          x1: 150,
          y1: 150,
          x2: 250,
          y2: 250,
          text: '',
          source: diamond1Id,
          target: null,
        },
      },
      interaction: {
        type: 'edit',
        elementId: arrowId,
      },
    });
    assertStateEqual(actual, expected, ['elements', 'interaction']);

    element.remove();
  });

  it('second click too close (<30px) stays in placing-head step', async () => {
    const { element } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // First click at (50, 50) to place tail
    element._down(50, 50);
    element._up();
    await Promise.resolve();

    // Second click at (60, 60) - distance ~14px < 30px minimum
    element._down(60, 60);
    element._up();
    await Promise.resolve();

    // Should still be in placing-head step, arrow NOT created
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-head',
        x1: 50,
        y1: 50,
        source: null,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('binds arrow tail to diamond when placing on it', async () => {
    const { element, diamond1Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // Place tail on diamond 1 center (150, 150)
    element._down(150, 150);
    element._up();
    await Promise.resolve();

    // Should detect source binding to diamond1
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-head',
        x1: 150,
        y1: 150,
        source: diamond1Id,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('binds arrow from diamond1 to diamond2', async () => {
    const { element, diamond1Id, diamond2Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // Place tail on diamond 1 center (150, 150)
    element._down(150, 150);
    element._up();
    await Promise.resolve();

    // Place head on diamond 2 center (350, 150) - distance = 200px > 30px
    element._down(350, 150);
    element._up();
    await Promise.resolve();

    // Arrow should be created with both bindings
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [diamond1Id]: {
          id: diamond1Id,
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [diamond2Id]: {
          id: diamond2Id,
          type: 'diamond',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [arrowId]: {
          id: arrowId,
          type: 'arrow',
          x1: 150,
          y1: 150,
          x2: 350,
          y2: 150,
          text: '',
          source: diamond1Id,
          target: diamond2Id,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('does not bind to text elements', async () => {
    const { element, diamond1Id, diamond2Id } = createTestElementWithDiamonds();

    // Create a text element at (250, 100)
    const textId = element._create('text');
    element._down(250, 100);
    element._up();
    await Promise.resolve();

    // Create arrow and place tail on diamond1
    const arrowId = element._create('arrow');
    element._down(150, 150);
    element._up();
    await Promise.resolve();

    // Try to place head on text element (250, 100) - distance = 100px > 30px
    element._down(250, 100);
    element._up();
    await Promise.resolve();

    // Should NOT detect target binding (text is not bindable)
    // Arrow should be created with source binding only
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [diamond1Id]: {
          id: diamond1Id,
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [diamond2Id]: {
          id: diamond2Id,
          type: 'diamond',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [textId]: {
          id: textId,
          type: 'text',
          x: 250,
          y: 100,
          text: 'text',
        },
        [arrowId]: {
          id: arrowId,
          type: 'arrow',
          x1: 150,
          y1: 150,
          x2: 250,
          y2: 100,
          text: '',
          source: diamond1Id,
          target: null,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('cancels arrow creation with Escape key before placing head', () => {
    const { element } = createTestElementWithDiamonds();

    element._create('arrow');

    // Place tail
    element._down(150, 150);
    element._up();

    // Press Escape to cancel
    element._cancel();

    // Should clear interaction (arrow not created)
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: null,
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });

  it('cancels and restarts when clicking arrow tool again during creation', () => {
    const { element } = createTestElementWithDiamonds();

    const firstArrowId = element._create('arrow');

    // Place tail
    element._down(150, 150);
    element._up();

    // Click arrow tool again - should cancel and start new arrow
    const secondArrowId = element._create('arrow');

    // Should have new arrow in placing-tail step
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: secondArrowId,
        step: 'placing-tail',
        x1: null,
        y1: null,
        source: null,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    if (firstArrowId === secondArrowId) {
      throw new Error('Expected different arrow IDs when restarting');
    }

    element.remove();
  });

  it('creates arrow at exact 30px minimum distance', async () => {
    const { element, diamond1Id, diamond2Id } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // First click at (50, 50) to place tail (outside any diamonds)
    element._down(50, 50);
    element._up();
    await Promise.resolve();

    // Second click at (80, 50) - exactly 30px distance
    element._down(80, 50);
    element._up();
    await Promise.resolve();

    // Should create arrow (30px = minimum)
    const actual = element._value;
    const expected = JSON.stringify({
      elements: {
        [diamond1Id]: {
          id: diamond1Id,
          type: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [diamond2Id]: {
          id: diamond2Id,
          type: 'diamond',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          text: '',
        },
        [arrowId]: {
          id: arrowId,
          type: 'arrow',
          x1: 50,
          y1: 50,
          x2: 80,
          y2: 50,
          text: '',
          source: null,
          target: null,
        },
      },
    });
    assertStateEqual(actual, expected, ['elements']);

    element.remove();
  });

  it('stays in placing-head at 29px distance', async () => {
    const { element } = createTestElementWithDiamonds();

    const arrowId = element._create('arrow');

    // First click at (50, 50) to place tail
    element._down(50, 50);
    element._up();
    await Promise.resolve();

    // Second click at (79, 50) - just under 30px (29px)
    element._down(79, 50);
    element._up();
    await Promise.resolve();

    // Should still be in placing-head step
    const actual = element._value;
    const expected = JSON.stringify({
      interaction: {
        type: 'adding-arrow',
        arrowId: arrowId,
        step: 'placing-head',
        x1: 50,
        y1: 50,
        source: null,
        target: null,
      },
    });
    assertStateEqual(actual, expected, ['interaction']);

    element.remove();
  });
});
