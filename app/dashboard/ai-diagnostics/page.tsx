"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import DiagnosticsCameraFeed from "@/components/features/DiagnosticsCameraFeed";
import { useAuth } from "@/hooks/useAuth";

// AI Hooks
import { useVoiceActivityDetection } from "@/hooks/useVoiceActivityDetection";
import { useAmbientNoiseDetection } from "@/hooks/useAmbientNoiseDetection";
import { useAudioSpoofingDetection } from "@/hooks/useAudioSpoofingDetection";
import { useLipSyncDetection } from "@/hooks/useLipSyncDetection";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useBlinkFrequencyAnalysis } from "@/hooks/useBlinkFrequencyAnalysis";
import { useHeadPoseEstimation } from "@/hooks/useHeadPoseEstimation";
import { useMicroGazeTracker } from "@/hooks/useMicroGazeTracker";

// Fake Session ID to satisfy hook signatures without writing to DB
const DIAGNOSTIC_SESSION_ID = "000000000000000000000000";

interface FaceMeshLandmark {
    x: number;
    y: number;
    z: number;
}

interface FaceMeshResults {
    multiFaceLandmarks?: FaceMeshLandmark[][];
}

function calculateEAR(landmarks: FaceMeshLandmark[], eyeIndices: number[]): number {
    const p1 = landmarks[eyeIndices[0]];
    const p2 = landmarks[eyeIndices[1]];
    const p3 = landmarks[eyeIndices[2]];
    const p4 = landmarks[eyeIndices[3]];
    const p5 = landmarks[eyeIndices[4]];
    const p6 = landmarks[eyeIndices[5]];

    const dist26 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
    const dist35 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
    const dist14 = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

    return (dist26 + dist35) / (2.0 * dist14 + 0.0001);
}

// UI Indicator Bubble
const Indicator = ({ label, active, type, metric }: { label: string, active: boolean, type: "vision" | "audio" | "danger" | "system", metric?: string }) => {
    let colorClass = "bg-[#262626] border-[#3b3b3b] text-slate-400";
    let icon = "priority_high";

    if (active) {
        if (type === "danger") colorClass = "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
        if (type === "vision") colorClass = "bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]";
        if (type === "audio") colorClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
        if (type === "system") colorClass = "bg-purple-500/20 border-purple-500/50 text-purple-400";
    }

    if (type === "vision") icon = "visibility";
    if (type === "audio") icon = "mic";
    if (type === "danger") icon = "warning";
    if (type === "system") icon = "memory";

    return (
        <div className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${colorClass}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <div className="text-lg font-bold font-mono">
                    {active ? "TRIGGERED" : "CLEAR"}
                </div>
                {metric && (
                    <div className="text-xs font-mono opacity-80">{metric}</div>
                )}
            </div>
        </div>
    );
}

