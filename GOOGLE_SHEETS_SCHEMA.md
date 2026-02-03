# Google Sheets / Excel Schema for StudyHub

This document describes the required data structure. 

## Modes
1.  **Google Sheets (Unified)**: All data in one single Spreadsheet (legacy/online mode).
2.  **Local Excel (Subject-Grouped)**: Data split into `StudyHub_Master.xlsx` and `subjects/[subject].xlsx` (new default).

---

## Required Sheets

### 1. Subjects
Defines the main subject areas.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| subject_id | string | Yes | Unique identifier (e.g., "phys-001") |
| subject_key | string | Yes | Key used in code (e.g., "physics") |
| name | string | Yes | Display name (e.g., "Physics") |
| icon | string | No | Lucide icon name (e.g., "Zap") |
| color_hex | string | No | Hex color (e.g., "#3B82F6") |
| light_bg | string | No | Tailwind bg class (e.g., "bg-blue-50") |
| gradient_from | string | No | Gradient start (e.g., "blue-500") |
| gradient_to | string | No | Gradient end (e.g., "blue-600") |
| dark_glow | string | No | Dark mode glow (e.g., "shadow-blue-500/20") |

---

### 2. Topics
Topics within each subject.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| topic_id | string | Yes | Unique identifier (e.g., "phys-t001") |
| subject_key | string | Yes | Links to subject (e.g., "physics") |
| topic_name | string | Yes | Display name |
| duration_minutes | number | No | Estimated study time |
| order_index | number | No | Display order |

---

### 3. Topic_Sections
Sections within each topic.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| section_id | string | Yes | Unique identifier |
| topic_id | string | Yes | Links to topic |
| section_title | string | Yes | Display title |
| section_icon | string | No | Lucide icon name |
| section_type | string | Yes | Type: objectives, intro, content, applications, quiz |
| order_index | number | No | Display order |

---

### 4. Learning_Objectives
Learning objectives for each topic.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| objective_id | string | Yes | Unique identifier |
| topic_id | string | Yes | Links to topic |
| objective_text | string | Yes | Objective description |
| order_index | number | No | Display order |

---

### 5. Key_Terms
Vocabulary/glossary terms.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| term_id | string | Yes | Unique identifier |
| topic_id | string | Yes | Links to topic |
| term | string | Yes | Term name |
| definition | string | Yes | Term definition |

---

### 6. Study_Content (Updated)
Main educational content with video and image support.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| content_id | string | Yes | Unique identifier |
| section_id | string | Yes | Links to section |
| content_type | string | Yes | Type: text, introduction, formula, concept_helper, tip, warning, real_world, application, **video**, **image** |
| content_title | string | No | Title/heading |
| content_text | string | Yes | Main content text |
| **video_url** | string | No | YouTube URL (for video type) |
| **image_url** | string | No | Image URL (for image type) |
| **description** | string | No | Caption for video/image |
| order_index | number | No | Display order |

**Content Types:**
- `text` / `introduction` - Regular paragraph
- `formula` - Mathematical formula
- `concept_helper` / `tip` - Blue tip box
- `warning` - Red warning box
- `real_world` / `application` - Green real-world example
- `video` - Embedded YouTube video (use video_url)
- `image` - Image with lightbox (use image_url)

---

### 7. Formulas
Mathematical/scientific formulas.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| formula_id | string | Yes | Unique identifier |
| topic_id | string | Yes | Links to topic |
| formula_text | string | Yes | Formula (e.g., "F = m × a") |
| formula_display | string | No | Display version |
| formula_label | string | No | Label (e.g., "Newton's Second Law") |
| variable_1_symbol | string | No | First variable symbol |
| variable_1_name | string | No | First variable name |
| variable_1_unit | string | No | First variable unit |
| variable_2_symbol | string | No | Second variable symbol |
| ... | | | Up to 5 variables |
| category | string | No | Formula category |
| difficulty | string | No | basic, intermediate, advanced |
| notes | string | No | Additional notes |
| order_index | number | No | Display order |

---

### 8. Quiz_Questions (Updated)
Quiz questions with difficulty levels and hints.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| question_id | string | Yes | Unique identifier |
| topic_id | string | Yes | Links to topic |
| question_text | string | Yes | Question text |
| option_a | string | Yes | Option A |
| option_b | string | Yes | Option B |
| option_c | string | No | Option C |
| option_d | string | No | Option D |
| correct_answer | string | Yes | Correct answer (A/B/C/D) |
| explanation | string | No | Explanation shown after answer |
| **difficulty** | string | No | **easy**, **medium**, **hard** |
| **hint** | string | No | Hint text (costs 50% XP) |
| **image_url** | string | No | Image URL for question |
| xp_reward | number | No | XP reward (default: 10) |

