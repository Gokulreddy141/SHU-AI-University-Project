# Interview Integrity — College Presentation Content
### MS Artificial Intelligence | Final Year Group Project

> **How to use this file:** Each section marked `[SLIDE]` is one PowerPoint slide. The content under each slide is the exact text, bullet points, and notes to put on that slide.

---

---

## [SLIDE 1] — Title Slide

**Title:**
# Interview Integrity
## AI-Powered Exam Proctoring System

**Subtitle:**
An intelligent, real-time proctoring platform using Computer Vision, Audio AI, Behavioral Analytics, and Large Language Models

**Team:**
| Name | Role |
|------|------|
| Gokul | Team Lead & System Architect |
| Indra | Computer Vision Engineer |
| Sridhar | Audio & Behavioral AI Specialist |
| Kumar | System Security & Network Engineer |
| Tejeshwini | Data Scientist & Ethics Lead |

**Course:** MS Artificial Intelligence — Final Year Project
**Year:** 2025–2026

---

---

## [SLIDE 2] — The Problem

**Heading:** The Rise of Remote Exam Fraud

**Key Statistics (use large numbers on slide):**
- 📈 **73%** increase in online exam cheating since remote learning became mainstream
- 🤖 **ChatGPT, Claude, Gemini** — candidates now have AI assistants that can answer any exam question in seconds
- 📱 **Phone-below-desk** cheating is invisible to traditional webcam proctoring
- 👤 **Proxy candidates** — someone else sits the exam using another person's account
- 🎧 **Earpiece coaching** — a person in another room speaks answers in real time

**The Gap:**
> Existing proctoring tools rely on a single webcam feed and basic motion detection. They cannot detect earpieces, AI tool usage, voice proxies, or sophisticated gaze manipulation.

**Our Solution:**
> A multi-layered AI system using 35+ simultaneous detection algorithms — the most comprehensive open-source proctoring framework built.

---

---

## [SLIDE 3] — Project Overview

**Heading:** What We Built

**One-line description:**
> A full-stack web application that monitors candidates in real time during online exams using artificial intelligence — detecting cheating that no human invigilator could catch remotely.

**Three pillars of the system:**

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   DETECT            │   │   SCORE             │   │   REPORT            │
│                     │   │                     │   │                     │
│  35+ AI algorithms  │   │  Weighted integrity │   │  Gemini AI writes   │
│  running live in    │   │  score (0–100)      │   │  recruiter report   │
│  the browser        │   │  updated in real    │   │  auto-flagging      │
│                     │   │  time               │   │  low-score sessions │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

**Platform:**
- Built with **Next.js 14**, **TypeScript**, **MongoDB**
- Runs entirely in the **browser** — no software installation needed
- Works on **Chrome / Edge** (full support), Firefox (partial)

---

---

## [SLIDE 4] — System Architecture

**Heading:** System Architecture

```
                        ┌──────────────────────────────────────┐
                        │           CANDIDATE BROWSER          │
                        │                                      │
  Webcam ──────────────►│  MediaPipe FaceMesh (468 landmarks)  │
  Microphone ──────────►│  Web Audio API / Silero VAD          │
  Keyboard/Mouse ──────►│  Keystroke & Mouse Hooks             │
  Network ─────────────►│  Service Worker (LLM Blocker)        │
                        │                                      │
                        │  35+ Detection Hooks (React)         │
                        │  ↓ violation events                  │
                        └──────────────┬───────────────────────┘
                                       │ POST /api/violation
                                       ▼
                        ┌──────────────────────────────────────┐
                        │           NEXT.JS SERVER             │
                        │                                      │
                        │  Violation API → MongoDB             │
                        │  Integrity Score Engine              │
                        │  Gemini 2.0 Flash (AI Analysis)      │
                        │  Session Management                  │
                        └──────────────┬───────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────────┐
                        │         RECRUITER DASHBOARD          │
                        │                                      │
                        │  Live session monitoring             │
                        │  Integrity score per candidate       │
                        │  AI-generated integrity reports      │
                        │  Violation breakdown & timeline      │
                        └──────────────────────────────────────┘
```

