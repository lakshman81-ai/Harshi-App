import React, { memo, useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, Star, Check, X, Lightbulb, ChevronRight, Trophy } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

// Difficulty badge colors
const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400' }
};

// Subject colors for gradient
const SUBJECT_GRADIENTS = {
  physics: 'from-blue-500 to-blue-600',
  math: 'from-emerald-500 to-emerald-600',
  chemistry: 'from-amber-500 to-amber-600',
  biology: 'from-violet-500 to-violet-600'
};

/**
 * DailyChallenge Component
 * Shows a daily challenge question with timer and rewards
 *
 * @param {Object} props
 * @param {Object} props.challenge - Challenge object from Google Sheets or AI
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {boolean} props.completed - Whether challenge was already completed today
 * @param {Function} props.onComplete - Callback when challenge is completed (xp, correct)
 * @param {Function} props.onClick - Callback when card is clicked to expand
 */
const DailyChallenge = memo(({
  challenge,
  darkMode,
  completed = false,
  onComplete,
  onClick,
  isModal = false // New prop
}) => {
  const [isExpanded, setIsExpanded] = useState(isModal); // Initialize based on prop
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Calculate time until midnight for countdown
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!challenge) {
    return null;
  }

  const difficulty = challenge.difficulty || 'medium';
  const difficultyColors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;
  const gradient = SUBJECT_GRADIENTS[challenge.subjectKey] || SUBJECT_GRADIENTS.math;

  const handleSelectAnswer = (optionLabel) => {
    if (showResult || completed) return;
    setSelectedAnswer(optionLabel);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || completed) return;

    setShowResult(true);
    const isCorrect = selectedAnswer === challenge.correctAnswer;
    const xpEarned = isCorrect ? (showHint ? Math.floor(challenge.xpReward * 0.5) : challenge.xpReward) : 0;

    onComplete?.(xpEarned, isCorrect);
  };

  const handleExpand = () => {
    if (!completed) {
      setIsExpanded(true);
      onClick?.();
    }
  };

  // Collapsed card view (Only show if NOT modal)
  if (!isExpanded && !completed && !isModal) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          "w-full rounded-2xl p-4 border text-left transition-all group",
          darkMode
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600"
            : "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-lg"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
            gradient
          )}>
            <Calendar className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-bold",
                darkMode ? "text-white" : "text-slate-800"
              )}>
                Daily Challenge
              </h3>
              {challenge.isAIGenerated && (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                darkMode ? difficultyColors.darkBg : difficultyColors.bg,
                darkMode ? difficultyColors.darkText : difficultyColors.text
              )}>
                {difficulty}
              </span>
              <span className={cn(
                "flex items-center gap-1",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}>
                <Clock className="w-3 h-3" />
                {timeLeft} left
              </span>
              <span className={cn(
                "flex items-center gap-1 font-medium",
                darkMode ? "text-amber-400" : "text-amber-600"
              )}>
                <Star className="w-3 h-3" />
                +{challenge.xpReward} XP
              </span>
            </div>
          </div>

          <ChevronRight className={cn(
            "w-5 h-5 group-hover:translate-x-1 transition-transform",
            darkMode ? "text-slate-500" : "text-slate-400"
          )} />
        </div>
      </button>
    );
  }

  // Completed state (Reuse logic but maybe adapt for modal?)
  // If modal, we might want to keep showing the result instead of switching to "Come back tomorrow" card immediately?
  // But let's keep it simple.

  // If completed and not expanded (standard flow), show completed card.
  // If Modal, we likely want to show the completed result state inside the Quiz view.
  // The current logic:
  if (completed && !isExpanded && !isModal) {
    // ... (Existing completed card logic)
    return (
      // ... existing return
      <div className={cn(
        "rounded-2xl p-4 border",
        darkMode
          ? "bg-emerald-900/20 border-emerald-800"
          : "bg-emerald-50 border-emerald-200"
      )}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500">
            <Check className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1">
            <h3 className={cn(
              "font-bold",
              darkMode ? "text-emerald-300" : "text-emerald-800"
            )}>
              Challenge Completed!
            </h3>
            <p className={cn(
              "text-sm",
              darkMode ? "text-emerald-400" : "text-emerald-600"
            )}>
              Come back tomorrow for a new challenge
            </p>
          </div>

          <Trophy className={cn(
            "w-8 h-8",
            darkMode ? "text-emerald-400" : "text-emerald-500"
          )} />
        </div>
      </div>
    );
  }

  // Expanded/Modal View
  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden",
      darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
      isModal && "border-0 shadow-none bg-transparent" // Remove borders if modal handles container
    )}>
      {/* ... Rest of Quiz View ... */}

      {/* Header */}
      <div className={cn("p-4 bg-gradient-to-r text-white", gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Daily Challenge</h3>
              <p className="text-sm text-white/80">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium bg-white/20 capitalize"
            )}>
              {difficulty}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20">
              <Star className="w-3 h-3" />
              {challenge.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        {/* Question Image (if provided) */}
        {challenge.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden">
            <img
              src={challenge.imageUrl}
              alt="Challenge"
              className="w-full h-auto max-h-48 object-contain bg-slate-100"
            />
          </div>
        )}

        <p className={cn(
          "text-lg font-medium mb-6",
          darkMode ? "text-white" : "text-slate-800"
        )}>
          {challenge.question}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {challenge.options?.map(option => {
            const isSelected = selectedAnswer === option.label;
            const isCorrect = option.label === challenge.correctAnswer;
            const showCorrectness = showResult;

            return (
              <button
                key={option.label}
                onClick={() => handleSelectAnswer(option.label)}
                disabled={showResult}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border-2",
                  showCorrectness && isCorrect
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                    : showCorrectness && isSelected && !isCorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                      : isSelected
                        ? cn("border-current bg-gradient-to-r text-white", gradient)
                        : darkMode
                          ? "border-slate-700 bg-slate-700 hover:border-slate-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <span className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                  showCorrectness && isCorrect
                    ? "bg-emerald-500 text-white"
                    : showCorrectness && isSelected && !isCorrect
                      ? "bg-red-500 text-white"
                      : isSelected
                        ? "bg-white/20"
                        : darkMode
                          ? "bg-slate-600"
                          : "bg-slate-100"
                )}>
                  {showCorrectness && isCorrect ? (
                    <Check className="w-5 h-5" />
                  ) : showCorrectness && isSelected && !isCorrect ? (
                    <X className="w-5 h-5" />
                  ) : (
                    option.label
                  )}
                </span>
                <span className={cn(
                  "flex-1",
                  showCorrectness && isCorrect && !isSelected && (darkMode ? "text-emerald-400" : "text-emerald-700")
                )}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint Section */}
        {challenge.hint && !showResult && (
          <div className={cn(
            "mb-4 border-t pt-4",
            darkMode ? "border-slate-700" : "border-slate-200"
          )}>
            {showHint ? (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl",
                darkMode ? "bg-amber-900/30 text-amber-200" : "bg-amber-50 text-amber-800"
              )}>
                <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{challenge.hint}</p>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className={cn(
                  "flex items-center gap-2 text-amber-600 hover:text-amber-700"
                )}
              >
                <Lightbulb className="w-5 h-5" />
                <span>Show Hint (reduces XP by 50%)</span>
              </button>
            )}
          </div>
        )}

        {/* Result Message */}
        {showResult && (
          <div className={cn(
            "mb-4 p-4 rounded-xl",
            selectedAnswer === challenge.correctAnswer
              ? darkMode ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-800"
              : darkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800"
          )}>
            <div className="flex items-center gap-2 font-bold mb-2">
              {selectedAnswer === challenge.correctAnswer ? (
                <>
                  <Check className="w-5 h-5" />
                  Correct! +{showHint ? Math.floor(challenge.xpReward * 0.5) : challenge.xpReward} XP
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Incorrect. The answer is {challenge.correctAnswer}
                </>
              )}
            </div>
            {challenge.explanation && (
              <p className="text-sm opacity-90">{challenge.explanation}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={cn(
              "w-full py-3 rounded-xl font-bold transition-all",
              selectedAnswer
                ? cn("bg-gradient-to-r text-white", gradient)
                : darkMode
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Submit Answer
          </button>
        )}

        {/* Close button after completion */}
        {showResult && (
          <button
            onClick={() => setIsExpanded(false)}
            className={cn(
              "w-full py-3 rounded-xl font-medium",
              darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
});

DailyChallenge.displayName = 'DailyChallenge';

export default DailyChallenge;
