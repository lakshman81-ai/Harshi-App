# System Benchmark & Verification Suite

This document defines the "Gold Standard" for testing the EdTech Platform (StudyHub). It covers pedagogical logic, content rendering, performance, and safety.

**Use this guide to:**
1.  Verify the integrity of the Adaptive Learning Engine.
2.  Ensure Content Rendering (Math, Diagrams, Media) is robust.
3.  Benchmark system reaction times.
4.  Ensure Safety & Privacy compliance.

---

## 1. Benchmark Scenarios (The "Mock Suite")

The `scripts/edtech_benchmark.js` script implements these exact scenarios.

### **Category A: Pedagogical Logic**

| ID | Scenario | Description | Target Outcome |
| :--- | :--- | :--- | :--- |
| **FLOW_01** | **The Prodigy** | User answers 5 questions correctly in a row. | Difficulty Level increments (e.g., Easy -> Medium). |
| **STRUGGLE_01** | **The Stuck Student** | User answers a question incorrectly twice. | System offers a "Hint" or breaks the problem into steps. |
| **MISCON_01** | **Misconception Navigation** | User selects a specific wrong answer (distractor). | System provides targeted feedback/remedial content for that misconception. |

### **Category B: Content Rendering**

| ID | Scenario | Input Content | Target Outcome |
| :--- | :--- | :--- | :--- |
| **RENDER_01** | **Equations** | LaTeX Equation: `x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}` | Equation renders correctly (visual check or DOM element presence). |
| **RENDER_02** | **Diagrams** | Mermaid Code: `graph TD; A-->B;` | Diagram renders as SVG without errors. |
| **RENDER_03** | **Media** | YouTube URL, PDF URL, Image URL. | Media players/viewers load successfully (iframe/img present). |

### **Category C: System Performance**

| ID | Scenario | Condition | Target Outcome |
| :--- | :--- | :--- | :--- |
| **PERF_01** | **Reaction Time** | Time from "Submit Answer" to "Feedback Display". | < 200ms. |

### **Category D: Safety & Privacy**

| ID | Scenario | Input Text | Target Outcome |
| :--- | :--- | :--- | :--- |
| **SAFE_01** | **PII Filter** | User types a phone number in a chat/input field. | Input is masked (e.g., `***-***`) or blocked. |

---

## 2. How to Run the Benchmark

We have created a standalone runner that mocks the core logic components to verify their behavior.

1.  **Open Terminal** in the project root.
2.  **Execute:**
    ```bash
    node scripts/edtech_benchmark.js
    ```
3.  **Interpret Results:**
    *   **PASS:** Logic behaves exactly as defined in the scenarios.
    *   **FAIL:** The implementation needs adjustment.

---

## 3. Continuous Improvement

*   **Quarterly Review:** Run this benchmark every 3 months.
*   **New Content Types:** If a new content type (e.g., "3D Models") is added, create a **RENDER_04** scenario to verify it renders correctly.