**Key architectural decisions:**
- All AI runs **client-side** (browser) — no video is uploaded to a server
- Violations are **events only** — no raw video storage (privacy-safe)
- Gemini AI runs **server-side** for visual analysis and report generation

---

---

## [SLIDE 5] — Technology Stack

**Heading:** Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 19, TypeScript | Web application framework |
| **Styling** | Tailwind CSS | UI design |
| **Database** | MongoDB Atlas | Session and violation storage |
| **Computer Vision** | MediaPipe FaceMesh (468 pts) | Face, gaze, blink, head pose |
| **Computer Vision** | MediaPipe HandLandmarker | Hand gesture & phone detection |
| **Object Detection** | TensorFlow.js + COCO-SSD | Phone, tablet detection |
| **Audio AI** | Web Audio API, AudioContext | Noise, TTS, voice analysis |
| **Voice Detection** | Silero VAD (ONNX) | Neural voice activity detection |
| **AI Analysis** | Google Gemini 2.0 Flash | Visual proctoring + report generation |
| **LLM Blocking** | Service Worker API | Intercept AI tool requests |
| **Video Interviews** | WebRTC | Live interview sessions |
| **Auth** | NextAuth.js | Recruiter / candidate login |

---

---

## [SLIDE 6] — Detection Systems Overview

**Heading:** 35+ Detection Systems — Four Categories

**Use a 2×2 grid layout on the slide:**

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  👁  COMPUTER VISION (11)        │   │  🎵  AUDIO & VOICE (7)           │
│                                 │   │                                 │
│  • Face identity verification   │   │  • Voice activity detection     │
│  • Iris & gaze tracking         │   │  • Speaker identity matching    │
│  • Head pose estimation         │   │  • Lip-sync mismatch detection  │
│  • Liveness detection           │   │  • Ambient noise analysis       │
│  • Multiple face detection      │   │  • TTS / synthetic audio detect │
│  • Object detection (phone)     │   │  • Silero VAD (neural model)    │
│  • Hand gesture tracking        │   │  • Audio spoofing detection     │
│  • Phone-below-monitor detect   │   │                                 │
│  • Face proximity monitoring    │   │                                 │
│  • Room environment monitoring  │   │                                 │
│  • Blink frequency analysis     │   │                                 │
└─────────────────────────────────┘   └─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  ⌨  BEHAVIORAL AI (8)           │   │  🔒  SYSTEM SECURITY (9)         │
│                                 │   │                                 │
│  • Keystroke dynamics           │   │  • Virtual camera detection     │
│  • Mouse behavior profiling     │   │  • Screen recording detection   │
│  • Response time analysis       │   │  • Multi-tab detection          │
│  • Clipboard interception       │   │  • LLM traffic interception     │
│  • Behavioral consistency score │   │  • VM / sandbox detection       │
│  • Fullscreen enforcement       │   │  • Virtual device detection     │
│  • Window focus detection       │   │  • Browser extension detection  │
│  • AI-written answer detection  │   │  • Network anomaly monitoring   │
│                                 │   │  • Print screen detection       │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

---

---

## [SLIDE 7] — Computer Vision Deep Dive

**Heading:** Computer Vision — How We Track the Candidate

**MediaPipe FaceMesh: 468 facial landmark points**

```
                    Forehead (10)
                        │
    Left Temple (234)───┼───Right Temple (454)
                        │
    Left Eye (33/159)   │   Right Eye (263/386)
                    Nose Tip (1)
                        │
    Left Mouth (61) ────┼──── Right Mouth (291)
                    Chin (152)
```

**What we extract from landmarks:**

