# Phase 1: Data Format Migration — Hybrid CSV + JSON

## Why This Phase Comes First

Every subsequent phase (study guide, quiz, handout) depends on the data layer. The current custom CSV parser in `csvService.js` cannot reliably handle LaTeX equations, Mermaid code, or multi-line content. We fix the foundation before building on it. **This phase touches only the data layer — no UI changes.**

---

## Objectives

1. Replace custom CSV parser with Papa Parse (RFC 4180 compliant)
2. Add JSON loading capability alongside CSV
3. Create new folder structure under `/public/data/` (keep old folders working)
4. Update `unifiedDataService.js` to load from new structure
5. Write migration helpers for existing data

---

## Step 1: Install Papa Parse

```bash
npm install papaparse
```

**Reasoning**: Papa Parse is the gold standard for CSV in JavaScript — 8M+ weekly npm downloads, handles quoted multi-line fields, auto-detects delimiters, supports Web Workers. The current custom `parseCSVLine()` in `csvService.js` breaks on edge cases like commas inside quoted fields containing newlines.

### Decision Gate 1
```bash
# Verify install
node -e "require('papaparse'); console.log('Papa Parse OK')"
```
If this fails, check `package.json` for version conflicts.

---

## Step 2: Create New Folder Structure

```
public/data/
├── subjects.json              ← Master subject/topic tree
├── chapters/
│   ├── physics/
│   │   ├── phys-t1.json       ← Rich content (LaTeX, Mermaid, explanations)
│   │   ├── phys-t2.json
│   │   └── phys-t3.json
│   ├── math/
│   ├── chemistry/
│   └── biology/
├── questions/
│   ├── physics/
│   │   ├── phys-t1-questions.csv    ← Simple MCQ (easy to edit)
│   │   └── phys-t1-rich.json        ← Questions with LaTeX/diagrams
│   ├── math/
│   ├── chemistry/
│   └── biology/
├── study-guide/
│   ├── vocabulary.csv                ← Flat term definitions
│   ├── misconception-alerts.csv      ← Common mistakes
│   └── concept-bridges.csv           ← Cross-topic connections
├── diagrams/                          ← Pre-rendered SVGs (Phase 5)
│   └── .gitkeep
└── handouts/
    └── .gitkeep
```

**Reasoning**: JSON handles rich content (equations, code blocks, nested structures) while CSV stays for flat tabular data that's easy to edit in Google Sheets. This dual approach avoids the escaping nightmares of forcing LaTeX into CSV.

### subjects.json Schema

```json
{
  "version": "2.0",
  "grade": 9,
  "subjects": [
    {
      "subject_key": "physics",
      "name": "Physics",
      "icon": "Zap",
      "color_hex": "#3B82F6",
      "light_bg": "bg-blue-50",
      "gradient_from": "blue-500",
      "gradient_to": "blue-600",
      "dark_glow": "shadow-blue-500/20",
      "topics": [
        {
          "topic_id": "phys-t1",
          "topic_name": "Newton's Laws",
          "duration_minutes": 30,
          "order_index": 1,
          "bloom_max_level": 4,
          "content_file": "chapters/physics/phys-t1.json",
          "questions_csv": "questions/physics/phys-t1-questions.csv",
          "questions_rich": "questions/physics/phys-t1-rich.json"
        }
      ]
    }
  ]
}
```

### Chapter JSON Schema (e.g., `phys-t1.json`)

