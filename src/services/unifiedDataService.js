/**
 * Unified Data Service
 * Provides a unified interface to load data from either CSV or Excel sources
 * Falls back from CSV to Excel if needed
 */

import csvService from './csvService';
import { fetchLocalExcelData } from './excelService';
import { Logger } from './Logger';

export { csvService };

// Configuration: Set data source priority 
// 'csv-first' = Try CSV first, fallback to Excel
// 'excel-only' = Use only Excel
const DATA_SOURCE_MODE = 'csv-first';
const CONTEXT = 'UnifiedDataService';

/**
 * Load all application data with fallback support
 * @returns {Promise<Object>} Complete application data
 */
export async function loadAppData() {
    Logger.info('Starting data load process', { mode: DATA_SOURCE_MODE }, CONTEXT);

    if (DATA_SOURCE_MODE === 'csv-first') {
        try {
            const data = await loadFromCSV();
            validateData(data);
            Logger.gate('Data Load', true, CONTEXT);
            return data;
        } catch (csvError) {
            Logger.error('CSV loading failed, falling back to Excel', csvError, CONTEXT);
            try {
                const excelData = await loadFromExcel();
                validateData(excelData);
                Logger.gate('Fallback Data Load', true, CONTEXT);
                return excelData;
            } catch (excelError) {
                Logger.gate('Data Load', false, CONTEXT);
                Logger.error('All data loading methods failed', excelError, CONTEXT);
                throw excelError;
            }
        }
    }

    // Default to Excel
    return await loadFromExcel();
}

/**
 * HELPER: Normalize quiz question from CSV row
 * BEST PRACTICE: Always normalize the question type to lowercase
 * FALLBACK: Default to 'mcq' if type is missing or empty
 * ERROR LOGGING: Log when falling back to MCQ
 */
function normalizeQuizQuestion(row, index) {
    // DECISION GATE: Does the row have a type field?
    const rawType = row.question_type || row.type || '';
    const normalizedType = rawType.toLowerCase().trim() || 'mcq';

    // ERROR LOGGING: Warn if type was missing
    if (!rawType) {
        Logger.warn(`Question ${row.id || index}: No type specified, defaulting to 'mcq'`, null, CONTEXT);
    }

    return {
        id: row.id || row.question_id || `q-${index}`,
        question: row.question || row.question_text || '',
        options: parseOptions(row.options),
        correctAnswer: row.correct_answer || row.answer || '',
        hint: row.hint || '',
        explanation: row.explanation || '',
        difficulty: (row.difficulty || 'medium').toLowerCase(),
        xpReward: parseInt(row.xp_reward, 10) || 10,
        imageUrl: row.image_url || row.imageUrl || '',

        // NEW FIELDS for diverse question types
        type: normalizedType,
        acceptedAnswers: row.accepted_answers || row.correct_answer || '',
        pairs: row.pairs || '',
    };
}

/**
 * HELPER: Parse options from various formats
 * SUPPORTS: "A|B|C|D", "A,B,C,D", or already-parsed array
 * FALLBACK: Return empty array if parsing fails
 */
function parseOptions(optionsStr) {
    // DECISION GATE: Is input already an array?
    if (Array.isArray(optionsStr)) return optionsStr;

    // DECISION GATE: Is input a string?
    if (typeof optionsStr === 'string' && optionsStr.trim()) {
        return optionsStr.split(/[|,]/).map(o => o.trim()).filter(Boolean);
    }

    // FALLBACK: Return empty array
    return [];
}

/**
 * Load data from new CSV structure
 * @returns {Promise<Object>} Application data in Excel-compatible format
 */