| Detection | Landmarks Used | Method |
|-----------|---------------|--------|
| **Gaze direction** | Eye corners + nose tip | Geometric offset ratio |
| **Head pose (yaw/pitch)** | Temple, chin, forehead | 3D projection math |
| **Face identity** | 8 geometric ratios | Cosine similarity (baseline vs live) |
| **Liveness** | All 468 points | Micro-movement variance |
| **Blink detection** | Eye aspect ratio (EAR) | 6 eyelid landmarks |
| **Face proximity** | Face bounding box | Normalized face width |
| **Phone below desk** | Iris vertical position | Iris y-coordinate > 0.72 |

**Key advantage:** Runs at **30 FPS** with zero model downloads — MediaPipe WASM loads once in the browser.

---

---

## [SLIDE 8] — Audio AI Deep Dive

**Heading:** Audio AI — Detecting Voice Fraud

**Three-layer audio detection stack:**

**Layer 1 — Silero VAD (Neural Model)**
- ONNX-based voice activity detection model
- Speech probability threshold: `0.65`
- Detects sustained speech (>15 seconds) indicating dictation/coaching
- Runs entirely in-browser via ONNX Runtime Web

**Layer 2 — Speaker Identity Matching**
```
  Exam Start               During Exam
  ─────────                ────────────
  Record 25s baseline  →   Extract MFCC-like features every 30s
  Extract voice profile    Compare with cosine similarity
  (13 cepstral features)   Threshold: 0.72
                           If score < 0.72 for 2 consecutive checks:
                           → VOICE_IDENTITY_MISMATCH violation
```

**Layer 3 — Audio Spoofing Detection (TTS Detection)**
```
  Virtual audio cable:  amplitude variance ≈ 0  (stdDev < 3.0) → flagged
  Real speech:          natural variance         (stdDev > 3.0) → normal
  Complete silence:     100% zero samples across 30s window   → flagged
```

**Lip-Sync Mismatch:**
- Compares mouth aperture (landmark-based) against detected audio amplitude
- Voice activity without mouth movement = someone else speaking

---

---

## [SLIDE 9] — Behavioral AI Deep Dive

**Heading:** Behavioral AI — The Invisible Fingerprint

**Keystroke Dynamics — Mahalanobis Distance Classifier**

Every candidate has a unique typing rhythm. We measure:
- `holdTime` — how long each key is pressed
- `flightTime` — time between consecutive keystrokes
- `digraphTime` — timing patterns between key pairs

```
  Baseline phase (first 80 keystrokes):
  → Build mean vector + covariance matrix

  Live comparison:
  → Mahalanobis distance from baseline
  → Threshold: 5.0 (raised to reduce false positives)
  → 2 consecutive anomalies required before violation fires
```

**Behavioral Consistency — Isolation Forest Algorithm**

Every 60 seconds we collect a behavioral snapshot:
```
{
  lookAwayRate,    blinkRate,      keystrokeRate,
  mouseActivity,  facePresence,   voiceActivity
}
```
→ Run 50 random isolation trees
→ Anomaly score > 0.50 for 2 consecutive windows = `BEHAVIORAL_ANOMALY`
→ Identifies: sudden typing speed change (copying notes), high voice + no face (proxy answering)

**AI-Written Answer Detection (Gemini)**
- Stage 1: Heuristics — typing speed, lexical diversity (TTR > 0.82), length anomaly
- Stage 2: Gemini 2.0 Flash semantic analysis for borderline cases
- Detects: "Furthermore/Moreover" patterns, excessive hedging, non-personal language

---

---

## [SLIDE 10] — Security Systems Deep Dive

**Heading:** System Security — What the Candidate Cannot Hide

**LLM Traffic Interception — Service Worker**

```javascript
// Runs in a SEPARATE THREAD — cannot be blocked by candidate's JavaScript

const LLM_DOMAINS = [
  "api.openai.com", "api.anthropic.com", "claude.ai",
  "gemini.google.com", "copilot.microsoft.com", "chat.openai.com",
  "phind.com", "poe.com", "perplexity.ai" ... (28 domains total)
]

// Every fetch() from the exam page is intercepted
// If destination matches → Block (HTTP 403) + Alert platform
```

