"use client";
import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";

interface CameraFeedProps {
    onVideoRef?: (ref: HTMLVideoElement | null) => void;
    gazeDirection?: string;
    faceCount?: number;
    isSuspicious?: boolean;
    className?: string;
}

export default function CameraFeed({
    onVideoRef,
    gazeDirection = "CENTER",
    faceCount = 1,
    isSuspicious = false,
    className = "",
}: CameraFeedProps) {
    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        if (onVideoRef && webcamRef.current?.video) {
            onVideoRef(webcamRef.current.video);
        }
    }, [onVideoRef]);

    // Border color based on status
    const getBorderColor = () => {
        if (faceCount === 0) return "border-red-500";
        if (faceCount > 1) return "border-red-500";
        if (isSuspicious) return "border-yellow-500";
        if (gazeDirection !== "CENTER") return "border-yellow-500";
        return "border-green-500";
    };

    const getStatusText = () => {
        if (faceCount === 0) return "⚠️ No Face Detected";
        if (faceCount > 1) return `⚠️ ${faceCount} Faces Detected`;
        if (isSuspicious) return "⚠️ Lip Sync Mismatch";
        if (gazeDirection !== "CENTER") return `👁 Looking ${gazeDirection}`;
        return "✅ Monitoring Active";
    };

    const getStatusColor = () => {
        if (faceCount === 0 || faceCount > 1) return "bg-red-900/50 text-red-300";
        if (isSuspicious) return "bg-yellow-900/50 text-yellow-300";
        if (gazeDirection !== "CENTER") return "bg-yellow-900/50 text-yellow-300";
        return "bg-green-900/50 text-green-300";
    };

    return (
        <div className={`relative ${className}`}>
            {/* Camera Feed */}
            <div className={`relative rounded-2xl overflow-hidden border-2 ${getBorderColor()} transition-colors duration-300`}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        facingMode: "user",
                        width: 640,
                        height: 480,
                    }}
                    className="w-full h-auto rounded-2xl"
                    mirrored
                />

                {/* Status Overlay */}
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor()} backdrop-blur-sm`}>
                    {getStatusText()}
                </div>

                {/* Gaze Direction Indicator */}
                {gazeDirection !== "CENTER" && faceCount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-6xl opacity-30 animate-pulse">
                            {gazeDirection === "LEFT" && "←"}
                            {gazeDirection === "RIGHT" && "→"}
                            {gazeDirection === "UP" && "↑"}
                            {gazeDirection === "DOWN" && "↓"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
