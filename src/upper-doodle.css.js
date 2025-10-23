/**
 * Simple helper to improve CSS syntax highlighting in IDEs. This can be removed
 * once we get better support for CSS modules.
 * @param {TemplateStringsArray} strings 
 * @returns string
 */
const css = strings => strings.join('');
const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css`

:host,
:host * {
  touch-action: none;
}

:host {
  /* ============================================
     Foundation Layer: Swatches
     Raw color values - never use directly in components
     ============================================ */

  /* Grayscale swatches */
  --upper-doodle-swatch-black: #000000;
  --upper-doodle-swatch-white: #FFFFFF;
  --upper-doodle-swatch-gray-050: #F7F7F9;
  --upper-doodle-swatch-gray-100: #D9D9D9;
  --upper-doodle-swatch-gray-200: #B8B8B8;
  --upper-doodle-swatch-gray-400: #8A8A8A;
  --upper-doodle-swatch-gray-600: #545454;
  --upper-doodle-swatch-gray-700: #3A3A3A;
  --upper-doodle-swatch-gray-900: #111111;

  /* Blue swatches */
  --upper-doodle-swatch-blue-400: #60A5FA;
  --upper-doodle-swatch-blue-500: #4A9EFF;
  --upper-doodle-swatch-blue-600: #3B82F6;
  --upper-doodle-swatch-blue-700: #2563EB;

  /* State swatches */
  --upper-doodle-swatch-green-500: #10B981;
  --upper-doodle-swatch-red-500: #EF4444;
  --upper-doodle-swatch-yellow-500: #F59E0B;

  /* ============================================
     Spacing Scale (theme-independent)
     ============================================ */

  --upper-doodle-spacing-xxs: 4px;
  --upper-doodle-spacing-xs: 8px;
  --upper-doodle-spacing-sm: 12px;
  --upper-doodle-spacing-md: 16px;
  --upper-doodle-spacing-lg: 24px;
  --upper-doodle-spacing-xl: 32px;
  --upper-doodle-spacing-xxl: 48px;
  --upper-doodle-spacing-xxxl: 64px;

  /* ============================================
     Border Radius Scale (theme-independent)
     ============================================ */

  --upper-doodle-radius-sm: 4px;
  --upper-doodle-radius-md: 8px;
  --upper-doodle-radius-lg: 12px;
  --upper-doodle-radius-xl: 16px;

  /* ============================================
     Typography Scale (theme-independent)
     ============================================ */

  /* Font families */
  --upper-doodle-font-family-default: "Excalifont", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Body styles */
  --upper-doodle-body-font-size: 14px;
  --upper-doodle-body-line-height: 20px;
  --upper-doodle-body-font-weight: 400;

  /* Caption/label styles */
  --upper-doodle-caption-font-size: 12px;
  --upper-doodle-caption-line-height: 16px;
  --upper-doodle-caption-font-weight: 400;

  /* ============================================
     Component Sizes (theme-independent)
     ============================================ */

  --upper-doodle-icon-size: 18px;
  --upper-doodle-button-size: 32px;
  --upper-doodle-toolbar-height: 48px;

  /* ============================================
     Theme Layer: Theme-dependent semantic tokens
     These change with light/dark theme
     ============================================ */

  /* Surface colors */
  --upper-doodle-theme-surface-canvas: var(--upper-doodle-swatch-gray-050);
  --upper-doodle-theme-surface-toolbar: var(--upper-doodle-swatch-gray-100);
  --upper-doodle-theme-surface-paper: var(--upper-doodle-swatch-white);

  /* Text colors */
  --upper-doodle-theme-text-primary: var(--upper-doodle-swatch-gray-900);
  --upper-doodle-theme-text-secondary: var(--upper-doodle-swatch-gray-400);

  /* Border colors */
  --upper-doodle-theme-border-default: var(--upper-doodle-swatch-gray-600);
  --upper-doodle-theme-border-subtle: var(--upper-doodle-swatch-gray-200);

  /* Interactive colors */
  --upper-doodle-theme-interactive-accent: var(--upper-doodle-swatch-blue-600);
  --upper-doodle-theme-interactive-accent-hover: var(--upper-doodle-swatch-blue-700);

  /* State colors */
  --upper-doodle-theme-state-success: var(--upper-doodle-swatch-green-500);
  --upper-doodle-theme-state-error: var(--upper-doodle-swatch-red-500);
  --upper-doodle-theme-state-warning: var(--upper-doodle-swatch-yellow-500);

  /* Selection/focus colors */
  --upper-doodle-theme-selection-stroke: var(--upper-doodle-swatch-blue-500);
  --upper-doodle-theme-selection-fill: var(--upper-doodle-swatch-white);

  /* ============================================
     Component Layer: Specific Components
     Use theme tokens for colors, direct tokens for sizes
     ============================================ */

  /* Toolbar */
  --upper-doodle-toolbar-background: var(--upper-doodle-theme-surface-toolbar);
  --upper-doodle-toolbar-padding: var(--upper-doodle-spacing-xs);
  --upper-doodle-toolbar-gap: var(--upper-doodle-spacing-xs);
  --upper-doodle-toolbar-border-radius: var(--upper-doodle-radius-lg);

  /* Button */
  --upper-doodle-button-background: var(--upper-doodle-swatch-gray-600);
  --upper-doodle-button-background-hover: var(--upper-doodle-theme-surface-toolbar);
  --upper-doodle-button-background-active: var(--upper-doodle-swatch-gray-600);
  --upper-doodle-button-text: var(--upper-doodle-swatch-gray-100);
  --upper-doodle-button-text-hover: var(--upper-doodle-swatch-gray-600);
  --upper-doodle-button-text-active: var(--upper-doodle-swatch-gray-100);
  --upper-doodle-button-border: var(--upper-doodle-swatch-gray-600);
  --upper-doodle-button-border-radius: var(--upper-doodle-radius-md);

  /* Divider */
  --upper-doodle-divider-background: var(--upper-doodle-theme-border-default);

  /* Input */
  --upper-doodle-input-background: var(--upper-doodle-theme-surface-paper);
  --upper-doodle-input-border: var(--upper-doodle-theme-border-default);
  --upper-doodle-input-border-focus: var(--upper-doodle-theme-interactive-accent);
  --upper-doodle-input-border-radius: var(--upper-doodle-radius-md);
  --upper-doodle-input-padding: var(--upper-doodle-spacing-xs);

  display: block;
  font-family: var(--upper-doodle-font-family-default);
  font-size: var(--upper-doodle-body-font-size);
  line-height: var(--upper-doodle-body-line-height);
  color: var(--upper-doodle-theme-text-primary);
}

#container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

/* Special focus helper — we may revisit this. */
#focus {
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  border: none;
  padding: none;
  background-color: none;
  cursor: default;
}
#focus:focus {
  outline: none;
}

/* Tools Styles */
#tools {
  position: absolute;
  top: var(--upper-doodle-spacing-xs);
  left: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  height: var(--upper-doodle-toolbar-height);
  width: min-content;
  box-sizing: border-box;
  padding: 0 var(--upper-doodle-toolbar-padding);
  gap: var(--upper-doodle-toolbar-gap);
  align-items: center;
  border-radius: var(--upper-doodle-toolbar-border-radius);
  background-color: var(--upper-doodle-toolbar-background);
  box-sizing: border-box;
}

#tools button {
  /* Button reset */
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--upper-doodle-button-size);
  height: var(--upper-doodle-button-size);

  background-color: var(--upper-doodle-button-background);
  box-shadow: inset 0 0 0 2px var(--upper-doodle-button-border);
  color: var(--upper-doodle-button-text);
  border-radius: var(--upper-doodle-button-border-radius);
  cursor: pointer;
}

#tools button:hover {
  color: var(--upper-doodle-button-text-hover);
  background-color: var(--upper-doodle-button-background-hover);
}

#tools button:active {
  background-color: var(--upper-doodle-button-background-active);
  color: var(--upper-doodle-button-text-active);
}

#tools button * {
  pointer-events: none;
}

#tools #text {
  /* We don’t currently have a need for this, simply hide it for now. */
  display: none;
}

#tools #help {
  position: relative;
}

#tools .divider {
  height: 100%;
  width: 1px;
  background-color: var(--upper-doodle-divider-background);
}

#tools #domain {
  /* Input reset */
  border: none;

  padding: 0 var(--upper-doodle-input-padding);
  font-family: var(--upper-doodle-font-family-default);
  font-size: var(--upper-doodle-body-font-size);
  line-height: var(--upper-doodle-body-line-height);
  height: var(--upper-doodle-button-size);
  width: 100px;
  border-radius: var(--upper-doodle-input-border-radius);
  box-shadow: inset 0 0 0 1px var(--upper-doodle-input-border);
  box-sizing: border-box;
}

/* Stage Styles */
#svg {
  flex: 1;
  background: var(--upper-doodle-theme-surface-canvas);
  overflow: hidden;
  width: 100%;
  height: 100%;
}

/* Cursor Styles (controlled via data-cursor attribute on container) */
#container[data-cursor="default"] #svg {
  cursor: default;
}

#container[data-cursor="move"] #svg {
  cursor: move;
}

#container[data-cursor="nwse-resize"] #svg {
  cursor: nwse-resize;
}

#container[data-cursor="nesw-resize"] #svg {
  cursor: nesw-resize;
}

#container[data-cursor="crosshair"] #svg {
  cursor: crosshair;
}

/* Prevent text selection */
#content {
  user-select: none;
}

/* Text Styles */
#content text {
  text-anchor: middle;
  dominant-baseline: middle;
  font-family: var(--upper-doodle-font-family-default);
  fill: var(--upper-doodle-theme-text-primary);
}

/* Make label text transparent to pointer events so clicks pass through to shapes */
#content .label text {
  pointer-events: none;
}

/* Add tree item button styles */
#content .add-tree-item {
  text-anchor: end;
  dominant-baseline: baseline;
  font-size: 20px;
  fill: #666;
  pointer-events: all;
  cursor: pointer;
}

/* Standalone text (text elements, not labels) */
#content [data-type="text"] text {
  text-anchor: start;
  dominant-baseline: hanging;
}

/* Background rectangles for arrow labels and text elements */
#content rect {
  fill: var(--upper-doodle-theme-surface-canvas);
}

/* Shape Styles */
#content path {
  stroke: var(--upper-doodle-theme-text-primary);
  stroke-width: 2;
  fill: none;
}

/* Selection UI */
.outline {
  stroke: var(--upper-doodle-theme-selection-stroke);
  stroke-width: 1;
  stroke-dasharray: 8 8;
  fill: none;
}

.handle {
  stroke: var(--upper-doodle-theme-selection-stroke);
  stroke-width: 1;
  fill: var(--upper-doodle-theme-selection-fill);
}

.binding-indicator {
  stroke: var(--upper-doodle-theme-text-primary);
  stroke-width: 1;
  stroke-dasharray: 8 8;
  fill: none;
  opacity: 0.4;
}

/* Raw RDF text */
#content [data-raw] text {
  fill: var(--upper-doodle-theme-state-success);
}

#content [data-raw] path {
  stroke: var(--upper-doodle-theme-state-success);
}

/* Invalid */
#content [data-invalid] text {
  fill: var(--upper-doodle-theme-state-error);
}

#content [data-invalid] path {
  stroke: var(--upper-doodle-theme-state-error);
}

/* Ignored elements (not used in any triple) */
#content [data-ignored] {
  opacity: 0.4;
}

/* External elements (from a different domain) */
#content [data-external] path {
  stroke-dasharray: 16 4;
}

/* Edit Form */
#form {
  position: absolute;
  transform: translate(-50%, -50%);
}

#container:not([data-edit]) #form {
  display: none;
}

#textarea {
  font-family: var(--upper-doodle-font-family-default);
  border: 2px solid var(--upper-doodle-theme-interactive-accent);
  border-radius: var(--upper-doodle-radius-sm);
  padding: var(--upper-doodle-spacing-xxs);
  resize: none;
  background: var(--upper-doodle-theme-surface-paper);
}

/* Themes */
:host([theme="dark"]) {
  /* Dark theme swatches */
  --upper-doodle-swatch-dark-bg: #1a1a1a;
  --upper-doodle-swatch-dark-surface: #2a2a2a;
  --upper-doodle-swatch-dark-border: #404040;
  --upper-doodle-swatch-dark-text: #e5e5e5;
  --upper-doodle-swatch-dark-muted: #666666;

  /* Override theme tokens for dark mode */
  --upper-doodle-theme-surface-canvas: var(--upper-doodle-swatch-dark-bg);
  --upper-doodle-theme-surface-toolbar: var(--upper-doodle-swatch-dark-surface);
  --upper-doodle-theme-surface-paper: var(--upper-doodle-swatch-dark-surface);

  --upper-doodle-theme-text-primary: var(--upper-doodle-swatch-dark-text);
  --upper-doodle-theme-text-secondary: var(--upper-doodle-swatch-dark-muted);

  --upper-doodle-theme-border-default: var(--upper-doodle-swatch-dark-border);
  --upper-doodle-theme-border-subtle: var(--upper-doodle-swatch-dark-border);

  --upper-doodle-theme-selection-fill: var(--upper-doodle-swatch-dark-surface);

  /* Update button colors for dark theme */
  --upper-doodle-button-background: var(--upper-doodle-swatch-dark-surface);
  --upper-doodle-button-border: var(--upper-doodle-swatch-dark-border);
  --upper-doodle-button-text: var(--upper-doodle-swatch-dark-text);
  --upper-doodle-button-text-hover: var(--upper-doodle-swatch-dark-text);
}

/* Help Menu */
#tools button #help-menu {
  display: none;
  position: absolute;
  top: calc(100% + var(--upper-doodle-spacing-xs));
  right: 0;
  width: 320px;
  max-width: 90vw;
  padding: var(--upper-doodle-spacing-md);
  color: var(--upper-doodle-theme-text-primary);
  background: var(--upper-doodle-theme-surface-paper);
  border-radius: var(--upper-doodle-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  pointer-events: auto;
  text-align: left;
}

#help:focus-within #help-menu {
  display: block;
}

#help-menu-diamond,
#help-menu-rectangle {
  margin-bottom: var(--upper-doodle-spacing-md);
}

#help-menu-diamond:last-child {
  margin-bottom: 0;
}

.help-menu-label {
  font-weight: 600;
  margin-bottom: var(--upper-doodle-spacing-xs);
  color: var(--upper-doodle-theme-text-primary);
}

#help-menu code {
  background: var(--upper-doodle-theme-surface-canvas);
  padding: 2px 4px;
  border-radius: var(--upper-doodle-radius-sm);
  font-family: monospace;
  font-size: 0.9em;
  color: var(--upper-doodle-theme-text-primary);
}

#help-menu em {
  font-style: italic;
  color: var(--upper-doodle-theme-text-primary);
}

.help-menu-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-auto-rows: auto;
  gap: var(--upper-doodle-spacing-xs);
  align-items: center;
}
`);
export default styleSheet;