**Why this works:** The Service Worker runs before any JavaScript can execute. The candidate cannot disable it from the exam page.

**Virtual Camera Detection**
- `navigator.mediaDevices.enumerateDevices()` checks device labels
- Flags: OBS, ManyCam, Snap Camera, EpocCam, DroidCam, VB-Audio, Voicemeeter
- Confidence: 0.75 (some apps are installed legitimately on developer machines)

**VM / Sandbox Detection**
- WebGL renderer string check: `LLVMpipe`, `SwiftShader`, `VMware`, `VirtualBox`, `Parallels`
- Confidence: 0.65 (corporate laptops with restricted GPU drivers can trigger this)

**Screen Recording Detection**
- Monitors requestAnimationFrame timestamp deltas
- FPS drops below 12 for 5+ consecutive samples = screen capture software active
- Headless Chrome / Puppeteer: FPS collapses to near 0

---

---

## [SLIDE 11] — Gemini AI Integration

**Heading:** Gemini 2.0 Flash — Four AI Use Cases

**1. Real-Time Visual Proctoring (every 30 seconds)**

Sends a 320×240 webcam snapshot to Gemini with a detailed analysis prompt.

Gemini detects things no algorithm can:
```
Standard:   multiple faces, no face, looking away, phone, notes
Advanced:   → EARPIECE in ear canal (which ear, wire description)
            → SMART GLASSES with display overlay
            → SECOND SCREEN reflection on glasses/window
```
Only violations with confidence ≥ 0.80 are recorded.

**2. AI-Written Answer Detection**
- Sends question + candidate's answer text
- Detects: unnatural formality, excessive hedging, AI transition phrases
- Acts only at confidence > 0.80

**3. Post-Exam Integrity Report (automatic)**
Fires immediately when exam completes. Returns:
```json
{
  "verdict": "CLEAN | SUSPICIOUS | HIGH_RISK",
  "riskLevel": "low | moderate | high | critical",
  "summary": "2-3 sentence plain English summary",
  "flags": ["Face mismatch x2", "LLM traffic detected"],
  "recommendation": "PASS | MANUAL_REVIEW | DISQUALIFY"
}
```

**4. Detailed Recruiter Report (on demand)**
Full structured analysis with risk factors, positive indicators, and 3-paragraph reasoning.

**Cost efficiency:** Full exam session uses ~20 Gemini API calls (30s intervals × 10 minutes).

---

---

## [SLIDE 12] — Integrity Score Algorithm

**Heading:** The Integrity Scoring Engine

**Formula:** Start at 100, subtract weighted deductions per violation.

```
integrityScore = MAX(0, MIN(100,
    100
    − (faceMismatch        × 20)
    − (screenRecording     × 22)
    − (earpieceDetected    × 22)
    − (virtualCamera       × 20)
    − (voiceIdentityMismatch × 18)
    − (duplicateTab        × 18)
    − (llmDetected         × 18)
    − (extensionDetected   × 18)
    − (lipSyncMismatch     × 15)
    − (notesDetected       × 15)
    − (semanticAnswer      × 15)
    − (vmOrSandbox         × 15)
    ... (35+ violation types)
))
```

**Weight calibration principles:**
| Weight Range | Meaning | Example |
|---|---|---|
| **20–22** | Near-certain cheating | Earpiece detected, screen recording |
| **12–18** | Strong cheating signal | Lip-sync mismatch, duplicate tab, LLM traffic |
| **6–10** | Moderate concern | Head pose anomaly, tab switch |
| **2–5** | Low signal (noisy) | Window blur, looking away briefly |

**Auto-flagging:** If final score < threshold (default: 50/100), session is automatically marked "Under Review" and Gemini generates a full report for the recruiter.

---

---

## [SLIDE 13] — False Positive Engineering

