import { UpperDoodle } from '../src/upper-doodle.js';
import {
  createTestElement,
  createDefaultDoc,
  dedent,
} from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('.valueAsTurtle', () => {
  it('returns Turtle format for diamond', () => {
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
    const actual = element.valueAsTurtle;
    const expected = dedent`\
      @prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
      @prefix test:  <https://github.com/theengineear/onto/test#> .
      @prefix upper: <https://github.com/theengineear/ns/upper#> .
      @prefix xsd:   <http://www.w3.org/2001/XMLSchema#> .

      test:
          a            upper:DomainModel ;
          upper:domain "test" ;
      .

      test:directedBy
          a              upper:Relationship ;
          upper:class    test:Person ;
          upper:minCount 1 ;
          upper:maxCount 1 ;
      .

      test:Movie
          a              upper:DirectClass ;
          upper:property test:directedBy ;
      .

      test:name
          a              upper:Attribute ;
          upper:datatype xsd:string ;
          upper:minCount 1 ;
          upper:maxCount 1 ;
      .

      test:Person
          a              upper:DirectClass ;
          upper:property test:name ;
      .

    `;
    if (actual !== expected) {
      throw new Error(`Expected exact turtle output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('returns Turtle format with primary key', () => {
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
    const actual = element.valueAsTurtle;
    const expected = dedent`\
      @prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
      @prefix test:  <https://github.com/theengineear/onto/test#> .
      @prefix upper: <https://github.com/theengineear/ns/upper#> .
      @prefix xsd:   <http://www.w3.org/2001/XMLSchema#> .

      test:
          a            upper:DomainModel ;
          upper:domain "test" ;
      .

      test:Movie
          a                upper:DirectClass ;
          upper:primaryKey ( test:title test:year ) ;
          upper:property   test:title ;
          upper:property   test:year ;
      .

      test:title
          a              upper:Attribute ;
          upper:datatype xsd:string ;
          upper:minCount 1 ;
          upper:maxCount 1 ;
      .

      test:year
          a              upper:Attribute ;
          upper:datatype xsd:integer ;
          upper:minCount 1 ;
          upper:maxCount 1 ;
      .

    `;
    if (actual !== expected) {
      throw new Error(`Expected exact turtle output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('returns Turtle format with unbounded cardinality (1..n)', () => {
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
          text: 'test:Actor (DC)',
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
          text: 'test:hasActor (1..n)',
          source: 'diamond-1',
          target: 'diamond-2',
        },
        'arrow-2': {
          id: 'arrow-2',
          type: 'arrow',
          x1: 300, y1: 60, x2: 400, y2: 60,
          text: 'test:name (1..n)',
          source: 'diamond-2',
          target: 'rectangle-1',
        },
      },
    };
    const element = createTestElement();
    document.body.append(element);
    element.value = UpperDoodle.valueFromObject(valueAsObject);
    const actual = element.valueAsTurtle;
    const expected = dedent`\
      @prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
      @prefix test:  <https://github.com/theengineear/onto/test#> .
      @prefix upper: <https://github.com/theengineear/ns/upper#> .
      @prefix xsd:   <http://www.w3.org/2001/XMLSchema#> .

      test:
          a            upper:DomainModel ;
          upper:domain "test" ;
      .

      test:Actor
          a              upper:DirectClass ;
          upper:property test:name ;
      .

      test:hasActor
          a              upper:Relationship ;
          upper:class    test:Actor ;
          upper:minCount 1 ;
      .

      test:Movie
          a              upper:DirectClass ;
          upper:property test:hasActor ;
      .

      test:name
          a              upper:Attribute ;
          upper:datatype xsd:string ;
          upper:minCount 1 ;
      .

    `;
    if (actual !== expected) {
      throw new Error(`Expected exact turtle output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('merges custom N-Triples with generated triples in Turtle output', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      // Add prefixes for the custom URIs we'll use
      prefixes: {
        ...createDefaultDoc().prefixes,
        dcterms: 'http://purl.org/dc/terms/',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      },
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
    const actual = element.valueAsTurtle;

    // Expected output should contain BOTH generated triples AND custom triples
    // Custom triples should be converted to Turtle format with prefix expansion
    const expected = dedent`\
      @prefix dcterms: <http://purl.org/dc/terms/> .
      @prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
      @prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix test:    <https://github.com/theengineear/onto/test#> .
      @prefix upper:   <https://github.com/theengineear/ns/upper#> .
      @prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

      test:
          a            upper:DomainModel ;
          upper:domain "test" ;
      .

      test:Movie
          a               upper:DirectClass ;
          upper:property  test:title ;
          dcterms:creator "John Doe" ;
          rdfs:comment    "Represents a movie entity" ;
      .

      test:title
          a              upper:Attribute ;
          upper:datatype xsd:string ;
          upper:minCount 1 ;
          upper:maxCount 1 ;
      .

    `;
    if (actual !== expected) {
      throw new Error(`Expected merged turtle output.\nExpected: ${expected}\nActual: ${actual}`);
    }
    element.remove();
  });

  it('deduplicates triples when custom N-Triples contain duplicates in Turtle output', () => {
    const valueAsObject = {
      ...createDefaultDoc(),
      // Add prefix for rdfs namespace
      prefixes: {
        ...createDefaultDoc().prefixes,
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      },
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
    const actual = element.valueAsTurtle;

    // Should only have one DirectClass type declaration
    const typeMatches = (actual.match(/a\s+upper:DirectClass/g) || []).length;
    if (typeMatches !== 1) {
      throw new Error(`Expected exactly one DirectClass type declaration, but found ${typeMatches}.\nActual output: ${actual}`);
    }

    // Verify the label is present
    if (!actual.includes('rdfs:label')) {
      throw new Error('Expected custom label property to be present in Turtle output');
    }

    element.remove();
  });
});
