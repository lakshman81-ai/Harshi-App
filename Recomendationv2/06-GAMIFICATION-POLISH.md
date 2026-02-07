# Phase 6: Gamification Polish — XP, Badges, Bloom's Radar, Streaks

## Why This Phase Is Last

Gamification is a **wrapper around learning, not a substitute**. Meta-analysis (Sailer & Homner 2020, g=0.49) confirms gamification improves cognitive outcomes — but only when the underlying content and assessment are solid. Phases 1-5 built that foundation. Now we add the motivational layer.

**ALIGNMENT**: The existing app already has XP, streaks, and achievements in `StudyContext.jsx` and `constants.js`. This phase enhances them, not replaces them.

---

## Step 1: Enhanced XP System

### Current State (in constants.js)
```javascript
// Existing:
export const calculateLevel = (xp) => Math.floor(xp / 100) + 1;
```

### Enhanced Version

```javascript
/**
 * REASONING: Flat 100 XP per level feels stale after level 5. A slightly
 * increasing curve (like RPGs) keeps the next level feeling achievable
 * while preventing runaway levels. Formula: XP_needed = 100 + (level * 20)
 * Level 1 → 120 XP, Level 5 → 200 XP, Level 10 → 300 XP
 */
export const calculateLevel = (totalXP) => {
    let level = 1;
    let xpNeeded = 120;  // XP for level 2
    let xpUsed = 0;

    while (xpUsed + xpNeeded <= totalXP) {
        xpUsed += xpNeeded;
        level++;
        xpNeeded = 100 + (level * 20);
    }

    return {
        level,
        currentXP: totalXP - xpUsed,       // XP into current level
        nextLevelXP: xpNeeded,               // XP needed for next level
        progressPercent: Math.round(((totalXP - xpUsed) / xpNeeded) * 100)
    };
};

// XP rewards scaled by difficulty and question type
export const XP_REWARDS = {
    // Base XP by question type
    MCQ: 10,
    FILL_BLANK: 12,
    TRUE_FALSE_JUSTIFY: 15,
    ASSERT_REASON: 20,
    MATCHING: 15,
    ORDERING: 15,
    CATEGORIZE: 20,
    DIAGRAM: 20,

    // Multipliers
    DIFFICULTY_MULTIPLIER: [1.0, 1.0, 1.25, 1.5, 1.75, 2.0], // diff 0-5
    BLOOM_MULTIPLIER: [1.0, 1.0, 1.05, 1.1, 1.2, 1.3, 1.4],  // bloom 0-6
    FIRST_TRY_BONUS: 1.25,
    NO_HINT_BONUS: 1.15,
    STREAK_BONUS: [1.0, 1.0, 1.0, 1.05, 1.1, 1.15],  // 0-5+ day streak
};
```

---

## Step 2: Mastery Badges Tied to Real Achievement

