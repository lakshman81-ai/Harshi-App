import React, { memo } from 'react';
import { Target, Check } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ObjectivesBlock Component
 * Renders learning objectives with checkmarks
 *
 * @param {Object} props
 * @param {Array} props.objectives - Array of objective objects { id, text }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const ObjectivesBlock = memo(({ objectives, darkMode }) => {
  if (!objectives || objectives.length === 0) return null;

  return (
    <div
      className={cn(
        "objectives-block rounded-2xl p-6 border mb-8",
        darkMode
          ? "bg-indigo-900/30 border-indigo-700"
          : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target
          className={cn("w-6 h-6", darkMode ? "text-indigo-400" : "text-indigo-600")}
        />
        <h2
          className={cn(
            "text-lg font-bold",
            darkMode ? "text-indigo-300" : "text-indigo-800"
          )}
        >
          After this lesson, you will be able to:
        </h2>
      </div>
      <ul className="space-y-3">
        {objectives.map((obj, i) => (
          <li key={obj.id || i} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className={darkMode ? "text-indigo-200" : "text-indigo-800"}>
              {obj.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

ObjectivesBlock.displayName = 'ObjectivesBlock';

export default ObjectivesBlock;
