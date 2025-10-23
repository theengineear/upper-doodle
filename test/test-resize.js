import { UpperDoodle } from '../src/upper-doodle.js';
import { assertStateEqual, createDefaultDoc } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';
import { assert } from '@netflix/x-test/x-test.js';

/**
 * Get the rendered bounding box dimensions of an element
 * @param {HTMLElement} component - The upper-doodle component
 * @param {string} elementId - The element ID to query
 * @returns {{width: number, height: number}} Rendered dimensions in pixels
 */
const getRenderedDimensions = (component, elementId) => {
  const svgElement = component.shadowRoot.querySelector(`[data-id="${elementId}"]`);
  if (!svgElement) {
    throw new Error(`Element ${elementId} not found in shadow DOM`);
  }
  const bbox = svgElement.getBBox();
  return { width: bbox.width, height: bbox.height };
};

/**
 * Assert that two values are approximately equal (within tolerance)
 * @param {number} actual - Actual value
 * @param {number} expected - Expected value
 * @param {number} tolerancePercent - Tolerance as percentage (e.g., 2 for 2%)
 * @param {string} label - Label for error message
 */
const assertApproxEqual = (actual, expected, tolerancePercent, label) => {
  const tolerance = Math.abs(expected * (tolerancePercent / 100));
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    assert(false, `${label}: expected ${expected} ±${tolerancePercent}%, got ${actual} (diff: ${diff.toFixed(2)})`);
  } else {
    assert(true);
  }
};

describe('resize()', () => {
  it('renders square as square in square viewport', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px'; // 1000px SVG + 50px toolbar
    document.body.append(element);

    // Create a 100x100 world square
    const elements = JSON.stringify({
      'square-1': {
        id: 'square-1',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // For a 1000x1000 SVG with kx=1, ky=1:
    // 100 world units should render as 100 pixels in both dimensions
    const dims = getRenderedDimensions(element, 'square-1');
    assertApproxEqual(dims.width, dims.height, 2, 'Square should have equal width and height');

    element.remove();
  });

  it('renders square as square after resize to wide viewport', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px'; // Start square
    document.body.append(element);

    // Create a 100x100 world square
    const elements = JSON.stringify({
      'square-wide': {
        id: 'square-wide',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Resize to wide viewport (2:1 aspect ratio for SVG)
    element.style.width = '2000px';
    element.style.height = '1050px'; // 2000x1000 SVG + 50px toolbar
    element.resize();
    await Promise.resolve();

    // For a 2000x1000 SVG: kx = 1000/2000 = 0.5, ky = 1000/1000 = 1
    // The square should still render with equal width and height in pixels
    const dims = getRenderedDimensions(element, 'square-wide');
    assertApproxEqual(dims.width, dims.height, 2, 'Square should remain square after resize to wide viewport');

    element.remove();
  });

  it('renders square as square after resize to tall viewport', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px'; // Start square
    document.body.append(element);

    // Create a 100x100 world square
    const elements = JSON.stringify({
      'square-tall': {
        id: 'square-tall',
        type: 'rectangle',
        x: 100, y: 100, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Resize to tall viewport (1:2 aspect ratio for SVG)
    element.style.width = '1000px';
    element.style.height = '2050px'; // 1000x2000 SVG + 50px toolbar
    element.resize();
    await Promise.resolve();

    // For a 1000x2000 SVG: kx = 1000/1000 = 1, ky = 1000/2000 = 0.5
    // The square should still render with equal width and height in pixels
    const dims = getRenderedDimensions(element, 'square-tall');
    assertApproxEqual(dims.width, dims.height, 2, 'Square should remain square after resize to tall viewport');

    element.remove();
  });

  it('maintains element world coordinates after resize', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px';
    document.body.append(element);

    // Add an element at a specific world position
    const elements = JSON.stringify({
      'rect-1': {
        id: 'rect-1',
        type: 'rectangle',
        x: 200, y: 200, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Get the exported state before resize
    const beforeState = JSON.stringify(element.valueAsObject.elements);

    // Resize to a different aspect ratio
    element.style.width = '2000px';
    element.style.height = '1050px';
    element.resize();
    await Promise.resolve();

    // Get the exported state after resize
    const afterState = JSON.stringify(element.valueAsObject.elements);

    // World coordinates should be identical
    assertStateEqual(afterState, beforeState, ['elements']);

    element.remove();
  });

  it('renders square as square after resize from wide to tall viewport', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '2000px';
    element.style.height = '1050px'; // Start wide
    document.body.append(element);

    // Create a 100x100 world square
    const elements = JSON.stringify({
      'square-transition': {
        id: 'square-transition',
        type: 'diamond',
        x: 300, y: 300, width: 100, height: 100,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Resize to tall
    element.style.width = '1000px';
    element.style.height = '2050px';
    element.resize();
    await Promise.resolve();

    // The square should still render with equal width and height
    const dims = getRenderedDimensions(element, 'square-transition');
    assertApproxEqual(dims.width, dims.height, 2, 'Square should remain square after wide→tall resize');

    element.remove();
  });

  it('renders square as square after multiple consecutive resizes', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px';
    document.body.append(element);

    // Create a 50x50 world square (smaller to test precision)
    const elements = JSON.stringify({
      'square-multi': {
        id: 'square-multi',
        type: 'diamond',
        x: 100, y: 100, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Resize multiple times
    element.style.width = '2000px';
    element.resize();
    await Promise.resolve();

    element.style.width = '1500px';
    element.resize();
    await Promise.resolve();

    element.style.width = '1000px';
    element.resize();
    await Promise.resolve();

    // Verify square is still square after all the resizes
    // Use slightly higher tolerance (3%) to account for cumulative floating-point rounding
    const dims = getRenderedDimensions(element, 'square-multi');
    assertApproxEqual(dims.width, dims.height, 3, 'Square should remain square after multiple resizes');

    element.remove();
  });

  it('handles zero dimensions gracefully and renders square correctly after recovery', async () => {
    const element = document.createElement('upper-doodle');
    element.style.width = '1000px';
    element.style.height = '1050px';
    document.body.append(element);

    // Create element before zero-dimension test
    const elements = JSON.stringify({
      'square-zero': {
        id: 'square-zero',
        type: 'rectangle',
        x: 50, y: 50, width: 50, height: 50,
        text: '',
      },
    });
    const valueAsObject = { ...createDefaultDoc(), elements: JSON.parse(elements) };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Set to zero dimensions (shouldn't crash)
    element.style.width = '0px';
    element.style.height = '0px';
    element.resize();
    await Promise.resolve();

    // Restore to valid dimensions
    element.style.width = '1000px';
    element.style.height = '1050px';
    element.resize();
    await Promise.resolve();

    // Verify square is still square after recovery
    const dims = getRenderedDimensions(element, 'square-zero');
    assertApproxEqual(dims.width, dims.height, 2, 'Square should remain square after zero-dimension resize');

    element.remove();
  });
});
