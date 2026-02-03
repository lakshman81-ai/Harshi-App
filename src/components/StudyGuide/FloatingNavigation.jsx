import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * FloatingNavigation Component
 * Sticky bottom navigation with previous/next buttons and progress dots
 *
 * @param {Object} props
 * @param {number} props.activeSection - Current active section index
 * @param {number} props.totalSections - Total number of sections
 * @param {Object} props.config - Subject config { gradient }
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onPrevious - Previous button handler
 * @param {Function} props.onNext - Next button handler (also handles section completion)
 * @param {Function} props.onSelectSection - Progress dot click handler
 */
const FloatingNavigation = memo(({
  activeSection,
  totalSections,
  config,
  darkMode,
  onPrevious,
  onNext,
  onSelectSection
}) => {
  const isFirst = activeSection === 0;
  const isLast = activeSection === totalSections - 1;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-40 h-16 px-4 sm:px-6 border-t backdrop-blur-sm",
        darkMode
          ? "bg-slate-900/95 border-slate-700"
          : "bg-white/95 border-slate-200"
      )}
    >
      <div className="h-full max-w-3xl mx-auto flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={cn(
            "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-medium transition-all",
            isFirst
              ? darkMode
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              : darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5" role="navigation" aria-label="Section progress">
          {Array.from({ length: totalSections }).map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectSection(i)}
              aria-label={`Go to section ${i + 1}${i < activeSection ? ', completed' : i === activeSection ? ', current' : ''}`}
              aria-current={i === activeSection ? 'step' : undefined}
              className={cn(
                "h-2 rounded-full transition-all",
                i === activeSection
                  ? cn("w-6 bg-gradient-to-r", config.gradient)
                  : i < activeSection
                    ? "w-2 bg-emerald-500"
                    : darkMode
                      ? "w-2 bg-slate-600 hover:bg-slate-500"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
              )}
              title={`Section ${i + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={isLast}
          className={cn(
            "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-medium transition-all",
            isLast
              ? darkMode
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              : cn("bg-gradient-to-r text-white shadow-lg", config.gradient)
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

FloatingNavigation.displayName = 'FloatingNavigation';

FloatingNavigation.propTypes = {
  activeSection: PropTypes.number.isRequired,
  totalSections: PropTypes.number.isRequired,
  config: PropTypes.shape({
    gradient: PropTypes.string,
  }).isRequired,
  darkMode: PropTypes.bool,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSelectSection: PropTypes.func.isRequired,
};

FloatingNavigation.defaultProps = {
  darkMode: false,
};

export default FloatingNavigation;