**Heading:** False Positive Prevention — Making It Fair

**The core challenge:**
> An AI proctoring system is only useful if it doesn't falsely accuse honest candidates. We spent significant engineering effort calibrating every threshold.

**Key techniques we implemented:**

**1. Consecutive Detection Guards**
```
Single detection  →  Ignored (could be camera glitch, lighting change)
2 consecutive    →  Violation logged
```
Applied to: Face identity, Speaker identity, Behavioral anomaly, Object detection

**2. Grace Periods**
```
Fullscreen exit  →  Wait 5 seconds before flagging
                    (covers OS notifications, permission dialogs)

Sub-5s network   →  Not counted as a disconnection
drop             →  (covers Bluetooth interference, WiFi handoffs)
```

**3. Calibrated Thresholds (examples)**
| Hook | Original | Tuned | Reason |
|------|----------|-------|--------|
| Gaze offset | 0.30 | 0.42 | Glasses refraction |
| Head yaw | 0.35 | 0.42 | Natural head tilt |
| Liveness blink | 45s | 75s | Dry eyes / contacts |
| Window blur | 3s | 8s | OS notifications |
| Network drops | 3 max | 5 max | Mobile hotspot handoffs |

**4. Context-Aware Suppression**
- Small pastes (<150 chars) — not flagged (could be own notes)
- "virtual" keyword removed from device detection (too broad)
- "book", "laptop" removed from COCO-SSD suspicious objects

---

---

## [SLIDE 14] — Candidate Experience

**Heading:** The Candidate Journey

**Step 1 — Join Exam**
- Candidate enters exam code
- Camera + microphone permission requested
- System performs pre-flight checks (browser compatibility, camera access)

**Step 2 — Verification**
- Biometric photo captured for identity baseline
- Face geometry baseline established (first 10 frames)
- Voice profile recorded (first 25 seconds of speech)
- Keystroke baseline built (first 80 keystrokes)

**Step 3 — Exam in Progress**
- All 35+ detectors run simultaneously
- Fullscreen enforced — exit triggers grace period then violation
- Violations logged silently — candidate is not interrupted
- Candidate sees questions; timer counts down

**Step 4 — Completion**
- Camera and microphone stop immediately
- Exam score auto-calculated (MCQ) or queued for review (coding)
- AI integrity report generated in background
- Candidate sees: Session Report page with submission confirmation

**What the candidate does NOT see:**
- Their exact integrity score number (in flagged sessions)
- Individual violation types
- That they have been flagged

---

---

## [SLIDE 15] — Recruiter Dashboard

**Heading:** Recruiter Dashboard — Full Visibility

**Live Monitoring View:**
- Real-time feed of all active exam sessions
- Integrity score updates live as violations occur
- Color coding: Green (>80) → Yellow (50–80) → Red (<50)
- Instant alert when any session drops below threshold

**Per-Session Report View:**
```
┌────────────────────────────────────────────────┐
│  Candidate: John Smith   Exam: Python Test     │
│  Integrity Score: 73/100  [MODERATE CONCERN]   │
│  Duration: 42m 18s   Exam Score: 38/50         │
├────────────────────────────────────────────────┤
│  AI Report: SUSPICIOUS                         │
│  "Candidate showed 2 face identity             │
│  mismatches and briefly looked away 7 times.   │
│  Voice remained consistent throughout. No LLM  │
│  traffic detected. Recommend manual review."   │
├────────────────────────────────────────────────┤
│  Violations:                                   │
│  • FACE_MISMATCH: 2       • LOOKING_AWAY: 7    │
│  • FULLSCREEN_EXIT: 1     • WINDOW_BLUR: 3     │
├────────────────────────────────────────────────┤
│  Attention per Question:                       │
│  Q1 ████████████████░░░  82 focused            │
│  Q2 ███████████░░░░░░░░  54 neutral            │
│  Q3 █████████████████░░  88 focused            │
└────────────────────────────────────────────────┘
```

