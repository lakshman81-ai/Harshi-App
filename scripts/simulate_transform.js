const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Mock DataTransformer (simplified but faithful to source)
class DataTransformer {
    static transformObjectives(rows) {
        const objectives = {};
        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;
            if (!objectives[topicId]) objectives[topicId] = [];
            objectives[topicId].push(row);
        });
        return objectives;
    }
}

const PUBLIC_DATA = path.join(__dirname, '../public/data');
const MASTER_FILE = path.join(PUBLIC_DATA, 'StudyHub_Master.xlsx');

const wb = XLSX.readFile(MASTER_FILE);
const topics = XLSX.utils.sheet_to_json(wb.Sheets['Topics']);

// In our new excelService, we merge sheets from all files
let allObjectives = [];

const uniqueFiles = [...new Set(topics.map(t => t.file_name).filter(f => f))];
console.log('Unique files to load:', uniqueFiles);

uniqueFiles.forEach(fileName => {
    const filePath = path.join(PUBLIC_DATA, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn('File not found:', filePath);
        return;
    }
    const wbTopic = XLSX.readFile(filePath);
    // Sheet name from config
    const sheetName = 'Learning_Objectives';
    const sheet = wbTopic.Sheets[sheetName];
    if (sheet) {
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`Loaded ${rows.length} objectives from ${fileName}`);
        allObjectives.push(...rows);
    }
});

const transformed = DataTransformer.transformObjectives(allObjectives);
console.log('\nTransformed Objectives Keys (Topic IDs):', Object.keys(transformed));

const physT1 = transformed['phys-t1'];
console.log(`\nObjectives for 'phys-t1': ${physT1 ? physT1.length : 0}`);
if (physT1) console.log('Sample:', physT1[0]);
