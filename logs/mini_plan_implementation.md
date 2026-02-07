# Mini Plan Implementation Log

## Data Structures

### Adaptive Question Engine
*   **StudyContext state.progress.topicMastery**:
    ```javascript
    {
      [topicId]: {
        score: number, // 0-100, moving average
        history: number[], // 0 or 1 for last 5 attempts
        level: 'easy' | 'medium' | 'hard'
      }
    }
    ```

### Interactive Handouts
*   **Content Object (Interactive)**:
    ```javascript
    {
      type: 'interactive_graph' | 'interactive_diagram',
      interactiveData: {
        // Graph
        formula: string,
        variables: [{ name: string, min: number, max: number, default: number }]
        // Diagram
        svgUrl: string,
        regions: [{ id: string, info: string }]
      }
    }
    ```

## Component Interfaces

### ErrorBoundary
*   **Props**: `children`
*   **State**: `hasError`, `error`

### GraphExplorer
*   **Props**: `initialFormula` (string), `variables` (Array)

### InteractiveSVG
*   **Props**: `svgUrl` (string), `regions` (Array)

## AI Fallback (DDG)
If `geminiService` is unavailable or API key is missing, fallback to DuckDuckGo search or a hardcoded "Check your textbook" message, but the user specifically requested "robust DDG logic". I will check if `duck-duck-scrape` is available (it is in package.json).
