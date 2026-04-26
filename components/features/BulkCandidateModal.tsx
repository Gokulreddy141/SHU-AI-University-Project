"use client";

import React, { useState, useRef } from "react";
import { useBulkCandidateImport } from "@/hooks/useBulkCandidateImport";
import { useExamsList } from "@/hooks/useExamsList";
import { IBulkCandidateInput } from "@/types/candidate";

interface BulkCandidateModalProps {
    recruiterId: string;
    onClose: () => void;
    onSuccess: (usersCreated: number, sessionsCreated: number) => void;
    preSelectedExamId?: string; // If opening from a specific exam's page
}

export default function BulkCandidateModal({ recruiterId, onClose, onSuccess, preSelectedExamId }: BulkCandidateModalProps) {
    const { importFile, saveBulkCandidates, isParsing, isImporting, error } = useBulkCandidateImport();
    const { exams, loading: examsLoading } = useExamsList(recruiterId);

    const [selectedExamId, setSelectedExamId] = useState<string>(preSelectedExamId || "");
    const [previewCandidates, setPreviewCandidates] = useState<IBulkCandidateInput[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setFileName(file.name);
            const parsed = await importFile(file);
            setPreviewCandidates(parsed);
        } catch (err) {
            console.error("Parsing failed", err);
            setFileName(null);
            setPreviewCandidates([]);
        }
    };

    const handleConfirmImport = async () => {
        if (previewCandidates.length === 0 || !selectedExamId) return;
        try {
            const result = await saveBulkCandidates(selectedExamId, recruiterId, previewCandidates);
            onSuccess(result.usersCreated, result.sessionsCreated);
            onClose();
        } catch (err) {
            console.error("Import failed", err);
        }
    };

    const downloadTemplate = () => {
        const headers = ["Name", "Email", "Phone", "Department"];
        const row1 = ["John Doe", "john.doe@example.com", "555-0100", "Engineering"];
        const row2 = ["Jane Smith", "jane.smith@example.com", "", "Sales"];

        const csvContent = [headers, row1, row2].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "candidate_invite_template.csv");
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
                            <span className="material-symbols-outlined text-primary">group_add</span>
                            Bulk Invite Candidates
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Upload a CSV/Excel file to auto-create user accounts and assign them to an exam.</p>
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

                    <div className="mb-6 space-y-2 max-w-md">
                        <label className="text-sm font-bold text-slate-300">Select Exam Destination *</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            disabled={!!preSelectedExamId || examsLoading}
                            className="w-full h-11 px-4 rounded-xl border border-[#3b3b3b] bg-[#0f0f0f] text-white focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 appearance-none"
                        >
                            <option value="" disabled>-- Select an active exam --</option>
                            {exams.map(exam => (
                                <option key={exam._id} value={exam._id}>{exam.title} ({exam.sessionCode})</option>
                            ))}
                        </select>
                    </div>

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
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{previewCandidates.length} valid candidates detected</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setFileName(null); setPreviewCandidates([]); }}
                                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10"
                                >
                                    Change File
                                </button>
                            </div>

                            <div className="border border-[#3b3b3b] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#1f1f1f] text-slate-400 uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Phone</th>
                                            <th className="px-4 py-3">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3b3b3b] bg-black/20">
                                        {previewCandidates.map((c, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                                                <td className="px-4 py-3 text-slate-300 font-mono">{c.email}</td>
                                                <td className="px-4 py-3 text-slate-500">{c.phone || "—"}</td>
                                                <td className="px-4 py-3 text-slate-500">{c.department || "—"}</td>
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
                        disabled={previewCandidates.length === 0 || !selectedExamId || isImporting || isParsing}
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
