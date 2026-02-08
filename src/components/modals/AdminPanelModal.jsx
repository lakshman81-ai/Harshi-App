import React, { useState, useEffect, useCallback } from 'react';
import { X, Wrench, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import PropTypes from 'prop-types';
import pako from 'pako';
import EditableTable from '../common/EditableTable';
import HierarchicalTable from '../common/HierarchicalTable';

/**
 * Diagram type configurations
 */
const DIAGRAM_TYPES = {
    mindmap: {
        name: 'Mindmap',
        description: 'Hierarchical concepts',
        inputFormat: 'indented',
        sampleData: `Forces in Physics
Contact Forces
Friction
Normal Force
Tension
Non-Contact Forces
Gravity
Electromagnetic`,
        placeholder: 'Enter hierarchical text:\n\nMain Topic\n  Subtopic 1\n  Subtopic 2'
    },
    flowchart: {
        name: 'Flowchart',
        description: 'Process flow, steps',
        inputFormat: 'csv',
        headers: ['id', 'label', 'connects_to'],
        sampleData: `id\tlabel\tconnects_to
start\tStart Process\t
step1\tIdentify Forces\tstart
step2\tCalculate Net Force\tstep1
step3\tApply F=ma\tstep2
end\tGet Acceleration\tstep3`,
        placeholder: 'Paste from Google Sheets or use tab-separated:\n\nid\tlabel\tconnects_to\nstart\tStart\t\nstep1\tStep 1\tstart'
    },
    classDiagram: {
        name: 'Class Diagram',
        description: 'OOP, relationships',
        inputFormat: 'csv',
        headers: ['class', 'attributes', 'methods', 'extends'],
        sampleData: `class\tattributes\tmethods\textends
Force\tmagnitude,direction\tcalculate(),apply()\t
GravityForce\tmass\tcalculateWeight()\tForce
FrictionForce\tcoefficient\tcalculateResistance()\tForce`,
        placeholder: 'Paste from Google Sheets:\n\nclass\tattributes\tmethods\textends'
    },
    sequence: {
        name: 'Sequence Diagram',
        description: 'Interactions, messages',
        inputFormat: 'csv',
        headers: ['from', 'to', 'message'],
        sampleData: `from\tto\tmessage
Student\tTeacher\tAsk question
Teacher\tTextbook\tLook up answer
Textbook\tTeacher\tProvide information
Teacher\tStudent\tProvide examples`,
        placeholder: 'Paste from Google Sheets:\n\nfrom\tto\tmessage\nActor1\tActor2\tMessage'
    },
    pie: {
        name: 'Pie Chart',
        description: 'Proportions, percentages',
        inputFormat: 'csv',
        headers: ['label', 'value'],
        sampleData: `label\tvalue
Gravity\t30
Friction\t25
Normal Force\t20
Tension\t15
Other Forces\t10`,
        placeholder: 'Paste from Google Sheets:\n\nlabel\tvalue\nCategory 1\t50\nCategory 2\t30'
    },
    timeline: {
        name: 'Timeline',
        description: 'Events in order',
        inputFormat: 'indented',
        sampleData: `History of Physics
1687 : Newton publishes Principia
1905 : Einstein's Special Relativity
1915 : General Relativity
1927 : Quantum Mechanics established`,
        placeholder: 'Enter timeline with indentation:\n\nTitle\n  Year : Event 1\n  Year : Event 2'
    },
    erDiagram: {
        name: 'ER Diagram',
        description: 'Database relationships',
        inputFormat: 'csv',
        headers: ['entity1', 'relationship', 'connects_to', 'entity2', 'label'],
        sampleData: `entity1\trelationship\tconnects_to\tentity2\tlabel
Student\t||--o{\tenrolls\tClass\t"takes course"
Teacher\t||--o{\tteaches\tClass\t"instructs"
Class\t}o--||\theld_in\tRoom\t"uses"`,
        placeholder: 'Paste from Google Sheets:\n\nentity1\trelationship\tconnects_to\tentity2\tlabel'
    },
    quadrantChart: {
        name: 'Quadrant Chart',
        description: 'Two-variable analysis',
        inputFormat: 'csv',
        headers: ['label', 'x', 'y'],
        sampleData: `label\tx\ty
Physics\t0.9\t0.8
Chemistry\t0.7\t0.6
Biology\t0.4\t0.3
Math\t0.3\t0.9
History\t0.2\t0.2`,
        placeholder: 'Values 0.0 to 1.0:\n\nlabel\tx\ty'
    },
    xyChart: {
        name: 'XY/Bar Chart',
        description: 'Data visualization',
        inputFormat: 'csv',
        headers: ['label', 'value'],
        sampleData: `label\tvalue
Week 1\t5
Week 2\t12
Week 3\t18
Week 4\t25
Week 5\t30`,
        placeholder: 'Paste data from Sheets:\n\nlabel\tvalue'
    }
};

/**
 * Encode diagram for Kroki URL using deflate + base64
 * Based on: https://docs.kroki.io/kroki/setup/encode-diagram/
 */
function encodeForKroki(diagramSource) {
    // Encode as UTF-8
    const data = new TextEncoder().encode(diagramSource);
    // Compress with deflate
    const compressed = pako.deflate(data, { level: 9 });
    // Convert to base64 and make URL-safe
    const base64 = btoa(String.fromCharCode.apply(null, compressed));
    return base64.replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Parse indented list to Mermaid mindmap
 */
function parseIndentedToMindmap(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';

    let code = 'mindmap\n';

    lines.forEach((line, idx) => {
        // Count leading spaces (2 spaces = 1 level)
        const leadingSpaces = line.match(/^(\s*)/)[1].length;
        const indent = Math.floor(leadingSpaces / 2) + 1;
        const text = line.trim().replace(/["[\](){}]/g, ''); // Escape special chars

        if (idx === 0) {
            // Root node
            code += `  root((${text}))\n`;
        } else {
            code += '  '.repeat(indent + 1) + text + '\n';
        }
    });

    return code;
}

/**
 * Parse CSV/TSV to Mermaid flowchart
 */
function parseCSVToFlowchart(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    // Detect delimiter (tab or comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    // Find column indices
    const idIdx = headers.findIndex(h => h === 'id' || h === 'node');
    const labelIdx = headers.findIndex(h => h === 'label' || h === 'name' || h === 'text');
    const connectsIdx = headers.findIndex(h => h.includes('connect') || h === 'to' || h === 'parent');

    if (idIdx === -1 || labelIdx === -1) {
        return '<!-- Error: CSV must have "id" and "label" columns -->';
    }

    let code = 'flowchart TD\n';
    const nodes = [];
    const edges = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        const id = cols[idIdx] || `node${i}`;
        const label = (cols[labelIdx] || '').replace(/"/g, "'");
        const connectsTo = connectsIdx >= 0 ? cols[connectsIdx] : '';

        nodes.push(`  ${id}["${label}"]`);

        if (connectsTo) {
            edges.push(`  ${connectsTo} --> ${id}`);
        }
    }

    return code + nodes.join('\n') + '\n' + edges.join('\n');
}

/**
 * Parse CSV to Mermaid class diagram
 */
function parseCSVToClassDiagram(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const classIdx = headers.findIndex(h => h === 'class' || h === 'name');
    const attrIdx = headers.findIndex(h => h.includes('attr') || h === 'properties');
    const methodIdx = headers.findIndex(h => h.includes('method') || h === 'functions');
    const extendsIdx = headers.findIndex(h => h === 'extends' || h === 'parent');

    if (classIdx === -1) return '<!-- Error: CSV must have "class" column -->';

    let code = 'classDiagram\n';

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        const className = cols[classIdx];
        const attrs = attrIdx >= 0 ? cols[attrIdx] : '';
        const methods = methodIdx >= 0 ? cols[methodIdx] : '';
        const extendsClass = extendsIdx >= 0 ? cols[extendsIdx] : '';

        code += `  class ${className} {\n`;
        if (attrs) {
            // Using standard for loop to avoid no-loop-func ESLint error
            const attrList = attrs.split(',');
            for (const a of attrList) {
                code += `    ${a.trim()}\n`;
            }
        }
        if (methods) {
            // Using standard for loop to avoid no-loop-func ESLint error
            const methodList = methods.split(',');
            for (const m of methodList) {
                code += `    ${m.trim()}\n`;
            }
        }
        code += '  }\n';

        if (extendsClass) {
            code += `  ${extendsClass} <|-- ${className}\n`;
        }
    }

    return code;
}

/**
 * Parse CSV to Mermaid sequence diagram
 */
function parseCSVToSequence(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const fromIdx = headers.findIndex(h => h === 'from' || h === 'actor1' || h === 'sender');
    const toIdx = headers.findIndex(h => h === 'to' || h === 'actor2' || h === 'receiver');
    const msgIdx = headers.findIndex(h => h === 'message' || h === 'msg' || h === 'action');

    if (fromIdx === -1 || toIdx === -1) return '<!-- Error: CSV must have "from" and "to" columns -->';

    let code = 'sequenceDiagram\n';

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        const from = cols[fromIdx];
        const to = cols[toIdx];
        const msg = msgIdx >= 0 ? cols[msgIdx] : 'message';

        code += `  ${from}->>${to}: ${msg}\n`;
    }

    return code;
}

/**
 * Parse CSV to Mermaid pie chart
 */
function parseCSVToPie(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const labelIdx = headers.findIndex(h => h === 'label' || h === 'name' || h === 'category');
    const valueIdx = headers.findIndex(h => h === 'value' || h === 'amount' || h === 'percent');

    if (labelIdx === -1 || valueIdx === -1) return '<!-- Error: CSV must have "label" and "value" columns -->';

    let code = 'pie showData\n  title Distribution\n';

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        const label = cols[labelIdx];
        const value = cols[valueIdx];

        code += `  "${label}" : ${value}\n`;
    }

    return code;
}

/**
 * Parse indented list to timeline
 */
function parseIndentedToTimeline(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';

    let code = 'timeline\n';

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (idx === 0) {
            code += `  title ${trimmed}\n`;
        } else if (trimmed.includes(':')) {
            const [period, event] = trimmed.split(':').map(s => s.trim());
            code += `  ${period} : ${event}\n`;
        } else {
            code += `  ${trimmed}\n`;
        }
    });

    return code;
}