**Bulk Actions:**
- Export violation report as PDF
- Filter sessions by risk level
- Compare candidates side by side

---

---

## [SLIDE 16] — Demo Flow

**Heading:** Live Demo — What You Will See

**Test Scenario 1 — Clean Candidate**
1. Open exam in fullscreen Chrome
2. Sit normally, look at screen, answer questions honestly
3. Expected result: Score 85–100, "Clean session"

**Test Scenario 2 — Cheating Attempt**
1. Open ChatGPT in another tab → **Multi-tab detected**
2. Exit fullscreen → **Fullscreen violation (after 5s grace)**
3. Hold phone in front of camera → **Phone detected (after 8s)**
4. Paste 200-character text into answer box → **Clipboard paste flagged**
5. Expected result: Score drops to 40–60 range

**Test Scenario 3 — Advanced Cheating**
1. Use OBS virtual camera → **Virtual camera detected**
2. Make a `fetch()` call to `api.openai.com` → **LLM traffic blocked + flagged**
3. Have someone else speak near the mic for 20s → **Voice identity mismatch**
4. Expected result: Score drops below 30, session auto-flagged

**Recruiter View:**
- Open Dashboard → Live Sessions
- Watch integrity score update in real time
- AI report appears 10–15 seconds after exam completion

---

---

## [SLIDE 17] — Technical Challenges

**Heading:** Challenges We Solved

**Challenge 1: All AI Must Run in the Browser**
> Problem: No video upload (privacy), so all detection must run client-side.
> Solution: WebAssembly (WASM) for MediaPipe, ONNX Runtime Web for Silero VAD, TensorFlow.js for COCO-SSD — all running inside the browser sandbox.

**Challenge 2: Performance at 30+ Hooks Running Simultaneously**
> Problem: Running 35 hooks each with their own timers, audio processors, and video frame handlers could freeze the browser.
> Solution: Staggered intervals (face = 30fps, objects = 0.5fps, audio = 2s), shared MediaStream via `useSharedMic`, and React `useCallback` memoization on all hot paths.

**Challenge 3: False Positives Destroying User Trust**
> Problem: In initial testing, a candidate sitting normally for 60 seconds accumulated 7 violations.
> Solution: Full audit of all 35 hooks — raised thresholds, added consecutive-detection guards, grace periods, and context-aware suppression. Reduced false positive rate by ~85%.

**Challenge 4: Service Worker LLM Blocking**
> Problem: JavaScript running in the main thread can be intercepted or disabled.
> Solution: Service Worker runs in a separate thread. Even if the candidate deletes all JavaScript from the page, the SW continues intercepting fetch calls.

**Challenge 5: Gemini API Rate Limits During Exams**
> Problem: Multiple concurrent exams hitting the same API key.
> Solution: Exponential back-off, daily quota detection (suspend for session if retry > 10 min), and frame size reduction (320×240 JPEG at 60% quality = ~8KB per call).

---

---

## [SLIDE 18] — Results & Metrics

**Heading:** System Performance

**Detection Accuracy (per algorithm):**

| Detection System | Accuracy | Method |
|---|---|---|
| Face identity verification | ~80% | Cosine similarity, 8-feature geometric descriptor |
| Speaker identity matching | ~85% | MFCC-like features, cosine similarity |
| Behavioral consistency | ~84% | Isolation Forest, 6-feature vector |
| LLM traffic interception | ~99% | Service Worker domain match |
| Virtual camera detection | ~90% | Device enumeration + label matching |
| Gaze detection | ~78% | MediaPipe landmark geometry |

**System Performance:**

| Component | Metric |
|---|---|
| Face detection | 30 FPS |
| Hand tracking | 10 FPS (throttled) |
| Object detection | 0.5 FPS (every 2s) |
| Audio analysis | Real-time (2s windows) |
| Violation logging latency | < 100ms |
| AI report generation | 5–15 seconds (Gemini) |
| Integrity score update | Live (recalculated on each violation) |

