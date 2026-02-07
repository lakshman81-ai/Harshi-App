# Harshi-App - Grade 8 Study Platform

A comprehensive learning platform for Grade 8 students with quiz, study guides, and handouts for Physics, Mathematics, Chemistry, and Biology.

## 🚀 Features

- **Quiz Module**: Multiple-choice questions organized by subject and topic
- **Study Guide**: Rich content including formulas, key terms, videos, and images
- **Handout Module**: Visual learning with Mermaid diagrams, flowcharts, and timelines
- **CSV-First Architecture**: Easy-to-maintain CSV data with Excel fallback
- **Google Sheets Integration**: Optional cloud data sync
- **Offline Support**: Works with local data files

## 📁 Project Structure

```
Harshi-App/
├── public/
│   ├── questionnaire/          # Quiz questions by subject/topic
│   │   ├── _master_index.csv
│   │   ├── Physics/
│   │   ├── Math/
│   │   ├── Chemistry/
│   │   └── Biology/
│   ├── studyguide/            # Study content by subject/topic
│   │   └── [same structure]
│   ├── Handout/               # Handouts with diagrams
│   │   └── [same structure]
│   └── data/                  # Original Excel files (fallback)
├── src/
│   ├── components/
│   │   └── MermaidDiagram.jsx # Diagram rendering
│   ├── services/
│   │   ├── csvService.js      # CSV data loading
│   │   ├── unifiedDataService.js  # CSV-first with Excel fallback
│   │   └── excelService.js    # Excel data loading
│   └── contexts/
│       └── DataContext.jsx    # Data provider
└── scripts/
    ├── convert_to_csv.py      # Excel → CSV conversion
    └── verify_app.py          # Browser testing
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📊 Data Management

### CSV Format

#### Quiz Questions (`questionnaire/[Subject]/[Topic]/questions.csv`)
```csv
question_id,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty,hint
q001,"What is 2+2?",3,4,5,6,B,"Basic addition",easy,"Count on fingers"
```

#### Study Content (`studyguide/[Subject]/[Topic]/content.csv`)
```csv
content_id,content_type,title,content,url,order_index
c001,text,"Introduction","Main text",,1
c002,formula,"F = ma","Newton's Second Law",,2
c003,video,"Explanation","https://youtube.com/...",,3
```

#### Handouts (`Handout/[Subject]/[Topic]/handout.csv`)
```csv
content_id,content_type,title,content,order_index
h001,text,"Summary","Key points",1
h002,mermaid,"Diagram","graph TD; A-->B",2
```

### Converting Excel to CSV

```bash
python scripts/convert_to_csv.py
```

This will:
1. Read Excel files from `public/data/`
2. Group by subject and topic
3. Create organized CSV files
4. Generate master index files

## 🧪 Testing

### Browser Verification
```bash
# Install Playwright
pip install playwright
playwright install chromium

# Run verification
python scripts/verify_app.py
```

### Unit Tests
```bash
npm test
```

## 🚢 Deployment

### GitHub Pages
The app automatically deploys to GitHub Pages on push to main branch.

### Manual Deployment
```bash
npm run build
npm install -g serve
serve -s build
```

## 📝 Content Type Reference

### Study Guide Content Types
- `text`: Regular paragraph
- `formula`: Mathematical formula
- `video`: YouTube video (provide URL)
- `image`: Image with lightbox
- `tip`: Blue tip box
- `warning`: Red warning box
- `key_term`: Glossary term with definition

### Handout Content Types
- `text`: Regular text
- `mermaid`: Mermaid diagram (flowchart, timeline, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and verification
5. Submit a pull request

## 📄 License

ISC License
