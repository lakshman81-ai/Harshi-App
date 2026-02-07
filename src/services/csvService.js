/**
 * CSV Service for Harshi-App
 * Reads CSV files from the new subject/topic structure
 * Uses Papa Parse for RFC 4180 compliant CSV parsing
 */

import Papa from 'papaparse';
import { Logger } from './Logger';

/**
 * Fetch and parse CSV data from a URL or local path
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array<Object>>} Parsed CSV data
 */
export async function fetchCSV(filePath) {
    try {
        // Always use PUBLIC_URL if it's configured (even in localhost)
        // This handles the case where homepage is set in package.json
        const publicUrl = process.env.PUBLIC_URL || '';

        const fullPath = filePath.startsWith('/') && publicUrl && !filePath.startsWith(publicUrl)
            ? `${publicUrl}${filePath}`
            : filePath;

        Logger.action('CSV Fetch', `Fetching: ${fullPath}`, { publicUrl });

        const response = await fetch(fullPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        Logger.error(`Error fetching CSV from ${filePath}`, error);
        return [];
    }
}

/**
 * Parse CSV text to array of objects using Papa Parse
 * @param {string} csvText - CSV text content
 * @returns {Array<Object>} Array of row objects
 */
function parseCSV(csvText) {
    const result = Papa.parse(csvText, {
        header: true,           // First row = column names
        skipEmptyLines: true,   // Ignore blank rows
        dynamicTyping: false    // Keep all values as strings for compatibility
    });

    if (result.errors.length > 0) {
        console.warn('CSV parse warnings:', result.errors.slice(0, 3));
    }

    return result.data;
}

/**
 * Load master index for a content type
 * @param {string} contentType - 'questionnaire', 'studyguide', or 'Handout'
 * @returns {Promise<Array<Object>>} Master index data
 */
export async function loadMasterIndex(contentType) {
    const path = `/${contentType}/master-index.csv`;
    return fetchCSV(path);
}

/**
 * Load quiz questions for a specific subject and topic
 * @param {string} subject - Subject key (e.g., 'physics')
 * @param {string} topicFolder - Topic folder name (e.g., 'Newtons_Laws')
 * @returns {Promise<Array<Object>>} Quiz questions
 */
export async function loadQuizQuestions(subject, topicFolder) {
    const path = `/questionnaire/${subject}/${topicFolder}/questions.csv`;
    return fetchCSV(path);
}

/**
 * Load study guide content for a specific subject and topic
 * @param {string} subject - Subject key (e.g., 'physics')
 * @param {string} topicFolder - Topic folder name
 * @returns {Promise<Array<Object>>} Study content items
 */
export async function loadStudyContent(subject, topicFolder) {
    const path = `/studyguide/${subject}/${topicFolder}/content.csv`;
    return fetchCSV(path);
}

/**
 * Load sections for a specific subject and topic
 * @param {string} subject - Subject key
 * @param {string} topicFolder - Topic folder name
 * @returns {Promise<Array<Object>>} Sections
 */
export async function loadSections(subject, topicFolder) {
    const path = `/studyguide/${subject}/${topicFolder}/sections.csv`;
    console.log(`🔵 [csvService.loadSections] Loading sections from: ${path}`);
    const result = await fetchCSV(path);
    console.log(`🔵 [csvService.loadSections] Loaded ${result.length} section rows from ${path}:`, result);
    return result;
}

/**
 * Load handout for a specific subject and topic
 * @param {string} subject - Subject key
 * @param {string} topicFolder - Topic folder name
 * @returns {Promise<Array<Object>>} Handout items
 */
export async function loadHandout(subject, topicFolder) {
    const path = `/Handout/${subject}/${topicFolder}/handout.csv`;
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
    loadSections,
    loadHandout,
    getTopicsForSubject,
    getAllSubjects
};

export default csvService;
