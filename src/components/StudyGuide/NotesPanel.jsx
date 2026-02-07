import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { StickyNote, Save, Loader2 } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * NotesPanel Component
 * Slide-up panel for user notes with auto-save
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is visible
 * @param {string} props.topicId - Current topic ID for storing notes
 * @param {string} props.initialNotes - Initial notes content
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onSave - Save notes handler (receives topicId and notes)
 * @param {Function} props.onClose - Close panel handler
 */
const NotesPanel = memo(({
  isOpen,
  topicId,
  initialNotes,
  darkMode,
  onSave,
  onClose
}) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Update notes when topic changes
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes, topicId]);

  // Auto-save with debounce
  const debouncedSave = useCallback((content) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      setSaveStatus('saving');
      onSave?.(topicId, content);
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatus('saved');
        setLastSaved(new Date());
        saveTimeoutRef.current = null;
      }, 500);
    }, 1000);
  }, [topicId, onSave]);

  // Handle notes change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setNotes(newValue);
    debouncedSave(newValue);
  };

  // Handle manual save
  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null; // Clear ref to prevent race condition
    }
    setIsSaving(true);
    setSaveStatus('saving');
    onSave?.(topicId, notes);
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('saved');
      setLastSaved(new Date());
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "border-t",
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-slate-200"
      )}
    >
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3
            className={cn(
              "font-bold flex items-center gap-2",
              darkMode ? "text-white" : "text-slate-800"
            )}
          >
            <StickyNote className="w-5 h-5 text-amber-500" />
            Your Notes
          </h3>
          <div className="flex items-center gap-3">
            {/* Save status */}
            <span
              className={cn(
                "text-xs",
                darkMode ? "text-slate-400" : "text-slate-500"
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                `Saved ${lastSaved.toLocaleTimeString()}`
              ) : (
                'Auto-saves as you type'
              )}
            </span>
            {/* Manual save button */}
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-700 disabled:text-slate-500"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
              )}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={handleChange}
          placeholder="Write your notes here... They'll be saved automatically."
          className={cn(
            "w-full h-32 p-3 rounded-xl border resize-none transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            darkMode
              ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
          )}
        />

        {/* Character count */}
        <div className="flex justify-end mt-2">
          <span
            className={cn(
              "text-xs",
              darkMode ? "text-slate-500" : "text-slate-400"
            )}
          >
            {notes.length} characters
          </span>
        </div>
      </div>
    </div>
  );
});

NotesPanel.displayName = 'NotesPanel';

NotesPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  topicId: PropTypes.string.isRequired,
  initialNotes: PropTypes.string,
  darkMode: PropTypes.bool,
  onSave: PropTypes.func,
  onClose: PropTypes.func,
};

NotesPanel.defaultProps = {
  initialNotes: '',
  darkMode: false,
};

export default NotesPanel;
