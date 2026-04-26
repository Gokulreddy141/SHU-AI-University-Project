"use client";
import React from "react";

interface IntegrityScoreBadgeProps {
    score: number;
    size?: "sm" | "md" | "lg";
}

export default function IntegrityScoreBadge({
    score,
    size = "md",
}: IntegrityScoreBadgeProps) {
    const getColor = () => {
        if (score >= 80) return { ring: "text-green-500", bg: "bg-green-500/10", label: "Clean", textColor: "text-green-400" };
        if (score >= 60) return { ring: "text-yellow-500", bg: "bg-yellow-500/10", label: "Moderate", textColor: "text-yellow-400" };
        return { ring: "text-red-500", bg: "bg-red-500/10", label: "Flagged", textColor: "text-red-400" };
    };

    const { ring, bg, label, textColor } = getColor();

    const sizeClasses = {
        sm: { container: "w-16 h-16", text: "text-lg", label: "text-[10px]" },
        md: { container: "w-28 h-28", text: "text-3xl", label: "text-xs" },
        lg: { container: "w-40 h-40", text: "text-5xl", label: "text-sm" },
    };

    const { container, text, label: labelSize } = sizeClasses[size];

    // SVG circle for the ring
    const radius = size === "sm" ? 28 : size === "md" ? 50 : 72;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const svgSize = size === "sm" ? 64 : size === "md" ? 112 : 160;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`relative ${container} flex items-center justify-center`}>
                {/* Background ring */}
                <svg className="absolute inset-0" width={svgSize} height={svgSize}>
                    <circle
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={size === "sm" ? 3 : 4}
                        className="text-gray-800"
                    />
                    <circle
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={size === "sm" ? 3 : 4}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={`${ring} transition-all duration-1000 ease-out`}
                        transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                    />
                </svg>
                {/* Score number */}
                <span className={`${text} font-bold text-white z-10`}>{score}</span>
            </div>
            <span className={`${labelSize} font-semibold ${textColor} ${bg} px-3 py-1 rounded-full`}>
                {label}
            </span>
        </div>
    );
}
