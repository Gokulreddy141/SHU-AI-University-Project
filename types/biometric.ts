export interface IBiometricSample {
    _id: string;
    userId: string;
    type: "face" | "voice";
    data: string;
    createdAt: string;
}

export interface EnrollBiometricPayload {
    userId: string;
    faceData: string;   // base64 face photo
    voiceData: string;  // base64 audio
}
