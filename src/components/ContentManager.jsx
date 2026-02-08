import React, { useState, useEffect, useCallback } from 'react';
import {
    Folder, File, ChevronRight, ChevronDown,
    Save, Upload, Edit, AlertCircle,
    CheckCircle, X, Loader, FileText
} from 'lucide-react';
import { csvService } from '../services/unifiedDataService'; // Explicit import
import { cn } from '../utils';

// Constants
const API_URL = 'http://localhost:3001/api';

const fetchFileList = async (path) => {
    const res = await fetch(`${API_URL}/files?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return await res.json();
};

const ContentManager = ({ onClose, darkMode }) => {
    const [fileTree, setFileTree] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [loadingTree, setLoadingTree] = useState(true);

    const refreshTree = useCallback(async () => {
        setLoadingTree(true);
        try {
            // Fetch root structure
            // We assume backend is running on localhost:3001
            // If checkBackendStatus fails, we show error
            const isBackendUp = await csvService.checkBackendStatus();
            if (!isBackendUp) {
                setStatusMessage({ type: 'error', text: 'Backend server not reachable. Ensure server.js is running.' });
                setLoadingTree(false);
                return;
            }

            // Recursive fetch is tricky with flat API, let's just fetch root first
            // Ideally backend returns full tree or we fetch on expand.
            // Let's implement fetch-on-expand logic in the UI,
            // but for initial view, let's fetch root Subjects
            const rootFiles = await fetchFileList('');
            setFileTree(rootFiles);
        } catch (e) {
            console.error(e);
            setStatusMessage({ type: 'error', text: 'Failed to load file tree.' });
        } finally {
            setLoadingTree(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        refreshTree();
    }, [refreshTree]);

    const toggleFolder = async (folderPath) => {
        // Toggle expansion
        setExpandedFolders(prev => {
            const isExpanded = !!prev[folderPath];
            if (isExpanded) {
                const next = { ...prev };
                delete next[folderPath];
                return next;
            }
            return { ...prev, [folderPath]: [] }; // Placeholder while loading
        });

        // If expanding, fetch children
        if (!expandedFolders[folderPath]) {
            try {
                const children = await fetchFileList(folderPath);
                setExpandedFolders(prev => ({
                    ...prev,
                    [folderPath]: children
                }));
            } catch (e) {
                console.error(e);
                // Revert expansion on error
                setExpandedFolders(prev => {
                    const next = { ...prev };
                    delete next[folderPath];
                    return next;
                });
            }
        }
    };

    const handleSelectFile = async (file) => {
        if (file.type === 'directory') return;

        setSelectedFile(file);
        setStatusMessage(null);

        // Only load text/csv content for editing
        if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            try {
                const res = await fetch(`${API_URL}/file?path=${encodeURIComponent(file.path)}`);
                if (res.ok) {
                    const text = await res.text();
                    setFileContent(text);
                }
            } catch (e) {
                console.error(e);
                setFileContent('Error loading content');
            }
        } else {
            setFileContent(`[Binary File: ${file.name}]`);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;
        setIsSaving(true);
        setStatusMessage(null);

        try {
            const res = await fetch(`${API_URL}/file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: selectedFile.path,
                    content: fileContent
                })
            });

            if (res.ok) {
                setStatusMessage({ type: 'success', text: 'File saved successfully!' });
            } else {
                throw new Error('Save failed');
            }
        } catch (e) {
            console.error(e);
            setStatusMessage({ type: 'error', text: 'Error saving file.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Where to upload? If a folder is selected (or parent of selected file)
        // For simplicity, upload to the folder of the currently selected file, or root if none
        let targetPath = '';
        if (selectedFile) {
            // Get parent directory
            const parts = selectedFile.path.split('/');
            parts.pop();
            targetPath = parts.join('/');
        }

        // Use prompt for path if needed?
        // Let's just upload to current context

        const formData = new FormData();
        formData.append('path', targetPath);
        formData.append('file', file);

        setUploading(true);
        setStatusMessage(null);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setStatusMessage({ type: 'success', text: `Uploaded ${file.name}` });
                // Refresh folder
                if (targetPath) {
                    const children = await fetchFileList(targetPath);
                    setExpandedFolders(prev => ({ ...prev, [targetPath]: children }));
                } else {
                    refreshTree();
                }
            } else {
                throw new Error('Upload failed');
            }
        } catch (e) {
            console.error(e);
            setStatusMessage({ type: 'error', text: 'Upload failed.' });
        } finally {
            setUploading(false);
        }
    };

    // Recursive Tree Renderer
    const renderTree = (items, currentPath = '') => {
        if (!items) return null;

        return (
            <div className="pl-4 border-l border-slate-200 dark:border-slate-700 ml-2">
                {items.map((item) => {
                    const itemPath = item.path || (currentPath ? `${currentPath}/${item.name}` : item.name);
                    const isFolder = item.type === 'directory';
                    const isExpanded = !!expandedFolders[itemPath];
                    const isSelected = selectedFile?.path === itemPath;

                    return (
                        <div key={itemPath}>
                            <div
                                className={cn(
                                    "flex items-center gap-2 py-1 px-2 rounded cursor-pointer select-none transition-colors",
                                    isSelected ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                                onClick={() => isFolder ? toggleFolder(itemPath) : handleSelectFile(item)}
                            >
                                {isFolder ? (
                                    <span className="opacity-50">
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </span>
                                ) : (
                                    <span className="w-4" />
                                )}

                                {isFolder ? (
                                    <Folder className={cn("w-4 h-4", isExpanded ? "text-amber-500" : "text-amber-400")} />
                                ) : (
                                    <File className="w-4 h-4 text-slate-400" />
                                )}

                                <span className="text-sm truncate">{item.name}</span>
                            </div>

                            {isFolder && isExpanded && renderTree(expandedFolders[itemPath], itemPath)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="h-14 border-b dark:border-slate-700 flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded">
                        <Edit className="w-5 h-5" />
                    </div>
                    <h1 className="font-bold text-slate-800 dark:text-white">Content Manager</h1>
                </div>
                <div className="flex items-center gap-2">
                    {statusMessage && (
                        <div className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in",
                            statusMessage.type === 'error' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {statusMessage.text}
                        </div>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (File Tree) */}
                <div className="w-80 border-r dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explorer</span>
                        <button onClick={refreshTree} className="p-1 hover:bg-slate-200 rounded">
                            <Loader className={cn("w-3 h-3", loadingTree && "animate-spin")} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {renderTree(fileTree)}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                    {selectedFile ? (
                        <>
                            {/* Editor Toolbar */}
                            <div className="h-12 border-b dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <File className="w-4 h-4" />
                                    <span>{selectedFile.path}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Upload Button */}
                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-sm font-medium cursor-pointer transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload File Here</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                    </label>

                                    {/* Save Button (only for text files) */}
                                    {!selectedFile.name.endsWith('.pdf') && !selectedFile.name.endsWith('.docx') && (
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-hidden relative">
                                {selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt') ? (
                                    <textarea
                                        value={fileContent}
                                        onChange={(e) => setFileContent(e.target.value)}
                                        className="w-full h-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none dark:text-slate-300"
                                        spellCheck="false"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Binary file preview not supported in this editor.</p>
                                        <p className="text-sm mt-2">Use the "Upload" button to replace this file.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Folder className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a file to edit</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentManager;
