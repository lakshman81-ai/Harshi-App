const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MASTER_FILE = path.join(__dirname, '../public/data/StudyHub_Master.xlsx');
const PHYS_FILE = path.join(__dirname, '../public/data/subjects/physics.xlsx');

const masterWb = XLSX.readFile(MASTER_FILE);
const masterTopics = XLSX.utils.sheet_to_json(masterWb.Sheets['Topics']);

console.log('Master Topic IDs:');
masterTopics.forEach(t => console.log(` - ID: ${t.topic_id}, Name: ${t.topic_name}`));

const physWb = XLSX.readFile(PHYS_FILE);
const physObj = XLSX.utils.sheet_to_json(physWb.Sheets['Learning_Objectives']);

console.log('\nPhysics.xlsx Learning_Objectives Topic IDs:');
const uniquePhysIds = [...new Set(physObj.map(o => o.topic_id))];
uniquePhysIds.forEach(id => console.log(` - ID: ${id}`));
