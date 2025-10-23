import { describe, it } from '@netflix/x-test/x-test.js';
import { Drawing } from '../src/utils/drawing.js';
import { UpperDoodle } from '../src/upper-doodle.js';
import { dedent, assertTreeLayout, createTestElement, createDefaultDoc } from './shared.js';

// Pick numbers that help us with our bespoke testing grid here.
const VERTICAL_GAP = 20;  // Inter-item spacing
const HORIZONTAL_GAP = 40;  // Inter-column spacing

describe('Drawing.layoutTree', () => {
  it('returns layout with only root for tree with no items', () => {
    const elements = {
      'R': { id: 'R', type: 'diamond', x: 0, y: 0, width: 20, height: 30, text: 'R' },
      'tree-1': { id: 'tree-1', type: 'tree', root: 'R', items: [] },
    };
    const tree = elements['tree-1'];
    const result = Drawing.layoutTree(elements, tree, VERTICAL_GAP, HORIZONTAL_GAP);

    assertTreeLayout(elements, tree, result, dedent`\
      ┌────┐──────┼
      │R   │       
      │    │       
      └────┘       
      │            
      │            
      │            
      │            
      │            
      │            
      ┼            
    `);
  });

  it('positions single item to the right of root', () => {
    const elements = {
      'R': { id: 'R', type: 'diamond', x: 20, y: 100, width: 40, height: 50, text: 'R' },
      'A': { id: 'A', type: 'diamond', x: 0, y: 0, width: 80, height: 30, text: 'A' },
      'tree-1': { id: 'tree-1', type: 'tree', root: 'R', items: [{ parent: 'R', element: 'A' }] },
    };
    const tree = elements['tree-1'];
    const layout = Drawing.layoutTree(elements, tree, VERTICAL_GAP, HORIZONTAL_GAP);

    assertTreeLayout(elements, tree, layout, dedent`\
      ┼─────────────────────────────────────────────────────────────┼
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │    ┌─────────┐                                               
      │    │R        │         ┌───────────────────┐                 
      │    │         │         │A                  │                 
      │    │         │         │                   │                 
      │    │         │         └───────────────────┘                 
      │    └─────────┘                                               
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      │                                                              
      ┼                                                              
    `);
  });

  it('positions multiple flat items vertically', () => {
    const elements = {
      'R': { id: 'R', type: 'diamond', x: 20, y: 100, width: 28, height: 30, text: 'R' },
      'A': { id: 'A', type: 'diamond', x: 0, y: 0, width: 48, height: 30, text: 'A' },
      'B': { id: 'B', type: 'diamond', x: 0, y: 0, width: 28, height: 70, text: 'B' },
      'tree-1': {
        id: 'tree-1',
        type: 'tree',
        root: 'R',
        items: [
          { parent: 'R', element: 'A' },
          { parent: 'R', element: 'B' },
        ],
      },
    };
    const tree = elements['tree-1'];
    const layout = Drawing.layoutTree(elements, tree, VERTICAL_GAP, HORIZONTAL_GAP);

    assertTreeLayout(elements, tree, layout, dedent`\
     ┼────────────────────────────────────────┼
     │                                         
     │                                         
     │                                         
     │                                         
     │                                         
     │                     ┌───────────┐       
     │                     │A          │       
     │                     │           │       
     │                     └───────────┘       
     │    ┌──────┐                             
     │    │R     │           ┌──────┐          
     │    │      │           │B     │          
     │    └──────┘           │      │          
     │                       │      │          
     │                       │      │          
     │                       │      │          
     │                       │      │          
     │                       └──────┘          
     │                                         
     │                                         
     │                                         
     │                                         
     │                                         
     │                                         
     ┼                                         
    `);
  });

  it('positions hierarchical items with horizontal indentation', () => {
    const elements = {
      'R': { id: 'R', type: 'diamond', x: 20, y: 100, width: 20, height: 30, text: 'R' },
      'A': { id: 'A', type: 'diamond', x: 0, y: 0, width: 100, height: 100, text: 'A' },
      'B': { id: 'B', type: 'diamond', x: 0, y: 0, width: 20, height: 30, text: 'B' },
      'tree-1': {
        id: 'tree-1',
        type: 'tree',
        root: 'R',
        items: [
          { parent: 'R', element: 'A' },
          { parent: 'A', element: 'B' },
        ],
      },
    };
    const tree = elements['tree-1'];
    const layout = Drawing.layoutTree(elements, tree, VERTICAL_GAP, HORIZONTAL_GAP);

    assertTreeLayout(elements, tree, layout, dedent`\
      ┼──────────────────────────────────────────────────────────────────┼
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      │                   ┌────────────────────────┐                      
      │                   │A                       │                      
      │                   │                        │                      
      │    ┌────┐         │                        │         ┌────┐       
      │    │R   │         │                        │         │B   │       
      │    │    │         │                        │         │    │       
      │    └────┘         │                        │         └────┘       
      │                   │                        │                      
      │                   │                        │                      
      │                   │                        │                      
      │                   └────────────────────────┘                      
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      │                                                                   
      ┼                                                                   
    `);
  });

  it('handles complex multi-level hierarchy', () => {
    const elements = {
      'R': { id: 'R', type: 'diamond', x: 20, y: 100, width: 20, height: 30, text: 'R' },
      'A': { id: 'A', type: 'diamond', x: 0, y: 0, width: 48, height: 30, text: 'A' },
      'B': { id: 'B', type: 'diamond', x: 0, y: 0, width: 24, height: 80, text: 'B' },
      'C': { id: 'C', type: 'diamond', x: 0, y: 0, width: 64, height: 60, text: 'C' },
      'D': { id: 'D', type: 'diamond', x: 0, y: 0, width: 24, height: 30, text: 'D' },
      'E': { id: 'E', type: 'diamond', x: 0, y: 0, width: 24, height: 30, text: 'E' },
      'F': { id: 'F', type: 'diamond', x: 0, y: 0, width: 24, height: 30, text: 'F' },
      'G': { id: 'G', type: 'diamond', x: 0, y: 0, width: 48, height: 30, text: 'G' },
      'tree-1': {
        id: 'tree-1',
        type: 'tree',
        root: 'R',
        items: [
          { parent: 'R', element: 'A' },
          { parent: 'R', element: 'B' },
          { parent: 'A', element: 'C' },
          { parent: 'A', element: 'D' },
          { parent: 'B', element: 'E' },
          { parent: 'E', element: 'F' },
          { parent: 'E', element: 'G' },
        ],
      },
    };
    const tree = elements['tree-1'];
    const layout = Drawing.layoutTree(elements, tree, VERTICAL_GAP, HORIZONTAL_GAP);

    assertTreeLayout(elements, tree, layout, dedent`\
      ┼──────────────────────────────────────────────────────────────────────────────────────┼
      │                                         ┌───────────────┐                             
      │                                         │C              │                             
      │                                         │               │                             
      │                                         │               │                             
      │                                         │               │                             
      │                   ┌───────────┐         │               │                             
      │                   │A          │         └───────────────┘                             
      │                   │           │                                                       
      │                   └───────────┘              ┌─────┐                                  
      │    ┌────┐                                    │D    │                                  
      │    │R   │                                    │     │                                  
      │    │    │                                    └─────┘                                  
      │    └────┘                                                                             
      │                      ┌─────┐                                         ┌─────┐          
      │                      │B    │                                         │F    │          
      │                      │     │                                         │     │          
      │                      │     │                 ┌─────┐                 └─────┘          
      │                      │     │                 │E    │                                  
      │                      │     │                 │     │              ┌───────────┐       
      │                      │     │                 └─────┘              │G          │       
      │                      │     │                                      │           │       
      │                      └─────┘                                      └───────────┘       
      │                                                                                       
      │                                                                                       
      │                                                                                       
      │                                                                                       
      │                                                                                       
      │                                                                                       
      ┼                                                                                       
    `);
  });
});

