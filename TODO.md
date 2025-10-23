# TODO

## High Priority

### Remove Text / Raw support if truly not needed.
We have some vestigial pieces of the codebase which may really never be needed.
We shouldn’t keep them around if they aren’t doing anything for us.

### Trees are not maintained on copy / paste.
When you copy / paste a tree, we lose the tree concept completely and that’s a
bug! We need to map all our ids and be really careful about what we do and don’t
copy. We probably need to think about what it even means to select part of a
tree and copy it :thinking:

### Assert that concepts don't conflict
For diamonds, the _same_ type abbreviation must consistently be used. And for
arrows, the _same_ set of cardinality must be used.

### Changing the domain doesn’t properly re-render everything.
Elements will property turn _invalid_ if you change the domain to something
other than what they were using. THEN, if you change it _back_ they remain
invalid! But, if you change something else in the element and it properly
re-renders… then it will work.

### Do not send change events for _programmatic updates_.
Only user-initiated updates should cause a `change` event!

### Rename `document` to just `value` and `doc` to `value`.
We have a lot of places in our code referring to like `Validate.document`, but
that is an overloaded term in the web (i.e., HTML document / window.document).
It would be better to just call this what it is… the _value_ of the element.

### Picker for class DSL.
Rather than have folks repetitively type like `(SC)` / `(DC)`, we could just
have them _pick_ the class up front when adding the diamond. However, that’s
still kind of annoying since you have to remember what type something is when
you go to reference it… we might need a picker for a declaration and a picker
for a _reference to something already declared_ or some such? This is actually
a bit nuanced!

### React demo
Write a simple react demo which shows how you can leverage this from within a
react ecosystem.

### Can everything be single-line? No multiline?
We likely no longer need the `text` element (or could rename it to a concept of
raw). And, the diamond / arrow DSLs could probably be made to only contain a
single line of text. This would greatly simplify our DOM.

### Branding?
Could be cute to have _some_ sort of branding appear by default. And it’d be
fine if there was an easy way to hide it.

### Think through accessibility.
SVG interactions can be tough to make truly accessible. We will need to be
purposeful about enabling things like keyboard navigation / focus states. Also,
we will probably want to change how "tree" controls work. Rather than beginning
with a _click_ in the SVG canvas — it would be a better pattern to have a
dedicated tool which can be used to initiating an "add item" interaction or some
such. In general, you don't want to try and emulate "buttons" in SVG!

#### Current Architecture Problems

**The tree ⊕ button is currently rendered in `#content`** (line 3540 in
`upper-doodle.js`), which creates several issues:

1. **Accessibility**: SVG `<text>` with `pointer-events: all` isn't a real
   button. No keyboard navigation, focus states, or ARIA semantics.

2. **Semantic mixing**: `#content` should be pure data (diagram model), `#ui`
   should be ephemeral UI (selection handles, previews). The ⊕ button is UI
   chrome being baked into the content layer.

3. **Hit testing complexity**: Requires special CSS to make some SVG text
   clickable and some not. Creates ambiguity between selecting vs. triggering
   actions.

4. **Export/Import confusion**: These "buttons" are transient UI but rendered
   into the content layer that represents persistent state.

