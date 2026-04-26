"use client";
import React from "react";

interface ProgressBarProps {
    current: number;
    total: number;
    showLabel?: boolean;
    className?: string;
}

export default function ProgressBar({
    current,
    total,
    showLabel = true,
    className = "",
}: ProgressBarProps) {
    const progress = total > 0 ? Math.min(current / total, 1) : 0;
    const percentage = Math.round(progress * 100);
    const isLow = progress < 0.2;
    const isCritical = progress < 0.05;

    const remaining = current;
    const mins = Math.floor(remaining / 60);
    const secs = Math.round(remaining % 60);

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Time Remaining</span>
                    <span
                        className={`text-xs font-mono font-bold ${isCritical
                            ? "text-red-400 animate-pulse"
                            : isLow
                                ? "text-yellow-400"
                                : "text-white"
                            }`}
                    >
                        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                    </span>
                </div>
            )}

            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${isCritical
                        ? "bg-red-500 animate-pulse"
                        : isLow
                            ? "bg-yellow-500"
                            : "bg-gradient-to-r from-primary to-primary-dark"
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