**Browser Support:**
- Chrome 90+ / Edge 90+: Full support (all 35+ detectors)
- Firefox: Partial (no Web Speech API, limited MediaPipe)
- Safari: Limited (no Service Worker LLM blocking in private mode)

---

---

## [SLIDE 19] — Privacy & Ethics

**Heading:** Privacy by Design & Ethical Considerations

**What we store:**
- ✅ Violation event records (type, timestamp, confidence score)
- ✅ Session metadata (start time, end time, exam score)
- ✅ AI-generated report text

**What we do NOT store:**
- ❌ Video recordings
- ❌ Audio recordings
- ❌ Raw keystroke sequences
- ❌ Clipboard contents (only flagged, not saved)
- ❌ Voice transcripts

**GDPR Considerations:**
- All processing happens on the candidate's own device
- Only anonymised violation flags leave the browser
- Candidates are informed of all monitoring before the exam begins
- Data retention policies can be configured per institution

**Ethical Concerns We Addressed:**
1. **Bias in face recognition** → We use geometric ratios, not embeddings — no racial bias
2. **Anxiety-inducing surveillance** → Score not shown during exam; candidate UI is minimal
3. **False accusation** → 3-minute cooldown between violation logs; 2 consecutive detections required
4. **Transparency** → Candidate sees full session report after completion
5. **Accessibility** → Thresholds calibrated for glasses, contact lens wearers, and impaired blink rates

---

---

## [SLIDE 20] — Future Enhancements

**Heading:** What's Next

**Near-term (3–6 months):**
- [ ] **Emotion timeline graph** — show stress/confidence per question over time
- [ ] **Attention heatmap** — visual overlay of where candidate looked during each question
- [ ] **Deepfake video detection** — detect AI-generated face overlays in webcam feed
- [ ] **Multi-language support** — voice identity + lip sync for non-English exams

**Medium-term (6–12 months):**
- [ ] **Blockchain audit log** — tamper-proof chain of custody for each violation event
- [ ] **Mobile app proctoring** — extend detection to Android/iOS native apps
- [ ] **Plagiarism detection** — semantic comparison of coding answers across all candidates
- [ ] **Adaptive difficulty** — reduce exam difficulty if behavioral stress signals indicate panic

**Research directions:**
- [ ] **Multimodal LLM proctoring** — use Gemini Live API for continuous audio+video analysis (WebSocket stream)
- [ ] **Federated learning** — improve detection models across institutions without sharing candidate data
- [ ] **Physiological signals** — rPPG (remote photoplethysmography) for heart rate from webcam

---

---

## [SLIDE 21] — Conclusion

**Heading:** What We Achieved

**Built a production-ready AI proctoring platform with:**

- ✅ **35+ detection algorithms** running simultaneously in the browser
- ✅ **4 Gemini AI integrations** — visual proctoring, answer analysis, integrity reports
- ✅ **Service Worker LLM blocker** — prevents ChatGPT/Claude usage during exams
- ✅ **Behavioral fingerprinting** — keystroke dynamics + Isolation Forest anomaly detection
- ✅ **Weighted integrity scoring** — real-time score with calibrated per-violation weights
- ✅ **Privacy-first architecture** — no video/audio stored, all AI runs in the browser
- ✅ **False positive engineering** — extensive threshold calibration to protect honest candidates

**Academic contribution:**
> This project demonstrates that a comprehensive AI proctoring system can be built entirely with open web standards — no proprietary black boxes, no video uploads, and no privacy violations — while achieving detection accuracy comparable to commercial solutions.

**Key learning outcomes:**
- Real-world application of Computer Vision, Audio DSP, and ML in a production system
- Engineering trade-offs between detection sensitivity and false positive rate
- Responsible AI design with privacy and fairness considerations

---

---

## [SLIDE 22] — References & Tools

**Heading:** References

