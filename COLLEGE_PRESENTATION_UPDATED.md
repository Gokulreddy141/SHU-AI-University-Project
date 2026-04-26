# AI-Powered Interview Integrity Platform

This markdown contains updated college PPT content based on the current codebase.

## Recommended Deck Structure
- Main presentation: Slides 1 to 22
- Technical backup appendix: A1 to A9

## Pitch Brief Alignment
This presentation should directly match the group pitch brief:
- **The Problem (2-3 mins)**: Slides 3 to 5
- **Your Solution (2-3 mins)**: Slides 6 to 18
- **LIVE Demonstration (5-7 mins)**: Slide 19
- **Evaluation & Impact (3-5 mins)**: Slide 20
- **The Future / Your Ask (2 mins)**: Slide 21
- **Close and transition to Q&A**: Slide 22
- **Q&A**: 5 minutes

## Main Presentation

### Slide 1 - Title
**AI-Powered Interview Integrity Platform**
- Master's final year project
- A full-stack platform for secure online exams and interview workflows
- Combines browser AI, live monitoring, analytics, and audit tooling

### Slide 2 - Project Team
- **Member 1: Team Lead & System Architect** - Gokul
- **Member 2: Computer Vision Engineer** - Indra
- **Member 3: Audio & Behavioral AI Specialist** - Sridhar
- **Member 4: System Security & Network Engineer** - Kumar
- **Member 5: Data Scientist & Ethics Lead** - Tejeshwini

### Slide 3 - Abstract
- This project proposes a browser-based assessment platform that verifies candidate identity, monitors integrity risks in real time, and gives recruiters actionable evidence instead of only raw webcam footage.
- The current system supports exams, coding tests, and live interview stages inside one connected workflow.

### Slide 4 - Problem Statement
- Remote exams and interviews are vulnerable to impersonation, tab switching, hidden devices, virtual cameras, external help, and AI-assisted cheating.
- Manual invigilation does not scale well when many candidates are being assessed at the same time.
- Recruiters need explainable evidence, not just suspicion.
- Modern cheating patterns now include synthetic audio, LLM-generated answers, second screens, and browser-level bypass attempts.

### Slide 5 - Project Objectives
- Verify that the correct candidate is present before the session starts.
- Monitor candidate behavior continuously during the session.
- Combine multiple signals instead of depending on one detector.
- Generate an explainable integrity score and session evidence.
- Help recruiters review, decide, and advance candidates across stages.
- Audit and improve the AI systems themselves over time.

### Slide 6 - Proposed Solution
- Build one integrated platform that manages the full assessment lifecycle:
  exam creation, candidate onboarding, monitored execution, review, reporting, and next-stage advancement.
- Use browser-native checks, computer vision, audio analysis, behavioral signals, and Gemini-assisted analysis together.
- Present both automated outputs and human-review tools through dashboards, reports, and timelines.

### Slide 7 - End-to-End Workflow
1. Recruiter creates an exam and configures proctoring settings.
2. Recruiter adds questions and defines stages.
3. Recruiter invites candidates individually or in bulk.
4. Candidate joins using a session code or direct link.
5. Candidate completes biometric verification and system checks.
6. Candidate takes the monitored assessment.
7. Recruiter watches live sessions, reviews alerts, and can contact the candidate if needed.
8. The system stores violations, answers, analytics, and AI-generated summaries.
9. Recruiter reviews the result and can advance the candidate to the next stage.

### Slide 8 - Main User Roles
**Candidate**
- Sign in and access assigned assessments
- Join by code or direct session link
- Complete face capture and optional voice enrollment
- Pass system readiness checks
- Attempt MCQ, coding, and interview stages

**Recruiter**
- Create and manage exams
- Add questions and stages
- Invite and import candidates
- Monitor live sessions
- Review reports, analytics, AI summaries, and audit outputs

