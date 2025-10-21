/**
 * Simple helper to improve HTML syntax highlighting in IDEs.
 * @param {TemplateStringsArray} strings
 * @returns
 */
const html = strings => strings.join('');
const template = document.createElement('template');
template.setHTMLUnsafe(html`
  <div id="container">
    <button id="focus"></button><!-- Special focusable element to help with events / interactions. -->
    <div id="tools">
      <button id="diamond" title="diamond">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="1.22183" width="11" height="11" rx="1" transform="rotate(45 9 1.22183)" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button id="arrow" title="arrow">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M12 0.826842C12.0028 0.412638 11.6694 0.0745512 11.2552 0.0717034L4.50532 0.0252937C4.09111 0.0224458 3.75302 0.355915 3.75018 0.77012C3.74733 1.18432 4.0808 1.52241 4.495 1.52526L10.4949 1.56651L10.4536 7.56637C10.4508 7.98057 10.7842 8.31866 11.1984 8.32151C11.6126 8.32436 11.9507 7.99089 11.9536 7.57668L12 0.826842ZM0.75 11.1783L1.27667 11.7122L11.7767 1.35565L11.25 0.821685L10.7233 0.287722L0.223329 10.6443L0.75 11.1783Z"/>
        </svg>
      </button>
      <button id="tree" title="tree">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path stroke="currentColor" stroke-width="1.088" d="M3.75 10.5C4.57843 10.5 5.25 9.82843 5.25 9C5.25 8.17157 4.57843 7.5 3.75 7.5C2.92157 7.5 2.25 8.17157 2.25 9C2.25 9.82843 2.92157 10.5 3.75 10.5Z" />
          <path stroke="currentColor" stroke-width="1.088" d="M14.25 5.25C15.0784 5.25 15.75 4.57843 15.75 3.75C15.75 2.92157 15.0784 2.25 14.25 2.25C13.4216 2.25 12.75 2.92157 12.75 3.75C12.75 4.57843 13.4216 5.25 14.25 5.25Z" />
          <path stroke="currentColor" stroke-width="1.088" d="M14.25 10.5C15.0784 10.5 15.75 9.82843 15.75 9C15.75 8.17157 15.0784 7.5 14.25 7.5C13.4216 7.5 12.75 8.17157 12.75 9C12.75 9.82843 13.4216 10.5 14.25 10.5Z" />
          <path stroke="currentColor" stroke-width="1.088" d="M14.25 15.75C15.0784 15.75 15.75 15.0784 15.75 14.25C15.75 13.4216 15.0784 12.75 14.25 12.75C13.4216 12.75 12.75 13.4216 12.75 14.25C12.75 15.0784 13.4216 15.75 14.25 15.75Z" />
          <path stroke="currentColor" stroke-width="1.088" stroke-linecap="round" stroke-linejoin="round" d="M12.75 14.25H8.25V3.75H12.75" />
          <path stroke="currentColor" stroke-width="1.088" stroke-linecap="round" stroke-linejoin="round" d="M5.25 9H12.75" />
        </svg>
      </button>
      <button id="rectangle" title="rectangle">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="2.25" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      <button id="text" title="text">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1.25V14.75M4.75 14.75H9.25M12.25 3.5V1.25H1.75V3.5" stroke="currentColor" stroke-width="2.112" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="divider"></div>
      <input id="domain" value="domain">
      <button id="help">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path stroke="currentColor" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round" d="M9 15H9.0075"/>
          <path stroke="currentColor" stroke-width="1.92" stroke-linecap="round" d="M5.25 6.75C5.25 5.90579 5.52895 5.12674 5.99972 4.5C6.68388 3.58916 7.77315 3 9 3C11.0711 3 12.75 4.67893 12.75 6.75C12.75 8.5659 11.4593 10.0804 9.7452 10.426C9.33915 10.5078 9 10.8358 9 11.25V12"/>
        </svg>
        <div id="help-menu">
          <div id="help-menu-diamond">
            <div class="help-menu-label">Diamond Shapes</div>
            <p>
              You can think of diamonds as <em>classes</em>. If you declare
              <code>&lt; ex:Value (DC) &gt;</code>, you are naming a concept
              <code>ex:Value</code> and typing it as a <em>direct class</em>
              (DC).
            </p>
            <div class="help-menu-grid">
              <div>(DC)</div><div>Direct Class</div>
              <div>(SC)</div><div>Sealed Class</div>
              <div>(E)</div><div>Enumeration</div>
              <div>(V)</div><div>Enum Value</div>
            </div>
          </div>
          <div id="help-menu-rectangle">
            <div class="help-menu-label">Rectangle Shapes</div>
            <p>
              Rectangles are <em>datatypes</em>. If you declare
              <code>[ xsd:string ]</code>, you are referencing an
              <code>xsd</code> literal.
            </p>
            <div class="help-menu-grid">
              <div>xsd:string</div><div>string</div>
              <div>xsd:int</div><div>32-bit integer</div>
              <div>xsd:float</div><div>32-bit floating-point</div>
              <div>xsd:double</div><div>64-bit floating-point</div>
              <div>xsd:date</div><div>date-only</div>
              <div>xsd:time</div><div>time-only</div>
              <div>xsd:boolean</div><div>boolean</div>
            </div>
          </div>
          <div id="help-menu-arrow">
            <div class="help-menu-label">Arrow Shapes</div>
            <p>
              If you declare <code>-- ex:name (1..1) -&gt;</code>, you are
              naming a concept <code>ex:name</code> and typing it as a
              <em>property</em> with a cardinality of exactly 1. If this arrow
              connects two <em>diamonds</em>, it is a <em>relationship</em>. If
              the arrow connects a diamond to a <em>rectangle</em>, it is an
              <em>attribute</em>. Additionally, you can declare an attribute as
              a <em>primary key</em> by typing <code>PK1</code>.
            </p>
            <div class="help-menu-grid">
              <div>(1..1)</div><div>Cardinality = 1</div>
              <div>(0..1)</div><div>Min = 0 & Max = 1</div>
              <div>(0..n)</div><div>Min = 0 (unbounded)</div>
              <div>(1..1 PK1)</div><div>Cardinality = 1 & Primary Key</div>
            </div>
          </div>
        </div>
      </button>
    </div>
    <svg id="svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <g id="world">
        <g id="content"></g>
        <g id="ui"></g>
      </g>
    </svg>
    <form id="form">
      <textarea id="textarea"></textarea>
    </form>
  </div>
`);
export default template;
