"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface FingerprintState {
    fingerprintHash: string;
    hasChanged: boolean;
}

const CHECK_INTERVAL_MS = 60000; // Check every 60 seconds

// Simple string hashing function (djb2)
function cyrb53(str: string, seed = 0): string {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function generateFingerprint(): string {
    if (typeof window === "undefined") return "server";

    try {
        // 1. Canvas Fingerprint
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        let canvasHash = "no_canvas";
        if (ctx) {
            // Draw specific geometry and text to capture rendering differences
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("Interview Integrity Fingerprint", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("Interview Integrity Fingerprint", 4, 17);
            canvasHash = cyrb53(canvas.toDataURL());
        }

        // 2. WebGL Fingerprint (Renderer String)
        let webglRenderer = "no_webgl";
        try {
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext;
            if (gl) {
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                if (debugInfo) {
                    webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch {
            // WebGL blocked or unavailable
        }

        // Combine hashes
        return cyrb53(`${canvasHash}|${webglRenderer}`);
    } catch {
        return "error_generating_fingerprint";
    }
}

/**
 * Periodically checks if the browser fingerprint has changed,
 * indicating the candidate may have switched devices or given
 * their session to a proxy test-taker.
 */
export function useBrowserFingerprint(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<FingerprintState>({
        fingerprintHash: "pending",
        hasChanged: false,
    });

    const baselineHash = useRef<string | null>(null);
    const violationLogged = useRef<boolean>(false);

    const logViolation = useCallback(
        async (oldHash: string, newHash: string) => {
            if (violationLogged.current) return;
            violationLogged.current = true;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "ENVIRONMENT_CHANGE",
                        timestamp: new Date().toISOString(),
                        confidence: 0.95, // High confidence for fingerprint change
                        direction: `OLD:${oldHash.slice(0, 8)} NEW:${newHash.slice(0, 8)}`,
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        // Establish baseline on mount
        const initialHash = generateFingerprint();
        baselineHash.current = initialHash;
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
            setState({ fingerprintHash: initialHash, hasChanged: false });
        }, 0);

        const interval = setInterval(() => {
            const currentHash = generateFingerprint();

            if (baselineHash.current && currentHash !== baselineHash.current) {
                setState({ fingerprintHash: currentHash, hasChanged: true });
                logViolation(baselineHash.current, currentHash);
            }
        }, CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [enabled, logViolation]);

    return state;
}
