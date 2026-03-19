"use client";
import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import Image from "next/image";

interface BiometricCaptureProps {
    userId: string;
    onComplete: () => void;
}

export default function BiometricCapture({
    userId,
    onComplete,
}: BiometricCaptureProps) {
    const webcamRef = useRef<Webcam>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const [facePhoto, setFacePhoto] = useState<string | null>(null);
    const [voiceData, setVoiceData] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [step, setStep] = useState<"face" | "voice" | "review">("face");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Capture face photo
    const captureFace = useCallback(() => {
        if (webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot();
            if (screenshot) {
                setFacePhoto(screenshot);
                setStep("voice");
            }
        }
    }, []);

    // Start voice recording
    const startVoiceRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: "audio/webm" });
                const reader = new FileReader();
                reader.onloadend = () => {
                    setVoiceData(reader.result as string);
                    setStep("review");
                };
                reader.readAsDataURL(blob);
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);

            // Auto-stop after 5 seconds
            setTimeout(() => {
                if (recorder.state === "recording") {
                    recorder.stop();
                    setIsRecording(false);
                }
            }, 5000);
        } catch {
            setError("Microphone access denied. Voice enrollment is optional.");
            setStep("review");
        }
    }, []);

    const stopVoiceRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    // Submit biometric data
    const handleSubmit = useCallback(async () => {
        if (!facePhoto) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/biometric/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    faceData: facePhoto,
                    voiceData: voiceData || undefined,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to enroll biometrics");
            }

            onComplete();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Enrollment failed";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }, [userId, facePhoto, voiceData, onComplete]);

    return (
        <div className="max-w-lg mx-auto">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-4 mb-8">
                {["face", "voice", "review"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step === s
                                    ? "bg-primary text-white"
                                    : ["face", "voice", "review"].indexOf(step) > i
                                        ? "bg-green-600 text-white"
                                        : "bg-white/10 text-gray-400"
                                }`}
                        >
                            {["face", "voice", "review"].indexOf(step) > i ? "✓" : i + 1}
                        </div>
                        <span className="text-xs text-gray-400 capitalize hidden sm:block">{s === "face" ? "Face Photo" : s === "voice" ? "Voice Sample" : "Review"}</span>
                        {i < 2 && <div className="w-8 h-px bg-white/20" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Face Capture */}
            {step === "face" && (
                <div className="space-y-6 text-center">
                    <div className="rounded-2xl overflow-hidden border border-white/10">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user", width: 480, height: 360 }}
                            className="w-full h-auto"
                            mirrored
                        />
                    </div>
                    <div>
                        <p className="text-gray-300 mb-4">
                            Position your face in the center and ensure good lighting.
                        </p>
                        <button
                            onClick={captureFace}
                            className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
                        >
                            📸 Capture Face Photo
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Voice Recording */}
            {step === "voice" && (
                <div className="space-y-6 text-center">
                    <div className="p-12 rounded-2xl bg-white/5 border border-white/10">
                        <div className={`text-6xl mb-4 ${isRecording ? "animate-pulse" : ""}`}>
                            🎤
                        </div>
                        <p className="text-gray-300 mb-2">
                            {isRecording
                                ? "Recording... Please say: \"I confirm my identity for this exam.\""
                                : "Click to record a short voice sample (5 seconds)."
                            }
                        </p>
                        {isRecording && (
                            <div className="flex items-center justify-center gap-1 mt-4">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 bg-red-500 rounded-full animate-pulse"
                                        style={{
                                            height: `${20 + Math.random() * 20}px`,
                                            animationDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 justify-center">
                        {!isRecording ? (
                            <>
                                <button
                                    onClick={startVoiceRecording}
                                    className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
                                >
                                    🎙 Start Recording
                                </button>
                                <button
                                    onClick={() => setStep("review")}
                                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                                >
                                    Skip →
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={stopVoiceRecording}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                ⏹ Stop Recording
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === "review" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Face preview */}
                        <div className="rounded-xl overflow-hidden border border-white/10">
                            {facePhoto ? (
                                <Image
                                    src={facePhoto}
                                    alt="Captured face"
                                    width={480}
                                    height={360}
                                    className="w-full h-auto"
                                    unoptimized
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-500">No photo</div>
                            )}
                            <div className="p-2 text-center text-xs bg-white/5">
                                {facePhoto ? "✅ Face Photo" : "❌ No Photo"}
                            </div>
                        </div>

                        {/* Voice preview */}
                        <div className="rounded-xl border border-white/10 flex flex-col items-center justify-center p-6">
                            <div className="text-4xl mb-2">{voiceData ? "🎤" : "🔇"}</div>
                            <p className="text-sm text-gray-400">
                                {voiceData ? "✅ Voice Recorded" : "⏭ Skipped"}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => {
                                setFacePhoto(null);
                                setVoiceData(null);
                                setStep("face");
                            }}
                            className="px-6 py-3 text-gray-400 hover:text-white border border-white/10 rounded-xl transition-colors"
                        >
                            ← Retake
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !facePhoto}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                        >
                            {submitting ? "Submitting..." : "✓ Confirm & Continue"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
