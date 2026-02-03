import React from 'react';
import { X, Printer, FileText, Target, BookOpen, GitBranch, Lightbulb, AlertTriangle, Globe, HelpCircle, Variable } from 'lucide-react';
import MathFormula from './MathFormula';
import { cn } from '../utils';

const HandoutView = ({ subject, topic, objectives, terms, formulas, sections, studyContent, quizQuestions, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    // Filter content for the handout (concepts, formulas, real world, flowcharts)
    const getSectionContent = (sectionId) => {
        const content = studyContent[sectionId] || [];
        return content.filter(c => ['formula', 'concept_helper', 'warning', 'real_world', 'flowchart', 'image'].includes(c.type));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 print:p-0 print:bg-white print:overflow-visible print:block">
            <div className="bg-white w-full max-w-4xl min-h-[calc(100vh-2rem)] rounded-2xl shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none print:h-auto">
                {/* Toolbar - Hidden when printing */}
                <div className="flex items-center justify-between p-4 border-b print:hidden sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Study Handout</h2>
                            <p className="text-xs text-slate-500">{subject.name} • {topic.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 md:p-12 print:p-8 space-y-8">
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">{topic.name}</h1>
                                <p className="text-xl text-slate-600 font-serif italic">{subject.name} Study Guide</p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <div className="text-sm text-slate-400">Topic ID</div>
                                <div className="font-mono font-bold text-slate-600">{topic.id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-8 print:w-full">



                            {/* Key Concepts & Visuals */}
                            <section className="space-y-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4 border-b pb-2 break-after-avoid">
                                    <Lightbulb className="w-5 h-5 text-amber-500" /> Key Concepts
                                </h3>

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
                                                            {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                                                            {item.type === 'concept_helper' && <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
                                                            {item.type === 'real_world' && <Globe className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                                                            {item.type === 'flowchart' && <GitBranch className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />}
                                                            {(item.type === 'formula' || item.type === 'image') && <Variable className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />}

                                                            <div className="flex-1">
                                                                {item.title && <div className="font-bold text-sm mb-1 opacity-80">{item.title}</div>}

                                                                {/* Text Content */}
                                                                {item.type === 'formula' ? (
                                                                    <div className="py-2 flex justify-center">
                                                                        <MathFormula formula={item.text} size="large" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-800 text-sm leading-relaxed">{item.text}</div>
                                                                )}

                                                                {/* Visual Content */}
                                                                {(item.type === 'flowchart' || item.type === 'image') && item.imageUrl && (
                                                                    <div className="mt-3 border rounded-lg overflow-hidden bg-white">
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
                            </section>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-8 print:w-full print:mt-8">

                            {/* Key Terms */}
                            <section className="bg-slate-50 rounded-xl p-6 border break-inside-avoid">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                                    <BookOpen className="w-5 h-5 text-indigo-600" /> Vocabulary
                                </h3>
                                <div className="space-y-4">
                                    {terms.map((term, i) => (
                                        <div key={i}>
                                            <div className="font-bold text-slate-800">{term.term}</div>
                                            <div className="text-sm text-slate-600">{term.definition}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Equations Sheet */}
                            {formulas.length > 0 && (
                                <section className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 break-inside-avoid print:bg-white print:text-black print:border-slate-300">
                                    <h3 className="flex items-center gap-2 text-lg font-bold mb-4 border-b border-slate-700 pb-2 print:border-slate-300">
                                        <Variable className="w-5 h-5 text-teal-400 print:text-teal-600" /> Equations
                                    </h3>
                                    <div className="space-y-4">
                                        {formulas.map((f, i) => (
                                            <div key={i} className="text-center">
                                                <div className="text-xs text-slate-400 mb-1 print:text-slate-500">{f.label}</div>
                                                <div className="bg-white/10 rounded p-2 print:bg-slate-100">
                                                    <MathFormula formula={f.text} size="medium" />
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

export default HandoutView;