describe('Tree deletion', () => {
  it('deletes non-root element and its descendants from tree', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Create a tree with hierarchy: R -> A -> B
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'R': { id: 'R', type: 'diamond', x: 0, y: 0, width: 50, height: 50, text: 'R' },
        'A': { id: 'A', type: 'diamond', x: 100, y: 0, width: 50, height: 50, text: 'A' },
        'B': { id: 'B', type: 'diamond', x: 200, y: 0, width: 50, height: 50, text: 'B' },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'R',
          items: [
            { parent: 'R', element: 'A' },
            { parent: 'A', element: 'B' },
          ],
        },
      },
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on element A to select it (center is at 125, 25)
    element._down(125, 25);
    await Promise.resolve();
    element._up();
    await Promise.resolve();

    // Delete the selected element
    element._delete();
    await Promise.resolve();

    // Parse the state
    const stateJSON = element._value;
    const stateObj = JSON.parse(stateJSON);
    const state = stateObj.elements;

    // Verify A and B are deleted
    if (state.A) {throw new Error('Element A should be deleted');}
    if (state.B) {throw new Error('Element B should be deleted');}

    // Verify R and tree still exist
    if (!state.R) {throw new Error('Root element R should still exist');}
    if (!state['tree-1']) {throw new Error('Tree should still exist');}

    // Verify tree items are updated (should have no items)
    if (state['tree-1'].items.length !== 0) {
      throw new Error(`Expected tree items to be empty, got ${JSON.stringify(state['tree-1'].items)}`);
    }

    element.remove();
  });

  it('deletes root element and entire tree', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Create a tree with hierarchy: R -> A -> B
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'R': { id: 'R', type: 'diamond', x: 0, y: 0, width: 50, height: 50, text: 'R' },
        'A': { id: 'A', type: 'diamond', x: 100, y: 0, width: 50, height: 50, text: 'A' },
        'B': { id: 'B', type: 'diamond', x: 200, y: 0, width: 50, height: 50, text: 'B' },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'R',
          items: [
            { parent: 'R', element: 'A' },
            { parent: 'A', element: 'B' },
          ],
        },
      },
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Click on root element R to select it (center is at 25, 25)
    element._down(25, 25);
    await Promise.resolve();
    element._up();
    await Promise.resolve();

    // Delete the selected element
    element._delete();
    await Promise.resolve();

    // Parse the state
    const stateJSON = element._value;
    const stateObj = JSON.parse(stateJSON);
    const state = stateObj.elements;

    // Verify all elements and tree are deleted
    if (state.R) {throw new Error('Root element R should be deleted');}
    if (state.A) {throw new Error('Element A should be deleted');}
    if (state.B) {throw new Error('Element B should be deleted');}
    if (state['tree-1']) {throw new Error('Tree should be deleted');}

    element.remove();
  });

  it('handles deletion of element with multiple children', async () => {
    const element = createTestElement();
    document.body.append(element);

    // Create a tree with hierarchy: R -> A -> (B, C)
    // Deleting A should delete B and C as well
    const valueAsObject = {
      ...createDefaultDoc(),
      elements: {
        'R': { id: 'R', type: 'diamond', x: 0, y: 0, width: 50, height: 50, text: 'R' },
        'A': { id: 'A', type: 'diamond', x: 100, y: 0, width: 50, height: 50, text: 'A' },
        'B': { id: 'B', type: 'diamond', x: 200, y: 0, width: 50, height: 50, text: 'B' },
        'C': { id: 'C', type: 'diamond', x: 200, y: 100, width: 50, height: 50, text: 'C' },
        'tree-1': {
          id: 'tree-1',
          type: 'tree',
          root: 'R',
          items: [
            { parent: 'R', element: 'A' },
            { parent: 'A', element: 'B' },
            { parent: 'A', element: 'C' },
          ],
        },
      },
    };
    const valueAsJSON = UpperDoodle.valueFromObject(valueAsObject);
    element.value = valueAsJSON;
    await Promise.resolve();

    // Get the actual position of A after tree layout
    const stateBeforeJSON = element._value;
    const stateBeforeObj = JSON.parse(stateBeforeJSON);
    const elementA = stateBeforeObj.elements.A;

    // Click on element A's center
    const centerX = elementA.x + elementA.width / 2;
    const centerY = elementA.y + elementA.height / 2;
    element._down(centerX, centerY);
    await Promise.resolve();
    element._up();
    await Promise.resolve();

    // Delete the selected element
    element._delete();
    await Promise.resolve();

    // Parse the state
    const stateJSON = element._value;
    const stateObj = JSON.parse(stateJSON);
    const state = stateObj.elements;

    // Verify A, B, and C are deleted
    if (state.A) {throw new Error('Element A should be deleted');}
    if (state.B) {throw new Error('Element B should be deleted');}
    if (state.C) {throw new Error('Element C should be deleted');}

    // Verify R and tree still exist
    if (!state.R) {throw new Error('Root element R should still exist');}
    if (!state['tree-1']) {throw new Error('Tree should still exist');}

    // Verify tree has no items
    if (state['tree-1'].items.length !== 0) {
      throw new Error(`Expected tree to have no items, got ${JSON.stringify(state['tree-1'].items)}`);
    }

    element.remove();
  });
});
