import { Logger } from './Logger';

export class DataTransformer {
    /**
     * Helper to get value from row with case-insensitive key lookup
     * @param {Object} row - The data row
     * @param {string|string[]} keys - Key or array of keys to look for
     * @param {any} defaultValue - Fallback value
     */
    static _getValue(row, keys, defaultValue = null) {
        if (!row) return defaultValue;

        const searchKeys = Array.isArray(keys) ? keys : [keys];
        const rowKeys = Object.keys(row);
        const lowerRowKeys = rowKeys.map(k => k.toLowerCase());

        for (const key of searchKeys) {
            // Direct match
            if (row[key] !== undefined) return row[key];

            // Case-insensitive match
            const index = lowerRowKeys.indexOf(key.toLowerCase());
            if (index !== -1) {
                return row[rowKeys[index]];
            }
        }

        return defaultValue;
    }

    // Transform subjects sheet
    static transformSubjects(rows) {
        const subjects = {};

        rows.forEach(row => {
            const key = this._getValue(row, ['subject_key', 'subject', 'key']);
            if (!key) return;

            subjects[key] = {
                id: this._getValue(row, ['subject_id', 'id']) || key,
                name: this._getValue(row, ['subject_name', 'name']) || key,
                icon: this._getValue(row, 'icon', 'BookOpen'),
                color: this._getValue(row, ['color_hex', 'color'], '#6366F1'),
                lightBg: this._getValue(row, ['light_bg', 'bg'], 'bg-slate-50'),
                gradient: `from-${this._getValue(row, 'gradient_from', 'slate-500')} to-${this._getValue(row, 'gradient_to', 'slate-600')}`,
                darkGlow: this._getValue(row, 'dark_glow', 'shadow-slate-500/20'),
                topics: []
            };
        });

        return subjects;
    }

