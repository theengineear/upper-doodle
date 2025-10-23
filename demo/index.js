import '../src/upper-doodle.js';

const KEY = 'doodle';

const elements = {
  target: document.getElementById('target'),
  copy: document.getElementById('copy'),
  reset: document.getElementById('reset'),
};

const load = () => {
  try {
    elements.target.elements = JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    elements.target.elements = [];
  }
};

const save = () => {
  localStorage.setItem(KEY, JSON.stringify(elements.target.elements));
};

const copy = () => {
  const json = JSON.stringify(elements.target.elements, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    alert('JSON data copied to clipboard!');
  });
};

const reset = () => {
  localStorage.removeItem(KEY);
  load();
};

elements.target.addEventListener('change', () => {
  save();
});

elements.reset.addEventListener('click', () => {
  reset();
});

elements.copy.addEventListener('click', () => {
  copy();
});

load();
