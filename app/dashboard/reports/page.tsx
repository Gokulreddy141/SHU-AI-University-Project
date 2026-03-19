"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import ReportStatsGrid from "@/components/features/ReportStatsGrid";
import ReportStatsGridSkeleton from "@/components/features/ReportStatsGridSkeleton";
import TrendChart from "@/components/features/TrendChart";
import TrendChartSkeleton from "@/components/features/TrendChartSkeleton";
import HeatmapTable from "@/components/features/HeatmapTable";
import HeatmapTableSkeleton from "@/components/features/HeatmapTableSkeleton";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

export default function ReportsPage() {
    const router = useRouter();
    const { data, loading, error } = useAnalytics();

    // Auth guard
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
    }, [router]);

    if (loading || !data) {
        return (
            <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-full">
                <ReportStatsGridSkeleton />
                <TrendChartSkeleton />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <HeatmapTableSkeleton />
                    <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 flex flex-col">
                        <div className="mb-6 space-y-1.5">
                            <ShimmerBlock className="h-5 w-32" />
                            <ShimmerBlock className="h-3 w-48" />
                        </div>
                        <div className="space-y-3 flex-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f]">
                                    <div className="flex items-center gap-3">
                                        <ShimmerBlock className="h-10 w-10" rounded="md" />
                                        <div className="space-y-1.5">
                                            <ShimmerBlock className="h-4 w-36" />
                                            <ShimmerBlock className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <ShimmerBlock className="h-6 w-6" rounded="md" />
                                </div>
                            ))}
                        </div>
                        <ShimmerBlock className="mt-6 h-10 w-full" rounded="lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center p-10 min-h-screen">
                <p className="text-[#e64d4d]">Error loading analytics: {error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-full">
            <ReportStatsGrid data={data} />

            <TrendChart trends={data.integrityTrends} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <HeatmapTable heatmap={data.heatmap} />

                {/* Recent Reports List Widget */}
                <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white">Recent Reports</h3>
                        <p className="text-sm text-slate-400">Download system-generated insights.</p>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {/* Static mocks mapping the template until S3 document storage is built in future scope */}
                        <ReportDownloadItem
                            icon="picture_as_pdf"
                            color="text-[#e64d4d]"
                            bg="bg-[#e64d4d]/10"
                            name="Monthly_Audit_Oct.pdf"
                            meta="2.4 MB • Oct 31, 2023"
                        />
                        <ReportDownloadItem
                            icon="csv"
                            color="text-[#60b38a]"
                            bg="bg-[#60b38a]/10"
                            name="Integrity_Dataset_Q4.csv"
                            meta="12.1 MB • Oct 30, 2023"
                        />
                        <ReportDownloadItem
                            icon="picture_as_pdf"
                            color="text-[#e64d4d]"
                            bg="bg-[#e64d4d]/10"
                            name="Top_Performers_Oct.pdf"
                            meta="1.8 MB • Oct 29, 2023"
                        />
                        <ReportDownloadItem
                            icon="csv"
                            color="text-[#60b38a]"
                            bg="bg-[#60b38a]/10"
                            name="Anomaly_Logs_Weekly.csv"
                            meta="456 KB • Oct 28, 2023"
                        />
                    </div>

                    <button
                        onClick={() => alert("Custom Report Generator UI - Future Scope")}
                        className="mt-6 w-full py-2.5 rounded-lg border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                    >
                        Generate Custom Report
                    </button>
                </div>
            </div>

            {/* Recent Violations Table */}
            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden">
                <div className="p-6 border-b border-[#3b3b3b] flex items-center justify-between bg-[#1a1a1a]/50">
                    <h3 className="text-lg font-bold text-white">Recent Integrity Violations</h3>
                    <div className="flex gap-4">
                        <select className="bg-[#0f0f0f] border-[#3b3b3b] text-xs font-mono text-slate-300 rounded focus:ring-primary p-2">
                            <option>All Violations</option>
                            <option>Gaze Tracking</option>
                            <option>Tab Switching</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-slate-500 border-b border-[#3b3b3b] font-mono uppercase text-[10px]">
                                <th className="px-6 py-4">Candidate</th>
                                <th className="px-6 py-4">Violation Type</th>
                                <th className="px-6 py-4 text-center">Severity</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3b3b3b]/30">
                            {data.recentViolations.map((v) => (
                                <tr key={v.id} className="hover:bg-[#262626]/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {v.candidateAvatar ? (
                                                <div className="w-8 h-8 rounded-full bg-[#262626] overflow-hidden relative">
                                                    <Image alt={v.candidateName} className="object-cover" src={v.candidateAvatar} fill unoptimized />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-[10px] font-bold">
                                                    {v.candidateInitials}
                                                </div>
                                            )}
                                            <span className="font-medium text-white">{v.candidateName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{v.type}</td>
                                    <td className="px-6 py-4 text-center">
                                        {v.severity === "critical" ? (
                                            <span className="px-2 py-0.5 rounded bg-[#e64d4d]/10 text-[#e64d4d] text-[10px] font-bold border border-[#e64d4d]/20 uppercase">
                                                Critical
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase">
                                                Moderate
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{v.timestamp}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary hover:underline text-xs">Review Session</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Sub-component for Report list
function ReportDownloadItem({ icon, color, bg, name, meta }: { icon: string, color: string, bg: string, name: string, meta: string }) {
    return (
        <div className="group flex items-center justify-between p-3 rounded-lg border border-[#3b3b3b] hover:border-primary/50 bg-[#0f0f0f] transition-all">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 flex items-center justify-center rounded ${bg} ${color}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{meta}</p>
                </div>
            </div>
            <button className="text-slate-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">download</span>
            </button>
        </div>
    );
}
