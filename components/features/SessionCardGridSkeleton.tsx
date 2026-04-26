import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors a single SessionCard layout. */
function SessionCardSkeletonItem() {
    return (
        <div className="relative flex flex-col rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-5">
            {/* Header: avatar + name + status badge */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShimmerBlock className="h-10 w-10" rounded="full" />
                    <div className="space-y-1.5">
                        <ShimmerBlock className="h-4 w-28" />
                        <ShimmerBlock className="h-3 w-20" />
                    </div>
                </div>
                <ShimmerBlock className="h-6 w-20" rounded="full" />
            </div>

            {/* Time / Date rows */}
            <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                    <ShimmerBlock className="h-3 w-10" />
                    <ShimmerBlock className="h-3 w-14" />
                </div>
                <div className="flex justify-between">
                    <ShimmerBlock className="h-3 w-10" />
                    <ShimmerBlock className="h-3 w-14" />
                </div>
            </div>

            {/* Footer: Integrity score + icons */}
            <div className="mt-auto border-t border-[#3b3b3b] pt-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <ShimmerBlock className="h-3 w-24" />
                        <ShimmerBlock className="h-6 w-14" />
                    </div>
                    <div className="flex gap-2">
                        <ShimmerBlock className="h-8 w-8" rounded="md" />
                        <ShimmerBlock className="h-8 w-8" rounded="md" />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface SessionCardGridSkeletonProps {
    count?: number;
}

/** Grid of SessionCard skeletons — mirrors SessionCardGrid. */
export default function SessionCardGridSkeleton({
    count = 6,
}: SessionCardGridSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <SessionCardSkeletonItem key={i} />
            ))}
        </div>
    );
}
