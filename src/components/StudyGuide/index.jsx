import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Star } from 'lucide-react';

// Import subcomponents
import StudyGuideHeader from './StudyGuideHeader';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ContentArea from './ContentArea';
import FloatingNavigation from './FloatingNavigation';
import MobileSidebarDrawer from './MobileSidebarDrawer';
import KeyTermsDrawer from './KeyTermsDrawer';
import NotesPanel from './NotesPanel';
import PostSectionReview from './PostSectionReview';
import HandoutInline from '../HandoutInline';
import QuizSection from '../QuizSection';
import { BookOpen, HelpCircle, ClipboardList } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * StudyGuide Component
 * Complete study guide interface with sections, content, and navigation
 *
 * @param {Object} props
 * @param {string} props.subject - Subject key ("physics", "math", etc.)
 * @param {number} props.topicIndex - Index of topic in subject.topics array
 * @param {Function} props.onBack - Navigate back to subject overview
 * @param {Function} props.onOpenSettings - Open settings modal
 * @param {Object} props.studyData - Data from useStudy hook
 * @param {Object} props.ICON_MAP - Icon component map
 */
const StudyGuide = memo(({
  subject,
  topicIndex,
  onBack,
  onOpenSettings,
  studyData,
  ICON_MAP
}) => {
  const {
    progress,
    subjects,
    sections,
    objectives,
    keyTerms,
    studyContent,
    formulas,
    quizQuestions,
    updateProgress,
    settings,
    DEFAULT_SECTIONS,
    DEFAULT_OBJECTIVES,
    DEFAULT_KEY_TERMS,
    DEFAULT_CONTENT,
    DEFAULT_FORMULAS,
    DEFAULT_QUIZZES
  } = studyData;

  const darkMode = settings?.darkMode || false;

  // Get subject and topic data
  const config = subjects?.[subject];
  const topic = config?.topics?.[topicIndex];
  const topicKey = topic?.id;
  const IconComponent = ICON_MAP?.[config?.icon];

  // Get data for this topic (with fallbacks to defaults)
  const topicSections = sections?.[topicKey] || DEFAULT_SECTIONS?.[topicKey] || [];
  const topicObjectives = objectives?.[topicKey] || DEFAULT_OBJECTIVES?.[topicKey] || [];
  const topicTerms = keyTerms?.[topicKey] || DEFAULT_KEY_TERMS?.[topicKey] || [];
  const topicFormulas = formulas?.[topicKey] || DEFAULT_FORMULAS?.[topicKey] || [];
  const topicQuizzes = quizQuestions?.[topicKey] || DEFAULT_QUIZZES?.[topicKey] || [];

  // State
  const [activeTab, setActiveTab] = useState('study'); // 'study' | 'quiz' | 'handout'
  const [activeSection, setActiveSection] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showKeyTerms, setShowKeyTerms] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [xpGain, setXpGain] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Define tabs
  const tabs = [
    { id: 'study', label: 'Study Guide', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'handout', label: 'Handout', icon: ClipboardList }
  ];

  // Refs
  const contentRef = useRef(null);

  // Derived values
  const currentSection = topicSections[activeSection];
  const sectionContent = currentSection
    ? (studyContent?.[currentSection.id] || DEFAULT_CONTENT?.[currentSection.id] || [])
    : [];
  const progressPercent = progress?.topics?.[topicKey]?.progress || 0;
  const xpEarned = progress?.topics?.[topicKey]?.xp || 0;
  const bookmarks = progress?.bookmarks || [];
  const userNotes = progress?.notes?.[topicKey] || '';

  // Memoize topic-specific bookmarks to avoid recalculation on every render
  const topicBookmarks = useMemo(
    () => bookmarks.filter(b => b.startsWith(topicKey)),
    [bookmarks, topicKey]
  );

  const isBookmarked = useMemo(
    () => currentSection && bookmarks.includes(`${topicKey}-${currentSection.id}`),
    [currentSection, bookmarks, topicKey]
  );

  // Scroll to top when section changes
  useEffect(() => {
    setIsAtBottom(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);

  // Handle section completion and XP
  const handleSectionComplete = useCallback((sectionIndex) => {
    const currentProgress = progress?.topics?.[topicKey]?.progress || 0;
    const newProgress = Math.min(100, Math.round(((sectionIndex + 1) / topicSections.length) * 100));

    if (newProgress > currentProgress) {
      const xpEarnedAmount = 10;
      const bonusXP = newProgress === 100 ? 50 : 0;
      const totalXP = xpEarnedAmount + bonusXP;

      setXpGain(totalXP);

      const newAchievements = [...(progress?.achievements || [])];
      if (newProgress === 100 && !newAchievements.includes('topic-complete')) {
        newAchievements.push('topic-complete');
      }

      updateProgress?.({
        xp: (progress?.xp || 0) + totalXP,
        topics: {
          [topicKey]: {
            progress: newProgress,
            xp: (progress?.topics?.[topicKey]?.xp || 0) + xpEarnedAmount,
            lastAccessed: new Date().toISOString()
          }
        },
        studyTimeMinutes: (progress?.studyTimeMinutes || 0) + 2,
        achievements: newAchievements
      });

      setTimeout(() => setXpGain(null), 1500);
    }
  }, [progress, topicKey, topicSections.length, updateProgress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && activeSection > 0) {
        setActiveSection(prev => prev - 1);
      } else if (e.key === 'ArrowRight') {
        // Logic for right arrow? Maybe same as Next button?
        // For now keeping simple navigation for keyboard
        if (activeSection < topicSections.length - 1) {
          handleSectionComplete(activeSection);
          setActiveSection(prev => prev + 1);
        }
      } else if (e.key === 'Escape') {
        setShowMobileSidebar(false);
        setShowKeyTerms(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, topicSections.length, handleSectionComplete]); // simplified deps

  // Toggle bookmark
  const handleToggleBookmark = useCallback(() => {
    if (!currentSection) return;
    const key = `${topicKey}-${currentSection.id}`;
    const newBookmarks = bookmarks.includes(key)
      ? bookmarks.filter(b => b !== key)
      : [...bookmarks, key];
    updateProgress?.({ bookmarks: newBookmarks });
  }, [currentSection, topicKey, bookmarks, updateProgress]);

  // Save notes
  const handleSaveNotes = useCallback((tid, notes) => {
    updateProgress?.({
      notes: {
        ...(progress?.notes || {}),
        [tid]: notes
      }
    });
  }, [progress, updateProgress]);

  // Quiz completion
  const handleQuizComplete = useCallback((score, earnedXp, results) => {
    const newAchievements = [...(progress?.achievements || [])];
    if (!newAchievements.includes('first-quiz')) {
      newAchievements.push('first-quiz');
    }
    if (score === 100 && !newAchievements.includes('perfect-quiz')) {
      newAchievements.push('perfect-quiz');
    }

    updateProgress?.({
      xp: (progress?.xp || 0) + earnedXp,
      achievements: newAchievements,
      quizScores: {
        ...(progress?.quizScores || {}),
        [topicKey]: score
      }
    });

    setXpGain(earnedXp);
    setTimeout(() => setXpGain(null), 1500);
  }, [progress, topicKey, updateProgress]);

  // Use hint callback
  const handleUseHint = useCallback((cost) => {
    updateProgress?.({
      xp: Math.max(0, (progress?.xp || 0) - cost)
    });
  }, [progress, updateProgress]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (activeSection > 0) {
      setActiveSection(prev => prev - 1);
    }
  }, [activeSection]);

  const handleNext = useCallback(() => {
    try {
      // Intelligent Navigation: Scroll first, then Next
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const isActuallyAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10; // 10px buffer

        if (!isAtBottom && !isActuallyAtBottom) {
          contentRef.current.scrollBy({ top: 400, behavior: 'smooth' });
          return;
        }
      }

      if (activeSection < topicSections.length - 1) {
        if (typeof handleSectionComplete === 'function') {
          handleSectionComplete(activeSection);
        } else {
          Logger.warn('handleSectionComplete is not a function');
        }
        // Trigger review before moving to next section
        setShowReview(true);
      }
    } catch (error) {
      Logger.error('Error in handleNext navigation', error);
      // Fallback: try to just move next if possible, or alert user
      alert("Navigation error. Please try reloading the page.");
    }
  }, [activeSection, topicSections.length, handleSectionComplete, isAtBottom]); // Added isAtBottom, removed recursion risks

  const handleReviewComplete = useCallback(() => {
    setShowReview(false);
    setActiveSection(prev => prev + 1);
  }, []);

  const handleSelectSection = useCallback((index) => {
    setActiveSection(index);
  }, []);

  // Early return if no data
  if (!config || !topic) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", darkMode ? "bg-slate-900" : "bg-slate-50")}>
        <p className={darkMode ? "text-slate-400" : "text-slate-500"}>Topic not found</p>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col", darkMode ? "bg-slate-900" : "bg-slate-50")}>
      {/* Post Section Review Modal */}
      {showReview && currentSection && (
        <PostSectionReview
          subject={subject}
          topic={topicKey}
          subtopicId={currentSection.id}
          keyTerms={topicTerms}
          darkMode={darkMode}
          onClose={() => setShowReview(false)}
          onComplete={handleReviewComplete}
        />
      )}
      {/* XP Animation */}
      {xpGain && (
        <div className="fixed top-20 right-8 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5" />
            +{xpGain} XP
          </div>
        </div>
      )}

      {/* Header */}
      {console.log('Rendering StudyGuideHeader with props:', { topic, config, currentSection })}
      <StudyGuideHeader
        topic={topic}
        config={config}
        currentSection={currentSection}
        progressPercent={progressPercent}
        isBookmarked={isBookmarked}
        showNotes={showNotes}
        darkMode={darkMode}
        onBack={onBack}
        onToggleMobileSidebar={() => setShowMobileSidebar(true)}
        onToggleKeyTerms={() => setShowKeyTerms(true)}
        onToggleBookmark={handleToggleBookmark}
        onToggleNotes={() => setShowNotes(!showNotes)}
        onOpenSettings={onOpenSettings}
        IconComponent={IconComponent}
        sectionContent={sectionContent}
        activeTab={activeTab}
      />

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className={cn("border-b px-4 sm:px-6 flex-none", darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-current"
                    : cn("border-transparent", darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                )}
                style={activeTab === tab.id ? { borderColor: config.color, color: config.color } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">

          {/* STUDY TAB */}
          {activeTab === 'study' && (
            <div className="absolute inset-0 flex">
              {/* Left Sidebar (desktop only) */}
              <LeftSidebar
                topic={topic}
                config={config}
                sections={topicSections}
                activeSection={activeSection}
                progressPercent={progressPercent}
                xpEarned={xpEarned}
                darkMode={darkMode}
                onBack={onBack}
                onSelectSection={handleSelectSection}
                ICON_MAP={ICON_MAP}
                IconComponent={IconComponent}
              />

              {/* Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ContentArea
                  currentSection={currentSection}
                  sectionContent={sectionContent}
                  objectives={topicObjectives}
                  formulas={topicFormulas}
                  quizQuestions={topicQuizzes}
                  config={config}
                  darkMode={darkMode}
                  userXp={progress?.xp || 0}
                  topicId={topicKey}
                  onQuizComplete={handleQuizComplete}
                  onUseHint={handleUseHint}
                  contentRef={contentRef}
                  onScrollStateChange={setIsAtBottom}
                />

                {/* Notes Panel */}
                <NotesPanel
                  isOpen={showNotes}
                  topicId={topicKey}
                  initialNotes={userNotes}
                  darkMode={darkMode}
                  onSave={handleSaveNotes}
                  onClose={() => setShowNotes(false)}
                />

                {/* Floating Navigation */}
                <FloatingNavigation
                  activeSection={activeSection}
                  totalSections={topicSections.length}
                  config={config}
                  darkMode={darkMode}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSelectSection={handleSelectSection}
                  isAtBottom={isAtBottom}
                />
              </div>

              {/* Right Sidebar (desktop xl+ only) */}
              <RightSidebar
                keyTerms={topicTerms}
                formulas={topicFormulas}
                bookmarks={bookmarks}
                sections={topicSections}
                topicKey={topicKey}
                darkMode={darkMode}
                onSelectSection={handleSelectSection}
              />
            </div>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                <QuizSection
                  questions={topicQuizzes}
                  darkMode={darkMode}
                  subjectConfig={config}
                  topicId={topicKey}
                  onComplete={handleQuizComplete}
                  onUseHint={handleUseHint}
                  userXp={progress?.xp || 0}
                  allowHints={true}
                  hintCost={5}
                />
              </div>
            </div>
          )}

          {/* HANDOUT TAB */}
          {activeTab === 'handout' && (
            <div className="absolute inset-0 overflow-y-auto">
              <HandoutInline
                subject={subjects?.[subject]}
                topic={topic}
                objectives={topicObjectives}
                terms={topicTerms}
                formulas={topicFormulas}
                sections={topicSections}
                studyContent={studyContent}
                quizQuestions={topicQuizzes}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebarDrawer
        isOpen={showMobileSidebar}
        topic={topic}
        config={config}
        sections={topicSections}
        activeSection={activeSection}
        progressPercent={progressPercent}
        darkMode={darkMode}
        onClose={() => setShowMobileSidebar(false)}
        onSelectSection={handleSelectSection}
        ICON_MAP={ICON_MAP}
      />

      {/* Key Terms Drawer */}
      <KeyTermsDrawer
        isOpen={showKeyTerms}
        keyTerms={topicTerms}
        formulas={topicFormulas}
        darkMode={darkMode}
        onClose={() => setShowKeyTerms(false)}
      />
    </div>
  );
});

StudyGuide.displayName = 'StudyGuide';

StudyGuide.propTypes = {
  subject: PropTypes.string.isRequired,
  topicIndex: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func,
  studyData: PropTypes.shape({
    progress: PropTypes.object,
    subjects: PropTypes.object,
    sections: PropTypes.object,
    objectives: PropTypes.object,
    keyTerms: PropTypes.object,
    studyContent: PropTypes.object,
    formulas: PropTypes.object,
    quizQuestions: PropTypes.object,
    updateProgress: PropTypes.func,
    settings: PropTypes.shape({
      darkMode: PropTypes.bool,
    }),
    DEFAULT_SECTIONS: PropTypes.object,
    DEFAULT_OBJECTIVES: PropTypes.object,
    DEFAULT_KEY_TERMS: PropTypes.object,
    DEFAULT_CONTENT: PropTypes.object,
    DEFAULT_FORMULAS: PropTypes.object,
    DEFAULT_QUIZZES: PropTypes.object,
  }).isRequired,
  ICON_MAP: PropTypes.object,
};

export default StudyGuide;

// Re-export subcomponents for flexibility
export {
  StudyGuideHeader,
  LeftSidebar,
  RightSidebar,
  ContentArea,
  FloatingNavigation,
  MobileSidebarDrawer,
  KeyTermsDrawer,
  NotesPanel
};
