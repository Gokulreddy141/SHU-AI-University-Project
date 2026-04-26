import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

interface LiveFeedCardSkeletonProps {
    count?: number;
}

/** Skeleton that mirrors the LiveFeedCard aspect-video layout. */
export default function LiveFeedCardSkeleton({
    count = 4,
}: LiveFeedCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="relative aspect-video rounded-lg border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden"
                >
                    {/* Full shimmer bg */}
                    <ShimmerBlock className="absolute inset-0 h-full w-full" rounded="lg" />

                    {/* Simulated bottom bar */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                        <div className="space-y-1">
                            <ShimmerBlock className="h-3 w-20" />
                            <ShimmerBlock className="h-2 w-14" />
                        </div>
                        <ShimmerBlock className="h-6 w-12" rounded="md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