```json
{
  "topic_id": "phys-t1",
  "topic_name": "Newton's Laws",
  "sections": [
    {
      "section_id": "phys-t1-s01",
      "section_type": "vocabulary",
      "bloom_level": 1,
      "title": "Key Vocabulary",
      "icon": "BookOpen",
      "order_index": 1,
      "content": [
        {
          "term": "Inertia",
          "definition": "Resistance of an object to any change in its velocity",
          "context": "A heavy truck has more inertia than a bicycle",
          "related_terms": ["mass", "momentum"]
        }
      ]
    },
    {
      "section_id": "phys-t1-s02",
      "section_type": "concept_clarifier",
      "bloom_level": 2,
      "title": "Understanding Newton's First Law",
      "icon": "Lightbulb",
      "order_index": 2,
      "content": {
        "explanation": "Every object stays at rest or keeps moving...",
        "analogy": "Imagine you're in a car that suddenly brakes...",
        "real_world": "This is why seatbelts exist — your body wants to keep moving forward.",
        "equations": [
          {
            "latex": "F_{net} = 0 \\implies \\Delta v = 0",
            "label": "Net force zero means no velocity change"
          }
        ],
        "diagrams": [
          {
            "type": "mermaid",
            "code": "graph LR\n  A[Object at Rest] -->|No Force| A\n  B[Moving Object] -->|No Net Force| B",
            "caption": "First Law: Objects maintain their state"
          }
        ]
      }
    },
    {
      "section_id": "phys-t1-s03",
      "section_type": "worked_example",
      "bloom_level": 3,
      "title": "Solving F = ma Problems",
      "icon": "Target",
      "order_index": 3,
      "content": {
        "problem": "A 5 kg box is pushed with 20 N of force. Find acceleration.",
        "steps": [
          {
            "step_number": 1,
            "description": "Identify known values",
            "work": "m = 5 kg, F = 20 N",
            "explanation": "Always list what you know first"
          },
          {
            "step_number": 2,
            "description": "Apply Newton's Second Law",
            "work": "F = ma → a = F/m",
            "explanation": "Rearrange the formula to solve for the unknown"
          },
          {
            "step_number": 3,
            "description": "Calculate",
            "work": "a = 20/5 = 4 m/s²",
            "explanation": "Don't forget the units!"
          }
        ]
      }
    },
    {
      "section_id": "phys-t1-s04",
      "section_type": "misconception_alert",
      "bloom_level": 4,
      "title": "Common Mistakes",
      "icon": "AlertTriangle",
      "order_index": 4,
      "content": [
        {
          "misconception": "Heavier objects fall faster than lighter ones",
          "why_wrong": "In a vacuum, all objects fall at the same rate. Air resistance causes the difference, not mass.",
          "correct_understanding": "Gravitational acceleration (g ≈ 9.8 m/s²) is the same for all objects. Air resistance depends on shape and surface area, not mass alone.",
          "diagnostic_question": "A bowling ball and a feather are dropped in a vacuum chamber. Which hits the ground first?"
        }
      ]
    }
  ]
}
```

---

## Step 3: Create New Data Loading Service

Create `src/services/dataLoaderV2.js` — this sits **alongside** the existing services, not replacing them.

```javascript
/**
 * dataLoaderV2.js
 * Loads data from the new hybrid CSV+JSON structure.
 * Falls back to legacy csvService if new files don't exist.
 *
 * REASONING: We keep backward compatibility by checking for new files first,
 * then falling back to old paths. This lets us migrate topic-by-topic.
 */

import Papa from 'papaparse';
import { Logger } from './Logger';

const PUBLIC_URL = process.env.PUBLIC_URL || '';

// ──────────────────────────────────────────────
// Core: Fetch JSON with error handling
// ──────────────────────────────────────────────
export async function fetchJSON(path) {
    const url = `${PUBLIC_URL}/${path}`;
    Logger.info(`Fetching JSON: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
        }
        const data = await response.json();
        Logger.gate(`JSON Load: ${path}`, true);
        return data;
    } catch (error) {
        Logger.error(`JSON Load Failed: ${path}`, error);
        Logger.gate(`JSON Load: ${path}`, false);
        return null; // Caller decides fallback
    }
}

