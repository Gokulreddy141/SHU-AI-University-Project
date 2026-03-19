import React from "react";
import { AnalyticsData } from "@/types/reports";

interface ReportStatsGridProps {
    data: AnalyticsData;
}

export default function ReportStatsGrid({ data }: ReportStatsGridProps) {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                    Global Integrity Score
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white font-mono">{data.globalIntegrity}%</h3>
                    <span className="text-[#60b38a] text-xs font-mono">+{data.globalIntegrityTrend}%</span>
                </div>
            </div>

            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                    Total Flagged Sessions
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white font-mono">{data.totalFlagged}</h3>
                    <span className="text-[#e64d4d] text-xs font-mono">+{data.totalFlaggedTrend}%</span>
                </div>
            </div>

            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                    Avg. Gaze Deviation
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white font-mono">{data.avgGazeDeviation}</h3>
                    <span className="text-[#60b38a] text-xs font-mono">{data.avgGazeDeviationTrend}%</span>
                </div>
            </div>

            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
                    Total Reports Generated
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white font-mono">{data.totalReports}</h3>
                </div>
            </div>
        </div>
    );
}
