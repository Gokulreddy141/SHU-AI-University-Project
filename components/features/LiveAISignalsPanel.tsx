"use client";
import React, { useState, useEffect, useCallback } from "react";
import { IViolation } from "@/types/violation";

interface LiveAISignalsPanelProps {
    sessionId: string;
    isLive: boolean;
}

interface SignalDef {
    key: string;        // violation type(s) that trigger this signal
    label: string;
    icon: string;
    category: "face" | "audio" | "input" | "environment" | "advanced";
}

const SIGNALS: SignalDef[] = [
    // Face
    { key: "NO_FACE",               label: "Face Presence",        icon: "person",            category: "face" },
    { key: "MULTIPLE_FACES",        label: "Multiple Faces",       icon: "group",             category: "face" },
    { key: "FACE_MISMATCH",         label: "Face Identity",        icon: "badge",             category: "face" },
    { key: "LIVENESS_CHALLENGE_FAILED", label: "Liveness",         icon: "visibility",        category: "face" },
    { key: "LOOKING_AWAY",          label: "Gaze Direction",       icon: "center_focus_weak", category: "face" },
    { key: "PHONE_BELOW_MONITOR",   label: "Phone Below Monitor",  icon: "smartphone",        category: "face" },
    { key: "STRESS_DETECTED",       label: "Stress / Emotion",     icon: "sentiment_dissatisfied", category: "face" },
    // Audio
    { key: "VOICE_ACTIVITY_ANOMALY", label: "Voice Activity",      icon: "mic",               category: "audio" },
    { key: "LIP_SYNC_MISMATCH",     label: "Lip Sync",             icon: "record_voice_over", category: "audio" },
    { key: "VOICE_IDENTITY_MISMATCH", label: "Voice Identity",     icon: "voicemail",         category: "audio" },
    { key: "AMBIENT_NOISE",         label: "Ambient Noise",        icon: "volume_up",         category: "audio" },
    // Input
    { key: "CLIPBOARD_PASTE",       label: "Clipboard Paste",      icon: "content_paste",     category: "input" },
    { key: "KEYBOARD_SHORTCUT",     label: "Screenshot Attempt",   icon: "screenshot",        category: "input" },
    { key: "LLM_API_DETECTED",      label: "LLM API Traffic",      icon: "block",             category: "input" },
    { key: "TYPING_ANOMALY",        label: "Typing Pattern",       icon: "keyboard",          category: "input" },
    { key: "TYPING_IDENTITY_MISMATCH", label: "Typing Identity",   icon: "fingerprint",       category: "input" },
    { key: "SEMANTIC_ANSWER_ANOMALY", label: "AI-Written Answer",  icon: "psychology",        category: "input" },
    // Environment
    { key: "ENVIRONMENT_CHANGE",    label: "Room Change",          icon: "home",              category: "environment" },
    { key: "BIMODAL_GAZE_DETECTED", label: "Dual Monitor",         icon: "desktop_windows",   category: "environment" },
    { key: "SECOND_SCREEN_DETECTED", label: "Second Screen",       icon: "monitor_heart",     category: "environment" },
    { key: "TAB_SWITCH",            label: "Tab Switch",           icon: "tab",               category: "environment" },
    { key: "SCREEN_RECORDING_DETECTED", label: "Screen Recording", icon: "cast",              category: "environment" },
    // Advanced (Gemini)
    { key: "EARPIECE_DETECTED",     label: "Earpiece",             icon: "hearing",           category: "advanced" },
    { key: "SMART_GLASSES_DETECTED", label: "Smart Glasses",       icon: "visibility",        category: "advanced" },
    { key: "PHONE_DETECTED",        label: "Phone Visible",        icon: "phone_android",     category: "advanced" },
    { key: "NOTES_DETECTED",        label: "Notes Visible",        icon: "article",           category: "advanced" },
    { key: "SECOND_PERSON",         label: "Second Person",        icon: "person_add",        category: "advanced" },
    { key: "BEHAVIORAL_ANOMALY",    label: "Behavior Shift",       icon: "psychology_alt",    category: "advanced" },
];

