"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface SandboxState {
    isSandboxSuspected: boolean;
    rendererInfo: string;
}

const CONSTANTS = {
    COOLDOWN_MS: 300000, // Log once per 5 minutes
};

// Known software renderers indicating a VM or heavily restricted sandbox
const SOFTWARE_RENDERERS = [
    "llvmpipe",
    "softpipe",
    "software rasterizer",
    "swiftshader",
    "vmware",
    "virtualbox",
    "parallels",
];

export function useSandboxEnvironmentCheck(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<SandboxState>({
        isSandboxSuspected: false,
        rendererInfo: "checking",
    });

    const hasChecked = useRef<boolean>(false);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (info: string) => {
            const now = Date.now();
            if (now - lastViolationTime.current < CONSTANTS.COOLDOWN_MS) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "VM_OR_SANDBOX_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.90,
                        direction: info.substring(0, 100),
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled || hasChecked.current) return;

        // Run this check once per component mount, slightly delayed to not block main thread
        const timerId = setTimeout(() => {
            try {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;

                if (!gl) {
                    setState({ isSandboxSuspected: true, rendererInfo: "No WebGL" });
                    logViolation("WebGL Disabled/Unsupported");
                    hasChecked.current = true;
                    return;
                }

                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                let renderer = "unknown";
                let isVM = false;

                if (debugInfo) {
                    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    const lowerRenderer = renderer.toLowerCase();

                    for (const keyword of SOFTWARE_RENDERERS) {
                        if (lowerRenderer.includes(keyword)) {
                            isVM = true;
                            break;
                        }
                    }
                }

                setState({
                    isSandboxSuspected: isVM,
                    rendererInfo: renderer,
                });

                if (isVM) {
                    logViolation(renderer);
                }

                hasChecked.current = true;

            } catch (err) {
                console.warn("Error checking WebGL renderer:", err);
                hasChecked.current = true;
            }
        }, 3000);

        return () => clearTimeout(timerId);
    }, [enabled, logViolation]);

    return state;
}