    // Transform topics and attach to subjects
    static transformTopics(rows, subjects) {
        rows.forEach(row => {
            const subjectKey = this._getValue(row, ['subject_key', 'subject']);
            if (!subjectKey || !subjects[subjectKey]) {
                if (subjectKey) Logger.warn(`Topic references unknown subject: ${subjectKey}`, row, 'DataTransformer');
                return;
            }

            subjects[subjectKey].topics.push({
                id: this._getValue(row, ['topic_id', 'id']),
                name: this._getValue(row, ['topic_name', 'name']),
                folder: this._getValue(row, ['topic_folder', 'folder']), // Added folder support
                duration: parseInt(this._getValue(row, ['duration_minutes', 'duration'], 20)),
                orderIndex: parseInt(this._getValue(row, ['order_index', 'order'], 0))
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
            const topicId = this._getValue(row, ['topic_id', 'topic']);
            if (!topicId) return;

            if (!sections[topicId]) {
                sections[topicId] = [];
            }

            sections[topicId].push({
                id: this._getValue(row, ['section_id', 'id']),
                title: this._getValue(row, ['section_title', 'title']),
                icon: this._getValue(row, ['section_icon', 'icon'], 'FileText'),
                type: this._getValue(row, ['section_type', 'type'], 'content'),
                orderIndex: parseInt(this._getValue(row, ['order_index', 'order'], 0))
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
            const topicId = this._getValue(row, ['topic_id', 'topic']);
            if (!topicId) return;

            if (!objectives[topicId]) {
                objectives[topicId] = [];
            }

            objectives[topicId].push({
                id: this._getValue(row, ['objective_id', 'id']),
                text: this._getValue(row, ['objective_text', 'text']),
                orderIndex: parseInt(this._getValue(row, ['order_index', 'order'], 0))
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
            const topicId = this._getValue(row, ['topic_id', 'topic']);
            if (!topicId) return;

            if (!terms[topicId]) {
                terms[topicId] = [];
            }

            terms[topicId].push({
                id: this._getValue(row, ['term_id', 'id']),
                term: this._getValue(row, ['term', 'name']),
                definition: this._getValue(row, ['definition', 'def'])
            });
        });

        return terms;
    }

    // Transform study content (grouped by section_id)
    static transformContent(rows) {
        const content = {};

        rows.forEach(row => {
            const sectionId = this._getValue(row, ['section_id', 'section']);
            if (!sectionId) return;

            if (!content[sectionId]) {
                content[sectionId] = [];
            }

            let interactiveData = null;
            const interactiveStr = this._getValue(row, ['interactive_data', 'data']);
            if (interactiveStr) {
                try {
                    interactiveData = JSON.parse(interactiveStr);
                } catch (e) {
                    Logger.warn('Failed to parse interactive_data', { error: e.message, row }, 'DataTransformer');
                }
            }

            const contentType = this._getValue(row, ['content_type', 'type'], 'text');
            const item = {
                id: this._getValue(row, ['content_id', 'id']),
                type: contentType,
                title: this._getValue(row, ['content_title', 'title'], ''),
                text: this._getValue(row, ['content_text', 'text', 'content'], ''),
                orderIndex: parseInt(this._getValue(row, ['order_index', 'order'], 0)),
                imageUrl: this._getValue(row, ['image_url', 'image'], ''),
                videoUrl: this._getValue(row, ['video_url', 'video'], ''),
                interactiveData: interactiveData,
            };

            // Enhanced mapping for specific content types
            if (contentType === 'misconception') {
                item.explanation = this._getValue(row, 'explanation', '');
                item.wrongExample = this._getValue(row, ['common_misconception', 'misconception', 'wrong_example'], '');
                item.correctExample = this._getValue(row, ['correction', 'correct_example'], '');
            }

            content[sectionId].push(item);
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
            const topicId = this._getValue(row, ['topic_id', 'topic']);
            if (!topicId) return;

            if (!formulas[topicId]) {
                formulas[topicId] = [];
            }

            const variables = [];
            for (let i = 1; i <= 5; i++) {
                const symbol = this._getValue(row, `variable_${i}_symbol`);
                if (symbol) {
                    variables.push({
                        symbol,
                        name: this._getValue(row, `variable_${i}_name`, ''),
                        unit: this._getValue(row, `variable_${i}_unit`, '')
                    });
                }
            }

            formulas[topicId].push({
                id: this._getValue(row, ['formula_id', 'id']),
                formula: this._getValue(row, ['formula_text', 'formula']),
                label: this._getValue(row, ['formula_label', 'label'], ''),
                variables
            });
        });

        return formulas;
    }

    // Transform quiz questions (grouped by topic_id)
    static transformQuizzes(rows) {
        const quizzes = {};

        rows.forEach(row => {
            const topicId = this._getValue(row, ['topic_id', 'topic']);
            if (!topicId) return;

            if (!quizzes[topicId]) {
                quizzes[topicId] = [];
            }

            quizzes[topicId].push({
                id: this._getValue(row, ['question_id', 'id']),
                question: this._getValue(row, ['question_text', 'question']),
                options: [
                    { label: 'A', text: this._getValue(row, ['option_a', 'a'], '') },
                    { label: 'B', text: this._getValue(row, ['option_b', 'b'], '') },
                    { label: 'C', text: this._getValue(row, ['option_c', 'c'], '') },
                    { label: 'D', text: this._getValue(row, ['option_d', 'd'], '') }
                ].filter(opt => opt.text),
                correctAnswer: (this._getValue(row, ['correct_answer', 'answer'], 'A')).toUpperCase(),
                explanation: this._getValue(row, 'explanation', ''),
                xpReward: parseInt(this._getValue(row, ['xp_reward', 'xp'], 10)),
                difficulty: (this._getValue(row, 'difficulty', 'medium')).toLowerCase()
            });
        });

        return quizzes;
    }

    // Transform achievements
    static transformAchievements(rows) {
        return rows.map(row => ({
            id: this._getValue(row, ['achievement_id', 'id']),
            icon: this._getValue(row, 'icon', 'Star'),
            name: this._getValue(row, 'name'),
            desc: this._getValue(row, ['description', 'desc']),
            condition: this._getValue(row, ['unlock_condition', 'condition'], '')
        }));
    }

    // Transform daily challenges
    static transformDailyChallenges(rows) {
        return rows.map(row => {
            const questionText = this._getValue(row, ['question_text', 'question', 'Question', 'challenge', 'daily_challenge', 'challenge_text', 'description', 'text', 'daily_question']);

            if (!questionText) {
                Logger.warn('Daily Challenge: Missing Question Text', row, 'DataTransformer');
            }

            return {
                id: this._getValue(row, ['challenge_id', 'id', 'ID'], `dc-${Math.random().toString(36).substr(2, 9)}`),
                subjectKey: this._getValue(row, ['subject_key', 'subject', 'Subject'], 'math').toLowerCase(),
                difficulty: this._getValue(row, 'difficulty', 'medium').toLowerCase(),
                question: questionText || `Question not available`,
                options: [
                    { label: 'A', text: this._getValue(row, ['option_a', 'a', 'Option A']) },
                    { label: 'B', text: this._getValue(row, ['option_b', 'b', 'Option B']) },
                    { label: 'C', text: this._getValue(row, ['option_c', 'c', 'Option C']) },
                    { label: 'D', text: this._getValue(row, ['option_d', 'd', 'Option D']) }
                ].filter(opt => opt.text),
                correctAnswer: this._getValue(row, ['correct_answer', 'correct', 'Correct'], 'A').toUpperCase(),
                hint: this._getValue(row, 'hint'),
                explanation: this._getValue(row, 'explanation'),
                xpReward: parseInt(this._getValue(row, ['xp_reward', 'xp', 'XP'], 20)),
                imageUrl: this._getValue(row, ['image_url', 'image'])
            };
        });
    }

    // Transform all data
    static transformAll(rawData) {
        Logger.info('Starting Data Transformation', null, 'DataTransformer');

        // Build subjects with topics
        let subjects = this.transformSubjects(rawData.SUBJECTS || []);
        subjects = this.transformTopics(rawData.TOPICS || [], subjects);

        const result = {
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

        Logger.gate('Data Transformation', true, 'DataTransformer');
        return result;
    }
}
