"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CameraFeed from "@/components/features/CameraFeed";
import ProgressBar from "@/components/ui/ProgressBar";
import { useViolationLog } from "@/hooks/useViolationLog";
import { useViolationBuffer } from "@/hooks/useViolationBuffer";
import { useVirtualCameraDetection } from "@/hooks/useVirtualCameraDetection";
import { useDevToolsDetection } from "@/hooks/useDevToolsDetection";
import { useHardwareDetection } from "@/hooks/useHardwareDetection";
import { useFullScreenEnforcement } from "@/hooks/useFullScreenEnforcement";
import { useWindowFocusDetection } from "@/hooks/useWindowFocusDetection";
import FullScreenOverlay from "@/components/features/FullScreenOverlay";
import { useCandidatePersistence } from "@/hooks/useCandidatePersistence";
import { useLipSyncDetection } from "@/hooks/useLipSyncDetection";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useHeadPoseEstimation } from "@/hooks/useHeadPoseEstimation";
import { useAmbientNoiseDetection } from "@/hooks/useAmbientNoiseDetection";
import { useKeystrokeDynamics } from "@/hooks/useKeystrokeDynamics";
import { useScreenRecordingDetection } from "@/hooks/useScreenRecordingDetection";
import { useMultiTabDetection } from "@/hooks/useMultiTabDetection";
import { useFaceProximityDetection } from "@/hooks/useFaceProximityDetection";
import { useExtensionDetection } from "@/hooks/useExtensionDetection";
import { useIrisFocusTracking } from "@/hooks/useIrisFocusTracking";
import { useResponseTimeProfiling } from "@/hooks/useResponseTimeProfiling";
import { useMouseBehaviorAnalysis } from "@/hooks/useMouseBehaviorAnalysis";
import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
import { useVoiceActivityDetection } from "@/hooks/useVoiceActivityDetection";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useBrowserFingerprint } from "@/hooks/useBrowserFingerprint";
import { useBlinkFrequencyAnalysis } from "@/hooks/useBlinkFrequencyAnalysis";
import { useVirtualDeviceDetection } from "@/hooks/useVirtualDeviceDetection";
import { useAudioSpoofingDetection } from "@/hooks/useAudioSpoofingDetection";
import { useMicroGazeTracker } from "@/hooks/useMicroGazeTracker";
import { useSandboxEnvironmentCheck } from "@/hooks/useSandboxEnvironmentCheck";
import { useWebRTC } from "@/hooks/useWebRTC";
import LiveVideoCall from "@/components/features/LiveVideoCall";
import { useCandidateQuiz } from "@/hooks/useCandidateQuiz";
import QuizTracker from "@/components/features/QuizTracker";
import QuestionView from "@/components/features/QuestionView";

interface FaceMeshLandmark {
    x: number;
    y: number;
    z: number;
}

interface FaceMeshResults {
    multiFaceLandmarks?: FaceMeshLandmark[][];
}

// Calculate Eye Aspect Ratio (EAR) for blink detection
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

interface SessionData {
    _id: string;
    examId: { _id: string; title: string; duration: number };
    status: string;
    startTime: string;
    integrityScore: number;
    totalViolations: number;
}

type PermissionState = "checking" | "granted" | "camera_denied" | "mic_denied";

