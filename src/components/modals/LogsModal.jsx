import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Trash2, Terminal, AlertTriangle, AlertCircle, Info, Activity, ShieldCheck, Check } from 'lucide-react';
import { Logger } from '../../services/Logger';
import { cn } from '../../utils';

const LogIcon = ({ level, className }) => {
    switch (level) {
        case 'ERROR': return <AlertCircle className={cn("text-red-500", className)} />;
        case 'WARN': return <AlertTriangle className={cn("text-amber-500", className)} />;
        case 'ACTION': return <Activity className={cn("text-purple-500", className)} />;
        case 'GATE': return <ShieldCheck className={cn("text-emerald-500", className)} />;
        default: return <Info className={cn("text-blue-500", className)} />;
    }
};

const LogEntry = ({ log, darkMode }) => {
    const isError = log.level === 'ERROR';

    return (
        <div className={cn(
            "p-3 rounded-lg border text-sm font-mono mb-2 transition-colors",
            darkMode
                ? "bg-slate-900 border-slate-700 hover:bg-slate-800"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100",
            isError && (darkMode ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-200")
        )}>
            <div className="flex items-start gap-3">
                <LogIcon level={log.level} className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded",
                            log.level === 'ERROR' ? "bg-red-100 text-red-700" :
                            log.level === 'WARN' ? "bg-amber-100 text-amber-700" :
                            log.level === 'ACTION' ? "bg-purple-100 text-purple-700" :
                            log.level === 'GATE' ? "bg-emerald-100 text-emerald-700" :
                            "bg-blue-100 text-blue-700"
                        )}>
                            {log.level}
                        </span>
                        <span className={cn("text-xs", darkMode ? "text-slate-500" : "text-slate-400")}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                    </div>

                    <div className={cn("break-words whitespace-pre-wrap", darkMode ? "text-slate-200" : "text-slate-800")}>
                        {log.message}
                    </div>

                    {log.data && (
                        <div className={cn(
                            "mt-2 p-2 rounded text-xs overflow-x-auto",
                            darkMode ? "bg-black/30 text-slate-300" : "bg-white border text-slate-600"
                        )}>
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LogsModal = ({ onClose, darkMode }) => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('ALL'); // ALL, ERROR, ACTION, GATE
    const [copied, setCopied] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        // Initial logs
        setLogs([...Logger.getLogs()]);

        // Subscribe to new logs
        const unsubscribe = Logger.subscribe((newLogs) => {
            setLogs([...newLogs]);
        });

        return unsubscribe;
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        return log.level === filter;
    });

    const handleCopy = () => {
        const text = logs.map(l =>
            `[${l.timestamp}] [${l.level}] ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`
        ).join('\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        if (window.confirm('Clear all logs?')) {
            Logger.clear();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div
                className={cn(
                    "w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh]",
                    darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={cn("p-4 border-b flex items-center justify-between shrink-0", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className={cn("text-lg font-bold", darkMode ? "text-white" : "text-slate-800")}>
                                System Logs & Workflow
                            </h2>
                            <p className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>
                                {logs.length} events recorded
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                            {['ALL', 'ERROR', 'ACTION', 'GATE'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                        filter === f
                                            ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                copied
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>

                        <button
                            onClick={handleClear}
                            className={cn("p-2 rounded-lg transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20")}
                            title="Clear Logs"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onClose}
                            className={cn("p-2 rounded-lg transition-colors", darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Log Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Terminal className="w-12 h-12 mb-2 opacity-20" />
                            <p>No logs found for this filter</p>
                        </div>
                    ) : (
                        filteredLogs.map((log, i) => (
                            <LogEntry key={`${log.timestamp}-${i}`} log={log} darkMode={darkMode} />
                        ))
                    )}
                    <div ref={endRef} />
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569;
                }
            `}</style>
        </div>
    );
};

export default LogsModal;
