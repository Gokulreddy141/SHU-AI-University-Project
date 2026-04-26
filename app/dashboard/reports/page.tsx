"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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

type SortField = "timestamp" | "type" | "severity";
type SortOrder = "asc" | "desc";
type DatePreset = "7d" | "30d" | "90d" | "all";

function statusBadge(status: string) {
    if (status === "flagged") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (status === "completed") return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
    if (!active) return <span className="material-symbols-outlined text-[12px] text-slate-600 opacity-0 group-hover:opacity-100">unfold_more</span>;
    return (
        <span className="material-symbols-outlined text-[12px] text-primary">
            {order === "asc" ? "arrow_upward" : "arrow_downward"}
        </span>
    );
}


export default function ReportsPage() {
    const router = useRouter();
    const { data, loading, error } = useAnalytics();
    const { exams, loading: examsLoading } = useExamReports();

    // Violations state
    const [violations, setViolations] = useState<ViolationRow[]>([]);
    const [vPage, setVPage] = useState(1);
    const [vTotalPages, setVTotalPages] = useState(1);
    const [vTotal, setVTotal] = useState(0);
    const [vLoading, setVLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [candidateSearch, setCandidateSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("timestamp");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [showAllTypes, setShowAllTypes] = useState(false);
    const [datePreset, setDatePreset] = useState<DatePreset>("all");

    // Scroll to violations table when clicking a bar
    const violationsRef = useRef<HTMLDivElement>(null);

    // Auth guard
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) router.push("/auth");
    }, [router]);

    const fetchViolations = useCallback(async (
        page: number, type: string, severity: string,
        candidate: string, sf: SortField, so: SortOrder
    ) => {
        setVLoading(true);
        try {
            const stored = localStorage.getItem("user");
            const recruiterId = stored ? JSON.parse(stored)._id : "";
            const params = new URLSearchParams({ page: String(page), limit: "10" });
            if (recruiterId) params.set("recruiterId", recruiterId);
            if (type) params.set("type", type);
            if (severity) params.set("severity", severity);
            if (candidate.trim()) params.set("candidateName", candidate.trim());
            params.set("sortBy", sf);
            params.set("sortOrder", so);
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
        fetchViolations(vPage, typeFilter, severityFilter, candidateSearch, sortField, sortOrder);
    }, [fetchViolations, vPage, typeFilter, severityFilter, candidateSearch, sortField, sortOrder]);

    const handleTypeChange = (type: string) => {
        setTypeFilter(type);
        setVPage(1);
        // Scroll to violations table
        setTimeout(() => violationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(o => o === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
        setVPage(1);
    };

    const handleExportCSV = useCallback(async () => {
        try {
            const stored = localStorage.getItem("user");
            const recruiterId = stored ? JSON.parse(stored)._id : "";
            const params = new URLSearchParams({ page: "1", limit: "1000" });
            if (recruiterId) params.set("recruiterId", recruiterId);
            if (typeFilter) params.set("type", typeFilter);
            if (severityFilter) params.set("severity", severityFilter);
            if (candidateSearch.trim()) params.set("candidateName", candidateSearch.trim());
            params.set("sortBy", sortField);
            params.set("sortOrder", sortOrder);

            const res = await fetch(`/api/reports/violations?${params}`);
            const json = await res.json();
            const rows: ViolationRow[] = json.violations || [];

            const headers = ["Candidate", "Type", "Severity", "Timestamp", "Session ID"];
            const csvRows = [
                headers.join(","),
                ...rows.map(v => [
                    `"${v.candidateName}"`,
                    `"${v.type}"`,
                    v.severity,
                    `"${v.timestamp}"`,
                    v.sessionId || "",
                ].join(",")),
            ];

            const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `violations-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* silent */ }
    }, [typeFilter, severityFilter, candidateSearch, sortField, sortOrder]);

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

    const violationTypeOptions = [
        { value: "", label: "All Types" },
        ...(data.violationBreakdown ?? []).map(v => ({
            value: v.type,
            label: `${v.type.replace(/_/g, " ")} (${v.count})`,
        })),
    ];

    const breakdownMax = Math.max(...(data.violationBreakdown ?? []).map(v => v.count), 1);
    const breakdownSlice = showAllTypes
        ? (data.violationBreakdown ?? [])
        : (data.violationBreakdown ?? []).slice(0, 12);

    const DATE_PRESETS: { label: string; value: DatePreset }[] = [
        { label: "7d", value: "7d" },
        { label: "30d", value: "30d" },
        { label: "90d", value: "90d" },
        { label: "All time", value: "all" },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-full">

            {/* Page header with date range */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-white">Reports</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Integrity analytics across all exam sessions</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#3b3b3b] rounded-lg p-1">
                        {DATE_PRESETS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setDatePreset(p.value)}
                                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                    datePreset === p.value
                                        ? "bg-primary text-white"
                                        : "text-slate-400 hover:text-white"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <ReportStatsGrid data={data} />

            {/* Integrity trend chart */}
            <TrendChart trends={data.integrityTrends} />

            {/* Heatmap + Top Flagged Sessions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <HeatmapTable heatmap={data.heatmap} />

                {/* Top Risk Sessions */}
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
                                        <span className="text-[#e64d4d] font-mono font-bold text-sm">{s.totalViolations}</span>
                                        <span className="material-symbols-outlined text-slate-600 group-hover:text-primary text-sm transition-colors">arrow_forward</span>
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

            {/* Violation Type Breakdown — clickable bars */}
            {(data.violationBreakdown ?? []).length > 0 && (
                <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white">Violation Type Breakdown</h3>
                        <p className="text-[10px] text-slate-500">Click a bar to filter the violations table</p>
                    </div>
                    <div className="space-y-2">
                        {breakdownSlice.map(v => {
                            const isActive = typeFilter === v.type;
                            return (
                                <button
                                    key={v.type}
                                    onClick={() => handleTypeChange(isActive ? "" : v.type)}
                                    className={`w-full flex items-center gap-3 group rounded-lg px-2 py-1 -mx-2 transition-colors ${
                                        isActive ? "bg-primary/10" : "hover:bg-white/5"
                                    }`}
                                >
                                    <span className={`text-[10px] font-mono w-44 shrink-0 truncate uppercase text-left ${
                                        isActive ? "text-primary" : "text-slate-500"
                                    }`}>
                                        {v.type.replace(/_/g, " ")}
                                    </span>
                                    <div className="flex-1 h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isActive ? "bg-primary" : "bg-primary/60 group-hover:bg-primary/80"}`}
                                            style={{ width: `${(v.count / breakdownMax) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-mono font-bold w-8 text-right shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`}>
                                        {v.count}
                                    </span>
                                    {isActive && (
                                        <span className="material-symbols-outlined text-[13px] text-primary shrink-0">filter_alt</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {(data.violationBreakdown ?? []).length > 12 && (
                        <button
                            onClick={() => setShowAllTypes(s => !s)}
                            className="mt-3 text-[10px] text-slate-500 hover:text-primary font-mono uppercase tracking-widest transition-colors"
                        >
                            {showAllTypes
                                ? "Show top 12 ↑"
                                : `Show all ${data.violationBreakdown.length} types ↓`}
                        </button>
                    )}
                </div>
            )}

            {/* Exam-wise Drill-down */}
            <ExamReportSection exams={exams} loading={examsLoading} />

            {/* Violations Table */}
            <div ref={violationsRef} className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-[#3b3b3b] space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h3 className="text-base font-bold text-white">Recent Integrity Violations</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {vTotal > 0 ? `${vTotal} total` : "No violations recorded"}
                                {typeFilter ? ` · type: ${typeFilter.replace(/_/g, " ")}` : ""}
                                {severityFilter ? ` · ${severityFilter}` : ""}
                                {candidateSearch ? ` · candidate: "${candidateSearch}"` : ""}
                            </p>
                        </div>
                        {/* Export CSV */}
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3b3b3b] bg-[#0f0f0f] text-xs text-slate-400 hover:text-white hover:border-primary/50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Export CSV
                        </button>
                    </div>

                    {/* Filter row */}
                    <div className="flex gap-2 flex-wrap items-center">
                        {/* Candidate search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[14px]">search</span>
                            <input
                                type="text"
                                placeholder="Search candidate..."
                                value={candidateSearch}
                                onChange={e => { setCandidateSearch(e.target.value); setVPage(1); }}
                                className="bg-[#0f0f0f] border border-[#3b3b3b] text-xs text-slate-300 rounded-lg pl-7 pr-3 py-1.5 w-44 focus:outline-none focus:border-primary/60"
                            />
                        </div>
                        {/* Type filter */}
                        <select
                            value={typeFilter}
                            onChange={e => handleTypeChange(e.target.value)}
                            className="bg-[#0f0f0f] border border-[#3b3b3b] text-xs font-mono text-slate-300 rounded-lg p-1.5 min-w-[160px]"
                        >
                            {violationTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {/* Severity filter */}
                        <select
                            value={severityFilter}
                            onChange={e => { setSeverityFilter(e.target.value); setVPage(1); }}
                            className="bg-[#0f0f0f] border border-[#3b3b3b] text-xs font-mono text-slate-300 rounded-lg p-1.5"
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="moderate">Moderate</option>
                        </select>
                        {/* Clear filters */}
                        {(typeFilter || severityFilter || candidateSearch) && (
                            <button
                                onClick={() => { setTypeFilter(""); setSeverityFilter(""); setCandidateSearch(""); setVPage(1); }}
                                className="text-[10px] text-slate-500 hover:text-primary font-mono transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[12px]">close</span>
                                Clear
                            </button>
                        )}
                    </div>
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
                        <p className="text-sm">No violations found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#3b3b3b] font-mono uppercase text-[10px]">
                                    {([
                                        { label: "Candidate", field: null },
                                        { label: "Violation Type", field: "type" as SortField },
                                        { label: "Severity", field: "severity" as SortField },
                                        { label: "Timestamp", field: "timestamp" as SortField },
                                        { label: "Action", field: null },
                                    ] as { label: string; field: SortField | null }[]).map(col => (
                                        <th
                                            key={col.label}
                                            className={`px-6 py-3 text-slate-500 ${col.field ? "cursor-pointer hover:text-white group select-none" : ""} ${col.label === "Severity" || col.label === "Action" ? "text-center" : ""}`}
                                            onClick={() => col.field && handleSort(col.field)}
                                        >
                                            <span className="flex items-center gap-1">
                                                {col.label}
                                                {col.field && (
                                                    <SortIcon
                                                        active={sortField === col.field}
                                                        order={sortOrder}
                                                    />
                                                )}
                                            </span>
                                        </th>
                                    ))}
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
                                            <button
                                                onClick={() => handleTypeChange(typeFilter === v.type ? "" : v.type)}
                                                className={`text-slate-300 font-mono text-[11px] uppercase hover:text-primary transition-colors ${typeFilter === v.type ? "text-primary" : ""}`}
                                            >
                                                {v.type.replace(/_/g, " ")}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            {v.severity === "critical" ? (
                                                <span className="px-2 py-0.5 rounded bg-[#e64d4d]/10 text-[#e64d4d] text-[10px] font-bold border border-[#e64d4d]/20 uppercase">Critical</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase">Moderate</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{v.timestamp}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                onClick={() => v.sessionId && router.push(`/dashboard/session/${v.sessionId}`)}
                                                className="text-primary hover:underline text-xs disabled:opacity-30"
                                                disabled={!v.sessionId}
                                            >
                                                Review →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
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
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, vTotalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (vTotalPages <= 5) pageNum = i + 1;
                                    else if (vPage <= 3) pageNum = i + 1;
                                    else if (vPage >= vTotalPages - 2) pageNum = vTotalPages - 4 + i;
                                    else pageNum = vPage - 2 + i;
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
