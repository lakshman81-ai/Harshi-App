# StudyHub Grade 9 — Master Implementation Plan

## Purpose

This document is the **index and coordination guide** for an AI coding agent (Claude Code, Cursor, or similar) implementing enhancements to StudyHub — a React-based educational app for a Grade 9 student. The app is hosted on GitHub Pages (static only). Content generation scripts run locally on a developer PC (Python 3.10+, Node.js 18+).

## Why This Plan Exists

AI coding agents drift when given large tasks without structure. Each mini-plan below is a **self-contained unit of work** with clear inputs, outputs, decision gates, and fallback strategies. Follow them in order — each builds on the previous.

---

## Current Architecture (DO NOT BREAK)

```
StudyHub/
├── public/
│   ├── questionnaire/{Subject}/{topic_id}/questions.csv   ← Quiz data
│   ├── studyguide/{Subject}/{Topic_Folder}/content.csv    ← Study content
│   ├── Handout/{Subject}/{Topic_Folder}/handout.csv        ← Handout data
│   └── data/StudyHub_Master.xlsx                           ← Legacy Excel
├── src/
│   ├── App.js                        ← Entry point, renders Grade8StudyHub
│   ├── Grade8_StudyHub_Complete.js   ← Main component (large file)
│   ├── config.js                     ← Google Sheets config
│   ├── constants.js                  ← Icons, helpers, XP calculations
│   ├── utils.js                      ← cn(), log()
│   ├── contexts/
│   │   ├── DataContext.jsx           ← Data loading (CSV-first, Excel fallback)
│   │   └── StudyContext.jsx          ← Student progress, settings, localStorage
│   ├── services/
│   │   ├── csvService.js             ← CSV fetch + parse (custom parser)
│   │   ├── unifiedDataService.js     ← CSV-first with Excel fallback
│   │   ├── DataTransformer.js        ← Raw → app data transformation
│   │   ├── GoogleSheetsService.js    ← Google Sheets API
│   │   ├── geminiService.js          ← AI explanations (Gemini + DuckDuckGo fallback)
│   │   ├── ExcelExporter.js          ← Excel export
│   │   ├── ContentGenerator.js       ← Template-based content generation
│   │   └── Logger.js                 ← Structured logging
│   ├── hooks/useAppSettings.js       ← API key + settings management
│   └── utils/
│       ├── AdaptiveEngine.js         ← Question selection by mastery
│       └── SoundManager.js           ← Audio feedback
```

### Key Patterns the Agent MUST Follow

1. **Data flow**: CSV files in `/public/` → `csvService.js` → `unifiedDataService.js` → `DataTransformer.js` → `DataContext.jsx` → Components
2. **State**: All student progress lives in `localStorage` via `StudyContext.jsx` (key: `studyhub_v6_data`)
3. **Styling**: Tailwind CSS utility classes, dark mode via `class` strategy
4. **Logging**: Use `Logger.info/warn/error/action/gate()` from `src/services/Logger.js`
5. **Error handling**: Always try/catch with Logger, always provide fallback data
6. **No backend**: GitHub Pages = static only. All generation happens in Python build scripts.

---

## Implementation Sequence

Execute these plans **in order**. Each produces testable output before moving to the next.

| Phase | Plan File | What It Does | Depends On |
|-------|-----------|-------------|------------|
| 1 | `01-DATA-FORMAT-MIGRATION.md` | Migrate to hybrid CSV+JSON, add Papa Parse, new folder structure | Nothing |
| 2 | `02-CONTENT-PIPELINE-PYTHON.md` | Python scripts for summarization, question gen, diagram gen | Phase 1 |
| 3 | `03-STUDY-GUIDE-REDESIGN.md` | New study guide sections (Bloom's, misconceptions, bridges) | Phase 1 |
| 4 | `04-QUIZ-ENGINE-UPGRADE.md` | 8 question types, adaptive difficulty, FSRS spaced repetition | Phase 1 |
| 5 | `05-HANDOUT-RENDERING.md` | KaTeX equations, Mermaid diagrams, SVG pipeline | Phase 1, 2 |
| 6 | `06-GAMIFICATION-POLISH.md` | Enhanced XP, badges, streaks, Bloom's radar chart | Phase 3, 4 |

---

## Global Rules for Every Plan

### Decision Gates

Before starting ANY plan, verify:
- [ ] `npm start` runs without errors
- [ ] Existing CSV data loads in the browser
- [ ] `localStorage` data is preserved (never clear `studyhub_v6_data` without migration)
- [ ] All existing tests pass: `npm test -- --watchAll=false`

### Error Logging Pattern (use everywhere)

```javascript
// GOOD: Structured logging with fallback
try {
    const data = await someOperation();
    Logger.gate('Operation Name', true);
    return data;
} catch (error) {
    Logger.error('Operation Name Failed', error);
    Logger.gate('Operation Name', false);
    // ALWAYS provide fallback
    return fallbackData;
}
```

### File Naming Conventions

- Python scripts: `snake_case.py` in `/scripts/`
- React components: `PascalCase.jsx` in `/src/components/`
- Services: `camelCase.js` in `/src/services/`
- CSV data: `snake_case.csv` in `/public/data/`
- JSON data: `kebab-case.json` in `/public/data/`

### Git Commit Pattern

After each plan completes:
```bash
git add -A
git commit -m "feat(phase-N): brief description of what was added"
```

---

## What NOT To Do

- **Do NOT delete** existing CSV files in `/public/questionnaire/`, `/public/studyguide/`, `/public/Handout/` — keep backward compatibility
- **Do NOT install** paid API dependencies or services
- **Do NOT add** a backend server — this is GitHub Pages only
- **Do NOT modify** `StudyContext.jsx`'s localStorage key without writing a migration
- **Do NOT use** `gensim.summarize` — it was removed in v4.0
- **Do NOT bundle** large ML models into the React app — pre-generate everything in Python
