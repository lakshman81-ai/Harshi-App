/**
 * PostSectionReview
 * Container shown after user completes a subtopic section
 * Shows: Misconceptions → Flashcards → Mini-Quiz (if data available)
 * 
 * @module PostSectionReview
 * @description Progressive review flow after section completion
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronRight } from 'lucide-react';
import MisconceptionBlock from './ContentBlocks/MisconceptionBlock';
import FlashcardDeck from './FlashcardDeck';
import QuestionRenderer from '../questions/QuestionRenderer';
import { loadMisconceptions, loadSubtopicQuiz, filterBySubtopic } from '../../services/studyGuideDataService';
import { Logger } from '../../services/Logger';

const PostSectionReview = ({
    subject,
    topic,
    subtopicId,
    keyTerms = [],
    darkMode = false,
    onClose,
    onComplete,
}) => {
    const [stage, setStage] = useState('loading'); // loading, misconceptions, flashcards, quiz, complete
    const [misconceptions, setMisconceptions] = useState([]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizResults, setQuizResults] = useState([]);



    // ... imports ...

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                Logger.info('[PostSectionReview] Loading data', { subject, topic, subtopicId });

                const [miscData, quizData] = await Promise.all([
                    loadMisconceptions(subject, topic),
                    loadSubtopicQuiz(subject, topic),
                ]);

                // Filter by subtopic
                const filteredMisc = filterBySubtopic(miscData, subtopicId) || [];
                const filteredQuiz = filterBySubtopic(quizData, subtopicId) || [];
                const filteredTerms = filterBySubtopic(keyTerms, subtopicId) || [];

                setMisconceptions(filteredMisc);
                setQuizQuestions(filteredQuiz);

                // Determine first stage
                if (filteredMisc.length > 0) {
                    setStage('misconceptions');
                } else if (filteredTerms.length > 0) {
                    setStage('flashcards');
                } else if (filteredQuiz.length > 0) {
                    setStage('quiz');
                } else {
                    Logger.info('[PostSectionReview] No content for review, skipping');
                    setStage('complete');
                }
            } catch (error) {
                Logger.error('[PostSectionReview] Failed to load data', error);
                setStage('complete'); // Skip review on error
            }
        };

        loadData();
    }, [subject, topic, subtopicId, keyTerms]);

    const handleNext = () => {
        if (stage === 'misconceptions') {
            setStage(keyTerms.length > 0 ? 'flashcards' : (quizQuestions.length > 0 ? 'quiz' : 'complete'));
        } else if (stage === 'flashcards') {
            setStage(quizQuestions.length > 0 ? 'quiz' : 'complete');
        } else if (stage === 'quiz') {
            setStage('complete');
        } else {
            onComplete?.();
            onClose();
        }
    };

    const handleQuizAnswer = (answer) => {
        setQuizResults(prev => [...prev, answer]);

        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz complete
            setTimeout(handleNext, 1000);
        }
    };

    if (stage === 'loading') {
        return (
            <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-slate-900/80' : 'bg-slate-900/50'
                }`}>
                <div className={`rounded-2xl p-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <p className={darkMode ? 'text-white' : 'text-slate-800'}>Loading review...</p>
                </div>
            </div>
        );
    }

    if (stage === 'complete') {
        return null; // Close automatically
    }

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-slate-900/90' : 'bg-slate-900/50'
            }`}>
            <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {stage === 'misconceptions' && '⚠️ Common Mistakes'}
                        {stage === 'flashcards' && '🎴 Review Key Terms'}
                        {stage === 'quiz' && '📝 Quick Check'}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                            }`}
                        aria-label="Close review"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {stage === 'misconceptions' && Array.isArray(misconceptions) && (
                        <>
                            {misconceptions.map((misc, idx) => (
                                <MisconceptionBlock
                                    key={misc.id || idx}
                                    title={misc.title}
                                    explanation={misc.explanation}
                                    wrongExample={misc.wrongExample}
                                    correctExample={misc.correctExample}
                                    darkMode={darkMode}
                                />
                            ))}
                        </>
                    )}

                    {stage === 'flashcards' && (
                        <FlashcardDeck
                            terms={keyTerms}
                            topicId={`${topic}-${subtopicId}`}
                            darkMode={darkMode}
                            onComplete={handleNext}
                        />
                    )}

                    {stage === 'quiz' && quizQuestions[currentQuestionIndex] && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                                <span>{quizResults.filter(r => r.correct).length} correct</span>
                            </div>
                            <QuestionRenderer
                                question={quizQuestions[currentQuestionIndex]}
                                onAnswer={handleQuizAnswer}
                                showHint={true}
                                darkMode={darkMode}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 flex justify-end p-4 border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                    {stage !== 'quiz' && (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
};

PostSectionReview.propTypes = {
    subject: PropTypes.string.isRequired,
    topic: PropTypes.string.isRequired,
    subtopicId: PropTypes.string.isRequired,
    keyTerms: PropTypes.array,
    darkMode: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onComplete: PropTypes.func,
};

export default PostSectionReview;
