# Phase 4: Quiz Engine Upgrade — 8 Question Types + Adaptive + FSRS

## Why This Upgrade Matters

The current quiz has only MCQ at a single difficulty. Adding assertion-reasoning, fill-in-the-blank, matching, and ordering tests higher-order thinking. FSRS spaced repetition ensures optimal review intervals. Adaptive difficulty keeps the challenge in the "flow zone."

---

## Step 1: Install ts-fsrs

```bash
npm install ts-fsrs
```

**REASONING**: FSRS is 81% more effective than SM-2 (Anki's algorithm). `ts-fsrs` is TypeScript-native, works in React, state fits in localStorage. Replaces the simplified SM-2 in `StudyContext.jsx`.

---

## Step 2: Unified Question CSV Schema

Main `questions.csv` handles MCQ, FILL_BLANK, TRUE_FALSE_JUSTIFY, ASSERT_REASON:

```csv
question_id,topic_id,question_type,bloom_level,difficulty,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,hint_1,hint_2,hint_3,xp_reward
Q001,phys-t1,MCQ,2,1,"What property determines inertia?",Volume,Mass,Weight,Velocity,B,"Mass is a direct measure of inertia.","Think about heavy vs light","Which is harder to push?","",10
Q002,phys-t1,FILL_BLANK,1,1,"The tendency to resist motion changes is _____.",,,,,inertia,"Inertia resists changes in motion.","Starts with I","Latin for laziness","",10
Q003,phys-t1,TRUE_FALSE_JUSTIFY,4,2,"A moving object stops on its own without force.",,,,,False,"Newton's 1st Law: objects in motion stay in motion.","Think about space","Frictionless ice?","",15
Q004,phys-t1,ASSERT_REASON,5,3,"A: A feather falls slower.|R: Heavier objects have more gravity.",Both true; R explains A,Both true; R does NOT explain A,A true; R false,A false; R true,B,"Air resistance causes difference not gravity.","What slows the feather?","Imagine a vacuum","",20
```

Matching and Ordering use separate CSVs. Categorize and Diagram use JSON (see `{topic_id}-rich.json`).

---

## Step 3: Component Structure

```
src/components/quiz/
├── QuizEngine.jsx            ← Main controller
├── QuestionRouter.jsx        ← Routes question_type → renderer
├── MCQQuestion.jsx
├── FillBlankQuestion.jsx     ← Text input + fuzzy matching
├── TrueFalseJustify.jsx
├── AssertReasonQuestion.jsx
├── MatchingQuestion.jsx      ← Drag-and-drop
├── OrderingQuestion.jsx      ← Drag-and-drop
├── CategorizeQuestion.jsx
├── DiagramQuestion.jsx       ← SVG/image + overlay
├── ProgressiveHints.jsx      ← 3-tier hint system
└── QuizResults.jsx           ← Score + FSRS scheduling
```

### QuestionRouter.jsx

```jsx
import React from 'react';
import { Logger } from '../../services/Logger';
import MCQQuestion from './MCQQuestion';
import FillBlankQuestion from './FillBlankQuestion';
// ... other imports

const QUESTION_MAP = {
    MCQ: MCQQuestion,
    FILL_BLANK: FillBlankQuestion,
    TRUE_FALSE_JUSTIFY: TrueFalseJustify,
    ASSERT_REASON: AssertReasonQuestion,
    MATCHING: MatchingQuestion,
    ORDERING: OrderingQuestion,
    CATEGORIZE: CategorizeQuestion,
    DIAGRAM: DiagramQuestion,
};

export default function QuestionRouter({ question, onAnswer, showHints, darkMode }) {
    const type = (question.question_type || 'MCQ').toUpperCase();
    const Component = QUESTION_MAP[type];

    if (!Component) {
        Logger.warn('Unknown question_type, falling back to MCQ', { type });
        const Fallback = question.option_a ? MCQQuestion : FillBlankQuestion;
        return <Fallback question={question} onAnswer={onAnswer} darkMode={darkMode} />;
    }

    return <Component question={question} onAnswer={onAnswer} showHints={showHints} darkMode={darkMode} />;
}
```

### FillBlankQuestion.jsx (key new type)

```jsx
/**
 * REASONING: Fill-in-the-blank eliminates guessing. Levenshtein distance <= 2
 * tolerates minor typos like "innertia" vs "inertia".
 */
import React, { useState } from 'react';
import ProgressiveHints from './ProgressiveHints';
import { cn } from '../../utils';

export default function FillBlankQuestion({ question, onAnswer, showHints, darkMode }) {
    const [input, setInput] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const checkAnswer = () => {
        const user = input.trim().toLowerCase();
        const correct = String(question.correct_answer).trim().toLowerCase();
        const isExact = user === correct;
        const isClose = !isExact && levenshtein(user, correct) <= 2;
        setSubmitted(true);
        onAnswer({ isCorrect: isExact || isClose, isClose, userAnswer: input.trim() });
    };

    const parts = question.question_text.split('_____');

    return (
        <div className="space-y-4">
            <p className="text-lg">
                {parts[0]}
                <input
                    type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !submitted && checkAnswer()}
                    disabled={submitted}
                    className="border-b-2 border-blue-500 px-2 py-1 bg-transparent outline-none min-w-[120px]"
                    placeholder="your answer" autoFocus
                />
                {parts[1] || ''}
            </p>
            {!submitted && (
                <button onClick={checkAnswer} disabled={!input.trim()}
                    className={cn("px-6 py-2 rounded-lg font-medium",
                        input.trim() ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500"
                    )}>
                    Check Answer
                </button>
            )}
            {showHints && !submitted && (
                <ProgressiveHints hints={[question.hint_1, question.hint_2, question.hint_3].filter(Boolean)} />
            )}
        </div>
    );
}

function levenshtein(a, b) {
    const m = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) m[0][i] = i;
    for (let j = 0; j <= b.length; j++) m[j][0] = j;
    for (let j = 1; j <= b.length; j++)
        for (let i = 1; i <= a.length; i++)
            m[j][i] = Math.min(m[j][i-1]+1, m[j-1][i]+1, m[j-1][i-1]+(a[i-1]===b[j-1]?0:1));
    return m[b.length][a.length];
}
```

### ProgressiveHints.jsx

```jsx
/**
 * REASONING: 3-tier hints with XP penalty. Scaffolding principle: support fades
 * as competence grows. Hint 1 = -20% XP, Hint 2 = -40%, Hint 3 = -60%.
 */
import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';

export default function ProgressiveHints({ hints, onHintUsed, darkMode }) {
    const [revealed, setRevealed] = useState(0);
    if (!hints || hints.length === 0) return null;

    const labels = ['Conceptual Hint', 'Key Principle', 'Specific Setup'];

    return (
        <div className="space-y-2">
            {hints.slice(0, revealed).map((hint, i) => (
                <div key={i} className="p-2 rounded-lg text-sm bg-amber-50 text-amber-800 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5" />
                    <span><strong>{labels[i]}:</strong> {hint}</span>
                </div>
            ))}
            {revealed < hints.length && (
                <button onClick={() => { setRevealed(r => r + 1); onHintUsed?.(revealed + 1); }}
                    className="text-sm text-amber-600 hover:bg-amber-100 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Show hint ({revealed + 1}/{hints.length})
                    <span className="text-xs opacity-70 ml-1">(-{(revealed + 1) * 20}% XP)</span>
                </button>
            )}
        </div>
    );
}
```

---

## Step 4: FSRS Integration in StudyContext.jsx

```javascript
// Add at top of StudyContext.jsx:
import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';

const fsrsInstance = fsrs(generatorParameters({ enable_fuzz: true }));

// Replace existing scheduleReview with:
const scheduleReviewFSRS = useCallback((questionId, rating) => {
    // rating: Rating.Again(1), Rating.Hard(2), Rating.Good(3), Rating.Easy(4)
    const existing = savedData.progress.reviewSchedule?.[questionId];
    const card = existing?.card ? existing.card : createEmptyCard(new Date());

    const scheduling = fsrsInstance.repeat(card, new Date());
    const chosen = scheduling[rating];

    updateProgress({
        reviewSchedule: {
            ...(savedData.progress.reviewSchedule || {}),
            [questionId]: {
                card: chosen.card,
                nextReview: chosen.card.due,
                log: chosen.log
            }
        }
    });
    Logger.action('FSRS Review Scheduled', { questionId, rating, nextDue: chosen.card.due });
}, [savedData, updateProgress]);

// Migration from old SM-2 format (run once):
useEffect(() => {
    const schedule = savedData.progress.reviewSchedule || {};
    const needsMigration = Object.values(schedule).some(v => v.easeFactor !== undefined);
    if (needsMigration) {
        Logger.info('Migrating SM-2 → FSRS');
        const migrated = {};
        Object.entries(schedule).forEach(([qId, data]) => {
            migrated[qId] = data.easeFactor !== undefined
                ? { card: createEmptyCard(new Date()), nextReview: new Date(), log: null }
                : data;
        });
        updateProgress({ reviewSchedule: migrated });
        Logger.gate('FSRS Migration', true);
    }
}, []);
```

---

## Step 5: Updated Adaptive Engine

```javascript
// src/utils/AdaptiveEngine.js — add this function alongside existing ones

export const selectAdaptiveQuestions = (pool, masteryScore, reviewsDue = [], count = 5) => {
    // Prioritize FSRS review-due questions (up to 2)
    const due = pool.filter(q => reviewsDue.includes(q.question_id)).slice(0, 2);
    const fresh = pool.filter(q => !reviewsDue.includes(q.question_id));

    // Select fresh questions by proximity to target difficulty
    const target = masteryScore < 20 ? 1 : masteryScore < 40 ? 2 : masteryScore < 60 ? 3 : masteryScore < 80 ? 4 : 5;
    const scored = fresh.map(q => ({ q, dist: Math.abs((q.difficulty || 2) - target) }));
    scored.sort((a, b) => a.dist - b.dist);

    const selected = [...due, ...scored.slice(0, count - due.length).map(s => s.q)];
    return selected.sort(() => 0.5 - Math.random()); // Shuffle
};

export function calculateXP(question, hintsUsed = 0, isFirstTry = true) {
    const base = parseInt(question.xp_reward) || 10;
    const diffMult = 1 + ((question.difficulty || 1) - 1) * 0.25;
    const bloomMult = 1 + ((question.bloom_level || 1) - 1) * 0.1;
    let xp = base * diffMult * bloomMult;
    xp *= Math.max(0.2, 1 - hintsUsed * 0.2); // Hint penalty
    if (isFirstTry) xp *= 1.25;                // First-try bonus
    return Math.round(xp);
}
```

---

## Decision Gates (End of Phase 4)

```bash
# Gate 1: ts-fsrs works
node -e "const { createEmptyCard } = require('ts-fsrs'); console.log('OK');"

# Gate 2: All new components render without errors
npm start  # Navigate to quiz

# Gate 3: FSRS migration preserves data
# Check localStorage → reviewSchedule has card objects

# Gate 4: Legacy MCQ questions still work
# Old questions from questionnaire/ CSV render as MCQ

# Gate 5: Tests pass
npm test -- --watchAll=false
```
