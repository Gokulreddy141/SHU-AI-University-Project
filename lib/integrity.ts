/**
 * Centralized logic for calculating the Interview Integrity Score.
 * 
 * Penalties are weighted by severity and adjusted for real-world reliability.
 * Max Score: 100, Min Score: 0.
 */

export interface IntegrityViolationSummary {
    lookingAway: number;
    multipleFaces: number;
    noFace: number;
    lipSyncMismatch: number;
    faceMismatch: number;
    tabSwitch: number;
    copyPaste: number;
    virtualCamera?: number;
    devtoolsAccess?: number;
    livenessFailure?: number;
    secondaryMonitor?: number;
    fullscreenExit?: number;
    windowBlur?: number;
    keyboardShortcut?: number;
    clipboardPaste?: number;
    phoneDetected?: number;
    unauthorizedMaterial?: number;
    headPoseAnomaly?: number;
    ambientNoise?: number;
    typingAnomaly?: number;
    screenRecordingDetected?: number;
    duplicateTab?: number;
    faceProximityAnomaly?: number;
    extensionDetected?: number;
    pupilFocusAnomaly?: number;
    responseTimeAnomaly?: number;
    mouseInactivity?: number;
    networkAnomaly?: number;
    voiceActivityAnomaly?: number;
    virtualDeviceDetected?: number;
    syntheticAudioDetected?: number;
    microGazeAnomaly?: number;
    vmOrSandboxDetected?: number;
    handGestureAnomaly?: number;
    environmentChange?: number;
    blinkPatternAnomaly?: number;
}

export function calculateIntegrityScore(summary: IntegrityViolationSummary): number {
    if (!summary) return 100;
    let score = 100;

    // --- High Severity (Direct Cheating Signs) ---
    score -= (summary.faceMismatch || 0) * 30; // Identity fraud
    score -= (summary.virtualCamera || 0) * 50; // Hardware spoofing
    score -= (summary.devtoolsAccess || 0) * 20; // Attempting to inspect source
    score -= (summary.multipleFaces || 0) * 15; // Help from another person
    score -= (summary.phoneDetected || 0) * 25; // Phone visible in frame
    score -= (summary.screenRecordingDetected || 0) * 40; // Sharing exam screen
    score -= (summary.duplicateTab || 0) * 20; // Multi-tab exploit
    score -= (summary.extensionDetected || 0) * 25; // AI extension cheating
    score -= (summary.environmentChange || 0) * 50; // Proxy testing (different machine)

    // --- Medium Severity (Suspicious Behavior) ---
    score -= (summary.lipSyncMismatch || 0) * 20; // Possible side-talking/AI audio
    score -= (summary.livenessFailure || 0) * 15; // Possible static image/video
    score -= (summary.secondaryMonitor || 0) * 15; // Hidden screen
    score -= (summary.fullscreenExit || 0) * 10; // High risk of surfing
    score -= (summary.unauthorizedMaterial || 0) * 20; // Books/notes visible
    score -= (summary.headPoseAnomaly || 0) * 8; // Extreme head rotation
    score -= (summary.typingAnomaly || 0) * 15; // Bot-like or pasted typing patterns
    score -= (summary.ambientNoise || 0) * 5; // Background audio (someone dictating)
    score -= (summary.faceProximityAnomaly || 0) * 5; // Too far/close to camera
    score -= (summary.pupilFocusAnomaly || 0) * 8; // Eyes reading off-screen
    score -= (summary.responseTimeAnomaly || 0) * 10; // Instant/too-slow answers
    score -= (summary.networkAnomaly || 0) * 12; // Intentional disconnect
    score -= (summary.voiceActivityAnomaly || 0) * 15; // Someone dictating answers
    score -= (summary.handGestureAnomaly || 0) * 15; // Holding phone below frame

    // --- Low Severity (Behavioral Indicators) ---
    score -= (summary.noFace || 0) * 5; // Left camera frame
    score -= (summary.lookingAway || 0) * 3; // Reading off-screen
    score -= (summary.tabSwitch || 0) * 5; // Surfing
    score -= (summary.windowBlur || 0) * 2; // Losing focus (notifications etc.)
    score -= (summary.copyPaste || 0) * 10; // Pasting large text
    score -= (summary.keyboardShortcut || 0) * 3; // Suspicious shortcuts
    score -= (summary.clipboardPaste || 0) * 2; // Content injection
    score -= (summary.mouseInactivity || 0) * 5; // No interaction for extended period
    score -= (summary.blinkPatternAnomaly || 0) * 5; // High stress or note reading

    return Math.max(0, Math.min(100, score));
}

