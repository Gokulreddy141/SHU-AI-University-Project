"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { IViolation } from "@/types/violation";

interface LiveViolationFeedProps {
    sessionId: string;
    refreshInterval?: number;
}

export default function LiveViolationFeed({
    sessionId,
    refreshInterval = 3000,
}: LiveViolationFeedProps) {
    const [violations, setViolations] = useState<IViolation[]>([]);
    const [loading, setLoading] = useState(true);
    const lastTimestamp = useRef<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchNewViolations = useCallback(async () => {
        if (!sessionId) return;
        try {
            const url = new URL(`/api/violation/${sessionId}`, window.location.origin);
            if (lastTimestamp.current) {
                url.searchParams.set("since", lastTimestamp.current);
            }

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const newViolations: IViolation[] = data.violations || [];

            if (newViolations.length > 0) {
                setViolations((prev) => [...prev, ...newViolations]);
                lastTimestamp.current = newViolations[newViolations.length - 1].timestamp;

                // Auto-scroll to bottom
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                }, 100);
            }
        } catch (err) {
            console.error("Live violation poll error:", err);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchNewViolations(); // Initial fetch
        const interval = setInterval(fetchNewViolations, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchNewViolations, refreshInterval]);

    const getIcon = (type: string) => {
        switch (type) {
            case "LOOKING_AWAY": return "visibility";
            case "MULTIPLE_FACES": return "group";
            case "NO_FACE": return "person_off";
            case "LIP_SYNC_MISMATCH": return "record_voice_over";
            case "FACE_MISMATCH": return "badge";
            case "TAB_SWITCH": return "tab";
            case "COPY_PASTE": return "content_copy";
            case "VIRTUAL_CAMERA": return "videocam_off";
            case "DEVTOOLS_ACCESS": return "terminal";
            case "FULLSCREEN_EXIT": return "fullscreen_exit";
            case "WINDOW_BLUR": return "blur_on";
            case "KEYBOARD_SHORTCUT": return "keyboard";
            case "CLIPBOARD_PASTE": return "content_paste";
            default: return "warning";
        }
    };

    const getSeverity = (type: string) => {
        const critical = ["FACE_MISMATCH", "VIRTUAL_CAMERA", "MULTIPLE_FACES", "DEVTOOLS_ACCESS", "FULLSCREEN_EXIT"];
        if (critical.includes(type)) return "text-red-500 bg-red-500/10 border-red-500/20";
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    };

    if (loading && violations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs">Initializing live feed...</p>
            </div>
        );
    }

    if (violations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/10 rounded-xl border border-dashed border-slate-800">
                <span className="material-symbols-outlined text-4xl text-slate-700 mb-2">verified_user</span>
                <p className="text-sm font-medium text-slate-400">No violations detected yet</p>
                <p className="text-xs text-slate-600 mt-1">Monitoring active components...</p>
            </div>
        );
    }

    return (
        <div ref={scrollRef} className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {violations.map((v, i) => (
                <div
                    key={v._id || i}
                    className={`flex items-start gap-3 p-3 rounded-lg border leading-tight animate-in slide-in-from-right-4 duration-300 ${getSeverity(v.type)}`}
                >
                    <span className="material-symbols-outlined text-xl mt-0.5">
                        {getIcon(v.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-xs uppercase tracking-wider">
                                {v.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] opacity-60 font-mono">
                                {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-xs opacity-90 truncate">
                            {v.direction ? `Direction: ${v.direction}` : ""}
                            {v.duration ? `Duration: ${v.duration}s` : ""}
                            {!v.direction && !v.duration ? "Integrity event logged" : ""}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
