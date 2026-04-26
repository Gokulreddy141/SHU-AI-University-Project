"use client";
import React from "react";

interface StatusBadgeProps {
    status: string;
    size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    biometric_check: { label: "Biometric Check", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    in_progress: { label: "In Progress", className: "bg-green-500/20 text-green-400 border-green-500/30 animate-pulse" },
    completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    flagged: { label: "Flagged", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    active: { label: "Active", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    closed: { label: "Closed", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    draft: { label: "Draft", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };

    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

    return (
        <span
            className={`inline-flex items-center rounded-full border font-semibold ${config.className} ${sizeClasses}`}
        >
            {config.label}
        </span>
    );
}
