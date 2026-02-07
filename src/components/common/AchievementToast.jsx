import React, { useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { cn } from '../../utils';

const AchievementToast = ({ achievements, onDismiss, darkMode }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [achievements, onDismiss]);

    if (!achievements || achievements.length === 0) return null;

    // Display the first new achievement
    // Note: In a production app, we might queue these or show a stack. 
    // For now, we show "Achievement Unlocked!" with count if > 1 or the specific name.
    const count = achievements.length;

    // We assume the ID is descriptive enough for now or we map it if we had a comprehensive map available here.
    // Ideally, we'd lookup the name from a config.
    const firstId = achievements[0];
    const displayText = firstId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-right duration-500 fade-in">
            <div className={cn(
                "flex items-center gap-4 p-4 rounded-xl shadow-xl border-l-4",
                darkMode ? "bg-slate-800 border-amber-500 shadow-black/50" : "bg-white border-amber-500"
            )}>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
                    <Trophy className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-[200px]">
                    <h4 className={cn("font-bold text-sm uppercase tracking-wider", darkMode ? "text-amber-400" : "text-amber-600")}>
                        Achievement Unlocked!
                    </h4>
                    <p className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>
                        {displayText}
                    </p>
                    {count > 1 && (
                        <p className={cn("text-xs opacity-75", darkMode ? "text-slate-400" : "text-slate-500")}>
                            +{count - 1} more unlocked
                        </p>
                    )}
                </div>

                <button
                    onClick={onDismiss}
                    className={cn(
                        "p-1 rounded-full transition-colors",
                        darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                    )}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default AchievementToast;
