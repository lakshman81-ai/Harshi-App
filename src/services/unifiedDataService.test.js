import { validateData } from './unifiedDataService';
import { Logger } from './Logger';

// Helper to reset module state/mocks
jest.mock('./Logger');

describe('unifiedDataService - Data Validation Gates', () => {

    // Valid data sample
    const validData = {
        SUBJECTS: [{ subject_id: 'math', name: 'Math' }],
        TOPICS: [{ topic_id: 'algebra', topic_name: 'Algebra', subject_key: 'math' }],
        QUIZ_QUESTIONS: [{ question_id: 'q1', topic_id: 'algebra', question_text: '1+1?' }],
        STUDY_CONTENT: [{ content_id: 'c1', topic_id: 'algebra', title: 'Intro' }]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Gate Check: Should pass with valid data structure', () => {
        expect(() => validateData(validData)).not.toThrow();
        expect(Logger.gate).toHaveBeenCalledWith('Data Validation', true);
    });

    test('Gate Check: Should fail when SUBJECTS are missing', () => {
        const invalidData = { ...validData };
        delete invalidData.SUBJECTS;

        expect(() => validateData(invalidData)).toThrow(/Missing keys SUBJECTS/);
        expect(Logger.gate).toHaveBeenCalledWith('Data Validation', false);
    });

    test('Gate Check: Should fail when SUBJECTS are empty', () => {
        const invalidData = { ...validData, SUBJECTS: [] };

        expect(() => validateData(invalidData)).toThrow(/No subjects loaded/);
        expect(Logger.gate).toHaveBeenCalledWith('Data Validation', false);
    });
});
