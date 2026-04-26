# Team Contribution Guide — Interview Integrity

**MS Artificial Intelligence — Final Year Group Project**

This document contains the exact Git commands each team member needs to run to push their assigned code to the repository. Each member works from their own GitHub account so contributions show up correctly on the graph.

---

## Team Members & Roles

| # | Name | Role | Branch |
|---|------|------|--------|
| 1 | **Gokul** | Team Lead & System Architect | `feature/architecture` |
| 2 | **Indra** | Computer Vision Engineer | `feature/computer-vision` |
| 3 | **Sridhar** | Audio & Behavioral AI Specialist | `feature/audio-behavioral` |
| 4 | **Kumar** | System Security & Network Engineer | `feature/security-network` |
| 5 | **Tejeshwini** | Data Scientist & Ethics Lead | `feature/ai-reporting` |

---

## File Ownership — Who Commits What

### Member 1 — Gokul (Team Lead & System Architect)

```
app/layout.tsx
app/page.tsx
app/globals.css
app/not-found.tsx
app/auth/
app/api/session/
app/api/exam/
app/api/response/
app/api/candidates/
app/api/question/
app/api/user/
app/api/notifications/
app/api/search/
models/
lib/db.ts
lib/apiUtils.ts
lib/integrity.ts
types/
package.json
package-lock.json
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
server.mjs
.gitignore
.env.example
README.md
```

---

### Member 2 — Indra (Computer Vision Engineer)

```
hooks/useFaceIdentityVerification.ts
hooks/useIrisFocusTracking.ts
hooks/useHeadPoseEstimation.ts
hooks/useLivenessDetection.ts
hooks/useFaceProximityDetection.ts
hooks/useObjectDetection.ts
hooks/useHandTracking.ts
hooks/usePhoneBelowMonitorDetection.ts
hooks/useRoomEnvironmentMonitor.ts
app/candidate/exam/[id]/page.tsx
app/candidate/verify/
```

---

### Member 3 — Sridhar (Audio & Behavioral AI Specialist)

```
hooks/useAudioSpoofingDetection.ts
hooks/useAmbientNoiseDetection.ts
hooks/useLipSyncDetection.ts
hooks/useVoiceActivityDetection.ts
hooks/useSileroVAD.ts
hooks/useSpeakerIdentity.ts
hooks/useBehavioralConsistency.ts
hooks/useSharedMic.ts
hooks/useResponseTimeProfiling.ts
app/api/ai/analyze-answer/
app/candidate/exam/[id]/mcq/
app/candidate/exam/[id]/coding/
```

---

### Member 4 — Kumar (System Security & Network Engineer)

```
hooks/useFullScreenEnforcement.ts
hooks/useWindowFocusDetection.ts
hooks/useNetworkMonitor.ts
hooks/useMultiTabDetection.ts
hooks/useSandboxEnvironmentCheck.ts
hooks/useVirtualDeviceDetection.ts
hooks/usePrintScreenDetection.ts
hooks/useLLMTrafficDetection.ts
hooks/useClipboardInterception.ts
hooks/useKeystrokeDynamics.ts
hooks/useScreenRecordingDetection.ts
public/sw.js
app/api/violation/
app/api/session/[id]/snapshot/
app/api/webrtc/
app/api/biometric/
```

---

### Member 5 — Tejeshwini (Data Scientist & Ethics Lead)

```
hooks/useGeminiMonitoring.ts
hooks/useGeminiLiveMonitoring.ts
hooks/useMouseBehaviorAnalysis.ts
lib/gemini.ts
app/api/ai/monitor/
app/api/ai/integrity-report/
app/api/reports/
app/api/dashboard/
app/dashboard/
app/candidate/dashboard/
app/candidate/exam/[id]/complete/
app/candidate/settings/
app/support/
scripts/
```

---

## Step-by-Step Git Commands

> Each member runs these commands **on their own laptop**, logged into **their own GitHub account**.

---

### Step 1 — First-time Setup (run once)

```bash
# Install Git if not already installed
# Download from: https://git-scm.com/downloads

# Verify Git is installed
git --version

# Set your global identity (use YOUR name and email linked to YOUR GitHub account)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Verify identity is set correctly
git config --global user.name
git config --global user.email
```

---