### Slide 9 - Candidate Journey
- Candidate signs in and opens `/candidate/verify`.
- Candidate enters a session code or uses a direct session link.
- Candidate captures a face photo and can record a short voice sample.
- Candidate completes a system check for camera, visibility, virtual camera risk, and network readiness.
- Candidate starts the proctored exam.
- During the exam, the platform records violations, tracks integrity score, and saves responses.
- After completion, the session can be reviewed and linked to a future interview stage.

### Slide 10 - Recruiter Journey
- Recruiter signs in to the dashboard and sees metrics plus recent sessions.
- Recruiter creates exams, defines proctoring mode, and sets flagging rules.
- Recruiter authors questions manually or imports them from CSV or Excel.
- Recruiter invites candidates one by one or through bulk upload.
- Recruiter monitors active sessions from the live war room.
- Recruiter opens detailed session pages for evidence review and decision-making.
- Recruiter generates AI integrity reports and advances selected candidates to the next stage.

### Slide 11 - Exam Authoring and Operations
- Exams include title, description, duration, session code, and status.
- Recruiters can set open and close windows for exam availability.
- The system supports an auto-flag threshold based on integrity score.
- Manual question authoring is supported through the UI.
- Bulk question import is supported through CSV and Excel templates.
- Candidate onboarding supports both manual invitation and bulk import.

### Slide 12 - Proctoring Modes
The codebase currently supports three monitoring modes:

**Light**
- Basic tab-switch and copy-paste detection

**Standard**
- Face detection, gaze tracking, and window focus monitoring

**Strict**
- Full AI monitoring including phone risk, notes, multiple faces, and Gemini-assisted monitoring

### Slide 13 - Stage-Based Assessment Pipeline
- The exam model supports a stage-based hiring flow.
- Current stage types in code:
  `MCQ`, `CODING`, and `LIVE_INTERVIEW`
- Recruiters can schedule the next stage for a candidate.
- Candidate advancement creates a linked next session.
- This makes the project a complete interview workflow system, not just a one-time exam tool.

### Slide 14 - Architecture Overview
**Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

**Browser AI and detection layer**
- MediaPipe FaceMesh and hand tracking
- TensorFlow.js object detection
- Web Audio and speech-based analysis
- Browser APIs for fullscreen, tabs, focus, clipboard, keyboard shortcuts, media devices, and notifications

**Realtime layer**
- WebRTC for direct recruiter-candidate calls during active monitored sessions
- LiveKit for structured live interview rooms
- Periodic webcam snapshot uploads and live AI state updates for recruiter monitoring

**Backend and data layer**
- Next.js API routes
- MongoDB with Mongoose
- Gemini-powered analysis routes
- Reporting and audit records

### Slide 15 - Current Implementation Scale
The current codebase is already large and product-like.

- 65 React hooks across detection, monitoring, data, analytics, and auth
- 57 API routes
- 15 recruiter dashboard pages
- 8 candidate-facing pages
- 42 weighted violation categories in the integrity scoring engine

This is strong evidence that the project goes beyond a prototype and functions as a full platform.

### Slide 16 - AI Proctoring Engine Overview
The integrity model currently tracks 42 weighted violation categories across five groups.

**Face and identity**
- 11 categories
- Examples: looking away, no face, multiple faces, face mismatch, liveness failure

**Audio and voice**
- 5 categories
- Examples: lip-sync mismatch, ambient noise anomaly, voice identity mismatch, synthetic audio detection

**Objects and devices**
- 4 categories
- Examples: phone detected, notes detected, earpiece detected

**Behavior and input**
- 10 categories
- Examples: tab switch, duplicate tab, clipboard paste, typing anomaly, semantic answer anomaly

**System and environment**
- 12 categories
- Examples: virtual camera, screen recording, extension detection, LLM traffic, fullscreen exit, VM or sandbox detection

