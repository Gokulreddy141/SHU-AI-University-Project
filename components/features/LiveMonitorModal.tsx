"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IViolation } from "@/types/violation";

interface LiveMonitorModalProps {
    sessionId: string;
    candidateName: string;
    examTitle?: string;
    initialSnapshot?: string | null; // pre-seed from war room card so camera shows instantly
    onClose: () => void;
}

interface AiState {
    gazeDirection: string;
    faceCount: number;
    isSpeaking: boolean;
    isLookingAway: boolean;
    activeAlerts: string[];
    integrityScore: number;
}

// ── Signal definitions (26 detectors) ────────────────────────────────────────
interface SignalDef {
    key: string;
    label: string;
    icon: string;
    category: "face" | "audio" | "input" | "environment" | "advanced";
    critical?: boolean;
}

const SIGNALS: SignalDef[] = [
    { key: "NO_FACE",                  label: "Face Presence",       icon: "person",             category: "face" },
    { key: "MULTIPLE_FACES",           label: "Multiple Faces",      icon: "group",              category: "face",        critical: true },
    { key: "FACE_MISMATCH",            label: "Face Identity",       icon: "badge",              category: "face",        critical: true },
    { key: "LIVENESS_CHALLENGE_FAILED",label: "Liveness",            icon: "visibility",         category: "face",        critical: true },
    { key: "LOOKING_AWAY",             label: "Gaze Away",           icon: "center_focus_weak",  category: "face" },
    { key: "PHONE_BELOW_MONITOR",      label: "Phone Below",         icon: "smartphone",         category: "face" },
    { key: "VOICE_ACTIVITY_ANOMALY",   label: "Voice Activity",      icon: "mic",                category: "audio" },
    { key: "LIP_SYNC_MISMATCH",        label: "Lip Sync",            icon: "record_voice_over",  category: "audio" },
    { key: "VOICE_IDENTITY_MISMATCH",  label: "Voice Identity",      icon: "voicemail",          category: "audio",       critical: true },
    { key: "AMBIENT_NOISE",            label: "Ambient Noise",       icon: "volume_up",          category: "audio" },
    { key: "CLIPBOARD_PASTE",          label: "Clipboard Paste",     icon: "content_paste",      category: "input" },
    { key: "KEYBOARD_SHORTCUT",        label: "Screenshot",          icon: "screenshot",         category: "input" },
    { key: "LLM_API_DETECTED",         label: "LLM API Traffic",     icon: "block",              category: "input",       critical: true },
    { key: "TYPING_ANOMALY",           label: "Typing Pattern",      icon: "keyboard",           category: "input" },
    { key: "TYPING_IDENTITY_MISMATCH", label: "Typing Identity",     icon: "fingerprint",        category: "input",       critical: true },
    { key: "SEMANTIC_ANSWER_ANOMALY",  label: "AI-Written Answer",   icon: "psychology",         category: "input",       critical: true },
    { key: "ENVIRONMENT_CHANGE",       label: "Room Change",         icon: "home",               category: "environment" },
    { key: "BIMODAL_GAZE_DETECTED",    label: "Dual Monitor",        icon: "desktop_windows",    category: "environment" },
    { key: "SECOND_SCREEN_DETECTED",   label: "Second Screen",       icon: "monitor_heart",      category: "environment", critical: true },
    { key: "TAB_SWITCH",               label: "Tab Switch",          icon: "tab",                category: "environment" },
    { key: "SCREEN_RECORDING_DETECTED",label: "Screen Recording",    icon: "cast",               category: "environment" },
    { key: "EARPIECE_DETECTED",        label: "Earpiece",            icon: "hearing",            category: "advanced",    critical: true },
    { key: "SMART_GLASSES_DETECTED",   label: "Smart Glasses",       icon: "visibility",         category: "advanced",    critical: true },
    { key: "PHONE_DETECTED",           label: "Phone Visible",       icon: "phone_android",      category: "advanced" },
    { key: "NOTES_DETECTED",           label: "Notes Visible",       icon: "article",            category: "advanced" },
    { key: "SECOND_PERSON",            label: "Second Person",       icon: "person_add",         category: "advanced",    critical: true },
];

