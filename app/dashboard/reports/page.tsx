"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useExamReports } from "@/hooks/useExamReports";
import ReportStatsGrid from "@/components/features/ReportStatsGrid";
import ReportStatsGridSkeleton from "@/components/features/ReportStatsGridSkeleton";
import TrendChart from "@/components/features/TrendChart";
import TrendChartSkeleton from "@/components/features/TrendChartSkeleton";
import HeatmapTable from "@/components/features/HeatmapTable";
import HeatmapTableSkeleton from "@/components/features/HeatmapTableSkeleton";
import ShimmerBlock from "@/components/ui/ShimmerBlock";
import ExamReportSection from "@/components/features/ExamReportSection";

interface ViolationRow {
    id: string;
    sessionId?: string | null;
    candidateName: string;
    candidateInitials: string;
    candidateAvatar?: string;
    type: string;
    severity: "critical" | "moderate";
    timestamp: string;
}

function statusBadge(status: string) {
    if (status === "flagged") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (status === "completed") return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

export default function ReportsPage() {
    const router = useRouter();
    const { data, loading, error } = useAnalytics();
    const { exams, loading: examsLoading } = useExamReports();

    // Paginated violations state
    const [violations, setViolations] = useState<ViolationRow[]>([]);
    const [vPage, setVPage] = useState(1);
    const [vTotalPages, setVTotalPages] = useState(1);
    const [vTotal, setVTotal] = useState(0);
    const [vLoading, setVLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("");

    // Auth guard
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
        }
    }, [router]);

    // Fetch paginated violations
    const fetchViolations = useCallback(async (page: number, type: string) => {
        setVLoading(true);
        try {
            const stored = localStorage.getItem("user");
            const recruiterId = stored ? JSON.parse(stored)._id : "";
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (recruiterId) params.set("recruiterId", recruiterId);
            if (type) params.set("type", type);
            const res = await fetch(`/api/reports/violations?${params}`);
            if (!res.ok) return;
            const json = await res.json();
            setViolations(json.violations || []);
            setVTotal(json.total || 0);
            setVTotalPages(json.totalPages || 1);
        } catch { /* silent */ } finally {
            setVLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchViolations(vPage, typeFilter);
    }, [fetchViolations, vPage, typeFilter]);

    const handleTypeChange = (type: string) => {
        setTypeFilter(type);
        setVPage(1);
    };

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
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f]">
                                    <div className="flex items-center gap-3">
                                        <ShimmerBlock className="h-9 w-9" rounded="md" />
                                        <div className="space-y-1.5">
                                            <ShimmerBlock className="h-3.5 w-36" />
                                            <ShimmerBlock className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <ShimmerBlock className="h-5 w-10" rounded="md" />
                                </div>
                            ))}
                        </div>
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

    // Build violation type options from real breakdown data
    const violationTypeOptions = [
        { value: "", label: "All Violations" },
        ...(data.violationBreakdown ?? []).map(v => ({
            value: v.type,
            label: `${v.type.replace(/_/g, " ")} (${v.count})`,
        })),
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-full">
            {/* Stats */}
            <ReportStatsGrid data={data} />

            {/* Integrity trend chart */}
            <TrendChart trends={data.integrityTrends} />

            {/* Heatmap + Top Flagged Sessions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <HeatmapTable heatmap={data.heatmap} />

                {/* Top Flagged Sessions — real data */}
                <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 flex flex-col">
                    <div className="mb-5">
                        <h3 className="text-base font-bold text-white">Top Risk Sessions</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Sessions with the highest violation counts.</p>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                        {(data.topFlaggedSessions ?? []).length === 0 ? (
                            <div className="py-10 text-center text-slate-600">
                                <span className="material-symbols-outlined text-3xl block mb-2">verified_user</span>
                                <p className="text-xs">No flagged sessions yet.</p>
                            </div>
                        ) : (
                            (data.topFlaggedSessions ?? []).map((s) => (
                                <button
                                    key={s.sessionId}
                                    onClick={() => router.push(`/dashboard/session/${s.sessionId}`)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border border-[#3b3b3b] hover:border-primary/50 bg-[#0f0f0f] hover:bg-primary/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                            s.integrityScore >= 80 ? "bg-green-500/10 text-green-400"
                                            : s.integrityScore >= 60 ? "bg-amber-500/10 text-amber-400"
                                            : "bg-red-500/10 text-red-400"
                                        }`}>
                                            {s.integrityScore}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{s.candidateName}</p>
                                            <p className="text-[10px] font-mono text-slate-500 truncate">{s.examTitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${statusBadge(s.status)}`}>
                                            {s.status}
                                        </span>
                                        <span className="text-[#e64d4d] font-mono font-bold text-sm">
                                            {s.totalViolations}
                                        </span>
                                        <span className="material-symbols-outlined text-slate-600 group-hover:text-primary text-sm transition-colors">
                                            arrow_forward
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => router.push("/dashboard/live")}
                        className="mt-5 w-full py-2.5 rounded-lg border border-[#3b3b3b] hover:border-primary/50 text-slate-400 hover:text-primary text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        View Live Sessions →
                    </button>
                </div>
            </div>

            {/* Violation Breakdown Bar */}
            {(data.violationBreakdown ?? []).length > 0 && (
                <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                    <h3 className="text-base font-bold text-white mb-4">Violation Type Breakdown</h3>
                    <div className="space-y-2">
                        {(() => {
                            const max = Math.max(...data.violationBreakdown.map(v => v.count), 1);
                            return data.violationBreakdown.slice(0, 12).map(v => (
                                <div key={v.type} className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-500 w-44 shrink-0 truncate uppercase">
                                        {v.type.replace(/_/g, " ")}
                                    </span>
                                    <div className="flex-1 h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary/60"
                                            style={{ width: `${(v.count / max) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-400 w-8 text-right shrink-0">
                                        {v.count}
                                    </span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* Exam-wise Drill-down */}
            <ExamReportSection exams={exams} loading={examsLoading} />

            {/* Recent Integrity Violations — paginated */}
            <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-[#3b3b3b] flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Recent Integrity Violations</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {vTotal > 0 ? `${vTotal} total violations` : "No violations recorded"}
                            {typeFilter ? ` · filtered by ${typeFilter.replace(/_/g, " ")}` : ""}
                        </p>
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => handleTypeChange(e.target.value)}
                        className="bg-[#0f0f0f] border border-[#3b3b3b] text-xs font-mono text-slate-300 rounded-lg p-2 min-w-[180px]"
                    >
                        {violationTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                {vLoading ? (
                    <div className="divide-y divide-[#3b3b3b]/30">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-[#2a2a2a]" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-32 bg-[#2a2a2a] rounded" />
                                    <div className="h-2.5 w-24 bg-[#2a2a2a] rounded" />
                                </div>
                                <div className="h-4 w-16 bg-[#2a2a2a] rounded" />
                                <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
                            </div>
                        ))}
                    </div>
                ) : violations.length === 0 ? (
                    <div className="py-16 text-center text-slate-600">
                        <span className="material-symbols-outlined text-4xl block mb-3">verified_user</span>
                        <p className="text-sm">No violations found{typeFilter ? " for this type" : ""}.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-500 border-b border-[#3b3b3b] font-mono uppercase text-[10px]">
                                    <th className="px-6 py-3">Candidate</th>
                                    <th className="px-6 py-3">Violation Type</th>
                                    <th className="px-6 py-3 text-center">Severity</th>
                                    <th className="px-6 py-3">Timestamp</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3b3b3b]/30">
                                {violations.map((v) => (
                                    <tr key={v.id} className="hover:bg-[#262626]/30 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                {v.candidateAvatar ? (
                                                    <div className="w-8 h-8 rounded-full bg-[#262626] overflow-hidden relative flex-shrink-0">
                                                        <Image alt={v.candidateName} className="object-cover" src={v.candidateAvatar} fill unoptimized />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#3b3b3b] flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                                                        {v.candidateInitials}
                                                    </div>
                                                )}
                                                <span className="font-medium text-white">{v.candidateName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="text-slate-300 font-mono text-[11px] uppercase">
                                                {v.type.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
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
                                        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{v.timestamp}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                onClick={() => v.sessionId && router.push(`/dashboard/session/${v.sessionId}`)}
                                                className="text-primary hover:underline text-xs disabled:opacity-30"
                                                disabled={!v.sessionId}
                                            >
                                                Review Session →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination footer */}
                {vTotalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#3b3b3b] flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-mono">
                            Page {vPage} of {vTotalPages} · {vTotal} total
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setVPage(p => Math.max(1, p - 1))}
                                disabled={vPage === 1}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] text-xs text-slate-400 hover:text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                Prev
                            </button>

                            {/* Page number pills */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, vTotalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (vTotalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (vPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (vPage >= vTotalPages - 2) {
                                        pageNum = vTotalPages - 4 + i;
                                    } else {
                                        pageNum = vPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setVPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                                                pageNum === vPage
                                                    ? "bg-primary text-white"
                                                    : "bg-[#0f0f0f] border border-[#3b3b3b] text-slate-400 hover:text-white hover:border-primary/50"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setVPage(p => Math.min(vTotalPages, p + 1))}
                                disabled={vPage === vTotalPages}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] text-xs text-slate-400 hover:text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
