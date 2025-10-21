/**
 * @fileoverview Type definitions and constants for upper-doodle component
 */
/**
 * Valid element types
 * @type {ReadonlyArray<'rectangle' | 'diamond' | 'arrow' | 'text' | 'tree'>}
 */
export const ELEMENT_TYPES: ReadonlyArray<"rectangle" | "diamond" | "arrow" | "text" | "tree">;
/**
 * Valid upper predicates from diamond element to text element.
 * @type {ReadonlyArray<'upper:label' | 'upper:description'>}
 */
export const DIAMOND_TO_TEXT_PREDICATES: ReadonlyArray<"upper:label" | "upper:description">;
/**
 * @typedef {typeof DIAMOND_TO_TEXT_PREDICATES[number]} DiamondToTextPredicate
 */
/**
 * Valid class type abbreviations and their mapping to upper classes.
 * @type {{ DC: 'upper:DirectClass', SC: 'upper:SealedClass', E: 'upper:Enumeration', V: 'upper:EnumValue' }}
 */
export const TYPE_ABBREVIATIONS: {
    DC: "upper:DirectClass";
    SC: "upper:SealedClass";
    E: "upper:Enumeration";
    V: "upper:EnumValue";
};
export type DiamondToTextPredicate = (typeof DIAMOND_TO_TEXT_PREDICATES)[number];
export type TypeAbbreviation = "DC" | "SC" | "E" | "V";
export type Diamond = {
    /**
     * - Unique element identifier (UUID)
     */
    id: string;
    /**
     * - Element type
     */
    type: "diamond";
    /**
     * - X coordinate (top-left)
     */
    x: number;
    /**
     * - Y coordinate (top-left)
     */
    y: number;
    /**
     * - Width (can be negative during creation)
     */
    width: number;
    /**
     * - Height (can be negative during creation)
     */
    height: number;
    /**
     * - Text label content
     */
    text: string;
};
export type Arrow = {
    /**
     * - Unique element identifier (UUID)
     */
    id: string;
    /**
     * - Element type
     */
    type: "arrow";
    /**
     * - Start X coordinate
     */
    x1: number;
    /**
     * - Start Y coordinate
     */
    y1: number;
    /**
     * - End X coordinate
     */
    x2: number;
    /**
     * - End Y coordinate
     */
    y2: number;
    /**
     * - Text label content
     */
    text: string;
    /**
     * - UUID of shape this arrow's tail is bound to
     */
    source: string | null;
    /**
     * - UUID of shape this arrow's head is bound to
     */
    target: string | null;
};
export type Tree = {
    /**
     * - Unique element identifier (UUID)
     */
    id: string;
    /**
     * - Element type
     */
    type: "tree";
    /**
     * - The root element id (e.g., the enumeration)
     */
    root: string;
    /**
     * - List of items, parent and element are existing element ids.
     */
    items: {
        parent: string;
        element: string;
    }[];
};
export type Rectangle = {
    /**
     * - Unique element identifier (UUID)
     */
    id: string;
    /**
     * - Element type
     */
    type: "rectangle";
    /**
     * - X coordinate (top-left)
     */
    x: number;
    /**
     * - Y coordinate (top-left)
     */
    y: number;
    /**
     * - Width (can be negative during creation)
     */
    width: number;
    /**
     * - Height (can be negative during creation)
     */
    height: number;
    /**
     * - Text label content
     */
    text: string;
};
export type Text = {
    /**
     * - Unique element identifier (UUID)
     */
    id: string;
    /**
     * - Element type
     */
    type: "text";
    /**
     * - X coordinate (top-left)
     */
    x: number;
    /**
     * - Y coordinate (top-left)
     */
    y: number;
    /**
     * - Text content
     */
    text: string;
};
export type Element = Diamond | Arrow | Rectangle | Text | Tree;
export type Elements = {
    [key: string]: Element;
};
export type MoveInteraction = {
    /**
     * - Interaction type
     */
    type: "move";
    /**
     * - IDs of elements being moved
     */
    elementIds: string[];
    /**
     * - Starting view X coordinate
     */
    startViewX: number;
    /**
     * - Starting view Y coordinate
     */
    startViewY: number;
    /**
     * - Original positions of elements being moved
     */
    startPositions: {
        [x: string]: {
            x?: number;
            y?: number;
            x1?: number;
            y1?: number;
            x2?: number;
            y2?: number;
        };
    };
};
export type SelectionInteraction = {
    /**
     * - Interaction type
     */
    type: "selection";
    /**
     * - IDs of selected elements
     */
    elementIds: string[];
    /**
     * - Starting view X coordinate
     */
    startViewX: number;
    /**
     * - Starting view Y coordinate
     */
    startViewY: number;
};
export type ResizeBoxInteraction = {
    /**
     * - Interaction type
     */
    type: "resize-box";
    /**
     * - ID of element being resized
     */
    elementId: string;
    /**
     * - Which corner handle is being dragged
     */
    handle: "nw" | "ne" | "se" | "sw";
    /**
     * - Starting view X coordinate
     */
    startViewX: number;
    /**
     * - Starting view Y coordinate
     */
    startViewY: number;
    /**
     * - Element's starting X coordinate
     */
    startX: number;
    /**
     * - Element's starting Y coordinate
     */
    startY: number;
    /**
     * - Element's starting width
     */
    startWidth: number;
    /**
     * - Element's starting height
     */
    startHeight: number;
};
export type ResizeArrowInteraction = {
    /**
     * - Interaction type
     */
    type: "resize-arrow";
    /**
     * - ID of arrow being resized
     */
    elementId: string;
    /**
     * - Which end of the arrow is being dragged
     */
    handle: "tail" | "head";
    /**
     * - Starting view X coordinate
     */
    startViewX: number;
    /**
     * - Starting view Y coordinate
     */
    startViewY: number;
    /**
     * - Arrow's starting x1 coordinate
     */
    startX1: number;
    /**
     * - Arrow's starting y1 coordinate
     */
    startY1: number;
    /**
     * - Arrow's starting x2 coordinate
     */
    startX2: number;
    /**
     * - Arrow's starting y2 coordinate
     */
    startY2: number;
    /**
     * - ID of element being hovered for binding
     */
    bindingId?: string | null | undefined;
};
export type EditInteraction = {
    /**
     * - Interaction type
     */
    type: "edit";
    /**
     * - ID of element being edited
     */
    elementId: string;
};
export type AddingInteraction = {
    /**
     * - Interaction type
     */
    type: "adding";
    /**
     * - Preview element being added (for single element)
     */
    element: Element;
    /**
     * - Multiple preview elements (for multi-element paste)
     */
    elements?: Element[] | undefined;
    /**
     * - Center point of element group (for multi-element paste)
     */
    groupCenter?: {
        x: number;
        y: number;
    } | undefined;
};
export type AddingArrowInteraction = {
    /**
     * - Interaction type
     */
    type: "adding-arrow";
    /**
     * - UUID of arrow being created
     */
    arrowId: string;
    /**
     * - Current step in arrow creation
     */
    step: "placing-tail" | "placing-head";
    /**
     * - Tail X coordinate (null in placing-tail step)
     */
    x1: number | null;
    /**
     * - Tail Y coordinate (null in placing-tail step)
     */
    y1: number | null;
    /**
     * - Source element ID (binding target)
     */
    source: string | null;
    /**
     * - Target element ID (binding target)
     */
    target: string | null;
};
export type PlantingInteraction = {
    /**
     * - Interaction type
     */
    type: "planting";
};
export type ZoomInteraction = {
    /**
     * - Interaction type
     */
    type: "zoom";
    /**
     * - First touch point starting view X coordinate
     */
    startViewX1: number;
    /**
     * - First touch point starting view Y coordinate
     */
    startViewY1: number;
    /**
     * - Second touch point starting view X coordinate
     */
    startViewX2: number;
    /**
     * - Second touch point starting view Y coordinate
     */
    startViewY2: number;
    /**
     * - Starting distance between touch points
     */
    startDistance: number;
    /**
     * - Scene state at interaction start
     */
    startScene: ViewTransform;
};
export type PanInteraction = {
    /**
     * - Interaction type
     */
    type: "pan";
    /**
     * - First touch point starting view X coordinate
     */
    startViewX1: number;
    /**
     * - First touch point starting view Y coordinate
     */
    startViewY1: number;
    /**
     * - Second touch point starting view X coordinate
     */
    startViewX2: number;
    /**
     * - Second touch point starting view Y coordinate
     */
    startViewY2: number;
    /**
     * - Starting midpoint X coordinate
     */
    startMidpointX: number;
    /**
     * - Starting midpoint Y coordinate
     */
    startMidpointY: number;
    /**
     * - Scene state at interaction start
     */
    startScene: ViewTransform;
};
export type Interaction = MoveInteraction | SelectionInteraction | ResizeBoxInteraction | ResizeArrowInteraction | EditInteraction | AddingInteraction | AddingArrowInteraction | PlantingInteraction | ZoomInteraction | PanInteraction;
export type ViewTransform = {
    /**
     * - Pan X offset
     */
    x: number;
    /**
     * - Pan Y offset
     */
    y: number;
    /**
     * - Scale factor
     */
    k: number;
};
export type BoundingBox = {
    /**
     * - Left edge X coordinate
     */
    x: number;
    /**
     * - Top edge Y coordinate
     */
    y: number;
    /**
     * - Width
     */
    width: number;
    /**
     * - Height
     */
    height: number;
};
/**
 * Persistent state that gets saved in undo/redo history
 */
export type PersistentState = {
    /**
     * - Prefix mappings for namespace URIs
     */
    prefixes: Prefixes;
    /**
     * - Default domain prefix for new elements
     */
    domain: string;
    /**
     * - Object mapping element IDs to elements
     */
    elements: {
        [x: string]: Element;
    };
    /**
     * - Scene/viewport transform (pan and zoom)
     */
    scene: ViewTransform;
};
/**
 * Ephemeral state that is NOT saved in undo/redo history
 */
export type EphemeralState = {
    /**
     * - Current pointer view X coordinate (null if not tracking)
     */
    viewX: number | null;
    /**
     * - Current pointer view Y coordinate (null if not tracking)
     */
    viewY: number | null;
    /**
     * - Is pointer currently down
     */
    down: boolean;
    /**
     * - Current interaction state (selection, move, etc.)
     */
    interaction: Interaction | null;
};
/**
 * Complete application state (persistent + ephemeral)
 */
export type StateShape = {
    /**
     * - State that gets saved in undo/redo
     */
    persistent: PersistentState;
    /**
     * - State that is NOT saved in undo/redo
     */
    ephemeral: EphemeralState;
};
export type Prefixes = {
    [key: string]: string;
};
