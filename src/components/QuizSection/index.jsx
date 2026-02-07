import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { HelpCircle, Clock, Lightbulb, ChevronLeft, ChevronRight, Check, X, CheckCircle2, RotateCcw, Filter, Sparkles, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/SoundManager';
import { explainMisconception } from '../../services/geminiService';
import { useStudy } from '../../contexts/StudyContext';
import QuestionRenderer from '../questions/QuestionRenderer';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

// Difficulty badge colors
const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    darkBg: 'bg-emerald-900/30',
    darkText: 'text-emerald-400',
    border: 'border-emerald-300',
    xpMultiplier: 1
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    darkBg: 'bg-amber-900/30',
    darkText: 'text-amber-400',
    border: 'border-amber-300',
    xpMultiplier: 1.5
  },
  hard: {
    label: 'Hard',
    bg: 'bg-red-100',
    text: 'text-red-700',
    darkBg: 'bg-red-900/30',
    darkText: 'text-red-400',
    border: 'border-red-300',
    xpMultiplier: 2
  }
};

/**
 * DifficultyBadge Component
 */
const DifficultyBadge = memo(({ difficulty, darkMode, small = false }) => {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

  return (
    <span className={cn(
      "rounded-full font-medium capitalize",
      small ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      darkMode ? config.darkBg : config.bg,
      darkMode ? config.darkText : config.text
    )}>
      {config.label}
    </span>
  );
});

/**
 * Format time in seconds to MM:SS display
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * QuizSection Component
 * Full-featured quiz with multiple phases
 *
 * @param {Object} props
 * @param {Array} props.questions - Array of quiz question objects
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Object} props.subjectConfig - Subject config { gradient, color }
 * @param {Function} props.onComplete - Callback when quiz is completed (score, xp, results)
 * @param {string} props.topicId - Topic ID for tracking
 * @param {boolean} props.showTimer - Enable timer (default: false)
 * @param {number} props.timeLimit - Time limit in seconds (default: null)
 * @param {boolean} props.allowHints - Enable hints (default: true)
 * @param {number} props.hintCost - XP cost per hint (default: 5)
 * @param {number} props.userXp - User's current XP (for hint cost check)
 * @param {Function} props.onUseHint - Callback when hint is used (xpCost)
 * @param {boolean} props.showDifficultyFilter - Show difficulty filter (default: true)
 */