```javascript
/**
 * REASONING: Badges should reward LEARNING, not just activity. "Logged in 5 days"
 * is participation. "Answered 90%+ on Newton's Laws across all question types"
 * is mastery. Research shows mastery-oriented gamification outperforms
 * completion-oriented (Hamari et al. 2014).
 */

export const ENHANCED_BADGES = [
    // Existing (keep for backward compatibility)
    { id: 'first-login', icon: 'Star', name: 'First Steps', desc: 'Started your journey' },
    { id: 'streak-5', icon: 'Flame', name: 'On Fire', desc: '5-day study streak' },
    { id: 'streak-10', icon: 'Flame', name: 'Unstoppable', desc: '10-day study streak' },

    // NEW: Mastery badges
    {
        id: 'topic-mastery',
        icon: 'Award',
        name: 'Topic Master',
        desc: '90%+ on all question types in a topic',
        check: (progress, topicId) => {
            const mastery = progress.topicMastery?.[topicId];
            return mastery && mastery.score >= 90;
        }
    },
    {
        id: 'bloom-climber',
        icon: 'Layers',
        name: "Bloom's Climber",
        desc: 'Correctly answered questions at all 6 Bloom levels',
        check: (progress) => {
            const bloomLevels = new Set();
            Object.values(progress.quizScores || {}).forEach(scores => {
                scores.forEach(s => { if (s.correct && s.bloomLevel) bloomLevels.add(s.bloomLevel); });
            });
            return bloomLevels.size >= 6;
        }
    },
    {
        id: 'misconception-buster',
        icon: 'AlertTriangle',
        name: 'Myth Buster',
        desc: 'Correctly answered 10 misconception diagnostic questions',
        check: (progress) => {
            const diagnosticCorrect = Object.values(progress.quizScores || {})
                .flat()
                .filter(s => s.correct && s.questionType === 'ASSERT_REASON')
                .length;
            return diagnosticCorrect >= 10;
        }
    },
    {
        id: 'cross-subject',
        icon: 'Globe',
        name: 'Renaissance Learner',
        desc: 'Completed at least one topic in every subject',
        check: (progress, _, subjects) => {
            const completedSubjects = new Set();
            Object.entries(progress.topics || {}).forEach(([topicId, data]) => {
                if (data.progress >= 100) {
                    // Find which subject this topic belongs to
                    Object.entries(subjects).forEach(([key, subject]) => {
                        if (subject.topics?.some(t => t.id === topicId)) {
                            completedSubjects.add(key);
                        }
                    });
                }
            });
            return completedSubjects.size >= Object.keys(subjects).length;
        }
    },
    {
        id: 'hint-free-10',
        icon: 'Zap',
        name: 'No Help Needed',
        desc: 'Answer 10 questions correctly without using any hints',
        check: (progress) => {
            return (progress.stats?.hintFreeCorrect || 0) >= 10;
        }
    },
    {
        id: 'review-champion',
        icon: 'Clock',
        name: 'Review Champion',
        desc: 'Complete 20 spaced repetition reviews',
        check: (progress) => {
            return (progress.stats?.totalReviews || 0) >= 20;
        }
    }
];
```

---

## Step 3: Bloom's Taxonomy Radar Chart

```jsx
/**
 * BloomRadarChart.jsx
 * Displays student performance across Bloom's taxonomy levels as a radar chart.
 *
 * REASONING: This visualizes WHERE the student is strong (recall) vs weak
 * (analysis). It answers the question "Am I just memorizing or actually
 * understanding?" — a powerful metacognitive tool.
 *
 * Uses recharts (already compatible with the project) or CSS-only fallback.
 */

import React from 'react';
import { cn } from '../../utils';

const BLOOM_LEVELS = [
    { level: 1, name: 'Remember', color: '#60A5FA', description: 'Recall facts and terms' },
    { level: 2, name: 'Understand', color: '#34D399', description: 'Explain concepts' },
    { level: 3, name: 'Apply', color: '#FBBF24', description: 'Use in new situations' },
    { level: 4, name: 'Analyze', color: '#F97316', description: 'Break down and examine' },
    { level: 5, name: 'Evaluate', color: '#EF4444', description: 'Judge and justify' },
    { level: 6, name: 'Create', color: '#8B5CF6', description: 'Design new solutions' },
];

export default function BloomRadarChart({ quizScores, darkMode }) {
    // Calculate accuracy per Bloom level
    const bloomStats = BLOOM_LEVELS.map(({ level, name, color }) => {
        const questions = Object.values(quizScores || {})
            .flat()
            .filter(s => s.bloomLevel === level);

        const total = questions.length;
        const correct = questions.filter(s => s.correct).length;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        return { level, name, color, accuracy, total, correct };
    });

    return (
        <div className={cn("p-4 rounded-xl", darkMode ? "bg-gray-800" : "bg-white shadow-sm")}>
            <h3 className="font-semibold text-lg mb-4">Bloom's Taxonomy Progress</h3>

            <div className="space-y-3">
                {bloomStats.map(stat => (
                    <div key={stat.level} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">
                                L{stat.level}: {stat.name}
                            </span>
                            <span className={cn("text-xs", stat.total === 0 ? "text-gray-400" : "text-gray-600")}>
                                {stat.total > 0 ? `${stat.correct}/${stat.total} (${stat.accuracy}%)` : 'No data yet'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${stat.accuracy}%`,
                                    backgroundColor: stat.color,
                                    minWidth: stat.total > 0 ? '8px' : '0px'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary insight */}
            <div className={cn("mt-4 p-3 rounded-lg text-sm", darkMode ? "bg-gray-750" : "bg-blue-50")}>
                {getInsight(bloomStats)}
            </div>
        </div>
    );
}

