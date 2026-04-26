"use client";
import React from "react";

type ViolationType =
    | "LOOKING_AWAY"
    | "MULTIPLE_FACES"
    | "NO_FACE"
    | "LIP_SYNC_MISMATCH"
    | "FACE_MISMATCH"
    | "TAB_SWITCH"
    | "COPY_PASTE"
    | "VIRTUAL_CAMERA"
    | "DEVTOOLS_ACCESS"
    | "LIVENESS_FAILURE"
    | "SECONDARY_MONITOR"
    | "FULLSCREEN_EXIT"
    | "WINDOW_BLUR"
    | "KEYBOARD_SHORTCUT"
    | "CLIPBOARD_PASTE";

interface ViolationFilterBarProps {
    counts: Record<string, number>;
    activeFilter: string | null;
    onFilterChange: (type: string | null) => void;
}

const VIOLATION_CONFIG: Record<ViolationType, { label: string; color: string; icon: string }> = {
    LOOKING_AWAY: { label: "Looking Away", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "👁" },
    MULTIPLE_FACES: { label: "Multiple Faces", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "👥" },
    NO_FACE: { label: "No Face", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: "🚫" },
    LIP_SYNC_MISMATCH: { label: "Lip Sync", color: "bg-primary-light/20 text-primary-light border-primary/30", icon: "🎙" },
    FACE_MISMATCH: { label: "Face Mismatch", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: "🔒" },
    TAB_SWITCH: { label: "Tab Switch", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "📑" },
    COPY_PASTE: { label: "Copy Paste", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", icon: "✂️" },
    VIRTUAL_CAMERA: { label: "Virtual Camera", color: "bg-red-600/20 text-red-500 border-red-600/30", icon: "🎥" },
    DEVTOOLS_ACCESS: { label: "DevTools", color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", icon: "👨‍💻" },
    LIVENESS_FAILURE: { label: "Liveness Failed", color: "bg-red-800/30 text-red-300 border-red-800/50", icon: "🖼️" },
    SECONDARY_MONITOR: { label: "2nd Monitor", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: "🖥️" },
    FULLSCREEN_EXIT: { label: "Fullscreen Exit", color: "bg-red-500/20 text-red-500 border-red-500/30", icon: "🔳" },
    WINDOW_BLUR: { label: "App Switch", color: "bg-amber-500/20 text-amber-500 border-amber-500/30", icon: "🔄" },
    KEYBOARD_SHORTCUT: { label: "Shortcut", color: "bg-amber-600/20 text-amber-400 border-amber-600/30", icon: "⌨️" },
    CLIPBOARD_PASTE: { label: "Clipboard", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "📋" },
};

export default function ViolationFilterBar({
    counts,
    activeFilter,
    onFilterChange,
}: ViolationFilterBarProps) {
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-wrap gap-2">
            {/* All button */}
            <button
                onClick={() => onFilterChange(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === null
                    ? "bg-white/15 text-white border-white/30"
                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                    }`}
            >
                All ({totalCount})
            </button>

            {/* Type-specific buttons */}
            {(Object.keys(VIOLATION_CONFIG) as ViolationType[]).map((type) => {
                const config = VIOLATION_CONFIG[type];
                const count = counts[type] || 0;
                if (count === 0) return null;

                return (
                    <button
                        key={type}
                        onClick={() => onFilterChange(activeFilter === type ? null : type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === type
                            ? config.color
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                            }`}
                    >
                        {config.icon} {config.label} ({count})
                    </button>
                );
            })}
        </div>
    );
}
