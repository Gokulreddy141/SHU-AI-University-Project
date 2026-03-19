import React from "react";

interface ShimmerBlockProps {
    className?: string;
    rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Base shimmer primitive — a single animated placeholder block.
 * Compose multiple ShimmerBlocks to build contextual skeletons.
 */
export default function ShimmerBlock({
    className = "",
    rounded = "lg",
}: ShimmerBlockProps) {
    const roundedMap = {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
    };

    return (
        <div
            className={`shimmer ${roundedMap[rounded]} ${className}`}
            aria-hidden="true"
        />
    );
}
