import rough from '../vendor/rough.esm.js';
import { Validate } from './validate.js';

/**
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Elements} Elements
 * @typedef {import('./types.js').Tree} Tree
 */

/**
 * Drawing utilities for rendering elements with rough.js
 */
export class Drawing {
  /** Padding around text for background rectangles and bounding boxes (in pixels) */
  static #TEXT_PADDING = 8;

  /** Minimum shape dimensions to prevent rough.js errors (in pixels) */
  static #MIN_SHAPE_SIZE = 8;

  /**
   * Generate a simple numeric hash from a UUID string for use as rough.js seed
   * @param {string} uuid - UUID string
   * @returns {number} Hash value
   */
  static #hashUUID(uuid) {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = ((hash << 5) - hash) + char;
      // eslint-disable-next-line no-bitwise
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if a shape element is external (different domain prefix)
   * @param {Element} element - Element to check
   * @param {string} domain - Current domain
   * @returns {boolean} True if element is external
   */
  static #isExternal(element, domain) {
    // Only diamonds and rectangles can be external
    if (element.type !== 'diamond' && element.type !== 'rectangle') {
      return false;
    }

    // Extract prefix from element text (everything before the colon)
    const text = element.text || '';
    const colonIndex = text.indexOf(':');

    if (colonIndex === -1) {
      // No colon means no prefix, not external
      return false;
    }

