import { UpperDoodle } from '../src/upper-doodle.js';
import {
  createTestElement,
  createDefaultDoc,
  dedent,
} from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('.valueAsNTriples', () => {
  it('returns N-Triples format for diamond', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Movie (DC)',
        },
        'diamond-2': {
          id: 'diamond-2',
          type: 'diamond',
          x: 200, y: 10, width: 100, height: 100,
          text: 'test:Person (DC)',
        },
        'rectangle-1': {
          id: 'rectangle-1',
          type: 'rectangle',
          x: 400, y: 10, width: 100, height: 60,
          text: 'xsd:string',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 110, y1: 60, x2: 200, y2: 60,
          text: 'test:directedBy (1..1)',
          source: 'diamond-1',
          target: 'diamond-2',
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 300, y1: 60, x2: 400, y2: 60,
          text: 'test:name (1..1)',
          source: 'diamond-2',
          target: 'rectangle-1',
        },
      },
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);
    const actual = element.valueAsNTriples;
    const expected = dedent`\
      <https://github.com/theengineear/onto/test#> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DomainModel> .
      <https://github.com/theengineear/onto/test#> <https://github.com/theengineear/ns/upper#domain> "test" .
      <https://github.com/theengineear/onto/test#Movie> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .
      <https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#property> <https://github.com/theengineear/onto/test#directedBy> .
      <https://github.com/theengineear/onto/test#Person> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .
      <https://github.com/theengineear/onto/test#Person> <https://github.com/theengineear/ns/upper#property> <https://github.com/theengineear/onto/test#name> .
      <https://github.com/theengineear/onto/test#directedBy> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#Relationship> .
      <https://github.com/theengineear/onto/test#directedBy> <https://github.com/theengineear/ns/upper#class> <https://github.com/theengineear/onto/test#Person> .
      <https://github.com/theengineear/onto/test#directedBy> <https://github.com/theengineear/ns/upper#maxCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#directedBy> <https://github.com/theengineear/ns/upper#minCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#name> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#Attribute> .
      <https://github.com/theengineear/onto/test#name> <https://github.com/theengineear/ns/upper#datatype> <http://www.w3.org/2001/XMLSchema#string> .
      <https://github.com/theengineear/onto/test#name> <https://github.com/theengineear/ns/upper#maxCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#name> <https://github.com/theengineear/ns/upper#minCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .

    `;
    if (actual !== expected) {
      throw new Error(`Expected exact n-triples output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('returns N-Triples format with primary key', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Movie (DC)',
        },
        'rectangle-1': {
          id: 'rectangle-1',
          type: 'rectangle',
          x: 200, y: 10, width: 100, height: 60,
          text: 'xsd:string',
        },
        'rectangle-2': {
          id: 'rectangle-2',
          type: 'rectangle',
          x: 400, y: 10, width: 100, height: 60,
          text: 'xsd:integer',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 110, y1: 60, x2: 200, y2: 60,
          text: 'test:title (1..1 PK1)',
          source: 'diamond-1',
          target: 'rectangle-1',
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 110, y1: 80, x2: 400, y2: 80,
          text: 'test:year (1..1 PK2)',
          source: 'diamond-1',
          target: 'rectangle-2',
        },
      },
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);
    const actual = element.valueAsNTriples;
    const expected = dedent`\
      <https://github.com/theengineear/onto/test#> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DomainModel> .
      <https://github.com/theengineear/onto/test#> <https://github.com/theengineear/ns/upper#domain> "test" .
      <https://github.com/theengineear/onto/test#Movie> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .
      <https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#primaryKey> _:pkdiamond-1_0 .
      <https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#property> <https://github.com/theengineear/onto/test#title> .
      <https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#property> <https://github.com/theengineear/onto/test#year> .
      <https://github.com/theengineear/onto/test#title> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#Attribute> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#datatype> <http://www.w3.org/2001/XMLSchema#string> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#maxCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#minCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#year> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#Attribute> .
      <https://github.com/theengineear/onto/test#year> <https://github.com/theengineear/ns/upper#datatype> <http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#year> <https://github.com/theengineear/ns/upper#maxCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#year> <https://github.com/theengineear/ns/upper#minCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      _:pkdiamond-1_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://github.com/theengineear/onto/test#title> .
      _:pkdiamond-1_0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:pkdiamond-1_1 .
      _:pkdiamond-1_1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <https://github.com/theengineear/onto/test#year> .
      _:pkdiamond-1_1 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> .

    `;
    if (actual !== expected) {
      throw new Error(`Expected exact n-triples output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('marks primary key arrows as invalid when sequence is incorrect', async () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Movie (DC)',
        },
        'rectangle-1': {
          id: 'rectangle-1',
          type: 'rectangle',
          x: 200, y: 10, width: 100, height: 60,
          text: 'xsd:string',
        },
        'rectangle-2': {
          id: 'rectangle-2',
          type: 'rectangle',
          x: 400, y: 10, width: 100, height: 60,
          text: 'xsd:integer',
        },
        'rectangle-3': {
          id: 'rectangle-3',
          type: 'rectangle',
          x: 600, y: 10, width: 100, height: 60,
          text: 'xsd:boolean',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 110, y1: 60, x2: 200, y2: 60,
          text: 'test:title (1..1 PK1)',
          source: 'diamond-1',
          target: 'rectangle-1',
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 110, y1: 80, x2: 400, y2: 80,
          text: 'test:year (1..1 PK3)',
          source: 'diamond-1',
          target: 'rectangle-2',
        },
        'arrow-3': {
          id: 'arrow-3',
          type: 'arrow',
          x1: 110, y1: 100, x2: 600, y2: 100,
          text: 'test:active (1..1 PK4)',
          source: 'diamond-1',
          target: 'rectangle-3',
        },
      },
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);

    await Promise.resolve();

    // Check that arrow-2 and arrow-3 are marked as invalid (missing PK2)
    const svg = element.shadowRoot.getElementById('svg');
    const arrow2 = svg.querySelector('[data-id="arrow-2"]');
    const arrow3 = svg.querySelector('[data-id="arrow-3"]');

    if (!arrow2.hasAttribute('data-invalid')) {
      throw new Error('Expected arrow-2 to be marked as invalid (PK3 when PK2 is expected)');
    }
    if (!arrow3.hasAttribute('data-invalid')) {
      throw new Error('Expected arrow-3 to be marked as invalid (subsequent to invalid PK3)');
    }

    element.remove();
  });

  it('marks primary key arrows as invalid when first key is not PK1', async () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Movie (DC)',
        },
        'rectangle-1': {
          id: 'rectangle-1',
          type: 'rectangle',
          x: 200, y: 10, width: 100, height: 60,
          text: 'xsd:string',
        },
        'rectangle-2': {
          id: 'rectangle-2',
          type: 'rectangle',
          x: 400, y: 10, width: 100, height: 60,
          text: 'xsd:integer',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 110, y1: 60, x2: 200, y2: 60,
          text: 'test:title (1..1 PK2)',
          source: 'diamond-1',
          target: 'rectangle-1',
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 110, y1: 80, x2: 400, y2: 80,
          text: 'test:year (1..1 PK3)',
          source: 'diamond-1',
          target: 'rectangle-2',
        },
      },
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);

    await Promise.resolve();

    // Check that both arrows are marked as invalid (first key should be PK1)
    const svg = element.shadowRoot.getElementById('svg');
    const arrow1 = svg.querySelector('[data-id="arrow-1"]');
    const arrow2 = svg.querySelector('[data-id="arrow-2"]');

    if (!arrow1.hasAttribute('data-invalid')) {
      throw new Error('Expected arrow-1 to be marked as invalid (PK2 when PK1 is expected)');
    }
    if (!arrow2.hasAttribute('data-invalid')) {
      throw new Error('Expected arrow-2 to be marked as invalid (subsequent to invalid PK2)');
    }

    element.remove();
  });

  it('merges custom N-Triples with generated triples', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Movie (DC)',
        },
        'rectangle-1': {
          id: 'rectangle-1',
          type: 'rectangle',
          x: 200, y: 10, width: 100, height: 60,
          text: 'xsd:string',
        },
        'arrow-1': {
          id: 'arrow-1',
          type: 'arrow',
          x1: 110, y1: 60, x2: 200, y2: 60,
          text: 'test:title (1..1)',
          source: 'diamond-1',
          target: 'rectangle-1',
        },
      },
      // Add custom N-Triples that provide additional metadata
      nTriples: dedent`
        <https://github.com/theengineear/onto/test#Movie> <http://purl.org/dc/terms/creator> "John Doe" .
        <https://github.com/theengineear/onto/test#Movie> <http://www.w3.org/2000/01/rdf-schema#comment> "Represents a movie entity" .
      `,
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);
    const actual = element.valueAsNTriples;

    // Expected output should contain BOTH generated triples AND custom triples
    const expected = dedent`\
      <https://github.com/theengineear/onto/test#> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DomainModel> .
      <https://github.com/theengineear/onto/test#> <https://github.com/theengineear/ns/upper#domain> "test" .
      <https://github.com/theengineear/onto/test#Movie> <http://purl.org/dc/terms/creator> "John Doe" .
      <https://github.com/theengineear/onto/test#Movie> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .
      <https://github.com/theengineear/onto/test#Movie> <http://www.w3.org/2000/01/rdf-schema#comment> "Represents a movie entity" .
      <https://github.com/theengineear/onto/test#Movie> <https://github.com/theengineear/ns/upper#property> <https://github.com/theengineear/onto/test#title> .
      <https://github.com/theengineear/onto/test#title> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#Attribute> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#datatype> <http://www.w3.org/2001/XMLSchema#string> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#maxCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .
      <https://github.com/theengineear/onto/test#title> <https://github.com/theengineear/ns/upper#minCount> "1"^^<http://www.w3.org/2001/XMLSchema#integer> .

    `;
    if (actual !== expected) {
      throw new Error(`Expected merged n-triples output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('deduplicates triples when custom N-Triples contain duplicates', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'diamond-1': {
          id: 'diamond-1',
          type: 'diamond',
          x: 10, y: 10, width: 100, height: 100,
          text: 'test:Person (DC)',
        },
      },
      // Add custom N-Triples that duplicate a generated triple
      nTriples: dedent`
        <https://github.com/theengineear/onto/test#Person> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .
        <https://github.com/theengineear/onto/test#Person> <http://www.w3.org/2000/01/rdf-schema#label> "Person Class" .
      `,
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);
    const actual = element.valueAsNTriples;

    // Count occurrences of the DirectClass triple - should appear exactly once
    const directClassTriple = '<https://github.com/theengineear/onto/test#Person> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://github.com/theengineear/ns/upper#DirectClass> .';
    const occurrences = (actual.match(new RegExp(directClassTriple.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    if (occurrences !== 1) {
      throw new Error(`Expected DirectClass triple to appear exactly once, but appeared ${occurrences} times.\nActual output: ${actual}`);
    }

    // Verify the label triple is present
    if (!actual.includes('<https://github.com/theengineear/onto/test#Person> <http://www.w3.org/2000/01/rdf-schema#label> "Person Class" .')) {
      throw new Error('Expected custom label triple to be present in output');
    }

    element.remove();
  });
});
