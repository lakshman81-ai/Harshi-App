# AI Data Generation Guide for StudyHub

This guide is designed for AI agents to generate compatible data for the StudyHub application. The system uses a **Subject-Based Distributed File Structure**.

## File Structure
- **Master File**: `public/data/StudyHub_Master.xlsx` (Subjects, Topic List, Global Settings)
- **Subject Files**: `public/data/subjects/[subject].xlsx` (Content for all topics within a subject)

## Schema Overview

### 1. Subjects (in Master)
*   **Columns**: `subject_id`, `subject_key`, `name`, `icon`, `color_hex`, `light_bg`, `gradient_from`, `gradient_to`, `dark_glow`

### 2. Topics (in Master)
*   **Columns**: `topic_id`, `subject_key`, `topic_name`, `duration_minutes`, `order_index`, `file_name`
*   **file_name**: The name of the XLSX file in `data/subjects/` (e.g., `subjects/physics.xlsx`).

### 3. Subject File Sheets (e.g., in `physics.xlsx`)
These files contain data for **ALL** topics in that subject.

> **CRITICAL**: Because a file contains multiple topics, you **MUST** populate the `topic_id` column for every row to link it to the correct topic.

#### A. Topic_Sections
*   **Columns**: `section_id`, `topic_id`, `section_title`, `section_icon`, `order_index`, `section_type`

#### B. Study_Content
*   **Columns**: `content_id`, `section_id`, `content_type`, `content_title`, `content_text`, `image_url`, `video_url`, `order_index`

#### C. Quiz_Questions
*   **Columns**: `question_id`, `topic_id`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation`, `difficulty`, `hint`, `xp_reward`

#### Other Sheets:
*   `Learning_Objectives` (`objective_id`, `topic_id`, `objective_text`)
*   `Key_Terms` (`term_id`, `topic_id`, `term`, `definition`)
*   `Formulas` (`formula_id`, `topic_id`, `formula_text`, ...)

## Instruction for Updating Content

1.  **Read Master**: Check `StudyHub_Master.xlsx` to find the `file_name` for the subject you are working on.
2.  **Edit Subject File**: Open the corresponding `subjects/[subject].xlsx`.
3.  **Appends/Edits**: Add new rows with the new `topic_id`. Ensure `topic_id` matches the ID in the Master file.
