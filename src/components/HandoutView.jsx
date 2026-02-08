import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, ChevronLeft, ChevronRight, Download, Image as ImageIcon } from 'lucide-react';
import MathFormula from './MathFormula';
import { cn } from '../utils';
import { csvService } from '../services/unifiedDataService'; // Explicit import

/**
 * HandoutView Component
 * Updated to support Multi-page navigation (PDF/CSV) similar to Study Guide.
 */
const HandoutView = ({ subject, topic, objectives, terms, formulas, sections, studyContent, quizQuestions, onClose }) => {

    // --- State for Multi-page ---
    const [pages, setPages] = useState([]);
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [pageContent, setPageContent] = useState([]);
    const [loading, setLoading] = useState(true);

    const topicFolder = topic?.folder || topic?.topic_folder || topic?.id;

    // Load Handout Index
    useEffect(() => {
        const loadIndex = async () => {
            setLoading(true);
            try {
                // Try loading new Handout index first
                const indexData = await csvService.loadHandoutIndex(subject.subject_key, topicFolder);

                if (indexData && indexData.length > 0) {
                    setPages(indexData);
                } else {
                    // Fallback: Create a single "Summary" page with existing content logic
                    setPages([{
                        page_id: 'summary',
                        page_title: 'Topic Summary',
                        page_file: 'legacy', // Special flag
                        order_index: 1
                    }]);
                }
            } catch (e) {
                console.error("Error loading handout index:", e);
                // Fallback
                setPages([{ page_id: 'summary', page_title: 'Topic Summary', page_file: 'legacy', order_index: 1 }]);
            } finally {
                setLoading(false);
            }
        };

        if (subject && topicFolder) {
            loadIndex();
        }
    }, [subject, topicFolder]);

    // Load Content for Active Page
    useEffect(() => {
        const loadContent = async () => {
            const currentPage = pages[activePageIndex];
            if (!currentPage) return;

            if (currentPage.page_file === 'legacy') {
                // No fetch needed, we use props
                setPageContent([]);
                return;
            }

            if (currentPage.page_file && currentPage.page_file.toLowerCase().endsWith('.csv')) {
                try {
                    const content = await csvService.loadHandoutPage(subject.subject_key, topicFolder, currentPage.page_file);
                    setPageContent(content);
                } catch (e) {
                    console.error("Failed to load handout page content", e);
                    setPageContent([]);
                }
            } else {
                // PDF/Doc - no content array needed
                setPageContent([]);
            }
        };

        loadContent();
    }, [activePageIndex, pages, subject, topicFolder]);


    const handlePrint = () => {
        window.print();
    };

    const handlePrev = () => {
        if (activePageIndex > 0) setActivePageIndex(prev => prev - 1);
    };

    const handleNext = () => {
        if (activePageIndex < pages.length - 1) setActivePageIndex(prev => prev + 1);
    };

    const currentPage = pages[activePageIndex];

    // --- Render Logic ---

    const renderLegacyContent = () => {
        // Filter content for the handout (concepts, formulas, real world, flowcharts)
        // This preserves the old logic for fallback
        const getSectionContent = (sectionId) => {
            const content = studyContent[sectionId] || [];
            return content.filter(c => ['formula', 'concept_helper', 'warning', 'real_world', 'flowchart', 'image'].includes(c.type));
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8 print:w-full">
                    <section className="space-y-6">
                        {sections.map(section => {
                            const content = getSectionContent(section.id);
                            if (content.length === 0) return null;

                            return (
                                <div key={section.id} className="mb-6 break-inside-avoid">
                                    <h4 className="font-bold text-slate-800 mb-3">{section.title}</h4>
                                    <div className="space-y-4">
                                        {content.map((item, idx) => (
                                            <div key={idx} className={cn(
                                                "p-4 rounded-xl border break-inside-avoid",
                                                item.type === 'warning' ? "bg-red-50 border-red-200" :
                                                    item.type === 'concept_helper' ? "bg-blue-50 border-blue-200" :
                                                        item.type === 'real_world' ? "bg-emerald-50 border-emerald-200" :
                                                            "bg-slate-50 border-slate-200"
                                            )}>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        {item.title && <div className="font-bold text-sm mb-1 opacity-80">{item.title}</div>}
                                                        <div className="text-slate-800 text-sm leading-relaxed">{item.text}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </div>
                 {/* Sidebar Column */}
                 <div className="space-y-8 print:w-full print:mt-8">
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <h3 className="font-bold mb-2">Terms</h3>
                        {terms.map((t, i) => <div key={i}><b className="text-sm">{t.term}:</b> <span className="text-sm">{t.definition}</span></div>)}
                     </div>
                 </div>
            </div>
        );
    };

    const renderPageContent = () => {
        if (!currentPage) return null;

        if (currentPage.page_file === 'legacy') {
            return renderLegacyContent();
        }

        const fileType = currentPage.page_file?.split('.').pop()?.toLowerCase();

        // PDF Handling
        if (fileType === 'pdf') {
            const subjectName = subject.subject_key.charAt(0).toUpperCase() + subject.subject_key.slice(1);
            const pdfPath = `${process.env.PUBLIC_URL || ''}/${subjectName}/${topicFolder}/Handout/Pages/${currentPage.page_file}`;
            return (
                <div className="h-[800px] w-full border rounded-xl overflow-hidden shadow-sm bg-slate-100">
                    <iframe src={pdfPath} className="w-full h-full" title={currentPage.page_title} />
                </div>
            );
        }

        // CSV Content Handling
        if (fileType === 'csv') {
             return (
                <div className="space-y-6 max-w-4xl mx-auto">
                    {pageContent.map((item, idx) => (
                        <div key={idx} className="p-6 bg-white border rounded-xl shadow-sm break-inside-avoid">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.content_title || item.title}</h3>

                            {item.content_type === 'image' || item.image_url ? (
                                <div className="mb-4">
                                    <img
                                        src={item.image_url || item.url}
                                        alt={item.content_title}
                                        className="rounded-lg max-h-64 object-contain border bg-slate-50"
                                    />
                                </div>
                            ) : null}

                            <div className="prose prose-slate max-w-none">
                                <p className="whitespace-pre-line text-slate-700">{item.content_text || item.text}</p>
                            </div>
                        </div>
                    ))}
                    {pageContent.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <p>Loading content...</p>
                        </div>
                    )}
                </div>
             );
        }

        // Fallback
        return <div className="p-8 text-center">Unsupported file type: {fileType}</div>;
    };


    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 print:p-0 print:bg-white print:overflow-visible print:block">
            <div className="bg-white w-full max-w-5xl min-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none print:h-auto">

                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b print:hidden sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">{topic.name}</h2>
                            <p className="text-xs text-slate-500">Handout • Page {activePageIndex + 1} of {pages.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 flex flex-col">

                    {/* Pagination Controls (Top) */}
                    {pages.length > 1 && (
                        <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-b print:hidden">
                            <button
                                onClick={handlePrev}
                                disabled={activePageIndex === 0}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>

                            <div className="flex gap-2">
                                {pages.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActivePageIndex(i)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            i === activePageIndex ? "bg-blue-600 w-4" : "bg-slate-300 hover:bg-slate-400"
                                        )}
                                        title={p.page_title}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={activePageIndex === pages.length - 1}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-600 transition-colors"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="flex-1 p-8 md:p-12 print:p-8 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            renderPageContent()
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HandoutView;
