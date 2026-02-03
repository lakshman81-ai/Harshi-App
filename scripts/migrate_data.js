const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '../public/StudyHub_Complete_Data.xlsx');
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const TOPICS_DIR = path.join(OUTPUT_DIR, 'topics');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TOPICS_DIR)) fs.mkdirSync(TOPICS_DIR, { recursive: true });

console.log('Reading input file:', INPUT_FILE);
const workbook = XLSX.readFile(INPUT_FILE);

// Helper to get JSON data from sheet
const getSheetData = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet);
};

// Helper to write data to sheet
const writeSheet = (wb, data, sheetName) => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
};

// 1. Create Master File
console.log('Generating StudyHub_Master.xlsx...');
const masterWb = XLSX.utils.book_new();

// Transfer Global Sheets
['Subjects', 'Achievements', 'App_Settings', 'Daily_Challenges'].forEach(sheetName => {
    const data = getSheetData(sheetName);
    if (data.length > 0) {
        writeSheet(masterWb, data, sheetName);
    } else {
        if (sheetName === 'App_Settings') writeSheet(masterWb, [{ setting_key: 'ai_enabled', setting_value: 'true' }], sheetName);
        if (sheetName === 'Daily_Challenges') writeSheet(masterWb, [{ date: new Date().toISOString().split('T')[0] }], sheetName);
    }
});

// Process Topics for Master File
const topics = getSheetData('Topics');
const topicsForMaster = topics.map(t => {
    const fileName = `subjects/${t.subject_key || 'unknown'}.xlsx`;
    return { ...t, file_name: fileName };
});
writeSheet(masterWb, topicsForMaster, 'Topics');

XLSX.writeFile(masterWb, path.join(OUTPUT_DIR, 'StudyHub_Master.xlsx'));
console.log('Master file created.');

// 2. Creates Subject Files
console.log('Generating Subject files...');
const OUTPUT_SUBJ_DIR = path.join(OUTPUT_DIR, 'subjects');
if (!fs.existsSync(OUTPUT_SUBJ_DIR)) fs.mkdirSync(OUTPUT_SUBJ_DIR, { recursive: true });

const sheetsToSplit = [
    { name: 'Topic_Sections', idCol: 'subject_key', viaTopic: true },
    { name: 'Learning_Objectives', idCol: 'subject_key', viaTopic: true },
    { name: 'Key_Terms', idCol: 'subject_key', viaTopic: true },
    { name: 'Study_Content', idCol: 'section_id', viaSection: true },
    { name: 'Formulas', idCol: 'subject_key', viaTopic: true },
    { name: 'Quiz_Questions', idCol: 'subject_key', viaTopic: true }
];

// Map Topic ID -> Subject Key
const topicToSubjectMap = {};
topics.forEach(t => {
    topicToSubjectMap[t.topic_id] = t.subject_key;
});

// Load all data first
const allData = {};
sheetsToSplit.forEach(def => {
    allData[def.name] = getSheetData(def.name);
});

// Map Section IDs to Topic IDs for content resolution
const sectionToTopicMap = {};
(allData.Topic_Sections || []).forEach(section => {
    sectionToTopicMap[section.section_id] = section.topic_id;
});

// Get unique subjects
const uniqueSubjects = [...new Set(topics.map(t => t.subject_key))];

uniqueSubjects.forEach(subjectKey => {
    const subjectFilename = `${subjectKey}.xlsx`;
    const subjectWb = XLSX.utils.book_new();
    let hasData = false;

    sheetsToSplit.forEach(def => {
        let subjectData = [];
        const rawData = allData[def.name] || [];

        if (def.viaSection) {
            // Content -> Section -> Topic -> Subject
            subjectData = rawData.filter(item => {
                const sId = item.section_id;
                const tId = sectionToTopicMap[sId];
                return topicToSubjectMap[tId] === subjectKey;
            });
        } else if (def.viaTopic) {
            // Data -> Topic -> Subject
            subjectData = rawData.filter(item => {
                const tId = item.topic_id; // Data has topic_id, not subject_key directly
                return topicToSubjectMap[tId] === subjectKey;
            });
        }

        if (subjectData.length > 0) {
            writeSheet(subjectWb, subjectData, def.name);
            hasData = true;
        }
    });

    if (hasData) {
        XLSX.writeFile(subjectWb, path.join(OUTPUT_SUBJ_DIR, subjectFilename));
        console.log(`Created ${subjectFilename}`);
    } else {
        console.warn(`Skipping ${subjectFilename} (no content found)`);
    }
});

console.log('Migration complete.');
