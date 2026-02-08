/**
 * CSV Service for Harshi-App
 * Reads CSV files from the new subject/topic structure
 * Uses Papa Parse for RFC 4180 compliant CSV parsing
 */

import Papa from 'papaparse';
import { Logger } from './Logger';

const CONTEXT = 'CSVService';

// Backend API URL (fallback to local dev server)
const API_URL = 'http://localhost:3001/api';

/**
 * Check if the backend server is reachable
 */
export async function checkBackendStatus() {
    try {
        const res = await fetch(`${API_URL}/files?path=.`);
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Fetch and parse CSV data from a URL or local path
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array<Object>>} Parsed CSV data
 */
export async function fetchCSV(filePath) {
    const publicUrl = process.env.PUBLIC_URL || '';
    const fullPath = filePath.startsWith('/') && publicUrl && !filePath.startsWith(publicUrl)
        ? `${publicUrl}${filePath}`
        : filePath;

    try {
        Logger.data(`Fetching CSV: ${fullPath}`, { publicUrl }, CONTEXT);

        const response = await fetch(fullPath);
        if (!response.ok) {
            // Log 404s as warnings (expected for optional files), others as errors
            if (response.status === 404) {
                Logger.warn(`File not found: ${fullPath}`, { status: 404 }, CONTEXT);
            } else {
                Logger.error(`HTTP Error: ${fullPath}`, { status: response.status }, CONTEXT);
            }
            return []; // Graceful fallback
        }

        const text = await response.text();
        const data = parseCSV(text, fullPath);

        Logger.data(`Loaded ${data.length} rows from ${filePath}`, null, CONTEXT);
        return data;

    } catch (error) {
        Logger.error(`Network/Fetch Error: ${fullPath}`, error, CONTEXT);
        return [];
    }
}

/**
 * Parse CSV text to array of objects using Papa Parse
 * @param {string} csvText - CSV text content
 * @param {string} source - Source file path for logging
 * @returns {Array<Object>} Array of row objects
 */
function parseCSV(csvText, source) {
    const result = Papa.parse(csvText, {
        header: true,           // First row = column names
        skipEmptyLines: true,   // Ignore blank rows
        dynamicTyping: false    // Keep all values as strings for compatibility
    });

    if (result.errors.length > 0) {
        Logger.warn(`CSV Parse Warnings for ${source}`, result.errors.slice(0, 3), CONTEXT);
    }

    return result.data;
}

/**
 * Load master index for a content type
 * @param {string} contentType - 'questionnaire', 'studyguide', or 'Handout'
 * @returns {Promise<Array<Object>>} Master index data
 */
export async function loadMasterIndex(contentType) {
    // Try to load the new master index if it exists, otherwise fallback or return empty
    // The previous logic relied on a generated _master_index.csv.
    // We should probably generate this dynamically or maintain it.
    const path = `/${contentType}/master-index.csv`;
    // For now, assume it still exists or we might need to scan directories if using the backend
    return fetchCSV(path);
}

/**
 * NEW: Load Study Guide Page Index
 * @param {string} subject - Subject (e.g., 'Physics')
 * @param {string} topicFolder - Topic (e.g., 'phy-t1')
 */
export async function loadStudyGuideIndex(subject, topicFolder) {
    // New Structure: /Physics/phy-t1/studyguide/Pages/index.csv
    // Handle casing for subject: "physics" -> "Physics"
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/studyguide/Pages/index.csv`;
    return fetchCSV(path);
}

/**
 * NEW: Load specific page content (CSV)
 */
export async function loadPageContent(subject, topicFolder, filename) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/studyguide/Pages/${filename}`;
    return fetchCSV(path);
}

/**
 * NEW: Load Concept Check questions for a page
 */
export async function loadConceptCheck(subject, topicFolder, filename) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/studyguide/Pages/${filename}`;
    return fetchCSV(path);
}

/**
 * NEW: Load Questionnaire Quizzes Index (if we have one, or just scan)
 * For now, let's assume we look for specific files or a master list.
 * Since the prompt said "Questionnaire1.csv, Questionnaire2.csv shall be selectable",
 * we might need to list files in the directory if we have backend access.
 */
export async function listQuizzes(subject, topicFolder) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const dirPath = `/${subjectName}/${topicFolder}/questionnaire/Quiz/`;

    // If backend is available, list files
    if (await checkBackendStatus()) {
        try {
            const res = await fetch(`${API_URL}/files?path=${dirPath}`);
            if (res.ok) {
                const files = await res.json();
                return files
                    .filter(f => f.name.endsWith('.csv'))
                    .map(f => ({
                        id: f.name.replace('.csv', ''),
                        name: f.name.replace('.csv', ''),
                        file: f.name
                    }));
            }
        } catch (e) {
            console.error("Failed to list quizzes via backend", e);
        }
    }

    // Fallback: Return standard list based on convention
    return [
        { id: 'q1', name: 'Questionnaire 1', file: 'Questionnaire1.csv' },
        { id: 'q2', name: 'Questionnaire 2', file: 'Questionnaire2.csv' }
    ];
}

export async function loadQuiz(subject, topicFolder, filename) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/questionnaire/Quiz/${filename}`;
    return fetchCSV(path);
}

