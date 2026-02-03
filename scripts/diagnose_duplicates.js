const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MASTER_FILE = path.join(__dirname, '../public/data/StudyHub_Master.xlsx');

if (!fs.existsSync(MASTER_FILE)) {
    console.error('Master file not found:', MASTER_FILE);
    process.exit(1);
}

const wb = XLSX.readFile(MASTER_FILE);
const topicsSheet = wb.Sheets['Topics'];
if (!topicsSheet) {
    console.error('Topics sheet not found');
    process.exit(1);
}

const topics = XLSX.utils.sheet_to_json(topicsSheet);
console.log(`Found ${topics.length} topics in Master file.`);

// Check for duplicate topic IDs
const idCounts = {};
topics.forEach(t => {
    const id = t.topic_id;
    idCounts[id] = (idCounts[id] || 0) + 1;
});

const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
if (duplicates.length > 0) {
    console.log('Detected duplicate Topic IDs in Master file:');
    console.log(duplicates);
} else {
    console.log('No duplicate Topic IDs found in Master file.');
}

// Check if multiple topics point to the same file
const fileCounts = {};
topics.forEach(t => {
    const f = t.file_name;
    fileCounts[f] = (fileCounts[f] || 0) + 1;
});
const fileDupes = Object.entries(fileCounts).filter(([f, count]) => count > 1);
if (fileDupes.length > 0) {
    console.log('Detected topics sharing the same file_name:');
    console.log(fileDupes);
} else {
    console.log('No topics share the same file_name.');
}
