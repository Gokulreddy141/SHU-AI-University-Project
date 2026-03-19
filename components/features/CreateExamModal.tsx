"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateExamModalProps {
    recruiterId: string;
    onClose: () => void;
    onCreated: (examId: string) => void;
    redirectOnSuccess?: boolean;
}

export default function CreateExamModal({
    recruiterId,
    onClose,
    onCreated,
    redirectOnSuccess = true
}: CreateExamModalProps) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        duration: 30,
        flagThreshold: 50,
    });

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        if (form.title.length < 3) {
            setError("Title must be at least 3 characters");
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const res = await fetch("/api/exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recruiterId, ...form }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || data.error || "Failed to create exam");
            }

            const examId = data.exam?._id;
            onCreated(examId);

            if (redirectOnSuccess && examId) {
                router.push(`/dashboard/exam/${examId}/questions`);
            } else {
                onClose();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-md border border-[#3b3b3b] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-6 text-white">Create New Exam</h2>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800/50 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-sm text-slate-400">Exam Title *</label>
                            <span className={`text-[10px] ${form.title.length > 90 ? 'text-red-400' : 'text-slate-600'}`}>
                                {form.title.length}/100
                            </span>
                        </div>
                        <input
                            type="text"
                            value={form.title}
                            maxLength={100}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Frontend Developer Interview"
                            className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-sm text-slate-400">Description</label>
                            <span className={`text-[10px] ${form.description.length > 450 ? 'text-red-400' : 'text-slate-600'}`}>
                                {form.description.length}/500
                            </span>
                        </div>
                        <textarea
                            value={form.description}
                            maxLength={500}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Brief description of the exam..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary resize-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Duration (min) *</label>
                            <input
                                type="number"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                                min="1"
                                max="480"
                                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl text-white focus:outline-none focus:border-primary transition-colors text-sm"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Max 8 hours (480m)
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Flag Threshold (0–100)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={form.flagThreshold}
                                onChange={(e) => setForm({ ...form, flagThreshold: parseInt(e.target.value) })}
                                className="flex-1 accent-primary h-1.5 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-mono text-white w-8 text-right">
                                {form.flagThreshold}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Sessions below this score are automatically flagged.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t border-[#3b3b3b] pt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!form.title.trim() || form.title.length < 3 || creating}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-primary/20"
                    >
                        {creating ? "Creating..." : "Create & Add Questions"}
                    </button>
                </div>
            </div>
        </div>
    );
}
