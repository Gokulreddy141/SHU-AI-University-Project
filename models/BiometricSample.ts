import mongoose from "mongoose";

const BiometricSampleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["face", "voice"],
            required: true,
        },
        data: {
            type: String, // base64 encoded image or audio
            required: true,
        },
    },
    { timestamps: true }
);

// One face sample + one voice sample per user (upsert on re-enrollment)
BiometricSampleSchema.index({ userId: 1, type: 1 }, { unique: true });

export default mongoose.models.BiometricSample ||
    mongoose.model("BiometricSample", BiometricSampleSchema);
