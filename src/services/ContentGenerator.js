import { log } from '../utils';

/**
 * AI Content Generator Service
 * Generates educational content for subjects and topics
 */
export class ContentGenerator {
    static SUBJECT_TEMPLATES = {
        physics: {
            icon: 'Zap',
            color: '#3B82F6',
            lightBg: 'bg-blue-50',
            gradientFrom: 'blue-500',
            gradientTo: 'blue-600',
            darkGlow: 'shadow-blue-500/20'
        },
        chemistry: {
            icon: 'FlaskConical',
            color: '#8B5CF6',
            lightBg: 'bg-purple-50',
            gradientFrom: 'purple-500',
            gradientTo: 'purple-600',
            darkGlow: 'shadow-purple-500/20'
        },
        biology: {
            icon: 'Leaf',
            color: '#10B981',
            lightBg: 'bg-emerald-50',
            gradientFrom: 'emerald-500',
            gradientTo: 'emerald-600',
            darkGlow: 'shadow-emerald-500/20'
        },
        math: {
            icon: 'Calculator',
            color: '#F59E0B',
            lightBg: 'bg-amber-50',
            gradientFrom: 'amber-500',
            gradientTo: 'amber-600',
            darkGlow: 'shadow-amber-500/20'
        },
        default: {
            icon: 'BookOpen',
            color: '#6366F1',
            lightBg: 'bg-indigo-50',
            gradientFrom: 'indigo-500',
            gradientTo: 'indigo-600',
            darkGlow: 'shadow-indigo-500/20'
        }
    };

    static SECTION_TYPES = [
        { type: 'objectives', title: 'Learning Objectives', icon: 'Target' },
        { type: 'intro', title: 'Introduction', icon: 'BookOpen' },
        { type: 'content', title: 'Key Concepts', icon: 'FileText' },
        { type: 'applications', title: 'Real-World Applications', icon: 'Globe' },
        { type: 'quiz', title: 'Quick Quiz', icon: 'HelpCircle' }
    ];

    /**
     * Generate complete content for a subject with topics
     */
    static generateContent(subjectName, topicsString, subtopicsString = '') {
        log('Generating content for:', subjectName);

        const topics = topicsString.split(',').map(t => t.trim()).filter(Boolean);
        const subtopics = subtopicsString.split(',').map(t => t.trim()).filter(Boolean);

        if (topics.length === 0) {
            throw new Error('Please provide at least one topic');
        }

        const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '_');
        const template = this.SUBJECT_TEMPLATES[subjectKey] || this.SUBJECT_TEMPLATES.default;

        const data = {
            subjects: [],
            topics: [],
            sections: [],
            objectives: [],
            keyTerms: [],
            content: [],
            formulas: [],
            quizzes: [],
            achievements: this.generateDefaultAchievements()
        };

        // Generate subject
        data.subjects.push({
            subject_id: `${subjectKey}-001`,
            subject_key: subjectKey,
            name: subjectName,
            icon: template.icon,
            color_hex: template.color,
            light_bg: template.lightBg,
            gradient_from: template.gradientFrom,
            gradient_to: template.gradientTo,
            dark_glow: template.darkGlow
        });

        // Generate topics and their content
        topics.forEach((topicName, topicIndex) => {
            const topicId = `${subjectKey}-t${String(topicIndex + 1).padStart(3, '0')}`;

            data.topics.push({
                topic_id: topicId,
                subject_key: subjectKey,
                topic_name: topicName,
                duration_minutes: 20 + (topicIndex * 5),
                order_index: topicIndex + 1
            });

            // Generate sections for each topic
            this.SECTION_TYPES.forEach((sectionTemplate, sectionIndex) => {
                const sectionId = `${topicId}-s${String(sectionIndex + 1).padStart(3, '0')}`;

                data.sections.push({
                    section_id: sectionId,
                    topic_id: topicId,
                    section_title: sectionTemplate.title,
                    section_icon: sectionTemplate.icon,
                    section_type: sectionTemplate.type,
                    order_index: sectionIndex + 1
                });

                // Generate content for each section
                this.generateSectionContent(data, sectionId, topicId, topicName, sectionTemplate, subjectName, subtopics);
            });

            // Generate learning objectives
            this.generateObjectives(data, topicId, topicName, subjectName);

            // Generate key terms
            this.generateKeyTerms(data, topicId, topicName, subjectName);

            // Generate formulas if applicable
            if (['physics', 'chemistry', 'math'].includes(subjectKey)) {
                this.generateFormulas(data, topicId, topicName, subjectKey);
            }

            // Generate quiz questions
            this.generateQuizQuestions(data, topicId, topicName, subjectName);
        });

