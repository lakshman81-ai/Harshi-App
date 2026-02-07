const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../public/data/subjects/physics.xlsx');

if (!fs.existsSync(FILE)) {
    console.error('File not found:', FILE);
    process.exit(1);
}

const wb = XLSX.readFile(FILE);
const sheetName = 'Learning_Objectives';
const sheet = wb.Sheets[sheetName];

if (!sheet) {
    console.error(`Sheet ${sheetName} not found`);
    process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(sheet);
console.log(`Sheet: ${sheetName}`);
console.log(`Found ${rows.length} rows.`);
if (rows.length > 0) {
    console.log('Columns:', Object.keys(rows[0]));
    console.log('First row sample:', JSON.stringify(rows[0], null, 2));
}
