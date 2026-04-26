import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors the ReportStatsGrid 4-column stat cards. */
export default function ReportStatsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6"
                >
                    <ShimmerBlock className="h-3 w-32 mb-4" />
                    <div className="flex items-baseline gap-2">
                        <ShimmerBlock className="h-8 w-16" rounded="md" />
                        <ShimmerBlock className="h-3 w-10" />
                    </div>
                </div>
            ))}
        </div>
    );
}
