const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const PUBLIC_DATA = path.join(__dirname, '../public/data');
const PHYS_FILE = path.join(PUBLIC_DATA, 'subjects/physics.xlsx');

const wb = XLSX.readFile(PHYS_FILE);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Learning_Objectives']);

console.log('Keys in first row:', Object.keys(rows[0]));
console.log('Value of topic_id property:', rows[0].topic_id);
console.log('Value of "topic_id" (literal):', rows[0]["topic_id"]);
console.log('Entire first row:', rows[0]);
