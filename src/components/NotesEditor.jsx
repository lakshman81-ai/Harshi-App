import React, { memo, useState, useEffect, useRef } from 'react';
import { useStudy } from '../contexts/StudyContext';
import { cn } from '../utils';
import { Loader2, Save } from 'lucide-react';

const NotesEditor = memo(({ topicId, darkMode }) => {
    const { progress, updateProgress } = useStudy();
    const [notes, setNotes] = useState(progress.notes[topicId] || '');
    const [saving, setSaving] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        setNotes(progress.notes[topicId] || '');
    }, [topicId, progress.notes]);

    const handleChange = (e) => {
        const value = e.target.value;
        setNotes(value);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            updateProgress({ notes: { [topicId]: value } });
        }, 1000);
    };

    const handleSave = () => {
        setSaving(true);
        updateProgress({ notes: { [topicId]: notes } });
        setTimeout(() => setSaving(false), 500);
    };

    return (
        <div className="space-y-2">
            <textarea
                value={notes}
                onChange={handleChange}
                onBlur={handleSave}
                placeholder="Type your notes here..."
                className={cn(
                    "w-full h-32 p-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2",
                    darkMode ? "bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-amber-500/50" : "bg-amber-50 border-amber-200 text-amber-900 placeholder-amber-400 focus:ring-amber-300"
                )}
            />
            <button onClick={handleSave} className={cn("w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2", darkMode ? "bg-slate-700 hover:bg-slate-600 text-amber-400" : "bg-amber-100 hover:bg-amber-200 text-amber-800")}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Notes</>}
            </button>
        </div>
    );
});

export default NotesEditor;
