export interface WebRTCSignalPayload {
    _id: string;
    sessionId: string;
    senderId: string;
    receiverId: string;
    type: "offer" | "answer" | "ice-candidate" | "end-call";
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
    createdAt: string;
}

export interface SendWebRTCSignalRequest {
    sessionId: string;
    receiverId: string;
    type: "offer" | "answer" | "ice-candidate" | "end-call";
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

export interface AITelemetryPayload {
    gazeDirection: string;
    faceCount: number;
    timestamp: number;
}
