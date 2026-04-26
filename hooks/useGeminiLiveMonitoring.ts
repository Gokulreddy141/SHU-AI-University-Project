"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface GeminiLiveOptions {
    sessionId: string;
    candidateId: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isActive: boolean;
    frameIntervalMs?: number; // How often to send frames (default 5000ms = 5 seconds)
    onViolation?: (type: string, description: string, confidence: number) => void;
}

export function useGeminiLiveMonitoring({
    sessionId,
    candidateId,
    videoRef,
    isActive,
    // Raised from 3000ms → 5000ms: 3s was sending 20 frames/min to the Live API,
    // rapidly consuming quota. 5s halves the cost with negligible detection latency loss.
    frameIntervalMs = 5000,
    onViolation,
}: GeminiLiveOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
    // Stable ref for the callback — prevents connect() from changing identity every render
    const onViolationRef = useRef(onViolation);
    useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return null;

        const canvas = document.createElement("canvas");
        canvas.width = 320; // Smaller size for Live API to reduce bandwidth
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        return dataUrl.split(",")[1];
    }, [videoRef]);

    const sendFrame = useCallback(() => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const imageBase64 = captureFrame();
        if (!imageBase64) return;

        ws.send(JSON.stringify({ type: "FRAME", imageBase64 }));
    }, [captureFrame]);

    /**
     * Starts a Web Audio pipeline that captures microphone audio, resamples
     * to 16 kHz mono PCM, and sends 250 ms chunks to the Gemini Live WS.
     * Gemini's audio input format: audio/pcm;rate=16000, 16-bit signed LE.
     */
    const startAudioStream = useCallback((ws: WebSocket) => {
        navigator.mediaDevices
            .getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true }, video: false })
            .then((stream) => {
                audioStreamRef.current = stream;

                const ctx = new AudioContext({ sampleRate: 16000 });
                audioContextRef.current = ctx;

                const source = ctx.createMediaStreamSource(stream);
                // ScriptProcessorNode is deprecated but AudioWorklet requires an extra
                // worker file — ScriptProcessorNode works in all browsers and is fine here.
                const processor = ctx.createScriptProcessor(4096, 1, 1);

                processor.onaudioprocess = (e) => {
                    if (!ws || ws.readyState !== WebSocket.OPEN) return;
                    const float32 = e.inputBuffer.getChannelData(0);
                    // Convert Float32 [-1,1] → Int16 PCM
                    const int16 = new Int16Array(float32.length);
                    for (let i = 0; i < float32.length; i++) {
                        int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32767)));
                    }
                    // Base64 encode raw bytes
                    const bytes = new Uint8Array(int16.buffer);
                    let binary = "";
                    bytes.forEach((b) => { binary += String.fromCharCode(b); });
                    const audioBase64 = btoa(binary);
                    ws.send(JSON.stringify({ type: "AUDIO", audioBase64 }));
                };

                source.connect(processor);
                processor.connect(ctx.destination);
            })
            .catch(() => {
                // Mic not available — video-only mode
            });
    }, []);

    const stopAudioStream = useCallback(() => {
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        audioContextRef.current?.close().catch(() => {});
        audioContextRef.current = null;
    }, []);

    const connect = useCallback(() => {
        if (!candidateId || !sessionId || !isActive) return;

        setStatus("connecting");

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/monitor?candidateId=${candidateId}&sessionId=${sessionId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[Gemini Live] WebSocket connected");
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === "CONNECTED") {
                    setStatus("connected");
                    console.log(`[Gemini Live] Session active — model: ${msg.model}`);

                    // Start sending video frames
                    frameIntervalRef.current = setInterval(sendFrame, frameIntervalMs);
                    // Start streaming audio PCM
                    startAudioStream(ws);
                }

                if (msg.type === "VIOLATION" && onViolationRef.current) {
                    onViolationRef.current(msg.violationType || msg.type, msg.description || "", msg.confidence || 0.8);
                }

                if (msg.type === "ERROR") {
                    console.error("[Gemini Live] Server error:", msg.message);
                    setStatus("error");
                }
            } catch {
                // Ignore
            }
        };

        ws.onerror = () => {
            console.error("[Gemini Live] WebSocket error");
            setStatus("error");
        };

        ws.onclose = () => {
            setStatus("disconnected");
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
            stopAudioStream();
        };
    // onViolation is intentionally omitted — it's accessed via onViolationRef to prevent
    // the connection from being torn down and re-established on every parent render.
    }, [candidateId, sessionId, isActive, sendFrame, frameIntervalMs, startAudioStream, stopAudioStream]);

    useEffect(() => {
        if (!isActive) return;

        // Delay connection slightly to let camera warm up
        const timeout = setTimeout(connect, 5000);

        return () => {
            clearTimeout(timeout);
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isActive, connect]);

    return { status };
}
