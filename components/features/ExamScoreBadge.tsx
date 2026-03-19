"use client";

import React from "react";

interface ExamScoreBadgeProps {
    score: number;
    maxScore: number;
    status: "pending" | "auto_graded" | "manual_review_required" | "finalized";
}

export function ExamScoreBadge({ score, maxScore, status }: ExamScoreBadgeProps) {
    if (status === "pending") {
        return <div className="text-gray-400 text-sm font-medium">Test in progress</div>;
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Determine colors
    let bgColor = "bg-gray-800";
    let textColor = "text-gray-300";
    let ringColor = "ring-gray-700";

    if (status === "manual_review_required") {
        bgColor = "bg-yellow-900/40";
        textColor = "text-yellow-400";
        ringColor = "ring-yellow-500/50";
    } else if (percentage >= 70) {
        bgColor = "bg-green-900/40";
        textColor = "text-green-400";
        ringColor = "ring-green-500/50";
    } else if (percentage >= 40) {
        bgColor = "bg-yellow-900/40";
        textColor = "text-yellow-400";
        ringColor = "ring-yellow-500/50";
    } else {
        bgColor = "bg-red-900/40";
        textColor = "text-red-400";
        ringColor = "ring-red-500/50";
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${ringColor} ${bgColor}`}>
            <span className={`font-bold ${textColor}`}>
                {score} / {maxScore}
            </span>
            <span className={`text-xs uppercase tracking-wider font-semibold ${textColor} opacity-80`}>
                {status === "manual_review_required" ? "Needs Review" : "Pts"}
            </span>
        </div>
    );
}