const CATEGORY_LABELS: Record<string, string> = {
    face:        "Face & Identity",
    audio:       "Audio & Voice",
    input:       "Input & Clipboard",
    environment: "Environment",
    advanced:    "AI Vision (Gemini)",
};

const CATEGORY_ORDER = ["face", "audio", "input", "environment", "advanced"];

function timeAgo(ts: string): string {
    const diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
}

export default function LiveAISignalsPanel({ sessionId, isLive }: LiveAISignalsPanelProps) {
    const [violations, setViolations] = useState<IViolation[]>([]);
    const [lastSeen, setLastSeen] = useState<Record<string, IViolation>>({});

    const fetchViolations = useCallback(async () => {
        if (!sessionId) return;
        try {
            const res = await fetch(`/api/violation/${sessionId}`);
            if (!res.ok) return;
            const data = await res.json();
            const all: IViolation[] = data.violations || [];
            setViolations(all);

            // Build last-seen map: type → most recent violation
            const map: Record<string, IViolation> = {};
            for (const v of all) {
                if (!map[v.type] || new Date(v.timestamp) > new Date(map[v.type].timestamp)) {
                    map[v.type] = v;
                }
            }
            setLastSeen(map);
        } catch {
            // Silent
        }
    }, [sessionId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchViolations();
        if (!isLive) return;
        const interval = setInterval(fetchViolations, 5000);
        return () => clearInterval(interval);
    }, [isLive, fetchViolations]);

    // Count per type
    const counts: Record<string, number> = {};
    for (const v of violations) {
        counts[v.type] = (counts[v.type] || 0) + 1;
    }

    const totalViolations = violations.length;
    const criticalTypes = new Set(["FACE_MISMATCH", "EARPIECE_DETECTED", "SMART_GLASSES_DETECTED",
        "LLM_API_DETECTED", "SECOND_PERSON", "MULTIPLE_FACES", "VOICE_IDENTITY_MISMATCH",
        "TYPING_IDENTITY_MISMATCH", "SEMANTIC_ANSWER_ANOMALY", "SECOND_SCREEN_DETECTED"]);

    const criticalCount = violations.filter(v => criticalTypes.has(v.type)).length;

    const byCategory = CATEGORY_ORDER.map(cat => ({
        cat,
        signals: SIGNALS.filter(s => s.category === cat),
    }));

    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#0f0f0f] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-[#1a1a1a] border-b border-[#3b3b3b] flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">sensors</span>
                        AI Detector Status
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {totalViolations} events · {criticalCount} critical · {isLive ? "live" : "session ended"}
                    </p>
                </div>
                {isLive && (
                    <span className="text-[10px] font-mono text-slate-600 animate-pulse">● refreshing 5s</span>
                )}
            </div>

            <div className="p-4 space-y-5">
                {byCategory.map(({ cat, signals }) => (
                    <div key={cat}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2 px-1">
                            {CATEGORY_LABELS[cat]}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {signals.map((sig) => {
                                const count = counts[sig.key] || 0;
                                const last = lastSeen[sig.key];
                                const isCritical = criticalTypes.has(sig.key);
                                const isTriggered = count > 0;

                                let stateClass = "border-[#2a2a2a] bg-[#141414] text-slate-600";
                                let dotClass = "bg-[#2a2a2a]";
                                let countClass = "";

                                if (isTriggered) {
                                    if (isCritical) {
                                        stateClass = "border-red-500/40 bg-red-500/5 text-red-300";
                                        dotClass = "bg-red-500 animate-pulse";
                                        countClass = "text-red-400 bg-red-500/15";
                                    } else {
                                        stateClass = "border-amber-500/40 bg-amber-500/5 text-amber-300";
                                        dotClass = "bg-amber-500";
                                        countClass = "text-amber-400 bg-amber-500/15";
                                    }
                                }

                                return (
                                    <div
                                        key={sig.key}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${stateClass}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
                                        <span className="material-symbols-outlined text-[14px] flex-shrink-0">
                                            {sig.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold leading-tight truncate">
                                                {sig.label}
                                            </p>
                                            {last && (
                                                <p className="text-[9px] opacity-60 font-mono leading-none mt-0.5">
                                                    {timeAgo(last.timestamp)}
                                                </p>
                                            )}
                                        </div>
                                        {count > 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${countClass}`}>
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
