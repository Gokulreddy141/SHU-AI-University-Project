"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateExamModalProps {
    recruiterId: string;
    onClose: () => void;
    onCreated: (examId: string) => void;
    redirectOnSuccess?: boolean;
}

const DURATION_PRESETS = [
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hr", value: 60 },
    { label: "90 min", value: 90 },
    { label: "2 hr", value: 120 },
];

const PROCTORING_MODES = [
    {
        value: "light",
        label: "Light",
        icon: "visibility",
        description: "Basic tab-switch & copy-paste detection only.",
        color: "border-green-500/40 bg-green-500/5 text-green-400",
        activeColor: "border-green-500 bg-green-500/15 ring-1 ring-green-500/40",
    },
    {
        value: "standard",
        label: "Standard",
        icon: "shield",
        description: "Face detection, gaze tracking & window focus monitoring.",
        color: "border-blue-500/40 bg-blue-500/5 text-blue-400",
        activeColor: "border-blue-500 bg-blue-500/15 ring-1 ring-blue-500/40",
    },
    {
        value: "strict",
        label: "Strict",
        icon: "security",
        description: "Full AI monitoring — phone, notes, multiple faces & Gemini Live.",
        color: "border-primary/40 bg-primary/5 text-primary-light",
        activeColor: "border-primary bg-primary/15 ring-1 ring-primary/40",
    },
] as const;

type Step = 1 | 2;

