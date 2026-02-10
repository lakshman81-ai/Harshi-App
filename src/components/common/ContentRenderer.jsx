import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import ReactPlayer from 'react-player';
import { MermaidDiagram } from '../MermaidDiagram';

// Helper to detect if a URL is YouTube
const isYouTube = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
};

// Helper to detect PDF
const isPDF = (url) => {
  return url && url.toLowerCase().endsWith('.pdf');
};

const ContentRenderer = memo(({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override link rendering for embeds
          a: ({ node, href, children, ...props }) => {
            if (isYouTube(href)) {
              return (
                <div className="my-4 aspect-video rounded-xl overflow-hidden shadow-lg">
                  <ReactPlayer url={href} width="100%" height="100%" controls />
                </div>
              );
            }
            if (isPDF(href)) {
              return (
                <div className="my-4 h-96 w-full border rounded-xl overflow-hidden shadow-lg">
                  <iframe src={href} title="PDF Viewer" width="100%" height="100%" />
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block text-center text-sm p-2 bg-slate-100 dark:bg-slate-800 hover:underline">
                    Download PDF
                  </a>
                </div>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" {...props}>{children}</a>;
          },
          // Override code block for Mermaid
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isMermaid = match && match[1] === 'mermaid';

            if (!inline && isMermaid) {
              return (
                <div className="my-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-x-auto">
                  <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                </div>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Enhance images
          img: ({ node, ...props }) => (
            <img {...props} className="rounded-xl shadow-md max-w-full h-auto mx-auto my-4" loading="lazy" alt={props.alt || 'Content image'} />
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border dark:border-slate-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>,
          th: ({ children }) => <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

ContentRenderer.displayName = 'ContentRenderer';

export default ContentRenderer;
