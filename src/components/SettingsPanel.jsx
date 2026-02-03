import React, { useState } from 'react';
import { X, Settings, Moon, Volume2, Database, RefreshCw, AlertTriangle, FileSpreadsheet, Key, Eye, EyeOff, Bot, Sparkles, Download, Check, ExternalLink } from 'lucide-react';
import { useStudy } from '../contexts/StudyContext';
import { useData } from '../contexts/DataContext';
import { cn } from '../utils';
import { validateApiKey } from '../services/geminiService';
import { ContentGenerator } from '../services/ContentGenerator';
import { ExcelExporter } from '../services/ExcelExporter';

const SettingsPanel = ({ onClose }) => {
    const { settings, updateSettings, toggleDarkMode } = useStudy();
    const {
        dataSource,
        updateDataSource,
        isGoogleSheetsConfigured,
        refresh,
        isRefreshing,
        lastSync,
        syncStatus
    } = useData();

    const darkMode = settings.darkMode;

    const [tempApiKey, setTempApiKey] = useState(settings.geminiApiKey || '');
    const [tempSheetUrls, setTempSheetUrls] = useState({
        math: settings.sheetUrl_math || '',
        physics: settings.sheetUrl_physics || '',
        chemistry: settings.sheetUrl_chemistry || '',
        biology: settings.sheetUrl_biology || ''
    });
    const [showApiKey, setShowApiKey] = useState(false);

    // AI Generator State
    const [apiStatus, setApiStatus] = useState('idle');
    const [genSubject, setGenSubject] = useState('Math');
    const [genTopics, setGenTopics] = useState('');
    const [genSubtopics, setGenSubtopics] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSave = (type) => {
        if (type === 'api') {
            updateSettings({ geminiApiKey: tempApiKey });
        } else if (type === 'sheets') {
            updateSettings({
                sheetUrl_math: tempSheetUrls.math,
                sheetUrl_physics: tempSheetUrls.physics,
                sheetUrl_chemistry: tempSheetUrls.chemistry,
                sheetUrl_biology: tempSheetUrls.biology
            });
        }
    };

    const handleTestApi = async () => {
        if (!tempApiKey) return;
        setApiStatus('testing');
        const isValid = await validateApiKey(tempApiKey);
        setApiStatus(isValid ? 'valid' : 'invalid');
        setTimeout(() => setApiStatus('idle'), 3000);
    };

    const handleGenerate = async () => {
        if (!genTopics) return;
        setIsGenerating(true);
        try {
            const data = ContentGenerator.generateContent(genSubject, genTopics, genSubtopics);
            ExcelExporter.exportToExcel(data, `${genSubject}_Study_Data.xlsx`);
        } catch (error) {
            console.error(error);
            alert('Failed to generate content: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "w-full max-w-4xl rounded-2xl shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto",
                    darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={cn("p-6 border-b flex items-center justify-between", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <h2 className={cn("text-xl font-bold flex items-center gap-2", darkMode ? "text-white" : "text-slate-800")}>
                        <Settings className="w-5 h-5 text-indigo-500" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className={cn("p-2 rounded-lg transition-colors", darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Appearance & Sound */}
                    <section className="space-y-4">
                        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-400")}>
                            Preferences
                        </h3>



                        {/* Sound Effects */}
                        <div className={cn("p-4 rounded-xl flex items-center justify-between", darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100")}>
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", darkMode ? "bg-slate-700 text-blue-400" : "bg-white text-blue-600 shadow-sm")}>
                                    <Volume2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={cn("font-medium", darkMode ? "text-white" : "text-slate-900")}>Sound Effects</div>
                                    <div className={cn("text-xs", darkMode ? "text-slate-400" : "text-slate-500")}>UI and achievement sounds</div>
                                </div>
                            </div>
                            <button
                                onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    settings.soundEffects ? "bg-indigo-600" : "bg-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                    settings.soundEffects ? "left-7" : "left-1"
                                )} />
                            </button>
                        </div>
                    </section>

                    {/* AI & Integration */}
                    <section className="space-y-4">
                        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-400")}>
                            AI & Integration
                        </h3>

                        {/* Gemini API Key */}
                        <div className={cn("p-4 rounded-xl space-y-3", darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100")}>
                            <div className="flex items-center gap-3 mb-1">
                                <Key className={cn("w-5 h-5", darkMode ? "text-amber-400" : "text-amber-600")} />
                                <span className={cn("font-medium", darkMode ? "text-white" : "text-slate-900")}>Gemini API Key</span>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={tempApiKey}
                                        onChange={(e) => setTempApiKey(e.target.value)}
                                        placeholder="Enter Gemini API key"
                                        className={cn(
                                            "w-full pl-3 pr-10 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                            darkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-800"
                                        )}
                                    />
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={handleTestApi}
                                    className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                        apiStatus === 'valid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                            apiStatus === 'invalid' ? "bg-red-100 text-red-700 border-red-200" :
                                                darkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                                    )}
                                >
                                    {apiStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                                        apiStatus === 'valid' ? <Check className="w-4 h-4" /> :
                                            'Test'}
                                </button>
                                <button
                                    onClick={() => handleSave('api')}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                            <p className={cn("text-xs", darkMode ? "text-slate-500" : "text-slate-400")}>
                                Required for AI features. Key is stored locally.
                            </p>
                        </div>

                        {/* AI Worksheet Generator Form */}
                        <div className={cn("p-4 rounded-xl space-y-4 border-2 border-dashed",
                            darkMode ? "bg-slate-800/50 border-slate-700" : "bg-indigo-50/50 border-indigo-200")}>

                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <h4 className={cn("font-bold", darkMode ? "text-white" : "text-slate-900")}>AI Worksheet Generator</h4>
                            </div>

                            <div className="space-y-3">
                                {/* Subject Select */}
                                <div>
                                    <label className={cn("block text-xs font-bold mb-1 uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-500")}>Subject</label>
                                    <select
                                        value={genSubject}
                                        onChange={(e) => setGenSubject(e.target.value)}
                                        className={cn("w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900")}
                                    >
                                        <option value="Math">Math</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Biology">Biology</option>
                                    </select>
                                </div>

                                {/* Topics */}
                                <div>
                                    <label className={cn("block text-xs font-bold mb-1 uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-500")}>Topics</label>
                                    <input
                                        type="text"
                                        value={genTopics}
                                        onChange={(e) => setGenTopics(e.target.value)}
                                        placeholder="e.g. Algebra, Geometry, Fractions"
                                        className={cn("w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900")}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Comma separated</p>
                                </div>

                                {/* Subtopics */}
                                <div>
                                    <label className={cn("block text-xs font-bold mb-1 uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-500")}>Subtopics (Optional)</label>
                                    <input
                                        type="text"
                                        value={genSubtopics}
                                        onChange={(e) => setGenSubtopics(e.target.value)}
                                        placeholder="e.g. Linear Equations, Area"
                                        className={cn("w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                            darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900")}
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !genTopics}
                                    className={cn("w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-white transition-all",
                                        isGenerating || !genTopics ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                                    )}
                                >
                                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    {isGenerating ? 'Generating...' : 'Generate & Export Excel'}
                                </button>
                                <p className={cn("text-center text-xs", darkMode ? "text-slate-500" : "text-slate-500")}>
                                    File will be downloaded to your device
                                </p>
                            </div>
                        </div>

                        {/* Worksheet Import URL */}
                        <div className={cn("p-4 rounded-xl space-y-3", darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100")}>
                            <div className="flex items-center gap-3 mb-1">
                                <FileSpreadsheet className={cn("w-5 h-5", darkMode ? "text-emerald-400" : "text-emerald-600")} />
                                <span className={cn("font-medium", darkMode ? "text-white" : "text-slate-900")}>Worksheet Source URLs (Import)</span>
                            </div>

                            <div className="space-y-3">
                                {['Math', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                                    <div key={subject}>
                                        <label className={cn("block text-xs font-bold mb-1 uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-500")}>
                                            {subject} Sheet
                                        </label>
                                        <input
                                            type="text"
                                            value={tempSheetUrls[subject.toLowerCase()]}
                                            onChange={(e) => setTempSheetUrls(prev => ({ ...prev, [subject.toLowerCase()]: e.target.value }))}
                                            placeholder={`Paste ${subject} Google Sheet URL...`}
                                            className={cn(
                                                "w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                                darkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-800"
                                            )}
                                        />
                                    </div>
                                ))}

                                <button
                                    onClick={() => handleSave('sheets')}
                                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Save All Links
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-slate-500" : "text-slate-400")}>
                            Data Sync
                        </h3>

                        <div className={cn("p-4 rounded-xl space-y-4", darkMode ? "bg-slate-800" : "bg-slate-50 border border-slate-100")}>
                            <div className="flex items-center gap-3 mb-2">
                                <Database className={cn("w-5 h-5", darkMode ? "text-slate-300" : "text-slate-600")} />
                                <span className={cn("font-medium", darkMode ? "text-white" : "text-slate-900")}>Data Source</span>
                            </div>

                            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg">
                                <button
                                    onClick={() => updateDataSource('local')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2",
                                        dataSource === 'local'
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Local Excel
                                </button>
                                <button
                                    onClick={() => updateDataSource('google')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2",
                                        dataSource === 'google'
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Database className="w-4 h-4" /> Google Sheets
                                </button>
                            </div>

                            {dataSource === 'google' && !isGoogleSheetsConfigured && (
                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    Google Sheets is not fully configured (missing ID or API Key). Falling back to local data.
                                </div>
                            )}

                            {/* Sync Status Info */}
                            <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-xs">
                                <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                                    Last Sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                                </span>
                                <button
                                    onClick={refresh}
                                    disabled={isRefreshing}
                                    className={cn("flex items-center gap-1 hover:underline", isRefreshing ? "opacity-50" : "", darkMode ? "text-indigo-400" : "text-indigo-600")}
                                >
                                    <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                                    {isRefreshing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