### Step 2 — Clone the Repository

```bash
# Clone the repo (same URL for all members)
git clone https://github.com/gokulreddy0079/interview-integrity.git

# Enter the project folder
cd interview-integrity
```

---

### Step 3 — Verify You Are on main

```bash
# Check current branch
git branch

# If not on main, switch to it
git checkout main

# Pull latest changes from GitHub
git pull origin main
```

---

### Step 4 — Create Your Feature Branch

Each member creates their own branch. Use the exact branch name from the table above.

**Member 1 — Gokul:**
```bash
git checkout -b feature/architecture
```

**Member 2 — Indra:**
```bash
git checkout -b feature/computer-vision
```

**Member 3 — Sridhar:**
```bash
git checkout -b feature/audio-behavioral
```

**Member 4 — Kumar:**
```bash
git checkout -b feature/security-network
```

**Member 5 — Tejeshwini:**
```bash
git checkout -b feature/ai-reporting
```

---

### Step 5 — Copy Your Files Into the Project

Copy only the files listed under your name in the **File Ownership** section above into the correct folders inside the `interview-integrity/` directory.

---

### Step 6 — Stage Your Files

> **Important:** Only add the files assigned to you. Do NOT use `git add .` as it will add everyone's files.

**Member 1 — Gokul:**
```bash
git add app/layout.tsx
git add app/page.tsx
git add app/globals.css
git add app/not-found.tsx
git add app/auth/
git add app/api/session/
git add app/api/exam/
git add app/api/response/
git add app/api/candidates/
git add app/api/question/
git add app/api/user/
git add app/api/notifications/
git add app/api/search/
git add models/
git add lib/db.ts
git add lib/apiUtils.ts
git add lib/integrity.ts
git add types/
git add package.json
git add package-lock.json
git add next.config.ts
git add tsconfig.json
git add postcss.config.mjs
git add eslint.config.mjs
git add server.mjs
git add .gitignore
git add README.md
git add CONTRIBUTING.md
```

**Member 2 — Indra:**
```bash
git add hooks/useFaceIdentityVerification.ts
git add hooks/useIrisFocusTracking.ts
git add hooks/useHeadPoseEstimation.ts
git add hooks/useLivenessDetection.ts
git add hooks/useFaceProximityDetection.ts
git add hooks/useObjectDetection.ts
git add hooks/useHandTracking.ts
git add hooks/usePhoneBelowMonitorDetection.ts
git add hooks/useRoomEnvironmentMonitor.ts
git add "app/candidate/exam/[id]/page.tsx"
git add app/candidate/verify/
```

**Member 3 — Sridhar:**
```bash
git add hooks/useAudioSpoofingDetection.ts
git add hooks/useAmbientNoiseDetection.ts
git add hooks/useLipSyncDetection.ts
git add hooks/useVoiceActivityDetection.ts
git add hooks/useSileroVAD.ts
git add hooks/useSpeakerIdentity.ts
git add hooks/useBehavioralConsistency.ts
git add hooks/useSharedMic.ts
git add hooks/useResponseTimeProfiling.ts
git add app/api/ai/analyze-answer/
git add "app/candidate/exam/[id]/mcq/"
git add "app/candidate/exam/[id]/coding/"
```

**Member 4 — Kumar:**
```bash
git add hooks/useFullScreenEnforcement.ts
git add hooks/useWindowFocusDetection.ts
git add hooks/useNetworkMonitor.ts
git add hooks/useMultiTabDetection.ts
git add hooks/useSandboxEnvironmentCheck.ts
git add hooks/useVirtualDeviceDetection.ts
git add hooks/usePrintScreenDetection.ts
git add hooks/useLLMTrafficDetection.ts
git add hooks/useClipboardInterception.ts
git add hooks/useKeystrokeDynamics.ts
git add hooks/useScreenRecordingDetection.ts
git add public/sw.js
git add app/api/violation/
git add "app/api/session/[id]/snapshot/"
git add app/api/webrtc/
git add app/api/biometric/
```

