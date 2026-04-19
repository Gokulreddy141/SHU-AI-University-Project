"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { useGeminiLiveMonitoring } from "@/hooks/useGeminiLiveMonitoring";
import { useGeminiMonitoring } from "@/hooks/useGeminiMonitoring";
import { useClipboardInterception } from "@/hooks/useClipboardInterception";
import { usePrintScreenDetection } from "@/hooks/usePrintScreenDetection";
import { useFaceIdentityVerification } from "@/hooks/useFaceIdentityVerification";
import { useLLMTrafficDetection } from "@/hooks/useLLMTrafficDetection";
import { usePhoneBelowMonitorDetection } from "@/hooks/usePhoneBelowMonitorDetection";
import { useSileroVAD } from "@/hooks/useSileroVAD";
import { useRoomEnvironmentMonitor } from "@/hooks/useRoomEnvironmentMonitor";
import { useSpeakerIdentity } from "@/hooks/useSpeakerIdentity";
import { useLivenessDetection } from "@/hooks/useLivenessDetection";
import { useBehavioralConsistency } from "@/hooks/useBehavioralConsistency";
import { useAttentionScore } from "@/hooks/useAttentionScore";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";

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
    const [permissionState, setPermissionState] = useState<PermissionState>("checking");

    const lookAwayStart = useRef<number | null>(null);
    const lastBlinkTime = useRef<number>(Date.now());
    const livenessFired = useRef<boolean>(false);
    const faceMeshRef = useRef<{ close: () => void; send: (input: { image: HTMLVideoElement }) => Promise<void> } | null>(null);
    const cameraRef = useRef<{ stop: () => void } | null>(null);
    const aiRunning = useRef<boolean>(false);
    const lookAwayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const throttleRef = useRef<Record<string, number>>({});
    // Live AI state ref — always holds the latest values for snapshot upload (avoids stale closure)
    const liveAiStateRef = useRef({
        gazeDirection: "CENTER",
        faceCount: 1,
        isSpeaking: false,
        isLookingAway: false,
        activeAlerts: [] as string[],
        integrityScore: 100,
    });

    const { violations: dbViolations, refetch: refetchViolations } = useViolationLog(sessionId as string);
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

    // ── Timer countdown — runs once when totalDuration is set, stable interval ──
    useEffect(() => {
        if (!totalDuration || examEnded) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [totalDuration, examEnded]);

    // ── Auto-submit when timer hits zero ──
    useEffect(() => {
        if (timeRemaining === 0 && totalDuration > 0 && !examEnded) {
            handleEndExam();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining]);

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
            const throttleMs = type === "MULTIPLE_FACES" ? 10000 : type === "LOOKING_AWAY" ? 5000 : type === "NO_FACE" ? 10000 : 0;

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
    const responseTimeProfiling = useResponseTimeProfiling(sessionId as string, user?._id || "");
    useMouseBehaviorAnalysis(sessionId as string, user?._id || "", isExamActive);
    useNetworkMonitor(sessionId as string, user?._id || "", isExamActive);
    const voiceActivity = useVoiceActivityDetection(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    useHandTracking(sessionId as string, user?._id || "", videoRef, isExamActive);
    useBrowserFingerprint(sessionId as string, user?._id || "", isExamActive);
    const blinkAnalysis = useBlinkFrequencyAnalysis(sessionId as string, user?._id || "");
    useVirtualDeviceDetection(sessionId as string, user?._id || "", isExamActive);
    useAudioSpoofingDetection(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    const microGaze = useMicroGazeTracker(sessionId as string, user?._id || "");
    useSandboxEnvironmentCheck(sessionId as string, user?._id || "", isExamActive);

    // ── NEW: Tier 1 Features ──
    // Clipboard interception (smarter than the inline handler — detects large pastes with no prior typing)
    useClipboardInterception(sessionId as string, user?._id || "", isExamActive);
    // PrintScreen / screenshot detection
    usePrintScreenDetection(sessionId as string, user?._id || "", isExamActive);
    // LLM API traffic blocking via Service Worker
    useLLMTrafficDetection(sessionId as string, user?._id || "", isExamActive);
    // Room environment change (pHash background comparison)
    useRoomEnvironmentMonitor(videoRef, sessionId as string, user?._id || "", isExamActive);

    // ── NEW: Tier 2 Features ──
    // Advanced VAD (replaces Web Speech API — energy + ZCR + spectral analysis)
    const sileroVAD = useSileroVAD(sessionId as string, user?._id || "", isExamActive && isMicAvailable);
    // Speaker voice identity (spectral fingerprint, detects person swap)
    useSpeakerIdentity(sessionId as string, user?._id || "", isExamActive && isMicAvailable);

    // ── NEW: Tier 3 Features ──
    // Liveness detection (active blink challenge + passive micro-movement)
    const liveness = useLivenessDetection(sessionId as string, user?._id || "", isExamActive);
    // Behavioral consistency scoring (Isolation Forest meta-signal)
    const behavioralConsistency = useBehavioralConsistency(sessionId as string, user?._id || "", isExamActive);

    // ── NEW: Continuous attention score ──
    const attention = useAttentionScore();
    // ── NEW: Emotion / stress detection ──
    const emotion = useEmotionDetection(sessionId as string, user?._id || "", isExamActive);

    // Face identity verification — processLandmarks called inside FaceMesh callback below
    const faceIdentity = useFaceIdentityVerification(sessionId as string, user?._id || "", isExamActive);
    // Phone-below-monitor detection — processLandmarks called inside FaceMesh callback below
    const phoneBelowMonitor = usePhoneBelowMonitorDetection(sessionId as string, user?._id || "", isExamActive);

    // Feed behavioral consistency with frame-level signals from other detectors
    useEffect(() => {
        if (!isExamActive) return;
        behavioralConsistency.recordFrame(
            gazeDirection !== "CENTER",
            faceCount > 0,
            sileroVAD.isSpeechDetected
        );
    }, [gazeDirection, faceCount, sileroVAD.isSpeechDetected, isExamActive, behavioralConsistency]);

    // ── Attention score — update on every gaze/face/blink state change ──
    useEffect(() => {
        if (!isExamActive) return;
        attention.update({
            gazeOnScreen: gazeDirection === "CENTER",
            facePresent: faceCount > 0,
            blinkRateNormal: !blinkAnalysis.isAnomalous,
            headPoseStable: !headPose.isAnomalous,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gazeDirection, faceCount, isExamActive]);

    // Keep liveAiStateRef in sync — used by snapshot upload to piggyback AI state
    useEffect(() => {
        const recentAlerts = dbViolations
            .filter(v => Date.now() - new Date(v.timestamp).getTime() < 30_000)
            .map(v => v.type)
            .slice(-5);
        liveAiStateRef.current = {
            gazeDirection,
            faceCount,
            isSpeaking: sileroVAD.isSpeechDetected,
            isLookingAway: gazeDirection !== "CENTER",
            activeAlerts: recentAlerts,
            integrityScore: session?.integrityScore ?? 100,
        };
    }, [gazeDirection, faceCount, sileroVAD.isSpeechDetected, dbViolations, session]);

    // ── Gemini Live AI Monitoring (real-time WebSocket streaming) ──
    const { status: geminiStatus } = useGeminiLiveMonitoring({
        sessionId: sessionId as string,
        candidateId: user?._id || "",
        videoRef,
        isActive: isExamActive,
        frameIntervalMs: 3000,
        onViolation: (type, description, confidence) => {
            logViolation(type, description, undefined, confidence);
        },
    });

    // ── Gemini REST Fallback (activates when Live WebSocket is not connected) ──
    // Polls every 30s with exponential back-off. Ensures coverage even when
    // the Live session fails to connect (API quota, network issues, etc.)
    useGeminiMonitoring({
        sessionId: sessionId as string,
        candidateId: user?._id || "",
        videoRef,
        isActive: isExamActive && (geminiStatus === "disconnected" || geminiStatus === "error"),
        intervalMs: 30_000,
        onViolation: (type, description, confidence) => {
            logViolation(type, description, undefined, confidence);
        },
    });

    // ── WebRTC Live Video Interview (Candidate Side) ──
    // Candidate always starts with null localStream — camera is obtained only when they accept the call.
    const [candidateCallStream, setCandidateCallStream] = useState<MediaStream | null>(null);

    const {
        callStatus,
        remoteStream,
        acceptCall,
        endCall,
        sendTelemetry
    } = useWebRTC(
        sessionId as string,
        user?._id || "",
        null, // Target ID is unknown until the offer arrives — hook extracts senderId automatically
        candidateCallStream
    );

    // Accept a recruiter's call: acquire camera+mic, then complete the WebRTC handshake
    const handleAcceptCall = useCallback(async () => {
        let stream: MediaStream | null = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: { echoCancellation: true, noiseSuppression: true },
            });
        } catch {
            // Graceful degradation: audio-only if video is denied
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
            } catch {
                // Cannot get any media — accept anyway (recruiter gets no stream, call still connects)
            }
        }
        if (stream) setCandidateCallStream(stream);
        await acceptCall(stream ?? undefined);
    }, [acceptCall]);

    // Clean up candidate stream when call ends
    const handleEndCallCandidate = useCallback(() => {
        endCall();
        if (candidateCallStream) {
            candidateCallStream.getTracks().forEach(t => t.stop());
            setCandidateCallStream(null);
        }
    }, [endCall, candidateCallStream]);

    // AI Telemetry Pipe (Candidate -> Recruiter): send live gaze/face data over data channel
    useEffect(() => {
        if (callStatus === "connected") {
            sendTelemetry({
                gazeDirection,
                faceCount,
                timestamp: Date.now()
            });
        }
    }, [gazeDirection, faceCount, callStatus, sendTelemetry]);

    // Stop candidate stream if exam ends while call is active
    useEffect(() => {
        if (examEnded && candidateCallStream) {
            candidateCallStream.getTracks().forEach(t => t.stop());
            setCandidateCallStream(null);
        }
    }, [examEnded, candidateCallStream]);




    // ── Response time profiling + attention/emotion tracking: per-question ──
    useEffect(() => {
        if (!isExamActive || !quiz.currentQuestion?._id) return;
        responseTimeProfiling.recordQuestionStart(quiz.currentQuestion._id);
        // End previous question's attention window, then start the new one
        attention.endQuestion();
        attention.startQuestion(quiz.currentQuestion._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quiz.currentIndex, isExamActive]);

    // ── Periodic violation refetch (picks up violations logged by hooks) ──
    useEffect(() => {
        if (examEnded) return;
        const interval = setInterval(() => refetchViolations(), 15000);
        return () => clearInterval(interval);
    }, [examEnded, refetchViolations]);

    // ── WebSocket video relay publisher (10 fps → recruiter war room) ────────
    useEffect(() => {
        if (!isExamActive || !sessionId) return;

        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${proto}//${window.location.host}/ws/video?sessionId=${sessionId}&role=publisher`;
        let ws: WebSocket | null = null;
        let frameInterval: ReturnType<typeof setInterval> | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let destroyed = false;

        const captureFrame = () => {
            const video = videoRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            if (!video || video.readyState < 2) return;
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            const imageBase64 = dataUrl.split(",")[1];
            try {
                ws.send(JSON.stringify({ type: "FRAME", imageBase64, aiState: liveAiStateRef.current }));
            } catch { /* socket not ready */ }
        };

        const connect = () => {
            if (destroyed) return;
            ws = new WebSocket(wsUrl);
            ws.onopen = () => {
                frameInterval = setInterval(captureFrame, 50); // 20 fps
            };
            ws.onclose = () => {
                if (frameInterval) { clearInterval(frameInterval); frameInterval = null; }
                if (!destroyed) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };
            ws.onerror = () => ws?.close();
        };

        connect();

        return () => {
            destroyed = true;
            if (frameInterval) clearInterval(frameInterval);
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            ws?.close();
        };
    }, [isExamActive, sessionId]);

    // ── HTTP snapshot upload fallback for war room (every 15s) ───────────────
    useEffect(() => {
        if (!isExamActive || !sessionId) return;

        const uploadSnapshot = () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;
            const canvas = document.createElement("canvas");
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
            const imageBase64 = dataUrl.split(",")[1];
            fetch(`/api/session/${sessionId}/snapshot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64, aiState: liveAiStateRef.current }),
            }).catch(() => { /* silent — non-critical */ });
        };

        // Upload after 5s, then every 15s (fallback — WS is primary)
        const timeout = setTimeout(uploadSnapshot, 5000);
        const interval = setInterval(uploadSnapshot, 15000);
        return () => { clearTimeout(timeout); clearInterval(interval); };
    }, [isExamActive, sessionId]);

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
                    logViolation("NO_FACE", undefined, undefined, 0.9);
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
                    // Liveness blink challenge — pass EAR and landmarks
                    liveness.processLandmarks(landmarks, ear);

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
                    // NEW: Face identity verification (geometric baseline comparison)
                    faceIdentity.processLandmarks(landmarks);
                    // NEW: Phone-below-monitor detection (head pitch + iris Y)
                    phoneBelowMonitor.processLandmarks(landmarks);
                    // NEW: Emotion / stress detection
                    emotion.processLandmarks(landmarks);

                    // Cross-reference: voice recognized + lips not moving = someone dictating
                    // Use raw lipMovement (>0.008 = lips moving), NOT the derived isSuspicious flag,
                    // so the check works even when ambient noise is quiet.
                    voiceActivity.checkCrossReference(lipSync.lipMovement > 0.008);





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
    }, [logViolation, blinkAnalysis, emotion, faceIdentity, faceProximity, headPose, irisFocus, lipSync, liveness, microGaze, phoneBelowMonitor, voiceActivity]);

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

        // End the active question's attention window before submitting
        attention.endQuestion();

        // Merge per-question attention + emotion dominant into attentionData
        const attentionRecords = attention.getAllRecords().map((r) => ({
            ...r,
            dominantEmotion: emotion.emotion,
        }));

        await fetch(`/api/session/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: "completed",
                attentionData: attentionRecords,
            }),
        });

        router.push("/candidate/verify");
    }, [examEnded, sessionId, router, stopAutoFlush, flush, saveState, attention, emotion]);

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

            {/* Liveness blink challenge overlay */}
            {liveness.showBlinkPrompt && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none">
                    <div className="bg-[#111]/95 border border-primary/60 rounded-2xl px-10 py-7 text-center shadow-2xl animate-[fadeInScale_0.2s_ease-out]">
                        <p className="text-2xl font-bold text-white mb-2">Liveness Check</p>
                        <p className="text-slate-400 text-sm">Please <span className="text-primary font-semibold">blink once</span> to confirm you are present</p>
                        <div className="mt-4 flex justify-center">
                            <span className="text-4xl animate-pulse">👁️</span>
                        </div>
                    </div>
                </div>
            )}

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
                            <span className="text-xs text-[#666] ml-3">
                                {dbViolations.length > 0 ? `${dbViolations.length} violations` : "Clean"}
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
                        <div className="flex-1 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b] animate-pulse flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent flex rounded-full animate-spin"></div>
                        </div>
                    ) : quiz.questions.length === 0 ? (
                        <div className="flex-1 rounded-2xl bg-[#1a1a1a] border border-[#3b3b3b] flex flex-col items-center justify-center text-[#a1a1a1] gap-4">
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
                                    onAnswerChange={(updates) => {
                                        responseTimeProfiling.recordAnswer(quiz.currentQuestion._id);
                                        quiz.saveResponse(quiz.currentQuestion._id, updates);
                                    }}
                                    onToggleReview={() => quiz.toggleMarkForReview(quiz.currentQuestion._id)}
                                />
                            </div>

                            {/* Question Navigation Footer */}
                            <div className="h-16 mt-4 flex items-center justify-between px-6 bg-[#1a1a1a] border border-[#3b3b3b] rounded-2xl shrink-0">
                                <button
                                    onClick={quiz.goToPrev}
                                    disabled={quiz.currentIndex === 0}
                                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-[#262626] hover:bg-[#2e2e2e] border border-[#3b3b3b] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="text-sm font-mono text-[#a1a1a1]">
                                    {quiz.currentIndex + 1} / {quiz.questions.length}
                                </span>

                                {quiz.currentIndex === quiz.questions.length - 1 ? (
                                    <button
                                        onClick={() => {
                                            // Analyze final answer before submitting
                                            const q = quiz.currentQuestion;
                                            const resp = quiz.responses[q?._id];
                                            const answerText = resp?.submittedCode || "";
                                            if (answerText && answerText.length >= 30 && sessionId && user) {
                                                fetch("/api/ai/analyze-answer", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        sessionId,
                                                        candidateId: user._id,
                                                        questionText: q.text || "",
                                                        answerText,
                                                        timeSpentSeconds: responseTimeProfiling.avgResponseTime ?? 0,
                                                        questionIndex: quiz.currentIndex,
                                                    }),
                                                }).catch(() => {});
                                            }
                                            handleEndExam();
                                        }}
                                        className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-primary hover:bg-primary-light text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    >
                                        Submit Exam
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            // Analyze current answer for AI-generation before navigating away
                                            const q = quiz.currentQuestion;
                                            const resp = quiz.responses[q?._id];
                                            const answerText = resp?.submittedCode || "";
                                            if (answerText && answerText.length >= 30 && sessionId && user) {
                                                fetch("/api/ai/analyze-answer", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        sessionId,
                                                        candidateId: user._id,
                                                        questionText: q.text || "",
                                                        answerText,
                                                        timeSpentSeconds: responseTimeProfiling.avgResponseTime ?? 0,
                                                        questionIndex: quiz.currentIndex,
                                                    }),
                                                }).catch(() => {});
                                            }
                                            quiz.goToNext();
                                        }}
                                        className="px-6 py-2 rounded-xl text-sm font-semibold transition-colors bg-[#262626] hover:bg-[#2e2e2e] border border-[#3b3b3b]"
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
                    <div className="shrink-0 bg-[#0f0f0f] border border-[#3b3b3b] rounded-2xl overflow-hidden shadow-2xl relative">
                        <CameraFeed
                            onVideoRef={handleVideoRef}
                            gazeDirection={gazeDirection}
                            faceCount={faceCount}
                            isSuspicious={lipSync.isSuspicious}
                            className="w-full h-[255px]"
                        />

                        {/* Live AI Status Indicators */}
                        <div className="p-3 grid grid-cols-2 gap-2 border-t border-[#3b3b3b] bg-[#0f0f0f] relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#666] uppercase tracking-widest">Network</span>
                                <span className="text-xs font-mono mt-0.5 text-green-400">
                                    ONLINE
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#666] uppercase tracking-widest flex items-center justify-between">
                                    Sync
                                    {quiz.isSyncing && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                                </span>
                                <span className={`text-xs font-mono mt-0.5 ${quiz.isSyncing ? "text-blue-400" : "text-[#a1a1a1]"}`}>
                                    {quiz.isSyncing ? "Saving..." : "Up to date"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI Anomaly Mini-Feed */}
                    <div className="shrink-0 bg-[#1a1a1a] border border-[#3b3b3b] rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">AI Diagnostics</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="text-xs text-[#a1a1a1] flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span>Violations:</span>
                                <span className={dbViolations.length > 0 ? "text-red-400 font-mono" : "text-green-400 font-mono"}>{dbViolations.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Look Away:</span>
                                <span className={lookAwaySeconds > 0 ? "text-yellow-400 font-mono" : "text-green-400 font-mono"}>{lookAwaySeconds.toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between">
                                <span>AI Monitor:</span>
                                <span className={
                                    geminiStatus === "connected" ? "text-green-400 font-mono" :
                                    geminiStatus === "connecting" ? "text-yellow-400 font-mono animate-pulse" :
                                    "text-blue-400 font-mono"
                                }>
                                    {geminiStatus === "connected" ? "Live" :
                                     geminiStatus === "connecting" ? "Connecting..." :
                                     "REST Active"}
                                </span>
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

                    {/* WebRTC — recruiter video call (incoming ring + connected view) */}
                    {callStatus !== "idle" && (
                        <div className="shrink-0 mb-4">
                            <LiveVideoCall
                                remoteStream={remoteStream}
                                callStatus={callStatus}
                                isRecruiter={false}
                                onAccept={handleAcceptCall}
                                onDecline={handleEndCallCandidate}
                                onEndCall={handleEndCallCandidate}
                            />
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
