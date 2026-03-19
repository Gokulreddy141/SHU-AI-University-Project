import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors the MetricCard layout exactly. */
export default function MetricCardSkeleton() {
    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <ShimmerBlock className="h-4 w-24" />
                    <ShimmerBlock className="h-8 w-16" rounded="md" />
                </div>
                <ShimmerBlock className="h-10 w-10" rounded="lg" />
            </div>
            <div className="mt-4 flex items-center gap-2">
                <ShimmerBlock className="h-3 w-12" />
                <ShimmerBlock className="h-3 w-20" />
            </div>
        </div>
    );
}
