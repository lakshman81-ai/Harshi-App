const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const PUBLIC_DATA = path.join(__dirname, '../public/data');
const MASTER_FILE = path.join(PUBLIC_DATA, 'StudyHub_Master.xlsx');

const wb = XLSX.readFile(MASTER_FILE);
const topics = XLSX.utils.sheet_to_json(wb.Sheets['Topics']);

const finalData = { LEARNING_OBJECTIVES: [] };
const fileCache = {};

topics.forEach(topic => {
    const fileName = topic.file_name;
    const filePath = path.join(PUBLIC_DATA, fileName);

    if (!fileCache[fileName]) {
        const wbTopic = XLSX.readFile(filePath);
        const sheet = wbTopic.Sheets['Learning_Objectives'];
        fileCache[fileName] = XLSX.utils.sheet_to_json(sheet);
    }

    const rows = fileCache[fileName];

    // NEW LOGIC: Filter and Inject
    const relevantRows = rows.filter(r => !r.topic_id || r.topic_id === topic.topic_id);
    const processedRows = relevantRows.map(r => ({ ...r, topic_id: r.topic_id || topic.topic_id }));

    finalData.LEARNING_OBJECTIVES.push(...processedRows);
});

console.log(`Total topics processed: ${topics.length}`);
console.log(`Total objectives in finalData: ${finalData.LEARNING_OBJECTIVES.length}`);

// Group by topic ID to check for counts
const counts = {};
finalData.LEARNING_OBJECTIVES.forEach(r => {
    counts[r.topic_id] = (counts[r.topic_id] || 0) + 1;
});

console.log('\nObjectives count per topic:');
Object.entries(counts).forEach(([id, count]) => {
    console.log(` - ${id}: ${count}`);
});
