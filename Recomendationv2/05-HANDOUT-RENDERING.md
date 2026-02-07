# Phase 5: Handout Rendering — KaTeX + Mermaid + SVG Pipeline

## Why This Phase Exists

Handouts need three visual elements the current app can't render: mathematical equations (LaTeX), structured diagrams (flowcharts, timelines, mind maps), and labeled illustrations. This phase adds client-side rendering for equations and diagrams while leveraging pre-rendered SVGs from the Python pipeline (Phase 2).

**Key principle**: Pre-render everything possible at build time. Client-side rendering is fallback only.

---

## Step 1: Install KaTeX and Mermaid React Wrappers

```bash
npm install katex react-katex
```

**REASONING**: KaTeX is 3-5x faster than MathJax with a smaller bundle (~347 KB). Its LaTeX subset covers all Grade 9 math: fractions, exponents, roots, Greek letters, basic calculus notation. `react-katex` provides `<BlockMath>` and `<InlineMath>` components.

Mermaid is already in `package.json` (v11.12.2). No additional install needed.

### Decision Gate
```bash
node -e "require('katex'); console.log('KaTeX OK');"
node -e "require('mermaid'); console.log('Mermaid OK');"
```

---

## Step 2: Create Rendering Components

```
src/components/handout/
├── HandoutRenderer.jsx       ← Main router for handout sections
├── EquationBlock.jsx         ← KaTeX math rendering
├── MermaidDiagram.jsx        ← Mermaid → SVG rendering (client-side)
├── SVGDiagram.jsx            ← Pre-rendered SVG loader
├── MixedContent.jsx          ← Text with inline equations
└── HandoutPrintView.jsx      ← Print-optimized layout
```

### EquationBlock.jsx

```jsx
/**
 * EquationBlock.jsx
 * Renders LaTeX equations using KaTeX.
 *
 * REASONING: KaTeX renders instantly (no MathJax delay). Equations stored
 * as LaTeX strings in JSON from Phase 1 data. Handles both block (centered)
 * and inline (within text) modes.
 *
 * ERROR HANDLING: Invalid LaTeX silently falls back to displaying the raw string
 * rather than crashing the component. This is critical because auto-generated
 * LaTeX from SymPy may occasionally have edge-case issues.
 *
 * DATA: Expects { latex: "F = m \\cdot a", label: "Newton's Second Law" }
 */

import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';  // MUST import CSS
import { Logger } from '../../services/Logger';
import { cn } from '../../utils';

export function EquationBlock({ equation, darkMode }) {
    const { latex, label, variables } = equation;

    if (!latex) {
        Logger.warn('EquationBlock: Empty latex string', { equation });
        return null;
    }

    return (
        <div className={cn(
            "p-4 rounded-lg text-center",
            darkMode ? "bg-gray-750 border border-gray-600" : "bg-blue-50 border border-blue-100"
        )}>
            {label && (
                <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
            )}

            <div className="text-xl">
                <SafeBlockMath latex={latex} />
            </div>

            {variables && variables.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
                    {variables.map((v, i) => (
                        <span key={i} className="px-2 py-1 bg-white/80 rounded text-gray-600">
                            <SafeInlineMath latex={v.symbol || v.sym} />{' = '}
                            {v.name}{v.unit ? ` (${v.unit})` : ''}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export function EquationList({ equations, darkMode }) {
    if (!equations || equations.length === 0) return null;

    return (
        <div className="space-y-3">
            {equations.map((eq, i) => (
                <EquationBlock key={eq.id || i} equation={eq} darkMode={darkMode} />
            ))}
        </div>
    );
}

// Safe wrapper: catches KaTeX parse errors and shows raw LaTeX
function SafeBlockMath({ latex }) {
    try {
        return <BlockMath math={latex} />;
    } catch (error) {
        Logger.warn('KaTeX parse error (block)', { latex, error: error.message });
        return <code className="text-red-500 font-mono text-sm">{latex}</code>;
    }
}

export function SafeInlineMath({ latex }) {
    try {
        return <InlineMath math={latex} />;
    } catch (error) {
        Logger.warn('KaTeX parse error (inline)', { latex, error: error.message });
        return <code className="text-red-500 font-mono text-xs">{latex}</code>;
    }
}

/**
 * MixedContent: Renders text with embedded LaTeX.
 * LaTeX delimiters: $...$ for inline, $$...$$ for block.
 *
 * REASONING: Study guide content stored in JSON may contain mixed prose and
 * equations like "The formula $F = ma$ shows that...". This component
 * auto-detects and renders both.
 */
export function MixedContent({ text, darkMode }) {
    if (!text) return null;

    // Split on $$ (block) and $ (inline) delimiters
    const parts = [];
    let remaining = text;
    let key = 0;

    // Process block equations first ($$...$$)
    while (remaining.includes('$$')) {
        const start = remaining.indexOf('$$');
        const end = remaining.indexOf('$$', start + 2);
        if (end === -1) break;

        // Text before equation
        if (start > 0) parts.push({ type: 'text', content: remaining.slice(0, start), key: key++ });
        // Block equation
        parts.push({ type: 'block', content: remaining.slice(start + 2, end), key: key++ });
        remaining = remaining.slice(end + 2);
    }

    // Process inline equations ($...$) in remaining text
    if (remaining.includes('$')) {
        const segments = remaining.split('$');
        segments.forEach((seg, i) => {
            if (i % 2 === 0) {
                if (seg) parts.push({ type: 'text', content: seg, key: key++ });
            } else {
                parts.push({ type: 'inline', content: seg, key: key++ });
            }
        });
    } else if (remaining) {
        parts.push({ type: 'text', content: remaining, key: key++ });
    }

    return (
        <div className={cn("leading-relaxed", darkMode ? "text-gray-300" : "text-gray-700")}>
            {parts.map(part => {
                if (part.type === 'block') return <div key={part.key} className="my-3"><SafeBlockMath latex={part.content} /></div>;
                if (part.type === 'inline') return <SafeInlineMath key={part.key} latex={part.content} />;
                return <span key={part.key}>{part.content}</span>;
            })}
        </div>
    );
}
```

