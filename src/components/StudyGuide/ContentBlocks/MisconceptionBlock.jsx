/**
 * MisconceptionBlock
 * Displays common student mistakes with corrections
 * 
 * @module MisconceptionBlock
 * @description Red accent for "wrong", Green for "correct"
 * @accessibility Uses icons + color for colorblind users
 */
import React from 'prop-types';
import PropTypes from 'prop-types';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const MisconceptionBlock = ({
    title,
    explanation,
    wrongExample,
    correctExample,
    darkMode = false,
}) => {
    return (
        <div className={`rounded-xl border-l-4 border-amber-500 overflow-hidden ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'
            }`}>
            {/* Header */}
            <div className={`flex items-center gap-2 px-4 py-3 ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <h3 className={`font-bold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    ⚠️ Common Mistake: {title}
                </h3>
            </div>

            {/* Explanation */}
            {explanation && (
                <p className={`px-4 py-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {explanation}
                </p>
            )}

            {/* Wrong vs Correct Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Wrong Example */}
                {wrongExample && (
                    <div className={`rounded-lg p-4 border ${darkMode
                            ? 'bg-red-900/30 border-red-800'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                            <span className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                                ❌ Wrong
                            </span>
                        </div>
                        <p className={darkMode ? 'text-red-300' : 'text-red-800'}>
                            {wrongExample}
                        </p>
                    </div>
                )}

                {/* Correct Example */}
                {correctExample && (
                    <div className={`rounded-lg p-4 border ${darkMode
                            ? 'bg-green-900/30 border-green-800'
                            : 'bg-green-50 border-green-200'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                            <span className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                                ✓ Correct
                            </span>
                        </div>
                        <p className={darkMode ? 'text-green-300' : 'text-green-800'}>
                            {correctExample}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

MisconceptionBlock.propTypes = {
    title: PropTypes.string.isRequired,
    explanation: PropTypes.string,
    wrongExample: PropTypes.string,
    correctExample: PropTypes.string,
    darkMode: PropTypes.bool,
};

export default MisconceptionBlock;
