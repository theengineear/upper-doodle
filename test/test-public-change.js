import { UpperDoodle } from '../src/upper-doodle.js';
import { createTestElement, minify } from './shared.js';
import { describe, it, assert } from '@netflix/x-test/x-test.js';

describe('change event', () => {
  it('fires when domain is updated via _domain()', async () => {
    const element = createTestElement();
    document.body.append(element);

    let changeEventFired = false;
    element.addEventListener('change', () => {
      changeEventFired = true;
    });

    // Update domain
    element._domain('new-domain');

    // Wait for async render to complete
    await Promise.resolve();

    assert(changeEventFired, 'Expected change event to fire when domain is updated');
    assert(element.valueAsObject.domain === 'new-domain', 'Expected domain to be updated to "new-domain"');

    element.remove();
  });

  it('fires when domain is updated via domain input', async () => {
    const element = createTestElement();
    document.body.append(element);

    let changeEventFired = false;
    element.addEventListener('change', () => {
      changeEventFired = true;
    });

    // Get domain input from shadow DOM
    const domainInput = element.shadowRoot.getElementById('domain');

    // Update domain via input
    domainInput.value = 'another-domain';
    domainInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Wait for async render to complete
    await Promise.resolve();

    assert(changeEventFired, 'Expected change event to fire when domain input is changed');
    assert(element.valueAsObject.domain === 'another-domain', 'Expected domain to be updated to "another-domain"');

    element.remove();
  });

  it('does not fire when domain is set to same value', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Set initial domain
    element._domain('initial-domain');

    // Wait for async render to complete
    await Promise.resolve();

    let changeEventCount = 0;
    element.addEventListener('change', () => {
      changeEventCount++;
    });

    // Set domain to same value
    element._domain('initial-domain');

    // Wait for async render to complete
    await Promise.resolve();

    assert(changeEventCount === 0, 'Expected no change event when domain is set to the same value');

    element.remove();
  });

  it('fires when elements change', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`
      {
        "domain": "test",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "rect1": {
            "id": "rect1",
            "type": "rectangle",
            "x": 100,
            "y": 100,
            "width": 200,
            "height": 100,
            "text": "Hello"
          }
        },
        "nTriples": ""
      }
    `);

    const element = createTestElement();
    document.body.append(element);

    let changeEventFired = false;
    element.addEventListener('change', () => {
      changeEventFired = true;
    });

    // Update elements
    element.value = valueAsJSON;

    // Wait for async render to complete
    await Promise.resolve();

    assert(changeEventFired, 'Expected change event to fire when elements are updated');

    element.remove();
  });

  it('fires when both domain and elements change', async () => {
    const valueAsJSON = UpperDoodle.valueFromJSON(minify`
      {
        "domain": "updated-domain",
        "prefixes": {
          "test": "https://github.com/theengineear/onto/test#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "upper": "https://github.com/theengineear/ns/upper#",
          "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        "elements": {
          "diamond1": {
            "id": "diamond1",
            "type": "diamond",
            "x": 100,
            "y": 100,
            "width": 120,
            "height": 120,
            "text": "Diamond (DC)"
          }
        },
        "nTriples": ""
      }
    `);

    const element = createTestElement();
    document.body.append(element);

    let changeEventCount = 0;
    element.addEventListener('change', () => {
      changeEventCount++;
    });

    // Update both domain and elements
    element.value = valueAsJSON;

    // Wait for async render to complete
    await Promise.resolve();

    // Should fire exactly once (both changes in single update)
    assert(changeEventCount === 1, 'Expected change event to fire exactly once when both domain and elements change');
    assert(element.valueAsObject.domain === 'updated-domain', 'Expected domain to be updated');

    element.remove();
  });
});
