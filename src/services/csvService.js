/**
 * CSV Service for Harshi-App
 * Reads CSV files from the new subject/topic structure
 */

/**
 * Fetch and parse CSV data from a URL or local path
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array<Object>>} Parsed CSV data
 */
export async function fetchCSV(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error(`Error fetching CSV from ${filePath}:`, error);
        return [];
    }
}

/**
 * Parse CSV text to array of objects
 * @param {string} csvText - CSV text content
 * @returns {Array<Object>} Array of row objects
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines

        const values = parseCSVLine(lines[i]);
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push(row);
    }

    return data;
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array<string>} Array of values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Load master index for a content type
 * @param {string} contentType - 'questionnaire', 'studyguide', or 'Handout'
 * @returns {Promise<Array<Object>>} Master index data
 */
export async function loadMasterIndex(contentType) {
    const path = `/public/${contentType}/_master_index.csv`;
    return fetchCSV(path);
}

/**
 * Load quiz questions for a specific subject and topic
 * @param {string} subject - Subject key (e.g., 'physics')
 * @param {string} topicFolder - Topic folder name (e.g., 'Newtons_Laws')
 * @returns {Promise<Array<Object>>} Quiz questions
 */
export async function loadQuizQuestions(subject, topicFolder) {
    const path = `/public/questionnaire/${subject}/${topicFolder}/questions.csv`;
    return fetchCSV(path);
}

/**
 * Load study guide content for a specific subject and topic
 * @param {string} subject - Subject key (e.g., 'physics')
 * @param {string} topicFolder - Topic folder name
 * @returns {Promise<Array<Object>>} Study content items
 */
export async function loadStudyContent(subject, topicFolder) {
    const path = `/public/studyguide/${subject}/${topicFolder}/content.csv`;
    return fetchCSV(path);
}

/**
 * Load handout for a specific subject and topic
 * @param {string} subject - Subject key
 * @param {string} topicFolder - Topic folder name
 * @returns {Promise<Array<Object>>} Handout items
 */
export async function loadHandout(subject, topicFolder) {
    const path = `/public/Handout/${subject}/${topicFolder}/handout.csv`;
    return fetchCSV(path);
}

/**
 * Get all topics for a subject from master index
 * @param {string} subjectKey - Subject key (e.g., 'physics')
 * @returns {Promise<Array<Object>>} Topics for the subject
 */
export async function getTopicsForSubject(subjectKey) {
    const index = await loadMasterIndex('questionnaire');
    return index.filter(item => item.subject_key === subjectKey);
}

/**
 * Get all subjects from master index
 * @returns {Promise<Array<Object>>} Unique subjects
 */
export async function getAllSubjects() {
    const index = await loadMasterIndex('questionnaire');
    const subjectsMap = {};

    index.forEach(item => {
        if (!subjectsMap[item.subject_key]) {
            subjectsMap[item.subject_key] = {
                subject_key: item.subject_key,
                subject_name: item.subject_name
            };
        }
    });

    return Object.values(subjectsMap);
}

const csvService = {
    fetchCSV,
    loadMasterIndex,
    loadQuizQuestions,
    loadStudyContent,
    loadHandout,
    getTopicsForSubject,
    getAllSubjects
};

export default csvService;
