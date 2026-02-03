import React, { memo, useState } from 'react';
import { BookOpen, Star, Flame, CheckCircle2, Clock, Sun, Moon, Settings, Trophy } from 'lucide-react';
import { useStudy } from '../contexts/StudyContext';
import { useData } from '../contexts/DataContext';
import { cn } from '../utils';

import { ICON_MAP, calculateLevel, countCompletedTopics, formatStudyTime, calculateSubjectProgress, AVATAR_MAP } from '../constants';
import { SyncStatusBadge, Card, ProgressRing } from './common/UIComponents';
import AchievementBadge from './common/AchievementBadge';
import LevelUpModal from './common/LevelUpModal';
import AchievementToast from './common/AchievementToast';
import AvatarSelector from './common/AvatarSelector';

import DailyChallengeModal from './modals/DailyChallengeModal';
import QAStatsModal from './modals/QAStatsModal';
import { BarChart2 } from 'lucide-react';

const Dashboard = memo(({ onSelectSubject, onOpenSettings, onGoHome }) => {
    const { progress, settings, subjects, achievements, dailyChallenges, updateProgress, toggleDarkMode } = useStudy();
    const { isDemoMode } = useData();
    const darkMode = settings.darkMode;
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [showQAStats, setShowQAStats] = useState(false);

    const totalXP = progress.xp;
    const level = calculateLevel(totalXP);
    const completedTopics = countCompletedTopics(subjects, progress.topics);

    const AvatarConfig = AVATAR_MAP[progress.avatar || 'student'] || AVATAR_MAP['student'];
    const AvatarIcon = AvatarConfig.icon;

    // Get reviews due
    const { getReviewsDue } = useStudy();
    const reviewsDue = getReviewsDue();

    const allAchievements = achievements.map(a => ({ ...a, unlocked: progress.achievements.includes(a.id) }));

    // Select today's challenge
    const today = new Date().toDateString();
    const challengeIndex = new Date().getDate() % (dailyChallenges.length || 1);
    const todaysChallenge = dailyChallenges[challengeIndex];
    const isChallengeCompleted = progress.dailyChallengeCompleted === today;

    const handleChallengeComplete = (xp, isCorrect) => {
        if (isCorrect) {
            updateProgress({
                xp: progress.xp + xp,
                dailyChallengeCompleted: today
            });
            // Keep modal open briefly or let user close it? 
            // The modal handles confetti. We can close it manually or let user do it.
        }
    };

    return (
        <div className={cn("min-h-screen", darkMode ? "bg-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-slate-100")}>
            {/* Demo Mode Banner */}
            {isDemoMode && (
                <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
                    <strong>Demo Mode:</strong> Configure your Data Source to enable live sync.
                </div>
            )}

            {/* Header */}
            <header className={cn("px-4 sm:px-6 py-4 border-b", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowAvatarSelector(true); }}
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 shadow-md", AvatarConfig.color)}
                            title="Change Avatar"
                        >
                            <AvatarIcon className="w-6 h-6 text-white" />
                        </button>
                        <div>
                            <h1 className={cn("font-bold text-lg", darkMode ? "text-white" : "text-slate-800")}>StudyHub</h1>
                            <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>Grade 8</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <SyncStatusBadge darkMode={darkMode} />
                        <div className="relative group cursor-help ml-2" title={`Level ${level} (Total XP: ${totalXP})`}>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-sm transition-transform group-hover:scale-110",
                                darkMode ? "bg-slate-800 border-amber-500 text-amber-400" : "bg-white border-amber-400 text-amber-600"
                            )}>
                                {level}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                                <Star className="w-2.5 h-2.5 text-white fill-white" />
                            </div>
                        </div>
                        <button onClick={toggleDarkMode} className={cn("p-2 rounded-lg", darkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600")}>
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button onClick={() => setShowQAStats(true)} className={cn("p-2 rounded-lg", darkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600")} title="QA Statistics">
                            <BarChart2 className="w-5 h-5" />
                        </button>
                        <button onClick={onOpenSettings} className={cn("p-2 rounded-lg", darkMode ? "hover:bg-slate-700 text-slate-300" : "hover:bg-slate-100 text-slate-600")}>
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Daily Challenge Banner */}
                {todaysChallenge && (
                    <div className="mb-8">
                        <div className={cn(
                            "rounded-2xl p-1",
                            darkMode ? "bg-gradient-to-r from-indigo-900 to-purple-900" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                        )}>
                            <div className={cn(
                                "rounded-xl p-4 flex items-center justify-between",
                                darkMode ? "bg-slate-900" : "bg-white"
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
                                        isChallengeCompleted ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")}>
                                        {isChallengeCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className={cn("font-bold text-lg", darkMode ? "text-white" : "text-slate-900")}>
                                            {isChallengeCompleted ? "Daily Challenge Completed" : "Daily Challenge Available"}
                                        </h3>
                                        <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>
                                            {isChallengeCompleted ? "Great job! Come back tomorrow." : `Earn +${todaysChallenge.xpReward} XP today!`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowChallengeModal(true)}
                                    className={cn(
                                        "px-6 py-2 rounded-lg font-bold transition-transform hover:scale-105",
                                        isChallengeCompleted
                                            ? (darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")
                                            : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                    )}
                                >
                                    {isChallengeCompleted ? "View Result" : "Start Challenge"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <h3 className={cn("text-lg font-bold mb-3", darkMode ? "text-slate-300" : "text-slate-600")}>Daily Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total XP', value: totalXP, icon: Star, color: 'text-amber-500' },
                        {
                            label: 'Day Streak',
                            value: progress.streak,
                            icon: Flame,
                            color: 'text-orange-500',
                            extraClass: 'animate-pulse drop-shadow-lg' // Flame animation
                        },
                        { label: 'Topics Done', value: completedTopics, icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Study Time', value: formatStudyTime(progress.studyTimeMinutes), icon: Clock, color: 'text-blue-500' }
                    ].map((stat, i) => (
                        <Card key={i} darkMode={darkMode} className="p-4">
                            <div className="flex items-center gap-3">
                                <stat.icon className={cn("w-6 h-6", stat.color, stat.extraClass)} />
                                <div className="min-w-0">
                                    <div className={cn("text-2xl font-bold truncate", darkMode ? "text-white" : "text-slate-800")}>{stat.value}</div>
                                    <div className={cn("text-xs truncate", darkMode ? "text-slate-400" : "text-slate-500")}>{stat.label}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Subjects Grid */}
                <h2 className={cn("text-xl font-bold mb-4", darkMode ? "text-white" : "text-slate-800")}>Your Subjects</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {Object.entries(subjects).map(([key, subject]) => {
                        const IconComponent = ICON_MAP[subject.icon] || BookOpen;
                        const subjectProgress = calculateSubjectProgress(key, progress.topics, subject.topics);

                        return (
                            <Card key={key} onClick={() => onSelectSubject(key)} darkMode={darkMode} glowColor={darkMode && subject.darkGlow} className="p-6 text-left group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br", subject.gradient)}>
                                        <IconComponent className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("font-bold text-lg", darkMode ? "text-white" : "text-slate-800")}>{subject.name}</h3>
                                        <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>{subject.topics.length} topics • {subjectProgress}% complete</p>
                                    </div>
                                    <ProgressRing progress={subjectProgress} size={50} strokeWidth={4} color={subject.color} showLabel={false} darkMode={darkMode} />
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Achievements */}
                <Card darkMode={darkMode} className="p-6">
                    <h3 className={cn("font-bold text-lg mb-4 flex items-center gap-2", darkMode ? "text-white" : "text-slate-800")}>
                        <Trophy className="w-5 h-5 text-amber-500" /> Achievements
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {allAchievements.map(a => (
                            <AchievementBadge key={a.id} achievement={a} unlocked={a.unlocked} darkMode={darkMode} />
                        ))}
                    </div>
                </Card>

                {/* Reviews Due Section */}
                {reviewsDue.length > 0 && (
                    <Card darkMode={darkMode} className="p-6 mb-8 mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={cn("font-bold text-lg flex items-center gap-2", darkMode ? "text-white" : "text-slate-800")}>
                                <Clock className="w-5 h-5 text-blue-500" />
                                Reviews Due
                            </h3>
                            <span className={cn("px-3 py-1 rounded-full text-sm font-bold", darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700")}>
                                {reviewsDue.length} {reviewsDue.length === 1 ? 'question' : 'questions'}
                            </span>
                        </div>
                        <p className={cn("text-sm mb-4", darkMode ? "text-slate-400" : "text-slate-600")}>
                            Review these questions to reinforce your learning
                        </p>
                        <button
                            className={cn("w-full px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all")}
                        >
                            Start Review Session
                        </button>
                    </Card>
                )}
            </main>

            {/* Gamification Overlays (WI-201, WI-202) */}
            <LevelUpModal
                level={useStudy().levelUpEvent?.level}
                onDismiss={useStudy().dismissLevelUp}
                darkMode={darkMode}
            />
            <AchievementToast
                achievements={useStudy().achievementEvent?.ids}
                onDismiss={useStudy().dismissAchievement}
                darkMode={darkMode}
            />
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                darkMode={darkMode}
            />

            {showChallengeModal && todaysChallenge && (
                <DailyChallengeModal
                    challenge={todaysChallenge}
                    darkMode={darkMode}
                    completed={isChallengeCompleted}
                    onComplete={handleChallengeComplete}
                    onClose={() => setShowChallengeModal(false)}
                />
            )}

            {showQAStats && (
                <QAStatsModal onClose={() => setShowQAStats(false)} darkMode={darkMode} />
            )}
        </div>
    );
});

export default Dashboard;