/**
 * Parse CSV to Mermaid ER diagram
 */
function parseCSVToERDiagram(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const e1Idx = headers.findIndex(h => h === 'entity1');
    const relIdx = headers.findIndex(h => h === 'relationship');
    const connIdx = headers.findIndex(h => h === 'connects_to' || h === 'connectsto');
    const e2Idx = headers.findIndex(h => h === 'entity2');
    const lblIdx = headers.findIndex(h => h === 'label');

    if (e1Idx === -1 || e2Idx === -1) return '<!-- Error: CSV must have entity1 and entity2 columns -->';

    let code = 'erDiagram\n';

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        const e1 = cols[e1Idx];
        const rel = relIdx >= 0 ? cols[relIdx] : '||--o{';
        const conn = connIdx >= 0 ? cols[connIdx] : 'relates';
        const e2 = cols[e2Idx];
        const lbl = lblIdx >= 0 ? cols[lblIdx] : conn;

        code += `  ${e1} ${rel} ${e2} : ${lbl}\n`;
    }

    return code;
}

/**
 * Parse CSV to Mermaid quadrant chart
 */
function parseCSVToQuadrantChart(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const lblIdx = headers.findIndex(h => h === 'label');
    const xIdx = headers.findIndex(h => h === 'x');
    const yIdx = headers.findIndex(h => h === 'y');

    if (lblIdx === -1 || xIdx === -1 || yIdx === -1) return '<!-- Error: CSV must have label, x, y columns -->';

    let code = 'quadrantChart\n  title Analysis\n  x-axis Low --> High\n  y-axis Low --> High\n';

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        code += `  ${cols[lblIdx]}: [${cols[xIdx]}, ${cols[yIdx]}]\n`;
    }

    return code;
}

