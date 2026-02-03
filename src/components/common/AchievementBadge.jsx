import React from 'react';
import { Trophy, Star, Flame, Target, Award, BookOpen, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils';

const ICON_MAP = {
    trophy: Trophy,
    star: Star,
    flame: Flame,
    target: Target,
    award: Award,
    book: BookOpen,
    check: CheckCircle2
};

export const AchievementBadge = ({ achievement, unlocked, darkMode }) => {
    const IconComponent = ICON_MAP[achievement.icon] || Trophy;

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all group relative",
                "min-w-[100px]",
                unlocked
                    ? darkMode
                        ? "bg-gradient-to-br from-amber-900/50 to-yellow-900/50 border border-amber-700"
                        : "bg-gradient-to-br from-amber-100 to-yellow-100 border border-amber-300"
                    : darkMode
                        ? "bg-slate-800 border border-slate-700 opacity-50"
                        : "bg-slate-100 border border-slate-300 opacity-50 grayscale"
            )}
            role="img"
            aria-label={`${achievement.name}: ${unlocked ? 'Unlocked' : 'Locked'}`}
        >
            {/* Icon */}
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                unlocked
                    ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                    : darkMode ? "bg-slate-700" : "bg-slate-300"
            )}>
                <IconComponent
                    className={cn(
                        "w-6 h-6",
                        unlocked ? "text-white" : darkMode ? "text-slate-500" : "text-slate-400"
                    )}
                />
            </div>

            {/* Name */}
            <p className={cn(
                "text-xs font-medium text-center",
                unlocked
                    ? darkMode ? "text-amber-300" : "text-amber-900"
                    : darkMode ? "text-slate-500" : "text-slate-600"
            )}>
                {achievement.name}
            </p>

            {/* Tooltip on hover */}
            <div className={cn(
                "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap",
                "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10",
                darkMode ? "bg-slate-700 text-white" : "bg-slate-900 text-white"
            )}>
                {achievement.description}
                <div className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent",
                    darkMode ? "border-t-slate-700" : "border-t-slate-900"
                )} />
            </div>

            {/* Locked overlay */}
            {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        darkMode ? "bg-slate-700" : "bg-slate-400"
                    )}>
                        <span className="text-white text-xs">🔒</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AchievementBadge;
