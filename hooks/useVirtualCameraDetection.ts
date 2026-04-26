"use client";

import { useEffect, useRef } from "react";

const VIRTUAL_CAMERA_KEYWORDS = ["obs", "virtual", "snap", "manycam", "epoccam", "xsplit"];

export function useVirtualCameraDetection(onDetect: () => void, isExamActive: boolean) {
    const hasFired = useRef(false);

    useEffect(() => {
        if (!isExamActive || hasFired.current) return;

        const checkDevices = async () => {
            try {
                // Must ensure permissions are granted before enumerateDevices returns labels
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((device) => device.kind === "videoinput");

                for (const device of videoInputs) {
                    const label = device.label.toLowerCase();
                    const isVirtual = VIRTUAL_CAMERA_KEYWORDS.some((keyword) => label.includes(keyword));

                    if (isVirtual && !hasFired.current) {
                        hasFired.current = true;
                        onDetect();
                        break;
                    }
                }
            } catch (error) {
                console.error("Failed to enumerate devices for virtual camera check", error);
            }
        };

        // Delay slightly to give browsers time to update device labels after getUserMedia
        const timer = setTimeout(checkDevices, 2000);
        return () => clearTimeout(timer);
    }, [isExamActive, onDetect]);
}
