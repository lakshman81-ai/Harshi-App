import { ALL_SYMBOLS } from './constants';

/**
 * Replace Greek letters and mathematical operators with Unicode symbols
 * @param {string} text - Input text with LaTeX notation
 * @returns {string} - Text with Unicode replacements
 */
export function replaceSymbols(text) {
  if (!text) return '';

  let result = text;

  // Normalize double backslashes to single backslashes (handles JSON escaping from data sources)
  // This ensures \cdot and \\cdot are both handled correctly
  result = result.replace(/\\\\/g, '\\');

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(ALL_SYMBOLS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    result = result.split(key).join(ALL_SYMBOLS[key]);
  }

  return result;
}

/**
 * Extract content from braces, handling nested braces and escaped braces
 * @param {string} text - Input text starting after opening brace
 * @returns {{ content: string, remaining: string }} - Extracted content and remaining text
 */
function extractBraceContent(text) {
  let depth = 1;
  let i = 0;

  while (i < text.length && depth > 0) {
    // Check for escaped braces (e.g., \{ or \})
    if (i > 0 && text[i - 1] === '\\' && (text[i] === '{' || text[i] === '}')) {
      i++;
      continue;
    }
    // Also check if current char is backslash and next is brace
    if (text[i] === '\\' && i + 1 < text.length && (text[i + 1] === '{' || text[i + 1] === '}')) {
      i += 2;
      continue;
    }
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }

  return {
    content: text.slice(0, i - 1),
    remaining: text.slice(i)
  };
}

/**
 * Parse a formula string into an array of segments for rendering
 * @param {string} formula - Formula string with notation
 * @returns {Array} - Array of segment objects
 */
export function parseFormula(formula) {
  if (!formula || formula.trim() === '') return [];

  // First pass: replace simple symbols
  let processed = replaceSymbols(formula);

  const segments = [];
  let remaining = processed;

  while (remaining.length > 0) {
    let matched = false;

    // Try to match fraction: \frac{...}{...}
    const fracMatch = remaining.match(/^\\frac\{/);
    if (fracMatch) {
      // Extract numerator
      const afterFrac = remaining.slice(6); // Skip "\frac{"
      const numResult = extractBraceContent(afterFrac);

      // Check for denominator
      if (numResult.remaining.startsWith('{')) {
        const denResult = extractBraceContent(numResult.remaining.slice(1));

        segments.push({
          type: 'fraction',
          numerator: parseFormula(numResult.content),
          denominator: parseFormula(denResult.content)
        });

        remaining = denResult.remaining;
        matched = true;
      }
    }

    // Try to match square root: \sqrt{...}
    if (!matched) {
      const sqrtMatch = remaining.match(/^\\sqrt\{/);
      if (sqrtMatch) {
        const afterSqrt = remaining.slice(6); // Skip "\sqrt{"
        const contentResult = extractBraceContent(afterSqrt);

        segments.push({
          type: 'sqrt',
          content: parseFormula(contentResult.content)
        });

        remaining = contentResult.remaining;
        matched = true;
      }
    }

    // Try to match superscript: ^{...} or ^x
    if (!matched) {
      const supBraceMatch = remaining.match(/^\^\{/);
      if (supBraceMatch) {
        const afterSup = remaining.slice(2); // Skip "^{"
        const contentResult = extractBraceContent(afterSup);

        segments.push({
          type: 'superscript',
          content: parseFormula(contentResult.content)
        });

        remaining = contentResult.remaining;
        matched = true;
      } else {
        const supCharMatch = remaining.match(/^\^([a-zA-Z0-9+\-*/'°′″])/);
        if (supCharMatch) {
          segments.push({
            type: 'superscript',
            content: [{ type: 'text', content: supCharMatch[1] }]
          });

          remaining = remaining.slice(2);
          matched = true;
        }
      }
    }

    // Try to match subscript: _{...} or _x
    if (!matched) {
      const subBraceMatch = remaining.match(/^_\{/);
      if (subBraceMatch) {
        const afterSub = remaining.slice(2); // Skip "_{"
        const contentResult = extractBraceContent(afterSub);

        segments.push({
          type: 'subscript',
          content: parseFormula(contentResult.content)
        });

        remaining = contentResult.remaining;
        matched = true;
      } else {
        const subCharMatch = remaining.match(/^_([a-zA-Z0-9+\-*/'°′″])/);
        if (subCharMatch) {
          segments.push({
            type: 'subscript',
            content: [{ type: 'text', content: subCharMatch[1] }]
          });

          remaining = remaining.slice(2);
          matched = true;
        }
      }
    }

    // No special pattern matched, consume text until next special character
    if (!matched) {
      const nextSpecialIndex = remaining.search(/[\^_]|\\(frac|sqrt)/);

      if (nextSpecialIndex === -1) {
        // No more special characters, consume rest
        if (remaining.length > 0) {
          segments.push({ type: 'text', content: remaining });
        }
        remaining = '';
      } else if (nextSpecialIndex === 0) {
        // Handle unmatched patterns - consume one character
        segments.push({ type: 'text', content: remaining[0] });
        remaining = remaining.slice(1);
      } else {
        // Consume text before next special character
        segments.push({ type: 'text', content: remaining.slice(0, nextSpecialIndex) });
        remaining = remaining.slice(nextSpecialIndex);
      }
    }
  }

  // Merge adjacent text segments
  const mergedSegments = [];
  for (const segment of segments) {
    const last = mergedSegments[mergedSegments.length - 1];
    if (segment.type === 'text' && last && last.type === 'text') {
      last.content += segment.content;
    } else {
      mergedSegments.push(segment);
    }
  }

  return mergedSegments;
}

/**
 * Convert parsed formula back to plain text (for copying)
 * @param {Array} segments - Parsed segments
 * @returns {string} - Plain text representation
 */
export function segmentsToPlainText(segments) {
  if (!segments || !Array.isArray(segments)) return '';

  return segments.map(segment => {
    switch (segment.type) {
      case 'text':
        return segment.content;
      case 'superscript':
        return `^(${segmentsToPlainText(segment.content)})`;
      case 'subscript':
        return `_(${segmentsToPlainText(segment.content)})`;
      case 'fraction':
        return `(${segmentsToPlainText(segment.numerator)})/(${segmentsToPlainText(segment.denominator)})`;
      case 'sqrt':
        return `√(${segmentsToPlainText(segment.content)})`;
      default:
        return '';
    }
  }).join('');
}
