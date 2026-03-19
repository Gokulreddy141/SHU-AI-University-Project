import mongoose, { Document, Model } from "mongoose";

export interface IWebRTCSignal extends Document {
    sessionId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    type: "offer" | "answer" | "ice-candidate" | "end-call";
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
    createdAt: Date;
}

const WebRTCSignalSchema = new mongoose.Schema<IWebRTCSignal>({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamSession",
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["offer", "answer", "ice-candidate", "end-call"],
        required: true,
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 3600 }, // Auto-delete document 1 hour after creation
    },
});

// Compound index for fast polling
// We typically poll for signals intended for a specific receiver, in a specific session, after a certain time
WebRTCSignalSchema.index({ sessionId: 1, receiverId: 1, createdAt: 1 });

const WebRTCSignal: Model<IWebRTCSignal> =
    mongoose.models.WebRTCSignal || mongoose.model<IWebRTCSignal>("WebRTCSignal", WebRTCSignalSchema);

export default WebRTCSignal;
