# Detailed Mini-Plan: Future Advanced Features

This document provides elaborate implementation details for the next phase of "StudyHub Grade 8". It is designed to be consumed by an AI coder or developer to implement these features without ambiguity.

---

## 1. "Smart" Error Logging & Diagnostics (Enhanced)

**Status:** ✅ Core Implemented (Logger, LogsModal, Gates).
**Next Steps:** Deepen the integration.

### 1.1 Implementation Details
*   **File:** `src/services/Logger.js` (Existing)
*   **Enhancement:** Auto-capture React Error Boundaries.
*   **Logic:**
    *   Wrap the main `App` component in a `<ErrorBoundary>` component.
    *   In `componentDidCatch(error, errorInfo)`, call `Logger.error('React Boundary', error.message, errorInfo)`.
*   **Network Interceptor:**
    *   Add a global interceptor for `fetch` (if custom wrapper used) or specific service calls (Gemini, Sheets).
    *   On 4xx/5xx response: `Logger.error('API Error', url, status)`.
*   **User Action Tracking:**
    *   Expand `Logger.action` calls to include "Time on Page" to detect if a user is stuck (e.g., > 5 mins on one question).

---

## 2. Adaptive Question Engine

**Goal:** Dynamic difficulty adjustment based on user mastery.

### 2.1 Data Structure Updates
*   **File:** `src/contexts/StudyContext.jsx` (Progress State)
*   **New Field:** `progress.topicMastery` (Object)
    ```javascript
    topicMastery: {
        "topic_id_1": {
            score: 45, // 0-100
            history: [1, 0, 1, 1, 1], // Last 5 attempts (1=correct, 0=wrong)
            level: "easy" // "easy" | "medium" | "hard"
        }
    }
    ```

### 2.2 Algorithm Logic (The "Engine")
*   **File:** `src/utils/AdaptiveEngine.js` (New File)
*   **Function:** `selectQuestions(pool, masteryScore)`
    *   **Inputs:**
        *   `pool`: Array of all Question objects for the topic.
        *   `masteryScore`: Integer 0-100.
    *   **Logic:**
        *   **Buckets:** Filter pool into `Easy`, `Medium`, `Hard` arrays based on `question.difficulty`.
        *   **Weights:**
            *   Score < 30: 70% Easy, 30% Medium, 0% Hard.
            *   Score 30-70: 30% Easy, 50% Medium, 20% Hard.
            *   Score > 70: 10% Easy, 30% Medium, 60% Hard.
        *   **Selection:** Randomly sample 5 questions based on weights.
    *   **Output:** Array of 5 Question objects.

### 2.3 Gating Component
*   **File:** `src/components/TopicStudyView.jsx`
*   **Logic:**
    *   Check `masteryScore` before enabling the "Next Topic" button.
    *   If `score < 70`: Render `Tooltip("Mastery 70% required")` over a disabled button.

---

## 3. Enhanced "Concept Clarifier" (AI Powered)

**Goal:** AI-generated specific explanations for wrong answers.

### 3.1 UI Components
*   **File:** `src/components/QuizSection/index.jsx`
*   **New State:** `explanationRequest` (Object: { questionId, status: 'idle'|'loading'|'done', text: '' })
*   **New Button:** `<button onClick={handleExplain}>Explain Why I'm Wrong 🤖</button>` (Visible only on wrong answer).

### 3.2 Service Layer
*   **File:** `src/services/geminiService.js`
*   **Function:** `explainMisconception(question, wrongAnswer, correctAnswer)`
*   **Prompt Engineering:**
    ```javascript
    const prompt = `
    Context: Grade 8 Student.
    Question: "${question.text}"
    Correct Answer: "${correctAnswer}"
    Student Answer: "${wrongAnswer}"

    Task: Explain why the student's answer is wrong and the correct logic.
    Tone: Encouraging, simple.
    Max Length: 2 sentences.
    `;
    ```

---

## 4. Interactive "Handouts"

**Goal:** Interactive visual learning tools.

### 4.1 Math: Interactive Graphing
*   **Library:** `function-plot` (npm install function-plot)
*   **Component:** `src/components/interactive/GraphExplorer.jsx`
*   **Props:** `initialFormula` (e.g., "x^2")
*   **Implementation:**
    *   Render a `<div>` container.
    *   Use `useEffect` to initialize `functionPlot`.
    *   **Controls:** Add React `<input type="range" />` sliders for variables `m` and `c` in `y = mx + c`.
    *   **Update:** On slider change, update the `data` property of `functionPlot` to redraw.

### 4.2 Science: Interactive Diagrams
*   **Data Source:** Google Sheets `STUDY_CONTENT` column `interactive_data`.
    *   Format: JSON string `{"regions": [{"id": "nucleus", "info": "Control center..."}]}`
*   **Component:** `src/components/interactive/InteractiveSVG.jsx`
*   **Implementation:**
    *   Load SVG inline.
    *   Attach `onClick` listeners to SVG paths matching `region.id`.
    *   **State:** `activeRegion` (null | string).
    *   **Render:**
        *   SVG Map.
        *   `<Tooltip>` or `<InfoPanel>` displaying `info` when a region is clicked.

---

## 5. Testing Strategy

**Goal:** Ensure reliability of these advanced features.

### 5.1 Adaptive Engine
*   **Unit Tests:**
    *   Test `selectQuestions` with various mastery scores.
    *   Assert that low mastery yields mostly easy questions.
    *   Assert that high mastery yields mostly hard questions.
    *   Assert that exactly 5 questions are returned.

### 5.2 Concept Clarifier
*   **Integration Tests:**
    *   Mock `geminiService` response.
    *   Verify "Explain" button appears on wrong answer.
    *   Verify loading state and final text display.

### 5.3 Interactive Handouts
*   **Component Tests:**
    *   Verify `GraphExplorer` renders without crashing.
    *   Verify slider changes trigger update (mock `functionPlot`).
    *   Verify `InteractiveSVG` renders regions and tooltips appear on click.
