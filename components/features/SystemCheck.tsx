"use client";
import React, { useState, useCallback, useEffect } from "react";

interface CheckResult {
    label: string;
    status: "checking" | "pass" | "warn" | "fail";
    message: string;
}

interface SystemCheckProps {
    onComplete: () => void;
    onSkip: () => void;
}

export default function SystemCheck({ onComplete, onSkip }: SystemCheckProps) {
    const [checks, setChecks] = useState<CheckResult[]>([
        { label: "Camera Access", status: "checking", message: "Checking..." },
        { label: "Face Visibility", status: "checking", message: "Checking..." },
        { label: "Virtual Camera", status: "checking", message: "Checking..." },
        { label: "Network Speed", status: "checking", message: "Checking..." },
    ]);
    const [allDone, setAllDone] = useState(false);

    const updateCheck = useCallback(
        (index: number, update: Partial<CheckResult>) => {
            setChecks((prev) =>
                prev.map((c, i) => (i === index ? { ...c, ...update } : c))
            );
        },
        []
    );

    useEffect(() => {
        const runChecks = async () => {
            // Check 1: Camera access
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach((t) => t.stop());
                updateCheck(0, { status: "pass", message: "Camera working" });
            } catch {
                updateCheck(0, { status: "fail", message: "Camera access denied" });
            }

            // Check 2: Face visibility (simple frame grab test — no MediaPipe to avoid double-load)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.createElement("video");
                video.srcObject = stream;
                await video.play();

                // Wait for a frame to render
                await new Promise((r) => setTimeout(r, 1500));

                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    // Check if image has enough variance (not a black/covered frame)
                    let sum = 0;
                    for (let i = 0; i < imageData.data.length; i += 40) {
                        sum += imageData.data[i];
                    }
                    const avg = sum / (imageData.data.length / 40);
                    if (avg > 20 && avg < 240) {
                        updateCheck(1, { status: "pass", message: "Face area visible" });
                    } else {
                        updateCheck(1, {
                            status: "warn",
                            message: "Low lighting or camera covered",
                        });
                    }
                } else {
                    updateCheck(1, { status: "warn", message: "Could not analyze frame" });
                }

                stream.getTracks().forEach((t) => t.stop());
                video.remove();
            } catch {
                updateCheck(1, { status: "warn", message: "Camera not available for face check" });
            }

            // Check 3: Virtual Camera Check
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((device) => device.kind === "videoinput");

                const virtualKeywords = ["obs", "virtual", "snap", "manycam", "epoccam", "xsplit"];
                let isVirtual = false;

                for (const device of videoInputs) {
                    const label = device.label.toLowerCase();
                    if (virtualKeywords.some((keyword) => label.includes(keyword))) {
                        isVirtual = true;
                        break;
                    }
                }

                if (isVirtual) {
                    updateCheck(2, { status: "fail", message: "Virtual camera detected — switch to a real webcam" });
                } else {
                    updateCheck(2, { status: "pass", message: "Hardware camera OK" });
                }
            } catch {
                updateCheck(2, { status: "warn", message: "Could not verify hardware camera" });
            }

            // Check 4: Network speed (fetch timing)
            try {
                const start = performance.now();
                const res = await fetch("/api/auth/signin", { method: "OPTIONS" }).catch(
                    () => fetch("/api/exam?recruiterId=test&limit=1")
                );
                const elapsed = performance.now() - start;
                if (elapsed < 500) {
                    updateCheck(3, { status: "pass", message: `${Math.round(elapsed)}ms — Fast` });
                } else if (elapsed < 2000) {
                    updateCheck(3, { status: "warn", message: `${Math.round(elapsed)}ms — Slow` });
                } else {
                    updateCheck(3, { status: "fail", message: "Network too slow" });
                }
                if (res && !res.ok) {
                    // We only care about timing, not response
                }
            } catch {
                updateCheck(3, { status: "fail", message: "No network connection" });
            }

            setAllDone(true);
        };

        runChecks();
    }, [updateCheck]);

    const hasFailure = checks.some((c) => c.status === "fail");
    const statusIcon = (s: CheckResult["status"]) => {
        switch (s) {
            case "checking":
                return "⏳";
            case "pass":
                return "✅";
            case "warn":
                return "⚠️";
            case "fail":
                return "❌";
        }
    };

    const statusColor = (s: CheckResult["status"]) => {
        switch (s) {
            case "checking":
                return "text-gray-400";
            case "pass":
                return "text-green-400";
            case "warn":
                return "text-yellow-400";
            case "fail":
                return "text-red-400";
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
                <p className="text-4xl mb-3">🔍</p>
                <h2 className="text-xl font-bold">System Check</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Verifying your setup before the exam
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {checks.map((check, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{statusIcon(check.status)}</span>
                            <span className="font-medium">{check.label}</span>
                        </div>
                        <span className={`text-sm ${statusColor(check.status)}`}>
                            {check.message}
                        </span>
                    </div>
                ))}
            </div>

            {allDone && (
                <div className="space-y-3">
                    {hasFailure ? (
                        <>
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                                <p className="text-red-400 text-sm">
                                    Some checks failed. You may proceed, but your exam experience
                                    may be affected.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onSkip}
                                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition-colors"
                                >
                                    Proceed Anyway
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-light rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Re-Check
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-colors"
                        >
                            ✅ All Clear — Start Exam
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
