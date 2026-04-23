/**
 * Centralized integrity score formula.
 *
 * Rules:
 * - Start at 100, subtract weighted deductions per violation count.
 * - Clamp result to [0, 100].
 * - Every field must correspond 1-to-1 with a `violationSummary` field in
 *   ExamSession.ts AND an entry in the VIOLATION_FIELD_MAP in the API route.
 *
 * Weight calibration principles:
 * - High-certainty, hard-to-fake signals → higher weight (20-30)
 * - Noisy / occasionally false-positive signals → lower weight (3-10)
 * - No single event should reach 0 on its own (max single weight = 25)
 * - Repeated confirmed detections accumulate naturally
 */

export interface IntegrityViolationSummary {
    // Face & Gaze
    lookingAway?: number;
    noFace?: number;
    multipleFaces?: number;
    faceMismatch?: number;
    livenessFailure?: number;
    faceProximityAnomaly?: number;
    headPoseAnomaly?: number;
    blinkPatternAnomaly?: number;
    pupilFocusAnomaly?: number;
    microGazeAnomaly?: number;
    stressDetected?: number;
    // Audio
    lipSyncMismatch?: number;
    ambientNoise?: number;
    voiceActivityAnomaly?: number;
    voiceIdentityMismatch?: number;
    syntheticAudioDetected?: number;
    // Objects & Devices
    phoneDetected?: number;
    notesDetected?: number;
    earpieceDetected?: number;
    handGestureAnomaly?: number;
    // Input & Behaviour
    tabSwitch?: number;
    duplicateTab?: number;
    copyPaste?: number;
    clipboardPaste?: number;
    keyboardShortcut?: number;
    typingAnomaly?: number;
    mouseInactivity?: number;
    responseTimeAnomaly?: number;
    behavioralAnomaly?: number;
    semanticAnswerAnomaly?: number;
    // System & Environment
    virtualCamera?: number;
    screenRecordingDetected?: number;
    extensionDetected?: number;
    devtoolsAccess?: number;
    llmDetected?: number;
    secondaryMonitor?: number;
    environmentChange?: number;
    fullscreenExit?: number;
    windowBlur?: number;
    networkAnomaly?: number;
    virtualDeviceDetected?: number;
    vmOrSandboxDetected?: number;
}

export function calculateIntegrityScore(summary: IntegrityViolationSummary): number {
    if (!summary) return 100;
    let score = 100;

    // ── Face & Gaze ───────────────────────────────────────────────────────────
    // faceMismatch: confirmed identity fraud — high weight but capped so 1 event
    // doesn't alone reach 0 (enrollment photo quality varies).
    score -= (summary.faceMismatch        || 0) * 20;
    score -= (summary.livenessFailure     || 0) * 12;   // Could be slow blinker
    score -= (summary.multipleFaces       || 0) * 12;   // Could be reflection/mirror
    score -= (summary.noFace              || 0) * 4;    // Leaning back / camera shift
    score -= (summary.lookingAway         || 0) * 3;    // Occasional glances are normal
    score -= (summary.headPoseAnomaly     || 0) * 6;
    score -= (summary.blinkPatternAnomaly || 0) * 4;
    score -= (summary.faceProximityAnomaly|| 0) * 3;
    score -= (summary.pupilFocusAnomaly   || 0) * 6;
    score -= (summary.microGazeAnomaly    || 0) * 4;
    score -= (summary.stressDetected      || 0) * 3;    // Informational only

    // ── Audio ─────────────────────────────────────────────────────────────────
    score -= (summary.lipSyncMismatch       || 0) * 15; // Strong cheating signal
    score -= (summary.voiceIdentityMismatch || 0) * 18; // Different speaker = proxy
    score -= (summary.voiceActivityAnomaly  || 0) * 10; // Background dictation
    score -= (summary.ambientNoise          || 0) * 4;  // Noisy environment, common
    score -= (summary.syntheticAudioDetected|| 0) * 15; // TTS / AI-generated voice

    // ── Objects & Devices ─────────────────────────────────────────────────────
    // earpieceDetected: Gemini-confirmed — very reliable, high weight
    score -= (summary.earpieceDetected   || 0) * 22;
    score -= (summary.phoneDetected      || 0) * 10;   // Phone may pass through frame briefly
    score -= (summary.notesDetected      || 0) * 15;   // Notes visible in frame
    score -= (summary.handGestureAnomaly || 0) * 10;

    // ── Input & Behaviour ─────────────────────────────────────────────────────
    score -= (summary.duplicateTab          || 0) * 18;  // Multi-tab exploit — deliberate
    score -= (summary.semanticAnswerAnomaly || 0) * 15;  // AI-written answer
    score -= (summary.typingAnomaly         || 0) * 10;
    score -= (summary.copyPaste             || 0) * 8;
    score -= (summary.responseTimeAnomaly   || 0) * 8;
    score -= (summary.behavioralAnomaly     || 0) * 6;
    score -= (summary.tabSwitch             || 0) * 5;
    score -= (summary.clipboardPaste        || 0) * 2;
    score -= (summary.keyboardShortcut      || 0) * 2;
    score -= (summary.mouseInactivity       || 0) * 3;

    // ── System & Environment ──────────────────────────────────────────────────
    // virtualCamera: strong signal but first detection might be a false positive
    // on some GPU drivers — weight 20 means 2 confirmed events = severe (score ≤ 60)
    score -= (summary.virtualCamera           || 0) * 20;
    score -= (summary.screenRecordingDetected || 0) * 22; // Very reliable OS-level detection
    score -= (summary.extensionDetected       || 0) * 18;
    score -= (summary.llmDetected             || 0) * 18;  // AI API traffic = cheating tool active
    score -= (summary.devtoolsAccess          || 0) * 15;
    score -= (summary.secondaryMonitor        || 0) * 12;
    // environmentChange: lighting shifts can trigger — weight kept low per event
    score -= (summary.environmentChange       || 0) * 10;
    score -= (summary.vmOrSandboxDetected     || 0) * 15;
    score -= (summary.virtualDeviceDetected   || 0) * 15;
    score -= (summary.networkAnomaly          || 0) * 8;
    score -= (summary.fullscreenExit          || 0) * 8;
    score -= (summary.windowBlur             || 0) * 2;

    return Math.max(0, Math.min(100, score));
}
