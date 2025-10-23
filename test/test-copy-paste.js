import '../src/upper-doodle.js';
import { createTestElement, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

/**
 * Mock clipboard for testing copy/paste operations
 * @returns {{setup: Function, restore: Function}}
 */
function mockClipboard() {
  let clipboardData = '';
  const originalWriteText = navigator.clipboard.writeText;
  const originalReadText = navigator.clipboard.readText;

  return {
    setup() {
      navigator.clipboard.writeText = async (text) => {
        clipboardData = text;
      };
      navigator.clipboard.readText = async () => clipboardData;
    },
    restore() {
      navigator.clipboard.writeText = originalWriteText;
      navigator.clipboard.readText = originalReadText;
    },
  };
}

describe('Copy & Paste', () => {
  it('copies and pastes a single diamond element', async () => {
    const clipboard = mockClipboard();
    clipboard.setup();

    const element = createTestElement();
    document.body.append(element);

    // Create fixture with one diamond
    const diamondId = 'diamond-1';
    const doc = createDefaultDoc();
    doc.elements[diamondId] = {
      id: diamondId,
      type: 'diamond',
      x: 150, y: 150, width: 100, height: 100,
      text: 'Test',
    };
    element.value = element.constructor.valueFromObject(doc);
    await Promise.resolve();

    // Select the diamond using a selection box
    element._down(140, 140); // Start selection before diamond
    element._move(260, 260); // End selection after diamond
    element._up();
    await Promise.resolve();

    // Copy the diamond
    await element._copy();

    // Deselect
    element._cancel();
    await Promise.resolve();

    // Paste the diamond
    await element._paste();

    // The pasted element should be in preview mode (adding interaction)
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    // Check that we have an adding interaction with a new element
    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    const pastedElement = interaction.element;
    if (!pastedElement || pastedElement.type !== 'diamond') {
      throw new Error('Expected pasted element to be a diamond');
    }

    // Check that pasted element has a different ID
    if (pastedElement.id === diamondId) {
      throw new Error('Expected pasted element to have a new UUID');
    }

    // Check that pasted element has correct properties
    if (pastedElement.width !== 100 || pastedElement.height !== 100) {
      throw new Error('Expected pasted element to have same dimensions');
    }

    clipboard.restore();
    element.remove();
  });

  it('copies and pastes multiple elements', async () => {
    const clipboard = mockClipboard();
    clipboard.setup();

    const element = createTestElement();
    document.body.append(element);

    // Create fixture with two diamonds
    const diamond1Id = 'diamond-1';
    const diamond2Id = 'diamond-2';
    const doc = createDefaultDoc();
    doc.elements[diamond1Id] = {
      id: diamond1Id,
      type: 'diamond',
      x: 150, y: 150, width: 100, height: 100,
      text: 'A',
    };
    doc.elements[diamond2Id] = {
      id: diamond2Id,
      type: 'diamond',
      x: 350, y: 150, width: 100, height: 100,
      text: 'B',
    };
    element.value = element.constructor.valueFromObject(doc);
    await Promise.resolve();

    // Select both diamonds using a selection box
    element._down(100, 100); // Start selection
    element._move(500, 300); // Drag to cover both
    element._up();
    await Promise.resolve();

    // Copy the selection
    await element._copy();

    // Deselect
    element._cancel();
    await Promise.resolve();

    // Paste the elements
    await element._paste();

    // Check that we have multiple elements in adding interaction
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    // Should have multiple elements
    const pastedElements = interaction.elements || [interaction.element];
    if (pastedElements.length !== 2) {
      throw new Error(`Expected 2 pasted elements, got ${pastedElements.length}`);
    }

    // Check that all pasted elements have new UUIDs
    for (const pastedElement of pastedElements) {
      if (pastedElement.id === diamond1Id || pastedElement.id === diamond2Id) {
        throw new Error('Expected pasted elements to have new UUIDs');
      }
    }

    clipboard.restore();
    element.remove();
  });

  it('preserves arrow bindings when copying bound arrow with shapes', async () => {
    const clipboard = mockClipboard();
    clipboard.setup();

    const element = createTestElement();
    document.body.append(element);

    // Create fixture with two diamonds and a bound arrow
    const sourceId = 'source';
    const targetId = 'target';
    const arrowId = 'arrow';
    const doc = createDefaultDoc();
    doc.elements[sourceId] = {
      id: sourceId,
      type: 'diamond',
      x: 150, y: 150, width: 100, height: 100,
      text: 'Source',
    };
    doc.elements[targetId] = {
      id: targetId,
      type: 'diamond',
      x: 350, y: 150, width: 100, height: 100,
      text: 'Target',
    };
    doc.elements[arrowId] = {
      id: arrowId,
      type: 'arrow',
      x1: 250, y1: 200, x2: 350, y2: 200,
      text: 'connects',
      source: sourceId,
      target: targetId,
    };
    element.value = element.constructor.valueFromObject(doc);
    await Promise.resolve();

    // Select all three elements
    element._down(100, 100); // Start selection box
    element._move(500, 300); // Cover all elements
    element._up();
    await Promise.resolve();

    // Copy the selection
    await element._copy();

    // Deselect
    element._cancel();
    await Promise.resolve();

    // Paste the elements
    await element._paste();

    // Check that pasted arrow is bound to pasted shapes
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    const pastedElements = interaction.elements || [interaction.element];
    if (pastedElements.length !== 3) {
      throw new Error(`Expected 3 pasted elements, got ${pastedElements.length}`);
    }

    // Find the pasted arrow and shapes
    const pastedArrow = pastedElements.find(el => el.type === 'arrow');
    const pastedShapes = pastedElements.filter(el => el.type === 'diamond');

    if (!pastedArrow) {
      throw new Error('Expected to find pasted arrow');
    }

    if (pastedShapes.length !== 2) {
      throw new Error('Expected to find 2 pasted diamonds');
    }

    // Check that arrow bindings reference the new shape IDs
    const pastedShapeIds = pastedShapes.map(s => s.id);

    if (!pastedArrow.source || !pastedShapeIds.includes(pastedArrow.source)) {
      throw new Error('Expected pasted arrow source to reference a pasted shape');
    }

    if (!pastedArrow.target || !pastedShapeIds.includes(pastedArrow.target)) {
      throw new Error('Expected pasted arrow target to reference a pasted shape');
    }

    // Check that arrow does NOT reference original shapes
    if (pastedArrow.source === sourceId || pastedArrow.target === targetId) {
      throw new Error('Expected pasted arrow to NOT reference original shapes');
    }

    clipboard.restore();
    element.remove();
  });

  it('loses arrow bindings when copying arrow without bound shapes', async () => {
    const clipboard = mockClipboard();
    clipboard.setup();

    const element = createTestElement();
    document.body.append(element);

    // Create fixture with two diamonds at top and an arrow below them
    const sourceId = 'source';
    const targetId = 'target';
    const arrowId = 'arrow';
    const doc = createDefaultDoc();
    doc.elements[sourceId] = {
      id: sourceId,
      type: 'diamond',
      x: 150, y: 100, width: 100, height: 100,
      text: 'Source',
    };
    doc.elements[targetId] = {
      id: targetId,
      type: 'diamond',
      x: 350, y: 100, width: 100, height: 100,
      text: 'Target',
    };
    doc.elements[arrowId] = {
      id: arrowId,
      type: 'arrow',
      x1: 200, y1: 300, x2: 400, y2: 300,
      text: 'connects',
      source: sourceId,
      target: targetId,
    };
    element.value = element.constructor.valueFromObject(doc);
    await Promise.resolve();

    // Select ONLY the arrow (below the shapes) using a selection box
    element._down(180, 280); // Start selection below shapes
    element._move(420, 320); // End selection (covers arrow at y=300, shapes are at y=100-200)
    element._up();
    await Promise.resolve();

    // Copy just the arrow
    await element._copy();

    // Deselect
    element._cancel();
    await Promise.resolve();

    // Paste the arrow
    await element._paste();

    // Check that pasted arrow has NO bindings
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    const pastedArrow = interaction.element;

    if (pastedArrow.type !== 'arrow') {
      throw new Error('Expected pasted element to be an arrow');
    }

    // Arrow should have lost both bindings
    if (pastedArrow.source !== null) {
      throw new Error('Expected pasted arrow source to be null');
    }

    if (pastedArrow.target !== null) {
      throw new Error('Expected pasted arrow target to be null');
    }

    clipboard.restore();
    element.remove();
  });

  it('partially preserves bindings when copying arrow with only one bound shape', async () => {
    const clipboard = mockClipboard();
    clipboard.setup();

    const element = createTestElement();
    document.body.append(element);

    // Create fixture with two diamonds and a bound arrow
    const sourceId = 'source';
    const targetId = 'target';
    const arrowId = 'arrow';
    const doc = createDefaultDoc();
    doc.elements[sourceId] = {
      id: sourceId,
      type: 'diamond',
      x: 150, y: 150, width: 100, height: 100,
      text: 'Source',
    };
    doc.elements[targetId] = {
      id: targetId,
      type: 'diamond',
      x: 450, y: 150, width: 100, height: 100,
      text: 'Target',
    };
    doc.elements[arrowId] = {
      id: arrowId,
      type: 'arrow',
      x1: 250, y1: 200, x2: 350, y2: 200,
      text: 'connects',
      source: sourceId,
      target: targetId,
    };
    element.value = element.constructor.valueFromObject(doc);
    await Promise.resolve();

    // Select source diamond and arrow (but NOT target diamond)
    element._down(100, 100); // Start selection box
    element._move(400, 300); // Cover source and arrow (up to x=400, target starts at x=450)
    element._up();
    await Promise.resolve();

    // Copy the selection
    await element._copy();

    // Deselect
    element._cancel();
    await Promise.resolve();

    // Paste the elements
    await element._paste();

    // Check bindings on pasted arrow
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    const pastedElements = interaction.elements || [interaction.element];
    const pastedArrow = pastedElements.find(el => el.type === 'arrow');
    const pastedSource = pastedElements.find(el => el.type === 'diamond');

    if (!pastedArrow || !pastedSource) {
      throw new Error('Expected to find pasted arrow and source diamond');
    }

    // Source binding should be preserved (mapped to new source)
    if (pastedArrow.source !== pastedSource.id) {
      throw new Error('Expected pasted arrow source to reference pasted source diamond');
    }

    // Target binding should be lost (not in copied set)
    if (pastedArrow.target !== null) {
      throw new Error('Expected pasted arrow target to be null');
    }

    clipboard.restore();
    element.remove();
  });

  it('pastes plain text as a text element', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Mock clipboard with plain text (not JSON)
    const clipboardText = 'Hello, World!';

    // Mock navigator.clipboard.readText
    const originalReadText = navigator.clipboard.readText;
    navigator.clipboard.readText = async () => clipboardText;

    // Paste the text
    await element._paste();

    // Restore original clipboard
    navigator.clipboard.readText = originalReadText;

    // Check that we have a text element in preview
    const state = JSON.parse(element._value);
    const interaction = state.interaction;

    if (!interaction || interaction.type !== 'adding') {
      throw new Error('Expected adding interaction after paste');
    }

    const pastedElement = interaction.element;
    if (pastedElement.type !== 'text') {
      throw new Error('Expected pasted element to be text');
    }

    if (pastedElement.text !== clipboardText) {
      throw new Error(`Expected text to be "${clipboardText}", got "${pastedElement.text}"`);
    }

    element.remove();
  });
});
