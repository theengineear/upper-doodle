import { UpperDoodle } from '../src/upper-doodle.js';

const STORAGE_KEY = 'doodle';

let previousDomain = null;
const element = document.querySelector('upper-doodle');

// Compute required prefixes plus application-specific domain prefix.
const computePrefixes = domain => {
  const defaultPrefixes = {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    upper: 'https://github.com/theengineear/ns/upper#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
  };
  if (domain) {
    const baseUrl = new URL('https://github.com/theengineear/ns/');
    const url = new URL(domain, baseUrl);
    url.hash = '#';
    return {
      [domain]: url.href,
      ...defaultPrefixes,
    };
  } else {
    return defaultPrefixes;
  }
};

// Load saved doodle from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
  let initialized = false;
  const savedDoodle = localStorage.getItem(STORAGE_KEY);
  if (savedDoodle) {
    try {
      const doc = JSON.parse(savedDoodle);
      const domain = doc.domain;
      doc.prefixes = computePrefixes(domain);
      element.value = UpperDoodle.valueFromObject(doc);
      previousDomain = domain;
      initialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load doodle:', error);
    }
  }
  if (!initialized) {
    const domain = 'demo';
    const prefixes = computePrefixes(domain);
    const elements = {};
    const nTriples = '';
    element.value = UpperDoodle.valueFromObject({ domain, prefixes, elements, nTriples });
    previousDomain = domain;
  }
});

// Save doodle to localStorage whenever it changes
element.addEventListener('change', () => {
  const doc = JSON.parse(element.value);
  const domain = doc.domain;
  if (domain !== previousDomain) {
    doc.prefixes = computePrefixes(domain);
    element.value = UpperDoodle.valueFromObject(doc);
    previousDomain = domain;
  }
  localStorage.setItem(STORAGE_KEY, element.value);
});

// Handle window resize with requestAnimationFrame throttling
let resizePending = false;
window.addEventListener('resize', () => {
  if (resizePending) {return;}

  resizePending = true;
  requestAnimationFrame(() => {
    element.resize();
    resizePending = false;
  });
});
