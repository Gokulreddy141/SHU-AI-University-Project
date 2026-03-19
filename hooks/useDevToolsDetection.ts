"use client";

import { useEffect, useRef } from "react";

export function useDevToolsDetection(onDetect: () => void, isExamActive: boolean) {
    const lastFired = useRef<number>(0);

    useEffect(() => {
        if (!isExamActive) return;

        const checkDevTools = () => {
            // Debounce: Only fire once every 60 seconds at most to prevent spam
            if (Date.now() - lastFired.current < 60000) return;

            // Heuristic 1: DevTools opened and docked (changes inner/outer dimensions significantly)
            // Account for devicePixelRatio to prevent false positives from browser page zoom
            const threshold = 160 * (window.devicePixelRatio || 1);

            const widthDiff = window.outerWidth - window.innerWidth > threshold;
            const heightDiff = window.outerHeight - window.innerHeight > threshold;

            if (widthDiff || heightDiff) {
                lastFired.current = Date.now();
                onDetect();
            }
        };

        window.addEventListener("resize", checkDevTools);

        // Initial check in case it's already open
        checkDevTools();

        return () => window.removeEventListener("resize", checkDevTools);
    }, [isExamActive, onDetect]);
}