### MermaidDiagram.jsx

```jsx
/**
 * MermaidDiagram.jsx
 * Client-side Mermaid rendering for dynamic diagrams.
 *
 * REASONING: Most diagrams should be PRE-RENDERED to SVG by the Python pipeline
 * (Phase 2) and loaded via <img> for instant display. This component is the
 * FALLBACK for diagrams stored as Mermaid code in JSON that haven't been
 * pre-rendered yet.
 *
 * STRATEGY:
 * 1. If svg_path exists → load pre-rendered SVG (fastest)
 * 2. If mermaid code exists → render client-side (slower but works)
 * 3. If neither → show placeholder
 *
 * ALIGNMENT: Mermaid is already in package.json. This component uses
 * mermaid.render() API which generates SVG strings.
 */

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Logger } from '../../services/Logger';
import { cn } from '../../utils';

// Initialize mermaid once
let mermaidInitialized = false;
function initMermaid(darkMode) {
    mermaid.initialize({
        startOnLoad: false,
        theme: darkMode ? 'dark' : 'default',
        securityLevel: 'loose',  // Allow click handlers
        flowchart: { useMaxWidth: true, htmlLabels: true },
        fontFamily: 'inherit'
    });
    mermaidInitialized = true;
}

export default function MermaidDiagram({ diagram, darkMode }) {
    const containerRef = useRef(null);
    const [svgContent, setSvgContent] = useState(null);
    const [error, setError] = useState(null);

    const { svg_path, code, caption } = diagram || {};

    useEffect(() => {
        // Strategy 1: Load pre-rendered SVG
        if (svg_path) {
            const publicUrl = process.env.PUBLIC_URL || '';
            fetch(`${publicUrl}/${svg_path}`)
                .then(res => {
                    if (!res.ok) throw new Error(`SVG not found: ${svg_path}`);
                    return res.text();
                })
                .then(svg => {
                    setSvgContent(svg);
                    Logger.gate(`SVG Load: ${svg_path}`, true);
                })
                .catch(err => {
                    Logger.warn(`Pre-rendered SVG not found, falling back to client render`, { svg_path });
                    // Fall through to client-side rendering
                    if (code) renderMermaidClient();
                    else setError('No diagram available');
                });
            return;
        }

        // Strategy 2: Client-side Mermaid rendering
        if (code) {
            renderMermaidClient();
        }
    }, [svg_path, code, darkMode]);

    async function renderMermaidClient() {
        if (!mermaidInitialized) initMermaid(darkMode);

        try {
            const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
            const { svg } = await mermaid.render(id, code);
            setSvgContent(svg);
            Logger.gate('Mermaid Client Render', true);
        } catch (err) {
            Logger.error('Mermaid render failed', err);
            setError(`Diagram render failed: ${err.message}`);
        }
    }

    return (
        <div className={cn(
            "rounded-lg overflow-hidden",
            darkMode ? "bg-gray-750" : "bg-white",
            "border", darkMode ? "border-gray-600" : "border-gray-200"
        )}>
            {/* Diagram */}
            <div ref={containerRef} className="p-4 flex justify-center">
                {svgContent ? (
                    <div
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                        className="max-w-full overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
                    />
                ) : error ? (
                    <div className="text-red-500 text-sm p-4">
                        <p>⚠ {error}</p>
                        {code && (
                            <details className="mt-2">
                                <summary className="cursor-pointer text-xs">Show Mermaid code</summary>
                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">{code}</pre>
                            </details>
                        )}
                    </div>
                ) : (
                    <div className="animate-pulse bg-gray-200 rounded h-48 w-full" />
                )}
            </div>

            {/* Caption */}
            {caption && (
                <div className={cn(
                    "px-4 py-2 text-sm text-center border-t",
                    darkMode ? "bg-gray-800 text-gray-400 border-gray-600" : "bg-gray-50 text-gray-600 border-gray-200"
                )}>
                    {caption}
                </div>
            )}
        </div>
    );
}
```

