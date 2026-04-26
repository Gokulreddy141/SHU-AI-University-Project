"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface ExtensionDetectionState {
    extensionsFound: string[];
    isDetected: boolean;     // True if AI-specific extensions found (ChatGPT, answer bots)
    grammarlyPresent: boolean; // Info only — not a violation
}

// Known AI/coding assistant extension selectors (trigger violations)
const AI_EXTENSION_SELECTORS: { name: string; selector: string }[] = [
    // ChatGPT family
    { name: "ChatGPT Sidebar", selector: "#chatgpt-sidebar, [data-chatgpt-sidebar]" },
    { name: "ChatGPT Writer", selector: "[data-chatgpt-writer]" },
    // AI coding assistants
    { name: "Merlin AI", selector: "[data-merlin-extension]" },
    { name: "Monica AI", selector: "[data-monica-extension]" },
    { name: "Codeium", selector: "[data-codeium], #codeium-root" },
    { name: "Blackbox AI", selector: "[data-blackbox], #blackbox-ai" },
    { name: "Tabnine", selector: "[data-tabnine]" },
    // Generic AI/coding assist patterns (catches unknown extensions too)
    { name: "AI Assistant", selector: "[data-ai-answer], [data-ai-assist], [data-ai-helper]" },
    { name: "Code Assistant", selector: "[data-code-assist], [data-code-helper], [data-copilot]" },
];

// Keywords to scan for in injected element IDs, classes, and data attributes
// This catches extensions that don't match the known selectors above
const SUSPICIOUS_KEYWORDS = [
    "chatgpt", "openai", "copilot", "codeium", "tabnine", "blackbox",
    "ai-assist", "ai-helper", "ai-answer", "code-assist", "code-helper",
    "merlin", "monica", "bard", "gemini-ext", "claude-ext", "phind",
    "cursor-ext", "sourcegraph", "kite-", "intellicode",
];

// Informational only (not a violation — too many false positives)
const INFO_SELECTORS: { name: string; selector: string }[] = [
    { name: "Grammarly", selector: "[data-grammarly-shadow-root], grammarly-desktop-integration" },
];

const SCAN_INTERVAL_MS = 30000; // Re-scan every 30 seconds
const COOLDOWN_MS = 60000;      // 60 seconds between violations

/**
 * Detects browser extensions that could be used for cheating.
 * 
 * - AI extensions (ChatGPT sidebar, answer bots) → EXTENSION_DETECTED violation
 * - Grammarly → Info only (shown in UI but NOT a violation)
 * - Uses MutationObserver to catch extensions injected after page load
 */
export function useExtensionDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<ExtensionDetectionState>({
        extensionsFound: [],
        isDetected: false,
        grammarlyPresent: false,
    });

    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (extensions: string[]) => {
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
                        type: "EXTENSION_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.9,
                        direction: extensions.join(", "),
                    }),
                });
            } catch {
                // Silently fail
            }
        },
        [sessionId, candidateId]
    );

    const scanForExtensions = useCallback(() => {
        if (typeof document === "undefined") return;

        const foundAI: string[] = [];
        let grammarlyFound = false;

        // 1. Check known AI extension selectors
        for (const ext of AI_EXTENSION_SELECTORS) {
            try {
                if (document.querySelector(ext.selector)) {
                    foundAI.push(ext.name);
                }
            } catch {
                // Invalid selector — skip
            }
        }

        // 2. Check for chrome-extension:// URLs in head (injected scripts/styles)
        const headElements = document.head.querySelectorAll("link, script, style");
        headElements.forEach((el) => {
            const src = el.getAttribute("src") || el.getAttribute("href") || "";
            if (src.startsWith("chrome-extension://") || src.startsWith("moz-extension://")) {
                if (!foundAI.includes("Unknown Extension")) {
                    foundAI.push("Unknown Extension");
                }
            }
        });

        // 3. Broad keyword scan — catches ANY coding/AI assistant, even unknown ones
        // Scans injected elements for suspicious IDs, classes, and data attributes
        const injectedElements = document.body.querySelectorAll(
            "div[id], div[class], iframe[src], [data-extension-id]"
        );
        injectedElements.forEach((el) => {
            const id = (el.getAttribute("id") || "").toLowerCase();
            const cls = (el.getAttribute("class") || "").toLowerCase();
            const src = (el.getAttribute("src") || "").toLowerCase();

            // Check element attributes against suspicious keywords
            for (const keyword of SUSPICIOUS_KEYWORDS) {
                if (id.includes(keyword) || cls.includes(keyword) || src.includes(keyword)) {
                    const name = `AI Tool (${keyword})`;
                    if (!foundAI.includes(name)) {
                        foundAI.push(name);
                    }
                    break; // One match per element is enough
                }
            }

            // Check for extension iframes (common injection pattern)
            if (el.tagName === "IFRAME" && (src.includes("chrome-extension://") || src.includes("moz-extension://"))) {
                if (!foundAI.includes("Extension iframe")) {
                    foundAI.push("Extension iframe");
                }
            }
        });

        // 4. Check Grammarly (info only — not a violation)
        for (const ext of INFO_SELECTORS) {
            try {
                if (document.querySelector(ext.selector)) {
                    grammarlyFound = true;
                }
            } catch {
                // Invalid selector — skip
            }
        }

        const hasAIExtensions = foundAI.length > 0;

        setState({
            extensionsFound: foundAI,
            isDetected: hasAIExtensions,
            grammarlyPresent: grammarlyFound,
        });

        if (hasAIExtensions) {
            logViolation(foundAI);
        }
    }, [logViolation]);

    useEffect(() => {
        if (!enabled || typeof document === "undefined") return;

        // Initial scan (delayed to give extensions time to inject)
        const initialTimer = setTimeout(scanForExtensions, 2000);

        // Periodic re-scan
        const interval = setInterval(scanForExtensions, SCAN_INTERVAL_MS);

        // MutationObserver for late-injected extensions (debounced to avoid scan storms)
        let debounceTimer: ReturnType<typeof setTimeout>;
        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(scanForExtensions, 500);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
            clearTimeout(debounceTimer);
            observer.disconnect();
        };
    }, [enabled, scanForExtensions]);

    return state;
}
