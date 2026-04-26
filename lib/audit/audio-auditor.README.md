# Audio AI Auditor

## Overview

The `AudioAIAuditor` class validates all 4 audio-based AI detection systems in the proctoring platform. It tests initialization, functionality, and integration with Web Speech API and Web Audio API.

## Validated Systems

### 1. Voice Activity Detection
- **System ID**: `voice-activity`
- **Technology**: Web Speech API (Chrome/Edge)
- **Purpose**: Detects recognizable speech near the candidate
- **Tests**:
  - Web Speech API availability
  - SpeechRecognition instantiation
  - Configuration options (continuous, interimResults, lang)

### 2. Ambient Noise Analysis
- **System ID**: `ambient-noise`
- **Technology**: Web Audio API (AudioContext)
- **Purpose**: Monitors sustained background noise levels
- **Tests**:
  - Web Audio API availability
  - AudioContext initialization
  - AnalyserNode creation and FFT configuration

### 3. TTS Detection (Audio Spoofing)
- **System ID**: `tts-detection`
- **Technology**: Web Audio API (frequency analysis)
- **Purpose**: Detects synthetic/text-to-speech audio
- **Tests**:
  - Frequency analysis capability
  - Audio feature extraction (variance, mean, standard deviation)
  - Statistical analysis for spoofing detection

### 4. Lip-Sync Verification
- **System ID**: `lip-sync`
- **Technology**: MediaPipe FaceMesh + Web Audio API
- **Purpose**: Verifies audio matches lip movements
- **Tests**:
  - MediaPipe FaceMesh availability for lip tracking
  - Mouth landmark configuration (upper/lower lip centers)
  - Web Audio API integration for cross-reference

## Usage

```typescript
import { AudioAIAuditor } from '@/lib/audit/audio-auditor';

const auditor = new AudioAIAuditor();

// Validate individual systems
const voiceResult = await auditor.validateVoiceActivity();
const noiseResult = await auditor.validateAmbientNoise();
const ttsResult = await auditor.validateAudioSpoofing();
const lipSyncResult = await auditor.validateLipSync();

// Validate all audio systems
const results = await Promise.all([
  auditor.validateVoiceActivity(),
  auditor.validateAmbientNoise(),
  auditor.validateAudioSpoofing(),
  auditor.validateLipSync(),
]);
```

## Validation Results

Each validation method returns a `ValidationResult` object:

```typescript
interface ValidationResult {
  systemId: string;           // e.g., 'voice-activity'
  systemName: string;         // e.g., 'Voice Activity Detection'
  status: 'pass' | 'fail' | 'warning';
  timestamp: Date;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performanceMetrics?: PerformanceMetrics;
}
```

## Browser Compatibility

### Full Support
- **Chrome 90+**: All audio systems fully supported
- **Edge 90+**: All audio systems fully supported

### Partial Support
- **Firefox 88+**: Web Audio API supported, Web Speech API not available
- **Safari 14+**: Web Audio API supported, Web Speech API not available

### Graceful Degradation
The auditor detects browser capabilities and reports failures with detailed error messages when APIs are unavailable.

## Performance Targets

| System | Frame Rate | Latency | Memory Threshold |
|--------|-----------|---------|------------------|
| Voice Activity | 60 FPS | 16ms | 50 MB |
| Ambient Noise | 60 FPS | 16ms | 50 MB |
| TTS Detection | 60 FPS | 16ms | 50 MB |
| Lip-Sync | 30 FPS | 33ms | 50 MB |

## Implementation Details

### Voice Activity Detection
- Uses Web Speech API's `SpeechRecognition` interface
- Continuous recognition with interim results
- Privacy-focused: only detects speech presence, never stores transcripts
- Auto-restart mechanism for Chrome's silence timeout

### Ambient Noise Analysis
- Uses Web Audio API's `AudioContext` and `AnalyserNode`
- FFT size: 512 for real-time analysis
- Samples audio every 200ms
- Calculates RMS (Root Mean Square) for noise level
- Flags sustained noise above threshold (8 seconds)

### TTS Detection
- Uses frequency analysis to detect synthetic audio patterns
- Heuristic 1: Perfect silence detection (virtual audio cables)
- Heuristic 2: Low variance detection (TTS constant amplitude)
- Analyzes 30-second sliding window of audio data
- Statistical features: mean, variance, standard deviation

### Lip-Sync Verification
- Integrates MediaPipe FaceMesh mouth landmarks with audio analysis
- Tracks lip distance variation (upper lip center vs lower lip center)
- Cross-references with ambient noise audio levels
- Flags mismatch: audio detected but no lip movement (3 seconds)
- Sliding window of 30 frames for lip movement calculation

## Error Handling

The auditor handles errors gracefully:

1. **API Unavailability**: Reports specific API missing (Web Speech, Web Audio)
2. **Initialization Failures**: Captures and logs initialization errors
3. **Configuration Issues**: Validates required configuration options
4. **Browser Incompatibility**: Detects and reports browser limitations

All errors include:
- Test name
- Error message
- Expected behavior
- Actual behavior

## Testing

Comprehensive unit tests cover:
- Individual system validation
- API availability checks
- Error handling scenarios
- Integration tests for all systems
- Result structure consistency

Run tests:
```bash
npm test -- tests/audit/audio-auditor.test.ts
```

## Integration with Audit Engine

The `AudioAIAuditor` is used by the main `AuditEngineOrchestrator` to validate the audio category:

```typescript
import { AudioAIAuditor } from '@/lib/audit/audio-auditor';

const audioAuditor = new AudioAIAuditor();
const audioResults = await Promise.all([
  audioAuditor.validateVoiceActivity(),
  audioAuditor.validateAmbientNoise(),
  audioAuditor.validateAudioSpoofing(),
  audioAuditor.validateLipSync(),
]);
```

## Related Files

- **Implementation**: `lib/audit/audio-auditor.ts`
- **Tests**: `tests/audit/audio-auditor.test.ts`
- **Types**: `lib/audit/types.ts`
- **Constants**: `lib/audit/constants.ts`
- **Hooks**: 
  - `hooks/useVoiceActivityDetection.ts`
  - `hooks/useAmbientNoiseDetection.ts`
  - `hooks/useAudioSpoofingDetection.ts`
  - `hooks/useLipSyncDetection.ts`

## Requirements Mapping

This auditor validates:
- **Requirement 1.2**: Validate all 4 Audio AI detection systems
- **Requirement 15.5**: Validate Web Speech API availability
- **Requirement 15.6**: Validate Web Audio API AudioContext initialization

## Future Enhancements

Potential improvements identified:
1. **Speaker Identification**: Voice fingerprinting for identity verification
2. **Stress Detection**: Analyze voice patterns for stress indicators
3. **Background Voice Separation**: Isolate candidate voice from background
4. **Advanced TTS Detection**: Machine learning models for synthetic audio
5. **Real-time Audio Quality Metrics**: SNR, clarity, distortion analysis
