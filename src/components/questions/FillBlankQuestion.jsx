/**
 * FillBlankQuestion
 * User types answer in text input
 * 
 * @module FillBlankQuestion
 * @description Accept multiple valid answers (case-insensitive)
 * @feature Progressive letter hints: "Starts with N", "Ends with S"
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X, Lightbulb } from 'lucide-react';

const FillBlankQuestion = ({
    question,
    onAnswer,
    showHint = false,
    darkMode = false,
    disabled = false,
}) => {
    const [userInput, setUserInput] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);

    // Parse accepted answers (support "A|B|C" or ["A","B","C"])
    const acceptedAnswers = parseAcceptedAnswers(
        question.acceptedAnswers || question.accepted_answers || question.correctAnswer || question.correct_answer
    );

    const firstAnswer = acceptedAnswers[0] || '';

    // Generate letter hints
    const hints = [
        question.hint,
        firstAnswer ? `Starts with "${firstAnswer[0].toUpperCase()}"` : null,
        firstAnswer ? `Ends with "${firstAnswer.slice(-1).toUpperCase()}"` : null,
        firstAnswer ? `${firstAnswer.length} letters long` : null,
    ].filter(Boolean);

    const handleSubmit = () => {
        if (disabled || showResult || !userInput.trim()) return;

        const isCorrect = checkAnswer(userInput, acceptedAnswers);
        setShowResult(true);

        setTimeout(() => {
            onAnswer({
                userInput: userInput.trim(),
                correct: isCorrect,
                correctAnswer: firstAnswer,
                question,
            });
        }, 1500);
    };

    const handleShowHint = () => {
        if (hintLevel < hints.length) {
            setHintLevel(prev => prev + 1);
        }
    };

    return (
        <div className="space-y-4">
            {/* Question text with blank indicator */}
            <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {formatQuestionWithBlank(question.text || question.question_text)}
            </p>

            {/* Hints (progressive reveal) */}
            {showHint && hintLevel > 0 && (
                <div className="space-y-1">
                    {hints.slice(0, hintLevel).map((hint, idx) => (
                        <p key={idx} className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span>💡</span>
                            <span>{hint}</span>
                        </p>
                    ))}
                </div>
            )}

            {/* Input field */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={disabled || showResult}
                    placeholder="Type your answer..."
                    aria-label="Answer input"
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-lg transition-colors
            ${showResult
                            ? (checkAnswer(userInput, acceptedAnswers)
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/30')
                            : (darkMode
                                ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                                : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500')
                        }
            outline-none
          `}
                />

                {!showResult && (
                    <>
                        {showHint && hintLevel < hints.length && (
                            <button
                                onClick={handleShowHint}
                                className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300"
                                title="Get a hint"
                                aria-label="Show hint"
                            >
                                <Lightbulb className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={!userInput.trim()}
                            className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Check answer"
                        >
                            Check
                        </button>
                    </>
                )}
            </div>

            {/* Result feedback */}
            {showResult && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${checkAnswer(userInput, acceptedAnswers)
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                    {checkAnswer(userInput, acceptedAnswers)
                        ? <><Check className="w-5 h-5" /> Correct!</>
                        : <><X className="w-5 h-5" /> The answer is: <strong>{firstAnswer}</strong></>
                    }
                </div>
            )}
        </div>
    );
};

/**
 * Parse accepted answers from various formats
 */
function parseAcceptedAnswers(answers) {
    if (!answers) return [];
    if (Array.isArray(answers)) return answers;
    if (typeof answers === 'string') {
        return answers.split(/[|,]/).map(a => a.trim()).filter(Boolean);
    }
    return [String(answers)];
}

/**
 * Check if user answer matches any accepted answer (case-insensitive)
 */
function checkAnswer(userInput, acceptedAnswers) {
    const normalized = userInput.toLowerCase().trim();
    return acceptedAnswers.some(accepted =>
        accepted.toLowerCase().trim() === normalized
    );
}

/**
 * Format question text (replace ____ with styled blank)
 */
function formatQuestionWithBlank(text) {
    if (!text) return '';
    return text.replace(/_{2,}/g, '______');
}

FillBlankQuestion.propTypes = {
    question: PropTypes.shape({
        text: PropTypes.string,
        acceptedAnswers: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
        hint: PropTypes.string,
    }).isRequired,
    onAnswer: PropTypes.func.isRequired,
    showHint: PropTypes.bool,
    darkMode: PropTypes.bool,
    disabled: PropTypes.bool,
};

export default FillBlankQuestion;
