import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, Trophy, Zap, AlertCircle, FileText } from 'lucide-react';
import { csvService } from '../services/unifiedDataService'; // Explicit import
import QuizSection from './QuizSection'; // Re-use the existing QuizSection
import { cn } from '../utils';

const QuestionnaireSelector = ({ subject, subjectKey, topic, onClose, onComplete, userXp }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const topicFolder = topic?.folder || topic?.topic_folder || topic?.id;
    const finalSubjectKey = subjectKey || subject?.subject_key || subject?.id;

    // Load Available Quizzes
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const list = await csvService.listQuizzes(finalSubjectKey, topicFolder);
                setQuizzes(list);
            } catch (err) {
                console.error("Failed to list quizzes", err);
                setError("Could not load quiz list.");
            } finally {
                setLoading(false);
            }
        };

        if (finalSubjectKey && topicFolder) {
            fetchQuizzes();
        }
    }, [finalSubjectKey, topicFolder]);

    // Load Selected Quiz Content
    const handleSelectQuiz = async (quiz) => {
        setLoading(true);
        setSelectedQuizId(quiz.id);
        try {
            const rawQuestions = await csvService.loadQuiz(finalSubjectKey, topicFolder, quiz.file);
            // Normalize
            const normalized = rawQuestions.map((q, i) => ({
                id: q.question_id || `q-${i}`,
                question: q.question_text,
                options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                hint: q.hint,
                difficulty: q.difficulty || 'medium',
                xpReward: parseInt(q.xp_reward) || 10,
                type: 'mcq'
            }));
            setQuizQuestions(normalized);
        } catch (err) {
            console.error("Failed to load quiz content", err);
            setError("Could not load quiz questions.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // If a quiz is selected, show the Quiz Interface
    if (selectedQuizId && quizQuestions.length > 0) {
        return (
            <div className="w-full h-full overflow-y-auto bg-slate-900/95 backdrop-blur-sm rounded-xl">
                <div className="max-w-4xl mx-auto py-8 px-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 text-white">
                        <button
                            onClick={() => setSelectedQuizId(null)}
                            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            ← Back to Menu
                        </button>
                        <h2 className="text-2xl font-bold">{quizzes.find(q => q.id === selectedQuizId)?.name}</h2>
                        <div className="w-8"></div> {/* Spacer */}
                    </div>

                    <QuizSection
                        questions={quizQuestions}
                        darkMode={true}
                        subjectConfig={subject} // Pass config for colors
                        topicId={topic.id}
                        onComplete={(score, xp, results) => {
                            onComplete?.(score, xp, results);
                            // Maybe wait a bit then close?
                        }}
                        onUseHint={() => {}} // Handle hints if needed
                        userXp={userXp}
                        allowHints={true}
                        hintCost={5}
                    />
                </div>
            </div>
        );
    }

    // Default View: Quiz Selection Menu
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 w-full rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select a Quiz</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{topic.name}</p>
                        </div>
                    </div>
                    {/* Close button not strictly needed if inline, but keeping if passed */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    )}
                </div>

                <div className="p-6 grid gap-4">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No quizzes found for this topic.
                        </div>
                    ) : (
                        quizzes.map((quiz) => (
                            <button
                                key={quiz.id}
                                onClick={() => handleSelectQuiz(quiz)}
                                className="flex items-center p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group text-left"
                            >
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                        {quiz.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> {quiz.file}
                                    </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold">
                                    Start →
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple X icon component re-definition if not imported
const X = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);

export default QuestionnaireSelector;
