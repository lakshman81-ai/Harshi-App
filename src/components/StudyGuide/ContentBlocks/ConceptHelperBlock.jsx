import React, { memo } from 'react';
import { Lightbulb } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ConceptHelperBlock Component
 * Renders concept helper/tip content with lightbulb icon
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const ConceptHelperBlock = memo(({ content, darkMode }) => {
  if (!content?.text) return null;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-l-4",
        darkMode
          ? "bg-blue-900/30 border-l-blue-500"
          : "bg-blue-50 border-l-blue-500"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb
          className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")}
        />
        <span
          className={cn("font-bold", darkMode ? "text-blue-300" : "text-blue-800")}
        >
          {content.title || 'Concept Helper'}
        </span>
      </div>
      <p className={darkMode ? "text-blue-200" : "text-blue-900"}>
        {content.text}
      </p>
    </div>
  );
});

ConceptHelperBlock.displayName = 'ConceptHelperBlock';

export default ConceptHelperBlock;
