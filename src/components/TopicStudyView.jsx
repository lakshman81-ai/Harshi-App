import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Star, ChevronLeft, FileText, HelpCircle, ClipboardList, Check, StickyNote, Target, Lightbulb, AlertTriangle, Globe, FlaskConical, ChevronRight, Bookmark, Copy, Clock, ArrowDown } from 'lucide-react';
import { useStudy } from '../contexts/StudyContext';
import { cn } from '../utils';
import { Logger } from '../services/Logger';
import { ICON_MAP } from '../constants';
import NotesEditor from './NotesEditor';
import QuizSection from './QuizSection';
import HandoutInline from './HandoutInline';
import MathFormula from './MathFormula';
import { selectQuestions } from '../utils/AdaptiveEngine';
import GraphExplorer from './interactive/GraphExplorer';
import InteractiveSVG from './interactive/InteractiveSVG';

const TopicStudyView = memo(({ subject, topicIndex, onBack, onOpenSettings }) => {
    const { progress, subjects, sections, objectives, keyTerms, studyContent, formulas, quizQuestions, updateProgress, settings } = useStudy();
    const darkMode = settings.darkMode;

    const config = subjects[subject];
    const topic = config.topics[topicIndex];
    const topicKey = topic.id;
    const IconComponent = ICON_MAP[config.icon] || BookOpen;

    // Get data for this topic
    const topicSections = sections[topicKey] || [];
    const topicObjectives = objectives[topicKey] || [];
    const topicTerms = keyTerms[topicKey] || [];
    const topicFormulas = formulas[topicKey] || [];

    // Memoize topicQuizzes to prevent unnecessary re-renders and ESLint warnings
    const topicQuizzes = useMemo(() => quizQuestions[topicKey] || [], [quizQuestions, topicKey]);

    // State
    const [activeTab, setActiveTab] = useState('study'); // 'study' | 'quiz' | 'handout'
    const [activeSection, setActiveSection] = useState(0);
    const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
    const [isAtBottom, setIsAtBottom] = useState(false);

    const contentRef = useRef(null);

    // Reset scroll state when section changes
    useEffect(() => {
        setIsAtBottom(false);
        // Check if content is already short enough to not scroll
        if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current;
            if (scrollHeight <= clientHeight + 50) {
                setIsAtBottom(true);
            }
        }
    }, [activeSection, activeTab]);

    // Track time on page
    useEffect(() => {
        const startTime = Date.now();
        Logger.action('Navigation', `Started studying topic: ${topic.name}`, { subject: config.name });

        const interval = setInterval(() => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            if (duration > 300) { // Log if user is on the page for > 5 minutes
                Logger.action('Time on Page', `User spent > 5 mins on ${topic.name}`, { duration });
                clearInterval(interval); // Log once
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [topic.name, config.name]);

    useEffect(() => {
        Logger.info(`Switched to tab: ${activeTab}`, { topic: topic.name });
    }, [activeTab, topic.name]);
    const [showNotes, setShowNotes] = useState(false);
    const [copied, setCopied] = useState(false);
    const [xpGain, setXpGain] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [quickMode, setQuickMode] = useState(false); // WI-102

    const currentSection = topicSections[activeSection];
    const sectionContent = currentSection ? (studyContent[currentSection.id] || []) : [];

    const progressPercent = progress.topics[topicKey]?.progress || 0;
    const bookmarked = progress.bookmarks.filter(b => b.startsWith(topicKey));

    const copyFormula = (text) => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSectionComplete = (sectionIndex) => {
        const currentProgress = progress.topics[topicKey]?.progress || 0;
        const newProgress = Math.min(100, Math.round(((sectionIndex + 1) / topicSections.length) * 100));

        if (newProgress > currentProgress) {
            const xpEarned = 10;
            setXpGain(xpEarned);

            const newAchievements = [...progress.achievements];
            if (newProgress === 100 && !newAchievements.includes('topic-complete')) {
                newAchievements.push('topic-complete');
            }

            updateProgress({
                xp: progress.xp + xpEarned,
                topics: { [topicKey]: { progress: newProgress, xp: (progress.topics[topicKey]?.xp || 0) + xpEarned, lastAccessed: new Date().toISOString() } },
                studyTimeMinutes: progress.studyTimeMinutes + 2,
                achievements: newAchievements
            });

            setTimeout(() => setXpGain(null), 1500);
        }
    };

    const handleQuizComplete = (score, earnedXp, results) => {
        setXpGain(earnedXp);
        Logger.action('Quiz Completed', `Score: ${score}, XP: ${earnedXp}`, { results: results.length });

        // Calculate aggregations
        const quizCount = results.length;
        const correctCount = results.filter(r => r.isCorrect).length;
        const totalTime = results.reduce((acc, r) => acc + (r.timeSpent || 0), 0);
        const todayKey = new Date().toISOString().split('T')[0];

        // Helper to update a stat object
        const updateGranular = (prev) => ({
            questions: (prev?.questions || 0) + quizCount,
            correct: (prev?.correct || 0) + correctCount,
            time: (prev?.time || 0) + totalTime
        });

        // Prepare updates
        const oldStats = progress.stats || { totalQuestions: 0, totalCorrect: 0, totalTimeSeconds: 0 };
        const newGlobalStats = {
            totalQuestions: oldStats.totalQuestions + quizCount,
            totalCorrect: oldStats.totalCorrect + correctCount,
            totalTimeSeconds: oldStats.totalTimeSeconds + totalTime
        };

        const newDailyStats = { ...progress.dailyStats, [todayKey]: updateGranular(progress.dailyStats?.[todayKey]) };
        const newTopicStats = { ...progress.topicStats, [topicKey]: updateGranular(progress.topicStats?.[topicKey]) };
        const newSubjectStats = { ...progress.subjectStats, [subject]: updateGranular(progress.subjectStats?.[subject]) };

        // Update Topic Mastery
        const currentMastery = progress.topicMastery?.[topicKey] || { score: 0, history: [] };
        // Simple moving average for mastery score update
        // New Score = (Old Score * 0.7) + (Quiz Score * 0.3)
        const newMasteryScore = Math.round((currentMastery.score * 0.7) + (score * 0.3));

        const newTopicMastery = {
            ...(progress.topicMastery || {}),
            [topicKey]: {
                score: newMasteryScore,
                history: [...(currentMastery.history || []), score].slice(-5), // Keep last 5
                level: newMasteryScore < 30 ? 'easy' : newMasteryScore < 70 ? 'medium' : 'hard'
            }
        };

        updateProgress({
            xp: progress.xp + earnedXp,
            stats: newGlobalStats,
            dailyStats: newDailyStats,
            topicStats: newTopicStats,
            subjectStats: newSubjectStats,
            topicMastery: newTopicMastery,
            topics: { [topicKey]: { ...progress.topics[topicKey], quizScore: score, lastAccessed: new Date().toISOString() } }
        });
        setTimeout(() => setXpGain(null), 2000);
    };

    // Initialize adaptive questions when entering quiz tab or quick mode
    useEffect(() => {
        if ((activeTab === 'quiz' || quickMode) && topicQuizzes.length > 0) {
            const masteryScore = progress.topicMastery?.[topicKey]?.score || 0;
            const selected = selectQuestions([...topicQuizzes], masteryScore);
            setAdaptiveQuestions(selected);
        }
    }, [activeTab, quickMode, topicQuizzes, topicKey, progress.topicMastery]);

    const handleUseHint = (cost) => {
        updateProgress({ xp: Math.max(0, progress.xp - cost) });
    };

    const toggleBookmark = (sectionId) => {
        const key = `${topicKey}-${sectionId}`;
        const newBookmarks = progress.bookmarks.includes(key)
            ? progress.bookmarks.filter(b => b !== key)
            : [...progress.bookmarks, key];
        updateProgress({ bookmarks: newBookmarks });
    };

    const tabs = [
        { id: 'study', label: 'Study Guide', icon: BookOpen },
        { id: 'quiz', label: 'Quiz', icon: HelpCircle },
        { id: 'handout', label: 'Handout', icon: ClipboardList }
    ];

    return (
        <div className={cn("min-h-screen flex flex-col", darkMode ? "bg-slate-900" : "bg-slate-50")}>
            {/* Image Modal */}
            {enlargedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEnlargedImage(null)}>
                    <img
                        src={enlargedImage}
                        alt="Enlarged view"
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                    />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                        <span className="sr-only">Close</span>
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* XP Animation */}
            {xpGain && (
                <div className="fixed top-20 right-8 z-50 animate-bounce">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
                        <Star className="w-5 h-5" />+{xpGain} XP
                    </div>
                </div>
            )}

            {/* Header with Topic Info & Tabs */}
            <header className={cn("border-b", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    {/* Top Section */}
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className={cn("flex items-center gap-2 text-sm font-medium", darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-800")}>
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", config.gradient)}>
                                    <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>{topic.name}</h1>
                                    <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-500")}>{config.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Progress Badge */}
                            <div className={cn("hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-sm", darkMode ? "bg-slate-700" : "bg-slate-100")}>
                                <div className={cn("w-2 h-2 rounded-full", progressPercent === 100 ? "bg-emerald-500" : "bg-amber-500")} />
                                <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{progressPercent}%</span>
                            </div>
                            <button onClick={() => currentSection && toggleBookmark(currentSection.id)} className={cn("p-2 rounded-lg", bookmarked.includes(`${topicKey}-${currentSection?.id}`) ? "bg-amber-100 text-amber-600" : darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                                <Bookmark className="w-5 h-5" />
                            </button>
                            <button onClick={() => setShowNotes(!showNotes)} className={cn("p-2 rounded-lg", showNotes ? "bg-blue-100 text-blue-600" : darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                                <StickyNote className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-px">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 sm:px-6 py-3 font-medium border-b-2 transition-all whitespace-nowrap",
                                    activeTab === tab.id ? "border-current" : cn("border-transparent", darkMode ? "text-slate-400" : "text-slate-500")
                                )}
                                style={activeTab === tab.id ? { borderColor: config.color, color: config.color } : {}}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Study Button (WI-102) */}
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => { setActiveTab('quiz'); setQuickMode(true); }}
                            className={cn("text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1", darkMode ? "border-amber-700 text-amber-500 hover:bg-amber-900/30" : "border-amber-200 text-amber-700 hover:bg-amber-50")}
                            title="Take a 5-question bite-sized quiz"
                        >
                            <Clock className="w-3 h-3" /> Quick Study
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex">
                {activeTab === 'study' && (
                    <>
                        <aside className={cn("hidden lg:flex w-72 flex-col border-r", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                            {/* Progress */}
                            <div className={cn("p-4 border-b", darkMode ? "border-slate-700" : "border-slate-200")}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn("text-sm font-medium", darkMode ? "text-slate-400" : "text-slate-600")}>Progress</span>
                                    <span className="text-sm font-bold" style={{ color: config.color }}>{progressPercent}%</span>
                                </div>
                                <div className={cn("w-full h-2 rounded-full overflow-hidden", darkMode ? "bg-slate-700" : "bg-slate-100")}>
                                    <div className={cn("h-full rounded-full transition-all bg-gradient-to-r", config.gradient)} style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>

                            {/* Sections */}
                            <nav className="flex-1 overflow-y-auto p-4">
                                <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3", darkMode ? "text-slate-500" : "text-slate-400")}>Outline</h3>
                                <div className="space-y-1">
                                    {topicSections.filter(section => section.type !== 'quiz').map((section, i) => {
                                        const originalIndex = topicSections.findIndex(s => s.id === section.id);
                                        const isCompleted = originalIndex < Math.floor((progressPercent / 100) * topicSections.length);
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => setActiveSection(originalIndex)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                                    activeSection === originalIndex ? cn("bg-gradient-to-r text-white shadow-lg", config.gradient)
                                                        : isCompleted ? darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                                            : darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                                                )}
                                            >
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", activeSection === originalIndex ? "bg-white/20" : isCompleted ? "bg-emerald-500 text-white" : darkMode ? "border-2 border-slate-600" : "border-2 border-slate-300")}>
                                                    {isCompleted && activeSection !== originalIndex ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                                </div>
                                                <span className="font-medium text-sm flex-1">{section.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </nav>

                            {/* XP Earned */}
                            <div className={cn("p-4 border-t", darkMode ? "border-slate-700" : "border-slate-200")}>
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", darkMode ? "bg-amber-900/50" : "bg-amber-100")}>
                                        <Star className={cn("w-5 h-5", darkMode ? "text-amber-400" : "text-amber-600")} />
                                    </div>
                                    <div>
                                        <p className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>+{progress.topics[topicKey]?.xp || 0} XP</p>
                                        <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>Earned this topic</p>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 flex flex-col">
                            {/* Section Title */}
                            <div className={cn("px-4 sm:px-8 py-4 border-b", darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/50 border-slate-200")}>
                                <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-800")}>{currentSection?.title}</h2>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                                <div className="max-w-prose mx-auto">


                                    {/* Objectives Section */}
                                    {currentSection?.title?.toLowerCase() === 'objectives' && (
                                        <div className="mb-8">
                                            <div className={cn("p-6 rounded-2xl border", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                                <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", darkMode ? "text-blue-400" : "text-blue-600")}>
                                                    <Target className="w-5 h-5" /> Learning Objectives
                                                </h3>
                                                {topicObjectives.length > 0 ? (
                                                    <ul className="space-y-4">
                                                        {topicObjectives.map((obj, i) => (
                                                            <li key={i} className="flex gap-4">
                                                                <span className={cn(
                                                                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                                    darkMode ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-600"
                                                                )}>
                                                                    {i + 1}
                                                                </span>
                                                                <p className={cn("pt-1", darkMode ? "text-slate-300" : "text-slate-700")}>{obj.text}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className={cn("text-center italic py-4", darkMode ? "text-slate-500" : "text-slate-400")}>
                                                        Objectives are being finalized.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Sections */}
                                    {(currentSection?.type === 'content' || currentSection?.type === 'intro' || currentSection?.type === 'applications') && (
                                        <>
                                            {sectionContent.map((content, i) => (
                                                <div key={content.id || i} className="mb-6">
                                                    {content.type === 'introduction' && (
                                                        <p className={cn("text-lg leading-relaxed", darkMode ? "text-slate-300" : "text-slate-600")}>{content.text}</p>
                                                    )}

                                                    {/* Content Image */}
                                                    {content.imageUrl && (
                                                        <div className="mb-6">
                                                            <div
                                                                className="w-full sm:w-1/2 max-w-sm rounded-2xl shadow-md mb-2 overflow-hidden cursor-zoom-in group relative"
                                                                onClick={() => setEnlargedImage(content.imageUrl)}
                                                            >
                                                                <img
                                                                    src={content.imageUrl}
                                                                    alt={content.title || "Study image"}
                                                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                                    <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs px-2 py-1 rounded">Click to enlarge</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Interactive Handouts */}
                                                    {content.type === 'interactive_graph' && (
                                                        <div className="mb-8">
                                                            <GraphExplorer
                                                                initialFormula={content.interactiveData?.formula || "x^2"}
                                                                darkMode={darkMode}
                                                            />
                                                        </div>
                                                    )}

                                                    {content.type === 'interactive_diagram' && (
                                                        <div className="mb-8">
                                                            <InteractiveSVG
                                                                svgUrl={content.imageUrl || content.interactiveData?.svgUrl}
                                                                regions={content.interactiveData?.regions || []}
                                                                darkMode={darkMode}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Content Video */}
                                                    {content.videoUrl && (
                                                        <div className="mb-6">
                                                            <a
                                                                href={content.videoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:shadow-md",
                                                                    darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-blue-400" : "bg-white border-slate-200 hover:bg-slate-50 text-blue-600"
                                                                )}
                                                            >
                                                                <span className="p-2 rounded-full bg-red-100 text-red-600">
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                                                                </span>
                                                                <div>
                                                                    <div className="font-medium">Watch Video</div>
                                                                    <div className="text-sm opacity-80 truncate max-w-xs">{content.title || "External Resource"}</div>
                                                                </div>
                                                                <Globe className="w-4 h-4 ml-2 opacity-50" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {content.type === 'formula' && (
                                                        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                                                            <div className="relative">
                                                                <p className="text-blue-300 text-sm font-medium mb-2">{content.title}</p>
                                                                <div className="flex items-center justify-center gap-4 mb-4">
                                                                    <MathFormula
                                                                        formula={content.text}
                                                                        size="large"
                                                                        className="text-white"
                                                                    />
                                                                </div>
                                                                {topicFormulas[0]?.variables && (
                                                                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                                                                        {topicFormulas[0].variables.map((v, j) => (
                                                                            <div key={j}>
                                                                                <MathFormula
                                                                                    formula={v.symbol}
                                                                                    size="medium"
                                                                                    className={cn(j === 0 ? "text-blue-400" : j === 1 ? "text-emerald-400" : "text-amber-400")}
                                                                                />
                                                                                <div className="text-sm text-slate-400">{v.name} ({v.unit})</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <button onClick={() => copyFormula(content.text)} className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm">
                                                                    <Copy className="w-4 h-4" />{copied ? 'Copied!' : 'Copy equation'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {content.type === 'concept_helper' && (
                                                        <div className={cn("rounded-2xl p-5 border-l-4", darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-500")}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Lightbulb className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")} />
                                                                <span className={cn("font-bold", darkMode ? "text-blue-300" : "text-blue-800")}>{content.title}</span>
                                                            </div>
                                                            <p className={darkMode ? "text-blue-200" : "text-blue-900"}>{content.text}</p>
                                                        </div>
                                                    )}

                                                    {content.type === 'warning' && (
                                                        <div className={cn("rounded-2xl p-5 border-l-4", darkMode ? "bg-red-900/30 border-red-500" : "bg-red-50 border-red-500")}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertTriangle className={cn("w-5 h-5", darkMode ? "text-red-400" : "text-red-600")} />
                                                                <span className={cn("font-bold", darkMode ? "text-red-300" : "text-red-800")}>{content.title}</span>
                                                            </div>
                                                            <p className={darkMode ? "text-red-200" : "text-red-900"}>{content.text}</p>
                                                        </div>
                                                    )}

                                                    {content.type === 'real_world' && (
                                                        <div className={cn("rounded-2xl p-5 border-l-4", darkMode ? "bg-emerald-900/30 border-emerald-500" : "bg-emerald-50 border-emerald-500")}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Globe className={cn("w-5 h-5", darkMode ? "text-emerald-400" : "text-emerald-600")} />
                                                                <span className={cn("font-bold", darkMode ? "text-emerald-300" : "text-emerald-800")}>{content.title}</span>
                                                            </div>
                                                            <p className={darkMode ? "text-emerald-200" : "text-emerald-900"}>{content.text}</p>
                                                        </div>
                                                    )}

                                                    {content.type === 'image' && (
                                                        <div className="mb-6">
                                                            <img
                                                                src={content.text.startsWith('http') ? content.text : content.url || content.text}
                                                                alt={content.title}
                                                                className="w-full rounded-2xl shadow-md mb-2 object-cover max-h-96"
                                                            />
                                                            {content.title && (
                                                                <p className={cn("text-sm text-center italic", darkMode ? "text-slate-400" : "text-slate-500")}>{content.title}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {content.type === 'video' && (
                                                        <div className="mb-6">
                                                            <a
                                                                href={content.text.startsWith('http') ? content.text : content.url || content.text}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition-all hover:shadow-md",
                                                                    darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-blue-400" : "bg-white border-slate-200 hover:bg-slate-50 text-blue-600"
                                                                )}
                                                            >
                                                                <span className="p-2 rounded-full bg-red-100 text-red-600">
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                                                                </span>
                                                                <div>
                                                                    <div className="font-medium">Watch Video</div>
                                                                    <div className="text-sm opacity-80 truncate max-w-xs">{content.title || "External Resource"}</div>
                                                                </div>
                                                                <Globe className="w-4 h-4 ml-2 opacity-50" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {content.type === 'example' && (
                                                        <div className={cn("rounded-2xl p-6 border mb-6", darkMode ? "bg-amber-900/20 border-amber-700" : "bg-amber-50 border-amber-200")}>
                                                            <h4 className={cn("font-bold mb-2 flex items-center gap-2", darkMode ? "text-amber-400" : "text-amber-700")}>
                                                                <FlaskConical className="w-5 h-5" /> Example Problem
                                                            </h4>
                                                            <div className={cn("font-medium mb-2", darkMode ? "text-slate-300" : "text-slate-700")}>{content.title}</div>
                                                            <div className={cn("text-sm font-mono p-4 rounded-xl", darkMode ? "bg-slate-900 text-amber-300" : "bg-white text-amber-800 border border-amber-100")}>
                                                                {content.text}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {sectionContent.length === 0 && (
                                                <div className={cn("text-center py-12", darkMode ? "text-slate-400" : "text-slate-500")}>
                                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p>Content for this section is being prepared.</p>
                                                    <p className="text-sm mt-2">Update your Google Sheet to add content!</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Navigation */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                                            disabled={activeSection === 0}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                                                activeSection === 0
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                                    : "bg-slate-300 text-slate-800 hover:bg-slate-400 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                                            )}
                                        >
                                            <ChevronLeft className="w-5 h-5" />Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {topicSections.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-all",
                                                        i === activeSection
                                                            ? darkMode
                                                                ? cn("bg-gradient-to-r", config.gradient) // Gradient fine in dark mode
                                                                : "bg-slate-800 scale-125" // Solid dark for selected in light mode
                                                            : i < activeSection
                                                                ? "bg-emerald-500"
                                                                : darkMode ? "bg-slate-600" : "bg-slate-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => {
                                                // Intelligent Navigation: Scroll first, then Next
                                                if (!isAtBottom) {
                                                    contentRef.current?.scrollBy({ top: 400, behavior: 'smooth' });
                                                    // Note: isAtBottom will update via onScroll
                                                } else {
                                                    handleSectionComplete(activeSection);
                                                    setActiveSection(Math.min(topicSections.length - 1, activeSection + 1));
                                                    // Reset scroll to top for new section
                                                    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                                                }
                                            }}
                                            disabled={activeSection === topicSections.length - 1 && isAtBottom}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                                                (activeSection === topicSections.length - 1 && isAtBottom)
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                                    : darkMode
                                                        ? cn("bg-gradient-to-r text-white shadow-lg hover:shadow-xl", config.gradient)
                                                        : "bg-slate-800 text-white shadow-lg hover:bg-slate-700" // Solid dark for light mode High Contrast
                                            )}
                                        >
                                            {isAtBottom ? "Next" : "Continue"} {isAtBottom ? <ChevronRight className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 rotate-90" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Panel */}
                            {showNotes && (
                                <div className={cn("border-t p-4", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                    <div className="max-w-prose mx-auto">
                                        <h3 className={cn("font-bold mb-3 flex items-center gap-2", darkMode ? "text-white" : "text-slate-800")}>
                                            <StickyNote className="w-5 h-5 text-amber-500" />Your Notes
                                        </h3>
                                        <NotesEditor topicId={topicKey} darkMode={darkMode} />
                                    </div>
                                </div>
                            )}
                        </main>

                        {/* Key Terms Sidebar */}
                        <aside className={cn("hidden xl:block w-72 border-l p-4 overflow-y-auto", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                            <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", darkMode ? "text-slate-500" : "text-slate-400")}>
                                <BookOpen className="w-4 h-4" />Key Terms
                            </h3>
                            <div className="space-y-2">
                                {topicTerms.map((item, i) => (
                                    <div key={item.id || i} className={cn("rounded-xl p-3", darkMode ? "bg-slate-700" : "bg-slate-50")}>
                                        <p className={cn("font-bold text-sm", darkMode ? "text-white" : "text-slate-800")}>{item.term}</p>
                                        <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>{item.definition}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Bookmarks */}
                            <h3 className={cn("text-xs font-bold uppercase tracking-wider mt-6 mb-3 flex items-center gap-2", darkMode ? "text-slate-500" : "text-slate-400")}>
                                <Bookmark className="w-4 h-4" />Bookmarks
                            </h3>
                            {bookmarked.length > 0 ? (
                                <div className="space-y-2">
                                    {bookmarked.map((b, i) => {
                                        const sectionId = b.split('-').pop();
                                        const section = topicSections.find(s => s.id === sectionId);
                                        return (
                                            <button key={i} onClick={() => setActiveSection(topicSections.findIndex(s => s.id === sectionId))} className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left", darkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50" : "bg-amber-50 text-amber-800 hover:bg-amber-100")}>
                                                <Bookmark className="w-4 h-4 text-amber-500" />
                                                <span className="truncate">{section?.title || sectionId}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={cn("text-sm", darkMode ? "text-slate-500" : "text-slate-400")}>No bookmarks yet</p>
                            )}
                        </aside>
                    </>
                )
                }

                {/* Quiz Tab */}
                {
                    activeTab === 'quiz' && (
                        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                            <div className="max-w-3xl mx-auto">
                                <QuizSection
                                    questions={adaptiveQuestions.length > 0 ? adaptiveQuestions : topicQuizzes}
                                    darkMode={darkMode}
                                    subjectConfig={config}
                                    topicId={topicKey}
                                    allowHints={true}
                                    hintCost={5}
                                    userXp={progress.xp}
                                    onUseHint={handleUseHint}
                                    showDifficultyFilter={!quickMode && adaptiveQuestions.length === 0} // Hide filter if adaptive
                                    quickMode={quickMode}
                                    onComplete={(score, earnedXp, results) => {
                                        handleQuizComplete(score, earnedXp, results);
                                        setQuickMode(false); // Reset after completion
                                    }}
                                />
                            </div>
                        </main>
                    )
                }

                {/* Handout Tab */}
                {
                    activeTab === 'handout' && (
                        <main className="flex-1 overflow-y-auto">
                            <HandoutInline
                                subject={config}
                                topic={topic}
                                objectives={topicObjectives}
                                terms={topicTerms}
                                formulas={topicFormulas}
                                sections={topicSections}
                                studyContent={studyContent}
                                quizQuestions={topicQuizzes}
                                darkMode={darkMode}
                            />
                        </main>
                    )
                }
            </div>
        </div>
    );
});

export default TopicStudyView;
