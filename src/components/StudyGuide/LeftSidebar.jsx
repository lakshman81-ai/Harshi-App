import React, { memo } from 'react';
import { ChevronLeft, Check, Star } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * LeftSidebar Component
 * Section navigation sidebar (desktop only)
 *
 * @param {Object} props
 * @param {Object} props.topic - Current topic object { name, id }
 * @param {Object} props.config - Subject config { name, gradient, color }
 * @param {Array} props.sections - Array of section objects
 * @param {number} props.activeSection - Current active section index
 * @param {number} props.progressPercent - Progress percentage (0-100)
 * @param {number} props.xpEarned - XP earned for this topic
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onBack - Back button handler
 * @param {Function} props.onSelectSection - Section selection handler
 * @param {Object} props.ICON_MAP - Icon component map
 * @param {React.Component} props.IconComponent - Topic icon component
 */
const LeftSidebar = memo(({
  topic,
  config,
  sections,
  activeSection,
  progressPercent,
  xpEarned,
  darkMode,
  onBack,
  onSelectSection,
  ICON_MAP,
  IconComponent
}) => {
  return (
    <aside
      className={cn(
        "hidden lg:flex w-64 flex-col border-r flex-shrink-0",
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-slate-200"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 border-b",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}
      >
        <button
          onClick={onBack}
          className={cn(
            "flex items-center gap-2 mb-4 transition-colors",
            darkMode
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
              config.gradient
            )}
          >
            {IconComponent && <IconComponent className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2
              className={cn(
                "font-bold truncate",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              {topic?.name}
            </h2>
            <p
              className={cn(
                "text-sm",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              {config?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
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

      {/* Sections Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <h3
          className={cn(
            "text-xs font-bold uppercase tracking-wider mb-3",
            darkMode ? "text-slate-500" : "text-slate-400"
          )}
        >
          Outline
        </h3>
        <div className="space-y-1">
          {sections.filter(section => section.type !== 'quiz').map((section, i) => {
            // Find actual index in original sections array for progress calculation
            const originalIndex = sections.findIndex(s => s.id === section.id);
            const isCompleted = originalIndex < Math.floor((progressPercent / 100) * sections.length);
            const isActive = activeSection === originalIndex;

            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(originalIndex)}
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
                <span className="font-medium text-sm flex-1 truncate">
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* XP Earned Card */}
      <div
        className={cn(
          "p-4 border-t",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              darkMode ? "bg-amber-900/50" : "bg-amber-100"
            )}
          >
            <Star
              className={cn(
                "w-5 h-5",
                darkMode ? "text-amber-400" : "text-amber-600"
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "font-bold",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              +{xpEarned || 0} XP
            </p>
            <p
              className={cn(
                "text-xs",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              Earned this topic
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
});

LeftSidebar.displayName = 'LeftSidebar';

export default LeftSidebar;
