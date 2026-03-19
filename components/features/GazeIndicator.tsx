"use client";
import React from "react";

interface GazeIndicatorProps {
    direction: string;
    lookAwaySeconds: number;
    threshold: number;
}

export default function GazeIndicator({
    direction,
    lookAwaySeconds,
    threshold,
}: GazeIndicatorProps) {
    const isLooking = direction !== "CENTER";
    const progress = isLooking ? Math.min(lookAwaySeconds / threshold, 1) : 0;

    const directionIcon: Record<string, string> = {
        LEFT: "←",
        RIGHT: "→",
        UP: "↑",
        DOWN: "↓",
        CENTER: "●",
    };

    const directionColor = isLooking
        ? progress >= 1
            ? "text-red-400"
            : "text-yellow-400"
        : "text-green-400";

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            {/* Direction icon */}
            <div className={`text-2xl ${directionColor} transition-colors`}>
                {directionIcon[direction] || "●"}
            </div>

            {/* Label + timer bar */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Gaze Direction</span>
                    <span className={`text-xs font-bold ${directionColor}`}>
                        {direction}
                    </span>
                </div>

                {/* Timer progress bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${progress >= 1
                                ? "bg-red-500"
                                : progress > 0.5
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                            }`}
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {isLooking && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        {lookAwaySeconds.toFixed(0)}s / {threshold}s threshold
                    </p>
                )}
            </div>
        </div>
    );
}