const CAT_LABEL: Record<string, string> = {
    face: "Face & Identity",
    audio: "Audio & Voice",
    input: "Input & Clipboard",
    environment: "Environment",
    advanced: "AI Vision",
};
const CAT_ORDER = ["face", "audio", "input", "environment", "advanced"];

const GAZE_ARROW: Record<string, string> = {
    LEFT: "← LEFT", RIGHT: "→ RIGHT", UP: "↑ UP", DOWN: "↓ DOWN",
    CENTER: "● CENTER", UP_LEFT: "↖ UP-L", UP_RIGHT: "↗ UP-R",
    DOWN_LEFT: "↙ DN-L", DOWN_RIGHT: "↘ DN-R",
};

function scoreColor(s: number) {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-amber-400";
    return "text-red-400";
}

function timeAgo(ts: string) {
    const diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
}

const VIOLATION_ICON: Record<string, string> = {
    LOOKING_AWAY: "center_focus_weak", MULTIPLE_FACES: "group", NO_FACE: "person_off",
    LIP_SYNC_MISMATCH: "record_voice_over", FACE_MISMATCH: "badge", TAB_SWITCH: "tab",
    VIRTUAL_CAMERA: "videocam_off", FULLSCREEN_EXIT: "fullscreen_exit",
    WINDOW_BLUR: "blur_on", KEYBOARD_SHORTCUT: "screenshot", CLIPBOARD_PASTE: "content_paste",
    LLM_API_DETECTED: "block", EARPIECE_DETECTED: "hearing", SMART_GLASSES_DETECTED: "smart_display",
    SECOND_SCREEN_DETECTED: "monitor_heart", SECOND_PERSON: "person_add",
    VOICE_IDENTITY_MISMATCH: "voicemail", TYPING_IDENTITY_MISMATCH: "fingerprint",
    SEMANTIC_ANSWER_ANOMALY: "psychology", PHONE_DETECTED: "phone_android",
    NOTES_DETECTED: "article", PHONE_BELOW_MONITOR: "smartphone",
};

const CRITICAL_TYPES = new Set([
    "FACE_MISMATCH", "EARPIECE_DETECTED", "SMART_GLASSES_DETECTED", "LLM_API_DETECTED",
    "SECOND_PERSON", "MULTIPLE_FACES", "VOICE_IDENTITY_MISMATCH", "TYPING_IDENTITY_MISMATCH",
    "SEMANTIC_ANSWER_ANOMALY", "SECOND_SCREEN_DETECTED", "LIVENESS_CHALLENGE_FAILED",
]);

