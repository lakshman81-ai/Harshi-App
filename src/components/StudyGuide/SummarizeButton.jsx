import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { cn } from '../../utils';
import PropTypes from 'prop-types';

/**
 * SummarizeButton Component
 * Translucent button that copies study content to clipboard for AI summarization
 * 
 * @param {Object} props
 * @param {string} props.sectionTitle - Current section title
 * @param {Array} props.sectionContent - Content blocks to summarize
 * @param {boolean} props.darkMode - Dark mode flag
 */
const SummarizeButton = ({ sectionTitle, sectionContent, darkMode }) => {
    const [showToast, setShowToast] = useState(false);

    const handleSummarize = async () => {
        // Extract text from content blocks
        let contentText = `Topic: ${sectionTitle}\n\n`;

        if (Array.isArray(sectionContent)) {
            sectionContent.forEach((block, idx) => {
                if (block.type === 'text' && block.content) {
                    contentText += `${block.content}\n\n`;
                } else if (block.text) {
                    contentText += `${block.text}\n\n`;
                } else if (typeof block === 'string') {
                    contentText += `${block}\n\n`;
                }
            });
        }

        // Build AI-ready prompt
        const prompt = `Please summarize the following educational content for a Grade 8 student:\n\n${contentText}\n\nProvide:\n1. Key concepts (3-5 bullet points)\n2. Simple explanation\n3. Real-world example`;

        try {
            await navigator.clipboard.writeText(prompt);

            // Construct URL with query summary
            // Truncate to avoid URL length limits (~2000 chars safe limit)
            const MAX_URL_LENGTH = 1800;
            const encodedPrompt = encodeURIComponent(prompt.slice(0, MAX_URL_LENGTH));
            const url = `https://www.perplexity.ai/search?q=${encodedPrompt}`;

            // Open Perplexity in new tab with pre-filled query
            window.open(url, '_blank');

            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            const MAX_URL_LENGTH = 1800;
            const encodedPrompt = encodeURIComponent(prompt.slice(0, MAX_URL_LENGTH));
            const url = `https://www.perplexity.ai/search?q=${encodedPrompt}`;

            window.open(url, '_blank');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    return (
        <>
            <button
                onClick={handleSummarize}
                className={cn(
                    "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border",
                    darkMode
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/50 hover:bg-purple-500/20"
                        : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                )}
                title="Copy & Open AI Tool"
            >
                <Brain className="w-4 h-4" />
                <span>Summarize</span>
            </button>

            {/* Toast Notification */}
            {showToast && (
                <div className={cn(
                    "fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-up",
                    darkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800 border border-slate-200"
                )}>
                    <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Content Copied!</span>
                    </div>
                    <p className={cn("text-xs mt-1", darkMode ? "text-slate-400" : "text-slate-600")}>
                        Opening Perplexity... Paste (Ctrl+V) to summarize.
                    </p>
                </div>
            )}
        </>
    );

};

SummarizeButton.propTypes = {
    sectionTitle: PropTypes.string.isRequired,
    sectionContent: PropTypes.array.isRequired,
    darkMode: PropTypes.bool
};

SummarizeButton.defaultProps = {
    darkMode: false
};

export default SummarizeButton;