async function loadFromCSV() {
    try {
        Logger.info('Loading from CSV structure...', null, CONTEXT);

        const masterIndex = await csvService.loadMasterIndex('questionnaire');
        if (!masterIndex || masterIndex.length === 0) {
            throw new Error('Master index not found or empty');
        }

        // Extract subjects
        const subjectsMap = {};
        masterIndex.forEach(item => {
            // Skip items without a subject_key
            if (!item.subject_key) {
                Logger.warn('Skipping item without subject_key', item, CONTEXT);
                return;
            }

            if (!subjectsMap[item.subject_key]) {
                subjectsMap[item.subject_key] = {
                    subject_id: item.subject_key,
                    subject_key: item.subject_key,
                    name: item.subject_name || item.subject_key,
                    icon: getSubjectIcon(item.subject_key),
                    color_hex: getSubjectColor(item.subject_key)
                };
            }
        });

        // Build topics array
        const topics = masterIndex.map(item => ({
            topic_id: item.topic_id,
            subject_key: item.subject_key,
            topic_name: item.topic_name,
            topic_folder: item.topic_folder,
            duration_minutes: 30,
            order_index: 0
        }));

        // Load quiz questions from all topics
        const quizQuestions = [];
        const studyContent = [];
        const topicSections = [];

        for (const topic of topics) {
            const subject = topic.subject_key.charAt(0).toUpperCase() + topic.subject_key.slice(1);

            // Load quiz questions
            try {
                const rawQuestions = await csvService.loadQuizQuestions(subject, topic.topic_folder);
                // Normalize each question to ensure type field is present
                const normalizedQuestions = rawQuestions.map((q, idx) => normalizeQuizQuestion(q, idx));
                quizQuestions.push(...normalizedQuestions);
            } catch (error) {
                Logger.warn(`No quiz questions for ${topic.topic_id}`, error, CONTEXT);
            }

            // Load sections
            try {
                Logger.data(`Loading sections for topic: ${topic.topic_id}`, { folder: topic.topic_folder, subject }, CONTEXT);
                const sections = await csvService.loadSections(subject, topic.topic_folder);
                const sectionsWithTopicId = sections.map(item => ({
                    ...item,
                    topic_id: item.topic_id || topic.topic_id
                }));
                topicSections.push(...sectionsWithTopicId);
            } catch (error) {
                Logger.warn(`No sections for ${topic.topic_id}`, error, CONTEXT);
            }

            // Load study content
            try {
                const content = await csvService.loadStudyContent(subject, topic.topic_folder);
                // Add topic_id to each content item if not present
                const contentWithTopicId = content.map(item => ({
                    ...item,
                    topic_id: item.topic_id || topic.topic_id
                }));
                studyContent.push(...contentWithTopicId);
            } catch (error) {
                Logger.warn(`No study content for ${topic.topic_id}`, error, CONTEXT);
            }
        }

        Logger.data(`CSV Load Summary`, {
            quizQuestions: quizQuestions.length,
            studyContent: studyContent.length,
            topicSections: topicSections.length
        }, CONTEXT);

        // Return data in Excel-compatible format
        return {
            SUBJECTS: Object.values(subjectsMap),
            TOPICS: topics,
            QUIZ_QUESTIONS: quizQuestions,
            STUDY_CONTENT: studyContent,
            TOPIC_SECTIONS: topicSections,
            LEARNING_OBJECTIVES: [],
            KEY_TERMS: [],
            FORMULAS: [],
            ACHIEVEMENTS: [],
            APP_SETTINGS: [],
            DAILY_CHALLENGES: [],
            _dataSource: 'csv'
        };
    }
    catch (error) {
        Logger.error('loadAppData FAILED', error, CONTEXT);
        throw error; // Re-throw so fallback mechanism works
    }
}

/**
 * Load data from Excel files
 * @returns {Promise<Object>} Application data
 */
async function loadFromExcel() {
    Logger.info('Loading from Excel files...', null, CONTEXT);
    const data = await fetchLocalExcelData();
    return {
        ...data,
        _dataSource: 'excel'
    };
}

/**
 * Get default icon for a subject
 */
function getSubjectIcon(subjectKey) {
    if (!subjectKey || typeof subjectKey !== 'string') {
        return 'Book';
    }

    const icons = {
        physics: 'Zap',
        math: 'Calculator',
        mathematics: 'Calculator',
        chemistry: 'Flask',
        biology: 'Leaf'
    };
    return icons[subjectKey.toLowerCase()] || 'Book';
}

/**
 * Get default color for a subject
 */
function getSubjectColor(subjectKey) {
    if (!subjectKey || typeof subjectKey !== 'string') {
        return '#6B7280';
    }

    const colors = {
        physics: '#3B82F6',
        math: '#10B981',
        mathematics: '#10B981',
        chemistry: '#8B5CF6',
        biology: '#059669'
    };
    return colors[subjectKey.toLowerCase()] || '#6B7280';
}

/**
 * Validate loaded data structure
 */
export function validateData(data) {
    const requiredKeys = ['SUBJECTS', 'TOPICS', 'QUIZ_QUESTIONS', 'STUDY_CONTENT'];
    const missingKeys = requiredKeys.filter(k => !data[k]);

    if (missingKeys.length > 0) {
        const msg = `Data validation failed: Missing keys ${missingKeys.join(', ')}`;
        Logger.gate('Data Validation', false, CONTEXT);
        throw new Error(msg);
    }

    // Check if subjects exist
    if (!data.SUBJECTS || data.SUBJECTS.length === 0) {
        const msg = 'Data validation failed: No subjects loaded';
        Logger.gate('Data Validation', false, CONTEXT);
        throw new Error(msg);
    }

    Logger.gate('Data Validation', true, CONTEXT);
    return true;
}

const unifiedDataService = {
    loadAppData,
    loadFromCSV,
    loadFromExcel
};

export default unifiedDataService;
