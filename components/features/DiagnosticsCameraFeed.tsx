import React, { useEffect, useRef } from "react";

interface DiagnosticsCameraFeedProps {
    onVideoRef: (videoRef: HTMLVideoElement | null) => void;
}

export default function DiagnosticsCameraFeed({ onVideoRef }: DiagnosticsCameraFeedProps) {
    const internalVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (internalVideoRef.current) {
            onVideoRef(internalVideoRef.current);
        }
    }, [onVideoRef]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-[#3b3b3b] shadow-2xl">
            {/* The actual video element providing stream to MediaPipe */}
            <video
                ref={internalVideoRef}
                className="w-full h-full object-cover transform -scale-x-100"
                autoPlay
                playsInline
                muted
            />

            {/* Canvas overlay (MediaPipe instances will draw onto this natively if configured, or just show raw feed for diagnostics) */}
            <div className="absolute top-4 left-4 flex gap-2">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-wide">RAW SENSOR FEED</span>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Diagnostic Mode. Feed is not recorded or stored.</p>
            </div>
        </div>
    );
}
