/**
 * QuestionRenderer
 * Routes questions to the appropriate type-specific component
 * 
 * @module QuestionRenderer
 * @description Provides fallback for unknown types (renders as MCQ)
 * @reasoning New question types might be added; don't crash on unknown
 */
import React from 'react';
import PropTypes from 'prop-types';

// Import question type components
import TrueFalseQuestion from './TrueFalseQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import MatchingQuestion from './MatchingQuestion';

/**
 * @typedef {Object} Question
 * @property {string} type - Question type
 * @property {string} text - Question text
 * @property {string[]} [options] - Options for MCQ
 * @property {string} [correctAnswer] - Correct answer
 * @property {string} [hint] - Hint text
 */

const QuestionRenderer = ({
    question,
    onAnswer,
    showHint = false,
    hintLevel = 0,        // NEW: For progressive hints
    darkMode = false,
    disabled = false,
    subjectConfig = null, // NEW: For theming MCQ buttons
}) => {
    // DECISION GATE: What type of question?
    const questionType = (question.type || question.question_type || 'mcq').toLowerCase();

    // ERROR LOGGING: Log unknown types
    const logUnknownType = () => {
        console.warn(`[QuestionRenderer] Unknown question type: "${questionType}"`, question);
    };

    switch (questionType) {
        case 'true_false':
        case 'truefalse':
        case 'tf':
            return (
                <TrueFalseQuestion
                    question={question}
                    onAnswer={onAnswer}
                    showHint={showHint}
                    darkMode={darkMode}
                    disabled={disabled}
                />
            );

        case 'fill_blank':
        case 'fillblank':
        case 'fill':
            return (
                <FillBlankQuestion
                    question={question}
                    onAnswer={onAnswer}
                    showHint={showHint}
                    hintLevel={hintLevel}
                    darkMode={darkMode}
                    disabled={disabled}
                />
            );

        case 'matching':
        case 'match':
            return (
                <MatchingQuestion
                    question={question}
                    onAnswer={onAnswer}
                    darkMode={darkMode}
                    disabled={disabled}
                />
            );

        case 'mcq':
        case 'multiple_choice':
        default:
            if (questionType !== 'mcq' && questionType !== 'multiple_choice') {
                logUnknownType();
            }
            // FALLBACK: Render as MCQ (most common type)
            return (
                <MCQInline
                    question={question}
                    onAnswer={onAnswer}
                    showHint={showHint}
                    darkMode={darkMode}
                    disabled={disabled}
                    subjectConfig={subjectConfig}
                />
            );
    }
};

/**
 * INLINE MCQ COMPONENT
 * ARCHITECTURAL DECISION: Inline to prevent circular dependencies
 * BEST PRACTICE: Use subjectConfig gradient for theming
 * @param {Object} props
 */
const MCQInline = ({ question, onAnswer, showHint, darkMode, disabled, subjectConfig }) => {
    const options = question.options || [];

    // DEFENSIVE RENDERING: No options available
    if (options.length === 0) {
        console.warn('[MCQInline] No options available for question:', question);
        return (
            <div className={`text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <p>⚠️ No answer options available</p>
            </div>
        );
    }

    // Extract gradient from subjectConfig (e.g., "from-blue-500 to-blue-600")
    const gradient = subjectConfig?.gradient || 'from-blue-500 to-blue-600';

    return (
        <div className={`space-y-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            <p className="font-medium text-lg">{question.text || question.question}</p>
            {showHint && question.hint && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>💡</span>
                    <span>{question.hint}</span>
                </p>
            )}
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
                {options.map((option, idx) => {
                    const label = String.fromCharCode(65 + idx); // A, B, C, D
                    return (
                        <button
                            key={idx}
                            onClick={() => !disabled && onAnswer(label)}
                            disabled={disabled}
                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all group
                                ${darkMode
                                    ? 'bg-slate-700 border-slate-600 hover:border-blue-500 text-white'
                                    : 'bg-white border-slate-200 hover:border-blue-500 text-slate-800'}
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                            `}
                            aria-label={`Option ${label}: ${option}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-gradient-to-r ${gradient} text-white`}>
                                    {label}
                                </span>
                                <span className="flex-1">{option}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

QuestionRenderer.propTypes = {
    question: PropTypes.shape({
        type: PropTypes.string,
        text: PropTypes.string,
        question: PropTypes.string,
        options: PropTypes.array,
        hint: PropTypes.string,
    }).isRequired,
    onAnswer: PropTypes.func.isRequired,
    showHint: PropTypes.bool,
    hintLevel: PropTypes.number,
    darkMode: PropTypes.bool,
    disabled: PropTypes.bool,
    subjectConfig: PropTypes.shape({
        gradient: PropTypes.string,
    }),
};

MCQInline.propTypes = {
    question: PropTypes.object.isRequired,
    onAnswer: PropTypes.func.isRequired,
    showHint: PropTypes.bool,
    darkMode: PropTypes.bool,
    disabled: PropTypes.bool,
    subjectConfig: PropTypes.shape({
        gradient: PropTypes.string,
    }),
};

export default QuestionRenderer;
