import React, { memo, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * MobileSidebarDrawer Component
 * Slide-in drawer for section navigation on mobile/tablet
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether drawer is open
 * @param {Object} props.topic - Current topic object { name }
 * @param {Object} props.config - Subject config { gradient, color }
 * @param {Array} props.sections - Array of section objects
 * @param {number} props.activeSection - Current active section index
 * @param {number} props.progressPercent - Progress percentage (0-100)
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onClose - Close drawer handler
 * @param {Function} props.onSelectSection - Section selection handler
 * @param {Object} props.ICON_MAP - Icon component map
 */
const MobileSidebarDrawer = memo(({
  isOpen,
  topic,
  config,
  sections,
  activeSection,
  progressPercent,
  darkMode,
  onClose,
  onSelectSection,
  ICON_MAP
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

  const handleSectionClick = (index) => {
    onSelectSection(index);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] flex flex-col",
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
          <div>
            <h3
              className={cn(
                "font-bold",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              {topic?.name}
            </h3>
            <p
              className={cn(
                "text-sm",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              Section Navigation
            </p>
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

        {/* Progress Bar */}
        <div
          className={cn(
            "p-4 border-b",
            darkMode ? "border-slate-700" : "border-slate-200"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                "text-sm font-medium",
                darkMode ? "text-slate-400" : "text-slate-600"
              )}
            >
              Progress
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: config.color }}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            className={cn(
              "w-full h-2 rounded-full overflow-hidden",
              darkMode ? "bg-slate-700" : "bg-slate-100"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all bg-gradient-to-r",
                config.gradient
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {sections.filter(section => section.type !== 'quiz').map((section, i) => {
              // Find actual index in original sections array for progress calculation
              const originalIndex = sections.findIndex(s => s.id === section.id);
              const isCompleted = originalIndex < Math.floor((progressPercent / 100) * sections.length);
              const isActive = activeSection === originalIndex;

              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(originalIndex)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                    isActive
                      ? cn("bg-gradient-to-r text-white shadow-lg", config.gradient)
                      : isCompleted
                        ? darkMode
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                        : darkMode
                          ? "hover:bg-slate-700 text-slate-400"
                          : "hover:bg-slate-100 text-slate-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isActive
                        ? "bg-white/20"
                        : isCompleted
                          ? "bg-emerald-500 text-white"
                          : darkMode
                            ? "border-2 border-slate-600"
                            : "border-2 border-slate-300"
                    )}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className="font-medium text-sm flex-1">
                    {section.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

MobileSidebarDrawer.displayName = 'MobileSidebarDrawer';

export default MobileSidebarDrawer;
