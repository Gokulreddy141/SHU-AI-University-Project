import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

interface ExamManagerCardSkeletonProps {
    count?: number;
}

/** Skeleton that mirrors ExamManagerCard: icon, title, stats grid, proctor toggle. */
export default function ExamManagerCardSkeleton({
    count = 3,
}: ExamManagerCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="relative flex flex-col rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] p-6"
                >
                    {/* Header: icon + actions */}
                    <div className="flex items-start justify-between mb-6">
                        <ShimmerBlock className="h-12 w-12" rounded="lg" />
                        <div className="flex items-center gap-1">
                            <ShimmerBlock className="h-8 w-8" rounded="md" />
                            <ShimmerBlock className="h-8 w-8" rounded="md" />
                        </div>
                    </div>

                    {/* Title + ID */}
                    <ShimmerBlock className="h-5 w-40 mb-2" />
                    <ShimmerBlock className="h-3 w-24 mb-6" />

                    {/* Stats grid 3-col */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {["Questions", "Duration", "Active"].map((label) => (
                            <div key={label} className="space-y-1.5">
                                <ShimmerBlock className="h-2 w-14" />
                                <ShimmerBlock className="h-4 w-8" />
                            </div>
                        ))}
                    </div>

                    {/* Proctor toggle area */}
                    <div className="mt-auto border-t border-[#3b3b3b] pt-4 space-y-2">
                        <ShimmerBlock className="h-2 w-24" />
                        <ShimmerBlock className="h-8 w-full" rounded="lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