**Difficulty Levels:**
- `easy` - Green badge, 1x XP
- `medium` - Yellow badge, 1.5x XP
- `hard` - Red badge, 2x XP

---

### 9. Achievements
Achievement/badge definitions.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| achievement_id | string | Yes | Unique identifier |
| icon | string | No | Lucide icon name |
| name | string | Yes | Achievement name |
| description | string | Yes | Achievement description |
| unlock_condition | string | No | Unlock condition |

---

### 10. Daily_Challenges (NEW)
Daily challenge questions.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| challenge_id | string | Yes | Unique identifier |
| **date** | string | Yes | Date in YYYY-MM-DD format |
| challenge_type | string | No | quiz, math_puzzle, word_problem |
| subject_key | string | No | Subject (physics, math, etc.) |
| question_text | string | Yes | Question text |
| option_a | string | Yes | Option A |
| option_b | string | Yes | Option B |
| option_c | string | No | Option C |
| option_d | string | No | Option D |
| correct_answer | string | Yes | Correct answer (A/B/C/D) |
| explanation | string | No | Explanation |
| hint | string | No | Hint text |
| difficulty | string | No | easy, medium, hard |
| image_url | string | No | Image URL |
| xp_reward | number | No | XP reward (default: 25) |

**Note:** If no challenge exists for today's date, the app will auto-generate one using AI.

---

### 11. App_Settings (NEW)
Application settings and configuration.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| setting_key | string | Yes | Setting identifier |
| setting_value | string | Yes | Setting value |
| description | string | No | Description |

**Available Settings:**
| Key | Default | Description |
|-----|---------|-------------|
| placeholder_image | via.placeholder.com URL | Default image placeholder |
| placeholder_video | YouTube embed URL | Default video placeholder |
| ai_enabled | true | Enable AI-generated content |
| daily_challenge_xp | 25 | XP for daily challenges |

---

## Example Data

### Study_Content with Video
```
| content_id | section_id | content_type | content_title | content_text | video_url | order_index |
|------------|------------|--------------|---------------|--------------|-----------|-------------|
| vid-001 | phys-s001 | video | Newton's Laws Explained | Watch this video | https://www.youtube.com/watch?v=kKKM8Y-u7ds | 1 |
```

### Study_Content with Image
```
| content_id | section_id | content_type | content_title | content_text | image_url | description | order_index |
|------------|------------|--------------|---------------|--------------|-----------|-------------|-------------|
| img-001 | phys-s001 | image | Force Diagram | | https://example.com/force-diagram.png | Forces acting on an object | 2 |
```

### Quiz_Questions with Difficulty
```
| question_id | topic_id | question_text | option_a | option_b | option_c | option_d | correct_answer | explanation | difficulty | hint | xp_reward |
|-------------|----------|---------------|----------|----------|----------|----------|----------------|-------------|------------|------|-----------|
| q-001 | phys-t001 | Calculate F if m=10kg, a=2m/s² | 5 N | 20 N | 12 N | 8 N | B | F = m × a = 10 × 2 = 20 N | easy | Use F = m × a | 10 |
| q-002 | phys-t001 | Complex physics problem... | ... | ... | ... | ... | C | Detailed explanation | hard | Consider all forces | 15 |
```

### Daily_Challenges
```
| challenge_id | date | challenge_type | subject_key | question_text | option_a | option_b | option_c | option_d | correct_answer | explanation | difficulty | xp_reward |
|--------------|------|----------------|-------------|---------------|----------|----------|----------|----------|----------------|-------------|------------|-----------|
| dc-2025-01-21 | 2025-01-21 | math_puzzle | math | What is 2^10? | 512 | 1024 | 2048 | 4096 | B | 2^10 = 1024 | medium | 25 |
| dc-2025-01-22 | 2025-01-22 | physics | physics | Force = ? | ... | ... | ... | ... | C | ... | easy | 25 |
```

---

## Features Summary

### Video Support
- Add `content_type: video` and `video_url` column
- Supports YouTube URLs (watch or embed format)
- Auto-converts to embed format
- Mark as watched button

### Image Support
- Add `content_type: image` and `image_url` column
- Supports any image URL
- Click to zoom (lightbox)
- Optional description caption

### Quiz Difficulty Levels
- Add `difficulty` column: easy, medium, hard
- Difficulty badge shown on questions
- Filter by difficulty before starting quiz
- XP multiplier based on difficulty

### Quiz Hints
- Add `hint` column
- Users can reveal hint (costs 50% XP)
- Helpful for harder questions

### Daily Challenges
- Create Daily_Challenges sheet
- Add one row per date
- If no challenge for today, AI generates one
- 25 XP reward by default

### AI-Generated Content
- Falls back to AI when data is missing
- Generates daily challenges automatically
- Can generate additional quiz questions
- Marked with sparkle icon
