"use client";
import { useEffect, useState, useCallback, useRef } from "react";

interface VirtualDeviceState {
    isVirtualDeviceSuspected: boolean;
    suspiciousDevices: string[];
}

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const COOLDOWN_MS = 300000; // 5 minutes between violations (to avoid spamming, as this is static hardware)

// Known keywords often found in virtual camera/audio drivers
const VIRTUAL_KEYWORDS = [
    "obs",
    "manycam",
    "snap camera",
    "virtual",
    "epoccam",
    "iriun",
    "xsplit",
    "vcam",
    "ip wecam",
    "droidcam",
    "vb-audio",
    "voicemeeter",
    "cable output",
    "blackhole",
];

export function useVirtualDeviceDetection(
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const [state, setState] = useState<VirtualDeviceState>({
        isVirtualDeviceSuspected: false,
        suspiciousDevices: [],
    });

    const lastViolationTime = useRef<number>(0);

    const logViolation = useCallback(
        async (devices: string[]) => {
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
                        type: "VIRTUAL_DEVICE_DETECTED",
                        timestamp: new Date().toISOString(),
                        confidence: 0.95,
                        direction: devices.join(", ").substring(0, 100),
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

        const checkDevices = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    return;
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                const suspicious: string[] = [];

                for (const device of devices) {
                    // Labels are only fully populated if the user has granted media permissions
                    if (device.label) {
                        const lowerLabel = device.label.toLowerCase();
                        for (const keyword of VIRTUAL_KEYWORDS) {
                            if (lowerLabel.includes(keyword)) {
                                suspicious.push(device.label);
                                break;
                            }
                        }
                    }
                }

                if (suspicious.length > 0) {
                    setState({
                        isVirtualDeviceSuspected: true,
                        suspiciousDevices: suspicious,
                    });
                    logViolation(suspicious);
                } else {
                    setState({
                        isVirtualDeviceSuspected: false,
                        suspiciousDevices: [],
                    });
                }
            } catch (err) {
                console.warn("Error enumerating devices:", err);
            }
        };

        // Initial check
        checkDevices();

        // Periodic sweep
        const intervalId = setInterval(checkDevices, CHECK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [enabled, logViolation]);

    return state;
}
