import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils';
import PropTypes from 'prop-types';

/**
 * EditableTable Component
 * Excel-like spreadsheet table for CSV data entry
 * 
 * @param {Object} props
 * @param {Array<string>} props.headers - Column headers
 * @param {string} props.initialData - Initial CSV data
 * @param {Function} props.onChange - Callback when data changes
 * @param {boolean} props.darkMode - Dark mode flag
 */
const EditableTable = ({ headers, initialData, onChange, darkMode }) => {
    const [rows, setRows] = useState([]);
    const isInitialMount = useRef(true);
    const lastExternalData = useRef('');

    // Parse CSV to rows - ONLY when external data actually changes
    useEffect(() => {
        // Skip if the data is the same as what we last processed
        if (initialData === lastExternalData.current) {
            return;
        }

        lastExternalData.current = initialData;

        if (initialData) {
            const lines = initialData.split('\n').filter(line => line.trim());
            // Skip header line if present
            const dataLines = lines[0]?.toLowerCase().includes(headers[0]?.toLowerCase())
                ? lines.slice(1)
                : lines;

            const parsedRows = dataLines.map(line => {
                const delimiter = line.includes('\t') ? '\t' : ',';
                const cols = line.split(delimiter).map(c => c.trim());
                // Ensure row has correct number of columns
                while (cols.length < headers.length) cols.push('');
                return cols.slice(0, headers.length);
            });

            setRows(parsedRows.length > 0 ? parsedRows : [Array(headers.length).fill('')]);
        } else {
            setRows([Array(headers.length).fill('')]);
        }
    }, [initialData, headers]);

    // Convert rows to CSV and notify parent - SKIP on initial mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (rows.length === 0) return;

        const csv = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');

        // Only call onChange if the text actually changed
        if (csv !== lastExternalData.current) {
            lastExternalData.current = csv;
            onChange(csv);
        }
    }, [rows, headers, onChange]);

    const handleCellChange = useCallback((rowIdx, colIdx, value) => {
        setRows(prevRows => {
            const newRows = prevRows.map(row => [...row]);
            newRows[rowIdx][colIdx] = value;
            return newRows;
        });
    }, []);

    const handleAddRow = useCallback(() => {
        setRows(prevRows => [...prevRows, Array(headers.length).fill('')]);
    }, [headers.length]);

    const handleDeleteRow = useCallback((rowIdx) => {
        setRows(prevRows => {
            if (prevRows.length > 1) {
                return prevRows.filter((_, idx) => idx !== rowIdx);
            } else {
                return [Array(headers.length).fill('')];
            }
        });
    }, [headers.length]);

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
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        "px-3 py-2 text-left font-bold border-r border-b text-xs uppercase tracking-wider",
                                        darkMode
                                            ? "border-slate-600 text-slate-300 bg-slate-700"
                                            : "border-slate-300 text-slate-600 bg-slate-100"
                                    )}
                                >
                                    {header}
                                </th>
                            ))}
                            <th className={cn(
                                "w-10 border-b",
                                darkMode ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-slate-100"
                            )}></th>
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
                                {/* Data cells */}
                                {row.map((cell, colIdx) => (
                                    <td
                                        key={colIdx}
                                        className={cn(
                                            "p-0 border-r border-b",
                                            darkMode ? "border-slate-700" : "border-slate-200"
                                        )}
                                    >
                                        <input
                                            id={`cell-${rowIdx}-${colIdx}`}
                                            type="text"
                                            value={cell}
                                            onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                            className={cn(
                                                "w-full px-3 py-2 outline-none focus:ring-2 focus:ring-inset",
                                                darkMode
                                                    ? "bg-transparent text-slate-300 focus:ring-blue-500 focus:bg-slate-800"
                                                    : "bg-transparent text-slate-800 focus:ring-blue-400 focus:bg-blue-50"
                                            )}
                                            placeholder={`Enter ${headers[colIdx]}`}
                                        />
                                    </td>
                                ))}
                                {/* Delete button */}
                                <td className={cn(
                                    "px-1 border-b",
                                    darkMode ? "border-slate-700" : "border-slate-200"
                                )}>
                                    <button
                                        onClick={() => handleDeleteRow(rowIdx)}
                                        className={cn(
                                            "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                            darkMode
                                                ? "hover:bg-red-900/30 text-red-400"
                                                : "hover:bg-red-100 text-red-600"
                                        )}
                                        title="Delete row"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Row Button - Excel style */}
            <button
                onClick={handleAddRow}
                className={cn(
                    "mt-2 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors border",
                    darkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                )}
            >
                <Plus className="w-4 h-4" />
                Add Row
            </button>
        </div>
    );
};

EditableTable.propTypes = {
    headers: PropTypes.arrayOf(PropTypes.string).isRequired,
    initialData: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    darkMode: PropTypes.bool
};

EditableTable.defaultProps = {
    initialData: '',
    darkMode: false
};

export default EditableTable;
