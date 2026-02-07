import React, { memo } from 'react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * TextBlock Component
 * Renders introduction or plain text content
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const TextBlock = memo(({ content, darkMode }) => {
  if (!content?.text) return null;

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
    )}>
      {content.title && (
        <h3 className={cn(
          "text-lg font-bold mb-3",
          darkMode ? "text-white" : "text-slate-800"
        )}>
          {content.title}
        </h3>
      )}
      <p className={cn(
        "text-base leading-relaxed",
        darkMode ? "text-slate-300" : "text-slate-600"
      )}>
        {content.text}
      </p>
    </div>
  );
});

TextBlock.displayName = 'TextBlock';

export default TextBlock;
