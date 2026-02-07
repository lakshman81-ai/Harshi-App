/**
 * MatchingQuestion
 * Connect pairs by tapping left item then right item
 * 
 * @module MatchingQuestion
 * @description Tap-to-connect UI (simpler than drag-drop, mobile-friendly)
 */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Check, RotateCcw } from 'lucide-react';

const MatchingQuestion = ({
    question,
    onAnswer,
    darkMode = false,
    disabled = false,
}) => {
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matches, setMatches] = useState({}); // { leftItem: rightItem }
    const [showResult, setShowResult] = useState(false);

    // Parse pairs from question data
    const pairs = useMemo(() => {
        const raw = question.pairs || [];
        if (Array.isArray(raw)) return raw;
        // Parse string format: "A:B|C:D"
        if (typeof raw === 'string') {
            return raw.split('|').map(pair => {
                const [left, right] = pair.split(':').map(s => s.trim());
                return { left, right };
            });
        }
        return [];
    }, [question.pairs]);

    // Shuffle right items for display
    const shuffledRight = useMemo(() => {
        return [...pairs].sort(() => Math.random() - 0.5).map(p => p.right);
    }, [pairs]);

    // FALLBACK: No pairs
    if (pairs.length === 0) {
        console.warn('[MatchingQuestion] No pairs provided:', question);
        return (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                No matching pairs available.
            </div>
        );
    }

    const handleLeftClick = (item) => {
        if (disabled || showResult) return;
        setSelectedLeft(item);
    };

    const handleRightClick = (item) => {
        if (disabled || showResult || !selectedLeft) return;

        // Create match
        setMatches(prev => ({
            ...prev,
            [selectedLeft]: item
        }));
        setSelectedLeft(null);
    };

    const handleSubmit = () => {
        setShowResult(true);

        // Check all matches
        const correctCount = pairs.filter(
            pair => matches[pair.left] === pair.right
        ).length;

        setTimeout(() => {
            onAnswer({
                matches,
                correctCount,
                totalPairs: pairs.length,
                correct: correctCount === pairs.length,
            });
        }, 1500);
    };

    const handleReset = () => {
        setMatches({});
        setSelectedLeft(null);
    };

    const isMatched = (item, side) => {
        if (side === 'left') return item in matches;
        return Object.values(matches).includes(item);
    };

    const getMatchColor = (leftItem) => {
        if (!showResult) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
        const correctRight = pairs.find(p => p.left === leftItem)?.right;
        return matches[leftItem] === correctRight
            ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
            : 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
    };

    return (
        <div className="space-y-4">
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Match the items on the left with their pairs on the right.
                <br />
                <span className="text-sm text-slate-400">Tap left item, then tap matching right item.</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-2">
                    {pairs.map((pair, idx) => (
                        <button
                            key={`left-${idx}`}
                            onClick={() => handleLeftClick(pair.left)}
                            disabled={disabled || showResult || isMatched(pair.left, 'left')}
                            className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all
                ${selectedLeft === pair.left
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-500'
                                    : isMatched(pair.left, 'left')
                                        ? getMatchColor(pair.left)
                                        : darkMode
                                            ? 'bg-slate-700 border-slate-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-800'
                                }
                ${disabled || showResult ? 'cursor-default' : 'hover:border-blue-400 cursor-pointer'}
              `}
                            aria-label={`Left item: ${pair.left}`}
                        >
                            {pair.left}
                        </button>
                    ))}
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                    {shuffledRight.map((item, idx) => (
                        <button
                            key={`right-${idx}`}
                            onClick={() => handleRightClick(item)}
                            disabled={disabled || showResult || !selectedLeft || isMatched(item, 'right')}
                            className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all
                ${isMatched(item, 'right')
                                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                    : darkMode
                                        ? 'bg-slate-700 border-slate-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-800'
                                }
                ${disabled || showResult || !selectedLeft ? 'cursor-default' : 'hover:border-blue-400 cursor-pointer'}
              `}
                            aria-label={`Right item: ${item}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                {!showResult && (
                    <>
                        <button
                            onClick={handleReset}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode
                                    ? 'text-slate-300 hover:bg-slate-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            aria-label="Reset matches"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={Object.keys(matches).length < pairs.length}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Submit matches"
                        >
                            <Check className="w-4 h-4" />
                            Submit
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

MatchingQuestion.propTypes = {
    question: PropTypes.shape({
        pairs: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    }).isRequired,
    onAnswer: PropTypes.func.isRequired,
    darkMode: PropTypes.bool,
    disabled: PropTypes.bool,
};

export default MatchingQuestion;
