import React, { memo } from 'react';
import { Globe } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * RealWorldBlock Component
 * Renders real-world application content with globe icon
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const RealWorldBlock = memo(({ content, darkMode }) => {
  if (!content?.text) return null;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-l-4",
        darkMode
          ? "bg-emerald-900/30 border-l-emerald-500"
          : "bg-emerald-50 border-l-emerald-500"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Globe
          className={cn("w-5 h-5", darkMode ? "text-emerald-400" : "text-emerald-600")}
        />
        <span
          className={cn("font-bold", darkMode ? "text-emerald-300" : "text-emerald-800")}
        >
          {content.title || 'Real-World Application'}
        </span>
      </div>
      <p className={darkMode ? "text-emerald-200" : "text-emerald-900"}>
        {content.text}
      </p>
    </div>
  );
});

RealWorldBlock.displayName = 'RealWorldBlock';

export default RealWorldBlock;