5. **Not yet functional**: The button is rendered but has no click handler
   (good - we haven't committed to this pattern yet).

#### Recommended Approach: Dedicated Tool Mode

**Use the existing toolbar pattern** (like `_plant()` for planting trees):

```javascript
// Add toolbar button
<button id="add-tree-item">➕ Add to Tree</button>

// Add new interaction type
_addTreeItem() {
  this.#state = State.setInteraction(this.#state, {
    type: 'adding-tree-item',
  });
  this.#invalidateCursor();
}

// In _down() handler
if (currentInteraction && currentInteraction.type === 'adding-tree-item') {
  this.#finalizeAddTreeItemInteraction(viewX, viewY);
  return;
}
```

**User workflow:**
1. Click "Add to Tree" tool → enters 'adding-tree-item' mode
2. Cursor changes to indicate mode
3. Click a tree element → adds child to that element
4. Exit mode automatically or via Escape

**Benefits:**
- ✅ No fake SVG buttons in `#content`
- ✅ Clear modal interaction pattern
- ✅ Accessible toolbar button with full keyboard support
- ✅ Consistent with existing tools (diamond, rectangle, planting, etc.)
- ✅ Clean separation: toolbar = tools, `#content` = data, `#ui` = transient state

**Implementation steps:**
1. Remove `#renderElementActionButtons()` code that creates ⊕ buttons
2. Add toolbar button for "Add to Tree" mode
3. Implement `adding-tree-item` interaction type
4. Update cursor to show which elements are valid targets

### Get type abbreviations working
You should be able to do like `ex:Foo (SC)`. We also need to **validate** that
any two representations of a concept do not conflict!

### Get arrow DSLs working
You should be able to say like `ex:parent (^ex:son)` (or something).

### Revisit how text width is determined.
The only _real_ way to do this is to actually render it, then measure the width.
Alternatively, we may be able to get away with literally never measuring until
we need a selection UI… Let’s bail on doing any sort of text wrapping for now.

### Improved prefix registration
Need to allow users to register prefixes somehow in the tool.

### Flesh out color palette
The variables in our .css file need some love.

### Flesh out spacings / margins.
Just need to encode a 4px sizing.

### Add transitions to button states.
Should just need to transition color / background-color.

### Make domain input grow to match content perfectly
You need to create a hidden wrapper element bind the value of the wrapper to the
value in the text box.

### Validate domain input with form/formData patterns
The domain input needs proper validation using standard HTML5 form validation.
Wrap `#domain` in a `<form>` element and leverage formData and standard
validation flows for proper error handling and user feedback.

### Redo how we handle _raw_ data.
One thought is to just assume a text string starting with `# N-Triples` will be
interpreted as _raw_. We will parse it (to validate), but then literally add it
verbatim.

### Light / Dark themes
We now have a set of design tokens, but we aren’t actually theming them. We need
to figure out what a light / dark mode would look like.

### Beyond removing duplicated triples, we could remove redundant triples
While we can say both `ex:foo a upper:Property` and `ex:foo a upper:Attribute`,
there is no reason to say the former. We may need to figure out if we are
willing to say partial things like this. We may need to figure out multiple
levels of _ignored_ (i.e., it would not be binary)… something like “I see you,
but I also see that you’re incomplete”. So maybe `incomplete` _and_ `ignored`_.

### All public methods (even _* methods) should have a test suite.
Name says it all — just need to get the surface area up!

### Syntax highlight our DSL.
The diamond text `onepiece:DevilFruit (DC)` has _three_ distinct parts. And we
should basically syntax-highlight it as `onepiece:` + `DevilFruit` + `(DC)`. The
`DevilFruit` should feel like the primary text. Same goes for arrays like
`onepiece:ename (1..1)`… the `ename` is the most important, but it’s lost in
syntax.

### Select array by hitting array text.
As a user, you _want_ to be able to use the array label as a valid hit area for
the array itself, but it doesn’t work that way.

## Bugs

### Make undo / redo snapshots more intuitive
The undo / redo controls sometimes don’t appear to have a visible impact. This
is a little nuanced, but the goal should be that every undo / redo change should
cause a _visible_ change. Otherwise, it feels like a bug, even if it’s working
as expected.

### Arrow Binding with Negative Dimensions
There's a bug with arrow binding when you drag a shape into a negative width or height.

## Features

### Update interface to accept `domains` (versus prefixes).
It could be valuable to literally load _everything_ so that the tool can auto
complete concepts across domains and validate that you are pointing to things
which exist. We should be able to do this.

### Support Multi-line Text / Labels
Currently text elements only support single-line content. Need to add multi-line text support.

### Detail Panel for Selected Elements
Consider adding a detail panel on the RHS that pops up when you select concepts (or something). It would be exactly the object we show later in the other UI. This would be perfect feedback for modeling. You would not be able to edit this view, it is purely output.

## Design Decisions

### Allow control of tree horizontal positioning?
Maybe this is a terrible idea… but, we _could_ let users position things
horizontally as they see fit and simply build the tree with those horizontal
positions as input. This would be similar to how we allow width / height to be
controlled by the user. TBD, but ideally, we want to really leave aesthetic
choices up to the user as much as possible. They know the domain best!

### UI Zoom Behavior
Can / should the "ui" remain fixed in size through zoom interactions?

### Point Abstraction
Create a _point_ concept to simplify / abstract certain operations. Right now, we pass around x, y pairs flatly or have to say x1, y1, x2, y2. It would be nice to just deal with points directly.

## Performance Optimizations

### Hit Testing Improvements
We currently render text on-the-fly when performing a hit test. This won't scale as we have more and more text elements rendered in the diagram. A better approach would be to store internal state (non-exported) that tracks the bounding boxes for all our elements and allows us to recompute when elements change, and quickly introspect on things like mouse moves and clicks.

Revisit how we hit test. It won't scale to test all elements on mouse move. Instead — we should create an index for elements which is a sort of mapping from world-coordinate spans to enclosed elements.

Current implementation: O(n) linear search through all elements
- Called on every pointer move for cursor updates (`#deriveCursor`)
- Called on pointer down for click handling (`_down`)
- Performance becomes noticeable with 100+ elements

Proposed solution: Spatial indexing (when needed)
- Option A: R-tree for O(log n) queries (e.g., rbush library)
- Option B: Uniform grid spatial hash for O(1) average case
  - Divide world into fixed-size cells (e.g., 100x100 units)
  - Each cell stores element IDs whose bboxes intersect it
  - Query point → check only elements in that cell
- Maintain index incrementally as elements add/move/remove

Wait to implement until diagrams exceed ~100 elements.

---

## Performance Optimization Roadmap

### 1. Implement Geometry-Only Updates (HIGHEST IMPACT)
Currently recreates entire DOM nodes when elements move/resize.

**Solution:**
- Cache rough.js generated paths per element ID (non-serialized state)
- For geometry-only changes, update SVG transforms in-place via setAttribute
- Only regenerate rough.js paths when non-geometry properties change (text, source/target for arrows)
- Implement in `Drawing.updateElement()` using the existing `#isGeometryOnlyChange()` check

**Impact:** 10-100x faster drag operations, critical for smooth interactions

### 2. Add Spatial Indexing for Hit Testing
Currently O(n) linear search through all elements on every pointer move.

**Solution:**
- Implement uniform grid spatial hash (100x100 world unit cells)
- Each cell stores Set of element IDs whose bboxes intersect it
- Update index incrementally: on element add/move/remove
- Query: check only elements in cell(s) containing pointer
- Store index in component private state (non-serialized)

**Impact:** O(1) vs O(n) hit tests, noticeable improvement at 100+ elements

### 3. Cache Bounding Box Calculations
Text measurement via `getBBox()` happens frequently (render, hit test, edit).

**Solution:**
- Store computed bounding boxes in `Map<elementId, {x, y, w, h}>` (non-serialized)
- Invalidate cache entry when element geometry/text/size changes
- Reuse cached values in hit testing, rendering, and selection UI
- Particularly important for text elements (expensive DOM measurements)

**Impact:** Eliminates redundant DOM measurements, faster hit testing

### 4. Optimize Selection UI Updates
Currently recreates all selection UI on any interaction/position change.

**Solution:**
- When only element positions change, update handle positions via setAttribute
- Only full recreation when selection set changes or interaction type changes
- Store previous handle positions to detect when updates are needed

**Impact:** Faster during drag operations, reduces DOM thrashing

### 5. Batch DOM Operations
Individual appendChild calls for multiple new elements.

**Solution:**
- Use DocumentFragment for batching multiple element adds
- Group all DOM mutations in render() to trigger single reflow
- Consider using batch update wrapper for complex state changes

**Impact:** Reduces layout thrashing, smoother rendering with many elements
