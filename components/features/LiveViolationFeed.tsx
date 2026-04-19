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
        const iconMap: Record<string, string> = {
            LOOKING_AWAY:               "center_focus_weak",
            MULTIPLE_FACES:             "group",
            NO_FACE:                    "person_off",
            LIP_SYNC_MISMATCH:          "record_voice_over",
            FACE_MISMATCH:              "badge",
            TAB_SWITCH:                 "tab",
            COPY_PASTE:                 "content_copy",
            VIRTUAL_CAMERA:             "videocam_off",
            DEVTOOLS_ACCESS:            "terminal",
            LIVENESS_FAILURE:           "visibility_off",
            SECONDARY_MONITOR:          "monitor",
            FULLSCREEN_EXIT:            "fullscreen_exit",
            WINDOW_BLUR:                "blur_on",
            KEYBOARD_SHORTCUT:          "screenshot",
            CLIPBOARD_PASTE:            "content_paste",
            PHONE_DETECTED:             "phone_android",
            UNAUTHORIZED_MATERIAL:      "gavel",
            HEAD_POSE_ANOMALY:          "accessibility_new",
            AMBIENT_NOISE:              "volume_up",
            TYPING_ANOMALY:             "keyboard",
            SCREEN_RECORDING_DETECTED:  "cast",
            DUPLICATE_TAB:              "layers",
            FACE_PROXIMITY_ANOMALY:     "face",
            EXTENSION_DETECTED:         "extension",
            PUPIL_FOCUS_ANOMALY:        "remove_red_eye",
            RESPONSE_TIME_ANOMALY:      "timer",
            MOUSE_INACTIVITY:           "mouse",
            NETWORK_ANOMALY:            "wifi_off",
            VOICE_ACTIVITY_ANOMALY:     "mic",
            HAND_GESTURE_ANOMALY:       "pan_tool",
            ENVIRONMENT_CHANGE:         "home",
            BLINK_PATTERN_ANOMALY:      "visibility",
            VIRTUAL_DEVICE_DETECTED:    "devices_other",
            SYNTHETIC_AUDIO_DETECTED:   "graphic_eq",
            MICRO_GAZE_ANOMALY:         "radar",
            VM_OR_SANDBOX_DETECTED:     "computer",
            NOTES_DETECTED:             "article",
            SECOND_PERSON:              "person_add",
            // New Tier 1-3
            TYPING_IDENTITY_MISMATCH:   "fingerprint",
            VOICE_IDENTITY_MISMATCH:    "voicemail",
            ROOM_ENVIRONMENT_CHANGE:    "roofing",
            LLM_API_DETECTED:           "block",
            PHONE_BELOW_MONITOR:        "smartphone",
            LIVENESS_CHALLENGE_FAILED:  "no_photography",
            BEHAVIORAL_ANOMALY:         "psychology_alt",
            SEMANTIC_ANSWER_ANOMALY:    "psychology",
            BIMODAL_GAZE_DETECTED:      "desktop_windows",
            // Gemini Advanced
            EARPIECE_DETECTED:          "hearing",
            SMART_GLASSES_DETECTED:     "smart_display",
            SECOND_SCREEN_DETECTED:     "monitor_heart",
        };
        return iconMap[type] ?? "warning";
    };

    const getSeverity = (type: string) => {
        const critical = [
            "FACE_MISMATCH", "VIRTUAL_CAMERA", "MULTIPLE_FACES", "DEVTOOLS_ACCESS",
            "FULLSCREEN_EXIT", "EARPIECE_DETECTED", "SMART_GLASSES_DETECTED",
            "LLM_API_DETECTED", "SECOND_PERSON", "VOICE_IDENTITY_MISMATCH",
            "TYPING_IDENTITY_MISMATCH", "SEMANTIC_ANSWER_ANOMALY", "SECOND_SCREEN_DETECTED",
            "LIVENESS_CHALLENGE_FAILED", "VM_OR_SANDBOX_DETECTED",
        ];
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
                            {v.direction || (v.duration ? `${v.duration}s` : "Integrity event logged")}
                        </p>
                        {v.confidence != null && (
                            <p className="text-[9px] opacity-50 font-mono mt-0.5">
                                confidence: {(v.confidence * 100).toFixed(0)}%
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
