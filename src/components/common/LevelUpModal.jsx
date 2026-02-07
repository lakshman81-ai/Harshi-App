import React, { useEffect } from 'react';
import { Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../../utils';

const LevelUpModal = ({ level, onDismiss, darkMode }) => {
    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        return () => clearInterval(interval);
    }, []);

    if (!level) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={cn(
                "relative max-w-sm w-full rounded-3xl p-8 text-center transform animate-in zoom-in-50 duration-500",
                darkMode ? "bg-slate-800 border border-slate-700" : "bg-white"
            )}>
                <button
                    onClick={onDismiss}
                    className={cn(
                        "absolute top-4 right-4 p-2 rounded-full transition-colors",
                        darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                    )}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-50 rounded-full animate-pulse" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl rotate-3 flex items-center justify-center shadow-xl">
                            <Star className="w-12 h-12 text-white fill-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white transform rotate-12">
                            LEVEL UP!
                        </div>
                    </div>
                </div>

                <h2 className={cn("text-3xl font-bold mb-2", darkMode ? "text-white" : "text-slate-800")}>
                    Level {level}
                </h2>
                <p className={cn("mb-8", darkMode ? "text-slate-300" : "text-slate-600")}>
                    Congratulations! You've reached a new level of mastery. Keep up the great work!
                </p>

                <button
                    onClick={onDismiss}
                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Continue Learning
                </button>
            </div>
        </div>
    );
};

export default LevelUpModal;
