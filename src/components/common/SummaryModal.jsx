import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { X, Copy, Loader, Brain, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../utils';

const SummaryModal = ({ isOpen, onClose, isLoading, content, error, darkMode }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] flex flex-col transform transition-all scale-100",
                    darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={cn("p-4 border-b flex items-center justify-between shrink-0", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-100 text-purple-600")}>
                            <Brain className="w-5 h-5" />
                        </div>
                        <h3 className={cn("font-bold text-lg", darkMode ? "text-white" : "text-slate-800")}>
                            AI Summary
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn("p-2 rounded-lg transition-colors", darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                            <Loader className="w-8 h-8 animate-spin text-purple-500" />
                            <p className={cn("text-sm animate-pulse font-medium", darkMode ? "text-slate-400" : "text-slate-500")}>
                                Analyzing content...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center py-12">
                            <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className={cn("font-bold mb-1 text-lg", darkMode ? "text-white" : "text-slate-900")}>Generation Failed</h4>
                                <p className={cn("text-sm max-w-xs mx-auto", darkMode ? "text-slate-400" : "text-slate-500")}>
                                    {error}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "prose prose-sm max-w-none",
                            darkMode
                                ? "prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white"
                                : "prose-slate prose-p:text-slate-600 prose-headings:text-slate-800"
                        )}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={cn("p-4 border-t flex justify-end gap-3 shrink-0", darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50")}>
                    {!isLoading && !error && content && (
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                                copied
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : darkMode
                                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copied' : 'Copy Text'}</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

SummaryModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    content: PropTypes.string,
    error: PropTypes.string,
    darkMode: PropTypes.bool
};

export default SummaryModal;