### HandoutRenderer.jsx

```jsx
/**
 * HandoutRenderer.jsx
 * Renders handout sections by routing content_type to correct component.
 *
 * REASONING: Handouts combine text, equations, diagrams, and tables.
 * Each content type gets a specialized renderer. The renderer also supports
 * a "print mode" that hides interactive elements and optimizes for paper.
 */

import React from 'react';
import { EquationBlock, EquationList, MixedContent } from './EquationBlock';
import MermaidDiagram from './MermaidDiagram';
import { cn } from '../../utils';
import { Logger } from '../../services/Logger';

export default function HandoutRenderer({ sections, darkMode, printMode = false }) {
    if (!sections || sections.length === 0) {
        return <p className="text-gray-400 italic">No handout content available.</p>;
    }

    const sorted = [...sections].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    return (
        <div className={cn("space-y-6", printMode && "handout-mode")}>
            {sorted.map((section, i) => (
                <HandoutSection key={section.section_id || i} section={section} darkMode={darkMode} />
            ))}
        </div>
    );
}

function HandoutSection({ section, darkMode }) {
    const { section_type, content, title } = section;

    // Route by content type
    switch (section_type) {
        case 'mermaid':
            return (
                <div>
                    {title && <h3 className="font-semibold text-lg mb-2">{title}</h3>}
                    <MermaidDiagram diagram={typeof content === 'object' ? content : { code: content }} darkMode={darkMode} />
                </div>
            );

        case 'formulas':
        case 'equations':
            return (
                <div>
                    {title && <h3 className="font-semibold text-lg mb-2">{title}</h3>}
                    <EquationList equations={content?.equations || (Array.isArray(content) ? content : [])} darkMode={darkMode} />
                </div>
            );

        case 'text':
        default:
            const text = typeof content === 'string' ? content : content?.text || '';
            return (
                <div className={cn("p-4 rounded-lg", darkMode ? "bg-gray-800" : "bg-white")}>
                    {title && <h3 className="font-semibold text-lg mb-2">{title}</h3>}
                    <MixedContent text={text} darkMode={darkMode} />
                </div>
            );
    }
}
```

