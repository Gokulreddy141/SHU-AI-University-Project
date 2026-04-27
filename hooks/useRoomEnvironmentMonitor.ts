"use client";
import { useEffect, useRef, useCallback } from "react";

const BASELINE_DELAY_MS = 8000;    // Wait 8s before capturing baseline (camera warmup)
const CHECK_INTERVAL_MS = 45000;   // Check every 45 seconds
const PHASH_SIZE = 8;              // 8×8 perceptual hash = 64 bits
// Raised from 18 → 24: natural lighting drift over a 60-90 min exam (sun moving,
// room lights adjusting) changes pHash by 18-22 bits. Only flag truly dramatic
// changes (person entering room, candidate moving location).
const HASH_DISTANCE_THRESHOLD = 24;
const COOLDOWN_MS = 120000;        // 2 minutes between violation reports

/**
 * Room Environment Change Detection
 *
 * Uses perceptual hashing (pHash) on the background region of the webcam
 * to detect when the candidate's physical environment changes significantly:
 * - Moved to a different room / location
 * - Someone stood behind them (new shadow/person in background)
 * - Lighting changed dramatically (switched on second monitor, opened blinds)
 *
 * Algorithm:
 * 1. Capture baseline frame after 8s (camera warmup complete)
 * 2. Every 45s, capture a new frame
 * 3. Compute 8×8 DCT-based perceptual hash of both frames
 * 4. If Hamming distance > threshold → ENVIRONMENT_CHANGE violation
 *
 * Uses only the top 40% of the frame (background zone), ignoring the
 * candidate's face/body region to reduce false positives from movement.
 */
export function useRoomEnvironmentMonitor(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    sessionId: string,
    candidateId: string,
    enabled: boolean
) {
    const baselineHash = useRef<number[] | null>(null);
    const lastViolationTime = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const getCanvas = useCallback(() => {
        if (!canvasRef.current) {
            const c = document.createElement("canvas");
            c.width = PHASH_SIZE * 4;  // 32px — only need low-res for pHash
            c.height = PHASH_SIZE * 4;
            canvasRef.current = c;
        }
        return canvasRef.current;
    }, []);

    /**
     * Computes an 8×8 perceptual hash from the top 40% of the video frame.
     * Returns an array of 64 bits (0 or 1).
     */
    const computeHash = useCallback((video: HTMLVideoElement): number[] | null => {
        if (video.readyState < 2 || video.videoWidth === 0) return null;

        const canvas = getCanvas();
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;

        // Crop: only top 40% of frame = background zone
        const srcY = 0;
        const srcH = video.videoHeight * 0.4;
        ctx.drawImage(video, 0, srcY, video.videoWidth, srcH, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Convert to 32×32 grayscale
        const grayscale: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
            grayscale.push(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
        }

        // Resize to 8×8 by averaging 4×4 blocks
        const small: number[] = [];
        const blockW = canvas.width / PHASH_SIZE;
        const blockH = canvas.height / PHASH_SIZE;
        for (let row = 0; row < PHASH_SIZE; row++) {
            for (let col = 0; col < PHASH_SIZE; col++) {
                let sum = 0, count = 0;
                for (let dy = 0; dy < blockH; dy++) {
                    for (let dx = 0; dx < blockW; dx++) {
                        const px = Math.floor(col * blockW + dx);
                        const py = Math.floor(row * blockH + dy);
                        if (px < canvas.width && py < canvas.height) {
                            sum += grayscale[py * canvas.width + px];
                            count++;
                        }
                    }
                }
                small.push(count > 0 ? sum / count : 0);
            }
        }

        // Mean threshold — bits above mean = 1
        const mean = small.reduce((a, b) => a + b, 0) / small.length;
        return small.map((v) => (v > mean ? 1 : 0));
    }, [getCanvas]);

    const hammingDistance = useCallback((a: number[], b: number[]): number => {
        return a.reduce((dist, bit, i) => dist + (bit !== b[i] ? 1 : 0), 0);
    }, []);

    const logViolation = useCallback(
        async (distance: number) => {
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
                        type: "ENVIRONMENT_CHANGE",
                        direction: `HASH_DIST:${distance}/${PHASH_SIZE * PHASH_SIZE}`,
                        timestamp: new Date().toISOString(),
                        confidence: Math.min(0.95, 0.5 + (distance - HASH_DISTANCE_THRESHOLD) / 20),
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

        // Capture baseline after warmup delay
        const baselineTimer = setTimeout(() => {
            const video = videoRef.current;
            if (!video) return;
            const hash = computeHash(video);
            if (hash) baselineHash.current = hash;
        }, BASELINE_DELAY_MS);

        // Periodic comparison
        const checkInterval = setInterval(() => {
            const video = videoRef.current;
            if (!video || !baselineHash.current) return;

            const currentHash = computeHash(video);
            if (!currentHash) return;

            const distance = hammingDistance(baselineHash.current, currentHash);
            if (distance > HASH_DISTANCE_THRESHOLD) {
                logViolation(distance);
                // Update baseline to new environment to avoid spamming
                baselineHash.current = currentHash;
            }
        }, CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(baselineTimer);
            clearInterval(checkInterval);
        };
    }, [enabled, videoRef, computeHash, hammingDistance, logViolation]);
}