### Slide 17 - Advanced Detection Features
Compared with the older presentation summary, the current codebase now includes or strengthens:
- Face identity verification linked to biometric enrollment
- Liveness challenge plus passive liveness monitoring
- Voice identity mismatch detection
- Synthetic audio and TTS detection
- Clipboard interception and screenshot-attempt detection
- LLM API traffic detection
- Phone-below-monitor detection
- Room environment change detection
- Behavioral consistency scoring
- Attention score tracking
- Emotion and stress detection
- Semantic answer analysis for AI-written responses

### Slide 18 - Gemini Integration
Gemini is used in multiple parts of the system:
- Frame-level webcam analysis route
- Live Gemini monitoring through WebSocket image and audio streaming
- Advanced prompts for earpiece, smart glasses, second screen, second person, notes, and visible phone risk
- Post-session AI integrity report generation for recruiters
- Answer analysis for likely AI-generated responses using heuristics plus Gemini semantic review

### Slide 19 - LIVE Demonstration
This is the most important part of the pitch. Do not rely on screenshots or videos.

**What to show live**
- Run the project locally
- Join a real candidate session from `/candidate/verify`
- Start the monitored exam flow
- Trigger 2 to 3 visible events such as looking away, tab switch, phone risk, or audio anomaly
- Open `/dashboard/live` and show the recruiter war room updating in real time
- Open the session detail page and show integrity score, violation timeline, AI detector panel, and candidate snapshot

**Key message for the demo**
- The system does not just record video
- It detects signals, updates integrity evidence live, and gives recruiters an actionable review workflow

### Slide 20 - Evaluation & Impact
**Performance**
- The strongest project result to show in the pitch is end-to-end real-time monitoring with a live integrity score generated from **42 weighted violation categories**
- The current implementation also demonstrates strong engineering scale with **65 hooks**, **57 API routes**, and integrated recruiter review tools
- If you have fresh benchmark data from the audit dashboard on presentation day, replace the engineering-scale point with your latest verified latency, compatibility, or benchmark result

**Impact**
- One platform now supports exam creation, proctoring, live monitoring, reporting, and stage-based candidate progression
- This reduces recruiter effort and improves evidence quality compared with manual webcam-only review

**Ethics**
- False positives and bias must be monitored carefully, especially for vision, audio, and behavior-based signals
- Candidates should be informed clearly about monitoring, consent, and review policies
- Sensitive outputs should remain human-in-the-loop; the platform should support recruiter decisions, not fully replace them

### Slide 21 - The Future and Our Ask
- Build a larger validation dataset for measured precision, recall, and false-positive analysis
- Expand fairness testing across different devices, environments, lighting conditions, and speaking styles
- Improve explainability so every major alert includes a clearer human-readable reason
- Pilot the system with more real users and real assessment scenarios
- Our ask: support for broader testing, benchmarking, and pilot deployment so the platform can move from strong prototype to validated production-ready system

### Slide 22 - Conclusion
- This project demonstrates an end-to-end AI-powered interview integrity platform.
- It is not just one model or one detector; it is a connected product for exams and interview workflows.
- The latest version includes candidate onboarding, proctored execution, recruiter operations, live monitoring, Gemini-assisted analysis, analytics, and a full AI audit subsystem.
- Overall, it presents a practical and scalable approach for secure digital assessment in hiring and academic scenarios.

## Technical Appendix

### Slide A1 - Exact 42 Violation Categories
**Face and identity**
- lookingAway
- noFace
- multipleFaces
- faceMismatch
- livenessFailure
- faceProximityAnomaly
- headPoseAnomaly
- blinkPatternAnomaly
- pupilFocusAnomaly
- microGazeAnomaly
- stressDetected

**Audio and voice**
- lipSyncMismatch
- ambientNoise
- voiceActivityAnomaly
- voiceIdentityMismatch
- syntheticAudioDetected

**Objects and devices**
- phoneDetected
- notesDetected
- earpieceDetected
- handGestureAnomaly

**Behavior and input**
- tabSwitch
- duplicateTab
- copyPaste
- clipboardPaste
- keyboardShortcut
- typingAnomaly
- mouseInactivity
- responseTimeAnomaly
- behavioralAnomaly
- semanticAnswerAnomaly