---

## Step 3: How to Store Equations in CSV vs JSON

### CSV (simple formulas — OK for flat data)

The existing `content.csv` pattern works for simple formulas:

```csv
content_id,content_type,title,content
eq-001,formula,Ohm's Law,"V = I \cdot R"
eq-002,formula,Power,"P = I \cdot V"
```

**PROBLEM**: LaTeX with backslashes (`\frac`, `\sqrt`) breaks CSV parsers unless perfectly quoted. Papa Parse handles RFC 4180 quoting, but manual CSV editing in spreadsheets often mangles it.

### JSON (recommended for anything with LaTeX)

```json
{
  "equations": [
    {
      "id": "eq-001",
      "latex": "V = I \\cdot R",
      "label": "Ohm's Law",
      "variables": [
        { "symbol": "V", "name": "Voltage", "unit": "Volts (V)" },
        { "symbol": "I", "name": "Current", "unit": "Amps (A)" },
        { "symbol": "R", "name": "Resistance", "unit": "Ohms (Ω)" }
      ]
    },
    {
      "id": "eq-002",
      "latex": "P = I \\cdot V",
      "label": "Electrical Power"
    }
  ]
}
```

**GUIDANCE for AI agent**: If the content has backslashes, braces, or multi-line strings → use JSON. If it's flat key-value data → CSV is fine. When in doubt, JSON.

---

## Step 4: Diagram Types Cheat Sheet for Content Authors

| Diagram Need | Mermaid Type | Example Code |
|-------------|-------------|-------------|
| Process flow | `graph TD` | `graph TD; A-->B-->C` |
| Classification | `mindmap` | `mindmap\n  root\n    Branch1\n    Branch2` |
| Timeline | `timeline` | `timeline\n  2020: Event A\n  2021: Event B` |
| Comparison | `graph LR` | Side-by-side nodes with arrows |
| Cycle | `graph TD` with loop | A→B→C→A |
| Decision tree | `graph TD` with `{decision}` | Diamond-shaped decision nodes |
| Sequence | `sequenceDiagram` | Actor interactions over time |

Store Mermaid code in JSON chapter files under `content.diagrams[]`. The Python build pipeline (Phase 2) pre-renders these to SVG. The React app loads SVGs as images. If SVGs aren't available, `MermaidDiagram.jsx` renders client-side.

---

## Step 5: Print/Export Support

Add to existing `index.css` (already has print styles):

```css
/* Enhanced print styles for handouts */
@media print {
    .handout-mode .equation-block {
        page-break-inside: avoid;
    }
    .handout-mode .mermaid-diagram {
        page-break-inside: avoid;
        max-height: 400px;
    }
    .handout-mode h3 {
        page-break-after: avoid;
    }
}
```

---

## Decision Gates (End of Phase 5)

```bash
# Gate 1: KaTeX renders equations
npm start
# Add a test equation: <BlockMath math="E = mc^2" /> → should render formatted

# Gate 2: Mermaid client-side rendering works
# A section with mermaid code should show a diagram

# Gate 3: Pre-rendered SVGs load
# Check: public/data/diagrams/ has .svg files from Phase 2
# Diagram component should load these via <img> or innerHTML

# Gate 4: Mixed content renders inline math
# Text like "The formula $F = ma$ shows..." should render F=ma in KaTeX

# Gate 5: Print looks clean
# Ctrl+P → diagrams and equations should be visible, nav hidden
```

---

## Files Created/Modified

| File | Action |
|------|--------|
| `package.json` | Modified (add katex, react-katex) |
| `src/components/handout/HandoutRenderer.jsx` | **Created** |
| `src/components/handout/EquationBlock.jsx` | **Created** |
| `src/components/handout/MermaidDiagram.jsx` | **Created** |
| `src/components/handout/SVGDiagram.jsx` | **Created** |
| `src/components/handout/MixedContent.jsx` | **Created** |
| `src/index.css` | Modified (enhanced print styles) |
