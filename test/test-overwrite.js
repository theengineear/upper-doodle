import '../src/upper-doodle.js';
import { assertThrows, createTestElement } from './shared.js';
import { describe, it } from '@netflix/x-test/x-test.js';

describe('_overwrite', () => {
  it('accepts valid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    element._overwrite('hello');
    element._overwrite('');
    element._overwrite('some text');
    element.remove();
  });

  it('throws for invalid arguments', () => {
    const element = createTestElement();
    document.body.append(element);
    assertThrows(() => element._overwrite(123), 'newText must be a string');
    element.remove();
  });
});
