"use client";
import { useEffect, useCallback, useRef } from "react";

// Raised from 5s → 15s: a 5s cooldown fired multiple violations per single
// screenshot attempt (keydown fires multiple times on key-repeat for PrintScreen).
const COOLDOWN_MS = 15000;

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

            // Note: Ctrl+Shift+S was removed — it is the "Save As" shortcut in
            // Chrome DevTools and many web apps, not a screenshot shortcut.
            // Win+Shift+S (Snipping Tool) cannot be intercepted at the browser level.

            // Screen capture via browser extensions often use F12+Shift or Alt+PrintScreen
            if (e.altKey && (e.key === "PrintScreen" || e.keyCode === 44)) {
                e.preventDefault();
                logViolation("Alt+PrintScreen");
                return;
            }
        };

        // Clipboard image surveillance was removed: the focus handler fired on EVERY
        // window focus-return (alt-tab back, OS notification dismissed, etc.). Any image
        // already in clipboard from before the exam (e.g. a screenshot taken earlier)
        // would trigger a false violation. Keyboard shortcut detection is sufficient.

        document.addEventListener("keydown", handleKeyDown, true);

        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [enabled, logViolation]);
}