export default function LiveMonitorModal({ sessionId, candidateName, examTitle, initialSnapshot, onClose }: LiveMonitorModalProps) {
    const router = useRouter();

    // Camera snapshot state — pre-seeded from war room card so camera shows instantly
    const [imageBase64, setImageBase64] = useState<string | null>(initialSnapshot ?? null);
    const [capturedAt, setCapturedAt] = useState<Date | null>(initialSnapshot ? new Date() : null);
    const [age, setAge] = useState(0);
    const [aiState, setAiState] = useState<AiState | null>(null);

    // Violations state
    const [violations, setViolations] = useState<IViolation[]>([]);
    const lastViolationTs = useRef<string | null>(null);
    const violationListRef = useRef<HTMLDivElement>(null);

    // ── Fast snapshot polling (every 3s) ─────────────────────────────────────
    useEffect(() => {
        const fetchSnap = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}/snapshot`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.imageBase64) {
                    setImageBase64(data.imageBase64);
                    setCapturedAt(new Date());
                    setAge(0);
                }
                if (data.aiState) setAiState(data.aiState as AiState);
            } catch { /* silent */ }
        };
        fetchSnap();
        const iv = setInterval(fetchSnap, 3000);
        return () => clearInterval(iv);
    }, [sessionId]);

    // Age ticker
    useEffect(() => {
        const iv = setInterval(() => {
            setCapturedAt(prev => {
                if (prev) setAge(Math.round((Date.now() - prev.getTime()) / 1000));
                return prev;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    // ── Live violation polling (every 3s, incremental) ────────────────────────
    const fetchViolations = useCallback(async () => {
        try {
            const url = new URL(`/api/violation/${sessionId}`, window.location.origin);
            if (lastViolationTs.current) url.searchParams.set("since", lastViolationTs.current);
            const res = await fetch(url.toString());
            if (!res.ok) return;
            const data = await res.json();
            const newV: IViolation[] = data.violations || [];
            if (newV.length > 0) {
                setViolations(prev => [...prev, ...newV].slice(-50)); // keep last 50
                lastViolationTs.current = newV[newV.length - 1].timestamp;
                setTimeout(() => {
                    if (violationListRef.current) {
                        violationListRef.current.scrollTop = violationListRef.current.scrollHeight;
                    }
                }, 80);
            }
        } catch { /* silent */ }
    }, [sessionId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchViolations();
        const iv = setInterval(fetchViolations, 3000);
        return () => clearInterval(iv);
    }, [fetchViolations]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Derived AI values
    const gazeLabel = aiState ? (GAZE_ARROW[aiState.gazeDirection] ?? aiState.gazeDirection) : null;
    const faceCount = aiState?.faceCount ?? 1;
    const isSpeaking = aiState?.isSpeaking ?? false;
    const isLookingAway = aiState?.isLookingAway ?? false;
    const integrityScore = aiState?.integrityScore ?? 100;
    const activeAlerts = aiState?.activeAlerts ?? [];

    // Per-signal counts from loaded violations
    const counts: Record<string, number> = {};
    const lastSeen: Record<string, IViolation> = {};
    for (const v of violations) {
        counts[v.type] = (counts[v.type] || 0) + 1;
        if (!lastSeen[v.type] || new Date(v.timestamp) > new Date(lastSeen[v.type].timestamp)) {
            lastSeen[v.type] = v;
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
            {/* ── Header ── */}
            <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-[#3b3b3b] bg-[#111]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        War Room
                    </button>
                    <div className="h-4 w-px bg-[#3b3b3b]" />
                    <div>
                        <h2 className="text-white font-bold text-base leading-tight">{candidateName}</h2>
                        {examTitle && <p className="text-xs text-slate-500 font-mono">{examTitle}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 border border-red-500/40 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase">Live</span>
                    </div>
                    {aiState && (
                        <span className={`text-sm font-bold font-mono ${scoreColor(integrityScore)}`}>
                            Integrity {integrityScore}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/dashboard/session/${sessionId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-[#3b3b3b] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        Full Session
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[1fr_320px_300px]">

                {/* LEFT: Camera feed */}
                <div className="relative bg-black flex items-center justify-center overflow-hidden border-r border-[#2a2a2a]">
                    {imageBase64 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={`data:image/jpeg;base64,${imageBase64}`}
                            alt="Live candidate camera"
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-700">
                            <span className="material-symbols-outlined text-6xl">videocam_off</span>
                            <p className="text-sm">No camera frame yet</p>
                            <p className="text-xs text-slate-600 font-mono">Candidate uploads every 15s · polling every 3s</p>
                            <div className="w-5 h-5 border-2 border-slate-700 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Overlays */}
                    {imageBase64 && (
                        <>
                            {/* LIVE badge + age */}
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded font-mono">
                                    ● LIVE
                                </span>
                                {capturedAt && (
                                    <span className={`text-[10px] font-mono px-2 py-1 rounded ${age > 20 ? "bg-amber-500/80 text-black" : "bg-black/60 text-slate-300"}`}>
                                        {age > 0 ? `${age}s ago` : "just now"}
                                    </span>
                                )}
                            </div>

                            {/* Gaze direction */}
                            {gazeLabel && (
                                <div className="absolute top-4 right-4">
                                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded ${
                                        isLookingAway ? "bg-red-600/90 text-white" : "bg-black/70 text-green-400"
                                    }`}>
                                        {gazeLabel}
                                    </span>
                                </div>
                            )}

                            {/* Face count + speaking */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded flex items-center gap-1 ${
                                    faceCount === 0 ? "bg-red-700/90 text-white"
                                    : faceCount > 1 ? "bg-orange-600/90 text-white"
                                    : "bg-black/70 text-slate-300"
                                }`}>
                                    <span className="material-symbols-outlined text-[13px]">
                                        {faceCount === 0 ? "person_off" : faceCount > 1 ? "group" : "person"}
                                    </span>
                                    {faceCount === 0 ? "No face" : faceCount === 1 ? "1 face" : `${faceCount} faces`}
                                </span>
                                {isSpeaking && (
                                    <span className="bg-blue-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded font-mono animate-pulse">
                                        🎤 Speaking
                                    </span>
                                )}
                            </div>

                            {/* Active alerts */}
                            {activeAlerts.length > 0 && (
                                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
                                    {activeAlerts.slice(-4).map((a, i) => (
                                        <span key={i} className="bg-red-900/90 text-red-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                                            ⚠ {a.replace(/_/g, " ")}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stale overlay */}
                            {age > 30 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-amber-400 font-bold text-sm">⚠ Feed stale — {age}s old</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* MIDDLE: AI Detector Status */}
                <div className="flex flex-col overflow-hidden border-r border-[#2a2a2a]">
                    <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">sensors</span>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white">AI Detectors</h3>
                        <span className="ml-auto text-[9px] font-mono text-slate-600 animate-pulse">● 3s</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                        {CAT_ORDER.map(cat => (
                            <div key={cat}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 px-0.5">
                                    {CAT_LABEL[cat]}
                                </p>
                                <div className="space-y-1">
                                    {SIGNALS.filter(s => s.category === cat).map(sig => {
                                        const count = counts[sig.key] || 0;
                                        const last = lastSeen[sig.key];
                                        const isCrit = sig.critical;
                                        const triggered = count > 0;

                                        let cls = "border-[#2a2a2a] bg-[#141414] text-slate-600";
                                        let dot = "bg-[#2a2a2a]";
                                        let badge = "";

                                        if (triggered) {
                                            if (isCrit) {
                                                cls = "border-red-500/40 bg-red-500/5 text-red-300";
                                                dot = "bg-red-500 animate-pulse";
                                                badge = "text-red-400 bg-red-500/15";
                                            } else {
                                                cls = "border-amber-500/40 bg-amber-500/5 text-amber-300";
                                                dot = "bg-amber-500";
                                                badge = "text-amber-400 bg-amber-500/15";
                                            }
                                        }

                                        return (
                                            <div key={sig.key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                                <span className="material-symbols-outlined text-[13px] flex-shrink-0">{sig.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-semibold leading-tight truncate">{sig.label}</p>
                                                    {last && (
                                                        <p className="text-[9px] opacity-50 font-mono">{timeAgo(last.timestamp)}</p>
                                                    )}
                                                </div>
                                                {count > 0 && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${badge}`}>
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

                {/* RIGHT: Live violation feed */}
                <div className="flex flex-col overflow-hidden">
                    <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white">Violations</h3>
                        <span className="ml-auto text-[9px] font-mono text-slate-600 animate-pulse">● 3s</span>
                    </div>
                    <div
                        ref={violationListRef}
                        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
                    >
                        {violations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-700">
                                <span className="material-symbols-outlined text-3xl mb-2">verified_user</span>
                                <p className="text-xs">No violations yet</p>
                            </div>
                        ) : (
                            [...violations].reverse().map((v, i) => {
                                const isCrit = CRITICAL_TYPES.has(v.type);
                                return (
                                    <div
                                        key={v._id || i}
                                        className={`flex items-start gap-2 p-2.5 rounded-lg border leading-tight ${
                                            isCrit
                                                ? "text-red-400 bg-red-500/8 border-red-500/20"
                                                : "text-amber-400 bg-amber-500/8 border-amber-500/20"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[15px] mt-0.5 flex-shrink-0">
                                            {VIOLATION_ICON[v.type] ?? "warning"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                                    {v.type.replace(/_/g, " ")}
                                                </span>
                                                <span className="text-[9px] font-mono opacity-50 flex-shrink-0">
                                                    {new Date(v.timestamp).toLocaleTimeString([], {
                                                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-[9px] opacity-70 truncate">
                                                {v.direction || (v.duration ? `${v.duration}s` : "Integrity event")}
                                            </p>
                                            {v.confidence != null && (
                                                <p className="text-[9px] opacity-40 font-mono">
                                                    {(v.confidence * 100).toFixed(0)}% confidence
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
