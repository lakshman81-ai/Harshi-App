export const BENCHMARK_DATA = {
    SUBJECTS: [
        {
            subject_id: 'benchmark',
            subject_key: 'benchmark',
            name: 'Benchmark Suite',
            icon: 'Activity',
            color_hex: '#ec4899',
            gradient: 'from-pink-500 to-rose-500'
        }
    ],
    TOPICS: [
        {
            topic_id: 'flow-test',
            subject_key: 'benchmark',
            topic_name: 'Pedagogy: Flow State',
            topic_folder: 'flow',
            duration_minutes: 5,
            order_index: 0
        },
        {
            topic_id: 'struggle-test',
            subject_key: 'benchmark',
            topic_name: 'Pedagogy: Struggle Detect',
            topic_folder: 'struggle',
            duration_minutes: 5,
            order_index: 1
        },
        {
            topic_id: 'render-test',
            subject_key: 'benchmark',
            topic_name: 'Content Rendering',
            topic_folder: 'render',
            duration_minutes: 5,
            order_index: 2
        }
    ],
    QUIZ_QUESTIONS: [
        // FLOW_01: 5 Easy questions
        {
            id: 'flow-1',
            topic_id: 'flow-test',
            question: '1+1 = ?',
            options: ['2', '3', '4', '5'],
            correctAnswer: 'A', // 2
            difficulty: 'easy',
            xpReward: 10,
            type: 'mcq'
        },
        {
            id: 'flow-2',
            topic_id: 'flow-test',
            question: '2+2 = ?',
            options: ['4', '5', '6', '7'],
            correctAnswer: 'A', // 4
            difficulty: 'easy',
            xpReward: 10,
            type: 'mcq'
        },
        {
            id: 'flow-3',
            topic_id: 'flow-test',
            question: '3+3 = ?',
            options: ['6', '7', '8', '9'],
            correctAnswer: 'A', // 6
            difficulty: 'easy',
            xpReward: 10,
            type: 'mcq'
        },
        {
            id: 'flow-4',
            topic_id: 'flow-test',
            question: '4+4 = ?',
            options: ['8', '9', '10', '11'],
            correctAnswer: 'A', // 8
            difficulty: 'easy',
            xpReward: 10,
            type: 'mcq'
        },
        {
            id: 'flow-5',
            topic_id: 'flow-test',
            question: '5+5 = ?',
            options: ['10', '11', '12', '13'],
            correctAnswer: 'A', // 10
            difficulty: 'easy',
            xpReward: 10,
            type: 'mcq'
        },
        // STRUGGLE_01
        {
            id: 'struggle-1',
            topic_id: 'struggle-test',
            question: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 'C', // Paris
            difficulty: 'medium',
            hint: 'It starts with P',
            xpReward: 10,
            type: 'mcq'
        },
        // RENDER_01
        {
            id: 'render-1',
            topic_id: 'render-test',
            question: 'Solve for x: $$ x^2 - 4 = 0 $$',
            options: ['2', '4', '8', '16'],
            correctAnswer: 'A',
            difficulty: 'medium',
            xpReward: 10,
            type: 'mcq'
        },
        // RENDER_02
        {
            id: 'render-2',
            topic_id: 'render-test',
            question: 'What does this diagram represent?',
            explanation: "```mermaid\ngraph TD;\nA-->B;\nB-->C;\n```",
            options: ['Flowchart', 'Sequence', 'Gantt', 'Pie'],
            correctAnswer: 'A',
            difficulty: 'medium',
            xpReward: 10,
            type: 'mcq'
        },
        // RENDER_03
        {
            id: 'render-3',
            topic_id: 'render-test',
            question: 'Watch this video:',
            explanation: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            options: ['Rick', 'Roll', 'Never', 'Gonna'],
            correctAnswer: 'A',
            difficulty: 'medium',
            xpReward: 10,
            type: 'mcq'
        }
    ],
    STUDY_CONTENT: [],
    TOPIC_SECTIONS: [],
    LEARNING_OBJECTIVES: [],
    KEY_TERMS: [],
    FORMULAS: [],
    ACHIEVEMENTS: [],
    APP_SETTINGS: [],
    DAILY_CHALLENGES: [],
    _dataSource: 'benchmark'
};
