"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { WebRTCSignalPayload, AITelemetryPayload } from "@/types/webrtc";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // NOTE: Add a TURN server here for production (required behind symmetric NAT / corporate firewalls)
        // { urls: "turn:your-turn-server.com", username: "...", credential: "..." }
    ],
};

const POLL_INTERVAL_MS = 2500;

export type CallStatus = "idle" | "calling" | "incoming" | "connected";

/** Read auth credentials from localStorage and return headers for API calls. */
function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const stored = localStorage.getItem("user");
        if (!stored) return {};
        const u = JSON.parse(stored);
        return {
            "x-user-id": u._id || "",
            "x-user-role": u.role || "",
        };
    } catch {
        return {};
    }
}

export function useWebRTC(
    sessionId: string,
    _currentUserId: string,
    targetUserId: string | null, // The person we want to call (or who is calling us, established after offer)
    localStream: MediaStream | null
) {
    const [callStatus, setCallStatus] = useState<CallStatus>("idle");
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [remoteTelemetry, setRemoteTelemetry] = useState<AITelemetryPayload | null>(null);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const telemetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const lastPolledAt = useRef<Date | undefined>(undefined);
    
    // Initialize last polled time in useEffect to avoid purity violation
    useEffect(() => {
        if (!lastPolledAt.current) {
            lastPolledAt.current = new Date(Date.now() - 60000);
        }
    }, []);
    
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

    // We need targetUserId to send signals, if recruiter initiates it's candidateId, if candidate receives it's recruiterId
    const activeTargetId = useRef<string | null>(targetUserId);

    // Keep active stream in ref to avoid dependency cycles in callbacks
    const currentLocalStream = useRef<MediaStream | null>(null);
    useEffect(() => {
        currentLocalStream.current = localStream;
        // If PC exists and stream changes, we'd need renegotiation, but MVP assumes stable stream
    }, [localStream]);

    // Send generic signal to backend
    const sendSignal = useCallback(async (type: string, payload: unknown) => {
        if (!activeTargetId.current) return;
        try {
            await fetch("/api/webrtc/signal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    sessionId,
                    receiverId: activeTargetId.current,
                    type,
                    payload,
                }),
            });
        } catch (error) {
            console.error("Failed to send WebRTC signal:", error);
        }
    }, [sessionId]);

    const cleanupConnection = useCallback(() => {
        if (telemetryTimeoutRef.current) {
            clearTimeout(telemetryTimeoutRef.current);
            telemetryTimeoutRef.current = null;
        }
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setRemoteStream(null);
        setRemoteTelemetry(null);
        setCallStatus("idle");
        iceCandidateQueue.current = [];
    }, []);

    const initPeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        // When ICE candidates are found, send them to the peer
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal("ice-candidate", event.candidate.toJSON());
            }
        };

        // Network failure handling
        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                console.warn("WebRTC connection lost.");
                cleanupConnection();
            }
        };

        // Handle incoming data channel (for candidate -> recruiter telemetry)
        pc.ondatachannel = (event) => {
            if (event.channel.label === "ai-telemetry") {
                dataChannel.current = event.channel;
                event.channel.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        setRemoteTelemetry(data);

                        // Wipe stale telemetry if no data received for 3000ms
                        if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
                        telemetryTimeoutRef.current = setTimeout(() => {
                            setRemoteTelemetry(null);
                        }, 3000);
                    } catch (err) {
                        console.error("Failed to parse telemetry:", err);
                    }
                };
            }
        };

        // When remote video tracks arrive
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                setCallStatus("connected");
            }
        };

        // Add local tracks (e.g. webcam) to the connection
        if (currentLocalStream.current) {
            currentLocalStream.current.getTracks().forEach((track) => {
                pc.addTrack(track, currentLocalStream.current!);
            });
        }

        return pc;
    }, [sendSignal, cleanupConnection]);

    // Process buffered ICE candidates once remote description is set
    const processIceQueue = useCallback(async () => {
        if (!peerConnection.current || !peerConnection.current.remoteDescription) return;
        while (iceCandidateQueue.current.length > 0) {
            const candidateInit = iceCandidateQueue.current.shift();
            if (candidateInit) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidateInit));
                } catch (e) {
                    console.error("Error adding queued ICE candidate", e);
                }
            }
        }
    }, []);

    // 1. Recruiter: Initiate Call
    const initiateCall = useCallback(async () => {
        if (!localStream) {
            console.warn("Cannot initiate call without a local stream.");
            return;
        }
        setCallStatus("calling");
        activeTargetId.current = targetUserId;

        const pc = initPeerConnection();
        try {
            // Recruiter creates the data channel before the offer
            const dc = pc.createDataChannel("ai-telemetry");
            dc.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    setRemoteTelemetry(data);

                    // Wipe stale telemetry if no data received for 3000ms
                    if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
                    telemetryTimeoutRef.current = setTimeout(() => {
                        setRemoteTelemetry(null);
                    }, 3000);
                } catch (err) {
                    console.error("Failed to parse telemetry inline:", err);
                }
            };
            dataChannel.current = dc;

            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);
            await sendSignal("offer", offer);
        } catch (error) {
            console.error("Failed to create offer:", error);
            cleanupConnection();
        }
    }, [localStream, targetUserId, initPeerConnection, sendSignal, cleanupConnection]);

    // 2. Candidate: Accept Call
    // Pass `stream` when the candidate's camera is obtained at accept-time
    // (the hook may have been initialized with localStream=null before the call arrived)
    const acceptCall = useCallback(async (stream?: MediaStream) => {
        setCallStatus("connected");
        const pc = peerConnection.current;
        if (!pc) return;

        // Use the freshly acquired stream if provided, otherwise fall back to the hook's localStream
        const streamToAdd = stream || currentLocalStream.current;

        if (streamToAdd) {
            // Update the ref so future renegotiations have the right stream
            currentLocalStream.current = streamToAdd;
            const senders = pc.getSenders();
            streamToAdd.getTracks().forEach((track) => {
                if (!senders.find(s => s.track === track)) {
                    pc.addTrack(track, streamToAdd);
                }
            });
        }

        try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal("answer", answer);
        } catch (error) {
            console.error("Failed to create answer:", error);
            cleanupConnection();
        }
    }, [sendSignal, cleanupConnection]);

    // 3. Either: Decline or End Call
    const endCall = useCallback(async () => {
        await sendSignal("end-call", {});
        cleanupConnection();
    }, [sendSignal, cleanupConnection]);

    // Send AI Telemetry (Candidate -> Recruiter)
    const sendTelemetry = useCallback((payload: AITelemetryPayload) => {
        if (dataChannel.current?.readyState === "open") {
            dataChannel.current.send(JSON.stringify(payload));
        }
    }, []);


    // Backend Polling Effect
    useEffect(() => {
        const pollSignals = async () => {
            try {
                if (!lastPolledAt.current) return; // Skip if not initialized yet
                const res = await fetch(`/api/webrtc/signal?sessionId=${sessionId}&since=${lastPolledAt.current.toISOString()}`, {
                    headers: getAuthHeaders(),
                });
                if (!res.ok) return;
                const data = await res.json();
                const signals: WebRTCSignalPayload[] = data.items || [];

                if (signals.length > 0) {
                    // Update poll time to the latest signal's createdAt exactly
                    lastPolledAt.current = new Date(signals[signals.length - 1].createdAt);
                }

                for (const signal of signals) {
                    switch (signal.type) {
                        case "offer":
                            if (callStatus === "idle" && signal.payload) {
                                activeTargetId.current = signal.senderId;
                                setCallStatus("incoming");
                                const pc = initPeerConnection();
                                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
                                await processIceQueue(); // Process any ICE candidates that arrived early
                            }
                            break;

                        case "answer":
                            if (peerConnection.current && callStatus === "calling" && signal.payload) {
                                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
                                setCallStatus("connected");
                                await processIceQueue();
                            }
                            break;

                        case "ice-candidate":
                            if (peerConnection.current && signal.payload) {
                                if (peerConnection.current.remoteDescription) {
                                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
                                } else {
                                    // Buffer ICE candidates if remote description isn't set yet (Race condition mitigation)
                                    iceCandidateQueue.current.push(signal.payload as RTCIceCandidateInit);
                                }
                            }
                            break;

                        case "end-call":
                            cleanupConnection();
                            break;
                    }
                }
            } catch {
                // Silently ignore polling network errors
            }
        };

        const intervalId = setInterval(pollSignals, POLL_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [sessionId, callStatus, initPeerConnection, processIceQueue, cleanupConnection]);

    return {
        callStatus,
        remoteStream,
        remoteTelemetry,
        initiateCall,
        acceptCall,
        endCall,
        sendTelemetry
    };
}
