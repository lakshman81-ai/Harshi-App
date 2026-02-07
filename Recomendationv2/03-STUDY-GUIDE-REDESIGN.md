# Phase 3: Study Guide Redesign — Bloom's Taxonomy + Scaffolding

## Why This Redesign Matters

The current study guide has only key terms and formulas. Research shows that **scaffolded content** — progressing from vocabulary to worked examples to misconception correction — dramatically improves retention. This phase adds six structured section types, each targeting a specific Bloom's taxonomy level, and introduces concept bridges that connect topics.

**This phase modifies React components only.** Data comes from the JSON files created in Phase 1-2.

---

## New Section Types (Ordered by Cognitive Demand)

| Order | Section Type | Bloom's Level | Icon | Purpose |
|-------|-------------|---------------|------|---------|
| 1 | `vocabulary` | 1 (Remember) | BookOpen | Key terms with definitions, context, related terms |
| 2 | `concept_clarifier` | 2 (Understand) | Lightbulb | Explanation + analogy + real-world connection |
| 3 | `worked_example` | 3 (Apply) | Target | Step-by-step problem solving |
| 4 | `misconception_alert` | 4 (Analyze) | AlertTriangle | Common mistakes + why they're wrong |
| 5 | `practice_zone` | 3-4 (Apply/Analyze) | HelpCircle | Interactive practice with progressive hints |
| 6 | `concept_bridge` | 5 (Evaluate) | Globe | Connections to other topics |

**REASONING**: Bloom's taxonomy provides a proven framework for ordering content from simple to complex. A Grade 9 student who reads vocabulary first, then sees the concept explained with an analogy, then watches a worked example, then learns what NOT to do — this sequence mirrors how expert tutors teach.

---

## Step 1: Create Section Renderer Components

Each section type gets its own React component. Create these in `src/components/studyguide/`.

### File Structure

```
src/components/studyguide/
├── StudyGuideRenderer.jsx      ← Main router: reads section_type → renders correct component
├── VocabularySection.jsx       ← Flashcard-style term display
├── ConceptClarifier.jsx        ← Explanation with analogy panel
├── WorkedExample.jsx           ← Step-by-step with expandable steps
├── MisconceptionAlert.jsx      ← Warning-styled misconception cards
├── PracticeZone.jsx            ← Interactive practice with hints
└── ConceptBridge.jsx           ← Cross-topic connection cards
```

### `StudyGuideRenderer.jsx` — Section Router

