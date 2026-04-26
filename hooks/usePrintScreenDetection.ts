"use client";
import { useEffect, useCallback, useRef } from "react";

const COOLDOWN_MS = 5000;

/**
 * Detects screenshot attempts via:
 * 1. PrintScreen key (keyCode 44 / key "PrintScreen")
 * 2. Windows Snipping Tool shortcuts (Win+Shift+S)
 * 3. macOS screenshot shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
 * 4. Ctrl+Shift+S (some browser screenshot extensions)
 * 5. Clipboard content-type surveillance — if clipboard gains image/png
 *    after a key event it almost certainly came from a screenshot tool.
 *
 * Note: Browsers cannot fully block OS-level screenshot tools, but we
 * CAN detect the attempt and log a violation.
 */
export function usePrintScreenDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (method: string) => {
            const now = Date.now();
            if (now - lastViolationTime.current < COOLDOWN_MS) return;
            lastViolationTime.current = now;

            try {
                await fetch("/api/violation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        candidateId,
                        type: "KEYBOARD_SHORTCUT",
                        direction: `SCREENSHOT:${method}`,
                        timestamp: new Date().toISOString(),
                        confidence: 0.92,
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

        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen (all platforms)
            if (e.key === "PrintScreen" || e.keyCode === 44) {
                e.preventDefault();
                logViolation("PrintScreen");
                return;
            }

            // macOS: Cmd+Shift+3/4/5 (full, selection, area screenshots)
            if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
                logViolation(`Cmd+Shift+${e.key}`);
                return;
            }

            // Windows Snipping Tool: Win key can't be captured, but Ctrl+Shift+S
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
                logViolation("Ctrl+Shift+S");
                return;
            }

            // Screen capture via browser extensions often use F12+Shift or Alt+PrintScreen
            if (e.altKey && (e.key === "PrintScreen" || e.keyCode === 44)) {
                e.preventDefault();
                logViolation("Alt+PrintScreen");
                return;
            }
        };

        // Clipboard image surveillance — poll clipboard items after focus returns
        // (OS screenshot tools write image/png to clipboard)
        const handleFocus = async () => {
            try {
                const items = await navigator.clipboard.read().catch(() => []);
                for (const item of items) {
                    if (item.types.some((t) => t.startsWith("image/"))) {
                        logViolation("CLIPBOARD_IMAGE_DETECTED");
                        break;
                    }
                }
            } catch {
                // Clipboard API not available or permission denied — ignore
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("focus", handleFocus);
        };
    }, [enabled, logViolation]);
}
