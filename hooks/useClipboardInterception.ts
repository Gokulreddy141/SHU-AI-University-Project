"use client";
import { useEffect, useRef, useCallback } from "react";

// Raised from 10s → 30s: a fast Ctrl+Z then re-paste within 10s could double-fire.
const COOLDOWN_MS = 30000;
// Raised from 80 → 150: 80 chars catches short code snippets and sentences the
// candidate may legitimately paste (e.g. their own previously typed notes, a
// formula from earlier in the exam). 150 chars still catches AI-generated paragraphs.
const LARGE_PASTE_THRESHOLD = 150; // chars — AI-generated answers tend to be long

/**
 * Detects suspicious paste behaviour:
 * 1. Large text pasted with no preceding keystrokes in the last 3 seconds
 *    → strong signal: candidate copied AI-generated text externally then pasted
 * 2. Any paste while modifier key blocker is active (belt-and-suspenders)
 *
 * Uses the native `paste` event which fires even when Ctrl+V is the trigger.
 * Works independently of the keydown handler so there is no double-reporting.
 */
export function useClipboardInterception(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const lastKeystrokeTime = useRef<number>(0);
    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (preview: string, confidence: number) => {
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
                        type: "CLIPBOARD_PASTE",
                        direction: preview,
                        timestamp: new Date().toISOString(),
                        confidence,
                    }),
                });
            } catch {
                // Silently fail — non-critical
            }
        },
        [sessionId, candidateId]
    );

    useEffect(() => {
        if (!enabled) return;

        // Track recent typing so we can distinguish "typed fast then pasted"
        // from "opened page, pasted immediately"
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't count paste shortcuts themselves as typing
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") return;
            if (e.key.length === 1) {
                lastKeystrokeTime.current = Date.now();
            }
        };

        const handlePaste = async (e: ClipboardEvent) => {
            // Always cancel the paste so nothing leaks into the answer box
            e.preventDefault();

            let text = "";
            try {
                // `e.clipboardData` is synchronous and works even if clipboard API is blocked
                text = e.clipboardData?.getData("text/plain") ?? "";
                if (!text) {
                    text = await navigator.clipboard.readText().catch(() => "");
                }
            } catch {
                text = "";
            }

            const len = text.length;
            if (len === 0) return;

            // Determine confidence based on:
            //   - size of pasted content (larger = more suspicious)
            //   - time since last genuine keystroke (longer gap = more suspicious)
            const timeSinceLastKeystroke = Date.now() - lastKeystrokeTime.current;
            // Raised from 3s → 8s: a candidate can stop typing for 3s while reading the
            // question or thinking before pasting their own notes — 8s is a more reliable
            // signal that no typing preceded the paste at all.
            const noRecentTyping = lastKeystrokeTime.current === 0 || timeSinceLastKeystroke > 8000;
            const isLarge = len >= LARGE_PASTE_THRESHOLD;

            let confidence = 0.6;
            if (isLarge && noRecentTyping) confidence = 0.95;
            else if (isLarge) confidence = 0.80;
            else if (noRecentTyping) confidence = 0.70;

            const preview = `LEN:${len} ${text.slice(0, 80).replace(/\n/g, " ")}`;
            await logViolation(preview, confidence);
        };

        document.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("paste", handlePaste, true);

        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
            document.removeEventListener("paste", handlePaste, true);
        };
    }, [enabled, logViolation]);
}
