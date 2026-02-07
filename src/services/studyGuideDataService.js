/**
 * Study Guide Data Service
 * Loads misconceptions, quiz, and key terms for specific topics
 * 
 * @module studyGuideDataService
 * @description Graceful degradation: Returns empty arrays on failure
 * @reasoning Missing files should not break UI; just hide features
 */
import Papa from 'papaparse';
import { Logger } from './Logger';

const PUBLIC_URL = process.env.PUBLIC_URL || '';
const CONTEXT = 'StudyGuideDataService';

// ... typedefs ...

/**
 * Load CSV from public folder with error handling
 * @param {string} path - Relative path from public folder
 * @returns {Promise<Array>} Parsed data or empty array
 */
export async function loadStudyGuideCSV(path) {
    const url = `${PUBLIC_URL}/${path}`;

    try {
        Logger.data(`Loading CSV: ${path}`, { url }, CONTEXT);
        const response = await fetch(url);

        // DECISION GATE: File exists?
        if (!response.ok) {
            // Log 404s as warnings (expected for optional files)
            if (response.status === 404) {
                Logger.warn(`File not found: ${path}`, { status: 404 }, CONTEXT);
            } else {
                Logger.error(`HTTP Error loading ${path}`, { status: response.status }, CONTEXT);
            }
            return []; // Graceful fallback
        }

        const csvText = await response.text();

        // DECISION GATE: Valid CSV?
        const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
        });

        if (result.errors.length > 0) {
            Logger.warn(`Parse warnings for ${path}`, result.errors, CONTEXT);
            // Continue anyway - partial data is better than no data
        }

        Logger.data(`Loaded ${result.data.length} rows from ${path}`, null, CONTEXT);
        return result.data;

    } catch (error) {
        // ERROR LOGGING: Network/fetch errors
        Logger.error(`Failed to load ${path}`, error, CONTEXT);
        return []; // Graceful fallback
    }
}

/**
 * Load misconceptions for a topic
 * @param {string} subject - e.g., "Physics"
 * @param {string} topic - e.g., "Newtons-Laws"
 * @returns {Promise<Misconception[]>} Misconceptions or empty array
 */
export async function loadMisconceptions(subject, topic) {
    const path = `studyguide/${subject}/${topic}/misconceptions.csv`;
    const rows = await loadStudyGuideCSV(path);
    return rows.map(normalizeMisconception);
}

/**
 * Load mini-quiz questions for a topic
 * @param {string} subject 
 * @param {string} topic 
 * @returns {Promise<QuizQuestion[]>} Questions or empty array
 */
export async function loadSubtopicQuiz(subject, topic) {
    const path = `studyguide/${subject}/${topic}/quiz.csv`;
    const rows = await loadStudyGuideCSV(path);
    return rows.map(normalizeQuizQuestion);
}

/**
 * Normalize misconception data from CSV
 * @param {Object} row - Raw CSV row
 * @returns {Misconception}
 */
function normalizeMisconception(row) {
    return {
        id: row.id || row.misconception_id || `misc-${Math.random().toString(36).slice(2, 9)}`,
        subtopicId: row.subtopic_id || row.section_id || 'default',
        title: row.title || row.name || 'Common Mistake',
        explanation: row.explanation || row.text || '',
        wrongExample: row.wrong_example || row.wrong || '',
        correctExample: row.correct_example || row.correct || '',
    };
}

/**
 * Normalize quiz question from CSV
 * FALLBACK: Handles various CSV column name variations
 * @param {Object} row - Raw CSV row
 * @returns {QuizQuestion}
 */
export function normalizeQuizQuestion(row) {
    return {
        id: row.id || row.question_id || `q-${Math.random().toString(36).slice(2, 9)}`,
        subtopicId: row.subtopic_id || row.section_id || 'default',
        type: (row.question_type || row.type || 'mcq').toLowerCase(),
        text: row.question_text || row.text || row.question || '',
        options: parseOptions(row.options),
        correctAnswer: row.correct_answer || row.answer || '',
        acceptedAnswers: parseOptions(row.accepted_answers || row.correct_answer),
        hint: row.hint || '',
        explanation: row.explanation || '',
        pairs: row.pairs || '', // For matching questions
    };
}

/**
 * Parse options from various formats
 * SUPPORTS: "A|B|C|D", "A,B,C,D", or already-parsed array
 * @param {string|Array} optionsStr 
 * @returns {string[]}
 */
function parseOptions(optionsStr) {
    if (!optionsStr) return [];
    if (Array.isArray(optionsStr)) return optionsStr;
    // Support: "A|B|C|D" or "A,B,C,D"
    return optionsStr.split(/[|,]/).map(o => o.trim()).filter(Boolean);
}

/**
 * Filter items by subtopic ID
 * @template T
 * @param {T[]} items - Array of items with subtopicId
 * @param {string} subtopicId - Subtopic to filter by
 * @returns {T[]}
 */
export function filterBySubtopic(items, subtopicId) {
    if (!subtopicId || !items || items.length === 0) return items;
    return items.filter(item => item.subtopicId === subtopicId);
}
