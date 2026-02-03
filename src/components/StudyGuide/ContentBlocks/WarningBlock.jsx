import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * WarningBlock Component
 * Renders warning content with alert icon
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const WarningBlock = memo(({ content, darkMode }) => {
  if (!content?.text) return null;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-l-4",
        darkMode
          ? "bg-red-900/30 border-l-red-500"
          : "bg-red-50 border-l-red-500"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle
          className={cn("w-5 h-5", darkMode ? "text-red-400" : "text-red-600")}
        />
        <span
          className={cn("font-bold", darkMode ? "text-red-300" : "text-red-800")}
        >
          {content.title || 'Warning'}
        </span>
      </div>
      <p className={darkMode ? "text-red-200" : "text-red-900"}>
        {content.text}
      </p>
    </div>
  );
});

WarningBlock.displayName = 'WarningBlock';

export default WarningBlock;
