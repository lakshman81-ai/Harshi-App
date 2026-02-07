/**
 * Unified Data Service
 * Provides a unified interface to load data from either CSV or Excel sources
 * Falls back from CSV to Excel if needed
 */

import csvService from './csvService';
import { fetchLocalExcelData } from './excelService';
import { log } from '../utils';
import { Logger } from './Logger';

// Configuration: Set data source priority 
// 'csv-first' = Try CSV first, fallback to Excel
// 'excel-only' = Use only Excel
const DATA_SOURCE_MODE = 'csv-first';

/**
 * Load all application data with fallback support
 * @returns {Promise<Object>} Complete application data
 */
export async function loadAppData() {
    log('Loading application data...');
    Logger.info('Starting data load process', { mode: DATA_SOURCE_MODE });

    if (DATA_SOURCE_MODE === 'csv-first') {
        try {
            const data = await loadFromCSV();
            validateData(data);
            Logger.gate('Data Load', true);
            return data;
        } catch (csvError) {
            console.error('❌ [loadAppData] CSV loading FAILED:', csvError);
            console.error('❌ [loadAppData] Error message:', csvError.message);
            console.error('❌ [loadAppData] Error stack:', csvError.stack);
            Logger.warn('CSV loading failed, falling back to Excel', csvError);
            log('CSV loading failed, falling back to Excel:', csvError);
            try {
                const excelData = await loadFromExcel();
                validateData(excelData);
                Logger.gate('Fallback Data Load', true);
                return excelData;
            } catch (excelError) {
                Logger.gate('Data Load', false);
                Logger.error('All data loading methods failed', excelError);
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
        console.log(`[unifiedDataService] Question ${row.id || index}: No type specified, defaulting to 'mcq'`);
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
        log('Loading from CSV structure...');

        const masterIndex = await csvService.loadMasterIndex('questionnaire');
        if (!masterIndex || masterIndex.length === 0) {
            throw new Error('Master index not found or empty');
        }

        // Extract subjects
        const subjectsMap = {};
        masterIndex.forEach(item => {
            // Skip items without a subject_key
            if (!item.subject_key) {
                console.warn('Skipping item without subject_key:', item);
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
                log(`No quiz questions for ${topic.topic_id}`, error);
            }

            // Load sections
            try {
                console.log(`🟢 [unifiedDataService] Loading sections for topic: ${topic.topic_id}, folder: ${topic.topic_folder}, subject: ${subject}`);
                const sections = await csvService.loadSections(subject, topic.topic_folder);
                console.log(`🟢 [unifiedDataService] Raw sections loaded for ${topic.topic_id}:`, sections);
                const sectionsWithTopicId = sections.map(item => ({
                    ...item,
                    topic_id: item.topic_id || topic.topic_id
                }));
                console.log(`🟢 [unifiedDataService] Sections after adding topic_id for ${topic.topic_id}:`, sectionsWithTopicId);
                topicSections.push(...sectionsWithTopicId);
            } catch (error) {
                console.warn(`⚠️ [unifiedDataService] No sections for ${topic.topic_id}`, error);
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
                log(`No study content for ${topic.topic_id}`, error);
            }
        }

        log(`Loaded ${quizQuestions.length} quiz questions from CSV`);
        log(`Loaded ${studyContent.length} study content items from CSV`);
        log(`Loaded ${topicSections.length} topic sections from CSV`);

        // Debug: Log sections by topic
        const sectionsByTopic = {};
        topicSections.forEach(section => {
            if (!sectionsByTopic[section.topic_id]) {
                sectionsByTopic[section.topic_id] = [];
            }
            sectionsByTopic[section.topic_id].push(section);
        });
        console.log('[unifiedDataService] Sections by topic:', sectionsByTopic);

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
        console.error('❌ [unifiedDataService] loadAppData FAILED with error:', error);
        console.error('❌ [unifiedDataService] Error stack:', error.stack);
        throw error; // Re-throw so fallback mechanism works
    }
}

/**
 * Load data from Excel files
 * @returns {Promise<Object>} Application data
 */
async function loadFromExcel() {
    log('Loading from Excel files...');
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
        Logger.gate('Data Validation', false);
        throw new Error(msg);
    }

    // Check if subjects exist
    if (!data.SUBJECTS || data.SUBJECTS.length === 0) {
        const msg = 'Data validation failed: No subjects loaded';
        Logger.gate('Data Validation', false);
        throw new Error(msg);
    }

    Logger.gate('Data Validation', true);
    return true;
}

const unifiedDataService = {
    loadAppData,
    loadFromCSV,
    loadFromExcel
};

export default unifiedDataService;