/**
 * Parse CSV to Mermaid XY/Bar chart
 */
function parseCSVToXYChart(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return '';

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    const lblIdx = headers.findIndex(h => h === 'label');
    const valIdx = headers.findIndex(h => h === 'value');

    if (lblIdx === -1 || valIdx === -1) return '<!-- Error: CSV must have label and value columns -->';

    const labels = [];
    const values = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        labels.push(cols[lblIdx]);
        values.push(cols[valIdx]);
    }

    return `xychart-beta\n  title Data Visualization\n  x-axis [${labels.join(', ')}]\n  y-axis Values\n  bar [${values.join(', ')}]\n`;
}


/**
 * Generate Mermaid code based on diagram type
 */
function generateMermaidCode(content, diagramType) {
    if (!content || content.trim().length === 0) return '';

    const config = DIAGRAM_TYPES[diagramType];
    if (!config) return '';

    try {
        switch (diagramType) {
            case 'mindmap':
                return parseIndentedToMindmap(content);
            case 'flowchart':
                return parseCSVToFlowchart(content);
            case 'classDiagram':
                return parseCSVToClassDiagram(content);
            case 'sequence':
                return parseCSVToSequence(content);
            case 'pie':
                return parseCSVToPie(content);
            case 'timeline':
                return parseIndentedToTimeline(content);
            case 'erDiagram':
                return parseCSVToERDiagram(content);
            case 'quadrantChart':
                return parseCSVToQuadrantChart(content);
            case 'xyChart':
                return parseCSVToXYChart(content);
            default:
                return '';
        }
    } catch (error) {
        return `<!-- Error: ${error.message} -->`;
    }
}

/**
 * AdminPanelModal Component
 * Modal for generating diagrams from structured data via Kroki.io
 */
