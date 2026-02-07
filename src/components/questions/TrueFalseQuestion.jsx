/**
 * TrueFalseQuestion
 * Binary choice question with TRUE/FALSE buttons
 * 
 * @module TrueFalseQuestion
 * @description Immediate visual feedback on selection
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X } from 'lucide-react';

const TrueFalseQuestion = ({
    question,
    onAnswer,
    showHint = false,
    darkMode = false,
    disabled = false,
}) => {
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);

    // Normalize correct answer to boolean
    const correctAnswer = normalizeBoolean(question.correctAnswer || question.correct_answer);

    const handleSelect = (value) => {
        if (disabled || showResult) return;

        setSelected(value);
        setShowResult(true);

        const isCorrect = value === correctAnswer;

        // DELAY: Allow user to see result before proceeding
        setTimeout(() => {
            onAnswer({
                selected: value,
                correct: isCorrect,
                question: question
            });
        }, 1000);
    };

    const buttonClass = (value) => {
        const base = `flex-1 py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2`;

        if (showResult) {
            if (value === correctAnswer) {
                return `${base} bg-green-100 border-green-500 text-green-700 dark:bg-green-900/50 dark:border-green-500 dark:text-green-300`;
            }
            if (value === selected && value !== correctAnswer) {
                return `${base} bg-red-100 border-red-500 text-red-700 dark:bg-red-900/50 dark:border-red-500 dark:text-red-300`;
            }
        }

        return `${base} ${darkMode
            ? 'bg-slate-700 border-slate-600 hover:border-blue-500 text-white'
            : 'bg-white border-slate-200 hover:border-blue-500 text-slate-800'}`;
    };

    return (
        <div className="space-y-4">
            <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {question.text || question.question_text}
            </p>

            {showHint && question.hint && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>💡</span>
                    <span>{question.hint}</span>
                </p>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => handleSelect(true)}
                    disabled={disabled || showResult}
                    className={buttonClass(true)}
                    aria-label="Answer True"
                >
                    <Check className="w-5 h-5" />
                    TRUE
                </button>
                <button
                    onClick={() => handleSelect(false)}
                    disabled={disabled || showResult}
                    className={buttonClass(false)}
                    aria-label="Answer False"
                >
                    <X className="w-5 h-5" />
                    FALSE
                </button>
            </div>

            {showResult && question.explanation && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <p className="text-sm">{question.explanation}</p>
                </div>
            )}
        </div>
    );
};

/**
 * Normalize various boolean representations
 * FALLBACK: Default to true if unparseable
 */
function normalizeBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
    }
    console.warn('[TrueFalseQuestion] Invalid boolean value, defaulting to true:', value);
    return true; // FALLBACK
}

TrueFalseQuestion.propTypes = {
    question: PropTypes.shape({
        text: PropTypes.string,
        correctAnswer: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
        hint: PropTypes.string,
        explanation: PropTypes.string,
    }).isRequired,
    onAnswer: PropTypes.func.isRequired,
    showHint: PropTypes.bool,
    darkMode: PropTypes.bool,
    disabled: PropTypes.bool,
};

export default TrueFalseQuestion;