```jsx
/**
 * StudyGuideRenderer.jsx
 * Routes each section to its specialized renderer based on section_type.
 *
 * REASONING: A single router component keeps the rendering logic centralized.
 * Adding new section types later means adding one case here + one component file.
 * This follows the existing pattern in Grade8_StudyHub_Complete.js where sections
 * are mapped from data.
 *
 * ALIGNMENT: Uses the same `useStudy()` context and Tailwind classes as existing code.
 */

import React from 'react';
import { Logger } from '../../services/Logger';
import VocabularySection from './VocabularySection';
import ConceptClarifier from './ConceptClarifier';
import WorkedExample from './WorkedExample';
import MisconceptionAlert from './MisconceptionAlert';
import PracticeZone from './PracticeZone';
import ConceptBridge from './ConceptBridge';

const SECTION_MAP = {
    vocabulary: VocabularySection,
    concept_clarifier: ConceptClarifier,
    worked_example: WorkedExample,
    misconception_alert: MisconceptionAlert,
    practice_zone: PracticeZone,
    concept_bridge: ConceptBridge,
    // Legacy types from existing CSV data — render as plain text
    content: GenericSection,
    formulas: FormulaSection,
    text: GenericSection,
};

export default function StudyGuideRenderer({ sections, topicId, darkMode }) {
    if (!sections || sections.length === 0) {
        Logger.warn('StudyGuideRenderer: No sections to render', { topicId });
        return <p className="text-gray-500 italic p-4">No study content available yet.</p>;
    }

    // Sort by order_index, then by bloom_level as tiebreaker
    const sorted = [...sections].sort((a, b) => {
        const orderDiff = (a.order_index || 0) - (b.order_index || 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.bloom_level || 0) - (b.bloom_level || 0);
    });

    return (
        <div className="space-y-6">
            {sorted.map((section, index) => {
                const Component = SECTION_MAP[section.section_type] || GenericSection;

                // Log unknown section types (helps catch data issues)
                if (!SECTION_MAP[section.section_type]) {
                    Logger.warn('Unknown section_type', {
                        type: section.section_type,
                        sectionId: section.section_id
                    });
                }

                return (
                    <div key={section.section_id || index} className="animate-fade-in">
                        <Component
                            section={section}
                            darkMode={darkMode}
                            topicId={topicId}
                            sectionIndex={index}
                        />
                    </div>
                );
            })}
        </div>
    );
}

// Fallback for unknown/legacy section types
function GenericSection({ section, darkMode }) {
    const content = section.content;
    const text = typeof content === 'string' ? content :
                 typeof content === 'object' && content.text ? content.text :
                 JSON.stringify(content);

    return (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{text}</p>
        </div>
    );
}

// Formula display (integrates with existing formula rendering)
function FormulaSection({ section, darkMode }) {
    const equations = section.content?.equations || [];

    return (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} shadow-sm`}>
            <h3 className="font-semibold text-lg mb-3">{section.title || 'Key Formulas'}</h3>
            <div className="space-y-3">
                {equations.map((eq, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <code className="text-lg font-mono bg-white px-3 py-1 rounded">
                            {eq.latex || eq.formula || ''}
                        </code>
                        {eq.label && <span className="text-sm text-gray-500">— {eq.label}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### `VocabularySection.jsx` — Flashcard-Style Terms

```jsx
/**
 * VocabularySection.jsx
 * Displays key terms with definitions and optional flashcard flip.
 *
 * REASONING: Vocabulary is Bloom's Level 1 (Remember). Presenting terms as
 * interactive cards with tap-to-reveal encourages active recall rather than
 * passive reading. This is a proven study technique (Kornell 2009).
 *
 * DATA FORMAT: section.content = [{ term, definition, context, related_terms }]
 */

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '../../utils';

export default function VocabularySection({ section, darkMode }) {
    const terms = Array.isArray(section.content) ? section.content : [];
    const [flippedCards, setFlippedCards] = useState(new Set());

    const toggleCard = (index) => {
        setFlippedCards(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    return (
        <div className={cn("p-4 rounded-xl shadow-sm", darkMode ? "bg-gray-800" : "bg-amber-50")}>
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-lg">{section.title || 'Key Vocabulary'}</h3>
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    darkMode ? "bg-amber-900 text-amber-200" : "bg-amber-200 text-amber-800"
                )}>
                    Bloom's Level 1
                </span>
            </div>

            <p className="text-sm text-gray-500 mb-3">
                Tap a term to reveal its definition. Try to recall it first!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {terms.map((term, i) => (
                    <button
                        key={i}
                        onClick={() => toggleCard(i)}
                        className={cn(
                            "text-left p-3 rounded-lg transition-all duration-200",
                            "border-2 cursor-pointer",
                            flippedCards.has(i)
                                ? (darkMode ? "bg-gray-700 border-amber-500" : "bg-white border-amber-400")
                                : (darkMode ? "bg-gray-750 border-gray-600" : "bg-amber-100 border-amber-200"),
                            "hover:shadow-md"
                        )}
                    >
                        <div className="font-medium text-amber-700 dark:text-amber-300">
                            {term.term}
                        </div>

                        {flippedCards.has(i) && (
                            <div className="mt-2 space-y-1">
                                <p className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                                    {term.definition}
                                </p>
                                {term.context && (
                                    <p className="text-xs text-gray-500 italic">
                                        Example: {term.context}
                                    </p>
                                )}
                                {term.related_terms && term.related_terms.length > 0 && (
                                    <p className="text-xs text-gray-400">
                                        Related: {term.related_terms.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}

                        {!flippedCards.has(i) && (
                            <p className="text-xs text-gray-400 mt-1">Tap to reveal →</p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
```

### `MisconceptionAlert.jsx` — Common Mistakes

```jsx
/**
 * MisconceptionAlert.jsx
 * Displays common misconceptions with WHY they're wrong.
 *
 * REASONING: Harvard research (ABLConnect) shows simply telling students the
 * correct answer doesn't fix misconceptions — you must explicitly name the
 * wrong belief, explain WHY it's wrong, then provide the correct understanding.
 * The diagnostic question checks if the student held the misconception.
 *
 * DATA FORMAT: section.content = [{
 *   misconception, why_wrong, correct_understanding, diagnostic_question
 * }]
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../utils';

export default function MisconceptionAlert({ section, darkMode }) {
    const alerts = Array.isArray(section.content) ? section.content : [];

    return (
        <div className={cn("p-4 rounded-xl shadow-sm", darkMode ? "bg-gray-800" : "bg-red-50")}>
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-lg">Common Mistakes</h3>
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    darkMode ? "bg-red-900 text-red-200" : "bg-red-200 text-red-800"
                )}>
                    Bloom's Level 4
                </span>
            </div>

            <div className="space-y-4">
                {alerts.map((alert, i) => (
                    <MisconceptionCard key={i} alert={alert} darkMode={darkMode} index={i} />
                ))}
            </div>
        </div>
    );
}

function MisconceptionCard({ alert, darkMode, index }) {
    const [showCorrection, setShowCorrection] = useState(false);
    const [diagnosticAnswer, setDiagnosticAnswer] = useState(null);

    return (
        <div className={cn(
            "rounded-lg overflow-hidden border",
            darkMode ? "border-red-800 bg-gray-750" : "border-red-200 bg-white"
        )}>
            {/* The Misconception */}
            <div className={cn("p-3", darkMode ? "bg-red-900/30" : "bg-red-100")}>
                <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-sm text-red-700 dark:text-red-300">
                            ❌ Common Belief: "{alert.misconception}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Why It's Wrong + Correct Understanding */}
            {!showCorrection ? (
                <div className="p-3">
                    <button
                        onClick={() => setShowCorrection(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Think about why this might be wrong, then click to reveal →
                    </button>
                </div>
            ) : (
                <div className="p-3 space-y-3">
                    <div>
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Why This Is Wrong</p>
                        <p className={cn("text-sm mt-1", darkMode ? "text-gray-300" : "text-gray-700")}>
                            {alert.why_wrong}
                        </p>
                    </div>
                    <div className={cn("p-2 rounded", darkMode ? "bg-emerald-900/30" : "bg-emerald-50")}>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                    Correct Understanding
                                </p>
                                <p className={cn("text-sm mt-1", darkMode ? "text-gray-300" : "text-gray-700")}>
                                    {alert.correct_understanding}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Diagnostic Question */}
                    {alert.diagnostic_question && (
                        <div className={cn("p-2 rounded border", darkMode ? "border-gray-600" : "border-gray-200")}>
                            <p className="text-sm font-medium">🧪 Quick Check:</p>
                            <p className="text-sm italic mt-1">{alert.diagnostic_question}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
```

### `ConceptBridge.jsx` — Cross-Topic Connections

```jsx
/**
 * ConceptBridge.jsx
 * Shows how the current topic connects to other topics.
 *
 * REASONING: Students learn isolated facts that they can't connect. Concept bridges
 * explicitly show "X in Physics is like Y in Math" or "You need Topic A before Topic B".
 * This builds integrated knowledge networks rather than silos.
 *
 * DATA FORMAT: section.content = [{
 *   from_topic, to_topic, bridge_type, bridge_text, why_connected
 * }]
 * bridge_type: 'prerequisite' | 'analogy' | 'application' | 'contrast'
 */

import React from 'react';
import { Globe, ArrowRight, Lightbulb, AlertTriangle, Wrench, Layers } from 'lucide-react';
import { cn } from '../../utils';

const BRIDGE_STYLES = {
    prerequisite: {
        icon: Layers,
        label: 'Foundation',
        color: 'blue',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800'
    },
    analogy: {
        icon: Lightbulb,
        label: 'Similar Concept',
        color: 'amber',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800'
    },
    application: {
        icon: Wrench,
        label: 'Used In',
        color: 'emerald',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800'
    },
    contrast: {
        icon: AlertTriangle,
        label: 'Don\'t Confuse With',
        color: 'red',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
    }
};

export default function ConceptBridge({ section, darkMode }) {
    const bridges = Array.isArray(section.content) ? section.content : [];

    return (
        <div className={cn("p-4 rounded-xl shadow-sm", darkMode ? "bg-gray-800" : "bg-indigo-50")}>
            <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-lg">{section.title || 'Connected Concepts'}</h3>
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    darkMode ? "bg-indigo-900 text-indigo-200" : "bg-indigo-200 text-indigo-800"
                )}>
                    Bloom's Level 5
                </span>
            </div>

            <div className="space-y-3">
                {bridges.map((bridge, i) => {
                    const style = BRIDGE_STYLES[bridge.bridge_type] || BRIDGE_STYLES.analogy;
                    const Icon = style.icon;

                    return (
                        <div key={i} className={cn("p-3 rounded-lg border", style.bg, style.border)}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 text-${style.color}-600`} />
                                <span className={`text-xs font-semibold text-${style.color}-600 uppercase tracking-wide`}>
                                    {style.label}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                <span>{bridge.from_topic}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>{bridge.to_topic}</span>
                            </div>

                            <p className={cn("text-sm", darkMode ? "text-gray-300" : "text-gray-700")}>
                                {bridge.bridge_text}
                            </p>

                            {bridge.why_connected && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                    💡 {bridge.why_connected}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

---

## Step 2: CSV Schemas for Flat Study Guide Data

For content that's easy to bulk-edit in Google Sheets, keep CSV files in `/public/data/study-guide/`.

### `vocabulary.csv`

```csv
topic_id,term,definition,context,related_terms,difficulty_level
phys-t1,Inertia,"Resistance of an object to any change in its velocity","A heavy truck has more inertia than a bicycle","mass|momentum",1
phys-t1,Force,"A push or pull on an object resulting from interaction","Kicking a ball applies force to it","net force|Newton",1
```

### `misconception-alerts.csv`

```csv
topic_id,misconception,why_wrong,correct_understanding,diagnostic_question,bloom_level
phys-t1,"Heavier objects fall faster","In a vacuum all objects fall at the same rate. Air resistance causes differences.","Gravitational acceleration g≈9.8 m/s² is the same for all objects.","A bowling ball and feather are dropped in a vacuum. Which hits ground first?",4
phys-t1,"A force is needed to keep an object moving","Objects in motion stay in motion unless acted on by an unbalanced force (Newton's 1st Law).","An object on a frictionless surface would slide forever without any push.","If you slide a hockey puck on perfect ice with no friction what happens?",4
```

### `concept-bridges.csv`

```csv
from_topic_id,to_topic_id,bridge_type,bridge_text,why_connected
phys-t1,math-t1,application,"Newton's Second Law (F=ma) uses algebraic manipulation to solve for unknown variables","You'll rearrange F=ma the same way you rearrange algebraic expressions"
phys-t1,phys-t2,prerequisite,"Understanding force from Newton's Laws is needed before studying Work (W=F×d)","Work is defined as force applied over a distance — you need to understand force first"
phys-t2,chem-t1,analogy,"Kinetic energy of particles in physics is like thermal energy in chemistry's atomic model","Both describe how fast particles move — physics calls it KE and chemistry calls it temperature"
```

---

## Step 3: Integration with Existing Grade8_StudyHub_Complete.js

The existing main component reads sections from `DataContext`. The new `StudyGuideRenderer` should be called wherever sections are currently rendered.

```jsx
// In the topic view section of Grade8_StudyHub_Complete.js (or equivalent)
// BEFORE (current pattern):
{sections[topic.id]?.map(section => (
    <div key={section.id}>
        <h3>{section.title}</h3>
        {/* ... existing rendering ... */}
    </div>
))}

// AFTER (new pattern — drop-in replacement):
import StudyGuideRenderer from './components/studyguide/StudyGuideRenderer';

// In the render:
<StudyGuideRenderer
    sections={topicContent?.sections || sections[topic.id] || []}
    topicId={topic.id}
    darkMode={settings.darkMode}
/>
```

**CRITICAL**: The `StudyGuideRenderer` handles BOTH new JSON sections AND legacy CSV-loaded sections via `GenericSection` fallback. This means you can swap it in immediately without breaking existing topics that haven't been migrated yet.

---

## Step 4: Load Concept Bridges and Misconceptions from CSV

Add to `dataLoaderV2.js`:

```javascript
export async function loadGlobalStudyGuideData() {
    const [vocabulary, misconceptions, bridges] = await Promise.all([
        fetchCSVPapa('data/study-guide/vocabulary.csv'),
        fetchCSVPapa('data/study-guide/misconception-alerts.csv'),
        fetchCSVPapa('data/study-guide/concept-bridges.csv'),
    ]);

    return {
        vocabulary: groupByTopicId(vocabulary),
        misconceptions: groupByTopicId(misconceptions),
        bridges: groupByTopicId(bridges, 'from_topic_id'),
    };
}

function groupByTopicId(rows, keyField = 'topic_id') {
    const grouped = {};
    rows.forEach(row => {
        const key = row[keyField];
        if (!key) return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });
    return grouped;
}
```

---

## Decision Gates (End of Phase 3)

```bash
# Gate 1: All new components render without errors
npm start
# Navigate to any topic — should see section cards in order

# Gate 2: Legacy sections still work
# Topics that haven't been migrated to JSON should show GenericSection

# Gate 3: Vocabulary tap-to-reveal works
# Click a term card → definition appears

# Gate 4: Misconception reveal works
# Click "reveal" → shows why_wrong + correct_understanding

# Gate 5: No console errors
# Browser DevTools → Console should show no red errors
```

---

## Files Created/Modified

| File | Action |
|------|--------|
| `src/components/studyguide/StudyGuideRenderer.jsx` | **Created** |
| `src/components/studyguide/VocabularySection.jsx` | **Created** |
| `src/components/studyguide/ConceptClarifier.jsx` | **Created** |
| `src/components/studyguide/WorkedExample.jsx` | **Created** |
| `src/components/studyguide/MisconceptionAlert.jsx` | **Created** |
| `src/components/studyguide/PracticeZone.jsx` | **Created** |
| `src/components/studyguide/ConceptBridge.jsx` | **Created** |
| `public/data/study-guide/vocabulary.csv` | **Created** |
| `public/data/study-guide/misconception-alerts.csv` | **Created** |
| `public/data/study-guide/concept-bridges.csv` | **Created** |
| `src/services/dataLoaderV2.js` | **Modified** (add loadGlobalStudyGuideData) |
| `Grade8_StudyHub_Complete.js` | **Modified** (swap in StudyGuideRenderer) |
