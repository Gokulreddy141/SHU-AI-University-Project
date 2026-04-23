/**
 * Shared proctoring constants used across both client components and server routes.
 * Keep this file free of React/Next.js imports — pure TypeScript only.
 */

/** Violation types that are considered critical (high-confidence cheating signal). */
export const CRITICAL_VIOLATION_TYPES = new Set([
    "FACE_MISMATCH",
    "EARPIECE_DETECTED",
    "SMART_GLASSES_DETECTED",
    "LLM_API_DETECTED",
    "SECOND_PERSON",
    "MULTIPLE_FACES",
    "VOICE_IDENTITY_MISMATCH",
    "TYPING_IDENTITY_MISMATCH",
    "SEMANTIC_ANSWER_ANOMALY",
    "SECOND_SCREEN_DETECTED",
    "LIVENESS_CHALLENGE_FAILED",
    "LIVENESS_FAILURE",
    "VIRTUAL_CAMERA",
]);

/** Returns true if a violation type is critical severity. */
export function isCriticalViolation(type: string): boolean {
    return CRITICAL_VIOLATION_TYPES.has(type);
}
