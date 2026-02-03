import { log } from '../utils';

export class DataTransformer {
    // Transform subjects sheet
    static transformSubjects(rows) {
        const subjects = {};

        rows.forEach(row => {
            const key = row.subject_key;
            if (!key) return;

            subjects[key] = {
                id: row.subject_id || key,
                name: row.name || key,
                icon: row.icon || 'BookOpen',
                color: row.color_hex || '#6366F1',
                lightBg: row.light_bg || 'bg-slate-50',
                gradient: `from-${row.gradient_from || 'slate-500'} to-${row.gradient_to || 'slate-600'}`,
                darkGlow: row.dark_glow || 'shadow-slate-500/20',
                topics: []
            };
        });

        return subjects;
    }

    // Transform topics and attach to subjects
    static transformTopics(rows, subjects) {
        rows.forEach(row => {
            const subjectKey = row.subject_key;
            if (!subjectKey || !subjects[subjectKey]) return;

            subjects[subjectKey].topics.push({
                id: row.topic_id,
                name: row.topic_name,
                duration: parseInt(row.duration_minutes) || 20,
                orderIndex: parseInt(row.order_index) || 0
            });
        });

        // Sort topics by order index
        Object.values(subjects).forEach(subject => {
            subject.topics.sort((a, b) => a.orderIndex - b.orderIndex);
        });

        return subjects;
    }

    // Transform sections (grouped by topic_id)
    static transformSections(rows) {
        const sections = {};

        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;

            if (!sections[topicId]) {
                sections[topicId] = [];
            }

            sections[topicId].push({
                id: row.section_id,
                title: row.section_title,
                icon: row.section_icon || 'FileText',
                type: row.section_type || 'content',
                orderIndex: parseInt(row.order_index) || 0
            });
        });

        // Sort by order index
        Object.values(sections).forEach(arr => {
            arr.sort((a, b) => a.orderIndex - b.orderIndex);
        });

        return sections;
    }

    // Transform learning objectives (grouped by topic_id)
    static transformObjectives(rows) {
        const objectives = {};

        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;

            if (!objectives[topicId]) {
                objectives[topicId] = [];
            }

            objectives[topicId].push({
                id: row.objective_id,
                text: row.objective_text,
                orderIndex: parseInt(row.order_index) || 0
            });
        });

        Object.values(objectives).forEach(arr => {
            arr.sort((a, b) => a.orderIndex - b.orderIndex);
        });

        return objectives;
    }

    // Transform key terms (grouped by topic_id)
    static transformKeyTerms(rows) {
        const terms = {};

        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;

            if (!terms[topicId]) {
                terms[topicId] = [];
            }

            terms[topicId].push({
                id: row.term_id,
                term: row.term,
                definition: row.definition
            });
        });

        return terms;
    }

    // Transform study content (grouped by section_id)
    static transformContent(rows) {
        const content = {};

        rows.forEach(row => {
            const sectionId = row.section_id;
            if (!sectionId) return;

            if (!content[sectionId]) {
                content[sectionId] = [];
            }

            content[sectionId].push({
                id: row.content_id,
                type: row.content_type || 'text',
                title: row.content_title || '',
                text: row.content_text || '',
                orderIndex: parseInt(row.order_index) || 0,
                imageUrl: row.image_url || '',
                videoUrl: row.video_url || ''
            });
        });

        Object.values(content).forEach(arr => {
            arr.sort((a, b) => a.orderIndex - b.orderIndex);
        });

        return content;
    }

    // Transform formulas (grouped by topic_id)
    static transformFormulas(rows) {
        const formulas = {};

        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;

            if (!formulas[topicId]) {
                formulas[topicId] = [];
            }

            const variables = [];
            for (let i = 1; i <= 5; i++) {
                const symbol = row[`variable_${i}_symbol`];
                if (symbol) {
                    variables.push({
                        symbol,
                        name: row[`variable_${i}_name`] || '',
                        unit: row[`variable_${i}_unit`] || ''
                    });
                }
            }

            formulas[topicId].push({
                id: row.formula_id,
                formula: row.formula_text,
                label: row.formula_label || '',
                variables
            });
        });

        return formulas;
    }

    // Transform quiz questions (grouped by topic_id)
    static transformQuizzes(rows) {
        const quizzes = {};

        rows.forEach(row => {
            const topicId = row.topic_id;
            if (!topicId) return;

            if (!quizzes[topicId]) {
                quizzes[topicId] = [];
            }

            quizzes[topicId].push({
                id: row.question_id,
                question: row.question_text,
                options: [
                    { label: 'A', text: row.option_a || '' },
                    { label: 'B', text: row.option_b || '' },
                    { label: 'C', text: row.option_c || '' },
                    { label: 'D', text: row.option_d || '' }
                ].filter(opt => opt.text),
                correctAnswer: row.correct_answer?.toUpperCase() || 'A',
                explanation: row.explanation || '',
                xpReward: parseInt(row.xp_reward) || 10
            });
        });

        return quizzes;
    }

    // Transform achievements
    static transformAchievements(rows) {
        return rows.map(row => ({
            id: row.achievement_id,
            icon: row.icon || 'Star',
            name: row.name,
            desc: row.description,
            condition: row.unlock_condition || ''
        }));
    }

    // Transform daily challenges
    static transformDailyChallenges(rows) {
        return rows.map(row => {
            const questionText = row.question_text || row.question || row.challenge || row.daily_challenge || row.challenge_text || row.description || row.text || row.daily_question;

            if (!questionText) {
                console.warn('Daily Challenge: Missing Question Text. Available keys:', Object.keys(row));
            }

            return {
                id: row.challenge_id || row.id || `dc-${Math.random().toString(36).substr(2, 9)}`,
                subjectKey: (row.subject_key || row.subject || 'math').toLowerCase(),
                difficulty: (row.difficulty || 'medium').toLowerCase(),
                question: questionText || `DEBUG: ${JSON.stringify(row)}`,
                options: [
                    { label: 'A', text: row.option_a || row.a },
                    { label: 'B', text: row.option_b || row.b },
                    { label: 'C', text: row.option_c || row.c },
                    { label: 'D', text: row.option_d || row.d }
                ].filter(opt => opt.text),
                correctAnswer: (row.correct_answer || row.correct || 'A').toUpperCase(),
                hint: row.hint,
                explanation: row.explanation,
                xpReward: parseInt(row.xp_reward || row.xp || 20),
                imageUrl: row.image_url || row.image
            };
        });
    }

    // Transform all data
    static transformAll(rawData) {
        log('Transforming data...');

        // Build subjects with topics
        let subjects = this.transformSubjects(rawData.SUBJECTS || []);
        subjects = this.transformTopics(rawData.TOPICS || [], subjects);

        return {
            subjects,
            sections: this.transformSections(rawData.TOPIC_SECTIONS || []),
            objectives: this.transformObjectives(rawData.LEARNING_OBJECTIVES || []),
            keyTerms: this.transformKeyTerms(rawData.KEY_TERMS || []),
            studyContent: this.transformContent(rawData.STUDY_CONTENT || []),
            formulas: this.transformFormulas(rawData.FORMULAS || []),
            quizQuestions: this.transformQuizzes(rawData.QUIZ_QUESTIONS || []),
            achievements: this.transformAchievements(rawData.ACHIEVEMENTS || []),
            dailyChallenges: this.transformDailyChallenges(rawData.DAILY_CHALLENGES || [])
        };
    }
}
