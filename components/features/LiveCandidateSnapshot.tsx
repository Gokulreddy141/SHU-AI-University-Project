"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface LiveCandidateSnapshotProps {
    sessionId: string;
    isLive: boolean;
}

interface AiState {
    gazeDirection: string;
    faceCount: number;
    isSpeaking: boolean;
    isLookingAway: boolean;
    activeAlerts: string[];
    integrityScore: number;
    _updatedAt?: string;
}

const GAZE_ARROW: Record<string, string> = {
    LEFT:       "← LEFT",
    RIGHT:      "→ RIGHT",
    UP:         "↑ UP",
    DOWN:       "↓ DOWN",
    CENTER:     "● CENTER",
    UP_LEFT:    "↖ UP-LEFT",
    UP_RIGHT:   "↗ UP-RIGHT",
    DOWN_LEFT:  "↙ DN-LEFT",
    DOWN_RIGHT: "↘ DN-RIGHT",
};

function scoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
}

/** Convert base64 string to Blob without going through a data URL fetch */
function base64ToBlob(b64: string): Blob {
    const bytes = atob(b64);
    const u8 = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) u8[i] = bytes.charCodeAt(i);
    return new Blob([u8], { type: "image/jpeg" });
}

export default function LiveCandidateSnapshot({ sessionId, isLive }: LiveCandidateSnapshotProps) {
    // ── Display state ─────────────────────────────────────────────────────────
    const [hasVideo, setHasVideo] = useState(false);       // first frame received
    const [capturedAt, setCapturedAt] = useState<Date | null>(null);
    const [age, setAge] = useState<number>(0);
    const [aiState, setAiState] = useState<AiState | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [isWsLive, setIsWsLive] = useState(false);
    // HTTP fallback fade opacity (only used when WS is not active)
    const [fallbackBase64, setFallbackBase64] = useState<string | null>(null);
    const [fallbackOpacity, setFallbackOpacity] = useState(1);

    // ── Canvas / RAF refs ─────────────────────────────────────────────────────
    const canvasRef   = useRef<HTMLCanvasElement>(null); // normal card view
    const fsCanvasRef = useRef<HTMLCanvasElement>(null); // fullscreen view
    const bitmapRef   = useRef<ImageBitmap | null>(null); // latest decoded frame
    const rafRef      = useRef<number | null>(null);
    const ageRef      = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── RAF render loop ───────────────────────────────────────────────────────
    // Runs at the display refresh rate (~60fps). Draws the latest decoded
    // bitmap to whichever canvas is currently mounted. Because drawImage is
    // GPU-accelerated and idempotent, re-drawing the same bitmap each tick
    // is free — the visual only changes when bitmapRef is updated.
    useEffect(() => {
        const paint = () => {
            const bitmap = bitmapRef.current;
            if (bitmap) {
                // One of the two canvas refs is mounted at any given time
                const canvas = canvasRef.current ?? fsCanvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext("2d");
                    if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                }
            }
            rafRef.current = requestAnimationFrame(paint);
        };
        rafRef.current = requestAnimationFrame(paint);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    // ── Decode and queue a new video frame (off main thread) ─────────────────
    const onWsFrame = useCallback(async (imageBase64: string, newAiState?: AiState | null) => {
        try {
            const bitmap = await createImageBitmap(base64ToBlob(imageBase64));
            // Discard the previous undisplayed bitmap to avoid memory leak
            bitmapRef.current?.close();
            bitmapRef.current = bitmap;
            setHasVideo(true);
            setCapturedAt(new Date());
            setAge(0);
            if (newAiState) setAiState(newAiState);
        } catch { /* ignore decode errors */ }
    }, []);

    // ── WebSocket viewer — primary path ──────────────────────────────────────
    useEffect(() => {
        if (!sessionId || !isLive) return;

        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${proto}//${window.location.host}/ws/video?sessionId=${sessionId}&role=viewer`;
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let destroyed = false;

        const connect = () => {
            if (destroyed) return;
            ws = new WebSocket(wsUrl);

            ws.onopen = () => setIsWsLive(true);

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data as string);
                    if (msg.type === "PUBLISHER_OFFLINE") {
                        setIsWsLive(false);
                        return;
                    }
                    if (msg.type === "FRAME" && msg.imageBase64) {
                        setIsWsLive(true);
                        // Non-blocking: createImageBitmap runs off the main thread
                        onWsFrame(msg.imageBase64, msg.aiState ?? null);
                    }
                } catch { /* ignore bad frames */ }
            };

            ws.onclose = () => {
                setIsWsLive(false);
                if (!destroyed) reconnectTimeout = setTimeout(connect, 4000);
            };

            ws.onerror = () => ws?.close();
        };

        connect();

        return () => {
            destroyed = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            ws?.close();
        };
    }, [sessionId, isLive, onWsFrame]);

    // ── HTTP snapshot poll — fallback when WS has no publisher yet ────────────
    useEffect(() => {
        if (!sessionId || isWsLive) return;

        const fetchSnapshot = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}/snapshot`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.imageBase64) {
                    // Soft fade for infrequent snapshot updates
                    setFallbackOpacity(0);
                    setTimeout(() => {
                        setFallbackBase64(data.imageBase64);
                        setCapturedAt(data.capturedAt ? new Date(data.capturedAt) : new Date());
                        setAge(0);
                        if (data.aiState) setAiState(data.aiState);
                        setHasVideo(true);
                        setFallbackOpacity(1);
                    }, 150);
                }
            } catch { /* silent */ }
        };

        fetchSnapshot();
        pollRef.current = setInterval(fetchSnapshot, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [sessionId, isWsLive]);

    // ── Age counter ──────────────────────────────────────────────────────────
    useEffect(() => {
        ageRef.current = setInterval(() => {
            setCapturedAt(prev => {
                if (prev) setAge(Math.round((Date.now() - prev.getTime()) / 1000));
                return prev;
            });
        }, 1000);
        return () => { if (ageRef.current) clearInterval(ageRef.current); };
    }, []);

    // Close fullscreen on Escape
    useEffect(() => {
        if (!fullscreen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [fullscreen]);

    // Derived display values
    const isStale      = age > 30;
    const gazeLabel    = aiState ? (GAZE_ARROW[aiState.gazeDirection] ?? aiState.gazeDirection) : null;
    const isLookingAway = aiState?.isLookingAway ?? false;
    const faceCount    = aiState?.faceCount ?? 1;
    const isSpeaking   = aiState?.isSpeaking ?? false;
    const integrityScore = aiState?.integrityScore ?? 100;
    const activeAlerts = aiState?.activeAlerts ?? [];

    // ── AI overlays (rendered on top of canvas or fallback img) ──────────────
    const overlays = hasVideo ? (
        <>
            {isLive && (
                <div className="absolute top-2 left-2">
                    <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                        ● LIVE
                    </span>
                </div>
            )}

            {gazeLabel && (
                <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isLookingAway ? "bg-red-600/90 text-white" : "bg-black/60 text-green-400"
                    }`}>
                        {gazeLabel}
                    </span>
                </div>
            )}

            {aiState && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                        faceCount === 0 ? "bg-red-700/90 text-white"
                        : faceCount > 1 ? "bg-orange-600/90 text-white"
                        : "bg-black/60 text-slate-300"
                    }`}>
                        <span className="material-symbols-outlined text-[11px] align-middle">
                            {faceCount === 0 ? "person_off" : faceCount > 1 ? "group" : "person"}
                        </span>
                        {faceCount === 0 ? " No face" : faceCount === 1 ? " 1 face" : ` ${faceCount} faces`}
                    </span>
                    {isSpeaking && (
                        <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono animate-pulse">
                            🎤 speaking
                        </span>
                    )}
                </div>
            )}

            {activeAlerts.length > 0 && (
                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 max-w-[55%]">
                    {activeAlerts.slice(-3).map((alert, i) => (
                        <span key={i} className="bg-red-900/90 text-red-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded truncate max-w-full">
                            ⚠ {alert.replace(/_/g, " ")}
                        </span>
                    ))}
                </div>
            )}

            {isStale && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <span className="text-amber-400 text-xs font-bold">⚠ Feed stale — {age}s old</span>
                </div>
            )}
        </>
    ) : null;

    // ── Video area (shared between normal + fullscreen, parametrised by ref) ──
    const VideoArea = ({ ref: cRef, className, style }: { ref: React.RefObject<HTMLCanvasElement | null>; className: string; style?: React.CSSProperties }) => (
        <div className={`relative bg-black ${className}`} style={style}>
            {hasVideo ? (
                isWsLive ? (
                    // Canvas: RAF paints decoded bitmaps at display refresh rate
                    <canvas
                        ref={cRef}
                        width={320}
                        height={240}
                        className="w-full h-full"
                        style={{ imageRendering: "auto" }}
                    />
                ) : (
                    // HTTP fallback: fade between snapshots
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`data:image/jpeg;base64,${fallbackBase64}`}
                        alt="Candidate snapshot"
                        className="w-full h-full object-cover"
                        style={{ opacity: fallbackOpacity, transition: "opacity 0.15s ease" }}
                    />
                )
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                    <span className="material-symbols-outlined text-5xl mb-2">videocam_off</span>
                    <p className="text-xs">{isLive ? "Waiting for live feed…" : "No camera feed recorded"}</p>
                    {isLive && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 border border-slate-700 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] text-slate-700 font-mono">Connecting via WebSocket…</p>
                        </div>
                    )}
                </div>
            )}
            {overlays}
        </div>
    );

    // ── Fullscreen modal ──────────────────────────────────────────────────────
    if (fullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                            {isWsLive ? "Live Video — Fullscreen" : "Live Camera — Fullscreen"}
                        </span>
                        {isWsLive && (
                            <span className="text-[9px] font-mono text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">~20 fps</span>
                        )}
                        {aiState && (
                            <span className={`text-xs font-bold font-mono ml-4 ${scoreColor(integrityScore)}`}>
                                Integrity {integrityScore}
                            </span>
                        )}
                        {capturedAt && (
                            <span className={`text-[10px] font-mono ${isStale ? "text-amber-400" : "text-slate-500"}`}>
                                {age > 0 ? `${age}s ago` : "just now"}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setFullscreen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-[#3b3b3b] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">fullscreen_exit</span>
                        Exit Fullscreen
                    </button>
                </div>

                {VideoArea({ ref: fsCanvasRef, className: "flex-1 flex items-center justify-center overflow-hidden" })}
            </div>
        );
    }

    // ── Normal card view ─────────────────────────────────────────────────────
    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#0f0f0f] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#3b3b3b]">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-white">
                        {isWsLive ? "Live Video" : "Live Camera"}
                    </span>
                    {isWsLive && (
                        <span className="text-[9px] font-mono text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">~20 fps</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {aiState && (
                        <span className={`text-[10px] font-mono font-bold ${scoreColor(integrityScore)}`}>
                            Score {integrityScore}
                        </span>
                    )}
                    {capturedAt && !isWsLive && (
                        <span className={`text-[10px] font-mono ${isStale ? "text-amber-400" : "text-slate-500"}`}>
                            {age > 0 ? `${age}s ago` : "just now"}
                        </span>
                    )}
                    <button
                        onClick={() => setFullscreen(true)}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                        title="Fullscreen"
                    >
                        <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                    </button>
                </div>
            </div>

            {VideoArea({ ref: canvasRef, className: "", style: { aspectRatio: "4/3" } as React.CSSProperties })}

            {capturedAt && (
                <div className="px-4 py-2 text-[10px] font-mono text-slate-600 text-center border-t border-[#3b3b3b]">
                    {isWsLive
                        ? "⚡ Live · ~20 fps via WebSocket"
                        : `Last frame: ${capturedAt.toLocaleTimeString()} · snapshot fallback`}
                </div>
            )}
        </div>
    );
}
