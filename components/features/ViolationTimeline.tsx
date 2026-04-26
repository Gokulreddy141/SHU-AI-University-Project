"use client";
import React from "react";
import { IViolation } from "@/types/violation";

interface ViolationTimelineProps {
    violations: IViolation[];
    startTime?: string;
}

const VIOLATION_ICONS: Record<string, string> = {
    LOOKING_AWAY: "👁",
    MULTIPLE_FACES: "👥",
    NO_FACE: "😶",
    LIP_SYNC_MISMATCH: "🎤",
    FACE_MISMATCH: "🔒",
};

const VIOLATION_COLORS: Record<string, string> = {
    LOOKING_AWAY: "border-yellow-500 bg-yellow-900/20",
    MULTIPLE_FACES: "border-red-500 bg-red-900/20",
    NO_FACE: "border-orange-500 bg-orange-900/20",
    LIP_SYNC_MISMATCH: "border-primary bg-primary/20",
    FACE_MISMATCH: "border-red-600 bg-red-900/30",
};

const VIOLATION_LABELS: Record<string, string> = {
    LOOKING_AWAY: "Looking Away",
    MULTIPLE_FACES: "Multiple Faces",
    NO_FACE: "No Face Detected",
    LIP_SYNC_MISMATCH: "Lip Sync Mismatch",
    FACE_MISMATCH: "Face Mismatch",
};

function formatTimestamp(timestamp: string, startTime?: string): string {
    const ts = new Date(timestamp);
    if (startTime) {
        const start = new Date(startTime);
        const diff = Math.floor((ts.getTime() - start.getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return ts.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function ViolationTimeline({
    violations,
    startTime,
}: ViolationTimelineProps) {
    if (!violations.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-3xl mb-3">🛡️</p>
                <p className="text-lg font-semibold text-gray-300">No Violations</p>
                <p className="text-sm text-gray-500">This session is clean.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {violations.map((v, i) => (
                <div
                    key={v._id || i}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${VIOLATION_COLORS[v.type] || "border-gray-700 bg-white/5"
                        } transition-all hover:bg-white/5`}
                >
                    {/* Icon */}
                    <div className="text-2xl mt-0.5">
                        {VIOLATION_ICONS[v.type] || "⚠️"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">
                                {VIOLATION_LABELS[v.type] || v.type}
                            </span>
                            <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                                {formatTimestamp(v.timestamp, startTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            {v.direction && (
                                <span className="px-2 py-0.5 bg-white/10 rounded-full">
                                    {v.direction}
                                </span>
                            )}
                            {v.duration && <span>{v.duration}s duration</span>}
                            {v.confidence && (
                                <span>{Math.round(v.confidence * 100)}% confidence</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
