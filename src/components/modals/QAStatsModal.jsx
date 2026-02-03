import React, { useState, useMemo } from 'react';
import { X, Clock, Target, Award, Hash, CheckCircle2, BarChart2, Calendar, BookOpen } from 'lucide-react';
import { cn } from '../../utils';
import { useStudy } from '../../contexts/StudyContext';

const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m`;
    }
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

const TabButton = ({ active, onClick, icon: Icon, label, darkMode }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            active
                ? (darkMode ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-900")
                : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
        )}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const ProgressBar = ({ value, color, height = "h-2" }) => (
    <div className={`w-full ${height} bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

const QAStatsModal = ({ onClose, darkMode }) => {
    const { progress, subjects } = useStudy();
    const [activeTab, setActiveTab] = useState('overview');

    // Safe access to stats
    const globalStats = progress.stats || { totalQuestions: 0, totalCorrect: 0, totalTimeSeconds: 0 };
    const subjectStats = progress.subjectStats || {};
    const dailyStats = progress.dailyStats || {};

    // Derived Global Metrics
    const globalAccuracy = globalStats.totalQuestions > 0
        ? (globalStats.totalCorrect / globalStats.totalQuestions) * 100
        : 0;
    const globalAvgTime = globalStats.totalQuestions > 0
        ? globalStats.totalTimeSeconds / globalStats.totalQuestions
        : 0;

    // Derived Weekly Data (Last 7 Days)
    const weeklyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const stat = dailyStats[key] || { questions: 0 };
            days.push({
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: key,
                value: stat.questions
            });
        }
        return days;
    }, [dailyStats]);

    const maxDailyQuestions = Math.max(...weeklyData.map(d => d.value), 10); // Scale max

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className={cn("w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", darkMode ? "bg-slate-900 border border-slate-700 text-white" : "bg-white text-slate-800")}>

                {/* Header */}
                <div className={cn("p-6 border-b flex items-center justify-between", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Award className="w-6 h-6 text-amber-500" />
                        QA Statistics
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className={cn("flex items-center gap-2 p-4 border-b", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={BarChart2} label="Overview" darkMode={darkMode} />
                    <TabButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={BookOpen} label="By Subject" darkMode={darkMode} />
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={Calendar} label="History" darkMode={darkMode} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={cn("p-4 rounded-xl text-center", darkMode ? "bg-slate-800 host-slate-700" : "bg-slate-50")}>
                                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                    <div className="text-xl font-bold">{formatTime(globalAvgTime)}</div>
                                    <div className="text-xs opacity-70">Avg Time</div>
                                </div>
                                <div className={cn("p-4 rounded-xl text-center", darkMode ? "bg-slate-800" : "bg-slate-50")}>
                                    <Target className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                                    <div className="text-xl font-bold">{Math.round(globalAccuracy)}%</div>
                                    <div className="text-xs opacity-70">Accuracy</div>
                                </div>
                                <div className={cn("p-4 rounded-xl text-center", darkMode ? "bg-slate-800" : "bg-slate-50")}>
                                    <Hash className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                    <div className="text-xl font-bold">{globalStats.totalQuestions}</div>
                                    <div className="text-xs opacity-70">Answered</div>
                                </div>
                                <div className={cn("p-4 rounded-xl text-center", darkMode ? "bg-slate-800" : "bg-slate-50")}>
                                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                                    <div className="text-xl font-bold">{globalStats.totalCorrect}</div>
                                    <div className="text-xs opacity-70">Correct</div>
                                </div>
                            </div>

                            {/* Activity Chart Mini */}
                            <div className={cn("p-6 rounded-2xl border", darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    Activity (Last 7 Days)
                                </h3>
                                <div className="flex items-end justify-between h-32 gap-2">
                                    {weeklyData.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="w-full relative flex-1 flex items-end">
                                                <div
                                                    className="w-full bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                                                    style={{ height: `${(d.value / maxDailyQuestions) * 100}%` }}
                                                />
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {d.value} Qs
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono opacity-50">{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBJECTS TAB */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-4">
                            {Object.keys(subjects).map(key => {
                                const stat = subjectStats[key] || { questions: 0, correct: 0, time: 0 };
                                const acc = stat.questions > 0 ? (stat.correct / stat.questions) * 100 : 0;
                                const subjectConfig = subjects[key];

                                return (
                                    <div key={key} className={cn("p-4 rounded-xl border", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", subjectConfig.gradient)}>
                                                {/* Requires Icon mapping, simplified here */}
                                                <Target className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold">{subjectConfig.name}</h4>
                                                <p className="text-xs opacity-60">{stat.questions} Questions Answered</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{Math.round(acc)}%</div>
                                                <div className="text-xs opacity-60">Accuracy</div>
                                            </div>
                                        </div>
                                        <ProgressBar value={acc} color={`bg-gradient-to-r ${subjectConfig.gradient}`} />

                                        {/* Topic Breakdown */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                            <h5 className="text-xs font-bold uppercase opacity-50 mb-2">Topic Breakdown</h5>
                                            {subjectConfig.topics.map(topic => {
                                                const tStat = progress.topicStats?.[topic.id] || { questions: 0, correct: 0 };
                                                const tAcc = tStat.questions > 0 ? (tStat.correct / tStat.questions) * 100 : 0;

                                                if (!tStat.questions) return null; // Skip unused topics to save space

                                                return (
                                                    <div key={topic.id} className="flex items-center justify-between text-sm group">
                                                        <span className={cn("font-medium", darkMode ? "text-slate-300" : "text-slate-600")}>{topic.name}</span>
                                                        <div className="flex items-center gap-4 text-xs font-mono">
                                                            <span className={darkMode ? "text-slate-500" : "text-slate-400"}>{tStat.questions} Qs</span>
                                                            <span className={cn(
                                                                "px-1.5 py-0.5 rounded",
                                                                tAcc >= 80 ? "bg-emerald-100 text-emerald-700" : tAcc >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                            )}>
                                                                {Math.round(tAcc)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {subjectConfig.topics.every(t => !progress.topicStats?.[t.id]?.questions) && (
                                                <p className="text-xs italic opacity-40">No topics practiced yet.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {Object.keys(subjects).length === 0 && (
                                <p className="text-center italic opacity-50 py-8">No subjects data found.</p>
                            )}
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div className={cn("p-6 rounded-2xl border", darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
                                <h3 className="font-bold mb-6">Daily Performance</h3>
                                <div className="space-y-4">
                                    {weeklyData.slice().reverse().map((d, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-mono opacity-70">{d.date}</div>
                                            <div className="flex-1">
                                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${(d.value / maxDailyQuestions) * 100}%` }} />
                                                </div>
                                            </div>
                                            <div className="w-12 text-sm font-bold text-right">{d.value} Qs</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QAStatsModal;