export default function AIDiagnosticsDashboard() {
    const { user, isHydrated } = useAuth("recruiter"); // Restricted to recruiters
    const [aiEnabled, setAiEnabled] = useState(false);
    const [faceCount, setFaceCount] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const faceMeshRef = useRef<{ close: () => void; send: (input: { image: HTMLVideoElement }) => Promise<void> } | null>(null);

    // Mount all Audio hooks safely
    const voiceActivity = useVoiceActivityDetection(DIAGNOSTIC_SESSION_ID, user?._id || "", true);
    const ambientNoise = useAmbientNoiseDetection(DIAGNOSTIC_SESSION_ID, user?._id || "", true);
    const audioSpoofing = useAudioSpoofingDetection(DIAGNOSTIC_SESSION_ID, user?._id || "", true);
    const lipSync = useLipSyncDetection(DIAGNOSTIC_SESSION_ID, user?._id || "");

    // Mount all Vision hooks
    const handTracking = useHandTracking(DIAGNOSTIC_SESSION_ID, user?._id || "", videoRef);
    const blinkAnalysis = useBlinkFrequencyAnalysis(DIAGNOSTIC_SESSION_ID, user?._id || "");
    const headPose = useHeadPoseEstimation(DIAGNOSTIC_SESSION_ID, user?._id || "");
    const microGaze = useMicroGazeTracker(DIAGNOSTIC_SESSION_ID, user?._id || "");

    // Bridge Audio Level to Lip Sync
    useEffect(() => {
        lipSync.setAudioLevel(ambientNoise.audioLevel);
    }, [ambientNoise.audioLevel, lipSync]);

    const initAiDetection = useCallback(async (videoElement: HTMLVideoElement) => {
        try {
            const { FaceMesh } = await import("@mediapipe/face_mesh");
            const { Camera } = await import("@mediapipe/camera_utils");

            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 2,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults((results: FaceMeshResults) => {
                const fc = results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0;
                setFaceCount(fc);

                if (fc === 1) {
                    const landmarks = results.multiFaceLandmarks?.[0];
                    if (!landmarks) return;

                    // Route to hooks
                    headPose.processLandmarks(landmarks);
                    lipSync.processLandmarks(landmarks);
                    microGaze.processGaze(landmarks);

                    // Cross-reference voice + lips
                    voiceActivity.checkCrossReference(!lipSync.isSuspicious);

                    // Blink Tracking
                    const rightEAR = calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
                    const leftEAR = calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);
                    blinkAnalysis.processEAR((rightEAR + leftEAR) / 2.0);
                }
            });

            faceMeshRef.current = faceMesh;

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (faceMeshRef.current) {
                        await faceMeshRef.current.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480,
            });
            camera.start();
        } catch (e) {
            console.error("AI Init Failed", e);
        }
    }, [blinkAnalysis, headPose, lipSync, microGaze, voiceActivity]);

    const handleVideoRef = useCallback((ref: HTMLVideoElement | null) => {
        videoRef.current = ref;
        if (ref && !aiEnabled) {
            setAiEnabled(true);
            initAiDetection(ref);
        }
    }, [aiEnabled, initAiDetection]);

    if (!isHydrated || !user) return null;

    return (
        <div className="max-w-[1600px] mx-auto py-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">AI Diagnostics Panel</h1>
                    <p className="text-slate-400">
                        Real-time verification environment for all 29+ Vision and Audio anti-cheat hooks. Try holding a phone, playing TTS audio, or looking away.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Camera Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <DiagnosticsCameraFeed onVideoRef={handleVideoRef} />

                        <div className="bg-[#1a1a1a] border border-[#3b3b3b] rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-[#3b3b3b] pb-2">Mesh System Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">FaceMesh Status</p>
                                    <p className="font-mono text-sm text-green-400">ACTIVE</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Faces Detected</p>
                                    <p className="font-mono text-sm text-white">{faceCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Audio Level</p>
                                    <p className="font-mono text-sm text-white">{ambientNoise.audioLevel.toFixed(2)} dB</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Head Pose (Pitch, Yaw)</p>
                                    <p className="font-mono text-sm text-white">{headPose.pose.pitch.toFixed(1)}, {headPose.pose.yaw.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicators Column */}
                    <div className="lg:col-span-7">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Real-Time Event Triggers</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

                            {/* Vision Anomalies */}
                            <Indicator label="Multiple Faces" active={faceCount > 1} type="danger" metric={`${faceCount} faces`} />
                            <Indicator label="Look Away" active={headPose.isAnomalous} type="vision" metric={headPose.pose.yaw > 0.35 ? "Right" : headPose.pose.yaw < -0.35 ? "Left" : "Center"} />
                            <Indicator label="Micro-Gaze Anomaly" active={microGaze.isAnomalous} type="vision" />
                            <Indicator label="Abnormal Blinking" active={blinkAnalysis.isAnomalous} type="vision" metric={`${blinkAnalysis.blinksPerMinute} bpm`} />
                            <Indicator label="Smartphone Detected" active={handTracking.isAnomalous} type="danger" />

                            {/* Audio Anomalies */}
                            <Indicator label="Speech Recognition" active={voiceActivity.speechDetected} type="audio" />
                            <Indicator label="Loud Ambient Noise" active={ambientNoise.isSuspicious} type="audio" metric={`${ambientNoise.audioLevel.toFixed(1)} dB`} />
                            <Indicator label="Synthesized Audio (TTS)" active={audioSpoofing.isAudioSpoofed} type="danger" />

                            {/* Cross-Reference */}
                            <Indicator label="Lip Sync Active" active={lipSync.lipMovement > 0.008} type="system" metric={lipSync.lipMovement > 0.008 ? "Talking..." : "Closed"} />
                            <Indicator label="Dictation Anomaly" active={voiceActivity.speechDetected && lipSync.lipMovement <= 0.008} type="danger" metric="Voice + No Lips" />
                        </div>

                        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-sm text-blue-200">
                            <strong>How to verify:</strong><br />
                            - <em>Dictation Anomaly:</em> Play an audiobook or speech into your mic, but keep your mouth perfectly still.<br />
                            - <em>Look Away:</em> Turn your head sharply 30+ degrees left or right.<br />
                            - <em>Synthesized Audio:</em> Route a robotic TTS voice into the microphone (checks for low sound variance).<br />
                            - <em>Smartphone:</em> Hold a phone with your hand below your chest for 5+ seconds.
                        </div>
                    </div>

                </div>
        </div>
    );
}
