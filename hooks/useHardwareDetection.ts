"use client";

import { useEffect, useRef } from "react";

export function useHardwareDetection(onDetect: () => void, isExamActive: boolean) {
    const hasFired = useRef(false);

    useEffect(() => {
        if (!isExamActive || hasFired.current) return;

        const checkScreens = () => {
            // Check HTML5 Screen API for multi-monitor setup
            if ("isExtended" in window.screen) {
                const screen = window.screen as unknown as { isExtended: boolean };
                if (screen.isExtended && !hasFired.current) {
                    hasFired.current = true;
                    onDetect();
                }
            } else {
                // Heuristic fallback for browsers without isExtended API (e.g. Safari)
                // If screen width is absurdly wide (e.g., > 3000px on an standard non-ultrawide density)
                const isSuspiciouslyWide = window.screen.width > 3440;
                if (isSuspiciouslyWide && !hasFired.current) {
                    hasFired.current = true;
                    onDetect();
                }
            }
        };

        // Check immediately
        checkScreens();

        // Also check if screen changes (monitor plugged in during exam)
        if ("isExtended" in window.screen) {
            // Some browsers support change event on screen object
            ((window.screen as unknown) as EventTarget).addEventListener?.("change", checkScreens);
        }

        return () => {
            if ("isExtended" in window.screen) {
                ((window.screen as unknown) as EventTarget).removeEventListener?.("change", checkScreens);
            }
        };
    }, [isExamActive, onDetect]);
}
