import { UpperDoodle } from '../src/upper-doodle.js';
import elements from './arrow.json' with { type: 'json' };

const doodle = document.getElementById('doodle');

// Required prefixes for UPPER ontology (universal, not domain-specific)
const REQUIRED_PREFIXES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  upper: 'https://github.com/theengineear/ns/upper#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
};

// Create document and convert to canonical JSON
const doc = {
  prefixes: {
    ...REQUIRED_PREFIXES,
    demo: 'https://github.com/theengineear/onto/demo#',
  },
  domain: 'demo',
  elements,
  nTriples: '',
};
doodle.value = UpperDoodle.valueFromObject(doc);
