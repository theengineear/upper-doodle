import '../src/upper-doodle.js';
import { createTestElement } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_up', () => {
  it('accepts no arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._up();
    element.remove();
  });
});
