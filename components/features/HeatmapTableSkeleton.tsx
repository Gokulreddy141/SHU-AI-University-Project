import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors the HeatmapTable header + 5-row grid. */
export default function HeatmapTableSkeleton() {
    const timeSlots = 7;
    const rows = 5;

    return (
        <div className="xl:col-span-2 rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
            {/* Title area */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1.5">
                    <ShimmerBlock className="h-5 w-48" />
                    <ShimmerBlock className="h-3 w-72" />
                </div>
                <ShimmerBlock className="h-3 w-28" />
            </div>

            {/* Table skeleton */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#3b3b3b]">
                            <th className="pb-4">
                                <ShimmerBlock className="h-3 w-28" />
                            </th>
                            {Array.from({ length: timeSlots }).map((_, i) => (
                                <th key={i} className="pb-4 px-2">
                                    <ShimmerBlock className="h-3 w-10" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={
                                    rowIdx < rows - 1 ? "border-b border-[#3b3b3b]/50" : ""
                                }
                            >
                                <td className="py-4">
                                    <ShimmerBlock className="h-4 w-32" />
                                </td>
                                {Array.from({ length: timeSlots }).map((_, colIdx) => (
                                    <td key={colIdx} className="p-1">
                                        <ShimmerBlock className="h-8 w-full" rounded="md" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
