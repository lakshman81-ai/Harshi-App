import { selectQuestions, calculateMasteryLevel } from '../utils/AdaptiveEngine';

describe('AdaptiveEngine', () => {
    const mockPool = [
        { id: '1', difficulty: 'easy' },
        { id: '2', difficulty: 'easy' },
        { id: '3', difficulty: 'medium' },
        { id: '4', difficulty: 'medium' },
        { id: '5', difficulty: 'medium' },
        { id: '6', difficulty: 'hard' },
        { id: '7', difficulty: 'hard' }
    ];

    test('calculateMasteryLevel returns correct level', () => {
        expect(calculateMasteryLevel(10)).toBe('easy');
        expect(calculateMasteryLevel(40)).toBe('medium');
        expect(calculateMasteryLevel(80)).toBe('hard');
    });

    test('selectQuestions returns 5 questions', () => {
        const selected = selectQuestions([...mockPool], 50);
        expect(selected.length).toBe(5);
    });

    test('selectQuestions prioritizes difficulty based on mastery', () => {
        // High mastery -> should favor hard/medium
        const selectedHard = selectQuestions([...mockPool], 90);
        const hardCount = selectedHard.filter(q => q.difficulty === 'hard').length;
        expect(hardCount).toBeGreaterThan(0);

        // Low mastery -> should favor easy
        const selectedEasy = selectQuestions([...mockPool], 10);
        const easyCount = selectedEasy.filter(q => q.difficulty === 'easy').length;
        expect(easyCount).toBeGreaterThan(0);
    });
});
