# 🤖 AI-Powered Interview Integrity Platform

**MS Artificial Intelligence Final Year Project**

An advanced online examination and interview proctoring system powered by 29+ AI detection algorithms, real-time computer vision, audio analysis, and behavioral analytics.

---

## 🎯 Project Overview

This platform demonstrates cutting-edge AI capabilities for maintaining academic integrity in remote examinations and interviews. It combines multiple AI technologies to detect cheating attempts, verify candidate identity, and provide real-time monitoring.

### Key Features

- **Real-time AI Proctoring**: 29+ detection algorithms running simultaneously
- **Computer Vision**: Face detection, gaze tracking, gesture recognition, object detection
- **Audio Analysis**: Voice activity, ambient noise, TTS detection, lip-sync verification
- **Behavioral Analytics**: Keystroke dynamics, mouse patterns, response time profiling
- **System Monitoring**: Virtual camera, screen recording, multi-tab, DevTools detection
- **Live Video Interviews**: WebRTC-based real-time communication
- **Integrity Scoring**: Weighted algorithm calculating exam integrity (0-100)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Modern browser (Chrome/Edge recommended for full AI support)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
# Create .env.local with:
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url (optional)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Verify AI Features

```bash
node scripts/verify-ai-features.js
```

---

## 🤖 AI Technologies Used

| Technology | Purpose | Implementation |
|------------|---------|----------------|
| **MediaPipe FaceMesh** | 468-point facial landmark detection | Face detection, gaze tracking, blink analysis |
| **MediaPipe Hands** | 21-point hand landmark detection | Phone detection, gesture recognition |
| **TensorFlow.js** | Object detection (COCO-SSD) | Unauthorized materials detection |
| **Web Speech API** | Voice activity recognition | Speech detection (privacy-safe) |
| **Web Audio API** | Audio analysis | Ambient noise, TTS detection |
| **LiveKit** | WebRTC video conferencing | Real-time interviews |
| **Custom ML Algorithms** | Behavioral analysis | Keystroke, mouse, response time profiling |

---

## 📋 AI Capabilities (29+ Detection Systems)

### Vision-Based AI
1. ✅ Face Detection & Counting
2. ✅ Biometric Face Recognition
3. ✅ Gaze Direction Tracking
4. ✅ Head Pose Estimation (Pitch/Yaw/Roll)
5. ✅ Micro-Gaze Tracking (Pupil Focus)
6. ✅ Blink Frequency Analysis
7. ✅ Lip Movement Detection
8. ✅ Hand Gesture Tracking
9. ✅ Object Detection (Phone, Books, Laptop)
10. ✅ Face Proximity Detection
11. ✅ Liveness Detection

### Audio-Based AI
12. ✅ Voice Activity Detection
13. ✅ Ambient Noise Analysis
14. ✅ Audio Spoofing Detection (TTS)
15. ✅ Lip-Sync Mismatch Detection

### Behavioral AI
16. ✅ Keystroke Dynamics Analysis
17. ✅ Mouse Behavior Profiling
18. ✅ Response Time Anomaly Detection
19. ✅ Typing Pattern Analysis

### System-Level AI
20. ✅ Virtual Camera Detection
21. ✅ Virtual Device Detection
22. ✅ Browser Fingerprinting
23. ✅ Extension Detection
24. ✅ DevTools Detection
25. ✅ Screen Recording Detection
26. ✅ Multi-Tab Detection
27. ✅ Network Anomaly Detection
28. ✅ Sandbox/VM Detection
29. ✅ Hardware Spoofing Detection

---

## 🎓 Testing & Demonstration

### For Project Presentation

1. **AI Diagnostics Dashboard**: `/dashboard/ai-diagnostics`
   - Real-time testing environment for all AI hooks
   - Visual indicators for each detection system
   - Perfect for live demonstrations

2. **Live Monitoring**: `/dashboard/live`
   - War room view of all active sessions
   - Real-time violation alerts
   - Color-coded integrity status

3. **Complete Test Guide**: See `AI_CAPABILITIES_TEST_CHECKLIST.md`
   - Step-by-step testing procedures
   - Expected results for each feature
   - 5-minute demo script for presentations

