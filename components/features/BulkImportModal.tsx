"use client";

import React, { useState, useRef } from "react";
import { useBulkImport } from "@/hooks/useBulkImport";
import { IBulkQuestionInput } from "@/types/question";

interface BulkImportModalProps {
    examId: string;
    onClose: () => void;
    onSuccess: (count: number) => void;
}

export default function BulkImportModal({ examId, onClose, onSuccess }: BulkImportModalProps) {
    const { importFile, saveBulkQuestions, isParsing, isImporting, error } = useBulkImport(examId);
    const [previewQuestions, setPreviewQuestions] = useState<IBulkQuestionInput[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setFileName(file.name);
            const questions = await importFile(file);
            setPreviewQuestions(questions);
        } catch (err) {
            console.error("Parsing failed", err);
            setFileName(null);
            setPreviewQuestions([]);
        }
    };

    const handleConfirmImport = async () => {
        if (previewQuestions.length === 0) return;
        try {
            const result = await saveBulkQuestions(previewQuestions);
            onSuccess(result.count);
            onClose();
        } catch (err) {
            console.error("Import failed", err);
        }
    };

    const downloadTemplate = () => {
        const headers = ["Type", "Text", "Points", "Options", "CorrectIndex", "Languages", "StarterCode", "ExpectedOutput"];
        const row1 = ["MCQ", "What is React?", "5", "A library;A framework;A language", "0", "", "", ""];
        const row2 = ["CODING", "Create a function to add two numbers", "10", "", "", "javascript;python", "function add(a, b) {\n  \n}", "5"];

        const csvContent = [headers, row1, row2].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "questions_template.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-[#3b3b3b] flex justify-between items-center bg-[#1f1f1f]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">upload_file</span>
                            Bulk Import Questions
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Upload CSV or Excel files to add multiple questions at once.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                            <span className="material-symbols-outlined shrink-0">report</span>
                            {error}
                        </div>
                    )}

                    {!fileName ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#3b3b3b] rounded-2xl bg-[#0f0f0f] hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-5xl text-slate-600 group-hover:text-primary transition-colors mb-4">cloud_upload</span>
                            <h3 className="text-lg font-semibold text-white mb-1">Click to upload or drag & drop</h3>
                            <p className="text-sm text-slate-500 mb-6 font-mono">Supported formats: .CSV, .XLSX (Max 200 rows)</p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    Select File
                                </button>
                                <button
                                    onClick={downloadTemplate}
                                    className="px-6 py-2.5 rounded-xl border border-[#3b3b3b] text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                                >
                                    Download Template
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-[#0f0f0f] p-4 rounded-xl border border-[#3b3b3b]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">description</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{fileName}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{previewQuestions.length} questions detected</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setFileName(null); setPreviewQuestions([]); }}
                                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
                                >
                                    Change File
                                </button>
                            </div>

                            <div className="border border-[#3b3b3b] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#1f1f1f] text-slate-400 uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Question Text</th>
                                            <th className="px-4 py-3">Details</th>
                                            <th className="px-4 py-3 text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3b3b3b] bg-black/20">
                                        {previewQuestions.map((q, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${q.type === 'CODING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                        {q.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate text-slate-300">{q.text}</td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {q.type === 'MCQ'
                                                        ? `${q.options?.length || 0} options`
                                                        : `${q.allowedLanguages?.length || 0} languages`}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-white">{q.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#3b3b3b] flex justify-end gap-3 bg-[#1f1f1f]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmImport}
                        disabled={previewQuestions.length === 0 || isImporting || isParsing}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {isImporting ? "sync" : "cloud_upload"}
                        </span>
                        {isImporting ? "Importing..." : "Confirm & Import"}
                    </button>
                </div>
            </div>
        </div>
    );
}
