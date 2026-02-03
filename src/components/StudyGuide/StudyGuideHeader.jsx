import React, { memo } from 'react';
import { ChevronLeft, Menu, BookOpen, Bookmark, StickyNote, Settings } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * StudyGuideHeader Component
 * Sticky header with navigation and action buttons
 *
 * @param {Object} props
 * @param {Object} props.topic - Current topic object { name }
 * @param {Object} props.config - Subject config { name, icon, gradient, color }
 * @param {Object} props.currentSection - Current section object { title, id }
 * @param {number} props.progressPercent - Progress percentage (0-100)
 * @param {boolean} props.isBookmarked - Whether current section is bookmarked
 * @param {boolean} props.showNotes - Whether notes panel is visible
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onBack - Back button handler
 * @param {Function} props.onToggleMobileSidebar - Toggle mobile sidebar
 * @param {Function} props.onToggleKeyTerms - Toggle key terms drawer
 * @param {Function} props.onToggleBookmark - Toggle bookmark
 * @param {Function} props.onToggleNotes - Toggle notes panel
 * @param {Function} props.onOpenSettings - Open settings modal
 * @param {React.Component} props.IconComponent - Topic icon component
 */
const StudyGuideHeader = memo(({
  topic,
  config,
  currentSection,
  progressPercent,
  isBookmarked,
  showNotes,
  darkMode,
  onBack,
  onToggleMobileSidebar,
  onToggleKeyTerms,
  onToggleBookmark,
  onToggleNotes,
  onOpenSettings,
  IconComponent
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 px-4 sm:px-6 flex items-center justify-between border-b backdrop-blur-sm",
        darkMode
          ? "bg-slate-900/95 border-slate-700"
          : "bg-white/95 border-slate-200"
      )}
    >
      {/* Left: Back button + Topic info */}
      <div className="flex items-center gap-3">
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className={cn(
            "lg:hidden p-2 rounded-lg transition-colors",
            darkMode
              ? "hover:bg-slate-700 text-slate-400"
              : "hover:bg-slate-100 text-slate-600"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Menu button (mobile/tablet) */}
        <button
          onClick={onToggleMobileSidebar}
          className={cn(
            "lg:hidden p-2 rounded-lg transition-colors",
            darkMode
              ? "hover:bg-slate-700 text-slate-400"
              : "hover:bg-slate-100 text-slate-600"
          )}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Topic icon and name */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "hidden sm:flex w-10 h-10 rounded-xl items-center justify-center bg-gradient-to-br",
              config.gradient
            )}
          >
            {IconComponent && <IconComponent className="w-5 h-5 text-white" />}
          </div>
          <div className="hidden sm:block">
            <h2
              className={cn(
                "font-bold text-sm truncate max-w-[200px]",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              {topic?.name}
            </h2>
            <p
              className={cn(
                "text-xs",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              {config?.name}
            </p>
          </div>
          {/* Mobile topic name only */}
          <h2
            className={cn(
              "sm:hidden font-bold text-sm truncate max-w-[150px]",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            {topic?.name}
          </h2>
        </div>
      </div>

      {/* Center: Progress bar (desktop only) */}
      <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-8">
        <div
          className={cn(
            "flex-1 h-2 rounded-full overflow-hidden",
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
        <span
          className="text-sm font-bold min-w-[45px] text-right"
          style={{ color: config.color }}
        >
          {progressPercent}%
        </span>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Key Terms (mobile/tablet only, visible below xl) */}
        <button
          onClick={onToggleKeyTerms}
          className={cn(
            "xl:hidden p-2 rounded-lg transition-colors",
            darkMode
              ? "hover:bg-slate-700 text-slate-400"
              : "hover:bg-slate-100 text-slate-500"
          )}
          title="Key Terms"
        >
          <BookOpen className="w-5 h-5" />
        </button>

        {/* Bookmark */}
        <button
          onClick={onToggleBookmark}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isBookmarked
              ? "bg-amber-100 text-amber-600"
              : darkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
          )}
          title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
        >
          <Bookmark className="w-5 h-5" />
        </button>

        {/* Notes */}
        <button
          onClick={onToggleNotes}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showNotes
              ? "bg-blue-100 text-blue-600"
              : darkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-100 text-slate-500"
          )}
          title="Notes"
        >
          <StickyNote className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={cn(
            "hidden sm:block p-2 rounded-lg transition-colors",
            darkMode
              ? "hover:bg-slate-700 text-slate-400"
              : "hover:bg-slate-100 text-slate-500"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
});

StudyGuideHeader.displayName = 'StudyGuideHeader';

export default StudyGuideHeader;