### Quick Demo Flow

```bash
# 1. Start the application
npm run dev

# 2. Create accounts
- Recruiter: admin@test.com
- Candidate: candidate@test.com

# 3. Navigate to AI Diagnostics
http://localhost:3000/dashboard/ai-diagnostics

# 4. Test AI features:
- Look away → Gaze tracking triggers
- Hold phone → Object detection triggers
- Speak → Voice activity triggers
- Play TTS audio → Spoofing detection triggers
- Multiple people → Face counting triggers
```

---

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes (exam, session, violation, etc.)
│   ├── dashboard/        # Recruiter dashboard
│   │   ├── ai-diagnostics/  # AI testing environment
│   │   ├── live/            # Live monitoring
│   │   └── reports/         # Analytics & reports
│   └── candidate/        # Candidate exam interface
├── components/
│   ├── features/         # AI components (CameraFeed, BiometricCapture, etc.)
│   └── layout/           # Layout components
├── hooks/                # 29+ AI detection hooks
│   ├── useVoiceActivityDetection.ts
│   ├── useLipSyncDetection.ts
│   ├── useHandTracking.ts
│   ├── useObjectDetection.ts
│   └── ... (25+ more)
├── lib/
│   ├── integrity.ts      # Integrity score algorithm
│   └── db.ts            # MongoDB connection
├── models/               # MongoDB schemas
└── scripts/
    └── verify-ai-features.js  # Feature verification script
```

---

## 🎯 Integrity Score Algorithm

The system calculates a real-time integrity score (0-100) based on weighted violations:

- **High Severity** (-30 to -50): Face mismatch, virtual camera, screen recording
- **Medium Severity** (-10 to -20): Lip-sync mismatch, unauthorized materials
- **Low Severity** (-2 to -5): Looking away, tab switching, window blur

See `lib/integrity.ts` for complete algorithm.

---

## 🔒 Privacy & Ethics

- ✅ Voice transcripts are NEVER stored (only detection flags)
- ✅ Face embeddings used only for verification
- ✅ GDPR-compliant design
- ✅ Candidates informed of all monitoring
- ✅ Data retention policies implemented

---

## 🐛 Known Limitations

1. **Browser Compatibility**
   - Web Speech API: Chrome/Edge only
   - MediaPipe: Best performance on Chrome
   - Safari: Limited AI support

2. **Performance**
   - High CPU usage with all AI hooks enabled
   - Recommended: 8GB RAM, modern GPU

3. **False Positives**
   - Gaze tracking: Glasses may affect accuracy
   - Object detection: 60% confidence threshold

---

## 📊 Performance Metrics

- **Face Detection**: 30 FPS (MediaPipe)
- **Hand Tracking**: 10 FPS (throttled for performance)
- **Object Detection**: 0.5 FPS (every 2 seconds)
- **Audio Analysis**: Real-time (60 FPS)
- **Violation Logging**: < 100ms latency

---

## 🚀 Future Enhancements

- [ ] Face recognition matching (face-api.js)
- [ ] Emotion detection (happiness, stress, confusion)
- [ ] Pose estimation for body language
- [ ] GPT integration for answer evaluation
- [ ] Plagiarism detection for coding questions
- [ ] Blockchain for tamper-proof audit logs

---

## 📚 Documentation

- **Complete Testing Guide**: `AI_CAPABILITIES_TEST_CHECKLIST.md`
- **API Documentation**: See `/app/api/` route files
- **Hook Documentation**: See individual hook files in `/hooks/`

---

## 🎓 Academic Context

**Course**: MS Artificial Intelligence  
**Purpose**: Final Year Project  
**Focus**: Demonstrating AI capabilities in real-world application  
**Technologies**: Computer Vision, Audio Processing, Machine Learning, Behavioral Analytics

---

## 📝 License

This project is for academic purposes only.

---

## 🤝 Support

For questions or issues:
1. Check `AI_CAPABILITIES_TEST_CHECKLIST.md`
2. Run `node scripts/verify-ai-features.js`
3. Review browser console for AI initialization errors

---

**Built with Next.js 16, React 19, TypeScript, TensorFlow.js, MediaPipe, and MongoDB**
