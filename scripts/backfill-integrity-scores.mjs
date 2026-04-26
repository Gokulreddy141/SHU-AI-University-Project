/**
 * Backfill integrity scores for all sessions using the same
 * calculateIntegrityScore formula as the API.
 *
 * Run: node scripts/backfill-integrity-scores.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://admin:project2026@cluster0.zeoys9h.mongodb.net/integrity-ai?appName=Cluster0";

// Inline the scoring formula (mirrors lib/integrity.ts)
function calculateIntegrityScore(s) {
    if (!s) return 100;
    let score = 100;
    score -= (s.faceMismatch || 0) * 30;
    score -= (s.virtualCamera || 0) * 50;
    score -= (s.devtoolsAccess || 0) * 20;
    score -= (s.multipleFaces || 0) * 15;
    score -= (s.phoneDetected || 0) * 25;
    score -= (s.screenRecordingDetected || 0) * 40;
    score -= (s.duplicateTab || 0) * 20;
    score -= (s.extensionDetected || 0) * 25;
    score -= (s.environmentChange || 0) * 50;
    score -= (s.lipSyncMismatch || 0) * 20;
    score -= (s.livenessFailure || 0) * 15;
    score -= (s.secondaryMonitor || 0) * 15;
    score -= (s.fullscreenExit || 0) * 10;
    score -= (s.unauthorizedMaterial || 0) * 20;
    score -= (s.headPoseAnomaly || 0) * 8;
    score -= (s.typingAnomaly || 0) * 15;
    score -= (s.ambientNoise || 0) * 5;
    score -= (s.faceProximityAnomaly || 0) * 5;
    score -= (s.pupilFocusAnomaly || 0) * 8;
    score -= (s.responseTimeAnomaly || 0) * 10;
    score -= (s.networkAnomaly || 0) * 12;
    score -= (s.voiceActivityAnomaly || 0) * 15;
    score -= (s.handGestureAnomaly || 0) * 15;
    score -= (s.noFace || 0) * 5;
    score -= (s.lookingAway || 0) * 3;
    score -= (s.tabSwitch || 0) * 5;
    score -= (s.windowBlur || 0) * 2;
    score -= (s.copyPaste || 0) * 10;
    score -= (s.keyboardShortcut || 0) * 3;
    score -= (s.clipboardPaste || 0) * 2;
    score -= (s.mouseInactivity || 0) * 5;
    score -= (s.blinkPatternAnomaly || 0) * 5;
    return Math.max(0, Math.min(100, score));
}

await mongoose.connect(MONGODB_URI);
console.log("✅  Connected to MongoDB");

const ExamSession = mongoose.model("ExamSession", new mongoose.Schema({
    integrityScore: Number,
    violationSummary: mongoose.Schema.Types.Mixed,
}, { strict: false }));

const sessions = await ExamSession.find({}).select("integrityScore violationSummary").lean();
console.log(`📋  Found ${sessions.length} sessions to backfill`);

let updated = 0;
for (const session of sessions) {
    const correct = calculateIntegrityScore(session.violationSummary || {});
    if (session.integrityScore !== correct) {
        await ExamSession.findByIdAndUpdate(session._id, { $set: { integrityScore: correct } });
        console.log(`   ${session._id} → ${session.integrityScore} ➜ ${correct}`);
        updated++;
    }
}

console.log(`\n✅  Backfill complete — ${updated}/${sessions.length} sessions updated`);
await mongoose.disconnect();
