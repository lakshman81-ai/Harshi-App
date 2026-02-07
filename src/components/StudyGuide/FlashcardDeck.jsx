/**
 * FlashcardDeck
 * Interactive flip cards for vocabulary review
 * 
 * @module FlashcardDeck
 * @description CSS transform for flip (smoother than JS)
 * @feature LocalStorage persistence for progress tracking
 */
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const FlashcardDeck = ({
    terms = [],
    topicId,
    darkMode = false,
    onComplete,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [results, setResults] = useState({}); // { termId: 'known' | 'learning' }

    // Load progress from localStorage
    useEffect(() => {
        if (!topicId) return;
        try {
            const saved = localStorage.getItem(`flashcard_progress_${topicId}`);
            if (saved) {
                setResults(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('[FlashcardDeck] Failed to load progress:', error);
        }
    }, [topicId]);

    // Save progress to localStorage
    useEffect(() => {
        if (!topicId || Object.keys(results).length === 0) return;
        try {
            localStorage.setItem(`flashcard_progress_${topicId}`, JSON.stringify(results));
        } catch (error) {
            console.warn('[FlashcardDeck] Failed to save progress:', error);
        }
    }, [results, topicId]);

    // HANDLERS: Define hooks before early return
    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    const handleResult = useCallback((result) => {
        if (!terms || terms.length === 0) return;
        const currentTerm = terms[currentIndex];
        const termId = currentTerm.id || currentTerm.term || currentIndex;
        setResults(prev => ({
            ...prev,
            [termId]: result
        }));

        // Move to next card
        if (currentIndex < terms.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else if (onComplete) {
            onComplete(results);
        }
    }, [currentIndex, terms, results, onComplete]);

    // FALLBACK: No terms available
    if (!terms || terms.length === 0) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <p>No flashcards available for this section.</p>
            </div>
        );
    }

    const currentTerm = terms[currentIndex];
    const progress = Object.keys(results).length;

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < terms.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className="flex justify-between items-center text-sm">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                    Card {currentIndex + 1} of {terms.length}
                </span>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                    {progress} reviewed
                </span>
            </div>

            {/* Card Container */}
            <div
                className="relative h-64 cursor-pointer"
                onClick={handleFlip}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
                aria-label={`Flashcard: ${currentTerm.term || currentTerm.name}. Click to flip.`}
            >
                {/* Card (flip animation via CSS) */}
                <div
                    className="absolute inset-0 transition-transform duration-500"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                    }}
                >
                    {/* Front (Term) */}
                    <div
                        className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center border-2 ${darkMode
                            ? 'bg-slate-800 border-slate-600'
                            : 'bg-white border-slate-200'
                            }`}
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Term</p>
                        <p className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'text-slate-800'
                            }`}>
                            {currentTerm.term || currentTerm.name}
                        </p>
                        <p className="text-sm text-slate-400 mt-4">Tap to reveal definition</p>
                    </div>

                    {/* Back (Definition) */}
                    <div
                        className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center border-2 ${darkMode
                            ? 'bg-blue-900/50 border-blue-600'
                            : 'bg-blue-50 border-blue-200'
                            }`}
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                        }}
                    >
                        <p className="text-xs uppercase tracking-wide text-blue-400 mb-2">Definition</p>
                        <p className={`text-lg text-center ${darkMode ? 'text-blue-100' : 'text-blue-900'
                            }`}>
                            {currentTerm.definition || currentTerm.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => handleResult('learning')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 transition-colors"
                    aria-label="Mark as need practice"
                >
                    <RotateCcw className="w-4 h-4" />
                    Need Practice
                </button>
                <button
                    onClick={() => handleResult('known')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 transition-colors"
                    aria-label="Mark as got it"
                >
                    <Check className="w-4 h-4" />
                    Got It!
                </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                    aria-label="Previous card"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === terms.length - 1}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                    aria-label="Next card"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

FlashcardDeck.propTypes = {
    terms: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        term: PropTypes.string,
        definition: PropTypes.string,
    })),
    topicId: PropTypes.string,
    darkMode: PropTypes.bool,
    onComplete: PropTypes.func,
};

export default FlashcardDeck;
