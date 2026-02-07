import React, { useEffect, useRef, useState } from 'react';
import functionPlot from 'function-plot';
import { cn } from '../../utils';

const GraphExplorer = ({ initialFormula, darkMode }) => {
    const containerRef = useRef(null);
    const [formula, setFormula] = useState(initialFormula || "x^2");
    const [m, setM] = useState(1);
    const [c, setC] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Dynamic formula generation based on simple slope-intercept for demo
        // Or respect the initialFormula if complex
        let fn = formula;
        if (formula.includes('m') || formula.includes('c')) {
            fn = formula.replace('m', m).replace('c', c);
        }

        try {
            functionPlot({
                target: containerRef.current,
                width: containerRef.current.clientWidth,
                height: 300,
                yAxis: { domain: [-10, 10] },
                xAxis: { domain: [-10, 10] },
                grid: true,
                data: [
                    {
                        fn: fn,
                        color: darkMode ? '#60A5FA' : '#2563EB'
                    }
                ],
                theme: darkMode ? 'dark' : 'light' // function-plot doesn't fully support 'dark' theme string like this, but we can style via CSS if needed
            });
        } catch (e) {
            console.error("Graph plotting error:", e);
        }

    }, [formula, m, c, darkMode]);

    // Check if variables are relevant
    const showSlopeControls = formula.includes('m') || formula.includes('c') || formula === 'mx + c';

    return (
        <div className={cn("p-4 rounded-xl border", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
            <h4 className={cn("font-bold mb-4", darkMode ? "text-white" : "text-slate-800")}>Interactive Graph</h4>

            <div ref={containerRef} className="w-full h-[300px] mb-4 overflow-hidden rounded-lg bg-white" />

            {showSlopeControls && (
                <div className="space-y-4">
                    <div>
                        <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                            Slope (m): {m}
                        </label>
                        <input
                            type="range"
                            min="-10"
                            max="10"
                            step="0.5"
                            value={m}
                            onChange={(e) => setM(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                            Y-Intercept (c): {c}
                        </label>
                        <input
                            type="range"
                            min="-10"
                            max="10"
                            step="1"
                            value={c}
                            onChange={(e) => setC(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
            )}

            {!showSlopeControls && (
                 <div className="mt-2">
                     <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>
                        Formula (f(x) =)
                    </label>
                    <input
                        type="text"
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        className={cn("w-full px-3 py-2 rounded border", darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300")}
                    />
                 </div>
            )}
        </div>
    );
};

export default GraphExplorer;
