# StudyHub - Complete Google Sheets Integration

A Grade 8 learning platform with **real-time Google Sheets synchronization**. Edit your spreadsheet → Changes appear on the webpage automatically!

## 📁 Files Included

| File | Purpose |
|------|---------|
| `Grade8_StudyHub_Complete.jsx` | Full React app with Google Sheets sync |
| `StudyHub_Data_Template.xlsx` | Excel template with all data fields |
| `StudyHub_Content_Template.docx` | Word template for study content |
| `setup_data.py` | Python script for data setup/validation |
| `DATA_INTEGRATION_GUIDE.md` | Detailed integration options |

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Upload Template to Google Sheets

1. Open [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. **File → Import → Upload** → Select `StudyHub_Data_Template.xlsx`
4. Choose "Replace spreadsheet" → Import

### Step 2: Get Your Sheet ID

Your Google Sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/1ABC123xyz_ABCDEFGHIJKLMNOP/edit
                                       ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                       This is your SHEET_ID
```

Copy this ID for Step 4.

### Step 3: Get a Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Library**
4. Search for "Google Sheets API" → Enable it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. Copy your API key
8. (Recommended) Click "Edit API key" → Restrict to "Google Sheets API"

### Step 4: Configure the App

Open `Grade8_StudyHub_Complete.jsx` and update these lines (around line 20):

```javascript
const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: '1ABC123xyz_ABCDEFGHIJKLMNOP',  // ← Your Sheet ID
  API_KEY: 'AIzaSyB_your_api_key_here',      // ← Your API Key
  REFRESH_INTERVAL: 60000,  // Sync every 60 seconds
  AUTO_REFRESH: true
};
```

### Step 5: Run the App

```bash
# If using Create React App
npm start

# Or copy Grade8_StudyHub_Complete.jsx into your React project
```

### Step 6: Test the Sync

1. Open your app in a browser
2. Edit a cell in your Google Sheet (e.g., change a topic name)
3. Wait up to 60 seconds (or click the "Refresh" button)
4. See your changes appear on the webpage! 🎉

---

## 📊 Data Structure

### Sheet: `Subjects`
Defines the main subjects (Physics, Math, etc.)

| Column | Required | Description |
|--------|----------|-------------|
| subject_id | ✅ | Unique ID (e.g., "phys-001") |
| subject_key | ✅ | URL-friendly key (e.g., "physics") |
| name | ✅ | Display name |
| icon | | Icon name (see Icon Reference) |
| color_hex | | Primary color (e.g., "#3B82F6") |
| gradient_from | | Tailwind gradient start |
| gradient_to | | Tailwind gradient end |

### Sheet: `Topics`
Lists all topics within each subject.

| Column | Required | Description |
|--------|----------|-------------|
| topic_id | ✅ | Unique ID (e.g., "phys-t001") |
| subject_key | ✅ | Links to Subjects sheet |
| topic_name | ✅ | Display name |
| duration_minutes | | Estimated study time |
| order_index | | Sort order (1, 2, 3...) |

### Sheet: `Topic_Sections`
Defines chapters/sections within each topic.

| Column | Required | Description |
|--------|----------|-------------|
| section_id | ✅ | Unique ID |
| topic_id | ✅ | Links to Topics sheet |
| section_title | ✅ | Display title |
| section_icon | | Icon name |
| section_type | | One of: objectives, intro, content, applications, quiz |
| order_index | | Sort order |

### Sheet: `Learning_Objectives`
Learning goals shown at the start of each topic.

| Column | Required | Description |
|--------|----------|-------------|
| objective_id | ✅ | Unique ID |
| topic_id | ✅ | Links to Topics |
| objective_text | ✅ | The objective text |
| order_index | | Sort order |

### Sheet: `Key_Terms`
Vocabulary definitions for each topic.

| Column | Required | Description |
|--------|----------|-------------|
| term_id | ✅ | Unique ID |
| topic_id | ✅ | Links to Topics |
| term | ✅ | The vocabulary term |
| definition | ✅ | The definition |

### Sheet: `Study_Content`
Main educational content blocks.

| Column | Required | Description |
|--------|----------|-------------|
| content_id | ✅ | Unique ID |
| section_id | ✅ | Links to Topic_Sections |
| content_type | ✅ | See Content Types below |
| content_title | | Title/heading |
| content_text | ✅ | Main content text |
| order_index | | Sort order |

**Content Types:**
- `introduction` - Opening paragraph
- `formula` - Mathematical formula (displayed large)
- `concept_helper` - 💡 Blue tip box
- `warning` - ⚠️ Red warning box
- `real_world` - 🌍 Green application box
- `text` - Regular paragraph

### Sheet: `Formulas`
Mathematical/scientific formulas.

| Column | Required | Description |
|--------|----------|-------------|
| formula_id | ✅ | Unique ID |
| topic_id | ✅ | Links to Topics |
| formula_text | ✅ | The formula (e.g., "F = m × a") |
| formula_label | | Name of the formula |
| variable_1_symbol | | First variable symbol |
| variable_1_name | | First variable name |
| variable_1_unit | | First variable unit |
| (repeat for variables 2, 3) | | |

### Sheet: `Quiz_Questions`
Multiple choice questions.

| Column | Required | Description |
|--------|----------|-------------|
| question_id | ✅ | Unique ID |
| topic_id | ✅ | Links to Topics |
| question_text | ✅ | The question |
| option_a | ✅ | First answer choice |
| option_b | ✅ | Second answer choice |
| option_c | | Third answer choice |
| option_d | | Fourth answer choice |
| correct_answer | ✅ | A, B, C, or D |
| explanation | | Why this is correct |
| xp_reward | | Points earned (default: 10) |

### Sheet: `Achievements`
Gamification badges.

| Column | Required | Description |
|--------|----------|-------------|
| achievement_id | ✅ | Unique ID |
| icon | | Icon name |
| name | ✅ | Badge name |
| description | ✅ | Description shown to user |
| unlock_condition | | When it's earned |

---

## 🎨 Icon Reference

Use these icon names in your sheets:

```
Zap, Calculator, FlaskConical, Leaf, Trophy, Star, Award, Flame,
HelpCircle, CheckCircle2, Target, BookOpen, FileText, Clock, Globe,
Lightbulb, AlertTriangle
```

---

## 🔧 Python Setup Script

The `setup_data.py` script helps you:

```bash
# Create a sample Excel file with test data
python setup_data.py create-sample

