import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';
import { calculateLevel } from '../constants';
import { soundManager } from '../utils/SoundManager';

const DEFAULT_PROGRESS = {
    topics: {},
    xp: 0,
    streak: 1,
    avatar: 'student', // Default avatar
    lastStudyDate: null,
    studyTimeMinutes: 0,
    quizScores: {},
    bookmarks: [],
    notes: {},
    achievements: ['first-login'],
    // NEW: Spaced repetition data
    reviewSchedule: {}, // { questionId: { nextReview: Date, interval: number, easeFactor: 2.5 } }
    reviewsDue: [], // [questionId] - questions due for review today
    stats: {
        totalQuestions: 0,
        totalCorrect: 0,
        totalTimeSeconds: 0
    },
    dailyStats: {}, // "YYYY-MM-DD": { questions: 0, correct: 0, time: 0 }
    topicStats: {},  // "topicId": { questions: 0, correct: 0, time: 0 }
    subjectStats: {} // "subjectKey": { questions: 0, correct: 0, time: 0 }
};

const STORAGE_KEY = 'studyhub_v6_data';

const StudyContext = createContext(null);
export const useStudy = () => {
    const ctx = useContext(StudyContext);
    if (!ctx) throw new Error('useStudy must be used within StudyProvider');
    return ctx;
};

const DEFAULT_SETTINGS = {
    darkMode: false,
    notifications: true,
    soundEffects: false,
    shuffleQuestions: false,
    geminiApiKey: '',
    customSheetUrl: '',
    sheetUrl_math: '',
    sheetUrl_physics: '',
    sheetUrl_chemistry: '',
    sheetUrl_biology: ''
};

const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn('localStorage error:', error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };

    return (
        <div className={cn("fixed bottom-4 right-4 z-50 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2", colors[type])}>
            {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {type === 'error' && <AlertCircle className="w-5 h-5" />}
            {message}
        </div>
    );
};

export const StudyProvider = ({ children }) => {
    const data = useData();
    const [savedData, setSavedData] = useLocalStorage(STORAGE_KEY, {
        progress: DEFAULT_PROGRESS,
        settings: DEFAULT_SETTINGS
    });
    const [toast, setToast] = useState(null);
    const [levelUpEvent, setLevelUpEvent] = useState(null); // { level: 5 }
    const [achievementEvent, setAchievementEvent] = useState(null); // { id: 'streak-5', ... }

    const progress = savedData.progress;
    const settings = savedData.settings;

    // Sync sound settings
    useEffect(() => {
        soundManager.setMuted(!settings.soundEffects);
    }, [settings.soundEffects]);

    // Track previous state for change detection
    const prevProgressRef = React.useRef(progress);

    useEffect(() => {
        const prev = prevProgressRef.current;
        const curr = progress;

        // Check for Level Up
        const oldLevel = calculateLevel(prev.xp);
        const newLevel = calculateLevel(curr.xp);

        if (newLevel > oldLevel) {
            setLevelUpEvent({ level: newLevel });
            soundManager.playLevelUp();
        }

        // Check for new Achievements
        if (curr.achievements.length > prev.achievements.length) {
            const newAchievements = curr.achievements.filter(a => !prev.achievements.includes(a));
            if (newAchievements.length > 0) {
                setAchievementEvent({ ids: newAchievements });
                soundManager.playAchievement();
            }
        }

        prevProgressRef.current = curr;
    }, [progress]);

    const updateProgress = useCallback((updates) => {
        setSavedData(prev => ({
            ...prev,
            progress: {
                ...prev.progress,
                ...updates,
                topics: updates.topics ? { ...prev.progress.topics, ...updates.topics } : prev.progress.topics,
                notes: updates.notes ? { ...prev.progress.notes, ...updates.notes } : prev.progress.notes
            }
        }));
    }, [setSavedData]);

    const scheduleReview = useCallback((questionId, wasCorrect) => {
        const now = Date.now();
        const existing = savedData.progress.reviewSchedule?.[questionId];

        // SM-2 Algorithm (simplified)
        let interval, easeFactor;

        if (!existing) {
            // First review
            interval = wasCorrect ? 1 : 0; // 1 day if correct, review today if wrong
            easeFactor = 2.5;
        } else {
            easeFactor = existing.easeFactor;

            if (wasCorrect) {
                // Increase interval
                if (existing.interval === 0) interval = 1;
                else if (existing.interval === 1) interval = 6;
                else interval = Math.round(existing.interval * easeFactor);

                easeFactor = Math.max(1.3, easeFactor + 0.1); // Easier next time
            } else {
                // Reset interval
                interval = 0;
                easeFactor = Math.max(1.3, easeFactor - 0.2); // Harder next time
            }
        }

        const nextReview = now + (interval * 24 * 60 * 60 * 1000); // Convert days to ms

        updateProgress({
            reviewSchedule: {
                ...(savedData.progress.reviewSchedule || {}),
                [questionId]: { nextReview, interval, easeFactor }
            }
        });
    }, [savedData, updateProgress]);

    const updateSettings = useCallback((newSettings) => {
        setSavedData(prev => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings }
        }));
    }, [setSavedData]);

    const toggleDarkMode = useCallback(() => {
        updateSettings({ darkMode: !settings.darkMode });
    }, [settings.darkMode, updateSettings]);

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    // Update streak on load
    useEffect(() => {
        const today = new Date().toDateString();
        if (progress.lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const newStreak = progress.lastStudyDate === yesterday.toDateString() ? progress.streak + 1 : 1;

            const newAchievements = [...progress.achievements];
            if (newStreak >= 5 && !newAchievements.includes('streak-5')) newAchievements.push('streak-5');
            if (newStreak >= 10 && !newAchievements.includes('streak-10')) newAchievements.push('streak-10');

            updateProgress({ streak: newStreak, lastStudyDate: today, achievements: newAchievements });
        }
    }, [progress.lastStudyDate, progress.streak, progress.achievements, updateProgress]);

    const value = {
        progress,
        settings,
        subjects: data?.subjects || {},
        sections: data?.sections || {},
        objectives: data?.objectives || {},
        keyTerms: data?.keyTerms || {},
        studyContent: data?.studyContent || {},
        formulas: data?.formulas || {},
        quizQuestions: data?.quizQuestions || {},
        achievements: data?.achievements || [],
        dailyChallenges: data?.dailyChallenges || [],
        updateProgress,
        scheduleReview, // NEW
        getReviewsDue: useCallback(() => {
            const now = Date.now();
            return Object.entries(savedData.progress.reviewSchedule || {})
                .filter(([_, data]) => data.nextReview <= now)
                .map(([questionId]) => questionId);
        }, [savedData]),
        toggleDarkMode,
        updateSettings,
        showToast,
        toast,
        setToast,
        levelUpEvent,
        achievementEvent,
        dismissLevelUp: () => setLevelUpEvent(null),
        dismissAchievement: () => setAchievementEvent(null)
    };

    return (
        <StudyContext.Provider value={value}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </StudyContext.Provider>
    );
};
