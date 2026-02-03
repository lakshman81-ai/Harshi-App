const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../public/StudyHub_Complete_Data.xlsx');
console.log('Path:', INPUT_FILE);

try {
    const buf = fs.readFileSync(INPUT_FILE);
    console.log('File size:', buf.length);
    const wb = XLSX.read(buf, { type: 'buffer' });
    console.log('Sheet Names:', wb.SheetNames);
} catch (e) {
    console.error('Error:', e);
}
