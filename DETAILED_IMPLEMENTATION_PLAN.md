# Detailed Implementation Plan: Advanced Features

This document outlines the detailed roadmap for implementing the advanced features requested for StudyHub Grade 8: Smart Error Logging, Adaptive Learning, AI "Concept Clarifier", and Interactive Handouts.

---

## 1. "Smart" Error Logging & Diagnostics (Foundational)

**Status:** ✅ Partially Implemented (Logger Service & UI)
**Goal:** Make the app self-diagnosing so AI agents or developers can instantly fix issues.

### 1.1 Architecture
The logging system uses a centralized `Logger` service (singleton) that stores logs in memory. It supports different log levels (`INFO`, `WARN`, `ERROR`) and specialized event types (`ACTION` for user behavior, `GATE` for validation checks).

-   **Data Structure:**
    ```json
    {
      "timestamp": "2023-10-27T10:00:00.000Z",
      "level": "ERROR",
      "message": "Failed to load topic data",
      "data": { "topicId": "algebra", "error": "Network Error" }
    }
    ```

### 1.2 "Logical Choices Path" (Workflow Tracking)
**Requirement:** Track user navigation to understand context before an error.
-   **Implementation:**
    -   Instrument `TopicStudyView` to log `Logger.action('Navigation', 'Entered Topic: Algebra')`.
    -   Instrument `QuizSection` to log `Logger.action('Quiz', 'Answered Q1: Incorrect')`.
    -   **Benefit:** When an error occurs (e.g., "Image failed to load"), the log history shows *exactly* where the user was and what they did previously.

### 1.3 Logical Gates
**Requirement:** Explicit validation steps.
-   **Implementation:**
    -   **Data Gate:** On app load, validate schema of CSV/Excel data. If `SUBJECTS` column is missing -> `Logger.gate('Schema Validation', 'FAILED')`.
    -   **Navigation Gate:** Before rendering a topic, check if content exists. If empty -> `Logger.gate('Content Check', 'FAILED')` and show fallback UI.

### 1.4 UI Integration
-   **Logs Modal:** A hidden or button-activated modal (implemented) that displays these logs in a readable format with a "Copy for AI" button. This allows a non-technical user to provide a perfect bug report to an AI agent.

---

## 2. Adaptive Question Engine (High Impact)

**Goal:** Mimic Cuemath's ability to challenge students appropriately (Flow State).

### 2.1 The "Mastery Score" Algorithm
Instead of static difficulty, each user-topic pair has a `masteryScore` (0-100).

-   **Initial State:** `masteryScore = 0` (or inferred from previous topics).
-   **Update Logic:**
    -   Correct answer (Easy): +2 points
    -   Correct answer (Medium): +5 points
    -   Correct answer (Hard): +10 points
    -   Wrong answer: -2 (but never below 0)

### 2.2 Dynamic Question Selection
When a user starts a quiz session:
1.  **Fetch Questions:** Load all questions for the topic.
2.  **Filter by Difficulty:**
    -   If `masteryScore < 30`: Pool = 70% Easy, 30% Medium.
    -   If `masteryScore 30-70`: Pool = 30% Easy, 50% Medium, 20% Hard.
    -   If `masteryScore > 70`: Pool = 10% Medium, 90% Hard.
3.  **Select:** Randomly pick 5 questions from the weighted pool.

### 2.3 Gated Progression
-   **Rule:** A user cannot mark a topic as "Complete" (100% progress) until `masteryScore > 70`.
-   **UI:** The "Next Topic" button is disabled/greyed out with a message: "Reach 70% mastery to unlock."

---

## 3. Enhanced "Concept Clarifier" (AI Powered)

**Goal:** Provide specific, context-aware explanations for mistakes.

### 3.1 Google Gemini Integration
Use the existing Gemini API configuration.

### 3.2 The "Explain" Workflow
1.  User answers a question incorrectly (e.g., Q: "What is the area of a circle?", User: "2πr").
2.  UI shows "Incorrect" and reveals an "🤖 Explain Why" button.
3.  **Prompt Engineering:**
    -   Construct a prompt:
        > "The student answered '2πr' for 'Area of a circle'. The correct answer is 'πr²'. Explain the specific misconception (confusing Circumference with Area) simply for a Grade 8 student. Keep it under 2 sentences."
4.  **Display:** Show the streaming response in a localized bubble/modal next to the question.

### 3.3 "Deep Dive" Mode
-   If the user is still confused, offer a link to the specific *Section* in the Study Guide that covers this concept (mapped via `concept_tags` in the data).

---

## 4. Interactive "Handouts"

**Goal:** Move beyond static diagrams to interactive exploration.

### 4.1 Interactive SVGs (Science/Biology)
-   **Current:** Static images or Mermaid diagrams.
-   **Upgrade:** Use clickable SVG overlays.
    -   **Tool:** A wrapper component that takes an SVG and a JSON map of `{'region_id': 'explanation'}`.
    -   **Interaction:** Clicking the "Mitocondria" part of a cell diagram opens a tooltip with its specific function, rather than just reading a list below.

### 4.2 Math Graphing (Mathematics)
-   **Library:** `function-plot` (lightweight D3-based).
-   **Feature:** "Graph Explorer"
    -   Allow students to change variables in a formula like `y = mx + c`.
    -   **Sliders:** One slider for `m`, one for `c`.
    -   **Visual:** As they move the slider, the line on the graph rotates or shifts in real-time. This builds intuitive understanding of "slope" and "intercept".

### 4.3 Drag-and-Drop Labeling
-   **Activity:** A "Quiz" type where the user drags labels (e.g., "Nucleus", "Membrane") onto empty slots on a diagram.
-   **Validation:** Immediate feedback (snap to target if correct, shake if wrong).

---

## Summary of Next Steps for AI Agent

1.  **Refine Logging:** Ensure the `Logger` is capturing all critical state changes (Subject selection, Topic entry).
2.  **Implement Mastery:** Add `masteryScore` to the `StudyContext` and implement the weighted question selector in `QuizSection`.
3.  **Connect AI:** Build the `GeminiService` function to handle the "Explain Mistake" prompt structure.
