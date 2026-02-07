const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../public/data/subjects/physics.xlsx');
const wb = XLSX.readFile(FILE);
console.log('Sheet Names in file:', wb.SheetNames);

const CONFIG_SHEETS = [
    'Subjects',
    'Topics',
    'Topic_Sections',
    'Learning_Objectives',
    'Key_Terms',
    'Study_Content',
    'Formulas',
    'Quiz_Questions',
    'Achievements',
    'App_Settings',
    'Daily_Challenges'
];

console.log('\nMatching against config:');
CONFIG_SHEETS.forEach(s => {
    const match = wb.SheetNames.find(n => n.toLowerCase() === s.toLowerCase());
    console.log(` - Config: ${s} => File: ${match || 'NOT FOUND'}`);
});
