import React from 'react';
import { Printer, FileText, BookOpen, GitBranch, Lightbulb, AlertTriangle, Globe, Variable } from 'lucide-react';
import MathFormula from './MathFormula/index';
import { cn } from '../utils';

const HandoutInline = ({ subject, topic, objectives, terms, formulas, sections, studyContent, quizQuestions, darkMode }) => {
    const handlePrint = () => {
        window.print();
    };

    // Filter content for the handout (concepts, formulas, real world, flowcharts)
    const getSectionContent = (sectionId) => {
        const content = studyContent[sectionId] || [];
        return content.filter(c => ['formula', 'concept_helper', 'warning', 'real_world', 'flowchart', 'image', 'introduction', 'text'].includes(c.type));
    };

    // Get all content for this topic
    const allContent = sections.flatMap(section => {
        const content = getSectionContent(section.id);
        return content.map(c => ({ ...c, sectionTitle: section.title }));
    });

    return (
        <div className={cn("min-h-full", darkMode ? "bg-slate-900" : "bg-slate-50")}>
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-break {
                        page-break-before: always;
                    }
                }
            `}</style>

            {/* Toolbar */}
            <div className={cn("no-print sticky top-0 z-10 border-b px-4 sm:px-6 py-3", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", darkMode ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-700")}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>Study Handout</h2>
                            <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>{subject.name} - {topic.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handlePrint}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                            darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        )}
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Print / Download PDF</span>
                        <span className="sm:hidden">Print</span>
                    </button>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="print-content p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className={cn("border-b-2 pb-6", darkMode ? "border-slate-700" : "border-slate-900")}>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className={cn("text-3xl sm:text-4xl font-bold mb-2", darkMode ? "text-white" : "text-slate-900")}>{topic.name}</h1>
                                <p className={cn("text-lg sm:text-xl font-serif italic", darkMode ? "text-slate-400" : "text-slate-600")}>{subject.name} Study Guide</p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className={cn("text-sm", darkMode ? "text-slate-500" : "text-slate-400")}>Topic ID</div>
                                <div className={cn("font-mono font-bold", darkMode ? "text-slate-400" : "text-slate-600")}>{topic.id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-8">



                            {/* Key Concepts & Visuals */}
                            <section className="space-y-6">
                                <h3 className={cn("flex items-center gap-2 text-lg font-bold pb-2 border-b", darkMode ? "text-white border-slate-700" : "text-slate-900 border-slate-200")}>
                                    <Lightbulb className={cn("w-5 h-5", darkMode ? "text-amber-400" : "text-amber-500")} /> Key Concepts
                                </h3>

                                {sections.map(section => {
                                    const content = getSectionContent(section.id);
                                    if (content.length === 0) return null;

                                    return (
                                        <div key={section.id} className="mb-6">
                                            <h4 className={cn("font-bold mb-3", darkMode ? "text-slate-300" : "text-slate-800")}>{section.title}</h4>
                                            <div className="space-y-4">
                                                {content.map((item, idx) => (
                                                    <div key={idx} className={cn(
                                                        "p-4 rounded-xl border",
                                                        item.type === 'warning' ? darkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200" :
                                                            item.type === 'concept_helper' ? darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200" :
                                                                item.type === 'real_world' ? darkMode ? "bg-emerald-900/20 border-emerald-800" : "bg-emerald-50 border-emerald-200" :
                                                                    item.type === 'formula' ? darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800" :
                                                                        darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                                                    )}>
                                                        <div className="flex items-start gap-3">
                                                            {item.type === 'warning' && <AlertTriangle className={cn("w-5 h-5 shrink-0 mt-0.5", darkMode ? "text-red-400" : "text-red-500")} />}
                                                            {item.type === 'concept_helper' && <Lightbulb className={cn("w-5 h-5 shrink-0 mt-0.5", darkMode ? "text-blue-400" : "text-blue-500")} />}
                                                            {item.type === 'real_world' && <Globe className={cn("w-5 h-5 shrink-0 mt-0.5", darkMode ? "text-emerald-400" : "text-emerald-500")} />}
                                                            {item.type === 'flowchart' && <GitBranch className={cn("w-5 h-5 shrink-0 mt-0.5", darkMode ? "text-indigo-400" : "text-indigo-500")} />}
                                                            {(item.type === 'formula' || item.type === 'image') && <Variable className={cn("w-5 h-5 shrink-0 mt-0.5", item.type === 'formula' ? "text-white" : darkMode ? "text-slate-400" : "text-slate-500")} />}
                                                            {(item.type === 'introduction' || item.type === 'text') && <FileText className={cn("w-5 h-5 shrink-0 mt-0.5", darkMode ? "text-slate-400" : "text-slate-500")} />}

                                                            <div className="flex-1">
                                                                {item.title && <div className={cn("font-bold text-sm mb-1", item.type === 'formula' ? "text-blue-300" : darkMode ? "text-slate-300" : "text-slate-800")}>{item.title}</div>}

                                                                {/* Text Content */}
                                                                {item.type === 'formula' ? (
                                                                    <div className="py-2 flex justify-center">
                                                                        <MathFormula formula={item.text} size="large" />
                                                                    </div>
                                                                ) : (
                                                                    <div className={cn("text-sm leading-relaxed",
                                                                        item.type === 'warning' ? darkMode ? "text-red-200" : "text-red-800" :
                                                                            item.type === 'concept_helper' ? darkMode ? "text-blue-200" : "text-blue-800" :
                                                                                item.type === 'real_world' ? darkMode ? "text-emerald-200" : "text-emerald-800" :
                                                                                    darkMode ? "text-slate-300" : "text-slate-700"
                                                                    )}>{item.text}</div>
                                                                )}

                                                                {/* Visual Content */}
                                                                {(item.type === 'flowchart' || item.type === 'image') && item.imageUrl && (
                                                                    <div className={cn("mt-3 border rounded-lg overflow-hidden", darkMode ? "border-slate-600 bg-slate-700" : "border-slate-200 bg-white")}>
                                                                        <img src={item.imageUrl} alt={item.title} className="w-full h-auto max-h-60 object-contain mx-auto" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {allContent.length === 0 && (
                                    <div className={cn("text-center py-8 rounded-xl border", darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500")}>
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No key concepts available yet.</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-6">

                            {/* Key Terms */}
                            {terms.length > 0 && (
                                <section className={cn("rounded-xl p-6 border", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                                    <h3 className={cn("flex items-center gap-2 text-lg font-bold mb-4 pb-2 border-b", darkMode ? "text-white border-slate-700" : "text-slate-900 border-slate-200")}>
                                        <BookOpen className={cn("w-5 h-5", darkMode ? "text-indigo-400" : "text-indigo-600")} /> Vocabulary
                                    </h3>
                                    <div className="space-y-4">
                                        {terms.map((term, i) => (
                                            <div key={i}>
                                                <div className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>{term.term}</div>
                                                <div className={cn("text-sm", darkMode ? "text-slate-400" : "text-slate-600")}>{term.definition}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Equations Sheet */}
                            {formulas.length > 0 && (
                                <section className={cn("rounded-xl p-6 border", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800 text-white")}>
                                    <h3 className={cn("flex items-center gap-2 text-lg font-bold mb-4 pb-2 border-b", darkMode ? "text-white border-slate-700" : "text-white border-slate-700")}>
                                        <Variable className={cn("w-5 h-5", darkMode ? "text-teal-400" : "text-teal-400")} /> Equations
                                    </h3>
                                    <div className="space-y-4">
                                        {formulas.map((f, i) => (
                                            <div key={i} className="text-center">
                                                <div className={cn("text-xs mb-1", darkMode ? "text-slate-400" : "text-slate-400")}>{f.label}</div>
                                                <div className={cn("rounded p-2", darkMode ? "bg-slate-700" : "bg-white/10")}>
                                                    <MathFormula formula={f.formula || f.text} size="medium" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default HandoutInline;
