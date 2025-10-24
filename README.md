# Upper Doodle

A sketch-based web component for visual authoring of Upper ontology models.

[doodle once, represent everywhere](https://netflixtechblog.com/uda-unified-data-architecture-6a6aee261d8d)

![Screenshot of a simple “onepiece” domain model.](/upper-doodle-example.png)

```turtle
@prefix onepiece: <https://github.com/theengineear/ns/onepiece#> .
@prefix rdf:      <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix upper:    <https://github.com/theengineear/ns/upper#> .
@prefix xsd:      <http://www.w3.org/2001/XMLSchema#> .

onepiece:
    a            upper:DomainModel ;
    upper:domain "onepiece" ;
.

onepiece:Character
    a                upper:DirectClass ;
    upper:primaryKey ( onepiece:rname ) ;
    upper:property   onepiece:devilFruit ;
    upper:property   onepiece:ename ;
    upper:property   onepiece:rname ;
.

onepiece:devilFruit
    a              upper:Relationship ;
    upper:class    onepiece:DevilFruit ;
    upper:minCount 0 ;
    upper:maxCount 1 ;
.

onepiece:DevilFruit
    a                upper:DirectClass ;
    upper:primaryKey ( onepiece:rname ) ;
    upper:property   onepiece:devilFruitType ;
    upper:property   onepiece:ename ;
    upper:property   onepiece:rname ;
.

onepiece:devilFruitType
    a              upper:Relationship ;
    upper:class    onepiece:DevilFruitType ;
    upper:minCount 1 ;
    upper:maxCount 1 ;
.

onepiece:DevilFruitType
    a           upper:Enumeration ;
    upper:oneOf ( onepiece:Paramecia onepiece:Logia onepiece:Zoan ) ;
.

onepiece:ename
    a              upper:Attribute ;
    upper:datatype xsd:string ;
    upper:minCount 1 ;
    upper:maxCount 1 ;
.

onepiece:Logia
    a upper:EnumValue ;
.

onepiece:Paramecia
    a upper:EnumValue ;
.

onepiece:rname
    a              upper:Attribute ;
    upper:datatype xsd:string ;
    upper:minCount 1 ;
    upper:maxCount 1 ;
.

onepiece:Zoan
    a upper:EnumValue ;
.
```

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

Diamonds represent classes in your domain model. The text inside a diamond
follows the pattern `<prefix>:<local-name> (<type-abbreviation>)`. If defining a
concept in the domain being authored, the `<prefix>` is optional.

The `<type-abbreviation>` is one of the following:

| Abbreviation | Meaning      | Description                            |
|--------------|--------------|----------------------------------------|
| `(DC)`       | Direct Class | A standard class in your domain        |
| `(SC)`       | Sealed Class | A class with a fixed set of subclasses |
| `(E)`        | Enumeration  | A closed set of values                 |
| `(V)`        | Enum Value   | A member of an enumeration             |

**Examples:**

- `Film (DC)` - A direct class representing films (optional prefix omitted)
- `Vehicle (SC)` - A sealed class hierarchy for vehicles (optional prefix omitted)
- `genre:Genre (E)` - An enumeration of genres
- `genre:Action (V)` - An enum value within the genre enumeration

### Arrow DSL

Arrows represent properties on classes. The meaning of an arrow depends on what
it connects:

- **Diamond → Rectangle**: An attribute with a datatype constraint
- **Diamond → Diamond**: A relationship between classes

The text on an arrow follows the pattern
`<prefix>:<local-name> (<min>..<max> <primary-key>)`. If defining a
concept in the domain being authored, the `<prefix>` is optional. The
`<primary-key>` is also optional — you only define it if the resulting attribute
is meant to participate in the primary key for the source class.

**Common cardinality patterns:**

| Pattern  | Meaning                   | Description                 |
|----------|---------------------------|-----------------------------|
| `(1..1)` | Required, single value    | Exactly one value required  |
| `(0..1)` | Optional, single value    | Zero or one value allowed   |
| `(0..n)` | Optional, multiple values | Zero or more values allowed |
| `(1..n)` | Required, multiple values | At least one value required |

**Examples:**
- `title (1..1)` - Every movie must have exactly one title
- `director (0..1)` - A movie may optionally have one director
- `actor (0..n)` - A movie can have zero or more actors
- `person:id (1..1 PK1)` - A person ID that serves as primary key

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

### Via npm

```bash
npm install upper-doodle
```

Then import the component in your JavaScript:

```js
import 'upper-doodle';
```

### Via CDN

You can also use the component directly from a CDN without any build step:

```html
<script type="module">
  import 'https://esm.sh/upper-doodle';
</script>
```

Or using unpkg:

```html
<script type="module">
  import 'https://unpkg.com/upper-doodle';
</script>
```

### Usage

Once imported, use the `<upper-doodle>` custom element in your HTML:

```html
<upper-doodle></upper-doodle>
```

See the [Example](#example) section above for more detailed usage.

## Development

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/theengineear/upper-doodle.git
cd upper-doodle
npm install
```

### Development Server

Start the local development server:

```bash
npm start
```

This runs a simple HTTP server on `http://localhost:3000`. Demo files are available
at `http://localhost:3000/demo/<filename>`.

### Commands

```bash
# Linting
npm run lint          # Run ESLint with zero warnings policy
npm run lint:fix      # Auto-fix linting issues

# Type checking and build
npm run types         # Generate TypeScript declarations from JSDoc
npm run build         # Alias for npm run types

# Testing
npm test              # Run all tests via Puppeteer

# Run specific tests by pattern
npm run test:puppeteer:chrome -- --test-name="pattern"
```

### Architecture

The project uses a monolithic web component architecture:

- **`src/upper-doodle.js`** - Main component with all state management and rendering
- **`src/utils/`** - Utility modules for coordinates, drawing, hit testing, RDF export
- **`src/vendor/`** - Vendored dependencies (rough.js)
- **`demo/`** - Demo HTML files showcasing features
- **`test/`** - Test suite using x-test framework

### Type System

The codebase uses JSDoc for TypeScript type annotations. Run `npm run types` to
generate declaration files in the `types/` directory.

### Contributing

1. Follow the existing code style
2. Maintain zero ESLint warnings
3. Add tests for new features
4. Update documentation as needed
