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
            y: e.clientY - dragStart.current.y,
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = remoteStream ?? null;
    }, [remoteStream]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (callStatus === "idle") return null;

    // ─────────────────────────────────────────────────
    // CANDIDATE — INCOMING CALL: full-screen modal overlay
    // ─────────────────────────────────────────────────
    if (callStatus === "incoming" && !isRecruiter) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                {/* Blurred backdrop */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                {/* Card */}
                <div className="relative z-10 flex flex-col items-center gap-6 bg-[#111] border border-[#3b3b3b] rounded-2xl shadow-2xl px-10 py-10 w-[340px] animate-[fadeInScale_0.2s_ease-out]">

                    {/* Pulsing ring + phone icon */}
                    <div className="relative flex items-center justify-center">
                        <span className="absolute w-28 h-28 rounded-full border-4 border-blue-500/30 animate-ping" />
                        <span className="absolute w-20 h-20 rounded-full border-2 border-blue-500/50 animate-ping [animation-delay:0.3s]" />
                        <div className="relative w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-400 text-4xl animate-[ring_1s_ease-in-out_infinite]">
                                call
                            </span>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center">
                        <p className="text-white text-lg font-bold">Incoming Call</p>
                        <p className="text-slate-400 text-sm mt-1">
                            Your recruiter is requesting a live video interview
                        </p>
                    </div>

                    {/* Accept / Decline */}
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={onDecline}
                            className="flex-1 py-3 rounded-xl bg-[#e64d4d]/20 border border-[#e64d4d]/40 text-[#e64d4d] font-bold hover:bg-[#e64d4d] hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">call_end</span>
                            Decline
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 font-bold hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">call</span>
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // RECRUITER — CALLING / CONNECTED: draggable PiP widget
    // ─────────────────────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    return (
        <div
            className="fixed z-50 p-1 bg-[#0f0f0f] rounded-xl shadow-2xl border border-[#3b3b3b] select-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: callStatus === "connected" ? "320px" : "280px",
                cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] rounded-t-lg mb-1 pointer-events-none">
                <span className="text-sm font-semibold text-white">
                    {callStatus === "calling" ? "Calling..." : "Live Interview"}
                </span>
                {callStatus === "connected" && (
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-mono text-red-400 uppercase">Live</span>
                    </span>
                )}
            </div>

            {callStatus === "calling" && isRecruiter && (
                <div
                    className="p-4 bg-[#1a1a1a] rounded-b-lg flex flex-col items-center gap-4 cursor-default"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-center text-slate-400">Waiting for candidate...</p>
                    <button
                        onClick={onEndCall}
                        className="w-full py-2 bg-[#e64d4d] hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
                    >
                        Cancel Call
                    </button>
                </div>
            )}

            {callStatus === "connected" && (
                <div
                    className="bg-black rounded-b-lg overflow-hidden relative cursor-default"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={!isRecruiter}
                        className="w-full h-auto object-cover"
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

                    {/* AI Telemetry Overlay — Recruiter only */}
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
                                        ⚠️ NO FACE
                                    </span>
                                )}
                                <span className="bg-[#1a1a1a]/80 text-primary text-[10px] font-mono px-2 py-0.5 rounded shadow-lg border border-primary/30 backdrop-blur">
                                    AI SYNC: ACTIVE
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {remoteTelemetry.gazeDirection !== "CENTER" && (
                                    <span className="bg-[#1a1a1a]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-[#3b3b3b] backdrop-blur">
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
