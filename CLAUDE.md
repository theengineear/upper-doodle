# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web component for visual authoring of UPPER (Unified Property-based Entity Representation) ontology models using a sketch-based interface. It combines Excalifont typography, Rough.js rendering, and Netflix's UPPER vocabulary to create an intuitive modeling experience.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Linting
npm run lint          # Run ESLint with zero warnings policy
npm run lint:fix      # Auto-fix linting issues

# Type checking and build
npm run types         # Generate TypeScript declarations from JSDoc
npm run build         # Alias for npm run types
```

## Architecture

### Component Structure

The project uses a **monolithic web component** with utility modules:

**Main Component:**
- **`upper-doodle.js`** (2,787 lines, ~80 methods) - Complete web component containing all state management, interaction handling, rendering orchestration, and DOM management in a single class

**Utility Modules** (`src/utils/`):
- **`coordinates.js`** - Coordinate space transformations (viewport ↔ world coordinates)
- **`drawing.js`** - Rough.js integration and SVG shape rendering
- **`hit.js`** - Hit testing for mouse interactions (point-in-shape detection)
- **`font.js`** - Excalifont loading and text measurement
- **`types.js`** - JSDoc type definitions
- **`triples.js`** - RDF N-Triples generation from diagram elements
- **`turtle.js`** - Turtle format serialization from N-Triples
- **`validate.js`** - Runtime validation utilities

**Vendor:**
- **`vendor/rough.esm.js`** - Vendored rough.js library for sketch-style rendering

### State Management

The UpperDoodle component maintains internal private state:
- `elements`: Object map of Element objects (keyed by UUID). Each element has: `id`, `type`, `x`, `y`, `width`, `height`, `stroke`, `fill`, `sw` (stroke width), `seed` (rough.js determinism), `text`
- `interaction`: Current interaction state (adding, moving, resizing, selecting, editing)
- `view`: View transform state (`viewX`, `viewY`, `viewK` for pan/zoom)
- Element IDs are UUIDs generated via `crypto.randomUUID()`

Elements can have negative width/height during creation; these are normalized when finalizing shapes.

### Drawing and Rendering

Uses rough.js (vendored) for sketch-style rendering. Key concepts:
- Each element has a `seed` property for deterministic rough.js rendering
- Settings control roughness, bowing, fillStyle, hachure patterns
- Supports rectangle, diamond (rotated rect), arrow, and text shapes
- Text is rendered as SVG text elements with Excalifont
- Selective invalidation system for performance (separate flags for world, content, UI, cursor, preview, edit)

### Arrow Binding System

Arrows can bind to shapes via `source` and `target` properties (element IDs). When bound, arrow endpoints snap to shape boundaries. The binding system:
- Detects shape proximity during arrow creation/editing
- Updates arrow positions when bound shapes move
- Handles unbinding when shapes are deleted

## Type System

The codebase uses **JSDoc for TypeScript type annotations**. Run `npm run types` to generate declaration files in the `types/` directory from JSDoc comments.

TypeScript config (`tsconfig.json`):
- Target: ES2022
- Module system: ES2022 with bundler resolution
- `allowJs: true` with `emitDeclarationOnly: true`
- Excludes: node_modules, demo, test, types, vendor

## Testing & Linting

### ESLint Configuration

Uses `@netflix/eslint-config` with flat config format (`eslint.config.js`):
- Zero warnings policy (`--max-warnings=0`)
- Ignores: `src/vendor/**`, `stash/**`
- Browser globals for src/demo/test files
- Node globals for server.js and config files

### Running Tests

Tests use the x-test framework and run via Puppeteer:

```bash
# Run all tests
npm test

# Run tests matching a specific pattern
npm run test:puppeteer:chrome -- --test-name="pattern"
```

**Filtering Tests:**

The `--test-name` flag accepts a regex pattern that matches against the full test name, including parent describe block names joined with spaces.

Examples:
```bash
# Run only copy-paste tests
npm run test:puppeteer:chrome -- --test-name="Copy & Paste"

# Run specific test within a suite
npm run test:puppeteer:chrome -- --test-name="preserves arrow bindings"

# Run multiple related tests using regex
npm run test:puppeteer:chrome -- --test-name="(copy|paste)"
```

**Note:** To temporarily focus on specific tests during development, you can comment out other test imports in `test/index.js`.

### Demo Files

Demo HTML files in `demo/` showcase individual features:
- `basic.html` - Basic component usage
- `rectangle.html`, `diamond.html` - Individual shape tools
- `arrow.html`, `arrow-binding.html` - Arrow functionality

Access demos via dev server at `http://localhost:3000/demo/<filename>`

## RDF/Turtle Export

The component includes integrated RDF export functionality via `utils/triples.js` and `utils/turtle.js`:

**Export Formats:**
- `canvas.export()` or `canvas.export('json')` - JSON representation of elements
- `canvas.export('n-triples')` - RDF N-Triples format
- `canvas.export('turtle')` - RDF Turtle format with prefixes

**Shape Semantics:**
- **Diamond** → `upper:DirectClass` (e.g., `movie:Movie`)
- **Rectangle** → XSD datatypes (e.g., `xsd:string`)
- **Text** → Raw RDF literals
- **Arrow** → Properties with cardinality (e.g., `hasTitle 1..1`)

**Supported Patterns:**
- Diamond → Rectangle: Attributes with datatype constraints
- Diamond → Diamond: Relationships between classes
- Diamond → Text: Literal values with language tags
- Text → Text: Raw RDF triples (subject, predicate, object)

**Prefix Resolution:**
- CURIEs are resolved using built-in prefixes (`rdf`, `upper`, `xsd`)
- Unknown prefixes auto-generate namespaces at `https://github.com/theengineear/onto/{prefix}#`
- **TODO:** Prefixes are currently hardcoded and need to be externalized

**Experimental Code:**
The `stash/` directory contains earlier prototypes:
- `excalidraw-to-triples.js` - Original Excalidraw integration (reference only)
- `generate-turtle.js` - Early Turtle generator (superseded by `utils/turtle.js`)

Note: Stash code is intentionally excluded from linting.

## Development Server

Simple Node.js HTTP server (`server.js`):
- Serves static files with proper MIME types
- SPA-style fallback to index.html for routes without extensions
- Supports Turtle format (`.ttl` → `text/turtle`)

## Key Dependencies

- **rough.js** (vendored) - Hand-drawn graphics library
- **Excalifont** - Handwritten font (referenced in CSS)
- **@netflix/eslint-config** - Netflix ESLint standards
- **globals** - Global variable definitions for ESLint
- **typescript** - Type checking from JSDoc

## Component API

```javascript
// Get reference to component
const canvas = document.querySelector('upper-doodle');

// Export diagram in different formats
const jsonData = canvas.export();              // or canvas.export('json')
const nTriples = canvas.export('n-triples');   // RDF N-Triples
const turtle = canvas.export('turtle');        // RDF Turtle with prefixes

// Import diagram from JSON
canvas.import(jsonData);

// Clear canvas
canvas.import('[]');

// Trigger resize recalculation
canvas.resize();
```

Component attributes:
- `width`, `height` - Canvas dimensions
- `toolbar` - Toolbar style (e.g., "embedded")
- `tools` - Available tools (comma-separated)
- `theme` - Visual theme ("light" or "dark")