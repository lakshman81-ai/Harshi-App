import React, { memo } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../../utils';
import { AVATAR_MAP } from '../../constants';
import { useStudy } from '../../contexts/StudyContext';

const AvatarSelector = memo(({ isOpen, onClose, darkMode }) => {
    const { progress, updateProgress } = useStudy();
    const currentAvatarId = progress.avatar || 'student';

    const handleSelect = (id) => {
        updateProgress({ avatar: id });
        // Optional: Play click sound via context or manager if available, 
        // but simple state update is enough for now.
        setTimeout(onClose, 300); // Close after brief delay
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={cn(
                "w-full max-w-md rounded-2xl p-6 relative transform animate-in zoom-in-95 duration-200",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
            )}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-800")}>
                        Choose Your Avatar
                    </h2>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                        )}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {Object.entries(AVATAR_MAP).map(([id, config]) => {
                        const Icon = config.icon;
                        const isSelected = currentAvatarId === id;

                        return (
                            <button
                                key={id}
                                onClick={() => handleSelect(id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all relative group",
                                    isSelected
                                        ? darkMode ? "bg-slate-700 ring-2 ring-blue-500" : "bg-blue-50 ring-2 ring-blue-500"
                                        : darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                    config.color
                                )}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <span className={cn(
                                    "text-xs font-medium",
                                    darkMode ? "text-slate-300" : "text-slate-600"
                                )}>
                                    {config.label}
                                </span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default AvatarSelector;