**System and environment**
- virtualCamera
- screenRecordingDetected
- extensionDetected
- devtoolsAccess
- llmDetected
- secondaryMonitor
- environmentChange
- fullscreenExit
- windowBlur
- networkAnomaly
- virtualDeviceDetected
- vmOrSandboxDetected

### Slide A2 - Integrity Scoring Logic
- The system starts from an integrity score of 100.
- Weighted deductions are applied as violations accumulate.
- High-confidence and severe events reduce the score more strongly than noisy events.
- Examples of strong signals in the current scoring logic:
  earpiece detected, screen recording, face mismatch, virtual camera, voice identity mismatch, duplicate tab, semantic answer anomaly
- This gives recruiters a more balanced result than a simple binary cheat flag.

### Slide A3 - Question and Assessment Support
- Supported question types in the current codebase:
  `MCQ` and `CODING`
- MCQ questions support options, correct answer index, and points.
- Coding questions support allowed languages, starter code, expected output, and points.
- Bulk import supports CSV and Excel templates.
- Live interview is supported as a stage type in the exam pipeline.

### Slide A4 - Candidate and Recruiter Operations
**Candidate operations**
- Candidate dashboard
- Verification flow
- Exam participation
- Live interview participation
- Settings page

**Recruiter operations**
- Dashboard metrics
- Exam management
- Candidate management
- Single invite and bulk invite
- Question authoring
- Live monitoring
- Reports
- Audit dashboards
- Settings page

### Slide A5 - Session Data Stored Per Attempt
The session model stores:
- exam, candidate, recruiter, status, stage, and timestamps
- integrity score and total violations
- detailed violation summary
- live webcam snapshot
- live AI state such as gaze direction, speaking state, active alerts, and live integrity estimate
- AI report summary and risk level
- per-question answer analysis
- per-question attention and emotion data
- link to the next stage session after advancement

### Slide A6 - AI Diagnostics and Validation Value
The platform includes a dedicated diagnostics dashboard that is useful for:
- live feature demonstration during presentation
- quick validation of vision and audio signals
- testing look-away, multiple faces, dictation anomaly, phone detection, blink anomaly, and synthesized audio cases

This is academically valuable because it makes the system testable and explainable.

### Slide A7 - Audit Subsystem Details
The audit subsystem includes:
- audit execution controls
- audit results visualization
- audit history
- performance analysis dashboard
- performance trend charts
- bottleneck analysis
- browser compatibility matrix
- recommended configuration view
- compatibility testing tools
- enhancement recommendations
- roadmap visualization

This is a major strength because the project can evaluate and improve its own AI capabilities.

### Slide A8 - Additional Product Modules
The codebase also includes:
- support hub
- FAQ page
- contact and ticket submission flow
- recruiter and candidate settings pages
- analytics pages
- live interview pages for both candidate and recruiter

These modules make the project feel like a deployable product rather than a demo-only build.

### Slide A9 - Suggested Demo Route Order
1. Landing page: `/`
2. Auth page: `/auth`
3. Recruiter dashboard: `/dashboard`
4. Exams page: `/dashboard/exams`
5. Question builder: `/dashboard/exam/[id]/questions`
6. Candidates page: `/dashboard/candidates`
7. Candidate verify page: `/candidate/verify`
8. Live monitoring: `/dashboard/live`
9. Reports: `/dashboard/reports`
10. AI diagnostics: `/dashboard/ai-diagnostics`
11. Audit dashboard: `/dashboard/audit`

## Notes For PPT Creation
- Use the main 22 slides for the actual college presentation.
- Keep the timing centered on the tutor brief: problem, solution, LIVE demo, evaluation and impact, future, then Q&A.
- Use the appendix slides only if the faculty asks technical or implementation questions.
- The strongest differentiator of this project is that it is a full workflow platform with both operational and technical depth.
