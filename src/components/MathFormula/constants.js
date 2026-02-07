// Greek letters mapping (LaTeX notation to Unicode)
export const GREEK_LETTERS = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\Delta': 'Δ',
  '\\epsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\Theta': 'Θ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\Lambda': 'Λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\Xi': 'Ξ',
  '\\pi': 'π',
  '\\Pi': 'Π',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\Sigma': 'Σ',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'φ',
  '\\Phi': 'Φ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\Psi': 'Ψ',
  '\\omega': 'ω',
  '\\Omega': 'Ω'
};

// Mathematical operators mapping
export const MATH_OPERATORS = {
  '\\times': '×',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\neq': '≠',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\infty': '∞',
  '\\sum': 'Σ',
  '\\prod': 'Π',
  '\\sqrt': '√',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\cdot': '·',
  '\\bullet': '•',
  '\\degree': '°',
  '\\circ': '°',
  '\\prime': '′',
  '\\dprime': '″',
  // Calculus and limits
  '\\int': '∫',
  '\\oint': '∮',
  '\\lim': 'lim',
  // Trigonometric functions
  '\\sin': 'sin',
  '\\cos': 'cos',
  '\\tan': 'tan',
  // Logarithms
  '\\log': 'log',
  '\\ln': 'ln',
  // Set theory and logic
  '\\forall': '∀',
  '\\exists': '∃',
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\supset': '⊃',
  '\\cup': '∪',
  '\\cap': '∩'
};

// Arrow symbols
export const ARROWS = {
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\leftrightarrow': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\uparrow': '↑',
  '\\downarrow': '↓',
  '\\mapsto': '↦'
};

// Size classes for formula display
export const SIZE_CLASSES = {
  small: 'text-base sm:text-lg',
  medium: 'text-xl sm:text-2xl',
  large: 'text-3xl sm:text-4xl lg:text-5xl'
};

// Combine all replacements for simple text replacement
export const ALL_SYMBOLS = {
  ...GREEK_LETTERS,
  ...MATH_OPERATORS,
  ...ARROWS
};
