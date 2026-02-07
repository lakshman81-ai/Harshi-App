import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils';
import PropTypes from 'prop-types';

/**
 * HierarchicalTable Component
 * Excel-like table for hierarchical data (mindmaps, timelines)
 * Users paste flat data and use indent/outdent controls to create hierarchy
 * 
 * @param {Object} props
 * @param {string} props.initialData - Initial data (flat or indented text)
 * @param {Function} props.onChange - Callback when data changes
 * @param {boolean} props.darkMode - Dark mode flag
 */
const HierarchicalTable = ({ initialData, onChange, darkMode }) => {
    const [rows, setRows] = useState([]);
    const isInitialMount = useRef(true);
    const lastExternalData = useRef('');

    // Parse input to rows - ONLY when external data actually changes
    useEffect(() => {
        if (initialData === lastExternalData.current) {
            return;
        }

        lastExternalData.current = initialData;

        if (initialData) {
            const lines = initialData.split('\n').filter(line => line.trim());
            const parsedRows = lines.map(line => {
                const leadingSpaces = line.match(/^(\s*)/)[1].length;
                const level = Math.floor(leadingSpaces / 2);
                const text = line.trim();
                return { level, text };
            });
            setRows(parsedRows.length > 0 ? parsedRows : [{ level: 0, text: '' }]);
        } else {
            setRows([{ level: 0, text: '' }]);
        }
    }, [initialData]);

    // Convert rows to indented text and notify parent - SKIP on initial mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (rows.length === 0) return;

        const indentedText = rows
            .map(row => '  '.repeat(row.level) + row.text)
            .join('\n');

        if (indentedText !== lastExternalData.current) {
            lastExternalData.current = indentedText;
            onChange(indentedText);
        }
    }, [rows, onChange]);

    const handleTextChange = useCallback((rowIdx, value) => {
        setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[rowIdx] = { ...newRows[rowIdx], text: value };
            return newRows;
        });
    }, []);

    const handleIndent = useCallback((rowIdx) => {
        if (rowIdx > 0) {
            setRows(prevRows => {
                const newRows = [...prevRows];
                newRows[rowIdx] = { ...newRows[rowIdx], level: Math.min(newRows[rowIdx].level + 1, 5) };
                return newRows;
            });
        }
    }, []);

    const handleOutdent = useCallback((rowIdx) => {
        setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[rowIdx] = { ...newRows[rowIdx], level: Math.max(newRows[rowIdx].level - 1, 0) };
            return newRows;
        });
    }, []);

    const handleAddRow = useCallback((afterIdx) => {
        setRows(prevRows => {
            const newRows = [...prevRows];
            const currentLevel = prevRows[afterIdx]?.level || 0;
            newRows.splice(afterIdx + 1, 0, { level: currentLevel, text: '' });
            return newRows;
        });
    }, []);

    const handleDeleteRow = useCallback((rowIdx) => {
        setRows(prevRows => {
            if (prevRows.length > 1) {
                return prevRows.filter((_, idx) => idx !== rowIdx);
            } else {
                return [{ level: 0, text: '' }];
            }
        });
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Excel-style table */}
            <div className={cn(
                "flex-1 overflow-auto border-2 rounded-lg",
                darkMode ? "border-slate-600" : "border-slate-300"
            )}>
                <table className={cn(
                    "w-full text-sm border-collapse",
                    darkMode ? "bg-slate-900" : "bg-white"
                )}>
                    {/* Column Headers - Excel style */}
                    <thead className={cn(
                        "sticky top-0 z-10",
                        darkMode ? "bg-slate-700" : "bg-gradient-to-b from-slate-100 to-slate-200"
                    )}>
                        <tr>
                            <th className={cn(
                                "w-10 px-2 py-2 text-center font-bold border-r border-b text-xs",
                                darkMode
                                    ? "bg-slate-700 border-slate-600 text-slate-400"
                                    : "bg-slate-200 border-slate-300 text-slate-500"
                            )}>
                                #
                            </th>
                            <th className={cn(
                                "w-24 px-3 py-2 text-center font-bold border-r border-b text-xs uppercase tracking-wider",
                                darkMode
                                    ? "border-slate-600 text-slate-300 bg-slate-700"
                                    : "border-slate-300 text-slate-600 bg-slate-100"
                            )}>
                                LEVEL
                            </th>
                            <th className={cn(
                                "px-3 py-2 text-left font-bold border-r border-b text-xs uppercase tracking-wider",
                                darkMode
                                    ? "border-slate-600 text-slate-300 bg-slate-700"
                                    : "border-slate-300 text-slate-600 bg-slate-100"
                            )}>
                                CONTENT
                            </th>
                            <th className={cn(
                                "w-20 border-b text-center font-bold text-xs uppercase",
                                darkMode ? "border-slate-600 bg-slate-700 text-slate-400" : "border-slate-300 bg-slate-100 text-slate-500"
                            )}>
                                ACTIONS
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={cn(
                                    "group",
                                    rowIdx % 2 === 0
                                        ? (darkMode ? "bg-slate-900" : "bg-white")
                                        : (darkMode ? "bg-slate-850" : "bg-slate-50")
                                )}
                            >
                                {/* Row number */}
                                <td className={cn(
                                    "px-2 py-1 text-center text-xs font-medium border-r border-b",
                                    darkMode
                                        ? "bg-slate-800 border-slate-700 text-slate-500"
                                        : "bg-slate-100 border-slate-200 text-slate-400"
                                )}>
                                    {rowIdx + 1}
                                </td>
                                {/* Level controls */}
                                <td className={cn(
                                    "px-2 py-1 border-r border-b",
                                    darkMode ? "border-slate-700" : "border-slate-200"
                                )}>
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => handleOutdent(rowIdx)}
                                            disabled={row.level === 0}
                                            className={cn(
                                                "p-1 rounded",
                                                row.level === 0
                                                    ? "opacity-30 cursor-not-allowed"
                                                    : darkMode
                                                        ? "hover:bg-slate-600 text-slate-400"
                                                        : "hover:bg-slate-200 text-slate-600"
                                            )}
                                            title="Decrease indent (Shift+Tab)"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className={cn(
                                            "text-sm font-bold w-6 text-center",
                                            darkMode ? "text-blue-400" : "text-blue-600"
                                        )}>
                                            {row.level}
                                        </span>
                                        <button
                                            onClick={() => handleIndent(rowIdx)}
                                            disabled={row.level >= 5 || rowIdx === 0}
                                            className={cn(
                                                "p-1 rounded",
                                                (row.level >= 5 || rowIdx === 0)
                                                    ? "opacity-30 cursor-not-allowed"
                                                    : darkMode
                                                        ? "hover:bg-slate-600 text-slate-400"
                                                        : "hover:bg-slate-200 text-slate-600"
                                            )}
                                            title="Increase indent (Tab)"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                {/* Content cell with visual indent */}
                                <td className={cn(
                                    "p-0 border-r border-b",
                                    darkMode ? "border-slate-700" : "border-slate-200"
                                )}>
                                    <div
                                        className="flex items-center"
                                        style={{ paddingLeft: `${row.level * 24 + 8}px` }}
                                    >
                                        {row.level > 0 && (
                                            <span className={cn(
                                                "mr-2 text-xs",
                                                darkMode ? "text-slate-600" : "text-slate-300"
                                            )}>
                                                {'└─'}
                                            </span>
                                        )}
                                        <input
                                            id={`hierarchy-row-${rowIdx}`}
                                            type="text"
                                            value={row.text}
                                            onChange={(e) => handleTextChange(rowIdx, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddRow(rowIdx);
                                                } else if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    if (e.shiftKey) {
                                                        handleOutdent(rowIdx);
                                                    } else {
                                                        handleIndent(rowIdx);
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "w-full px-2 py-2 outline-none focus:ring-2 focus:ring-inset",
                                                darkMode
                                                    ? "bg-transparent text-slate-300 focus:ring-blue-500 focus:bg-slate-800"
                                                    : "bg-transparent text-slate-800 focus:ring-blue-400 focus:bg-blue-50"
                                            )}
                                            placeholder="Enter content"
                                        />
                                    </div>
                                </td>
                                {/* Action buttons */}
                                <td className={cn(
                                    "px-1 border-b",
                                    darkMode ? "border-slate-700" : "border-slate-200"
                                )}>
                                    <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleAddRow(rowIdx)}
                                            className={cn(
                                                "p-1 rounded",
                                                darkMode
                                                    ? "hover:bg-green-900/30 text-green-400"
                                                    : "hover:bg-green-100 text-green-600"
                                            )}
                                            title="Add row below (Enter)"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRow(rowIdx)}
                                            className={cn(
                                                "p-1 rounded",
                                                darkMode
                                                    ? "hover:bg-red-900/30 text-red-400"
                                                    : "hover:bg-red-100 text-red-600"
                                            )}
                                            title="Delete row"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tip text */}
            <p className={cn("text-xs mt-2", darkMode ? "text-slate-500" : "text-slate-400")}>
                💡 Press <kbd className="px-1 bg-slate-200 dark:bg-slate-700 rounded">Tab</kbd> to indent,
                <kbd className="px-1 bg-slate-200 dark:bg-slate-700 rounded ml-1">Shift+Tab</kbd> to outdent,
                <kbd className="px-1 bg-slate-200 dark:bg-slate-700 rounded ml-1">Enter</kbd> to add new row
            </p>
        </div>
    );
};

HierarchicalTable.propTypes = {
    initialData: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    darkMode: PropTypes.bool
};

HierarchicalTable.defaultProps = {
    initialData: '',
    darkMode: false
};

export default HierarchicalTable;