export default function CreateExamModal({
    recruiterId,
    onClose,
    onCreated,
    redirectOnSuccess = true,
}: CreateExamModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        duration: 60,
        flagThreshold: 50,
        proctoringMode: "standard" as "light" | "standard" | "strict",
        opensAt: "",
        closesAt: "",
    });

    // Format Date to datetime-local string value (YYYY-MM-DDTHH:mm)
    const toDatetimeLocal = (iso: string) => iso ? iso.slice(0, 16) : "";

    // Min value for opensAt = now (rounded to next minute)
    const nowLocal = () => {
        const d = new Date();
        d.setSeconds(0, 0);
        return d.toISOString().slice(0, 16);
    };

    const scheduleValid = !(form.opensAt && form.closesAt && form.closesAt <= form.opensAt);
    const canProceed = form.title.trim().length >= 3 && form.duration >= 1 && form.duration <= 480 && scheduleValid;

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recruiterId,
                    title: form.title,
                    description: form.description,
                    duration: form.duration,
                    flagThreshold: form.flagThreshold,
                    proctoringMode: form.proctoringMode,
                    opensAt: form.opensAt || null,
                    closesAt: form.closesAt || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.error || "Failed to create exam");

            const examId = data.exam?._id;
            onCreated(examId);
            if (redirectOnSuccess && examId) {
                router.push(`/dashboard/exam/${examId}/questions`);
            } else {
                onClose();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setStep(1);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-[#111] rounded-2xl w-full max-w-lg border border-[#2a2a2a] shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-8 pt-7 pb-5 border-b border-[#1f1f1f]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {([1, 2] as Step[]).map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        step === s ? "bg-primary text-white" :
                                        step > s ? "bg-primary/30 text-primary-light" :
                                        "bg-[#1f1f1f] text-slate-500"
                                    }`}>
                                        {step > s ? <span className="material-symbols-outlined text-[14px]">check</span> : s}
                                    </div>
                                    {s < 2 && <div className={`w-8 h-[2px] rounded ${step > s ? "bg-primary/40" : "bg-[#1f1f1f]"}`} />}
                                </div>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                        {step === 1 ? "Exam Details" : "Proctoring Settings"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {step === 1 ? "Give your exam a name, description and duration." : "Configure monitoring intensity and auto-flagging."}
                    </p>
                </div>

                {/* Body */}
                <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0">
                    {error && (
                        <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <span className="material-symbols-outlined text-[18px] shrink-0">report</span>
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <div className="flex justify-between items-end mb-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Title *</label>
                                    <span className={`text-[10px] ${form.title.length > 90 ? "text-red-400" : "text-slate-600"}`}>
                                        {form.title.length}/100
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={form.title}
                                    maxLength={100}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Senior Frontend Developer Assessment"
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 transition-colors text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <div className="flex justify-between items-end mb-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                    <span className={`text-[10px] ${form.description.length > 450 ? "text-red-400" : "text-slate-600"}`}>
                                        {form.description.length}/500
                                    </span>
                                </div>
                                <textarea
                                    value={form.description}
                                    maxLength={500}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="What skills or topics does this exam cover?"
                                    rows={2}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 resize-none transition-colors text-sm"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration *</label>
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {DURATION_PRESETS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, duration: p.value })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                form.duration === p.value
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "bg-[#1a1a1a] border border-[#2a2a2a] text-slate-400 hover:text-white hover:border-primary/30"
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={form.duration}
                                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        max="480"
                                        className="w-24 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-primary/60 transition-colors text-sm text-center"
                                    />
                                    <span className="text-slate-500 text-sm">minutes &nbsp;(max 480)</span>
                                </div>
                            </div>

                            {/* Schedule Window */}
                            <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-[16px] text-slate-500">schedule</span>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Window</label>
                                    <span className="text-[10px] text-slate-600 ml-1">(optional)</span>
                                </div>
                                <p className="text-[11px] text-slate-600 -mt-1">
                                    Leave blank to allow access at any time. Candidates cannot join before the open time or after the close time.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1.5">Opens At</label>
                                        <input
                                            type="datetime-local"
                                            value={toDatetimeLocal(form.opensAt)}
                                            min={nowLocal()}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm((f) => ({
                                                    ...f,
                                                    opensAt: val,
                                                    // auto-clear closesAt if it becomes invalid
                                                    closesAt: f.closesAt && f.closesAt <= val ? "" : f.closesAt,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-xs focus:outline-none focus:border-primary/60 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1.5">Closes At</label>
                                        <input
                                            type="datetime-local"
                                            value={toDatetimeLocal(form.closesAt)}
                                            min={form.opensAt || nowLocal()}
                                            onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                                            className="w-full px-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-xs focus:outline-none focus:border-primary/60 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                {form.opensAt && form.closesAt && form.closesAt <= form.opensAt && (
                                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        Close time must be after open time.
                                    </p>
                                )}
                                {form.opensAt && !form.closesAt && (
                                    <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">info</span>
                                        Exam opens on schedule but never auto-closes.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Proctoring Mode */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Monitoring Level</label>
                                <div className="space-y-2">
                                    {PROCTORING_MODES.map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, proctoringMode: mode.value })}
                                            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all ${
                                                form.proctoringMode === mode.value ? mode.activeColor : "border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a]"
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                form.proctoringMode === mode.value ? mode.color : "bg-[#1a1a1a] text-slate-500"
                                            }`}>
                                                <span className="material-symbols-outlined text-[18px]">{mode.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{mode.label}</span>
                                                    {form.proctoringMode === mode.value && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{mode.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Flag Threshold */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-Flag Threshold</label>
                                    <span className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                                        form.flagThreshold <= 30 ? "text-green-400 border-green-500/20 bg-green-500/10" :
                                        form.flagThreshold <= 60 ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                                        "text-red-400 border-red-500/20 bg-red-500/10"
                                    }`}>
                                        {form.flagThreshold}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={form.flagThreshold}
                                    onChange={(e) => setForm({ ...form, flagThreshold: parseInt(e.target.value) })}
                                    className="w-full accent-primary h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>Lenient (0%)</span>
                                    <span>Strict (100%)</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    Sessions with an integrity score below this value will be automatically flagged for review.
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Summary</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Title</span>
                                    <span className="text-white font-medium truncate max-w-[200px]">{form.title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Duration</span>
                                    <span className="text-white font-medium">{form.duration} min</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Monitoring</span>
                                    <span className="text-white font-medium capitalize">{form.proctoringMode}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Flag at</span>
                                    <span className="text-white font-medium">{form.flagThreshold}% integrity</span>
                                </div>
                                <div className="border-t border-[#1f1f1f] pt-2 mt-1 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Opens</span>
                                        <span className={`font-medium text-right text-xs ${form.opensAt ? "text-green-400" : "text-slate-600"}`}>
                                            {form.opensAt
                                                ? new Date(form.opensAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                                : "Immediately (no restriction)"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Closes</span>
                                        <span className={`font-medium text-right text-xs ${form.closesAt ? "text-red-400" : "text-slate-600"}`}>
                                            {form.closesAt
                                                ? new Date(form.closesAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                                : "Never (manual close only)"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Edge-case warnings */}
                            {form.opensAt && new Date(form.opensAt) > new Date() && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px]">
                                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">schedule</span>
                                    Candidates will not be able to join until the exam opens. Make sure you add questions before then.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-7 flex items-center justify-between gap-3">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(1)}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        {step === 1 ? "Cancel" : "← Back"}
                    </button>

                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            disabled={!canProceed}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                            Next: Settings
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                            {creating ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">rocket_launch</span>Create & Add Questions</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
