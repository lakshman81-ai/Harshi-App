import React, { memo } from 'react';
import { BookOpen, Bookmark, Calculator } from 'lucide-react';
import MathFormula from '../MathFormula';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * RightSidebar Component
 * Key terms and bookmarks sidebar (desktop xl+ only)
 *
 * @param {Object} props
 * @param {Array} props.keyTerms - Array of key term objects { id, term, definition }
 * @param {Array} props.formulas - Array of formula objects { id, formula, label }
 * @param {Array} props.bookmarks - Array of bookmark strings (topicKey-sectionId)
 * @param {Array} props.sections - Array of section objects { id, title }
 * @param {string} props.topicKey - Current topic key
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onSelectSection - Section selection handler
 */
const RightSidebar = memo(({
  keyTerms,
  formulas,
  bookmarks,
  sections,
  topicKey,
  darkMode,
  onSelectSection
}) => {
  // Filter bookmarks for current topic
  const topicBookmarks = bookmarks?.filter(b => b.startsWith(topicKey)) || [];

  return (
    <aside
      className={cn(
        "hidden xl:block w-72 border-l overflow-y-auto flex-shrink-0",
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-slate-200"
      )}
    >
      <div className="p-4 space-y-6">
        {/* Key Terms Section */}
        {keyTerms && keyTerms.length > 0 && (
          <div>
            <h3
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2",
                darkMode ? "text-slate-500" : "text-slate-400"
              )}
            >
              <BookOpen className="w-4 h-4" />
              Key Terms
            </h3>
            <div className="space-y-2">
              {keyTerms.map((item, i) => (
                <div
                  key={item.id || i}
                  className={cn(
                    "rounded-xl p-3",
                    darkMode ? "bg-slate-700" : "bg-slate-50"
                  )}
                >
                  <p
                    className={cn(
                      "font-bold text-sm",
                      darkMode ? "text-white" : "text-slate-800"
                    )}
                  >
                    {item.term}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      darkMode ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulas Section */}
        {formulas && formulas.length > 0 && (
          <div>
            <h3
              className={cn(
                "text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2",
                darkMode ? "text-slate-500" : "text-slate-400"
              )}
            >
              <Calculator className="w-4 h-4" />
              Formulas
            </h3>
            <div className="space-y-2">
              {formulas.map((item, i) => (
                <div
                  key={item.id || i}
                  className={cn(
                    "rounded-xl p-3",
                    darkMode ? "bg-slate-700" : "bg-slate-50"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs mb-2",
                      darkMode ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    {item.label}
                  </p>
                  <MathFormula
                    formula={item.formulaDisplay || item.formula}
                    size="small"
                    className={darkMode ? "text-white" : "text-slate-800"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarks Section */}
        <div>
          <h3
            className={cn(
              "text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2",
              darkMode ? "text-slate-500" : "text-slate-400"
            )}
          >
            <Bookmark className="w-4 h-4" />
            Bookmarks
          </h3>
          {topicBookmarks.length > 0 ? (
            <div className="space-y-2">
              {topicBookmarks.map((b, i) => {
                const sectionId = b.split('-').pop();
                const section = sections.find(s => s.id === sectionId);
                const sectionIndex = sections.findIndex(s => s.id === sectionId);

                return (
                  <button
                    key={i}
                    onClick={() => onSelectSection(sectionIndex)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors",
                      darkMode
                        ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    )}
                  >
                    <Bookmark className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">
                      {section?.title || sectionId}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p
              className={cn(
                "text-sm",
                darkMode ? "text-slate-500" : "text-slate-400"
              )}
            >
              No bookmarks yet
            </p>
          )}
        </div>
      </div>
    </aside>
  );
});

RightSidebar.displayName = 'RightSidebar';

export default RightSidebar;
