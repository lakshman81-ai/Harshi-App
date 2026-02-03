import * as XLSX from 'xlsx';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { log } from '../utils';

// Helper: Process rows from a worksheet
const processSheetRows = (rows) => {
    if (rows.length < 2) return [];

    // Normalize headers: "Subject Key" -> "subject_key"
    const headers = rows[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
    console.log('Excel Headers Detected:', headers);

    return rows.slice(1).map((row, index) => {
        const obj = { _rowIndex: index + 2 };
        headers.forEach((header, i) => {
            // Excel row might be sparse, so handle undefined
            obj[header] = row[i] !== undefined ? String(row[i]).trim() : '';
        });
        return obj;
    });
};

// Helper: Fetch and parse a single XLSX file
const fetchAndParseXlsx = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load file: ${url}`);

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const result = {};

    // Convert all sheets to JSON
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        result[sheetName] = processSheetRows(jsonData);
    });

    return result;
};

export const fetchLocalExcelData = async () => {
    log('Fetching Multi-File Excel Data...');
    const publicUrl = process.env.PUBLIC_URL || '';

    try {
        // 1. Fetch Master File
        const masterUrl = `${publicUrl}/data/StudyHub_Master.xlsx`;
        log(`Loading Master: ${masterUrl}`);
        const masterData = await fetchAndParseXlsx(masterUrl);

        // Initialize final data structure with Master data
        const finalData = {
            SUBJECTS: masterData[GOOGLE_SHEETS_CONFIG.SHEETS.SUBJECTS] || [],
            ACHIEVEMENTS: masterData[GOOGLE_SHEETS_CONFIG.SHEETS.ACHIEVEMENTS] || [],
            TOPICS: masterData[GOOGLE_SHEETS_CONFIG.SHEETS.TOPICS] || [],
            APP_SETTINGS: masterData[GOOGLE_SHEETS_CONFIG.SHEETS.APP_SETTINGS] || [],
            DAILY_CHALLENGES: masterData[GOOGLE_SHEETS_CONFIG.SHEETS.DAILY_CHALLENGES] || [],

            // Initialize arrays for aggregated topic data
            TOPIC_SECTIONS: [],
            LEARNING_OBJECTIVES: [],
            KEY_TERMS: [],
            STUDY_CONTENT: [],
            FORMULAS: [],
            QUIZ_QUESTIONS: []
        };

        // 2. Identify Topic Files to Fetch
        const topics = finalData.TOPICS;
        const filePromisesMap = new Map();

        topics
            .filter(t => t.file_name) // Only fetch if file_name is defined
            .forEach(topic => {
                // Fix: Remove hardcoded 'topics/' as file_name might include 'subjects/' or be relative to data root
                // Clean input path to avoid double slashes if file_name starts with /
                const cleanFileName = topic.file_name.startsWith('/') ? topic.file_name.slice(1) : topic.file_name;
                const topicUrl = `${publicUrl}/data/${cleanFileName}`;

                if (!filePromisesMap.has(topicUrl)) {
                    log(`Fetching topic file: ${topicUrl}`);
                    filePromisesMap.set(topicUrl, fetchAndParseXlsx(topicUrl));
                }
            });

        // 3. Process loaded files and merge data
        // Iterate over unique files we fetched, not topics
        for (const [url, promise] of filePromisesMap.entries()) {
            try {
                const topicData = await promise;

                // Helper to find sheet name regardless of case
                const getSheetData = (configName) => {
                    const actualName = Object.keys(topicData).find(
                        k => k.toLowerCase() === configName.toLowerCase()
                    );
                    return actualName ? topicData[actualName] : [];
                };

                // Merge into final arrays
                // Note: Map sheet names from Config to keys in finalData
                const mappings = [
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.TOPIC_SECTIONS, key: 'TOPIC_SECTIONS' },
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.LEARNING_OBJECTIVES, key: 'LEARNING_OBJECTIVES' },
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.KEY_TERMS, key: 'KEY_TERMS' },
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.FORMULAS, key: 'FORMULAS' },
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.QUIZ_QUESTIONS, key: 'QUIZ_QUESTIONS' },
                    { sheet: GOOGLE_SHEETS_CONFIG.SHEETS.STUDY_CONTENT, key: 'STUDY_CONTENT' }
                ];

                mappings.forEach(map => {
                    const rows = getSheetData(map.sheet);
                    finalData[map.key].push(...rows);
                });

            } catch (e) {
                console.warn(`Failed to process topic file ${url}:`, e);
            }
        }



        log(`Loaded ${topics.length} topics successfully.`);
        return finalData;

    } catch (error) {
        console.error('Error loading Excel data:', error);
        throw error;
    }
};
