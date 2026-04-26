import React from "react";
import ShimmerBlock from "@/components/ui/ShimmerBlock";

/** Skeleton that mirrors the SystemCheck card list. */
export default function SystemCheckSkeleton() {
    const checkLabels = [
        "Camera Access",
        "Face Visibility",
        "Virtual Camera",
        "Network Speed",
    ];

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6 space-y-2">
                <ShimmerBlock className="h-10 w-10 mx-auto" rounded="lg" />
                <ShimmerBlock className="h-5 w-32 mx-auto" />
                <ShimmerBlock className="h-3 w-52 mx-auto" />
            </div>

            {/* Check items */}
            <div className="space-y-3 mb-8">
                {checkLabels.map((label) => (
                    <div
                        key={label}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <ShimmerBlock className="h-5 w-5" rounded="md" />
                            <ShimmerBlock className="h-4 w-28" />
                        </div>
                        <ShimmerBlock className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Action button */}
            <ShimmerBlock className="h-12 w-full" rounded="xl" />
        </div>
    );
}
