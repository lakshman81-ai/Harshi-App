import React, { memo } from 'react';
import { Cloud, Loader2, Wifi, AlertCircle, CloudOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../utils';

export const SyncStatusBadge = memo(({ darkMode }) => {
    const { syncStatus, lastSync, isRefreshing, error, isDemoMode, refresh } = useData();

    const statusConfig = {
        idle: { icon: Cloud, color: 'text-slate-400', bg: darkMode ? 'bg-slate-700' : 'bg-slate-100', text: 'Data Ready' },
        loading: { icon: Loader2, color: 'text-blue-500', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50', text: 'Loading Data...' },
        syncing: { icon: Loader2, color: 'text-blue-500', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50', text: 'Syncing Sheets...' },
        success: { icon: Wifi, color: 'text-emerald-500', bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50', text: isDemoMode ? 'Demo Data' : 'Google Sheets' },
        error: { icon: AlertCircle, color: 'text-red-500', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50', text: 'Sync Error' },
        offline: { icon: CloudOff, color: 'text-amber-500', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', text: 'Demo Mode' }
    };

    const config = statusConfig[syncStatus] || statusConfig.idle;
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2" >
            <button
                onClick={refresh}
                disabled={isRefreshing || isDemoMode}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                    config.bg,
                    darkMode ? "text-slate-200" : "text-slate-700",
                    !isDemoMode && "hover:opacity-80 cursor-pointer"
                )}
                title={error || (lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : 'Click to refresh')}
            >
                <Icon className={cn("w-4 h-4", config.color, (syncStatus === 'syncing' || syncStatus === 'loading') && "animate-spin")} />
                <span className="hidden sm:inline">{config.text}</span>
            </button>
        </div >
    );
});

export const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color, showLabel = true, darkMode = false }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke={darkMode ? '#374151' : '#E5E7EB'} fill="none" />
                <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke={color} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-lg font-bold", darkMode ? "text-slate-200" : "text-slate-700")}>{progress}%</span>
                </div>
            )}
        </div>
    );
};

export const Card = memo(({ children, className, darkMode, glowColor, onClick, ...props }) => {
    const Component = onClick ? 'button' : 'div';
    return (
        <Component
            onClick={onClick}
            className={cn(
                "rounded-2xl border transition-all",
                darkMode ? `bg-slate-800 border-slate-700 ${glowColor || 'shadow-lg shadow-slate-900/50'}` : "bg-white border-slate-200 shadow-sm",
                onClick && (darkMode ? "hover:border-slate-600" : "hover:border-slate-300 hover:shadow-lg"),
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
});

export const AchievementBadge = ({ achievement, unlocked, darkMode }) => {
    // Note: Assuming ICON_MAP functionality is handled by passing icon component or mapping here.
    // For simplicity, we might need to handle icons. If icons are strings from data, we need mapping.
    // In monolith, CheckCircle2, etc. are used. This makes `AchievementBadge` tricky if it depends on `ICON_MAP`.
    // Let's assume the passed `achievement` object has what we need or we pass an Icon lookup.

    // Actually, monolith `AchievementBadge` uses `ICON_MAP`.
    // I should move `ICON_MAP` to `utils` or `constants.js`.

    // For this quick pass, I'll export `ICON_MAP` from `src/constants.js`.
    return null; // Implement in separate file due to Icon dependencies
};
