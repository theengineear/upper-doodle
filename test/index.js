import { test, coverage } from '@netflix/x-test/x-test.js';

coverage('../src/upper-doodle.js', 70);

// Test public, static method interface.
test('./test-public-value-from-object.html');
test('./test-public-value-from-json.html');

// // Test public, instance property interface
test('./test-public-value.html');
test('./test-public-value-as-n-triples.html');
test('./test-public-value-as-turtle.html');

// Test public, event interface
test('./test-public-change.html');

// Internal interface
test('./test-validate.html');
test('./test-value.html');
test('./test-create.html');
test('./test-create-arrow.html');
test('./test-zoom.html');
test('./test-pan.html');
test('./test-down.html');
test('./test-move.html');
test('./test-up.html');
test('./test-cancel.html');
test('./test-copy-paste.html');
test('./test-overwrite.html');
test('./test-edit.html');
test('./test-hit.html');
test('./test-resize.html');
test('./test-dom.html');
test('./test-drawing-tree.html');
