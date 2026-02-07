import React from 'react';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import DailyChallenge from '../DailyChallenge';
import { cn } from '../../utils';

const DailyChallengeModal = ({
    challenge,
    darkMode,
    completed,
    onComplete,
    onClose
}) => {

    const handleComplete = (xp, isCorrect) => {
        if (isCorrect) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        onComplete(xp, isCorrect);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={cn(
                    "relative w-full max-w-lg rounded-2xl shadow-2xl transform transition-all scale-100 overflow-hidden",
                    darkMode ? "bg-slate-900 border border-slate-700" : "bg-white"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <DailyChallenge
                    challenge={challenge}
                    darkMode={darkMode}
                    completed={completed}
                    onComplete={handleComplete}
                    isModal={true}
                />
            </div>
        </div>
    );
};

export default DailyChallengeModal;
