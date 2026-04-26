import React from "react";
import { AnalyticsData } from "@/types/reports";

interface ReportStatsGridProps {
    data: AnalyticsData;
}

function trendColor(val: number) {
    if (val > 0) return "text-red-400";
    if (val < 0) return "text-green-400";
    return "text-slate-500";
}

function Stat({ label, value, sub, subColor }: { label: string; value: string | number; sub?: string; subColor?: string }) {
    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white font-mono">{value}</h3>
                {sub && <span className={`text-xs font-mono ${subColor ?? "text-slate-500"}`}>{sub}</span>}
            </div>
        </div>
    );
}

export default function ReportStatsGrid({ data }: ReportStatsGridProps) {
    const integrityTrend = data.globalIntegrityTrend;
    const flaggedTrend = data.totalFlaggedTrend;

    return (
        <div className="space-y-4">
            {/* Row 1: integrity score hero + 3 key stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1 rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider font-mono">Global Integrity Score</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-white font-mono">{data.globalIntegrity}%</h3>
                        <span className={`text-xs font-mono ${integrityTrend >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {integrityTrend >= 0 ? "+" : ""}{integrityTrend}%
                        </span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-[#3b3b3b] overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${data.globalIntegrity >= 80 ? "bg-green-500" : data.globalIntegrity >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${data.globalIntegrity}%` }}
                        />
                    </div>
                </div>
                <Stat label="Total Sessions" value={data.totalSessions ?? data.totalReports} />
                <Stat
                    label="Completed"
                    value={data.completedSessions ?? "—"}
                    sub={data.totalSessions > 0 ? `${Math.round(((data.completedSessions ?? 0) / data.totalSessions) * 100)}% of total` : undefined}
                    subColor="text-slate-500"
                />
                <Stat
                    label="Flagged Sessions"
                    value={data.totalFlagged}
                    sub={flaggedTrend !== 0 ? `${flaggedTrend > 0 ? "+" : ""}${flaggedTrend}% vs last month` : "no change"}
                    subColor={trendColor(flaggedTrend)}
                />
            </div>

            {/* Row 2: secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Stat
                    label="Pass Rate"
                    value={data.passRate !== null ? `${data.passRate}%` : "—"}
                    sub={data.passRate === null ? "no finished sessions" : data.passRate >= 80 ? "healthy" : data.passRate >= 60 ? "moderate" : "needs review"}
                    subColor={data.passRate === null ? "text-slate-600" : data.passRate >= 80 ? "text-green-400" : data.passRate >= 60 ? "text-amber-400" : "text-red-400"}
                />
                <Stat label="Avg Gaze Deviation" value={data.avgGazeDeviation} />
                <Stat
                    label="Avg Violations / Session"
                    value={data.avgViolationsPerSession ?? 0}
                    sub={data.avgViolationsPerSession > 5 ? "high" : data.avgViolationsPerSession > 2 ? "moderate" : "low"}
                    subColor={data.avgViolationsPerSession > 5 ? "text-red-400" : data.avgViolationsPerSession > 2 ? "text-amber-400" : "text-green-400"}
                />
            </div>
        </div>
    );
}
