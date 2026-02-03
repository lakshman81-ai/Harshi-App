import { DataTransformer } from './DataTransformer';

describe('DataTransformer', () => {
    describe('transformDailyChallenges', () => {
        test('handles standard snake_case columns', () => {
            const input = [{
                challenge_id: '1',
                question_text: 'What is 2+2?',
                option_a: '3',
                option_b: '4',
                option_c: '5',
                option_d: '6',
                correct_answer: 'B',
                subject_key: 'Math',
                difficulty: 'Easy',
                xp_reward: '10'
            }];

            const result = DataTransformer.transformDailyChallenges(input);
            expect(result[0].id).toBe('1');
            expect(result[0].question).toBe('What is 2+2?');
            expect(result[0].options).toHaveLength(4);
            expect(result[0].correctAnswer).toBe('B');
            expect(result[0].subjectKey).toBe('math');
        });

        test('handles Title Case and alternative columns', () => {
            const input = [{
                ID: '2',
                Question: 'Capital of France?',
                'Option A': 'London',
                'Option B': 'Paris',
                Correct: 'B',
                Subject: 'Geography',
                XP: '20'
            }];

            const result = DataTransformer.transformDailyChallenges(input);
            expect(result[0].question).toBe('Capital of France?');
            expect(result[0].correctAnswer).toBe('B');
            expect(result[0].options[0].text).toBe('London');
            expect(result[0].subjectKey).toBe('geography');
            expect(result[0].xpReward).toBe(20);
        });

        test('handles missing or partial data gracefully', () => {
            const input = [{
                question: 'Partial Question',
                A: 'Yes',
                B: 'No'
            }];

            const result = DataTransformer.transformDailyChallenges(input);
            expect(result[0].question).toBe('Partial Question');
            expect(result[0].options).toHaveLength(2);
            expect(result[0].correctAnswer).toBe('A'); // Default
            expect(result[0].subjectKey).toBe('math'); // Default
        });
    });
});
