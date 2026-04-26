"use client";
import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";

interface CameraFeedProps {
    onVideoRef?: (ref: HTMLVideoElement | null) => void;
    // Detection props kept for API compatibility but not rendered in the candidate view
    gazeDirection?: string;
    faceCount?: number;
    isSuspicious?: boolean;
    className?: string;
}

export default function CameraFeed({
    onVideoRef,
    className = "",
}: CameraFeedProps) {
    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        if (onVideoRef && webcamRef.current?.video) {
            onVideoRef(webcamRef.current.video);
        }
    }, [onVideoRef]);

    return (
        <div className={`relative ${className}`}>
            <div className="relative rounded-2xl overflow-hidden border border-[#3b3b3b]">
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
            </div>
        </div>
    );
}
