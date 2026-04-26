import React from "react";
import { CandidateSummary } from "@/types/candidate";
import CandidateTableSkeleton from "./CandidateTableSkeleton";

interface CandidateTableProps {
    candidates: CandidateSummary[];
    loading: boolean;
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (newPage: number) => void;
}

export default function CandidateTable({
    candidates,
    loading,
    page,
    totalPages,
    total,
    limit,
    onPageChange,
}: CandidateTableProps) {
    if (loading) {
        return <CandidateTableSkeleton rows={5} />;
    }

    if (candidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[#3b3b3b] rounded-xl bg-[#1a1a1a]/50">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-3">
                    person_search
                </span>
                <h3 className="text-lg font-bold text-white mb-1">No Candidates Found</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                    Try adjusting your search filters or invite new candidates to take an assessment.
                </p>
            </div>
        );
    }

    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    return (
        <div className="overflow-hidden rounded-xl border border-[#3b3b3b] bg-[#1a1a1a]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-[#3b3b3b] bg-[#0f0f0f]/50">
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                                Candidate
                            </th>
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                                Department
                            </th>
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                                Total Exams
                            </th>
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                                Avg. Integrity
                            </th>
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                                Status
                            </th>
                            <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3b3b3b]">
                        {candidates.map((candidate) => {
                            const initials = candidate.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase();

                            const isVerified = candidate.status === "verified";
                            const isBlocked = candidate.status === "blocked";

                            const scoreColor =
                                candidate.avgIntegrity >= 90
                                    ? "text-[#60b38a]"
                                    : candidate.avgIntegrity >= 70
                                        ? "text-amber-500"
                                        : "text-[#e64d4d]";

                            const scoreBgColor =
                                candidate.avgIntegrity >= 90
                                    ? "bg-[#60b38a]"
                                    : candidate.avgIntegrity >= 70
                                        ? "bg-amber-500"
                                        : "bg-[#e64d4d]";

                            let statusBadge;
                            if (isVerified) {
                                statusBadge = (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#60b38a]/10 px-2.5 py-0.5 text-xs font-bold text-[#60b38a] border border-[#60b38a]/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#60b38a]"></span>
                                        Verified
                                    </span>
                                );
                            } else if (isBlocked) {
                                statusBadge = (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e64d4d]/10 px-2.5 py-0.5 text-xs font-bold text-[#e64d4d] border border-[#e64d4d]/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#e64d4d]"></span>
                                        Blocked
                                    </span>
                                );
                            } else {
                                statusBadge = (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                                        Active
                                    </span>
                                );
                            }

                            return (
                                <tr
                                    key={candidate._id}
                                    className="hover:bg-[#262626] transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#3b3b3b] font-mono font-bold text-slate-400 bg-gradient-to-br from-[#262626] to-[#0f0f0f] flex items-center justify-center">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {candidate.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {candidate.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-400">
                                            {candidate.department || "Unassigned"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono text-slate-300">
                                            {candidate.totalExams.toString().padStart(2, "0")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono text-sm font-bold ${scoreColor}`}>
                                                {candidate.avgIntegrity}%
                                            </span>
                                            <div className="h-1 w-16 bg-[#0f0f0f] rounded-full overflow-hidden border border-[#3b3b3b]">
                                                <div
                                                    className={`h-full ${scoreBgColor}`}
                                                    style={{ width: `${candidate.avgIntegrity}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{statusBadge}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5">
                                            View History
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div className="flex items-center justify-between border-t border-[#3b3b3b] bg-[#0f0f0f]/30 px-6 py-4">
                    <p className="text-sm text-slate-500">
                        Showing <span className="text-slate-300 font-mono">{startIndex}-{endIndex}</span> of{" "}
                        <span className="text-slate-300 font-mono">{total}</span> candidates
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded border border-[#3b3b3b] text-slate-400 hover:bg-[#262626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>

                        <button className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white text-sm font-mono font-bold">
                            {page}
                        </button>

                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded border border-[#3b3b3b] text-slate-400 hover:bg-[#262626] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
