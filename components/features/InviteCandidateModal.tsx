"use client";

import React, { useState } from "react";
import { useExamsList } from "@/hooks/useExamsList";

interface InviteCandidateModalProps {
    recruiterId: string;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedExamId?: string;
}

interface InviteResult {
    name: string;
    email: string;
    tempPassword: string | null;
    isExisting: boolean;
}

function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const stored = localStorage.getItem("user");
        if (!stored) return {};
        const user = JSON.parse(stored);
        return {
            "x-user-id": user._id || "",
            "x-user-role": user.role || "",
        };
    } catch {
        return {};
    }
}

export default function InviteCandidateModal({
    recruiterId,
    onClose,
    onSuccess,
    preSelectedExamId,
}: InviteCandidateModalProps) {
    const { exams, loading: examsLoading } = useExamsList(recruiterId);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedExamId, setSelectedExamId] = useState(preSelectedExamId || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<InviteResult | null>(null);
    const [copied, setCopied] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !selectedExamId) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/candidates/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), examId: selectedExamId }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to invite candidate");
            }

            setResult(data);
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result?.tempPassword) return;
        navigator.clipboard.writeText(result.tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-[#3b3b3b] flex justify-between items-center bg-[#1f1f1f]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_add</span>
                            Invite Candidate
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Create an account and assign them to an exam.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6">
                    {/* Success State */}
                    {result ? (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <span className="material-symbols-outlined text-green-400">check_circle</span>
                                <div>
                                    <p className="text-sm font-bold text-white">
                                        {result.isExisting ? "Candidate assigned to exam" : "Account created & assigned"}
                                    </p>
                                    <p className="text-xs text-slate-400">{result.email}</p>
                                </div>
                            </div>

                            {result.tempPassword ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Temporary Password — Share with candidate
                                    </label>
                                    <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl px-4 py-3">
                                        <code className="flex-1 text-primary-light font-mono text-lg tracking-widest">
                                            {result.tempPassword}
                                        </code>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            title="Copy password"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {copied ? "check" : "content_copy"}
                                            </span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        The candidate can change their password after signing in.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl p-4">
                                    This candidate already had an account. They have been assigned to the exam and can join using the exam code.
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setResult(null); setName(""); setEmail(""); }}
                                    className="flex-1 py-2.5 rounded-xl border border-[#3b3b3b] text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                                >
                                    Invite Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleInvite} className="space-y-5">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    <span className="material-symbols-outlined text-[18px] shrink-0">report</span>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="w-full bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="candidate@company.com"
                                    required
                                    className="w-full bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign to Exam</label>
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    disabled={!!preSelectedExamId || examsLoading}
                                    required
                                    className="w-full h-11 px-4 rounded-xl border border-[#3b3b3b] bg-[#0f0f0f] text-white focus:border-primary focus:outline-none disabled:opacity-50 text-sm appearance-none"
                                >
                                    <option value="" disabled>— Select an exam —</option>
                                    {exams.map((exam) => (
                                        <option key={exam._id} value={exam._id}>
                                            {exam.title} ({exam.sessionCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl border border-[#3b3b3b] text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim() || !email.trim() || !selectedExamId}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Inviting...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