        log('Content generation complete:', {
            subjects: data.subjects.length,
            topics: data.topics.length,
            sections: data.sections.length,
            content: data.content.length
        });

        return data;
    }

    static generateSectionContent(data, sectionId, topicId, topicName, sectionTemplate, subjectName, subtopics) {
        const contentItems = [];

        switch (sectionTemplate.type) {
            case 'intro':
                contentItems.push({
                    content_id: `${sectionId}-c001`,
                    section_id: sectionId,
                    content_type: 'introduction',
                    content_title: `Welcome to ${topicName}`,
                    content_text: `In this section, we will explore ${topicName} in ${subjectName}. This is a fundamental concept that builds the foundation for understanding more advanced topics.`,
                    order_index: 1
                });
                contentItems.push({
                    content_id: `${sectionId}-c002`,
                    section_id: sectionId,
                    content_type: 'concept_helper',
                    content_title: 'Key Insight',
                    content_text: `Understanding ${topicName} is essential because it connects to many real-world applications and other concepts in ${subjectName}.`,
                    order_index: 2
                });
                break;

            case 'content':
                contentItems.push({
                    content_id: `${sectionId}-c001`,
                    section_id: sectionId,
                    content_type: 'text',
                    content_title: 'Core Concepts',
                    content_text: `The key principles of ${topicName} form the basis for understanding this topic. Let's break down the main ideas.`,
                    order_index: 1
                });
                if (subtopics.length > 0) {
                    subtopics.slice(0, 3).forEach((subtopic, idx) => {
                        contentItems.push({
                            content_id: `${sectionId}-c${String(idx + 2).padStart(3, '0')}`,
                            section_id: sectionId,
                            content_type: 'text',
                            content_title: subtopic,
                            content_text: `${subtopic} is an important aspect of ${topicName}. This concept helps us understand how ${topicName.toLowerCase()} works in practice.`,
                            order_index: idx + 2
                        });
                    });
                }
                contentItems.push({
                    content_id: `${sectionId}-c${String(contentItems.length + 1).padStart(3, '0')}`,
                    section_id: sectionId,
                    content_type: 'warning',
                    content_title: 'Common Mistake',
                    content_text: `Be careful not to confuse the concepts in ${topicName}. Take your time to understand each part before moving forward.`,
                    order_index: contentItems.length + 1
                });
                break;

            case 'applications':
                contentItems.push({
                    content_id: `${sectionId}-c001`,
                    section_id: sectionId,
                    content_type: 'real_world',
                    content_title: 'Everyday Applications',
                    content_text: `${topicName} is used in many everyday situations. From technology to nature, you can observe these principles all around you.`,
                    order_index: 1
                });
                contentItems.push({
                    content_id: `${sectionId}-c002`,
                    section_id: sectionId,
                    content_type: 'example',
                    content_title: 'Practical Example',
                    content_text: `Consider how ${topicName.toLowerCase()} applies in real life. This helps connect theory to practice.`,
                    order_index: 2
                });
                break;

            default:
                // For objectives and quiz sections, content is handled separately
                break;
        }

        data.content.push(...contentItems);
    }

    static generateObjectives(data, topicId, topicName, subjectName) {
        const objectives = [
            `Define and explain the key concepts of ${topicName}`,
            `Identify real-world examples of ${topicName}`,
            `Apply ${topicName} principles to solve problems`,
            `Analyze how ${topicName} relates to other ${subjectName} concepts`
        ];

        objectives.forEach((text, idx) => {
            data.objectives.push({
                objective_id: `${topicId}-obj${String(idx + 1).padStart(3, '0')}`,
                topic_id: topicId,
                objective_text: text,
                order_index: idx + 1
            });
        });
    }

    static generateKeyTerms(data, topicId, topicName, subjectName) {
        const terms = [
            { term: topicName, definition: `The study of ${topicName.toLowerCase()} in ${subjectName}, covering fundamental principles and applications.` },
            { term: `${topicName} Principle`, definition: `A fundamental rule or law that governs how ${topicName.toLowerCase()} works.` },
            { term: `${topicName} Application`, definition: `Practical use of ${topicName.toLowerCase()} concepts in real-world scenarios.` }
        ];

        terms.forEach((item, idx) => {
            data.keyTerms.push({
                term_id: `${topicId}-term${String(idx + 1).padStart(3, '0')}`,
                topic_id: topicId,
                term: item.term,
                definition: item.definition
            });
        });
    }

    static generateFormulas(data, topicId, topicName, subjectKey) {
        const formulaTemplates = {
            physics: { formula: 'E = mc^2', label: 'Energy Equation', vars: [{ sym: 'E', name: 'Energy', unit: 'J' }, { sym: 'm', name: 'Mass', unit: 'kg' }, { sym: 'c', name: 'Speed of Light', unit: 'm/s' }] },
            chemistry: { formula: 'PV = nRT', label: 'Ideal Gas Law', vars: [{ sym: 'P', name: 'Pressure', unit: 'Pa' }, { sym: 'V', name: 'Volume', unit: 'L' }, { sym: 'n', name: 'Moles', unit: 'mol' }] },
            math: { formula: 'a^2 + b^2 = c^2', label: 'Pythagorean Theorem', vars: [{ sym: 'a', name: 'Side A', unit: '' }, { sym: 'b', name: 'Side B', unit: '' }, { sym: 'c', name: 'Hypotenuse', unit: '' }] }
        };

        const template = formulaTemplates[subjectKey] || formulaTemplates.math;

        const formulaEntry = {
            formula_id: `${topicId}-f001`,
            topic_id: topicId,
            formula_text: template.formula,
            formula_display: template.formula,
            formula_label: `${topicName} - ${template.label}`
        };

        template.vars.forEach((v, idx) => {
            formulaEntry[`variable_${idx + 1}_symbol`] = v.sym;
            formulaEntry[`variable_${idx + 1}_name`] = v.name;
            formulaEntry[`variable_${idx + 1}_unit`] = v.unit;
        });

        data.formulas.push(formulaEntry);
    }

    static generateQuizQuestions(data, topicId, topicName, subjectName) {
        const questions = [
            {
                question: `What is the main focus of ${topicName}?`,
                options: [
                    `Understanding the principles of ${topicName.toLowerCase()}`,
                    'Memorizing random facts',
                    'Ignoring real-world applications',
                    'None of the above'
                ],
                correct: 'A',
                explanation: `${topicName} focuses on understanding fundamental principles that can be applied to solve real problems.`
            },
            {
                question: `Which of the following best describes ${topicName}?`,
                options: [
                    'An outdated concept',
                    `A fundamental concept in ${subjectName}`,
                    'Something not useful',
                    'A random topic'
                ],
                correct: 'B',
                explanation: `${topicName} is indeed a fundamental and important concept in ${subjectName}.`
            }
        ];

        questions.forEach((q, idx) => {
            data.quizzes.push({
                question_id: `${topicId}-q${String(idx + 1).padStart(3, '0')}`,
                topic_id: topicId,
                question_text: q.question,
                option_a: q.options[0],
                option_b: q.options[1],
                option_c: q.options[2],
                option_d: q.options[3],
                correct_answer: q.correct,
                explanation: q.explanation,
                xp_reward: 10
            });
        });
    }

    static generateDefaultAchievements() {
        return [
            { achievement_id: 'first-topic', icon: 'Star', name: 'First Steps', description: 'Complete your first topic', unlock_condition: 'complete_1_topic' },
            { achievement_id: 'quiz-master', icon: 'Trophy', name: 'Quiz Master', description: 'Answer 10 quiz questions correctly', unlock_condition: 'correct_10_quizzes' },
            { achievement_id: 'streak-3', icon: 'Flame', name: 'On Fire', description: 'Maintain a 3-day study streak', unlock_condition: 'streak_3_days' },
            { achievement_id: 'all-subjects', icon: 'Award', name: 'Well Rounded', description: 'Study all subjects', unlock_condition: 'study_all_subjects' }
        ];
    }
}
