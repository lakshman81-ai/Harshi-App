/**
 * Adaptive Engine
 * Selects questions based on user mastery level using weighted random selection.
 */

export const calculateMasteryLevel = (score) => {
    if (score < 30) return 'easy';
    if (score < 70) return 'medium';
    return 'hard';
};

export const selectQuestions = (pool, masteryScore) => {
    // 1. Bucket questions
    const buckets = {
        easy: pool.filter(q => (q.difficulty || 'medium') === 'easy'),
        medium: pool.filter(q => (q.difficulty || 'medium') === 'medium'),
        hard: pool.filter(q => (q.difficulty || 'medium') === 'hard')
    };

    // 2. Define weights based on mastery score
    let weights;
    if (masteryScore < 30) {
        // Beginner: Mostly easy, some medium
        weights = { easy: 0.7, medium: 0.3, hard: 0.0 };
    } else if (masteryScore < 70) {
        // Intermediate: Balanced
        weights = { easy: 0.3, medium: 0.5, hard: 0.2 };
    } else {
        // Advanced: Mostly hard
        weights = { easy: 0.1, medium: 0.3, hard: 0.6 };
    }

    // 3. Selection logic
    const selected = [];
    const TARGET_COUNT = 5;

    // Helper to pick random question from bucket
    const pick = (bucket) => {
        if (!bucket || bucket.length === 0) return null;
        const index = Math.floor(Math.random() * bucket.length);
        const [q] = bucket.splice(index, 1); // Remove to avoid duplicates
        return q;
    };

    // Fill quotas
    ['easy', 'medium', 'hard'].forEach(level => {
        const count = Math.round(TARGET_COUNT * weights[level]);
        for (let i = 0; i < count; i++) {
            const q = pick(buckets[level]);
            if (q) selected.push(q);
        }
    });

    // Backfill if not enough (e.g., if we needed 3 hard but only had 1)
    while (selected.length < TARGET_COUNT) {
        // Try filling from Medium -> Easy -> Hard
        let q = pick(buckets.medium) || pick(buckets.easy) || pick(buckets.hard);

        // If still nothing (pool exhausted), break
        if (!q) break;

        selected.push(q);
    }

    // Shuffle the final selection
    return selected.sort(() => 0.5 - Math.random());
};
