import React, { memo, useState, useMemo } from 'react';
import { BookOpen, FileText, HelpCircle, Settings, ChevronLeft, CheckCircle2, Circle, CircleDot, Clock, ChevronRight, Check, Search, X, Hash, Variable } from 'lucide-react';
import { useStudy } from '../contexts/StudyContext';
import { cn } from '../utils';
import { ICON_MAP, calculateSubjectProgress } from '../constants';
import { Card, ProgressRing } from './common/UIComponents';

const SubjectOverview = memo(({ subject, onBack, onSelectTopic, onOpenSettings }) => {
    const { progress, subjects, sections, keyTerms, studyContent, quizQuestions, settings } = useStudy();
    const darkMode = settings.darkMode;
    const [activeTab, setActiveTab] = useState('topics');
    const [searchQuery, setSearchQuery] = useState('');

    const config = subjects[subject];
    const IconComponent = ICON_MAP[config.icon] || BookOpen;
    const subjectProgress = calculateSubjectProgress(subject, progress.topics, config.topics);
    const completedCount = config.topics.filter(t => progress.topics[t.id]?.progress === 100).length;

    // Enhanced search that searches across all content within the subject
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return { topics: config.topics, matches: [] };
        }

        const query = searchQuery.toLowerCase().trim();
        const topicMatches = new Map(); // topicId -> { topic, matchTypes: Set, matchDetails: [] }

        // Helper to add a match
        const addMatch = (topicId, matchType, matchText, context = '') => {
            if (!topicMatches.has(topicId)) {
                const topic = config.topics.find(t => t.id === topicId);
                if (!topic) return;
                topicMatches.set(topicId, {
                    topic,
                    matchTypes: new Set(),
                    matchDetails: []
                });
            }
            const match = topicMatches.get(topicId);
            match.matchTypes.add(matchType);
            match.matchDetails.push({ type: matchType, text: matchText, context });
        };

        // Search topic names
        config.topics.forEach(topic => {
            if (topic.name.toLowerCase().includes(query)) {
                addMatch(topic.id, 'topic', topic.name);
            }
        });

        // Search study content for each topic
        config.topics.forEach(topic => {
            const topicSections = sections[topic.id] || [];
            topicSections.forEach(section => {
                const sectionContents = studyContent[section.id] || [];
                sectionContents.forEach(content => {
                    const textToSearch = [content.title, content.text].filter(Boolean).join(' ').toLowerCase();
                    if (textToSearch.includes(query)) {
                        const matchedText = content.title || content.text?.substring(0, 60) + '...';
                        addMatch(topic.id, 'content', matchedText, section.title);
                    }
                });
            });
        });

        // Search key terms
        config.topics.forEach(topic => {
            const terms = keyTerms[topic.id] || [];
            terms.forEach(term => {
                const textToSearch = [term.term, term.definition].filter(Boolean).join(' ').toLowerCase();
                if (textToSearch.includes(query)) {
                    addMatch(topic.id, 'term', term.term, term.definition?.substring(0, 50));
                }
            });
        });

        // Search quiz questions
        config.topics.forEach(topic => {
            const questions = quizQuestions[topic.id] || [];
            questions.forEach(q => {
                const textToSearch = [q.question, ...q.options.map(o => o.text)].filter(Boolean).join(' ').toLowerCase();
                if (textToSearch.includes(query)) {
                    addMatch(topic.id, 'quiz', q.question?.substring(0, 60) + '...');
                }
            });
        });

        // Convert to array and sort by number of match types (more diverse matches first)
        const matchedTopics = Array.from(topicMatches.values())
            .sort((a, b) => b.matchTypes.size - a.matchTypes.size);

        return {
            topics: matchedTopics.map(m => m.topic),
            matches: matchedTopics
        };
    }, [searchQuery, config.topics, sections, studyContent, keyTerms, quizQuestions]);

    const filteredTopics = searchResults.topics;
    const hasSearchResults = searchQuery.trim() && searchResults.matches.length > 0;

    // Get match type icon
    const getMatchIcon = (type) => {
        switch (type) {
            case 'topic': return FileText;
            case 'content': return BookOpen;
            case 'term': return Variable;
            case 'quiz': return HelpCircle;
            default: return Hash;
        }
    };

    // Get match type label
    const getMatchLabel = (type) => {
        switch (type) {
            case 'topic': return 'Topic Name';
            case 'content': return 'Study Content';
            case 'term': return 'Key Term';
            case 'quiz': return 'Quiz Question';
            default: return type;
        }
    };

    return (
        <div className={cn("min-h-screen", darkMode ? "bg-slate-900" : "bg-slate-50")}>
            {/* Hero Header */}
            <div className={cn("bg-gradient-to-br text-white", config.gradient)}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white">
                            <ChevronLeft className="w-5 h-5" /><span className="font-medium">Dashboard</span>
                        </button>
                        <button onClick={onOpenSettings} className="p-2 hover:bg-white/20 rounded-xl"><Settings className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <IconComponent className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-1">{config.name}</h1>
                            <p className="text-white/80">{completedCount} of {config.topics.length} topics completed</p>
                        </div>
                        <div className="hidden sm:block">
                            <ProgressRing progress={subjectProgress} size={80} strokeWidth={6} color="white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className={cn("border-b sticky top-0 z-10", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 sm:py-0">
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {[{ id: 'topics', label: 'Topics', icon: FileText }].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all",
                                        activeTab === tab.id ? "border-current" : cn("border-transparent", darkMode ? "text-slate-400" : "text-slate-500")
                                    )}
                                    style={activeTab === tab.id ? { borderColor: config.color, color: config.color } : {}}
                                >
                                    <tab.icon className="w-5 h-5" />{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Enhanced Search Bar */}
                        <div className="relative py-2 sm:py-0">
                            <div className="relative">
                                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", darkMode ? "text-slate-400" : "text-slate-500")} />
                                <input
                                    type="text"
                                    placeholder="Search all content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(
                                        "w-full sm:w-72 pl-9 pr-8 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                        darkMode ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-500"
                                    )}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className={cn("absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200", darkMode && "hover:bg-slate-600")}
                                    >
                                        <X className={cn("w-3 h-3", darkMode ? "text-slate-400" : "text-slate-500")} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results Info */}
            {searchQuery.trim() && (
                <div className={cn("border-b", darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200")}>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-between">
                            <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
                                {searchResults.matches.length === 0 ? (
                                    <>No results found for "<span className="font-medium">{searchQuery}</span>"</>
                                ) : (
                                    <>Found <span className="font-bold">{searchResults.matches.length}</span> topic{searchResults.matches.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"</>
                                )}
                            </p>
                            {searchResults.matches.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={darkMode ? "text-slate-500" : "text-slate-400"}>Searched:</span>
                                    <span className={cn("px-2 py-0.5 rounded-full", darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600")}>Topics</span>
                                    <span className={cn("px-2 py-0.5 rounded-full", darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600")}>Content</span>
                                    <span className={cn("px-2 py-0.5 rounded-full", darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600")}>Terms</span>
                                    <span className={cn("px-2 py-0.5 rounded-full", darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600")}>Quizzes</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {activeTab === 'topics' && (
                    <div className="space-y-4">
                        {filteredTopics.length === 0 && searchQuery.trim() && (
                            <Card darkMode={darkMode} className="p-8 text-center">
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", darkMode ? "bg-slate-700" : "bg-slate-100")}>
                                    <Search className={cn("w-8 h-8", darkMode ? "text-slate-500" : "text-slate-400")} />
                                </div>
                                <h3 className={cn("text-xl font-bold mb-2", darkMode ? "text-white" : "text-slate-700")}>No Results Found</h3>
                                <p className={cn("mb-4", darkMode ? "text-slate-400" : "text-slate-500")}>
                                    Try searching with different keywords or check the spelling
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className={cn("px-4 py-2 rounded-lg font-medium", darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
                                >
                                    Clear Search
                                </button>
                            </Card>
                        )}

                        {filteredTopics.map((topic, i) => {
                            const topicProgress = progress.topics[topic.id]?.progress || 0;
                            const matchInfo = searchResults.matches.find(m => m.topic.id === topic.id);
                            const originalIndex = config.topics.findIndex(t => t.id === topic.id);

                            return (
                                <Card key={topic.id} onClick={() => onSelectTopic(originalIndex)} darkMode={darkMode} glowColor={darkMode && config.darkGlow} className="p-6 text-left group">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                            topicProgress === 100 ? "bg-emerald-500" : topicProgress > 0 ? cn("bg-gradient-to-br", config.gradient) : darkMode ? "bg-slate-700" : "bg-slate-200"
                                        )}>
                                            {topicProgress === 100 ? <CheckCircle2 className="w-6 h-6 text-white" /> : topicProgress > 0 ? <CircleDot className="w-6 h-6 text-white" /> : <Circle className={cn("w-6 h-6", darkMode ? "text-slate-500" : "text-slate-400")} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn("font-bold mb-1", darkMode ? "text-white" : "text-slate-800")}>{topic.name}</h3>
                                            <div className={cn("flex items-center gap-4 text-sm flex-wrap", darkMode ? "text-slate-400" : "text-slate-500")}>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{topic.duration} min</span>
                                                {topicProgress > 0 && topicProgress < 100 && <span style={{ color: config.color }}>{topicProgress}% complete</span>}
                                                {topicProgress === 100 && <span className="text-emerald-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" />Completed</span>}
                                            </div>

                                            {/* Show match details when searching */}
                                            {hasSearchResults && matchInfo && matchInfo.matchDetails.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {matchInfo.matchDetails.slice(0, 3).map((detail, idx) => {
                                                        const MatchIcon = getMatchIcon(detail.type);
                                                        return (
                                                            <div key={idx} className={cn("flex items-center gap-2 text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                                                                <MatchIcon className="w-3 h-3" />
                                                                <span className={cn("px-1.5 py-0.5 rounded", darkMode ? "bg-slate-700" : "bg-slate-100")}>
                                                                    {getMatchLabel(detail.type)}
                                                                </span>
                                                                <span className="truncate">
                                                                    {detail.text}
                                                                    {detail.context && <span className="opacity-60"> - {detail.context}</span>}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {matchInfo.matchDetails.length > 3 && (
                                                        <div className={cn("text-xs", darkMode ? "text-slate-500" : "text-slate-400")}>
                                                            +{matchInfo.matchDetails.length - 3} more matches
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className={cn("w-6 h-6 group-hover:translate-x-1 transition-all flex-shrink-0", darkMode ? "text-slate-500" : "text-slate-400")} />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
});

export default SubjectOverview;
