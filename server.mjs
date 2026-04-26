import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LIVE_MODEL = "gemini-2.0-flash-live-001";

// Track active Gemini Live sessions per candidate
const sessions = new Map();

async function startGeminiSession(candidateId, onViolation) {
    if (!GEMINI_API_KEY) return null;

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const session = await ai.live.connect({
            model: LIVE_MODEL,
            config: {
                responseModalities: ["TEXT"],
                systemInstruction: {
                    parts: [{
                        text: `You are an expert AI exam integrity monitor analyzing a LIVE webcam feed and microphone audio from a proctored online exam.
Your vision and audio analysis must catch sophisticated cheating that simple algorithms cannot detect.

Analyze EVERY frame and audio segment for the following violations:

━━━ STANDARD VIOLATIONS ━━━
- MULTIPLE_FACES: more than one face visible in frame
- NO_FACE: no face detected (candidate absent, camera covered, or moved away)
- LOOKING_AWAY: candidate clearly looking away from the screen for 5+ seconds
- PHONE_DETECTED: mobile phone or tablet visible anywhere in frame
- NOTES_DETECTED: physical papers, notes, books, printed materials, sticky notes visible
- SECOND_PERSON: another person visible or partially visible (arm, shadow, reflection)

━━━ AUDIO VIOLATIONS ━━━
- VOICE_ACTIVITY_ANOMALY: a second distinct voice heard, or someone whispering answers nearby
- AMBIENT_NOISE: suspicious audio — keyboard from another device, TV/radio reciting answers, phone call audio leaking
- LIP_SYNC_MISMATCH: clear voice in audio but candidate's lips are NOT moving (pre-recorded playback or lip sync fraud)

━━━ ADVANCED VIOLATIONS — USE YOUR VISION CAREFULLY ━━━

EARPIECE_DETECTED:
  Look very carefully at both ears. Flag if you see:
  - A small in-ear device, earbud, or hearing-aid-like object in either ear canal
  - One earlobe appears to have something inserted
  - Candidate tilts head toward one ear repeatedly as if listening
  - Candidate pauses, appears to listen, then types/speaks — repeated pattern suggests audio coaching
  Confidence should be 0.80+ only if you clearly see a device or the behavioral pattern is repeated 3+ times.

SMART_GLASSES_DETECTED:
  Examine the candidate's glasses (if wearing any) closely:
  - Look for an unusual glow, reflection, or illuminated region on any lens that doesn't match room lighting
  - Smart glasses (Meta Ray-Ban, Google Glass, etc.) often have a small camera dot on the frame bridge or temple
  - Candidate may be reading slightly off-center from the screen — eyes track horizontally across a HUD
  - Frame appears thicker than normal eyeglasses, especially at the temples
  Flag with confidence 0.80+ only if lens glow or frame camera is clearly visible.

SECOND_SCREEN_DETECTED:
  Look for evidence of a secondary display the candidate is consulting:
  - A colored glow or light source reflecting off the candidate's glasses, face, or nearby surfaces that does NOT match the primary screen color
  - The room background lighting changes color/intensity in a pattern (screen refresh) from an off-camera source
  - Candidate's eyes track to a consistent off-camera position (left or right of frame) at regular intervals — different from random glancing
  - A monitor bezel, keyboard, or desk surface partially visible that doesn't belong to the exam setup
  - Reflection of text/UI visible on any reflective surface (glasses lens, window behind candidate, glossy desk)
  Flag with confidence 0.80+ if glow or reflection clearly shows a second active display.

━━━ RESPONSE FORMAT ━━━
ONLY output a JSON object when you detect a violation. Output null otherwise. Never output explanatory text.

{"type":"VIOLATION_TYPE","confidence":0.0-1.0,"description":"specific observation — what exactly you saw/heard"}

Rules:
- Confidence >= 0.80 required before reporting any violation
- For EARPIECE_DETECTED, SMART_GLASSES_DETECTED, SECOND_SCREEN_DETECTED: describe the EXACT visual cue you observed
- Do NOT flag normal glasses, normal headphones worn around neck, normal room lighting, or normal eye movement
- Do NOT flag typing sounds, mouse clicks, or the candidate reading the question aloud to themselves`
                    }]
                }
            },
        });

        // Wire up event handlers after connect
        session.on("message", (message) => {
            try {
                const text = message.serverContent?.modelTurn?.parts
                    ?.map(p => p.text)
                    ?.join("") || "";

                if (!text || text.trim() === "null") return;

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const violation = JSON.parse(jsonMatch[0]);
                    if (violation.type && violation.confidence >= 0.75) {
                        onViolation(violation);
                    }
                }
            } catch {
                // Ignore parse errors
            }
        });

        session.on("error", (error) => {
            console.error(`[Gemini Live] Error for ${candidateId}:`, error);
        });

        session.on("close", () => {
            console.log(`[Gemini Live] Session closed for ${candidateId}`);
            sessions.delete(candidateId);
        });

        return session;
    } catch (err) {
        console.error("[Gemini Live] Failed to start session:", err);
        return null;
    }
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // ── Video relay: candidate → recruiter (no storage, relay only) ──────────
    // videoRooms: sessionId → { publisher: ws | null, viewers: Set<ws> }
    const videoRooms = new Map();

    const wssVideo = new WebSocketServer({ noServer: true });

    wssVideo.on("connection", (ws, req) => {
        const url = parse(req.url, true);
        const sessionId = url.query.sessionId;
        const role = url.query.role; // "publisher" | "viewer"

        if (!sessionId || !role) {
            ws.close(1008, "Missing sessionId or role");
            return;
        }

        if (!videoRooms.has(sessionId)) {
            videoRooms.set(sessionId, { publisher: null, viewers: new Set() });
        }
        const room = videoRooms.get(sessionId);

        if (role === "publisher") {
            // Close any stale publisher for this room
            if (room.publisher && room.publisher.readyState === WebSocket.OPEN) {
                room.publisher.close(1001, "Replaced by new publisher");
            }
            room.publisher = ws;
            console.log(`[VideoRelay] Publisher connected: session=${sessionId}`);

            ws.on("message", (data) => {
                // Relay raw bytes directly to every viewer — no parsing overhead
                room.viewers.forEach((viewer) => {
                    if (viewer.readyState === WebSocket.OPEN) {
                        viewer.send(data);
                    }
                });
            });

            ws.on("close", () => {
                console.log(`[VideoRelay] Publisher disconnected: session=${sessionId}`);
                room.publisher = null;
                // Notify viewers so they can show "offline" state
                const notice = JSON.stringify({ type: "PUBLISHER_OFFLINE" });
                room.viewers.forEach((viewer) => {
                    if (viewer.readyState === WebSocket.OPEN) viewer.send(notice);
                });
                if (room.viewers.size === 0) videoRooms.delete(sessionId);
            });

            ws.on("error", () => { /* swallow — handled by close */ });

        } else if (role === "viewer") {
            room.viewers.add(ws);
            console.log(`[VideoRelay] Viewer connected: session=${sessionId} (${room.viewers.size} total)`);

            // Tell viewer if there's no publisher yet
            if (!room.publisher || room.publisher.readyState !== WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "PUBLISHER_OFFLINE" }));
            }

            ws.on("close", () => {
                room.viewers.delete(ws);
                if (!room.publisher && room.viewers.size === 0) videoRooms.delete(sessionId);
            });

            ws.on("error", () => { /* swallow */ });
        } else {
            ws.close(1008, "Invalid role");
        }
    });

    // WebSocket server for Gemini Live monitoring
    const wss = new WebSocketServer({ noServer: true });

    wss.on("connection", async (ws, req) => {
        const url = parse(req.url, true);
        const candidateId = url.query.candidateId;
        const sessionId = url.query.sessionId;

        if (!candidateId || !sessionId) {
            ws.close(1008, "Missing candidateId or sessionId");
            return;
        }

        console.log(`[Gemini Live] Candidate ${candidateId} connected`);

        let geminiSession = null;

        // Send status back to client
        const send = (data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        };

        // Start Gemini Live session
        geminiSession = await startGeminiSession(candidateId, (violation) => {
            // Use a non-colliding envelope so `type` isn't overwritten by violation.type
            send({ type: "VIOLATION", violationType: violation.type, confidence: violation.confidence, description: violation.description });
            console.log(`[Gemini Live] Violation for ${candidateId}: ${violation.type} (${violation.confidence})`);
        });

        if (geminiSession) {
            sessions.set(candidateId, geminiSession);
            send({ type: "CONNECTED", model: LIVE_MODEL });
        } else {
            send({ type: "ERROR", message: "Gemini Live session failed to start" });
        }

        // Receive video frames from client
        ws.on("message", async (data) => {
            if (!geminiSession) return;

            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === "FRAME" && msg.imageBase64) {
                    // Send video frame to Gemini Live
                    await geminiSession.sendRealtimeInput({
                        video: {
                            data: msg.imageBase64,
                            mimeType: "image/jpeg",
                        }
                    });
                }

                if (msg.type === "AUDIO" && msg.audioBase64) {
                    // Send raw PCM audio to Gemini Live (16-bit, 16kHz, mono)
                    // This enables audio-based cheating detection:
                    // whispered answers, second person speaking, phone audio, etc.
                    await geminiSession.sendRealtimeInput({
                        audio: {
                            data: msg.audioBase64,
                            mimeType: "audio/pcm;rate=16000",
                        }
                    });
                }
            } catch (err) {
                console.error("[Gemini Live] Error sending frame:", err);
            }
        });

        ws.on("close", async () => {
            console.log(`[Gemini Live] Candidate ${candidateId} disconnected`);
            if (geminiSession) {
                try { await geminiSession.close(); } catch { /* ignore */ }
                sessions.delete(candidateId);
            }
        });

        ws.on("error", (err) => {
            console.error(`[Gemini Live] WS error for ${candidateId}:`, err);
        });
    });

    // Upgrade HTTP → WebSocket
    server.on("upgrade", (req, socket, head) => {
        const { pathname } = parse(req.url);
        if (pathname === "/ws/monitor") {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit("connection", ws, req);
            });
        } else if (pathname === "/ws/video") {
            wssVideo.handleUpgrade(req, socket, head, (ws) => {
                wssVideo.emit("connection", ws, req);
            });
        } else {
            socket.destroy();
        }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`);
        console.log(`> Gemini Live WebSocket: ws://localhost:${PORT}/ws/monitor`);
        console.log(`> Video Relay WebSocket:  ws://localhost:${PORT}/ws/video`);
    });
});
