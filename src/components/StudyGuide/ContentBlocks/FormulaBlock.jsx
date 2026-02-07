import React, { memo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import MathFormula from '../../MathFormula';

/**
 * FormulaBlock Component
 * Renders mathematical formulas with variables legend and copy button
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text }
 * @param {Object} props.formula - Formula object with variables
 * @param {boolean} props.darkMode - Dark mode flag
 */
const FormulaBlock = memo(({ content, formula, darkMode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = formula?.formula || content?.text || '';
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get display formula (use formulaDisplay if available, fallback to formula/text)
  const displayFormula = formula?.formulaDisplay || formula?.formula || content?.text || '';
  const variables = formula?.variables || [];
  const label = formula?.label || content?.title || '';

  return (
    <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

      <div className="relative">
        {/* Label */}
        {label && (
          <p className="text-blue-300 text-sm font-medium mb-4">{label}</p>
        )}

        {/* Formula Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <MathFormula
            formula={displayFormula}
            size="large"
            className="text-white"
          />
        </div>

        {/* Variables Legend */}
        {variables.length > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            {variables.map((v, j) => {
              const colors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400'];
              return (
                <div key={j}>
                  <MathFormula
                    formula={v.symbol}
                    size="medium"
                    className={colors[j % colors.length]}
                  />
                  <div className="text-sm text-slate-400 mt-1">{v.name}</div>
                  {v.unit && (
                    <div className="text-xs text-slate-500">({v.unit})</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy equation
            </>
          )}
        </button>
      </div>
    </div>
  );
});

FormulaBlock.displayName = 'FormulaBlock';

export default FormulaBlock;