**Member 5 — Tejeshwini:**
```bash
git add hooks/useGeminiMonitoring.ts
git add hooks/useGeminiLiveMonitoring.ts
git add hooks/useMouseBehaviorAnalysis.ts
git add lib/gemini.ts
git add app/api/ai/monitor/
git add app/api/ai/integrity-report/
git add app/api/reports/
git add app/api/dashboard/
git add app/dashboard/
git add app/candidate/dashboard/
git add "app/candidate/exam/[id]/complete/"
git add app/candidate/settings/
git add app/support/
git add scripts/
```

---

### Step 7 — Check What You Are About to Commit

```bash
# See all staged files before committing
git status

# See exactly what changed in staged files
git diff --staged
```

---

### Step 8 — Commit Your Work

Use a clear commit message that describes your contribution.

**Member 1 — Gokul:**
```bash
git commit -m "feat: project architecture, API routes, data models, and integrity scoring engine"
```

**Member 2 — Indra:**
```bash
git commit -m "feat: computer vision hooks - face detection, gaze tracking, hand tracking, object detection"
```

**Member 3 — Sridhar:**
```bash
git commit -m "feat: audio and behavioral AI - voice detection, lip sync, speaker identity, keystroke profiling"
```

**Member 4 — Kumar:**
```bash
git commit -m "feat: security and network monitoring - virtual device detection, multi-tab, service worker LLM blocker"
```

**Member 5 — Tejeshwini:**
```bash
git commit -m "feat: AI reporting pipeline - Gemini integrity reports, dashboard analytics, session completion"
```

---

### Step 9 — Push Your Branch to GitHub

```bash
# Push your branch (replace branch name with yours)
git push origin feature/architecture      # Gokul
git push origin feature/computer-vision   # Indra
git push origin feature/audio-behavioral  # Sridhar
git push origin feature/security-network  # Kumar
git push origin feature/ai-reporting      # Tejeshwini
```

If GitHub asks for login, sign in with **your own GitHub account credentials**.

---

### Step 10 — Create a Pull Request on GitHub

1. Go to `https://github.com/gokulreddy0079/interview-integrity`
2. You will see a **"Compare & pull request"** banner — click it
3. Set:
   - **base:** `main`
   - **compare:** your feature branch
4. Title: use the same message as your commit
5. Click **"Create pull request"**
6. The Team Lead (Gokul) approves and merges each PR

---

### Step 11 — After Your PR is Merged, Clean Up

```bash
# Switch back to main
git checkout main

# Pull the merged changes
git pull origin main

# Delete your local feature branch (optional, keeps things tidy)
git branch -d feature/computer-vision
```

---

## Keeping Your Branch Updated

If `main` gets new commits from other members while you are still working, sync your branch:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Switch back to your branch
git checkout feature/your-branch-name

# Merge latest main into your branch
git merge main

# If there are merge conflicts, fix them in the files, then:
git add .
git commit -m "merge: sync with main"
```

---

## Useful Commands Reference

```bash
# See all branches (local and remote)
git branch -a

# See commit history
git log --oneline --graph

# See who changed what
git log --oneline --author="Indra"

# Undo last commit (keeps files, un-commits only)
git reset --soft HEAD~1

# Check which account Git is using
git config user.name
git config user.email

# See remote URL
git remote -v

# Discard changes to a specific file (careful — cannot undo)
git checkout -- hooks/useHandTracking.ts
```

---

## Important Rules

1. **Never commit `.env.local`** — it contains secret API keys. It is already in `.gitignore`.
2. **Never use `git add .`** unless you are Gokul doing the initial setup commit — it will stage everyone's files.
3. **One branch per person** — do not push to another member's branch.
4. **Always pull before you start working** — avoids merge conflicts.
5. **Commit messages must be descriptive** — one-word messages like "update" or "fix" are not acceptable.

---

## .env.example (Share This Instead of .env.local)

Each member needs to create their own `.env.local` file with these values filled in:

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string_here

# Gemini AI (Google)
GEMINI_API_KEY=your_gemini_api_key_here

# NextAuth / App
NEXTAUTH_SECRET=any_random_32_character_string
NEXTAUTH_URL=http://localhost:3000

# LiveKit (optional — for video interviews)
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url_here
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_secret_here
```

Get the `MONGODB_URI` and `GEMINI_API_KEY` from Gokul directly over WhatsApp/message — never post keys in GitHub issues or chat.

---

*Last updated: April 2026 — Interview Integrity Project Team*
