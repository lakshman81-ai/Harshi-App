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
 * Load data from new CSV structure
 * @returns {Promise<Object>} Application data in Excel-compatible format
 */
async function loadFromCSV() {
    log('Loading from CSV structure...');

    const masterIndex = await csvService.loadMasterIndex('questionnaire');
    if (!masterIndex || masterIndex.length === 0) {
        throw new Error('Master index not found or empty');
    }

    // Extract subjects
    const subjectsMap = {};
    masterIndex.forEach(item => {
        if (!subjectsMap[item.subject_key]) {
            subjectsMap[item.subject_key] = {
                subject_id: item.subject_key,
                subject_key: item.subject_key,
                name: item.subject_name,
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

    for (const topic of topics) {
        const subject = topic.subject_key.charAt(0).toUpperCase() + topic.subject_key.slice(1);

        // Load quiz questions
        try {
            const questions = await csvService.loadQuizQuestions(subject, topic.topic_folder);
            quizQuestions.push(...questions);
        } catch (error) {
            log(`No quiz questions for ${topic.topic_id}`, error);
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

    // Return data in Excel-compatible format
    return {
        SUBJECTS: Object.values(subjectsMap),
        TOPICS: topics,
        QUIZ_QUESTIONS: quizQuestions,
        STUDY_CONTENT: studyContent,
        TOPIC_SECTIONS: [],
        LEARNING_OBJECTIVES: [],
        KEY_TERMS: [],
        FORMULAS: [],
        ACHIEVEMENTS: [],
        APP_SETTINGS: [],
        DAILY_CHALLENGES: [],
        _dataSource: 'csv'
    };
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