// ──────────────────────────────────────────────
// Core: Fetch CSV with Papa Parse
// ──────────────────────────────────────────────
export async function fetchCSVPapa(path) {
    const url = `${PUBLIC_URL}/${path}`;
    Logger.info(`Fetching CSV (Papa Parse): ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
        }
        const text = await response.text();

        const result = Papa.parse(text, {
            header: true,           // First row = column names
            skipEmptyLines: true,   // Ignore blank rows
            dynamicTyping: true,    // Auto-convert numbers/booleans
            transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
        });

        if (result.errors.length > 0) {
            Logger.warn(`CSV parse warnings for ${path}`, {
                errors: result.errors.slice(0, 5) // Log first 5 errors only
            });
        }

        Logger.gate(`CSV Load: ${path}`, true);
        Logger.info(`Parsed ${result.data.length} rows from ${path}`);
        return result.data;
    } catch (error) {
        Logger.error(`CSV Load Failed: ${path}`, error);
        Logger.gate(`CSV Load: ${path}`, false);
        return []; // Empty array = safe fallback
    }
}

// ──────────────────────────────────────────────
// High-level: Load master subject tree
// ──────────────────────────────────────────────
export async function loadSubjectTree() {
    // Try new format first
    const tree = await fetchJSON('data/subjects.json');
    if (tree && tree.subjects && tree.subjects.length > 0) {
        Logger.info('Loaded subject tree from subjects.json');
        return tree;
    }

    // Fallback: build from legacy _master_index.csv
    Logger.warn('subjects.json not found, falling back to _master_index.csv');
    const index = await fetchCSVPapa('questionnaire/_master_index.csv');
    if (index.length === 0) {
        throw new Error('No subject data found in either new or legacy format');
    }

    return convertLegacyIndex(index);
}

// ──────────────────────────────────────────────
// High-level: Load topic content (rich JSON)
// ──────────────────────────────────────────────
export async function loadTopicContent(topic) {
    // Try JSON chapter file first
    if (topic.content_file) {
        const content = await fetchJSON(`data/${topic.content_file}`);
        if (content) return content;
    }

    // Fallback: legacy studyguide CSV
    Logger.warn(`No JSON content for ${topic.topic_id}, trying legacy CSV`);
    const subjectName = capitalizeFirst(topic.subject_key || '');
    const legacyPath = `studyguide/${subjectName}/${topic.topic_folder || ''}/content.csv`;
    const rows = await fetchCSVPapa(legacyPath);

    return convertLegacyStudyContent(topic.topic_id, rows);
}

// ──────────────────────────────────────────────
// High-level: Load quiz questions (CSV + optional rich JSON)
// ──────────────────────────────────────────────
export async function loadQuizQuestions(topic) {
    let questions = [];

    // Load CSV questions (simple MCQ)
    if (topic.questions_csv) {
        const csvQuestions = await fetchCSVPapa(`data/${topic.questions_csv}`);
        questions.push(...csvQuestions);
    }

    // Load rich JSON questions (assertion-reasoning, diagram-based, etc.)
    if (topic.questions_rich) {
        const richQuestions = await fetchJSON(`data/${topic.questions_rich}`);
        if (richQuestions && Array.isArray(richQuestions)) {
            questions.push(...richQuestions);
        }
    }

    // Fallback: legacy questionnaire CSV
    if (questions.length === 0) {
        Logger.warn(`No new questions for ${topic.topic_id}, trying legacy`);
        const subjectName = capitalizeFirst(topic.subject_key || '');
        const legacyPath = `questionnaire/${subjectName}/${topic.topic_id}/questions.csv`;
        const legacy = await fetchCSVPapa(legacyPath);
        questions.push(...legacy);
    }

    Logger.info(`Loaded ${questions.length} questions for ${topic.topic_id}`);
    return questions;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertLegacyIndex(rows) {
    // Convert flat _master_index.csv rows to nested subject tree
    const subjectsMap = {};
    rows.forEach(row => {
        const key = row.subject_key;
        if (!subjectsMap[key]) {
            subjectsMap[key] = {
                subject_key: key,
                name: row.subject_name,
                icon: getDefaultIcon(key),
                color_hex: getDefaultColor(key),
                topics: []
            };
        }
        subjectsMap[key].topics.push({
            topic_id: row.topic_id,
            topic_name: row.topic_name,
            topic_folder: row.topic_folder,
            duration_minutes: 30,
            order_index: subjectsMap[key].topics.length + 1
        });
    });

    return { version: '1.0-legacy', subjects: Object.values(subjectsMap) };
}

function convertLegacyStudyContent(topicId, rows) {
    // Wrap legacy CSV rows in the new JSON section format
    return {
        topic_id: topicId,
        sections: [{
            section_id: `${topicId}-legacy`,
            section_type: 'content',
            bloom_level: 2,
            title: 'Study Content',
            order_index: 1,
            content: rows
        }]
    };
}

function getDefaultIcon(key) {
    const map = { physics: 'Zap', math: 'Calculator', chemistry: 'FlaskConical', biology: 'Leaf' };
    return map[key] || 'BookOpen';
}

function getDefaultColor(key) {
    const map = { physics: '#3B82F6', math: '#F59E0B', chemistry: '#8B5CF6', biology: '#10B981' };
    return map[key] || '#6366F1';
}
```

---

## Step 4: Wire Into Existing Data Pipeline

Modify `src/services/unifiedDataService.js` to use the new loader **without breaking the old flow**.

**Strategy**: Add a new data source mode `'v2'` alongside existing `'csv-first'` and `'excel-only'`.

```javascript
// In unifiedDataService.js, add at the top:
import * as dataLoaderV2 from './dataLoaderV2';

// Add new mode option:
const DATA_SOURCE_MODE = 'v2-first'; // 'v2-first' | 'csv-first' | 'excel-only'

// In loadAppData(), add before existing logic:
if (DATA_SOURCE_MODE === 'v2-first') {
    try {
        const data = await loadFromV2();
        validateData(data);
        Logger.gate('V2 Data Load', true);
        return data;
    } catch (v2Error) {
        Logger.warn('V2 loading failed, falling back to CSV', v2Error);
        // Fall through to existing csv-first logic
    }
}

// New function:
async function loadFromV2() {
    const tree = await dataLoaderV2.loadSubjectTree();
    // ... transform tree into existing data format
    // so DataTransformer.transformAll() still works
}
```

**CRITICAL**: The output of `loadFromV2()` must match the shape expected by `DataTransformer.transformAll()` — specifically keys like `SUBJECTS`, `TOPICS`, `QUIZ_QUESTIONS`, etc. This is the **backward compatibility contract**.

---

## Step 5: Write a Migration Script

Create `scripts/migrate_csv_to_v2.py` — converts existing CSV files to the new structure.

```python
#!/usr/bin/env python3
"""
migrate_csv_to_v2.py
Converts existing StudyHub CSV files to the new hybrid CSV+JSON format.

Usage: python scripts/migrate_csv_to_v2.py
Input:  public/questionnaire/, public/studyguide/, public/Handout/
Output: public/data/ (new structure)

REASONING: Running this once creates the v2 data files. The React app can then
load from either old or new paths, making the migration non-breaking.
"""

import csv
import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC = PROJECT_ROOT / 'public'
OUTPUT = PUBLIC / 'data'

def main():
    print("=== StudyHub Data Migration: CSV → V2 Hybrid ===")

    # Decision Gate: Check source files exist
    master_index = PUBLIC / 'questionnaire' / '_master_index.csv'
    if not master_index.exists():
        print(f"ERROR: {master_index} not found. Aborting.")
        sys.exit(1)

    # Create output directories
    for d in ['chapters', 'questions', 'study-guide', 'diagrams', 'handouts']:
        (OUTPUT / d).mkdir(parents=True, exist_ok=True)

    # Load master index
    subjects = load_master_index(master_index)
    print(f"Found {len(subjects)} subjects, {sum(len(s['topics']) for s in subjects.values())} topics")

    # Generate subjects.json
    generate_subjects_json(subjects)

    # Migrate each topic
    for subject_key, subject_data in subjects.items():
        subject_dir = OUTPUT / 'chapters' / subject_key
        subject_dir.mkdir(parents=True, exist_ok=True)
        questions_dir = OUTPUT / 'questions' / subject_key
        questions_dir.mkdir(parents=True, exist_ok=True)

        for topic in subject_data['topics']:
            migrate_topic(subject_key, subject_data['name'], topic)

    print("=== Migration Complete ===")


def load_master_index(path):
    """Parse _master_index.csv into nested subject dict."""
    subjects = {}
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row['subject_key']
            if key not in subjects:
                subjects[key] = {
                    'name': row['subject_name'],
                    'topics': []
                }
            subjects[key]['topics'].append({
                'topic_id': row['topic_id'],
                'topic_name': row['topic_name'],
                'topic_folder': row['topic_folder']
            })
    return subjects


def generate_subjects_json(subjects):
    """Create the master subjects.json file."""
    ICONS = {'physics': 'Zap', 'math': 'Calculator', 'chemistry': 'FlaskConical', 'biology': 'Leaf'}
    COLORS = {'physics': '#3B82F6', 'math': '#F59E0B', 'chemistry': '#8B5CF6', 'biology': '#10B981'}

    tree = {
        "version": "2.0",
        "grade": 9,
        "subjects": []
    }

    for key, data in subjects.items():
        subject = {
            "subject_key": key,
            "name": data['name'],
            "icon": ICONS.get(key, 'BookOpen'),
            "color_hex": COLORS.get(key, '#6366F1'),
            "topics": []
        }
        for i, topic in enumerate(data['topics']):
            subject['topics'].append({
                "topic_id": topic['topic_id'],
                "topic_name": topic['topic_name'],
                "duration_minutes": 30,
                "order_index": i + 1,
                "content_file": f"chapters/{key}/{topic['topic_id']}.json",
                "questions_csv": f"questions/{key}/{topic['topic_id']}-questions.csv",
                "questions_rich": f"questions/{key}/{topic['topic_id']}-rich.json"
            })
        tree['subjects'].append(subject)

    output_path = OUTPUT / 'subjects.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Created {output_path}")


def migrate_topic(subject_key, subject_name, topic):
    """Migrate a single topic's study content and questions."""
    topic_id = topic['topic_id']
    folder = topic['topic_folder']

    # --- Migrate study guide content ---
    study_csv = find_study_csv(subject_name, folder)
    sections = []
    if study_csv:
        sections = convert_study_csv_to_sections(topic_id, study_csv)
        print(f"  ✓ Migrated study content: {topic_id} ({len(sections)} sections)")
    else:
        print(f"  ⚠ No study content found for {topic_id}")

    # --- Migrate handout ---
    handout_csv = find_handout_csv(subject_name, folder)
    if handout_csv:
        handout_sections = convert_handout_csv(topic_id, handout_csv)
        sections.extend(handout_sections)
        print(f"  ✓ Migrated handout: {topic_id}")

    # Write chapter JSON
    chapter = {
        "topic_id": topic_id,
        "topic_name": topic['topic_name'],
        "sections": sections
    }
    chapter_path = OUTPUT / 'chapters' / subject_key / f"{topic_id}.json"
    with open(chapter_path, 'w', encoding='utf-8') as f:
        json.dump(chapter, f, indent=2, ensure_ascii=False)

    # --- Migrate questions (keep as CSV for easy editing) ---
    questions_csv = find_questions_csv(subject_name, topic_id)
    if questions_csv:
        import shutil
        dest = OUTPUT / 'questions' / subject_key / f"{topic_id}-questions.csv"
        shutil.copy2(questions_csv, dest)
        print(f"  ✓ Copied questions: {topic_id}")

    # Create empty rich questions JSON (to be filled by content pipeline later)
    rich_path = OUTPUT / 'questions' / subject_key / f"{topic_id}-rich.json"
    if not rich_path.exists():
        with open(rich_path, 'w') as f:
            json.dump([], f)


def find_study_csv(subject_name, folder):
    """Find study guide CSV using case-insensitive matching."""
    # Try multiple path patterns (existing code uses inconsistent casing)
    patterns = [
        PUBLIC / 'studyguide' / subject_name / folder / 'content.csv',
        PUBLIC / 'studyguide' / subject_name.capitalize() / folder / 'content.csv',
        PUBLIC / 'studyguide' / subject_name / f"{subject_name.capitalize()}_{folder}" / 'content.csv',
    ]
    # Also try with topic folder variations like Math_T1, Phys_T1
    for p in patterns:
        if p.exists():
            return p
    # Brute force search
    base = PUBLIC / 'studyguide'
    if base.exists():
        for csv_file in base.rglob('content.csv'):
            if folder.lower() in str(csv_file).lower():
                return csv_file
    return None


def find_handout_csv(subject_name, folder):
    base = PUBLIC / 'Handout'
    if base.exists():
        for csv_file in base.rglob('handout.csv'):
            if folder.lower() in str(csv_file).lower():
                return csv_file
    return None


def find_questions_csv(subject_name, topic_id):
    base = PUBLIC / 'questionnaire'
    if base.exists():
        for csv_file in base.rglob('questions.csv'):
            if topic_id in str(csv_file):
                return csv_file
    return None


def convert_study_csv_to_sections(topic_id, csv_path):
    """Convert legacy content.csv rows into structured JSON sections."""
    sections = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        formulas = []
        key_terms = []

        for row in reader:
            content_type = row.get('content_type', 'text')
            if content_type == 'formula':
                formulas.append({
                    "latex": row.get('content', ''),
                    "label": row.get('title', '')
                })
            elif content_type == 'key_term':
                key_terms.append({
                    "term": row.get('title', ''),
                    "definition": row.get('content', '')
                })

        if key_terms:
            sections.append({
                "section_id": f"{topic_id}-vocab",
                "section_type": "vocabulary",
                "bloom_level": 1,
                "title": "Key Vocabulary",
                "icon": "BookOpen",
                "order_index": 1,
                "content": key_terms
            })

        if formulas:
            sections.append({
                "section_id": f"{topic_id}-formulas",
                "section_type": "formulas",
                "bloom_level": 2,
                "title": "Key Formulas",
                "icon": "Calculator",
                "order_index": 2,
                "content": {"equations": formulas}
            })

    return sections


def convert_handout_csv(topic_id, csv_path):
    """Convert handout.csv (may contain Mermaid code) into sections."""
    sections = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            content_type = row.get('content_type', 'text')
            section = {
                "section_id": row.get('content_id', f"{topic_id}-handout-{len(sections)}"),
                "section_type": content_type,
                "bloom_level": 2,
                "title": row.get('title', ''),
                "order_index": int(row.get('order_index', len(sections) + 10)),
            }
            if content_type == 'mermaid':
                section["content"] = {
                    "type": "mermaid",
                    "code": row.get('content', ''),
                    "caption": row.get('title', '')
                }
            else:
                section["content"] = {"text": row.get('content', '')}

            sections.append(section)

    return sections


if __name__ == '__main__':
    main()
```

---

## Decision Gates (End of Phase 1)

Run these checks before proceeding to Phase 2:

```bash
# Gate 1: New data files exist
ls public/data/subjects.json
# Expected: file exists with valid JSON

# Gate 2: Papa Parse works in React
npm start
# Open browser console, verify no CSV parse errors

# Gate 3: Legacy data still loads
# Navigate to any topic — content should display from old OR new paths

# Gate 4: Tests still pass
npm test -- --watchAll=false
```

### Rollback Plan

If anything breaks:
1. Set `DATA_SOURCE_MODE = 'csv-first'` in `unifiedDataService.js`
2. The old CSV loading path is untouched and will take over
3. Delete `/public/data/` folder to remove new files

---

## Files Changed/Created in This Phase

| File | Action | Notes |
|------|--------|-------|
| `package.json` | Modified | Added `papaparse` dependency |
| `src/services/dataLoaderV2.js` | **Created** | New hybrid data loader |
| `src/services/unifiedDataService.js` | Modified | Added `v2-first` mode |
| `public/data/subjects.json` | **Created** | Master subject tree |
| `public/data/chapters/**/*.json` | **Created** | Topic content files |
| `public/data/questions/**/*.csv` | **Created** | Copied from legacy |
| `scripts/migrate_csv_to_v2.py` | **Created** | Migration utility |
