import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors the TrendChart SVG area + labels. */
export default function TrendChartSkeleton() {
    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6">
            {/* Title bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1.5">
                    <ShimmerBlock className="h-5 w-56" />
                    <ShimmerBlock className="h-3 w-72" />
                </div>
                <ShimmerBlock className="h-3 w-28" />
            </div>

            {/* Chart area placeholder */}
            <div className="relative h-64 w-full">
                <ShimmerBlock className="h-full w-full" rounded="lg" />
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-4 px-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <ShimmerBlock key={i} className="h-3 w-8" />
                ))}
            </div>
        </div>
    );
}
