import React, { memo, useMemo } from 'react';
import { parseFormula } from './parser';
import { SIZE_CLASSES } from './constants';

// Utility for combining class names
const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * Render a single parsed segment
 * @param {Object} segment - Parsed segment object
 * @param {number} index - Index for React key
 * @returns {JSX.Element} - Rendered segment
 */
function renderSegment(segment, index) {
  switch (segment.type) {
    case 'text':
      return <span key={index}>{segment.content}</span>;

    case 'superscript':
      return (
        <sup key={index} className="text-[0.65em] relative -top-[0.4em]">
          {segment.content.map((s, i) => renderSegment(s, i))}
        </sup>
      );

    case 'subscript':
      return (
        <sub key={index} className="text-[0.65em] relative top-[0.15em]">
          {segment.content.map((s, i) => renderSegment(s, i))}
        </sub>
      );

    case 'fraction':
      return (
        <span
          key={index}
          className="inline-flex flex-col items-center justify-center mx-1 align-middle"
          style={{ verticalAlign: 'middle' }}
        >
          <span className="px-1 text-[0.75em] leading-tight border-b border-current pb-0.5">
            {segment.numerator.map((s, i) => renderSegment(s, i))}
          </span>
          <span className="px-1 text-[0.75em] leading-tight pt-0.5">
            {segment.denominator.map((s, i) => renderSegment(s, i))}
          </span>
        </span>
      );

    case 'sqrt':
      return (
        <span key={index} className="inline-flex items-baseline">
          <span className="text-[1.1em] mr-px">√</span>
          <span
            className="border-t border-current px-0.5"
            style={{ borderTopWidth: '1.5px', paddingTop: '1px' }}
          >
            {segment.content.map((s, i) => renderSegment(s, i))}
          </span>
        </span>
      );

    default:
      return null;
  }
}

/**
 * MathFormula Component
 * Renders mathematical formulas with proper formatting (superscripts, subscripts, fractions, Greek letters)
 *
 * @param {Object} props
 * @param {string} props.formula - Formula string with notation
 * @param {'small'|'medium'|'large'} props.size - Display size (default: 'medium')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.color - Text color (optional)
 */
const MathFormula = memo(({ formula, size = 'medium', className, color }) => {
  // Parse formula into segments
  const segments = useMemo(() => parseFormula(formula), [formula]);

  // Return null for empty formulas
  if (!formula || formula.trim() === '' || segments.length === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "font-mono font-semibold tracking-wide inline-flex items-baseline flex-wrap",
        SIZE_CLASSES[size] || SIZE_CLASSES.medium,
        className
      )}
      style={color ? { color } : undefined}
    >
      {segments.map((segment, index) => renderSegment(segment, index))}
    </span>
  );
});

MathFormula.displayName = 'MathFormula';

export default MathFormula;
export { parseFormula, SIZE_CLASSES };
