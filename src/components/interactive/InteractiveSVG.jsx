import React, { useState } from 'react';
import { cn } from '../../utils';

const InteractiveSVG = ({ svgUrl, regions, darkMode }) => {
    const [activeRegion, setActiveRegion] = useState(null);

    return (
        <div className={cn("p-4 rounded-xl border flex flex-col md:flex-row gap-6", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
            <div className="flex-1 relative">
                 {/* Embed SVG Object to allow interaction if CORS permits, otherwise img map approach is complex.
                     For simplicity/demo, we assume an SVG passed as content or URL.
                     Ideally, we render inline SVG. */}

                 {/* Fallback/Demo for now: Image with Clickable Overlays (simplest cross-platform)
                     OR Inline SVG if content is raw SVG.
                 */}
                 <img
                    src={svgUrl}
                    alt="Interactive Diagram"
                    className="w-full rounded-lg"
                />

                 {/* Simulate Regions for Demo (Center clickable) if no real coordinate system logic provided yet */}
                 {regions && regions.map((region, i) => (
                     <button
                        key={region.id}
                        onClick={() => setActiveRegion(region)}
                        className={cn(
                            "absolute w-8 h-8 rounded-full bg-blue-500/50 hover:bg-blue-500 border-2 border-white shadow-lg transition-all flex items-center justify-center text-white text-xs font-bold",
                            activeRegion?.id === region.id ? "scale-125 bg-blue-600 ring-4 ring-blue-500/30" : ""
                        )}
                        style={{ top: `${region.y || 50}%`, left: `${region.x || 50}%` }}
                        title={region.id}
                     >
                         {i + 1}
                     </button>
                 ))}
            </div>

            <div className={cn("w-full md:w-64 p-4 rounded-lg", darkMode ? "bg-slate-700/50" : "bg-slate-50")}>
                {activeRegion ? (
                    <div>
                        <h4 className={cn("font-bold text-lg mb-2 capitalize", darkMode ? "text-white" : "text-slate-800")}>{activeRegion.id}</h4>
                        <p className={cn("text-sm leading-relaxed", darkMode ? "text-slate-300" : "text-slate-600")}>
                            {activeRegion.info}
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8 opacity-50">
                        <p>Click on the numbered markers to learn more.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractiveSVG;