function getInsight(stats) {
    const withData = stats.filter(s => s.total > 0);
    if (withData.length === 0) return "Start answering questions to see your Bloom's taxonomy progress!";

    const strongest = withData.reduce((a, b) => a.accuracy > b.accuracy ? a : b);
    const weakest = withData.reduce((a, b) => a.accuracy < b.accuracy ? a : b);

    if (strongest.level === weakest.level) return `You're working on Level ${strongest.level}: ${strongest.name}. Keep going!`;

    return `💪 Strongest: ${strongest.name} (${strongest.accuracy}%) · 🎯 Focus area: ${weakest.name} (${weakest.accuracy}%)`;
}
```

---

## Step 4: Streak Mechanics Enhancement

Update the streak logic in `StudyContext.jsx`:

```javascript
/**
 * REASONING: The existing streak resets if you miss one day. This is too
 * punishing for a student. "Freeze" mechanic: allow 1 missed day per week
 * before streak resets. Also track "longest streak" for motivation.
 */

// In the streak update useEffect:
useEffect(() => {
    const today = new Date().toDateString();
    if (progress.lastStudyDate === today) return; // Already studied today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let newStreak;
    if (progress.lastStudyDate === yesterday.toDateString()) {
        // Studied yesterday → continue streak
        newStreak = progress.streak + 1;
    } else if (progress.lastStudyDate === twoDaysAgo.toDateString() && !progress.freezeUsedThisWeek) {
        // Missed 1 day but have a freeze → continue streak
        newStreak = progress.streak + 1;
        Logger.info('Streak freeze used');
    } else {
        // Streak broken
        newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, progress.longestStreak || 0);
    const freezeUsedThisWeek = progress.lastStudyDate === twoDaysAgo.toDateString();

    // Reset freeze on Monday
    const isMonday = new Date().getDay() === 1;
    const freezeReset = isMonday ? false : freezeUsedThisWeek;

    updateProgress({
        streak: newStreak,
        longestStreak,
        lastStudyDate: today,
        freezeUsedThisWeek: freezeReset
    });
}, [progress.lastStudyDate, progress.streak, updateProgress]);
```

---

## Step 5: Track Bloom's Level in Quiz Answers

When recording quiz answers, include the bloom_level:

```javascript
// In QuizEngine.jsx (or wherever answers are recorded):
const recordAnswer = (question, isCorrect, hintsUsed) => {
    const score = {
        questionId: question.question_id,
        correct: isCorrect,
        bloomLevel: question.bloom_level || 1,
        questionType: question.question_type || 'MCQ',
        difficulty: question.difficulty || 1,
        hintsUsed,
        timestamp: Date.now()
    };

    // Update topic quiz scores
    const topicScores = progress.quizScores[question.topic_id] || [];
    updateProgress({
        quizScores: {
            ...progress.quizScores,
            [question.topic_id]: [...topicScores, score]
        },
        stats: {
            ...progress.stats,
            totalQuestions: (progress.stats?.totalQuestions || 0) + 1,
            totalCorrect: (progress.stats?.totalCorrect || 0) + (isCorrect ? 1 : 0),
            hintFreeCorrect: (progress.stats?.hintFreeCorrect || 0) + (isCorrect && hintsUsed === 0 ? 1 : 0),
        }
    });
};
```

---

## Decision Gates (End of Phase 6)

```bash
# Gate 1: Level calculation works with new formula
# Level 1 at 0 XP, Level 2 at 120 XP, etc.

# Gate 2: Bloom's chart renders with quiz data
# Navigate to dashboard → chart shows bars per Bloom level

# Gate 3: Enhanced badges trigger correctly
# Complete 90%+ on a topic → "Topic Master" badge appears

# Gate 4: Streak freeze works
# Miss one day → streak continues (once per week)

# Gate 5: XP rewards vary by type/difficulty
# MCQ easy = 10 XP, ASSERT_REASON hard = ~40 XP

# Gate 6: Existing progress data is preserved
# localStorage → studyhub_v6_data → all previous XP/streaks intact
```

---

## Files Created/Modified

| File | Action |
|------|--------|
| `src/constants.js` | Modified (enhanced XP, badges) |
| `src/components/gamification/BloomRadarChart.jsx` | **Created** |
| `src/contexts/StudyContext.jsx` | Modified (streak freeze, Bloom tracking) |