/**
 * NEW: Load Handout Index
 */
export async function loadHandoutIndex(subject, topicFolder) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/Handout/Pages/index.csv`;
    return fetchCSV(path);
}

export async function loadHandoutPage(subject, topicFolder, filename) {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/Handout/Pages/${filename}`;
    return fetchCSV(path);
}

// Deprecated fallback method, kept for compatibility if needed
export async function loadHandout(subject, topicFolder) {
    const path = `/Handout/${subject}/${topicFolder}/handout.csv`;
    return fetchCSV(path);
}

// --- LEGACY SUPPORT (Deprecating slowly) ---

/**
 * Load sections (Old structure)
 * We will map the new "Pages" to "Sections" format for compatibility with existing UI
 */
export async function loadSections(subject, topicFolder) {
    const indexData = await loadStudyGuideIndex(subject, topicFolder);

    // Transform index.csv to section structure
    // index.csv: page_id, page_file, page_title, order_index, questions_file
    // section: section_id, topic_id, section_title, section_icon, section_type

    if (indexData.length > 0) {
        return indexData.map(page => ({
            section_id: page.page_id || `page-${page.order_index}`,
            section_title: page.page_title,
            section_type: 'content', // Generic type
            file: page.page_file,
            questions_file: page.questions_file,
            order_index: page.order_index
        }));
    }

    // Fallback to old path if new structure empty
    const path = `/studyguide/${subject}/${topicFolder}/sections.csv`;
    return fetchCSV(path);
}

/**
 * Load study content (Old structure)
 * This is tricky because the new structure is file-per-page.
 * The UnifiedDataService needs to handle this aggregation.
 */
export async function loadStudyContent(subject, topicFolder) {
    // This is primarily used by unifiedDataService to load ALL content at once.
    // For the new structure, we might return an empty array here and let the
    // Component load data on demand, OR we pre-load everything.
    // Given the prompt "Load page wise", we should shift to on-demand loading.

    // However, to keep existing app working, we might try to load the OLD content.csv
    const path = `/studyguide/${subject}/${topicFolder}/content.csv`;
    return fetchCSV(path);
}

export async function loadQuizQuestions(subject, topicFolder) {
    // Attempt to load Questionnaire1.csv by default for legacy calls
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const path = `/${subjectName}/${topicFolder}/questionnaire/Quiz/Questionnaire1.csv`;
    const data = await fetchCSV(path);

    if (data.length > 0) return data;

    // Fallback
    return fetchCSV(`/questionnaire/${subject}/${topicFolder}/questions.csv`);
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
    getAllSubjects,
    // New Methods
    loadStudyGuideIndex,
    loadPageContent,
    loadConceptCheck,
    listQuizzes,
    loadQuiz,
    loadHandoutIndex,
    loadHandoutPage,
    checkBackendStatus,
    API_URL
};

export default csvService;