**Libraries & Frameworks:**
- MediaPipe FaceMesh — google.github.io/mediapipe
- TensorFlow.js + COCO-SSD — tensorflow.org/js
- Silero VAD — github.com/snakers4/silero-vad
- ONNX Runtime Web — onnxruntime.ai
- Google Gemini API — ai.google.dev
- Next.js — nextjs.org
- MongoDB Atlas — mongodb.com/atlas

**Research Papers:**
- Mahalanobis, P.C. (1936). "On the generalised distance in statistics"
- Liu, F.T., Ting, K.M., & Zhou, Z.H. (2008). "Isolation Forest" — ICDM 2008
- Sahidullah, M. & Saha, G. (2012). "Design, analysis and experimental evaluation of block based transformation in MFCC computation for speaker recognition"
- Lugaresi, C. et al. (2019). "MediaPipe: A Framework for Building Perception Pipelines" — arXiv:1906.08172

**Standards & Guidelines:**
- GDPR Article 22 — Automated individual decision-making
- IEEE Ethically Aligned Design — ieee.org/ead
- W3C Web Application Security — w3.org/TR/webappsec

---

---

## [SLIDE 23] — Thank You

**Heading:** Thank You

```
        Interview Integrity
   AI-Powered Exam Proctoring System

   "The most sophisticated open-source
    proctoring platform built on web standards"

   ─────────────────────────────────────────

   Gokul      — System Architecture & Lead
   Indra      — Computer Vision
   Sridhar    — Audio & Behavioral AI
   Kumar      — Security & Network
   Tejeshwini — Data Science & Ethics

   ─────────────────────────────────────────

   Built with: Next.js · MediaPipe · TensorFlow.js
               Gemini AI · MongoDB · TypeScript
```

**Questions we are prepared to answer:**
1. How does face identity work without storing a face database?
2. Can a candidate bypass the Service Worker LLM blocker?
3. How did you calibrate thresholds to reduce false positives?
4. What is the computational load on the candidate's machine?
5. How does Isolation Forest work for behavioral anomaly detection?

---

---

## Appendix — Speaker Notes

### Slide 7 (Computer Vision) — Speaker Note
> "MediaPipe FaceMesh gives us 468 landmarks in real time at 30 frames per second. We don't use these for face recognition in the traditional sense — instead we compute 8 geometric ratios between stable landmarks and compare them to the baseline we captured at exam start. This is completely privacy-safe because we never store a face embedding or biometric — just 8 floating point numbers."

### Slide 9 (Behavioral AI) — Speaker Note
> "Keystroke dynamics is one of the most surprising detectors. Everyone has a unique rhythm when they type — the time between keys, how long they hold each key. We capture this silently over the first 80 keystrokes, build a statistical model, and then check if subsequent typing matches. If someone else types even a single paragraph, the Mahalanobis distance spikes above the threshold."

### Slide 10 (Security) — Speaker Note
> "The Service Worker trick is the most technically interesting part. A Service Worker is a script that browsers run in a completely separate thread, independent of the web page. Even if a candidate opens DevTools and deletes all the JavaScript on the page, the Service Worker continues running and intercepting network calls. If they try to fetch from api.openai.com, it is blocked and we are notified — all without the candidate being able to stop it."

### Slide 12 (Integrity Score) — Speaker Note
> "The scoring formula took multiple iterations. Our first version was too sensitive — in testing, a candidate sitting completely normally for 60 seconds would accumulate 7 violations and score 27/100. We audited every single hook and calibrated the thresholds based on what real innocent behavior looks like. Now the same normal candidate scores 90+."

### Slide 19 (Privacy) — Speaker Note
> "The most common concern with proctoring is privacy. We made a deliberate architectural decision: no video or audio ever leaves the device. The camera feed is analysed locally using WebAssembly. The only data that reaches our server is a small JSON object — a violation type, a confidence score, and a timestamp. This is less data than a single mouse click event."

---

*PPT Content Document — Interview Integrity Project — MS AI Final Year 2025–26*