export default function CandidateExamPage() {
    const { id: sessionId } = useParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [session, setSession] = useState<SessionData | null>(null);
    const [user, setUser] = useState<{ _id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [gazeDirection, setGazeDirection] = useState("CENTER");
    const [lookAwaySeconds, setLookAwaySeconds] = useState(0);
    const [faceCount, setFaceCount] = useState(1);
    const [examEnded, setExamEnded] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiInitFailed, setAiInitFailed] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [permissionState, setPermissionState] = useState<PermissionState>("checking");

    const lookAwayStart = useRef<number | null>(null);
    const lastBlinkTime = useRef<number>(Date.now());
    const livenessFired = useRef<boolean>(false);
    const faceMeshRef = useRef<{ close: () => void; send: (input: { image: HTMLVideoElement }) => Promise<void> } | null>(null);
    const cameraRef = useRef<{ stop: () => void } | null>(null);
    const aiRunning = useRef<boolean>(false);
    const lookAwayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const throttleRef = useRef<Record<string, number>>({});

    const { refetch: refetchViolations } = useViolationLog(sessionId as string);
    const { logViolation: bufferLogViolation, stopAutoFlush, flush } = useViolationBuffer();
    const { persistedState, saveState } = useCandidatePersistence(sessionId as string);

    // ── Candidate Quiz Hook ──
    const quiz = useCandidateQuiz(session?.examId?._id as string, sessionId as string, !loading && permissionState === "granted" && !examEnded);

    // Initial examEnded should check persistence
    useEffect(() => {
        if (persistedState?.examEnded && !examEnded) {
            setExamEnded(true);
        }
    }, [persistedState, examEnded]);

    // ── Permission check ──
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream.getTracks().forEach((t) => t.stop());
                setPermissionState("granted");
            } catch (err: unknown) {
                const error = err as DOMException;
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    // Check if camera specifically was denied
                    try {
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        videoStream.getTracks().forEach((t) => t.stop());
                        // Camera ok, mic denied → degraded mode
                        setPermissionState("mic_denied");
                    } catch {
                        setPermissionState("camera_denied");
                    }
                } else {
                    setPermissionState("camera_denied");
                }
            }
        };
        checkPermissions();
    }, []);

    // ── beforeunload warning ──
    useEffect(() => {
        if (examEnded) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [examEnded]);


    // ── Load user ──
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
        else router.push("/auth");
    }, [router]);

    // ── Load session ──
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}`);
                if (!res.ok) throw new Error("Session not found");
                const data = await res.json();
                setSession(data);

                if (data.startTime && data.examId?.duration) {
                    const start = new Date(data.startTime).getTime();
                    const durationMs = data.examId.duration * 60 * 1000;
                    const end = start + durationMs;
                    setTimeRemaining(Math.max(0, end - Date.now()));
                    setTotalDuration(durationMs);
                }
            } catch {
                router.push("/candidate/verify");
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) fetchSession();
    }, [sessionId, router]);

    // ── Timer countdown ──
    useEffect(() => {
        if (timeRemaining <= 0 || examEnded) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                const next = prev - 1000;
                if (next <= 0) {
                    clearInterval(interval);
                    handleEndExam();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining, examEnded]);

    // ── Look-away seconds tracker ──
    useEffect(() => {
        if (gazeDirection !== "CENTER") {
            lookAwayTimer.current = setInterval(() => {
                if (lookAwayStart.current) {
                    setLookAwaySeconds((Date.now() - lookAwayStart.current) / 1000);
                }
            }, 200);
        } else {
            setLookAwaySeconds(0);
            if (lookAwayTimer.current) clearInterval(lookAwayTimer.current);
        }
        return () => {
            if (lookAwayTimer.current) clearInterval(lookAwayTimer.current);
        };
    }, [gazeDirection]);

    // ── Log violation (with buffer and throttling) ──
    const logViolation = useCallback(
        async (
            type: string,
            direction?: string,
            duration?: number,
            confidence?: number
        ) => {
            if (!sessionId || !user) return;

            // Throttling for continuous violations
            const now = Date.now();
            const lastLog = throttleRef.current[type] || 0;
            const throttleMs = type === "MULTIPLE_FACES" ? 10000 : type === "LOOKING_AWAY" ? 5000 : 0;

            if (now - lastLog < throttleMs) return;
            throttleRef.current[type] = now;

            const success = await bufferLogViolation({
                sessionId: sessionId as string,
                candidateId: user._id,
                type,
                direction,
                timestamp: new Date().toISOString(),
                duration,
                confidence: confidence || 0.85,
            });
            if (success) {
                setViolationCount((p) => p + 1);
                refetchViolations();
            }
        },
        [sessionId, user, bufferLogViolation, refetchViolations]
    );

    const isExamActive = !loading && permissionState === "granted" && !examEnded;

    // ── Advanced Anti-Cheat Hooks ──
    const isMicAvailable = permissionState !== "mic_denied";
    useVirtualCameraDetection(() => { logViolation("VIRTUAL_CAMERA"); }, isExamActive);
    useDevToolsDetection(() => { logViolation("DEVTOOLS_ACCESS"); }, isExamActive);
    useHardwareDetection(() => { logViolation("SECONDARY_MONITOR"); }, isExamActive);

    // AI Proctoring Hooks (side effects only, no need to capture unused return values)
    const lipSync = useLipSyncDetection(sessionId as string, user?._id || "");
    useObjectDetection(videoRef, sessionId as string, user?._id || "", isExamActive);
    const headPose = useHeadPoseEstimation(sessionId as string, user?._id || "");
    const ambientNoise = useAmbientNoiseDetection(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    
    // Bridge: share audio level from ambient noise → lip-sync (avoids duplicate mic stream)
    useEffect(() => {
        lipSync.setAudioLevel(ambientNoise.audioLevel);
    }, [ambientNoise.audioLevel, lipSync]);

    const {
        isFullScreen,
        violationCount: fullScreenViolations,
        requestFullScreen
    } = useFullScreenEnforcement(sessionId as string, user?._id || "", isExamActive);

    useWindowFocusDetection(sessionId as string, user?._id || "", isExamActive);
    useKeystrokeDynamics(sessionId as string, user?._id || "", isExamActive);
    useScreenRecordingDetection(sessionId as string, user?._id || "", isExamActive);
    useMultiTabDetection(sessionId as string, user?._id || "", isExamActive);
    const faceProximity = useFaceProximityDetection(sessionId as string, user?._id || "");
    useExtensionDetection(sessionId as string, user?._id || "", isExamActive);
    const irisFocus = useIrisFocusTracking(sessionId as string, user?._id || "");
    useResponseTimeProfiling(sessionId as string, user?._id || "");
    useMouseBehaviorAnalysis(sessionId as string, user?._id || "", isExamActive);
    useNetworkMonitor(sessionId as string, user?._id || "", isExamActive);
    const voiceActivity = useVoiceActivityDetection(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    useHandTracking(sessionId as string, user?._id || "", videoRef);
    useBrowserFingerprint(sessionId as string, user?._id || "", isExamActive);
    const blinkAnalysis = useBlinkFrequencyAnalysis(sessionId as string, user?._id || "");
    useVirtualDeviceDetection(sessionId as string, user?._id || "", isExamActive);
    useAudioSpoofingDetection(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    const microGaze = useMicroGazeTracker(sessionId as string, user?._id || "");
    useSandboxEnvironmentCheck(sessionId as string, user?._id || "", isExamActive);

    // ── WebRTC Live Video Interview (Candidate Side) ──
    // The candidate receives the call. The target is the recruiter, but we don't know their ID until the offer arrives.
    // useWebRTC handles extracting the senderId from the incoming offer automatically.
    const {
        callStatus,
        remoteStream,
        endCall,
        sendTelemetry
    } = useWebRTC(
        sessionId as string,
        user?._id || "",
        null, // Target ID is null initially for the receiver
        videoRef.current?.srcObject as MediaStream || null
    );

    // AI Telemetry Pipe (Candidate -> Recruiter)
    useEffect(() => {
        if (callStatus === "connected") {
            sendTelemetry({
                gazeDirection,
                faceCount,
                timestamp: Date.now()
            });
        }
    }, [gazeDirection, faceCount, callStatus, sendTelemetry]);




    // ── Tab switch detection ──
    useEffect(() => {
        if (examEnded) return;
        let tabSwitchStart: number | null = null;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                tabSwitchStart = Date.now();
            } else if (tabSwitchStart) {
                const duration = Math.round((Date.now() - tabSwitchStart) / 1000);
                // Only log if away for 2+ seconds (avoids false positives from OS notifications)
                if (duration >= 2) {
                    logViolation("TAB_SWITCH", undefined, duration);
                }
                tabSwitchStart = null;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [examEnded, logViolation]);

    // ── Copy-paste and Shortcut detection ──
    useEffect(() => {
        if (examEnded) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Copy/Paste/Select All/Cut
            if ((e.ctrlKey || e.metaKey) && ["c", "v", "a", "x"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                logViolation("COPY_PASTE", `Ctrl+${e.key.toUpperCase()}`);
            }

            // Block Print Screen
            if (e.key === "PrintScreen") {
                e.preventDefault();
                logViolation("KEYBOARD_SHORTCUT", "PrintScreen");
            }

            // Block New Tab/Window/Close shortcuts 
            if ((e.ctrlKey || e.metaKey) && ["t", "n", "w", "shift"].includes(e.key.toLowerCase())) {
                logViolation("KEYBOARD_SHORTCUT", `Ctrl+${e.key.toUpperCase()}`);
                // Browsers usually prevent default on these, but we log the attempt
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            logViolation("COPY_PASTE", "RIGHT_CLICK");
        };

        const handlePaste = async (e: ClipboardEvent) => {
            e.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                logViolation("CLIPBOARD_PASTE", text.slice(0, 100)); // Log first 100 chars
            } catch {
                logViolation("CLIPBOARD_PASTE", "Unknown Content");
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("paste", handlePaste);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("paste", handlePaste);
        };
    }, [examEnded, logViolation]);

    // ── Initialize AI detection ──
    const initAiDetection = useCallback(async (videoElement: HTMLVideoElement) => {
        try {
            const { FaceMesh } = await import("@mediapipe/face_mesh");
            const { Camera } = await import("@mediapipe/camera_utils");

            const faceMesh = new FaceMesh({
                locateFile: (file: string) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 2,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults((results: FaceMeshResults) => {
                const fc = results.multiFaceLandmarks
                    ? results.multiFaceLandmarks.length
                    : 0;
                setFaceCount(fc);

                if (fc === 0) {
                    setGazeDirection("CENTER");
                    return;
                }

                if (fc > 1) {
                    logViolation("MULTIPLE_FACES");
                }

                if (fc === 1) {
                    const landmarks = results.multiFaceLandmarks?.[0];
                    if (!landmarks) return;
                    // Right eye & Left eye indices
                    const rightEAR = calculateEAR(landmarks, [33, 160, 158, 133, 153, 144]);
                    const leftEAR = calculateEAR(landmarks, [362, 385, 387, 263, 373, 380]);
                    const ear = (rightEAR + leftEAR) / 2.0;

                    // v6: Track blink frequency for stress/reading detection
                    blinkAnalysis.processEAR(ear);

                    // v7: Track pupil coordinate variance for micro-glances
                    microGaze.processGaze(landmarks);





                    if (ear < 0.20) {
                        lastBlinkTime.current = Date.now();
                        livenessFired.current = false;
                    } else {
                        if (Date.now() - lastBlinkTime.current > 45000) {
                            if (!livenessFired.current) {
                                livenessFired.current = true;
                                logViolation("LIVENESS_FAILURE");
                            }
                        }
                    }
                }

                const landmarks = results.multiFaceLandmarks?.[0];
                if (landmarks && landmarks.length >= 468) {
                    const noseTip = landmarks[1];
                    const leftCheek = landmarks[234];
                    const rightCheek = landmarks[454];
                    const forehead = landmarks[10];

                    const cheekMid = (leftCheek.x + rightCheek.x) / 2;
                    const horizontalOffset = noseTip.x - cheekMid;
                    const verticalOffset = noseTip.y - forehead.y;
                    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
                    const hThreshold = faceWidth * 0.15;
                    const vThreshold = faceWidth * 0.25;

                    let dir = "CENTER";
                    if (horizontalOffset < -hThreshold) dir = "RIGHT";
                    else if (horizontalOffset > hThreshold) dir = "LEFT";
                    else if (verticalOffset < vThreshold * 0.6) dir = "UP";
                    else if (verticalOffset > vThreshold * 1.4) dir = "DOWN";

                    setGazeDirection(dir);

                    // Feed landmarks to proctoring processors
                    headPose.processLandmarks(landmarks);
                    faceProximity.processLandmarks(landmarks);
                    lipSync.processLandmarks(landmarks);
                    irisFocus.processLandmarks(landmarks);

                    // Cross-reference: voice detected + no lip movement = anomaly
                    voiceActivity.checkCrossReference(!lipSync.isSuspicious);





                    if (dir !== "CENTER") {
                        if (!lookAwayStart.current) {
                            lookAwayStart.current = Date.now();
                        } else {
                            const elapsed = Date.now() - lookAwayStart.current;
                            if (elapsed >= 5000) {
                                logViolation("LOOKING_AWAY", dir, Math.round(elapsed / 1000), 0.85);
                                lookAwayStart.current = Date.now();
                            }
                        }
                    } else {
                        lookAwayStart.current = null;
                    }
                }
            });

            faceMeshRef.current = faceMesh;
            aiRunning.current = true;

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (aiRunning.current && faceMeshRef.current) {
                        await faceMeshRef.current.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480,
            });
            cameraRef.current = camera;
            camera.start();
        } catch {
            // AI detection init failed — show warning to user
            setAiInitFailed(true);
        }
    }, [logViolation, blinkAnalysis, faceProximity, headPose, irisFocus, lipSync, microGaze, voiceActivity]);

    const handleVideoRef = useCallback(
        (ref: HTMLVideoElement | null) => {
            videoRef.current = ref;
            if (ref && !aiEnabled) {
                setAiEnabled(true);
                initAiDetection(ref);
            }
        },
        [aiEnabled, initAiDetection]
    );

    // ── End exam ──
    const handleEndExam = useCallback(async () => {
        if (examEnded) return;
        setExamEnded(true);
        stopAutoFlush();
        await flush(); // CRITICAL: Ensure last batch of violations is saved *before* completing the session

        // Stop AI detection properly
        aiRunning.current = false;
        
        if (cameraRef.current) {
            cameraRef.current.stop();
        }
        
        // Wait a bit for any pending frames to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (faceMeshRef.current) {
            faceMeshRef.current.close();
            faceMeshRef.current = null;
        }

        saveState({ examEnded: true });

        await fetch(`/api/session/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
        });

        router.push("/candidate/verify");
    }, [examEnded, sessionId, router, stopAutoFlush, flush, saveState]);

    // ── Camera denied blocker ──
    if (permissionState === "camera_denied") {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <div className="max-w-md text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center text-4xl">
                        📷
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Camera Access Required</h1>
                    <p className="text-gray-400 mb-6">
                        Camera access is required for this proctored exam. Please allow camera access
                        in your browser settings and refresh the page.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-primary hover:bg-primary-light rounded-xl font-semibold transition-colors"
                        >
                            Refresh Page
                        </button>
                        <button
                            onClick={() => router.push("/candidate/verify")}
                            className="w-full px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (permissionState === "checking" || loading) {
        return (
            <div className="min-h-screen bg-background text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">
                        {permissionState === "checking" ? "Checking permissions..." : "Loading exam session..."}
                    </p>
                </div>
            </div>
        );
    }

    const timeRemainingSeconds = Math.floor(timeRemaining / 1000);
    const totalDurationSeconds = Math.floor(totalDuration / 1000);

    return (
        <div className="min-h-screen bg-background text-white">
            <FullScreenOverlay
                isVisible={isExamActive && !isFullScreen}
                violationCount={fullScreenViolations}
                onRequestFullScreen={requestFullScreen}
            />

            {/* Mic denied banner */}
            {permissionState === "mic_denied" && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-900/80 text-yellow-200 text-center text-xs py-1.5">
                    ⚠️ Microphone access denied — Lip-sync detection is disabled
                </div>
            )}

            {/* AI init failed banner */}
            {aiInitFailed && (
                <div className={`fixed ${permissionState === "mic_denied" ? "top-7" : "top-0"} left-0 right-0 z-[59] bg-red-900/80 text-red-200 text-center text-xs py-1.5`}>
                    ⚠️ AI detection failed to load — Your exam may not be monitored
                </div>
            )}

            {/* Fixed top bar */}
            <header
                className={`fixed ${permissionState === "mic_denied" && aiInitFailed ? "top-14" : permissionState === "mic_denied" || aiInitFailed ? "top-7" : "top-0"} left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/10 px-6`}
            >
                <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-[10px] font-bold">
                            II
                        </div>
                        <div>
                            <span className="text-sm font-semibold">
                                {session?.examId?.title || "Exam"}
                            </span>
                            <span className="text-xs text-gray-500 ml-3">
                                {violationCount > 0 ? `${violationCount} violations` : "Clean"}
                            </span>
                        </div>
                    </div>

                    {/* Timer progress bar */}
                    <div className="w-48">
                        <ProgressBar
                            current={timeRemainingSeconds}
                            total={totalDurationSeconds}
                            showLabel={true}
                        />
                    </div>

                    <button
                        onClick={handleEndExam}
                        disabled={examEnded}
                        className="px-4 py-2 text-sm bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        End Exam
                    </button>
                </div>
            </header>

            {/* Main content - Split Screen */}
            <div
                className={`${permissionState === "mic_denied" ? "pt-[5.75rem]" : "pt-16"} flex h-[calc(100vh-56px)] p-6 gap-6`}
            >
                {/* Left Area: 75% Question View */}
                <div className="flex-1 flex flex-col h-full min-w-0">
                    {quiz.loading ? (
                        <div className="flex-1 rounded-2xl bg-slate-800/20 border border-slate-800 animate-pulse flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent flex rounded-full animate-spin"></div>
                        </div>
                    ) : quiz.questions.length === 0 ? (
                        <div className="flex-1 rounded-2xl bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <p>No questions found for this exam.</p>
                            <button
                                onClick={handleEndExam}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                            >
                                Submit Empty Exam
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 min-h-0">
                                <QuestionView
                                    question={quiz.currentQuestion}
                                    response={quiz.responses[quiz.currentQuestion?._id]}
                                    onAnswerChange={(updates) => quiz.saveResponse(quiz.currentQuestion._id, updates)}
                                    onToggleReview={() => quiz.toggleMarkForReview(quiz.currentQuestion._id)}
                                />
                            </div>

                            {/* Question Navigation Footer */}
                            <div className="h-16 mt-4 flex items-center justify-between px-6 bg-slate-800/80 border border-slate-700 rounded-2xl shrink-0">
                                <button
                                    onClick={quiz.goToPrev}
                                    disabled={quiz.currentIndex === 0}
                                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="text-sm font-mono text-slate-400">
                                    {quiz.currentIndex + 1} / {quiz.questions.length}
                                </span>

                                {quiz.currentIndex === quiz.questions.length - 1 ? (
                                    <button
                                        onClick={handleEndExam}
                                        className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-primary hover:bg-primary-light text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    >
                                        Submit Exam
                                    </button>
                                ) : (
                                    <button
                                        onClick={quiz.goToNext}
                                        className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-white/10 hover:bg-white/20"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Area: 25% Sidebar (Camera + Tracker + Violations) */}
                <div className="w-[340px] shrink-0 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1 pb-4">

                    {/* Minimized Camera Feed */}
                    <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                        <CameraFeed
                            onVideoRef={handleVideoRef}
                            gazeDirection={gazeDirection}
                            faceCount={faceCount}
                            isSuspicious={lipSync.isSuspicious}
                            className="w-full h-[255px]"
                        />

                        {/* Live AI Status Indicators */}
                        <div className="p-3 grid grid-cols-2 gap-2 border-t border-slate-800 bg-slate-900 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Network</span>
                                <span className="text-xs font-mono mt-0.5 text-green-400">
                                    ONLINE
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                    Sync
                                    {quiz.isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                                </span>
                                <span className={`text-xs font-mono mt-0.5 ${quiz.isSyncing ? "text-blue-400" : "text-slate-400"}`}>
                                    {quiz.isSyncing ? "Saving..." : "Up to date"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Anomaly Mini-Feed */}
                    <div className="shrink-0 bg-slate-800/30 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Diagnostics</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span>Violations:</span>
                                <span className={violationCount > 0 ? "text-red-400 font-mono" : "text-green-400 font-mono"}>{violationCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Look Away:</span>
                                <span className={lookAwaySeconds > 0 ? "text-yellow-400 font-mono" : "text-green-400 font-mono"}>{lookAwaySeconds.toFixed(1)}s</span>
                            </div>
                        </div>
                    </div>

                    {/* Quiz Matrix Navigator */}
                    {!quiz.loading && quiz.questions.length > 0 && (
                        <div className="flex-1 min-h-[300px]">
                            <QuizTracker
                                questions={quiz.questions}
                                responses={quiz.responses}
                                currentIndex={quiz.currentIndex}
                                onSelect={quiz.goToQuestion}
                            />
                        </div>
                    )}

                    {/* WebRTC Video Fallback */}
                    {callStatus === "connected" && remoteStream && (
                        <div className="shrink-0 h-[250px] mb-4">
                            <LiveVideoCall
                                remoteStream={remoteStream}
                                callStatus={callStatus}
                                onEndCall={endCall}
                                isRecruiter={false}
                                onAccept={() => { }}
                                onDecline={() => { }}
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
