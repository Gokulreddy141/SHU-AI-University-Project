import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

interface CandidateTableSkeletonProps {
    rows?: number;
}

/** Skeleton that mirrors the CandidateTable header + rows layout. */
export default function CandidateTableSkeleton({
    rows = 5,
}: CandidateTableSkeletonProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-[#3b3b3b] bg-[#1a1a1a]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-[#3b3b3b] bg-[#0f0f0f]/50">
                            {["Candidate", "Department", "Total Exams", "Avg. Integrity", "Status", "Actions"].map(
                                (col) => (
                                    <th
                                        key={col}
                                        className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-500"
                                    >
                                        {col}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3b3b3b]">
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i}>
                                {/* Candidate */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <ShimmerBlock className="h-10 w-10" rounded="lg" />
                                        <div className="space-y-1.5">
                                            <ShimmerBlock className="h-4 w-28" />
                                            <ShimmerBlock className="h-3 w-36" />
                                        </div>
                                    </div>
                                </td>
                                {/* Department */}
                                <td className="px-6 py-4">
                                    <ShimmerBlock className="h-4 w-20" />
                                </td>
                                {/* Total Exams */}
                                <td className="px-6 py-4">
                                    <ShimmerBlock className="h-4 w-8" />
                                </td>
                                {/* Avg Integrity */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <ShimmerBlock className="h-4 w-12" />
                                        <ShimmerBlock className="h-1 w-16" rounded="full" />
                                    </div>
                                </td>
                                {/* Status */}
                                <td className="px-6 py-4">
                                    <ShimmerBlock className="h-5 w-16" rounded="full" />
                                </td>
                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    <ShimmerBlock className="h-7 w-24 ml-auto" rounded="lg" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
