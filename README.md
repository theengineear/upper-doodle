# Upper Doodle

A sketch-based web component for visual authoring of Upper ontology models.

[doodle once, represent everywhere](https://netflixtechblog.com/uda-unified-data-architecture-6a6aee261d8d)

TODO! Image of simple domain model + Resulting turtle text.

## Overview

This project provides a visual design tool for creating Upper data models using
hand-drawn aesthetics. It combines Excalifont typography, Rough.js rendering,
and Netflix’s Upper metamodel to create an intuitive modeling experience.

## Example

```js
// You can import and leverage in any / all frameworks. This example just shows
//  how you can import this tool and minimally boot with no other dependencies.
import { UpperDoodle } from 'https://esm.sh/gh/theengineear/upper-doodle@main/src/upper-doodle.js?raw';
const element = document.createElement('upper-doodle');
element.value = UpperDoodle.valueFromObject({
  // The prefix for the domain you are authoring.
  domain: 'demo',
  // Mapping of prefixes to uris (needed for RDF generation).
  prefixes: {
    // Integration-specific prefixes.
    demo: 'https://raw.githubusercontent.com/theengineear/fake/demo#',
    upper: 'https://raw.githubusercontent.com/theengineear/fake/upper#',

    // Global / well-known prefixes. See https://prefix.cc/.
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
  },
  elements: {}, // This will be empty the first time you boot.
  nTriples: '', // Optionally add an N-Triples document here if you need.
});
document.body.append(element);
```

## Visual Language

There are only a couple things you can create in the tool: diamonds, arrows,
rectangles and trees.

A **diamond** is a _concept_ — e.g., a named direct class which will exist in
your domain.

An **arrow** represents a _property_ on a class — e.g., a relationship between
two classes which has a named field. Arrows connecting a diamond to a rectangle
define _attributes_ while arrows connecting two diamonds define _relationships_.

A **rectangle** is a _datatype_ — e.g., a string literal or an integer literal.

A **tree** represents a _hierarchy_ of concepts — e.g., an enumeration concept
alongside it’s values or a sealed class hierarchy.

That’s it!

### Diamond DSL

TODO! Describe DSL for concepts like `foo:Bar (SC)`.

### Arrow DSL

TODO! Describe DSL for attributes like `foo:blah (1..1)`.

## Interface

While not (yet) a formal form-associated custom element, form-control
conventions are followed. The main interface you will use is a getter / setter
on the `.value` property and listening to `change` events which are dispatched
during interactions. There is no styling interface (yet).

### Instance Methods

The `.resize()` method takes no arguments and recalculates scene transforms for
the SVG viewport. You can _and likely will_ need to listen to window resize
events and call `.resize()` on the element. Note that it will resize _once_ on
its initial connection to the DOM, but integrators are responsible for future
resizing.

### Instance Properties

The `.value` setter is _the_ way to declare the state of the component. It takes
a simple string value, but it expects that it will be canonicalized (see section
on `UpperDoodle.valueFromObject` and `UpperDoodle.valueFromJSON` below).

The `.value` getter will always provide the most-current, canonicalized
representation. Note that the value is a JSON representation.

The `.valueAsObject` getter (getter only) returns the value as an instantiated
object.

The `.valueAsNTriples` getter (getter only) returns the value as an N-Triples
document.

The `.valueAsTurtle` getter (getter only) returns the value as a formatted
Turtle document.

### Instance Events

A `change` event is fired whenever a user completes an interaction.

### Static Methods

To keep the interface _strict_, you will need to first canonicalize inputs to
the `.value` of the form. This is done to make strict equality checks more
useful.

The `UpperDoodle.valueFromObject(object)` allows you to get a canonical, string
value by passing in an instantiated JS object.

The `UpperDoodle.valueFromJSON(json)` allows you to get a canonical, string
value by passing in a JSON string.

## Technologies

### Excalifont

Excalifont is a custom handwritten font that gives the interface a sketch-like,
informal appearance. The font is designed to complement hand-drawn diagrams and
provides a cohesive visual aesthetic.

### Rough.js

Rough.js is a graphics library that creates graphics with a hand-drawn, sketchy
appearance. It’s used to render all visual elements in the authoring tool.

### Upper

Netflix’s Unified Data Architecture (UDA) uses a metamodel called Upper to
enable domain experts to _say what they mean and mean what they say_ in a clear
way. This tool allows users to make “doodles” that are then interpreted and
output as formal models leveraging Upper concepts.

## Installation

TODO!

## Development

TODO!
