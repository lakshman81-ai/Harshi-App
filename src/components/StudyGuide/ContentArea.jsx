import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import {
  ObjectivesBlock,
  TextBlock,
  FormulaBlock,
  ConceptHelperBlock,
  WarningBlock,
  RealWorldBlock,
  VideoBlock,
  ImageBlock
} from './ContentBlocks';
import QuizSection from '../QuizSection';
import ContentErrorBoundary from '../ErrorBoundary';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ContentArea Component
 * Main scrollable content area that renders content based on section type
 *
 * @param {Object} props
 * @param {Object} props.currentSection - Current section object { id, title, type, icon }
 * @param {Array} props.sectionContent - Content array for current section
 * @param {Array} props.objectives - Learning objectives for current topic
 * @param {Array} props.formulas - Formulas for current topic
 * @param {Array} props.quizQuestions - Quiz questions for current topic
 * @param {Object} props.config - Subject config { gradient, color }
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {number} props.userXp - User's current XP
 * @param {string} props.topicId - Current topic ID
 * @param {Function} props.onQuizComplete - Quiz completion callback
 * @param {Function} props.onUseHint - Hint usage callback
 * @param {React.RefObject} props.contentRef - Ref for scroll-to-top
 */
const ContentArea = memo(({
  currentSection,
  sectionContent,
  objectives,
  formulas,
  quizQuestions,
  config,
  darkMode,
  userXp,
  topicId,
  onQuizComplete,
  onUseHint,
  contentRef
}) => {
  // Render content block based on type
  const renderContentBlock = (content, index) => {
    // Find matching formula for formula content type
    // Priority: 1. By explicit formulaId, 2. By label match, 3. By formula text match, 4. Fallback to first
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
        return <ImageBlock key={content.id || index} content={content} darkMode={darkMode} />;

      default:
        return <TextBlock key={content.id || index} content={content} darkMode={darkMode} />;
    }
  };

  return (
    <div
      ref={contentRef}
      className="flex-1 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Section Title Card */}
        <div
          className={cn(
            "rounded-2xl p-4 sm:p-6 border mb-6",
            darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
          )}
        >
          <h2
            className={cn(
              "text-xl sm:text-2xl font-bold",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            {currentSection?.title || 'Content'}
          </h2>
        </div>

        {/* Learning Objectives Section */}
        {currentSection?.type === 'objectives' && objectives && (
          <ObjectivesBlock objectives={objectives} darkMode={darkMode} />
        )}

        {/* Content Sections (intro, content, applications) */}
        {(currentSection?.type === 'content' ||
          currentSection?.type === 'intro' ||
          currentSection?.type === 'applications') && (
          <>
            {sectionContent && sectionContent.length > 0 ? (
              <div className="space-y-6">
                {sectionContent.map((content, index) => (
                  <ContentErrorBoundary key={content.id || index} darkMode={darkMode}>
                    {renderContentBlock(content, index)}
                  </ContentErrorBoundary>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  "text-center py-12",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Content for this section is being prepared.</p>
                <p className="text-sm mt-2">Update your Google Sheet to add content!</p>
              </div>
            )}
          </>
        )}

        {/* Quiz Section - Hidden in print/handout mode via CSS */}
        {currentSection?.type === 'quiz' && (
          <div className="quiz-section">
            <QuizSection
              questions={quizQuestions || []}
              darkMode={darkMode}
              subjectConfig={config}
              topicId={topicId}
              onComplete={onQuizComplete}
              onUseHint={onUseHint}
              userXp={userXp}
              allowHints={true}
              hintCost={5}
            />
          </div>
        )}
      </div>
    </div>
  );
});

ContentArea.displayName = 'ContentArea';

ContentArea.propTypes = {
  currentSection: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    icon: PropTypes.string,
  }),
  sectionContent: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    title: PropTypes.string,
    text: PropTypes.string,
    formulaId: PropTypes.string,
  })),
  objectives: PropTypes.array,
  formulas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    formula: PropTypes.string,
  })),
  quizQuestions: PropTypes.array,
  config: PropTypes.shape({
    gradient: PropTypes.string,
    color: PropTypes.string,
  }),
  darkMode: PropTypes.bool,
  userXp: PropTypes.number,
  topicId: PropTypes.string,
  onQuizComplete: PropTypes.func,
  onUseHint: PropTypes.func,
  contentRef: PropTypes.object,
};

ContentArea.defaultProps = {
  darkMode: false,
  userXp: 0,
};

export default ContentArea;