const AdminPanelModal = ({ onClose, darkMode }) => {
    const [diagramType, setDiagramType] = useState('mindmap');
    const [inputText, setInputText] = useState(DIAGRAM_TYPES.mindmap.sampleData);
    const [mermaidCode, setMermaidCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Update sample data when diagram type changes
    const handleDiagramTypeChange = useCallback((type) => {
        setDiagramType(type);
        setInputText(DIAGRAM_TYPES[type].sampleData);
    }, []);

    // Generate Mermaid code when input changes (debounced to prevent flickering)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const code = generateMermaidCode(inputText, diagramType);
            setMermaidCode(code);
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [inputText, diagramType]);

    // Copy code to clipboard
    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(mermaidCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [mermaidCode]);

    // Open in Kroki
    const handleLoadInKroki = useCallback(() => {
        if (!mermaidCode || mermaidCode.includes('Error')) return;
        const encoded = encodeForKroki(mermaidCode);
        const krokiUrl = `https://kroki.io/mermaid/svg/${encoded}`;
        window.open(krokiUrl, '_blank');
    }, [mermaidCode]);

    // Open in Mermaid.live
    const handleEditInMermaidLive = useCallback(() => {
        if (!mermaidCode || mermaidCode.includes('Error')) return;
        const state = {
            code: mermaidCode,
            mermaid: { theme: 'default' }
        };
        const encoded = btoa(JSON.stringify(state));
        window.open(`https://mermaid.live/edit#${encoded}`, '_blank');
    }, [mermaidCode]);

    const currentConfig = DIAGRAM_TYPES[diagramType];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={cn("w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", darkMode ? "bg-slate-900 border border-slate-700 text-white" : "bg-white text-slate-800")}>

                {/* Header */}
                <div className={cn("p-6 border-b flex items-center justify-between", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-blue-500" />
                        Diagram Generator
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Diagram Type Selector */}
                <div className={cn("p-4 border-b", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <label className={cn("block text-sm font-medium mb-2", darkMode ? "text-slate-300" : "text-slate-700")}>
                        Diagram Type
                    </label>
                    <div className="relative">
                        <select
                            value={diagramType}
                            onChange={(e) => handleDiagramTypeChange(e.target.value)}
                            className={cn(
                                "w-full px-4 py-2 rounded-lg border appearance-none cursor-pointer",
                                darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-white border-slate-300 text-slate-800"
                            )}
                        >
                            {Object.entries(DIAGRAM_TYPES).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {config.name} - {config.description}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none opacity-50" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    {/* Input Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className={cn("block text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                                Input Data ({currentConfig.inputFormat === 'csv' ? 'Table Format' : 'Indented List'})
                            </label>
                            <span className={cn("text-xs px-2 py-1 rounded", darkMode ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")}>
                                {currentConfig.description}
                            </span>
                        </div>

                        {/* Conditional rendering: Table for CSV, Hierarchical Table for indented */}
                        {currentConfig.inputFormat === 'csv' ? (
                            <EditableTable
                                headers={currentConfig.headers}
                                initialData={inputText}
                                onChange={setInputText}
                                darkMode={darkMode}
                            />
                        ) : (
                            <HierarchicalTable
                                initialData={inputText}
                                onChange={setInputText}
                                darkMode={darkMode}
                            />
                        )}
                    </div>

                    {/* Output Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={cn("block text-sm font-medium", darkMode ? "text-slate-300" : "text-slate-700")}>
                                Generated Mermaid Code
                            </label>
                            {mermaidCode && !mermaidCode.includes('Error') && (
                                <button
                                    onClick={handleCopyCode}
                                    className={cn(
                                        "px-3 py-1 rounded text-xs font-medium flex items-center gap-1",
                                        copied
                                            ? "bg-emerald-500 text-white"
                                            : darkMode
                                                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    )}
                                >
                                    <Copy className="w-3 h-3" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                        <pre className={cn(
                            "w-full h-72 p-3 rounded-lg border font-mono text-xs overflow-auto",
                            darkMode
                                ? "bg-slate-950 border-slate-700 text-slate-300"
                                : "bg-slate-50 border-slate-300 text-slate-800"
                        )}>
                            {mermaidCode || '// Code will appear here...'}
                        </pre>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={cn("p-6 border-t flex items-center justify-end gap-3", darkMode ? "border-slate-800" : "border-slate-100")}>
                    <button
                        onClick={handleLoadInKroki}
                        disabled={!mermaidCode || mermaidCode.includes('Error')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all",
                            !mermaidCode || mermaidCode.includes('Error')
                                ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500"
                                : darkMode
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                        )}
                    >
                        <ExternalLink className="w-4 h-4" />
                        View in Kroki
                    </button>
                    <button
                        onClick={handleEditInMermaidLive}
                        disabled={!mermaidCode || mermaidCode.includes('Error')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all",
                            !mermaidCode || mermaidCode.includes('Error')
                                ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-500"
                                : darkMode
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                        )}
                    >
                        <ExternalLink className="w-4 h-4" />
                        Edit in Mermaid.live
                    </button>
                </div>
            </div>
        </div>
    );
};

AdminPanelModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    darkMode: PropTypes.bool
};

AdminPanelModal.defaultProps = {
    darkMode: false
};

export default AdminPanelModal;