    const prefix = text.substring(0, colonIndex).trim();
    return prefix !== domain;
  }

  /**
   * Check if only position/size changed (common during dragging)
   * @param {Element} element - New element state
   * @param {Element} prevElement - Previous element state
   * @returns {boolean} True if only geometry changed
   */
  static #isGeometryOnlyChange(element, prevElement) {
    if (element.type !== prevElement.type) {
      return false;
    }

    // Check all non-geometry properties
    if (element.type !== 'tree' && prevElement.type !== 'tree' && element.text !== prevElement.text) {
      return false;
    }

    // Use switch for better type narrowing
    // After checking types are equal, both element and prevElement narrow together
    switch (element.type) {
      case 'arrow':
        // TypeScript now knows both are Arrow type
        if (prevElement.type !== 'arrow') {
          return false; // Type guard for prevElement
        }
        // Arrows have source and target binding
        if (element.source !== prevElement.source) {
          return false;
        }
        if (element.target !== prevElement.target) {
          return false;
        }
        break;

      case 'text':
        // TypeScript now knows both are Text type
        if (prevElement.type !== 'text') {
          return false; // Type guard for prevElement
        }
        break;

      case 'rectangle':
      case 'diamond':
        // TypeScript knows element is a shape, need to narrow prevElement too
        if (prevElement.type !== element.type) {
          return false; // Type guard for prevElement
        }
        break;

      case 'tree':
        // Trees always require full re-render (complex structure with items)
        if (prevElement.type !== 'tree') {
          return false; // Type guard for prevElement
        }
        return false;

      default:
        return Validate.unreachable(element);
    }

    return true;
  }

  /**
   * Get bounding box from element coordinates
   * @param {SVGSVGElement | null} svg - SVG element for accurate text measurement (null for approximate measurement)
   * @param {Element} element - Element with coordinates
   * @returns {{x: number, y: number, width: number, height: number}} Bounding box with positive dimensions
   */
  static getBoundingBox(svg, element) {
    switch (element.type) {
      case 'arrow':
        return Drawing.#getArrowBoundingBox(element);
      case 'text':
        return Drawing.#getTextBoundingBox(element, svg);
      case 'rectangle':
      case 'diamond':
        return Drawing.#getShapeBoundingBox(element);
      case 'tree':
        // Trees don't have a simple bounding box - return placeholder
        // TODO: Calculate from tree items
        return { x: 0, y: 0, width: 0, height: 0 };
      default:
        return Validate.unreachable(element);
    }
  }

  /**
   * Draw element based on type (rectangle, diamond, arrow, text, tree)
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {Element} element - Element to draw
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
   * @param {string} domain - Current domain for checking external elements
   * @param {Elements} elements - All elements (needed for tree rendering)
   * @returns {SVGElement} The drawn SVG element
   */
  static drawElement(svg, element, ignored, raw, invalid, keyed, domain, elements = {}) {
    switch (element.type) {
      case 'rectangle':
        return Drawing.#drawRectangle(svg, element, ignored, raw, invalid, domain);
      case 'diamond':
        return Drawing.#drawDiamond(svg, element, ignored, raw, invalid, keyed, domain);
      case 'arrow':
        return Drawing.#drawArrow(svg, element, ignored, raw, invalid, domain);
      case 'text':
        return Drawing.#drawText(element, ignored, raw, invalid, domain);
      case 'tree':
        return Drawing.#drawTree(svg, element, ignored, raw, invalid, domain, elements);
      default:
        return Validate.unreachable(element);
    }
  }

  /**
   * Update an existing element in place (helper for incremental rendering)
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {Element} element - Element to update
   * @param {Element} prevElement - Previous element state
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
   * @param {string} domain - Current domain for checking external elements
   * @param {Elements} elements - All elements (needed for tree rendering)
   */
  static updateElement(svg, element, prevElement, ignored, raw, invalid, keyed, domain, elements = {}) {
    // Note: Element type never changes for a given ID (immutable state)

    // Fast path: if only geometry changed, we can skip recreating the DOM
    const geometryOnly = Drawing.#isGeometryOnlyChange(element, prevElement);

    if (geometryOnly) {
      // Only position/size changed - update transforms/positions in place
      // This is common during dragging and avoids expensive DOM recreation

      // For now, we still recreate elements because updating rough.js paths
      // in place is complex. This check is here for future optimization.
      // A more sophisticated approach would cache the rough.js seed and
      // regenerate paths with updated coordinates.
    }

    // Full update: recreate elements
    // We recreate rather than mutating attributes because rough.js
    // generates complex SVG paths that are difficult to update incrementally

    // Replace element in content layer
    const newNode = Drawing.drawElement(svg, element, ignored, raw, invalid, keyed, domain, elements);
    newNode.setAttribute('data-id', element.id);

    const oldNode = svg.querySelector(`[data-id="${element.id}"]`);
    if (oldNode) {
      oldNode.replaceWith(newNode);
    }
  }

  /**
   * Draw selection UI for an element
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {Element} element - Element to draw selection for
   * @returns {{handleTail?: SVGElement, handleHead?: SVGElement, outline?: SVGElement, handleNw?: SVGElement, handleNe?: SVGElement, handleSe?: SVGElement, handleSw?: SVGElement}} Selection UI elements
   */
  static drawSelection(svg, element) {
    if (element.type === 'arrow') {
      // Draw circles at tail and head using simple SVG circle elements
      const tailDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      tailDot.setAttribute('cx', String(element.x1));
      tailDot.setAttribute('cy', String(element.y1));
      tailDot.setAttribute('r', '4');
      tailDot.setAttribute('class', 'handle');
      tailDot.setAttribute('data-handle', 'tail');

      const headDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      headDot.setAttribute('cx', String(element.x2));
      headDot.setAttribute('cy', String(element.y2));
      headDot.setAttribute('r', '4');
      headDot.setAttribute('class', 'handle');
      headDot.setAttribute('data-handle', 'head');

      return {
        handleTail: tailDot,
        handleHead: headDot,
      };
    } else if (element.type === 'text') {
      // Text elements show outline but no resize handles
      const bbox = Drawing.getBoundingBox(svg, element);

      const selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selectionRect.setAttribute('x', String(bbox.x + 4));
      selectionRect.setAttribute('y', String(bbox.y + 4));
      selectionRect.setAttribute('width', String(Math.max(1, bbox.width - 8)));
      selectionRect.setAttribute('height', String(Math.max(1, bbox.height - 8)));
      selectionRect.setAttribute('rx', '4');
      selectionRect.setAttribute('ry', '4');
      selectionRect.setAttribute('class', 'outline');

      return {
        outline: selectionRect,
      };
    } else {
      // Draw selection box and corner handles
      const bbox = Drawing.getBoundingBox(svg, element);

      // Create outline inset by 4px from logical bounding box
      // Ensure minimum dimensions to prevent negative values
      const selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selectionRect.setAttribute('x', String(bbox.x + 4));
      selectionRect.setAttribute('y', String(bbox.y + 4));
      selectionRect.setAttribute('width', String(Math.max(1, bbox.width - 8)));
      selectionRect.setAttribute('height', String(Math.max(1, bbox.height - 8)));
      selectionRect.setAttribute('rx', '4');
      selectionRect.setAttribute('ry', '4');
      selectionRect.setAttribute('class', 'outline');

      // Draw corner handles at outline corners (inset by 4px)
      const corners = [
        { x: bbox.x + 4, y: bbox.y + 4, name: 'handleNw', handle: 'nw' },
        { x: bbox.x + bbox.width - 4, y: bbox.y + 4, name: 'handleNe', handle: 'ne' },
        { x: bbox.x + bbox.width - 4, y: bbox.y + bbox.height - 4, name: 'handleSe', handle: 'se' },
        { x: bbox.x + 4, y: bbox.y + bbox.height - 4, name: 'handleSw', handle: 'sw' },
      ];

      /** @type {Record<string, SVGElement>} */
      const handles = {};
      for (const corner of corners) {
        const cornerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cornerDot.setAttribute('cx', String(corner.x));
        cornerDot.setAttribute('cy', String(corner.y));
        cornerDot.setAttribute('r', '4');
        cornerDot.setAttribute('class', 'handle');
        cornerDot.setAttribute('data-handle', corner.handle);

        handles[corner.name] = cornerDot;
      }

      return {
        outline: selectionRect,
        ...handles,
      };
    }
  }

  /**
   * Draw binding indicator (dashed box around bindable element)
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {Element} element - Element to draw binding indicator for
   * @returns {SVGElement} Binding indicator element
   */
  static drawBindingIndicator(svg, element) {
    const bbox = Drawing.getBoundingBox(svg, element);

    // Draw dashed black outline inset by 4px from logical bounding box
    // Ensure minimum dimensions to prevent negative values
    const bindingRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bindingRect.setAttribute('x', String(bbox.x + 4));
    bindingRect.setAttribute('y', String(bbox.y + 4));
    bindingRect.setAttribute('width', String(Math.max(1, bbox.width - 8)));
    bindingRect.setAttribute('height', String(Math.max(1, bbox.height - 8)));
    bindingRect.setAttribute('rx', '4');
    bindingRect.setAttribute('ry', '4');
    bindingRect.setAttribute('class', 'binding-indicator');

    return bindingRect;
  }

  /**
   * Create label text element (for embedding in shape groups)
   * @param {SVGSVGElement} svg - SVG element for measuring (needed for getBBox)
   * @param {Element} element - Element to label
   * @returns {SVGGElement} Group element with class="label" containing text (and optional background rect for arrows)
   */
  static #createLabelText(svg, element) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'label');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const bbox = Drawing.getBoundingBox(svg, element);

    // Set position attributes (not handled by CSS)
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));

    // Split text by newlines and create tspan for each line
    const textContent = element.type === 'tree' ? '' : (element.text || '');
    const lines = textContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      // Use non-breaking space for empty lines to preserve vertical spacing
      tspan.textContent = lines[i] || '\u00A0';
      tspan.setAttribute('x', String(x));

      if (i === 0) {
        tspan.setAttribute('dy', '0');
      } else {
        tspan.setAttribute('dy', '1.2em');
      }

      text.appendChild(tspan);
    }

    // Only add background rectangle for arrow labels
    if (element.type === 'arrow') {
      // Set data attributes before measuring for proper CSS styling
      group.setAttribute('data-type', 'arrow');

      // Find #content element for proper CSS context
      const content = svg.querySelector('#content') || svg;

      // Append text and group temporarily to content to measure it with proper styling
      group.appendChild(text);
      content.appendChild(group);
      const textBBox = text.getBBox();
      content.removeChild(group);

      // Remove temporary data attributes (will be set on wrapper later)
      group.removeAttribute('data-type');

      // Create background rectangle with padding
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(textBBox.x - Drawing.#TEXT_PADDING));
      bgRect.setAttribute('y', String(textBBox.y - Drawing.#TEXT_PADDING));
      bgRect.setAttribute('width', String(textBBox.width + Drawing.#TEXT_PADDING * 2));
      bgRect.setAttribute('height', String(textBBox.height + Drawing.#TEXT_PADDING * 2));
      bgRect.setAttribute('rx', '4');
      bgRect.setAttribute('ry', '4');

      // Insert background before text
      group.insertBefore(bgRect, text);
    } else {
      // For non-arrow labels, just add the text
      group.appendChild(text);
    }

    return group;
  }

  /**
   * Create text label for element (deprecated - used only during preview)
   * @param {Element} element - Element to label
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @returns {SVGGElement} Group element containing text (and background rect for arrows)
   * @deprecated Use #createLabelText instead
   */
  static createLabel(element, ignored, invalid) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const bbox = Drawing.getBoundingBox(null, element);

    // Set position attributes (not handled by CSS)
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));

    // Split text by newlines and create tspan for each line
    const textContent = element.type === 'tree' ? '' : (element.text || '');
    const lines = textContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      // Use non-breaking space for empty lines to preserve vertical spacing
      tspan.textContent = lines[i] || '\u00A0';
      tspan.setAttribute('x', String(x));

      if (i === 0) {
        tspan.setAttribute('dy', '0');
      } else {
        tspan.setAttribute('dy', '1.2em');
      }

      text.appendChild(tspan);
    }

    group.setAttribute('data-id', element.id);

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(element.id);
    if (isInvalid) {
      group.setAttribute('data-invalid', '');
    }

    // Only add background rectangle for arrow labels
    if (element.type === 'arrow') {
      // Append text temporarily to measure it
      group.appendChild(text);
      const textBBox = text.getBBox();

      // Create background rectangle with padding
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(textBBox.x - Drawing.#TEXT_PADDING));
      bgRect.setAttribute('y', String(textBBox.y - Drawing.#TEXT_PADDING));
      bgRect.setAttribute('width', String(textBBox.width + Drawing.#TEXT_PADDING * 2));
      bgRect.setAttribute('height', String(textBBox.height + Drawing.#TEXT_PADDING * 2));
      bgRect.setAttribute('rx', '4');
      bgRect.setAttribute('ry', '4');

      // Insert background before text
      group.insertBefore(bgRect, text);
    } else {
      // For non-arrow labels, just add the text
      group.appendChild(text);
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(element.id);
    if (isIgnored) {
      group.setAttribute('data-ignored', '');
    }

    return group;
  }

  // Private helper methods

  /**
   * Get bounding box for arrow element
   * @param {import('./types.js').Arrow} element - Arrow element with x1/y1/x2/y2
   * @returns {{x: number, y: number, width: number, height: number}} Bounding box
   */
  static #getArrowBoundingBox(element) {
    return {
      x: Math.min(element.x1, element.x2),
      y: Math.min(element.y1, element.y2),
      width: Math.abs(element.x2 - element.x1),
      height: Math.abs(element.y2 - element.y1),
    };
  }

  /**
   * Get bounding box for text element
   * @param {import('./types.js').Text} element - Text element with x/y
   * @param {SVGSVGElement | null} svg - SVG element for measuring text (null for approximate)
   * @returns {{x: number, y: number, width: number, height: number}} Bounding box
   */
  static #getTextBoundingBox(element, svg) {
    // If svg is provided, render and measure the actual text
    if (svg) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      // Position text at element coordinates
      const x = element.x;
      const y = element.y;
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y));

      

      // Split text by newlines and create tspan for each line
      const lines = (element.text || '').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        // Use non-breaking space for empty lines to preserve vertical spacing
        tspan.textContent = lines[i] || '\u00A0';
        tspan.setAttribute('x', String(x));

        if (i === 0) {
          tspan.setAttribute('dy', '0');
        } else {
          tspan.setAttribute('dy', '1.2em');
        }

        text.appendChild(tspan);
      }

      // Set data attribute for styling
      group.setAttribute('data-type', 'text');

      // Find #content element inside svg (if it exists) for proper CSS styling
      // CSS selector is "#content [data-type="text"]" so we need to append to content
      const content = svg.querySelector('#content') || svg;

      // Temporarily attach to content to measure text with proper styling
      group.appendChild(text);
      content.appendChild(group);
      const textBBox = text.getBBox();
      content.removeChild(group);

      // Add padding to bounding box for hit detection and selection outline
      // (even though text elements don't have background rectangles, they need clickable area)
      return {
        x: textBBox.x - Drawing.#TEXT_PADDING,
        y: textBBox.y - Drawing.#TEXT_PADDING,
        width: textBBox.width + Drawing.#TEXT_PADDING * 2,
        height: textBBox.height + Drawing.#TEXT_PADDING * 2,
      };
    }

    // Fallback: use default text size if svg not provided
    const defaultTextSize = 14;
    const estimatedHeight = defaultTextSize * 1.5; // Line height approximation

    // Estimate width from text content
    let width;
    if (element.text) {
      // Approximate character width as 0.5 * fontSize for variable-width fonts
      width = element.text.length * defaultTextSize * 0.5;
    }

    return {
      x: element.x,
      y: element.y,
      width: width || 200, // Default to 200 if no width and no text
      height: estimatedHeight,
    };
  }

  /**
   * Get bounding box for shape element (rectangle, diamond)
   * @param {import('./types.js').Rectangle | import('./types.js').Diamond} element - Shape element with x/y/w/h
   * @returns {{x: number, y: number, width: number, height: number}} Bounding box with positive dimensions
   */
  static #getShapeBoundingBox(element) {
    // Normalize to positive dimensions
    return {
      x: element.width >= 0 ? element.x : element.x + element.width,
      y: element.height >= 0 ? element.y : element.y + element.height,
      width: Math.abs(element.width),
      height: Math.abs(element.height),
    };
  }

  /**
   * Create rounded rectangle path
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {string} SVG path string
   */
  static createRoundedRectPath(x, y, width, height) {
    const r = Math.min(12, Math.min(width, height) / 2);
    const x1 = x + width;
    const y1 = y + height;

    return [
      'M', x + r, y,
      'L', x1 - r, y,
      'A', r, r, 0, 0, 1, x1, y + r,
      'L', x1, y1 - r,
      'A', r, r, 0, 0, 1, x1 - r, y1,
      'L', x + r, y1,
      'A', r, r, 0, 0, 1, x, y1 - r,
      'L', x, y + r,
      'A', r, r, 0, 0, 1, x + r, y,
      'Z',
    ].join(' ');
  }

    /**
   * Create circle path using SVG arc commands
   * @param {number} cx - Center x coordinate
   * @param {number} cy - Center y coordinate
   * @param {number} diameter - Circle diameter
   * @returns {string} SVG path string
   */
  static createCirclePath(cx, cy, diameter) {
    const r = diameter / 2;

    // Create circle using arc commands
    return [
      'M', cx - r, cy,
      'A', r, r, 0, 0, 1, cx, cy - r,
      'A', r, r, 0, 0, 1, cx + r, cy,
      'A', r, r, 0, 0, 1, cx, cy + r,
      'A', r, r, 0, 0, 1, cx - r, cy,
      'Z',
    ].join(' ');
  }

  /**
   * Create arrow path with arrowhead
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {number} headLength - Arrowhead length
   * @returns {string} SVG path string
   */
  static #createArrowPath(x1, y1, x2, y2, headLength = 16) {
    // Straight line shaft
    const shaftPath = `M ${x1} ${y1} L ${x2} ${y2}`;
    const endAngle = Math.atan2(y2 - y1, x2 - x1);

    const headAngle = Math.PI / 6; // 30 degrees

    // Calculate arrowhead points
    const headPoint1X = x2 - headLength * Math.cos(endAngle - headAngle);
    const headPoint1Y = y2 - headLength * Math.sin(endAngle - headAngle);
    const headPoint2X = x2 - headLength * Math.cos(endAngle + headAngle);
    const headPoint2Y = y2 - headLength * Math.sin(endAngle + headAngle);

    // Create path: straight shaft + arrowhead
    return [
      shaftPath,
      'M', headPoint1X, headPoint1Y,
      'L', x2, y2,
      'L', headPoint2X, headPoint2Y,
    ].join(' ');
  }

  /**
   * Normalize a vector to unit length
   * @param {{x: number, y: number}} vector - Vector to normalize
   * @returns {{x: number, y: number}} Normalized vector
   */
  static #normalize(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / length, y: vector.y / length };
  }

  /**
   * Create rounded diamond path
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} w - Width
   * @param {number} h - Height
   * @returns {string} SVG path string
   */
  static #createRoundedDiamondPath(x, y, w, h) {
    const r = 12;
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Diamond points at cardinal directions (top, right, bottom, left)
    const top = { x: cx, y: y };
    const right = { x: x + w, y: cy };
    const bottom = { x: cx, y: y + h };
    const left = { x: x, y: cy };

    // Calculate rounded corners - use a larger inset to ensure smooth arcs
    const maxRadius = Math.min(w, h) * 0.45;
    const radius = Math.min(r, maxRadius);

    // Calculate edge lengths
    const edgeLength = Math.hypot(right.x - top.x, right.y - top.y);

    // Calculate inset distance from corners
    const inset = Math.min(radius * 1.4142, edgeLength * 0.45); // sqrt(2) * radius for proper diamond geometry

    // Calculate inset points along each edge from each corner
    const topToRight = Drawing.#normalize({ x: right.x - top.x, y: right.y - top.y });
    const rightToBottom = Drawing.#normalize({ x: bottom.x - right.x, y: bottom.y - right.y });
    const bottomToLeft = Drawing.#normalize({ x: left.x - bottom.x, y: left.y - bottom.y });
    const leftToTop = Drawing.#normalize({ x: top.x - left.x, y: top.y - left.y });

    // Points along edges before and after corners
    const p1 = { x: top.x + topToRight.x * inset, y: top.y + topToRight.y * inset };
    const p2 = { x: right.x - topToRight.x * inset, y: right.y - topToRight.y * inset };

    const p3 = { x: right.x + rightToBottom.x * inset, y: right.y + rightToBottom.y * inset };
    const p4 = { x: bottom.x - rightToBottom.x * inset, y: bottom.y - rightToBottom.y * inset };

    const p5 = { x: bottom.x + bottomToLeft.x * inset, y: bottom.y + bottomToLeft.y * inset };
    const p6 = { x: left.x - bottomToLeft.x * inset, y: left.y - bottomToLeft.y * inset };

    const p7 = { x: left.x + leftToTop.x * inset, y: left.y + leftToTop.y * inset };
    const p8 = { x: top.x - leftToTop.x * inset, y: top.y - leftToTop.y * inset };

    return [
      'M', p1.x, p1.y,
      'L', p2.x, p2.y,
      'Q', right.x, right.y, p3.x, p3.y,
      'L', p4.x, p4.y,
      'Q', bottom.x, bottom.y, p5.x, p5.y,
      'L', p6.x, p6.y,
      'Q', left.x, left.y, p7.x, p7.y,
      'L', p8.x, p8.y,
      'Q', top.x, top.y, p1.x, p1.y,
      'Z',
    ].join(' ');
  }

  /**
   * Draw rectangle element
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {import('./types.js').Rectangle} element - Rectangle element
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {string} domain - Current domain for checking external elements
   * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
   */
  static #drawRectangle(svg, element, ignored, raw, invalid, domain) {
    const rc = rough.svg(svg);
    const bbox = Drawing.getBoundingBox(svg, element);

    const roughOptions = {
      seed: Drawing.#hashUUID(element.id),
      roughness: 1.2,
      bowing: 0.7,
      stroke: '#000',  // Default, will be overridden by CSS
      strokeWidth: 2,  // Default, will be overridden by CSS
      fill: 'none',
      preserveVertices: true,
    };

    // Inset shape by 8px from logical bounding box, but ensure minimum dimensions
    const shapeWidth = Math.max(Drawing.#MIN_SHAPE_SIZE, bbox.width - 16);
    const shapeHeight = Math.max(Drawing.#MIN_SHAPE_SIZE, bbox.height - 16);
    const path = Drawing.createRoundedRectPath(bbox.x + 8, bbox.y + 8, shapeWidth, shapeHeight);
    const shapeGroup = rc.path(path, roughOptions);

    // Add rough class to shape group
    shapeGroup.setAttribute('class', 'rough');

    // Remove rough.js attributes from path element (CSS will handle styling)
    const pathElement = shapeGroup.querySelector('path');
    if (pathElement) {
      pathElement.removeAttribute('stroke');
      pathElement.removeAttribute('stroke-width');
      pathElement.removeAttribute('fill');
    }

    // Create wrapper group to hold shape and optional label
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set data attributes on wrapper
    wrapper.setAttribute('data-type', 'rectangle');

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(element.id);
    if (isInvalid) {
      wrapper.setAttribute('data-invalid', '');
    }

    // Apply raw attribute if needed
    const isRaw = raw.has(element.id);
    if (isRaw) {
      wrapper.setAttribute('data-raw', '');
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(element.id);
    if (isIgnored) {
      wrapper.setAttribute('data-ignored', '');
    }

    // Apply external attribute if needed
    const isExternal = Drawing.#isExternal(element, domain);
    if (isExternal) {
      wrapper.setAttribute('data-external', '');
    }

    wrapper.appendChild(shapeGroup);

    // Add label if element has text
    if (element.text) {
      const label = Drawing.#createLabelText(svg, element);
      wrapper.appendChild(label);
    }

    return wrapper;
  }

    /**
   * Draw diamond element
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {import('./types.js').Diamond} element - Diamond element
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {Set<string>} keyed - Set of diamond IDs that have primary keys
   * @param {string} domain - Current domain for checking external elements
   * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
   */
  static #drawDiamond(svg, element, ignored, raw, invalid, keyed, domain) {
    const rc = rough.svg(svg);
    const bbox = Drawing.getBoundingBox(svg, element);

    const roughOptions = {
      seed: Drawing.#hashUUID(element.id),
      roughness: 1.2,
      bowing: 0.7,
      stroke: '#000',  // Default, will be overridden by CSS
      strokeWidth: 2,  // Default, will be overridden by CSS
      fill: 'none',
      preserveVertices: true,
    };

    // Inset shape by 8px from logical bounding box, but ensure minimum dimensions
    const shapeWidth = Math.max(Drawing.#MIN_SHAPE_SIZE, bbox.width - 16);
    const shapeHeight = Math.max(Drawing.#MIN_SHAPE_SIZE, bbox.height - 16);
    const path = Drawing.#createRoundedDiamondPath(bbox.x + 8, bbox.y + 8, shapeWidth, shapeHeight);
    const shapeGroup = rc.path(path, roughOptions);

    // Add rough class to shape group
    shapeGroup.setAttribute('class', 'rough');

    // Remove rough.js attributes from path element (CSS will handle styling)
    const pathElement = shapeGroup.querySelector('path');
    if (pathElement) {
      pathElement.removeAttribute('stroke');
      pathElement.removeAttribute('stroke-width');
      pathElement.removeAttribute('fill');
    }

    // Create wrapper group to hold shape and optional label
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set data attributes on wrapper
    wrapper.setAttribute('data-type', 'diamond');

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(element.id);
    if (isInvalid) {
      wrapper.setAttribute('data-invalid', '');
    }

    // Apply raw attribute if needed
    const isRaw = raw.has(element.id);
    if (isRaw) {
      wrapper.setAttribute('data-raw', '');
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(element.id);
    if (isIgnored) {
      wrapper.setAttribute('data-ignored', '');
    }

    // Apply external attribute if needed
    const isExternal = Drawing.#isExternal(element, domain);
    if (isExternal) {
      wrapper.setAttribute('data-external', '');
    }

    // Apply keyed attribute if needed
    const isKeyed = keyed.has(element.id);
    if (isKeyed) {
      wrapper.setAttribute('data-keyed', '');
    }

    wrapper.appendChild(shapeGroup);

    // Add label if element has text
    if (element.text) {
      // Prepend key icon if diamond has primary keys
      const labelText = isKeyed ? `🔑 ${element.text}` : element.text;
      const elementWithModifiedText = { ...element, text: labelText };
      const label = Drawing.#createLabelText(svg, elementWithModifiedText);
      wrapper.appendChild(label);
    }

    return wrapper;
  }

  /**
   * Draw arrow element
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {import('./types.js').Arrow} element - Arrow element with x1, y1, x2, y2
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {string} _domain - Current domain for checking external elements (unused for arrows)
   * @returns {SVGElement} The drawn SVG element (group containing shape and optional label)
   */
  // eslint-disable-next-line no-unused-vars
  static #drawArrow(svg, element, ignored, raw, invalid, _domain) {
    const rc = rough.svg(svg);

    const roughOptions = {
      seed: Drawing.#hashUUID(element.id),
      roughness: 1.2,
      bowing: 0.7,
      stroke: '#000',  // Default, will be overridden by CSS
      strokeWidth: 2,  // Default, will be overridden by CSS
      fill: 'none',
      preserveVertices: true,
    };

    const path = Drawing.#createArrowPath(element.x1, element.y1, element.x2, element.y2, 16);
    const shapeGroup = rc.path(path, roughOptions);

    // Add rough class to shape group
    shapeGroup.setAttribute('class', 'rough');

    // Remove rough.js attributes from path element (CSS will handle styling)
    const pathElement = shapeGroup.querySelector('path');
    if (pathElement) {
      pathElement.removeAttribute('stroke');
      pathElement.removeAttribute('stroke-width');
      pathElement.removeAttribute('fill');
    }

    // Create wrapper group to hold shape and optional label
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Set data attributes on wrapper
    wrapper.setAttribute('data-type', 'arrow');

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(element.id);
    if (isInvalid) {
      wrapper.setAttribute('data-invalid', '');
    }

    // Apply raw attribute if needed
    const isRaw = raw.has(element.id);
    if (isRaw) {
      wrapper.setAttribute('data-raw', '');
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(element.id);
    if (isIgnored) {
      wrapper.setAttribute('data-ignored', '');
    }

    wrapper.appendChild(shapeGroup);

    // Add label if element has text
    if (element.text) {
      const label = Drawing.#createLabelText(svg, element);
      wrapper.appendChild(label);
    }

    return wrapper;
  }

  /**
   * Draw text element
   * @param {import('./types.js').Text} element - Text element to draw
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} raw - Set of raw element IDs
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {string} _domain - Current domain for checking external elements (unused for text)
   * @returns {SVGGElement} Group element containing background rect and text
   */
  // eslint-disable-next-line no-unused-vars
  static #drawText(element, ignored, raw, invalid, _domain) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    // Position text at element coordinates
    const x = element.x;
    const y = element.y;
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));



    // Split text by newlines and create tspan for each line
    const textContent = element.text || '';
    const lines = textContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      // Use non-breaking space for empty lines to preserve vertical spacing
      tspan.textContent = lines[i] || '\u00A0';
      tspan.setAttribute('x', String(x));

      if (i === 0) {
        tspan.setAttribute('dy', '0');
      } else {
        tspan.setAttribute('dy', '1.2em');
      }

      text.appendChild(tspan);
    }

    group.setAttribute('data-id', element.id);
    group.setAttribute('data-type', 'text');

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(element.id);
    if (isInvalid) {
      group.setAttribute('data-invalid', '');
    }

    // Apply raw attribute if needed
    const isRaw = raw.has(element.id);
    if (isRaw) {
      group.setAttribute('data-raw', '');
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(element.id);
    if (isIgnored) {
      group.setAttribute('data-ignored', '');
    }

    // Add text to group (no background rectangle for text elements)
    group.appendChild(text);

    return group;
  }

  /**
   * Draw tree branch lines connecting parent to children
   * @param {SVGSVGElement} svg - SVG element to draw on
   * @param {Tree} tree - Tree element to draw
   * @param {Set<string>} ignored - Set of ignored element IDs
   * @param {Set<string>} _raw - Set of raw element IDs (unused for trees)
   * @param {Set<string>} invalid - Set of invalid element IDs
   * @param {string} _domain - Current domain for checking external elements (unused for trees)
   * @param {Elements} elements - All elements in diagram
   * @returns {SVGElement} Group containing tree branch paths
   */
  static #drawTree(svg, tree, ignored, _raw, invalid, _domain, elements) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-type', 'tree');

    // Apply invalid attribute if needed
    const isInvalid = invalid.has(tree.id);
    if (isInvalid) {
      group.setAttribute('data-invalid', '');
    }

    // Apply ignored attribute if needed
    const isIgnored = ignored.has(tree.id);
    if (isIgnored) {
      group.setAttribute('data-ignored', '');
    }

    const root = elements[tree.root];
    if (!root) {
      return group; // Return empty group if root not found
    }

    // Group items by parent to identify levels
    const itemsByParent = new Map();
    for (const item of tree.items) {
      if (!itemsByParent.has(item.parent)) {
        itemsByParent.set(item.parent, []);
      }
      itemsByParent.get(item.parent).push(item.element);
    }

    // Generate one path per inter-column connection (breadth-first by level)
    const rc = rough.svg(svg);
    const processedParents = new Set();
    const queue = [tree.root]; // Start with root

    while (queue.length > 0) {
      const parentId = queue.shift();
      if (!parentId) {
        continue;
      }

      if (processedParents.has(parentId)) {
        continue; // Already processed
      }
      processedParents.add(parentId);

      const children = itemsByParent.get(parentId) || [];
      if (children.length === 0) {
        continue; // No children to draw branches for
      }

      // Calculate branch path for this parent → children connection
      const parentEl = elements[parentId];
      if (!parentEl) {
        continue;
      }

      // Type guard: tree items should be shapes (diamond or rectangle)
      if (parentEl.type !== 'diamond' && parentEl.type !== 'rectangle') {
        continue;
      }

      // Parent right-center
      const parentX = parentEl.x + parentEl.width;
      const parentY = parentEl.y + parentEl.height / 2;

      // Collect all valid children and their Y positions
      const validChildren = [];
      for (const childId of children) {
        const childEl = elements[childId];
        if (!childEl) {
          continue;
        }

        // Type guard: tree items should be shapes (diamond or rectangle)
        if (childEl.type !== 'diamond' && childEl.type !== 'rectangle') {
          continue;
        }

        validChildren.push({
          id: childId,
          element: childEl,
          x: childEl.x,
          y: childEl.y + childEl.height / 2, // center Y
        });

        // Add child to queue for next level processing
        queue.push(childId);
      }

      if (validChildren.length === 0) {
        continue;
      }

      // Build path: vertical line connecting all branches, then horizontal lines to each child
      let pathData = '';

      if (validChildren.length === 1) {
        // Single child: just draw horizontal line from parent to child
        const child = validChildren[0];
        pathData += ` M ${parentX} ${parentY} L ${child.x} ${child.y}`;
      } else {
        // Multiple children: draw vertical line, then horizontal branches
        // Calculate Y range for vertical line
        const childYs = validChildren.map(c => c.y);
        const minY = Math.min(...childYs);
        const maxY = Math.max(...childYs);

        // Draw horizontal line from parent to branch point
        const branchX = parentX + 20; // Branch point 20px to the right of parent

        // Draw line from parent to branch point
        pathData += ` M ${parentX} ${parentY} L ${branchX} ${parentY}`;

        // Draw vertical line spanning all children
        pathData += ` M ${branchX} ${minY} L ${branchX} ${maxY}`;

        // Draw horizontal lines from branch point to each child
        for (const child of validChildren) {
          pathData += ` M ${branchX} ${child.y} L ${child.x} ${child.y}`;
        }
      }

      // Draw this inter-column path with rough.js
      const roughPath = rc.path(pathData, {
        stroke: 'var(--branch-color, #666)',
        strokeWidth: 1.5,
        roughness: 0.8,
        seed: Drawing.#hashUUID(tree.id + parentId),
      });

      // rough.js returns a group containing paths - add "rough" class to it
      roughPath.setAttribute('class', 'rough');

      // Remove rough.js attributes from path elements (CSS will handle styling)
      const pathElements = roughPath.querySelectorAll('path');
      for (const pathElement of pathElements) {
        if (pathElement instanceof SVGPathElement) {
          pathElement.removeAttribute('stroke');
          pathElement.removeAttribute('stroke-width');
          pathElement.removeAttribute('fill');
        }
      }

      group.appendChild(roughPath);
    }

    return group;
  }

  /**
   * Compute tree layout positions.
   * Returns an object mapping element IDs to {x, y} positions.
   * Includes both the root element and all child elements.
   * @param {Elements} elements - All elements in the diagram
   * @param {Tree} tree - The tree element
   * @param {number} verticalGap - How much space between elements vertically
   * @param {number} horizontalGap - How much space between elements horizontally
   * @returns {{[key: string]: {x: number, y: number}}} Object mapping element IDs to positions
   */
  static layoutTree(elements, tree, verticalGap, horizontalGap) {
    const rootElement = elements[tree.root];
    if (!rootElement) {
      return {};
    }

    // Type guard: root should be a shape (diamond or rectangle)
    if (rootElement.type !== 'diamond' && rootElement.type !== 'rectangle') {
      return {};
    }

    /** @type {{[key: string]: {x: number, y: number}}} */
    const layout = { [tree.root]: { x: rootElement.x, y: rootElement.y } };

    if (tree.items.length === 0) {
      return layout;
    }

    // First pass: determine depth of each node and max width at each depth
    /** @type {{[key: string]: number}} */
    const depthMap = {};
    /** @type {{[key: number]: number}} */
    const maxWidthAtDepth = {};

    depthMap[tree.root] = 0;
    maxWidthAtDepth[0] = rootElement.width;

    /**
     * Assign depths to all nodes in the tree
     * @param {string} nodeId - Current node ID
     * @param {number} depth - Current depth
     */
    const assignDepths = (nodeId, depth) => {
      depthMap[nodeId] = depth;
      const node = elements[nodeId];
      if (!node || (node.type !== 'diamond' && node.type !== 'rectangle')) {
        return;
      }

      if (!(depth in maxWidthAtDepth)) {
        maxWidthAtDepth[depth] = 0;
      }
      maxWidthAtDepth[depth] = Math.max(maxWidthAtDepth[depth], node.width);

      const children = Drawing.#getTreeChildren(tree, nodeId);
      for (const childId of children) {
        assignDepths(childId, depth + 1);
      }
    };

    assignDepths(tree.root, 0);

    // Second pass: calculate centerX for each depth
    /** @type {{[key: number]: number}} */
    const centerXAtDepth = {};
    centerXAtDepth[0] = rootElement.x + rootElement.width / 2;

    const maxDepth = Math.max(...Object.keys(depthMap).map(k => depthMap[k]));
    for (let depth = 1; depth <= maxDepth; depth++) {
      const parentDepth = depth - 1;
      const parentCenterX = centerXAtDepth[parentDepth];
      const parentMaxWidth = maxWidthAtDepth[parentDepth];
      const childMaxWidth = maxWidthAtDepth[depth];

      centerXAtDepth[depth] = parentCenterX + parentMaxWidth / 2 + horizontalGap + childMaxWidth / 2;
    }

    /**
     * Calculate the height of a subtree (without positioning)
     * @param {string} nodeId - Current node ID
     * @returns {number} The total height of this subtree
     */
    const calculateSubtreeHeight = (nodeId) => {
      const node = elements[nodeId];
      if (!node || (node.type !== 'diamond' && node.type !== 'rectangle')) {
        return 0;
      }

      const children = Drawing.#getTreeChildren(tree, nodeId);

      if (children.length === 0) {
        // Leaf node - height is just this node's height
        return node.height;
      }

      // Calculate total height needed for all children (including their subtrees)
      let totalChildrenHeight = 0;

      for (const childId of children) {
        const subtreeHeight = calculateSubtreeHeight(childId);
        totalChildrenHeight += subtreeHeight;
      }

      // Add spacing between children
      totalChildrenHeight += Math.max(0, children.length - 1) * verticalGap;

      return totalChildrenHeight;
    };

    /**
     * Position a node and its subtree within an allocated Y range
     * @param {string} nodeId - Current node ID
     * @param {number} startY - Start Y of allocated range for this subtree
     */
    const positionSubtree = (nodeId, startY) => {
      const node = elements[nodeId];
      if (!node || (node.type !== 'diamond' && node.type !== 'rectangle')) {
        return;
      }

      const children = Drawing.#getTreeChildren(tree, nodeId);
      const depth = depthMap[nodeId];
      const centerX = centerXAtDepth[depth];
      const x = centerX - node.width / 2;

      if (children.length === 0) {
        // Leaf node: position at the start of allocated range
        layout[nodeId] = { x, y: startY };
        return;
      }

      // Non-leaf node: allocate ranges for children and position them first
      const childInfo = [];

      for (const childId of children) {
        const child = elements[childId];
        if (!child || (child.type !== 'diamond' && child.type !== 'rectangle')) {
          continue;
        }

        const subtreeHeight = calculateSubtreeHeight(childId);
        childInfo.push({ childId, child, subtreeHeight });
      }

      // Allocate Y positions for children centered around this node's eventual center
      // (We'll calculate the node's actual Y position after positioning children)
      let currentY = startY;
      const childCenters = [];

      for (const { childId, child, subtreeHeight } of childInfo) {
        // Recursively position this child's subtree
        positionSubtree(childId, currentY);

        // Get the child's center Y (after it's been positioned)
        const childLayout = layout[childId];
        if (childLayout) {
          const childCenterY = childLayout.y + child.height / 2;
          childCenters.push(childCenterY);
        }

        currentY += subtreeHeight + verticalGap;
      }

      // Position this node at the center of its children's Y-centers
      if (childCenters.length > 0) {
        const avgChildCenterY = childCenters.reduce((sum, y) => sum + y, 0) / childCenters.length;
        const y = avgChildCenterY - node.height / 2;
        layout[nodeId] = { x, y };
      }
    };

    // Start layout from root
    const rootY = rootElement.y;
    const rootCenterY = rootY + rootElement.height / 2;

    const children = Drawing.#getTreeChildren(tree, tree.root);
    if (children.length > 0) {
      // Calculate total height needed for root's children
      let totalChildrenHeight = 0;
      const childInfo = [];

      for (const childId of children) {
        const child = elements[childId];
        if (child && (child.type === 'diamond' || child.type === 'rectangle')) {
          const subtreeHeight = calculateSubtreeHeight(childId);
          childInfo.push({ childId, subtreeHeight });
          totalChildrenHeight += subtreeHeight;
        }
      }

      totalChildrenHeight += Math.max(0, childInfo.length - 1) * verticalGap;

      // Position root's children centered around root's Y
      let currentY = rootCenterY - totalChildrenHeight / 2;

      for (const { childId, subtreeHeight } of childInfo) {
        positionSubtree(childId, currentY);
        currentY += subtreeHeight + verticalGap;
      }
    }

    return layout;
  }

  /**
   * Get direct children of an element in a tree.
   * @param {Tree} tree - The tree element
   * @param {string} parentId - ID of the parent element (can be root or item)
   * @returns {string[]} Array of child element IDs
   */
  static #getTreeChildren(tree, parentId) {
    return tree.items
      .filter(item => item.parent === parentId)
      .map(item => item.element);
  }
}