# Validate your Excel file
python setup_data.py validate MyData.xlsx

# Export Excel to JSON (for offline use)
python setup_data.py export-json MyData.xlsx

# Show the data schema
python setup_data.py schema
```

---

## ⚙️ Configuration Options

```javascript
const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: 'your-sheet-id',
  API_KEY: 'your-api-key',
  
  // How often to sync (milliseconds)
  REFRESH_INTERVAL: 60000,  // 1 minute
  
  // Enable/disable auto-refresh
  AUTO_REFRESH: true,
  
  // Show debug info in console
  DEBUG: true,
  
  // Sheet tab names (must match your Google Sheet)
  SHEETS: {
    SUBJECTS: 'Subjects',
    TOPICS: 'Topics',
    // ... etc
  }
};
```

---

## 🔄 How Syncing Works

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Edit Google Sheet (add topics, update content, etc.)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. App automatically fetches new data every 60 seconds     │
│     (or manually click "Refresh")                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DataTransformer converts sheet data to app structure    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. React components re-render with new data                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Users see updated content! 🎉                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### "Demo Mode" showing instead of live data
- Check that SHEET_ID is correct (not 'YOUR_GOOGLE_SHEET_ID_HERE')
- Check that API_KEY is correct
- Verify Google Sheets API is enabled in Cloud Console

### Data not updating
- Check the sync status badge in the header
- Click "Refresh" to force a sync
- Check browser console for errors
- Verify your sheet is "Published to web"

### "Failed to fetch" errors
- API key may be invalid or restricted incorrectly
- Sheet ID may be wrong
- Check if Google Sheets API is enabled

### Empty subjects/topics
- Make sure your sheet has data rows (not just headers)
- Check column names match exactly (case-insensitive, underscores for spaces)

---

## 📝 Adding New Content

### To add a new subject:
1. Add a row to `Subjects` sheet
2. Add topics to `Topics` sheet with matching `subject_key`
3. Refresh the app

### To add a new topic:
1. Add a row to `Topics` sheet
2. Add sections to `Topic_Sections` sheet with matching `topic_id`
3. Add objectives, terms, content, quizzes as needed
4. Refresh the app

### To add study content:
1. Find the `section_id` in `Topic_Sections`
2. Add rows to `Study_Content` with that `section_id`
3. Use appropriate `content_type` for styling
4. Refresh the app

---

## 🎓 Best Practices

1. **Use consistent IDs**: Follow the pattern (e.g., "phys-t001" for physics topic 1)
2. **Keep content concise**: Grade 8 appropriate language
3. **Order matters**: Use `order_index` to control display order
4. **Test incrementally**: Add a few rows, refresh, verify, repeat
5. **Backup your sheet**: Download a copy periodically

---

## 📄 License

MIT License - Feel free to use and modify for educational purposes!

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Open browser console (F12) for detailed error messages
3. Verify your Google Sheet structure matches the template
4. Test with the sample data first before adding your own

Happy Teaching! 🎉
