"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import BiometricCapture from "@/components/features/BiometricCapture";
import SystemCheck from "@/components/features/SystemCheck";

interface User {
    _id: string;
    name: string;
    role: string;
}

function CandidateVerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSessionId = searchParams.get("sessionId");
    const urlCode = searchParams.get("code");

    const [user, setUser] = useState<User | null>(null);
    const [sessionCode, setSessionCode] = useState(urlCode || "");
    const [joinError, setJoinError] = useState("");
    const [joining, setJoining] = useState(false);
    const [examInfo, setExamInfo] = useState<{ title: string; description?: string; duration: number } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [step, setStep] = useState<"join" | "biometric" | "system_check" | "ready">("join");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            router.push("/auth");
            return;
        }
        const parsed = JSON.parse(stored);
        if (parsed.role !== "candidate") {
            router.push("/dashboard");
            return;
        }
        setUser(parsed);
    }, [router]);

    // Handle direct URL joins
    useEffect(() => {
        if (!user) return; // Wait for user hydration

        let isMounted = true;
        const initFromUrl = async () => {
            if (urlSessionId) {
                try {
                    setJoining(true);
                    const res = await fetch(`/api/session/${urlSessionId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (isMounted) {
                            setExamInfo(data.examId);
                            setSessionId(data._id);
                            setStep("biometric");
                        }
                    }
                } catch (e) {
                    console.error("Failed to load session from URL", e);
                } finally {
                    if (isMounted) setJoining(false);
                }
            } else if (urlCode) {
                setSessionCode(urlCode);
                // We'll let them click "Join" instead of auto-joining to avoid unexpected network flashes, 
                // but the input will be prefilled.
            }
        };

        if (step === "join") {
            initFromUrl();
        }

        return () => { isMounted = false; };
    }, [urlSessionId, urlCode, user, step]);

    // Join exam by session code
    const handleJoinExam = useCallback(async () => {
        if (!sessionCode.trim() || !user) return;
        setJoining(true);
        setJoinError("");

        try {
            // Look up the exam
            const examRes = await fetch(`/api/exam/join/${sessionCode.trim()}`);
            if (!examRes.ok) {
                const err = await examRes.json();
                throw new Error(err.message || "Invalid session code");
            }
            const exam = await examRes.json();
            setExamInfo(exam);

            // Create a session
            const sessionRes = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    examId: exam._id,
                    candidateId: user._id,
                }),
            });

            if (!sessionRes.ok) {
                const err = await sessionRes.json();
                throw new Error(err.message || "Failed to join exam");
            }

            const sessionData = await sessionRes.json();
            setSessionId(sessionData.session._id);
            setStep("biometric");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to join";
            setJoinError(message);
        } finally {
            setJoining(false);
        }
    }, [sessionCode, user]);

    // After biometric enrollment, go to system check
    const handleBiometricComplete = useCallback(() => {
        setStep("system_check");
    }, []);

    // Start the exam
    const handleStartExam = useCallback(async () => {
        if (!sessionId) return;

        await fetch(`/api/session/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "in_progress" }),
        });

        router.push(`/candidate/exam/${sessionId}`);
    }, [sessionId, router]);

    if (!user) return null;

    return (
        <DashboardShell userName={user.name} userRole={user.role}>
            {/* Step 1: Join Exam */}
            {step === "join" && (
                <div className="max-w-md mx-auto py-12">
                    <div className="text-center mb-8">
                        <p className="text-5xl mb-4">🔑</p>
                        <h1 className="text-3xl font-bold">Join an Exam</h1>
                        <p className="text-gray-400 mt-2">
                            Enter the session code provided by your recruiter.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={sessionCode}
                            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-letter code"
                            maxLength={6}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-gray-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary"
                            onKeyDown={(e) => e.key === "Enter" && handleJoinExam()}
                        />

                        {joinError && (
                            <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm text-center">
                                {joinError}
                            </div>
                        )}

                        <button
                            onClick={handleJoinExam}
                            disabled={sessionCode.length < 4 || joining}
                            className="w-full px-6 py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
                        >
                            {joining ? "Joining..." : "Join Exam →"}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Biometric Enrollment */}
            {step === "biometric" && (
                <div className="py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold">Identity Verification</h1>
                        <p className="text-gray-400 mt-1">
                            Complete face & voice enrollment before starting{" "}
                            <span className="text-primary-light">{examInfo?.title}</span>
                        </p>
                    </div>

                    <BiometricCapture
                        userId={user._id}
                        onComplete={handleBiometricComplete}
                    />
                </div>
            )}

            {/* Step 3: System Check */}
            {step === "system_check" && (
                <div className="py-8">
                    <SystemCheck
                        onComplete={() => setStep("ready")}
                        onSkip={() => setStep("ready")}
                    />
                </div>
            )}

            {/* Step 4: Ready to Start */}
            {step === "ready" && examInfo && (
                <div className="max-w-md mx-auto py-12 text-center">
                    <p className="text-5xl mb-4">✅</p>
                    <h1 className="text-3xl font-bold mb-2">You&apos;re Ready!</h1>
                    <p className="text-gray-400 mb-8">
                        Identity verified. You can now start the exam.
                    </p>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 text-left">
                        <h2 className="text-lg font-bold mb-3">{examInfo.title}</h2>
                        {examInfo.description && (
                            <p className="text-sm text-gray-400 mb-3">
                                {examInfo.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>⏱ {examInfo.duration} minutes</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-800/50 mb-8 text-sm text-yellow-300">
                        ⚠️ Once you start, the system will monitor your camera and
                        microphone. Do not switch tabs or look away for extended periods.
                    </div>

                    <button
                        onClick={handleStartExam}
                        className="w-full px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition-colors"
                    >
                        🚀 Start Exam
                    </button>
                </div>
            )}
        </DashboardShell>
    );
}

export default function CandidateVerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Loading Verification...</div>}>
            <CandidateVerifyContent />
        </Suspense>
    );
}
