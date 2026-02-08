import React, { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';
import {
  TextBlock,
  FormulaBlock,
  ConceptHelperBlock,
  WarningBlock,
  RealWorldBlock,
  VideoBlock,
  ImageBlock,
  MisconceptionBlock
} from './ContentBlocks';
import QuizSection from '../QuizSection';
import ContentErrorBoundary from '../ErrorBoundary';
import { csvService } from '../../services/unifiedDataService'; // Import CSV service

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ContentArea Component
 * Renders content based on file type (CSV, PDF, Word) and handles "Concept Checks"
 */
const ContentArea = memo(({
  currentSection,
  sectionContent,
  objectives, // Kept for backward compat, though specific to "Objectives" type
  formulas,
  quizQuestions,
  config,
  darkMode,
  userXp,
  topicId,
  onQuizComplete,
  onUseHint,
  contentRef,
  onScrollStateChange,
  // New props for dynamic loading
  subject,
  topicFolder
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [conceptCheckQuestions, setConceptCheckQuestions] = useState([]);
  const [showConceptCheck, setShowConceptCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Concept Check questions if available for this page
  useEffect(() => {
    const loadQuestions = async () => {
      if (currentSection?.questions_file) {
        setLoading(true);
        try {
          // Use the exposed loadConceptCheck from csvService (via unifiedDataService export if re-exported, otherwise import directly)
          // Since unifiedDataService might not export it directly, we import csvService above.
           const questions = await import('../../services/csvService').then(m =>
             m.loadConceptCheck(subject, topicFolder, currentSection.questions_file)
           );

           // Normalize questions to match QuizSection format
           const normalized = questions.map((q, i) => ({
             id: q.question_id || `cc-${i}`,
             question: q.question_text,
             options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
             correctAnswer: q.correct_answer, // Expecting 'A', 'B', 'C', 'D' or full text
             explanation: q.explanation,
             type: 'mcq', // Assume MCQ for concept checks
             // Map A/B/C/D to full text if needed by QuizSection,
             // but QuizSection usually handles index-based checking if options provided
           }));

           setConceptCheckQuestions(normalized);
           setShowConceptCheck(true);
        } catch (err) {
          console.error("Failed to load concept check", err);
          setError("Could not load concept check questions.");
        } finally {
          setLoading(false);
        }
      } else {
        setShowConceptCheck(false);
        setConceptCheckQuestions([]);
      }
    };

    loadQuestions();
  }, [currentSection, subject, topicFolder]);


  // Helper: Render different file types
  const renderPageContent = () => {
    const fileType = currentSection?.file?.split('.').pop()?.toLowerCase();

    // PDF Handling
    if (fileType === 'pdf') {
      const publicUrl = process.env.PUBLIC_URL || '';
      // Construct path relative to public
      // currentSection.file is just "Page2.pdf". We need full path.
      // Logic: /Subject/Topic/studyguide/Pages/Filename
      const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
      const pdfPath = `${publicUrl}/${subjectName}/${topicFolder}/studyguide/Pages/${currentSection.file}`;

      return (
        <div className="h-[800px] w-full border rounded-xl overflow-hidden shadow-sm">
            <iframe
                src={pdfPath}
                className="w-full h-full"
                title={currentSection.title}
            />
        </div>
      );
    }

    // Word Doc Handling (Download only)
    if (fileType === 'doc' || fileType === 'docx') {
      const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
      const docPath = `${process.env.PUBLIC_URL || ''}/${subjectName}/${topicFolder}/studyguide/Pages/${currentSection.file}`;

      return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 border-2 dashed rounded-xl",
            darkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-300 bg-slate-50"
        )}>
            <FileText className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className={cn("text-xl font-bold mb-2", darkMode ? "text-white" : "text-slate-800")}>
                Word Document Resource
            </h3>
            <p className={cn("mb-6 text-center max-w-md", darkMode ? "text-slate-400" : "text-slate-600")}>
                This content is available as a downloadable document.
                Please download it to view the full content.
            </p>
            <a
                href={docPath}
                download
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
                <Download className="w-5 h-5" />
                Download {currentSection.file}
            </a>
        </div>
      );
    }

    // CSV / Standard Content
    if (!sectionContent || sectionContent.length === 0) {
       // Fallback or Empty State
       return (
        <div className={cn("text-center py-12", darkMode ? "text-slate-400" : "text-slate-500")}>
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content available for this page.</p>
        </div>
       );
    }

    return (
        <div className="space-y-6">
            {sectionContent.map((content, index) => (
            <ContentErrorBoundary key={content.id || index} darkMode={darkMode}>
                {renderContentBlock(content, index)}
            </ContentErrorBoundary>
            ))}
        </div>
    );
  };

  // Render content block based on type (for CSV content)
  const renderContentBlock = (content, index) => {
    // Find matching formula for formula content type
    const matchingFormula = content.type === 'formula'
      ? formulas?.find(f => content.formulaId && f.id === content.formulaId) ||
      formulas?.find(f => f.label === content.title) ||
      formulas?.find(f => f.formula === content.text) ||
      formulas?.[0]
      : null;

    switch (content.type) {
      case 'introduction':
      case 'text':
        return <TextBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'formula':
        return (
          <FormulaBlock
            key={content.id || index}
            content={content}
            formula={matchingFormula}
            darkMode={darkMode}
          />
        );

      case 'concept_helper':
      case 'tip':
        return <ConceptHelperBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'warning':
        return <WarningBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'real_world':
      case 'application':
        return <RealWorldBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'video':
        return <VideoBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'image':
      case 'visualization': // Map visualization to ImageBlock
        return <ImageBlock key={content.id || index} content={content} darkMode={darkMode} />;

      case 'key_term':
        return (
          <div
            key={content.id || index}
            className={cn(
              "rounded-xl p-4 border-l-4 border-blue-500",
              darkMode ? "bg-blue-900/20" : "bg-blue-50"
            )}
          >
            <h4 className={cn(
              "font-bold text-lg mb-2",
              darkMode ? "text-blue-300" : "text-blue-700"
            )}>
              📚 {content.title}
            </h4>
            <p className={cn(
              darkMode ? "text-slate-300" : "text-slate-700"
            )}>
              {content.text}
            </p>
          </div>
        );

      case 'misconception':
        return (
          <MisconceptionBlock
            key={content.id || index}
            title={content.title}
            explanation={content.text || content.explanation}
            wrongExample={content.wrongExample || content.wrong_example}
            correctExample={content.correctExample || content.correct_example}
            darkMode={darkMode}
          />
        );

      default:
        return <TextBlock key={content.id || index} content={content} darkMode={darkMode} />;
    }
  };

  // Scroll progress tracking
  useEffect(() => {
    const contentEl = contentRef?.current;
    if (!contentEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentEl;
      const maxScroll = scrollHeight - clientHeight;
      const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 10;

      onScrollStateChange?.(isBottom);

      if (maxScroll <= 0) {
        setScrollProgress(100);
        return;
      }

      const progress = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
      setScrollProgress(progress);
    };

    contentEl.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    // Add resize listener
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(contentEl);

    return () => {
      contentEl.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [contentRef, onScrollStateChange, sectionContent, currentSection?.id]);

  return (
    <div
      ref={contentRef}
      className="flex-1 overflow-y-auto"
    >
      {/* Reading Progress Indicator */}
      <div className="sticky top-0 z-10 h-1 bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
          role="progressbar"
          aria-valuenow={scrollProgress}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-32">
        {/* Section Title Card */}
        <div
          className={cn(
            "rounded-2xl p-6 border mb-8",
            darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          <h2 className={cn("text-2xl font-bold mb-2", darkMode ? "text-white" : "text-slate-800")}>
            {currentSection?.section_title || currentSection?.title}
          </h2>
          {currentSection?.file && (
             <span className={cn(
                 "text-xs px-2 py-1 rounded border uppercase tracking-wider",
                 darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
             )}>
                 {currentSection.file.split('.').pop()}
             </span>
          )}
        </div>

        {/* Main Content Render */}
        {renderPageContent()}

        {/* Concept Check Section */}
        {showConceptCheck && conceptCheckQuestions.length > 0 && (
            <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>
                            Concept Check
                        </h3>
                        <p className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>
                            Verify your understanding before moving to the next page.
                        </p>
                    </div>
                </div>

                <QuizSection
                    questions={conceptCheckQuestions}
                    darkMode={darkMode}
                    subjectConfig={config}
                    topicId={topicId}
                    onComplete={(score, xp, results) => {
                        console.log("Concept check complete", score);
                        onQuizComplete?.(score, xp, results);
                    }}
                    onUseHint={onUseHint}
                    userXp={userXp}
                    allowHints={true}
                    hintCost={0} // Free hints for concept checks?
                    key={`cc-${currentSection.id}`} // Force reset on section change
                />
            </div>
        )}
      </div>
    </div>
  );
});

ContentArea.displayName = 'ContentArea';

ContentArea.propTypes = {
  currentSection: PropTypes.object,
  sectionContent: PropTypes.array,
  objectives: PropTypes.array,
  formulas: PropTypes.array,
  quizQuestions: PropTypes.array,
  config: PropTypes.object,
  darkMode: PropTypes.bool,
  userXp: PropTypes.number,
  topicId: PropTypes.string,
  onQuizComplete: PropTypes.func,
  onUseHint: PropTypes.func,
  contentRef: PropTypes.object,
  onScrollStateChange: PropTypes.func,
  subject: PropTypes.string,
  topicFolder: PropTypes.string
};

export default ContentArea;
