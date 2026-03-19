import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

interface ViolationTimelineSkeletonProps {
    count?: number;
}

/** Skeleton that mirrors the ViolationTimeline list items. */
export default function ViolationTimelineSkeleton({
    count = 5,
}: ViolationTimelineSkeletonProps) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl border border-[#3b3b3b] bg-[#1a1a1a]"
                >
                    {/* Icon */}
                    <ShimmerBlock className="h-7 w-7 flex-shrink-0 mt-0.5" rounded="md" />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <ShimmerBlock className="h-4 w-28" />
                            <ShimmerBlock className="h-3 w-14" />
                        </div>
                        <div className="flex items-center gap-3">
                            <ShimmerBlock className="h-4 w-14" rounded="full" />
                            <ShimmerBlock className="h-3 w-16" />
                            <ShimmerBlock className="h-3 w-20" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