const QuizSection = memo(({
  questions = [],
  darkMode,
  subjectConfig,
  onComplete,
  topicId,
  showTimer = false,
  timeLimit = null,
  allowHints = true,
  hintCost = 5,
  userXp = 0,
  onUseHint,
  showDifficultyFilter = true,
  quickMode = false // NEW: Bite-sized study mode
}) => {
  // Quiz state
  const [phase, setPhase] = useState('ready'); // 'ready' | 'active' | 'review' | 'complete'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hintsUsed, setHintsUsed] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [results, setResults] = useState(null);
  const [score, setScore] = useState(null);
  const [xpEarned, setXpEarned] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [durations, setDurations] = useState({}); // { questionId: seconds }
  const [aiExplanation, setAiExplanation] = useState({ loading: false, text: null }); // AI Explanation State
  const startTimeRef = useRef(Date.now());
  const { settings } = useStudy();

  // Filter questions by difficulty and mode
  const filteredQuestions = useMemo(() => {
    let q = questions;
    if (difficultyFilter !== 'all') {
      q = q.filter(q => (q.difficulty || 'medium') === difficultyFilter);
    }

    // Quick Mode: Limit to 5 random questions
    if (quickMode) {
      // Simple shuffle and slice
      q = [...q].sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    return q;
  }, [questions, difficultyFilter, quickMode]);

  // Get difficulty distribution
  const difficultyStats = useMemo(() => {
    const stats = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      const diff = q.difficulty || 'medium';
      if (stats[diff] !== undefined) stats[diff]++;
    });
    return stats;
  }, [questions]);

  const currentQuestion = filteredQuestions[currentIndex];
  const hasAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentIndex === filteredQuestions.length - 1;

  // Ref to hold latest handleSubmit to avoid stale closure in timer effect
  const handleSubmitRef = useRef(null);

  // Reset timer on question change
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex, phase]);

  // Timer effect - uses ref to avoid stale closure issue
  useEffect(() => {
    if (phase !== 'active' || !showTimer || timeRemaining === null) {
      return;
    }

    if (timeRemaining <= 0) {
      handleSubmitRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeRemaining, showTimer]);

  // Start quiz
  const handleStart = () => {
    setPhase('active');
    setTimeRemaining(timeLimit);
  };

  // UNIFIED ANSWER HANDLER: Handles all question types
  // BEST PRACTICE: Normalize different answer formats into consistent state
  const handleQuestionAnswer = useCallback((answerData) => {
    if (phase !== 'active' || !currentQuestion) return;

    const duration = (Date.now() - startTimeRef.current) / 1000;
    setDurations(prev => ({ ...prev, [currentQuestion.id]: duration }));

    // DECISION GATE: What type of question?
    const questionType = (currentQuestion.type || 'mcq').toLowerCase();
    console.log(`[QuizSection] Answer received for ${questionType}:`, answerData);

    // Normalize answer based on type
    let normalizedAnswer;

    if (questionType === 'mcq' || questionType === 'multiple_choice') {
      // MCQ: answerData is just the label (A, B, C, D)
      normalizedAnswer = answerData;
    } else if (questionType.includes('true') || questionType.includes('false') || questionType === 'tf') {
      // True/False: answerData is an object { selected: 'True'/'False', correct: boolean }
      normalizedAnswer = answerData.selected || answerData;
    } else if (questionType.includes('fill') || questionType.includes('blank')) {
      // Fill-blank: answerData is an object { userInput: string, correct: boolean }
      normalizedAnswer = answerData.userInput || answerData;
    } else if (questionType.includes('match')) {
      // Matching: answerData is an object { pairs: [...], correct: boolean }
      normalizedAnswer = JSON.stringify(answerData.pairs || answerData);
    } else {
      // Fallback: treat as string
      normalizedAnswer = answerData;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: normalizedAnswer
    }));
  }, [phase, currentQuestion]);

  // Use hint
  const handleUseHint = () => {
    if (!allowHints || !currentQuestion?.hint) return;
    if (hintsUsed[currentQuestion.id]) return;
    if (userXp < hintCost) return;

    onUseHint?.(hintCost);
    setHintsUsed(prev => ({
      ...prev,
      [currentQuestion.id]: true
    }));
  };

  // Go to next question or review
  const handleNext = () => {
    if (!hasAnswered) return;

    // Play sound (WI-301)
    const selectedAnswer = answers[currentQuestion.id];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }

    setPhase('review');
  };

  // Continue from review
  const handleContinueFromReview = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('active');
    }
  };

  // Go to previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setPhase('active');
    }
  };

  // HELPER: Parse accepted answers from various formats
  // SUPPORTS: "answer1|answer2|answer3" or "answer1,answer2,answer3"
  const parseAcceptedAnswers = (answersStr) => {
    if (!answersStr) return [];
    if (Array.isArray(answersStr)) return answersStr;
    return answersStr.split(/[|,]/).map(a => a.trim().toLowerCase());
  };

  // HELPER: Check if answer is correct based on question type
  const isAnswerCorrect = (question, selectedAnswer) => {
    if (!selectedAnswer) return false;

    const questionType = (question.type || 'mcq').toLowerCase();

    if (questionType === 'mcq' || questionType === 'multiple_choice') {
      // MCQ: Compare label (A, B, C, D) with correctAnswer
      return selectedAnswer === question.correctAnswer;
    } else if (questionType.includes('true') || questionType.includes('false') || questionType === 'tf') {
      // True/False: Compare selected value with correctAnswer
      return selectedAnswer.toLowerCase() === (question.correctAnswer || '').toLowerCase();
    } else if (questionType.includes('fill') || questionType.includes('blank')) {
      // Fill-blank: Check if answer matches any accepted answer (case-insensitive)
      const acceptedAnswers = parseAcceptedAnswers(question.acceptedAnswers || question.correctAnswer);
      return acceptedAnswers.some(accepted =>
        accepted.toLowerCase() === selectedAnswer.toLowerCase()
      );
    } else if (questionType.includes('match')) {
      // Matching: Compare JSON stringified pairs
      // This is a simplified check; real implementation would compare pair arrays
      return selectedAnswer === question.correctAnswer;
    } else {
      // Fallback: Simple string comparison
      return selectedAnswer === question.correctAnswer;
    }
  };

  // Submit quiz
  const handleSubmit = useCallback(() => {
    const quizResults = filteredQuestions.map(q => {
      const selectedAnswer = answers[q.id] || null;
      // DECISION GATE: Use type-specific correctness check
      const isCorrect = isAnswerCorrect(q, selectedAnswer);

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        hintsUsed: hintsUsed[q.id] || false,
        difficulty: q.difficulty || 'medium',
        timeSpent: durations[q.id] || 0
      };
    });

    const correctCount = quizResults.filter(r => r.isCorrect).length;
    const finalScore = Math.round((correctCount / filteredQuestions.length) * 100);

    // Calculate XP with difficulty multiplier
    let earnedXp = 0;
    quizResults.forEach((r, i) => {
      if (r.isCorrect) {
        let questionXP = filteredQuestions[i].xpReward || 10;
        const diffConfig = DIFFICULTY_CONFIG[r.difficulty] || DIFFICULTY_CONFIG.medium;
        questionXP = Math.floor(questionXP * diffConfig.xpMultiplier);
        if (r.hintsUsed) {
          questionXP = Math.floor(questionXP * 0.5);
        }
        earnedXp += questionXP;
      }
    });

    // Perfect score bonus
    if (finalScore === 100) {
      earnedXp += 20;
    }

    setResults(quizResults);
    setScore(finalScore);
    setXpEarned(earnedXp);
    setPhase('complete');

    onComplete?.(finalScore, earnedXp, quizResults);

    // Celebration Animation (WI-103)
    if (finalScore >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [filteredQuestions, answers, hintsUsed, onComplete, durations]);

  // Keep handleSubmitRef updated to avoid stale closure in timer
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Retry quiz
  const handleRetry = () => {
    setPhase('ready');
    setCurrentIndex(0);
    setAnswers({});
    setHintsUsed({});
    setTimeRemaining(timeLimit);
    setResults(null);
    setScore(null);
    setXpEarned(null);
    setAiExplanation({ loading: false, text: null });
  };

  const handleExplain = async () => {
    if (!currentQuestion) return;

    setAiExplanation({ loading: true, text: null });

    const explanation = await explainMisconception(
      settings.geminiApiKey,
      currentQuestion.question,
      answers[currentQuestion.id],
      currentQuestion.correctAnswer
    );

    setAiExplanation({ loading: false, text: explanation });
  };

  if (!questions || questions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl p-6 border text-center",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        <HelpCircle
          className={cn(
            "w-12 h-12 mx-auto mb-4 opacity-50",
            darkMode ? "text-slate-500" : "text-slate-400"
          )}
        />
        <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
          No quiz questions available for this topic yet.
        </p>
      </div>
    );
  }

  // Ready Phase
  if (phase === 'ready') {
    // Calculate max XP with difficulty multipliers
    const maxXp = filteredQuestions.reduce((sum, q) => {
      const diffConfig = DIFFICULTY_CONFIG[q.difficulty || 'medium'];
      return sum + Math.floor((q.xpReward || 10) * diffConfig.xpMultiplier);
    }, 0) + 20; // +20 for perfect bonus

    return (
      <div
        className={cn(
          "rounded-2xl p-6 border",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        <div className="text-center py-8">
          <div
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6",
              `bg-gradient-to-br ${subjectConfig.gradient}`
            )}
          >
            <HelpCircle className="w-10 h-10 text-white" />
          </div>

          <h3
            className={cn(
              "text-2xl font-bold mb-2",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            Topic Quiz
          </h3>
          <p
            className={cn(
              "mb-6",
              darkMode ? "text-slate-400" : "text-slate-500"
            )}
          >
            Test your understanding
          </p>

          {/* Difficulty Filter */}
          {showDifficultyFilter && questions.length > 0 && (
            <div className="mb-6">
              <div className={cn(
                "flex items-center justify-center gap-2 mb-3",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}>
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter by Difficulty</span>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setDifficultyFilter('all')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    difficultyFilter === 'all'
                      ? cn("bg-gradient-to-r text-white", subjectConfig.gradient)
                      : darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  All ({questions.length})
                </button>
                {difficultyStats.easy > 0 && (
                  <button
                    onClick={() => setDifficultyFilter('easy')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      difficultyFilter === 'easy'
                        ? "bg-emerald-500 text-white"
                        : darkMode
                          ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    )}
                  >
                    Easy ({difficultyStats.easy})
                  </button>
                )}
                {difficultyStats.medium > 0 && (
                  <button
                    onClick={() => setDifficultyFilter('medium')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      difficultyFilter === 'medium'
                        ? "bg-amber-500 text-white"
                        : darkMode
                          ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    )}
                  >
                    Medium ({difficultyStats.medium})
                  </button>
                )}
                {difficultyStats.hard > 0 && (
                  <button
                    onClick={() => setDifficultyFilter('hard')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      difficultyFilter === 'hard'
                        ? "bg-red-500 text-white"
                        : darkMode
                          ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                    )}
                  >
                    Hard ({difficultyStats.hard})
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <div
                className={cn(
                  "text-2xl font-bold",
                  darkMode ? "text-white" : "text-slate-800"
                )}
              >
                {filteredQuestions.length}
              </div>
              <div
                className={cn(
                  "text-sm",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                Questions
              </div>
            </div>
            {showTimer && timeLimit && (
              <div className="text-center">
                <div
                  className={cn(
                    "text-2xl font-bold",
                    darkMode ? "text-white" : "text-slate-800"
                  )}
                >
                  {formatTime(timeLimit)}
                </div>
                <div
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Time Limit
                </div>
              </div>
            )}
            <div className="text-center">
              <div
                className={cn(
                  "text-2xl font-bold",
                  darkMode ? "text-white" : "text-slate-800"
                )}
              >
                {maxXp}
              </div>
              <div
                className={cn(
                  "text-sm",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                Max XP
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className={cn(
              "px-8 py-4 rounded-xl font-bold text-white text-lg",
              `bg-gradient-to-r ${subjectConfig.gradient}`
            )}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Active Phase
  if (phase === 'active') {
    const questionDifficulty = currentQuestion.difficulty || 'medium';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm font-medium",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              Question {currentIndex + 1} of {filteredQuestions.length}
            </span>
            <DifficultyBadge difficulty={questionDifficulty} darkMode={darkMode} small />
            {currentQuestion.isAIGenerated && (
              <span className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"
              )}>
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>
          {showTimer && timeRemaining !== null && (
            <span
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold",
                timeRemaining < 30
                  ? "bg-red-100 text-red-600"
                  : darkMode
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={cn(
            "h-2 rounded-full overflow-hidden",
            darkMode ? "bg-slate-700" : "bg-slate-200"
          )}
        >
          <div
            className={cn(
              "h-full transition-all bg-gradient-to-r",
              subjectConfig.gradient
            )}
            style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div
          className={cn(
            "rounded-2xl p-6 border",
            darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          {/* Question Image (if provided from Google Sheets) */}
          {currentQuestion.imageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={currentQuestion.imageUrl}
                alt="Question illustration"
                className={cn(
                  "w-full h-auto max-h-48 object-contain",
                  darkMode ? "bg-slate-700" : "bg-slate-100"
                )}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <p
            className={cn(
              "text-lg font-medium mb-6",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            {currentQuestion.question}
          </p>

          {/* Question Progress Indicators */}
          <div className="flex gap-1 flex-wrap mb-4" role="navigation" aria-label="Question navigation">
            {filteredQuestions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to question ${i + 1}${answers[q.id] ? ', answered' : ', not answered'}`}
                aria-current={i === currentIndex ? 'step' : undefined}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-bold transition-all",
                  i === currentIndex
                    ? cn("ring-2 ring-offset-2", darkMode ? "ring-white ring-offset-slate-800" : "ring-slate-800 ring-offset-white")
                    : "",
                  answers[q.id]
                    ? "bg-emerald-500 text-white"
                    : darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Renderer - Supports all question types */}
          <QuestionRenderer
            question={currentQuestion}
            onAnswer={handleQuestionAnswer}
            showHint={hintsUsed[currentQuestion.id] || false}
            darkMode={darkMode}
            disabled={false}
            subjectConfig={subjectConfig}
          />

          {/* Hint */}
          {allowHints && currentQuestion.hint && (
            <div
              className={cn(
                "mt-6 pt-6 border-t",
                darkMode ? "border-slate-700" : "border-slate-200"
              )}
            >
              {hintsUsed[currentQuestion.id] ? (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl",
                    darkMode
                      ? "bg-amber-900/30 text-amber-200"
                      : "bg-amber-50 text-amber-800"
                  )}
                >
                  <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{currentQuestion.hint}</p>
                </div>
              ) : (
                <button
                  onClick={handleUseHint}
                  disabled={userXp < hintCost}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    userXp >= hintCost
                      ? "text-amber-600 hover:text-amber-700"
                      : "text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Lightbulb className="w-5 h-5" />
                  <div className="flex flex-col gap-1 items-start">
                    <span className="font-bold">Know More / Hint</span>
                    <span className="text-xs opacity-75">(-{hintCost} XP)</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium",
              currentIndex === 0
                ? darkMode
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                : darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!hasAnswered}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium",
              !hasAnswered
                ? darkMode
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                : cn(`bg-gradient-to-r text-white`, subjectConfig.gradient)
            )}
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Review Phase
  if (phase === 'review') {
    const selectedAnswer = answers[currentQuestion.id];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <div
        className={cn(
          "rounded-2xl p-6 border",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl mb-6",
            isCorrect
              ? darkMode
                ? "bg-emerald-900/30 text-emerald-300"
                : "bg-emerald-100 text-emerald-800"
              : darkMode
                ? "bg-red-900/30 text-red-300"
                : "bg-red-100 text-red-800"
          )}
        >
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-bold">
                Correct! +{hintsUsed[currentQuestion.id]
                  ? Math.floor((currentQuestion.xpReward || 10) * 0.5)
                  : currentQuestion.xpReward || 10} XP
              </span>
            </>
          ) : (
            <>
              <X className="w-6 h-6" />
              <span className="font-bold">
                Incorrect. The answer is {currentQuestion.correctAnswer}
              </span>
            </>
          )}
        </div>

        <p
          className={cn(
            "mb-6",
            darkMode ? "text-slate-300" : "text-slate-600"
          )}
        >
          {currentQuestion.explanation}
        </p>

        {/* AI Explanation Section */}
        {!isCorrect && (
          <div className="mb-6">
            {aiExplanation.text ? (
              <div className={cn("p-4 rounded-xl border-l-4 border-purple-500", darkMode ? "bg-purple-900/20" : "bg-purple-50")}>
                <h4 className="font-bold flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                  <Bot className="w-5 h-5" /> AI Explanation
                </h4>
                <p className={cn("text-sm", darkMode ? "text-slate-300" : "text-slate-700")}>{aiExplanation.text}</p>
              </div>
            ) : (
              <button
                onClick={handleExplain}
                disabled={aiExplanation.loading}
                className={cn("text-sm font-medium underline flex items-center gap-1", darkMode ? "text-purple-400" : "text-purple-600")}
              >
                {aiExplanation.loading ? 'Thinking...' : "Explain Why I'm Wrong 🤖"}
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleContinueFromReview}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-white",
            `bg-gradient-to-r ${subjectConfig.gradient}`
          )}
        >
          {isLastQuestion ? 'See Results' : 'Continue'}
        </button>
      </div>
    );
  }

  // Complete Phase
  if (phase === 'complete') {
    const correctCount = results.filter(r => r.isCorrect).length;

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <div
          className={cn(
            "rounded-2xl p-6 border",
            darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          <div className="text-center py-8">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                score >= 80
                  ? "bg-emerald-100"
                  : score >= 50
                    ? "bg-amber-100"
                    : "bg-red-100"
              )}
            >
              <span
                className={cn(
                  "text-3xl font-bold",
                  score >= 80
                    ? "text-emerald-600"
                    : score >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                )}
              >
                {score}%
              </span>
            </div>

            <h3
              className={cn(
                "text-2xl font-bold mb-2",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              {score === 100
                ? 'Perfect!'
                : score >= 80
                  ? 'Great Job!'
                  : score >= 50
                    ? 'Good Effort!'
                    : 'Keep Studying!'}
            </h3>

            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {correctCount}/{questions.length}
                </div>
                <div
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  Correct
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">
                  +{xpEarned}
                </div>
                <div
                  className={cn(
                    "text-sm",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  XP Earned
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Breakdown */}
        <div
          className={cn(
            "rounded-2xl p-6 border",
            darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          <h4
            className={cn(
              "font-bold mb-4",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            Question Review
          </h4>
          <div className="space-y-3">
            {results.map((result, i) => (
              <div
                key={result.questionId}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  result.isCorrect
                    ? darkMode
                      ? "bg-emerald-900/30"
                      : "bg-emerald-50"
                    : darkMode
                      ? "bg-red-900/30"
                      : "bg-red-50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    result.isCorrect
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                  )}
                >
                  {result.isCorrect ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    darkMode ? "text-slate-300" : "text-slate-700"
                  )}
                >
                  Question {i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    darkMode ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {result.selectedAnswer || 'Skipped'} → {result.correctAnswer}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleRetry}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium",
              darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            <RotateCcw className="w-5 h-5" />
            Retry Quiz
          </button>
        </div>
      </div>
    );
  }

  return null;
});

QuizSection.displayName = 'QuizSection';

QuizSection.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })).isRequired,
    correctAnswer: PropTypes.string.isRequired,
    difficulty: PropTypes.oneOf(['easy', 'medium', 'hard']),
    hint: PropTypes.string,
    explanation: PropTypes.string,
    xpReward: PropTypes.number,
    imageUrl: PropTypes.string,
    isAIGenerated: PropTypes.bool,
  })),
  darkMode: PropTypes.bool,
  subjectConfig: PropTypes.shape({
    gradient: PropTypes.string,
    color: PropTypes.string,
  }),
  onComplete: PropTypes.func,
  topicId: PropTypes.string,
  showTimer: PropTypes.bool,
  timeLimit: PropTypes.number,
  allowHints: PropTypes.bool,
  hintCost: PropTypes.number,
  userXp: PropTypes.number,
  onUseHint: PropTypes.func,
  showDifficultyFilter: PropTypes.bool,
};

QuizSection.defaultProps = {
  questions: [],
  darkMode: false,
  showTimer: false,
  timeLimit: null,
  allowHints: true,
  hintCost: 5,
  userXp: 0,
  showDifficultyFilter: true,
};

export default QuizSection;
