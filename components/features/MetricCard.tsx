import React from "react";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: string;
    trendValue?: string;
    trendLabel?: string;
    trendUp?: boolean;
    colorClass: "emerald" | "blue" | "primary" | "red";
    isProgressBar?: boolean;
    progressPercentage?: number;
}

export default function MetricCard({
    title,
    value,
    icon,
    trendValue,
    trendLabel,
    trendUp = true,
    colorClass,
    isProgressBar = false,
    progressPercentage = 0,
}: MetricCardProps) {
    const colorMap = {
        emerald: {
            bg: "bg-emerald-500/10",
            text: "text-emerald-500",
            borderHover: "hover:border-emerald-500/50",
            trendText: "text-emerald-500",
        },
        blue: {
            bg: "bg-blue-500/10",
            text: "text-blue-500",
            borderHover: "hover:border-blue-500/50",
            trendText: "text-emerald-500", 
        },
        primary: {
            bg: "bg-primary/10",
            text: "text-primary",
            borderHover: "hover:border-primary/50",
            trendText: "text-primary",
        },
        red: {
            bg: "bg-red-500/10",
            text: "text-red-500",
            borderHover: "hover:border-red-500/50",
            trendText: "text-red-500",
        },
    };

    const colors = colorMap[colorClass];

    return (
        <div
            className={`rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 transition-all ${colors.borderHover} relative overflow-hidden`}
        >
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}
                >
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>

            {isProgressBar ? (
                <div className="mt-4 h-2 w-full rounded-full bg-[#262626] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            ) : (
                trendValue && (
                    <div className="mt-4 flex items-center gap-2 text-sm relative z-10">
                        <span className={`flex items-center ${trendUp ? "text-emerald-500" : "text-red-500"}`}>
                            <span className="material-symbols-outlined text-sm">
                                {trendUp ? "trending_up" : "arrow_upward"}
                            </span>
                            <span className="font-medium ml-1">{trendValue}</span>
                        </span>
                        {trendLabel && <span className="text-slate-500">{trendLabel}</span>}
                    </div>
                )
            )}

            {colorClass === "red" && (
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full border-8 border-red-500/10 opacity-50"></div>
            )}
        </div>
    );
}
