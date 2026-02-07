import React, { memo, useEffect } from 'react';
import { X, BookOpen, Calculator } from 'lucide-react';
import MathFormula from '../MathFormula';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * KeyTermsDrawer Component
 * Slide-in drawer for key terms and formulas on mobile/tablet
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether drawer is open
 * @param {Array} props.keyTerms - Array of key term objects { id, term, definition }
 * @param {Array} props.formulas - Array of formula objects { id, formula, label }
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onClose - Close drawer handler
 */
const KeyTermsDrawer = memo(({
  isOpen,
  keyTerms,
  formulas,
  darkMode,
  onClose
}) => {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel - Right side */}
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] flex flex-col",
          "transform transition-transform duration-300 ease-out",
          darkMode ? "bg-slate-800" : "bg-white"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 border-b",
            darkMode ? "border-slate-700" : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <BookOpen
              className={cn(
                "w-5 h-5",
                darkMode ? "text-blue-400" : "text-blue-600"
              )}
            />
            <h3
              className={cn(
                "font-bold",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              Key Terms & Formulas
            </h3>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              darkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Key Terms Section */}
          {keyTerms && keyTerms.length > 0 && (
            <div>
              <h4
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2",
                  darkMode ? "text-slate-500" : "text-slate-400"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Key Terms
              </h4>
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
                        "text-sm mt-1",
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
              <h4
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2",
                  darkMode ? "text-slate-500" : "text-slate-400"
                )}
              >
                <Calculator className="w-4 h-4" />
                Formulas
              </h4>
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

          {/* Empty State */}
          {(!keyTerms || keyTerms.length === 0) && (!formulas || formulas.length === 0) && (
            <div className="text-center py-8">
              <BookOpen
                className={cn(
                  "w-12 h-12 mx-auto mb-3 opacity-50",
                  darkMode ? "text-slate-500" : "text-slate-400"
                )}
              />
              <p
                className={cn(
                  "text-sm",
                  darkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                No key terms or formulas for this topic yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

KeyTermsDrawer.displayName = 'KeyTermsDrawer';

export default KeyTermsDrawer;
