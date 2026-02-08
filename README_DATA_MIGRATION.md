# Data Migration & Content Management Guide

## New Data Structure
The application now supports a file-based data structure for easier content management.

### Directory Layout
Content is organized by Subject > Topic > Module:

```
public/
  Physics/
    phy-t1/
      studyguide/
        Pages/
          index.csv           <-- Order of pages
          Page1.csv           <-- Page content (Text/Images)
          Page2.pdf           <-- PDF Resource
          Page3.docx          <-- Word Resource
          ConceptCheck1.csv   <-- Quiz for Page 1
      questionnaire/
        Quiz/
          Questionnaire1.csv  <-- Specific Quiz
      Handout/
        Pages/
          index.csv
          Handout1.csv
```

### File Formats
1. **Pages/index.csv**: Defines the sequence of pages.
   Columns: `page_id, page_file, page_title, order_index, questions_file`

2. **Content CSV (e.g., Page1.csv)**:
   Columns: `id, type, title, text, image_url, video_url, ...`

3. **Quiz CSV**:
   Columns: `question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, xp_reward`

## Content Manager
A new "Content Manager" tool is available in the Dashboard settings or via the "Edit" icon.
- **Browse**: Navigate the `public/` directory.
- **Edit**: Edit CSV and Text files directly in the browser.
- **Upload**: Upload PDF, Word, or Image files to specific folders.

## Backend Server
To support file operations (Save/Upload), a local Express server is required.
Run: `node server.js`
The Frontend will connect to `http://localhost:3001`.
