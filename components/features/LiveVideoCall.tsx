"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { CallStatus } from "@/hooks/useWebRTC";
import { AITelemetryPayload } from "@/types/webrtc";

interface LiveVideoCallProps {
    callStatus: CallStatus;
    remoteStream: MediaStream | null;
    remoteTelemetry?: AITelemetryPayload | null;
    isRecruiter: boolean;
    onAccept: () => void;
    onDecline: () => void;
    onEndCall: () => void;
}

export default function LiveVideoCall({
    callStatus,
    remoteStream,
    remoteTelemetry,
    isRecruiter,
    onAccept,
    onDecline,
    onEndCall,
}: LiveVideoCallProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (callStatus === "idle") {
        return null;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    return (
        <div
            className="fixed z-50 p-1 bg-gray-900 rounded-xl shadow-2xl border border-white/20 select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: callStatus === "connected" ? "320px" : "280px",
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center justify-between p-2 bg-gray-800 rounded-t-lg mb-1 pointer-events-none">
                <span className="text-sm font-semibold text-white">
                    {callStatus === "incoming" ? "Incoming Call..." :
                        callStatus === "calling" ? "Calling..." : "Live Interview"}
                </span>
                {callStatus === "connected" && (
                    <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </div>

            {callStatus === "incoming" && !isRecruiter && (
                <div className="p-4 bg-gray-800 rounded-b-lg flex flex-col items-center gap-4 cursor-default" onMouseDown={e => e.stopPropagation()}>
                    <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-2xl">📞</span>
                    </div>
                    <p className="text-sm text-center text-gray-300">
                        The recruiter is requesting a live video call.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onDecline} className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors">
                            Decline
                        </button>
                        <button onClick={onAccept} className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors">
                            Accept
                        </button>
                    </div>
                </div>
            )}

            {callStatus === "calling" && isRecruiter && (
                <div className="p-4 bg-gray-800 rounded-b-lg flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-center text-gray-300">Waiting for candidate...</p>
                    <button onClick={onEndCall} className="w-full py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium cursor-default" onMouseDown={e => e.stopPropagation()}>
                        Cancel Call
                    </button>
                </div>
            )}

            {callStatus === "connected" && (
                <div className="bg-black rounded-b-lg overflow-hidden relative cursor-default" onMouseDown={e => e.stopPropagation()}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto object-cover transform -scale-x-100"
                        style={{ aspectRatio: "4/3" }}
                    />
                    <div className="absolute bottom-3 left-0 w-full flex justify-center">
                        <button
                            onClick={onEndCall}
                            className="px-4 py-2 bg-red-500/90 hover:bg-red-600 rounded-full text-white font-bold text-sm shadow-lg backdrop-blur"
                        >
                            End Call
                        </button>
                    </div>

                    {/* AI Telemetry Overlay (Recruiter Only) */}
                    {isRecruiter && remoteTelemetry && (
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
                            <div className="flex flex-col gap-1">
                                {remoteTelemetry.faceCount > 1 && (
                                    <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur flex items-center gap-1 animate-pulse">
                                        👥 MULTIPLE FACES
                                    </span>
                                )}
                                {remoteTelemetry.faceCount === 0 && (
                                    <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur flex items-center gap-1 animate-pulse">
                                        ⚠️ NO FACE DETECTED
                                    </span>
                                )}
                                <span className="bg-[#1a1a1a]/80 text-primary text-[10px] font-mono px-2 py-0.5 rounded shadow-lg border border-primary/30 backdrop-blur">
                                    AI SYNC: ACTIVE
                                </span>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                {remoteTelemetry.gazeDirection !== "CENTER" && (
                                    <span className="bg-[#1a1a1a]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-[#3b3b3b] backdrop-blur flex items-center gap-1">
                                        GAZE: {remoteTelemetry.gazeDirection}
                                        {remoteTelemetry.gazeDirection === "LEFT" && " ←"}
                                        {remoteTelemetry.gazeDirection === "RIGHT" && " →"}
                                        {remoteTelemetry.gazeDirection === "UP" && " ↑"}
                                        {remoteTelemetry.gazeDirection === "DOWN" && " ↓"}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
