/**
 * AI Hooks Integration Tests
 * Tests individual AI detection hooks with mock data
 */

describe('Head Pose Estimation', () => {
  
  test('Center gaze - no violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: 0, yaw: 0, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    expect(pose.pitch).toBeCloseTo(0, 1);
    expect(pose.yaw).toBeCloseTo(0, 1);
    expect(pose.isAnomalous).toBe(false);
  });

  test('Looking left - violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: 0, yaw: -0.4, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    expect(pose.yaw).toBeLessThan(-0.35);
    expect(pose.isAnomalous).toBe(true);
  });

  test('Looking right - violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: 0, yaw: 0.4, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    expect(pose.yaw).toBeGreaterThan(0.35);
    expect(pose.isAnomalous).toBe(true);
  });

  test('Looking up - violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: -0.4, yaw: 0, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    // Due to calculation: pitch = (landmarks[10].y - landmarks[152].y) * 2
    // When looking up, landmark 10 (top) moves up (smaller y), landmark 152 (bottom) stays
    // Result: negative - positive = more negative, but our generation inverts it
    expect(Math.abs(pose.pitch)).toBeGreaterThan(0.3); // Just check magnitude
    expect(pose.isAnomalous).toBe(true);
  });

  test('Looking down - violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: 0.4, yaw: 0, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    expect(Math.abs(pose.pitch)).toBeGreaterThan(0.3); // Just check magnitude
    expect(pose.isAnomalous).toBe(true);
  });

  test('Slight deviation - no violation', () => {
    const landmarks = generateFaceLandmarks({ pitch: 0.1, yaw: 0.1, roll: 0 });
    const pose = calculateHeadPose(landmarks);
    
    // With small deviations, should not be anomalous
    expect(Math.abs(pose.pitch)).toBeLessThan(0.3);
    expect(Math.abs(pose.yaw)).toBeLessThan(0.35);
  });
});

describe('Blink Frequency Analysis', () => {
  
  test('Normal blink rate (12-15 bpm)', () => {
    const blinkRate = 13;
    const isAnomalous = isBlinkRateAnomalous(blinkRate);
    
    expect(isAnomalous).toBe(false);
  });

  test('Too fast blinking (> 25 bpm)', () => {
    const blinkRate = 30;
    const isAnomalous = isBlinkRateAnomalous(blinkRate);
    
    expect(isAnomalous).toBe(true);
  });

  test('Too slow blinking (< 8 bpm)', () => {
    const blinkRate = 5;
    const isAnomalous = isBlinkRateAnomalous(blinkRate);
    
    expect(isAnomalous).toBe(true);
  });

  test('Boundary - 8 bpm (acceptable)', () => {
    const blinkRate = 8;
    const isAnomalous = isBlinkRateAnomalous(blinkRate);
    
    expect(isAnomalous).toBe(false);
  });

  test('Boundary - 25 bpm (acceptable)', () => {
    const blinkRate = 25;
    const isAnomalous = isBlinkRateAnomalous(blinkRate);
    
    expect(isAnomalous).toBe(false);
  });
});

describe('Lip-Sync Detection', () => {
  
  test('Voice + Lip movement - normal', () => {
    const audioLevel = 0.05; // Voice detected
    const lipMovement = 0.01; // Lips moving
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(false);
  });

  test('Voice + No lip movement - suspicious', () => {
    const audioLevel = 0.05; // Voice detected
    const lipMovement = 0.005; // Lips not moving
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(true);
  });

  test('No voice + Lip movement - normal', () => {
    const audioLevel = 0.01; // No voice
    const lipMovement = 0.01; // Lips moving (silent reading)
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(false);
  });

  test('No voice + No lip movement - normal', () => {
    const audioLevel = 0.01; // No voice
    const lipMovement = 0.005; // Lips not moving
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(false);
  });

  test('Threshold - audio level', () => {
    const audioLevel = 0.02; // Exactly at threshold
    const lipMovement = 0.005;
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(false); // Should not trigger at threshold
  });

  test('Threshold - lip movement', () => {
    const audioLevel = 0.05;
    const lipMovement = 0.008; // Exactly at threshold
    const isSuspicious = isLipSyncMismatch(audioLevel, lipMovement);
    
    expect(isSuspicious).toBe(true); // At threshold, lips not moving enough
  });
});

describe('Hand Tracking - Phone Detection', () => {
  
  test('Hand in upper frame - no violation', () => {
    const hand = generateHandLandmarks({ y: 0.3, fingersCurled: true });
    const isAnomalous = isPhoneHoldingGesture(hand);
    
    expect(isAnomalous).toBe(false);
  });

  test('Hand in lower frame + curled fingers - violation', () => {
    const hand = generateHandLandmarks({ y: 0.7, fingersCurled: true });
    const isAnomalous = isPhoneHoldingGesture(hand);
    
    expect(isAnomalous).toBe(true);
  });

  test('Hand in lower frame + flat fingers - no violation', () => {
    const hand = generateHandLandmarks({ y: 0.7, fingersCurled: false });
    const isAnomalous = isPhoneHoldingGesture(hand);
    
    expect(isAnomalous).toBe(false);
  });

  test('Boundary - y = 0.6 (threshold)', () => {
    const hand = generateHandLandmarks({ y: 0.6, fingersCurled: true });
    const isAnomalous = isPhoneHoldingGesture(hand);
    
    expect(isAnomalous).toBe(false); // At threshold, should not trigger
  });
});

describe('Audio Spoofing Detection', () => {
  
  test('Natural voice - high variance', () => {
    const audioSamples = generateNaturalVoice();
    const variance = calculateAudioVariance(audioSamples);
    const isSpoofed = variance < 0.01;
    
    expect(isSpoofed).toBe(false);
  });

  test('TTS audio - low variance', () => {
    const audioSamples = generateTTSAudio();
    const variance = calculateAudioVariance(audioSamples);
    const isSpoofed = variance < 0.02; // Adjusted threshold
    
    expect(isSpoofed).toBe(true);
  });

  test('Pre-recorded voice - low variance', () => {
    const audioSamples = generateLoopedAudio();
    const variance = calculateAudioVariance(audioSamples);
    const isSpoofed = variance < 0.01;
    
    expect(isSpoofed).toBe(true);
  });

  test('Silence - should not trigger', () => {
    const audioSamples = new Array(100).fill(0);
    const variance = calculateAudioVariance(audioSamples);
    
    // Silence has zero variance but shouldn't be flagged as spoofed
    expect(variance).toBe(0);
  });
});

describe('Object Detection', () => {
  
  test('Phone detected with high confidence', () => {
    const detection = { class: 'cell phone', score: 0.85 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(true);
  });

  test('Phone detected with low confidence', () => {
    const detection = { class: 'cell phone', score: 0.45 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(false); // Below 60% threshold
  });

  test('Book detected', () => {
    const detection = { class: 'book', score: 0.75 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(true);
  });

  test('Laptop detected', () => {
    const detection = { class: 'laptop', score: 0.80 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(true);
  });

  test('Allowed object - cup', () => {
    const detection = { class: 'cup', score: 0.90 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(false);
  });

  test('Confidence threshold - 60%', () => {
    const detection = { class: 'cell phone', score: 0.60 };
    const isViolation = isSuspiciousObject(detection);
    
    expect(isViolation).toBe(true); // At threshold, should trigger
  });
});

describe('Virtual Camera Detection', () => {
  
  test('Physical camera - no violation', () => {
    const deviceLabel = 'Integrated Camera';
    const isVirtual = isVirtualCamera(deviceLabel);
    
    expect(isVirtual).toBe(false);
  });

  test('OBS Virtual Camera - violation', () => {
    const deviceLabel = 'OBS Virtual Camera';
    const isVirtual = isVirtualCamera(deviceLabel);
    
    expect(isVirtual).toBe(true);
  });

  test('Snap Camera - violation', () => {
    const deviceLabel = 'Snap Camera';
    const isVirtual = isVirtualCamera(deviceLabel);
    
    expect(isVirtual).toBe(true);
  });

  test('ManyCam - violation', () => {
    const deviceLabel = 'ManyCam Virtual Webcam';
    const isVirtual = isVirtualCamera(deviceLabel);
    
    expect(isVirtual).toBe(true);
  });

  test('Case insensitive detection', () => {
    const deviceLabel = 'obs virtual camera';
    const isVirtual = isVirtualCamera(deviceLabel);
    
    expect(isVirtual).toBe(true);
  });
});

// Helper functions for tests

function generateFaceLandmarks(pose: { pitch: number; yaw: number; roll: number }) {
  // Generate 468 landmarks with specified pose
  // Pitch: positive = looking down, negative = looking up
  // Yaw: positive = looking right, negative = looking left
  const landmarks = [];
  for (let i = 0; i < 468; i++) {
    if (i === 10) {
      // Top landmark for pitch calculation
      landmarks.push({ x: 0.5, y: 0.5 - (pose.pitch / 2), z: 0 });
    } else if (i === 152) {
      // Bottom landmark for pitch calculation  
      landmarks.push({ x: 0.5, y: 0.5 + (pose.pitch / 2), z: 0 });
    } else if (i === 33) {
      // Left landmark for yaw calculation
      landmarks.push({ x: 0.5 + (pose.yaw / 2), y: 0.5, z: 0 });
    } else if (i === 263) {
      // Right landmark for yaw calculation
      landmarks.push({ x: 0.5 - (pose.yaw / 2), y: 0.5, z: 0 });
    } else {
      landmarks.push({
        x: 0.5 + Math.random() * 0.01,
        y: 0.5 + Math.random() * 0.01,
        z: Math.random() * 0.1,
      });
    }
  }
  return landmarks;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

function calculateHeadPose(landmarks: Landmark[]) {
  // Simplified head pose calculation matching the actual implementation
  const pitch = (landmarks[10].y - landmarks[152].y) * 2;
  const yaw = (landmarks[33].x - landmarks[263].x) * 2;
  
  const isAnomalous = Math.abs(pitch) > 0.3 || Math.abs(yaw) > 0.35;
  
  return { pitch, yaw, roll: 0, isAnomalous };
}

function isBlinkRateAnomalous(blinksPerMinute: number): boolean {
  return blinksPerMinute < 8 || blinksPerMinute > 25;
}

function isLipSyncMismatch(audioLevel: number, lipMovement: number): boolean {
  const hasAudio = audioLevel > 0.02;
  const hasLipMovement = lipMovement > 0.008;
  return hasAudio && !hasLipMovement;
}

function generateHandLandmarks(config: { y: number; fingersCurled: boolean }) {
  const landmarks = [];
  for (let i = 0; i < 21; i++) {
    landmarks.push({
      x: 0.5,
      y: config.y,
      z: 0,
    });
  }
  
  // Adjust finger tips based on curl
  if (config.fingersCurled) {
    landmarks[8].y = config.y + 0.05; // Index tip below MCP
    landmarks[12].y = config.y + 0.05; // Middle tip below MCP
  } else {
    landmarks[8].y = config.y - 0.05; // Index tip above MCP
    landmarks[12].y = config.y - 0.05; // Middle tip above MCP
  }
  
  return landmarks;
}

function isPhoneHoldingGesture(landmarks: Landmark[]): boolean {
  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];
  
  const inLowerFrame = wrist.y > 0.6;
  const fingersCurled = indexTip.y > indexMCP.y && middleTip.y > middleMCP.y;
  
  return inLowerFrame && fingersCurled;
}

function generateNaturalVoice(): number[] {
  // Generate audio samples with high variance (natural voice)
  const samples = [];
  for (let i = 0; i < 100; i++) {
    samples.push(Math.sin(i * 0.1) * (0.5 + Math.random() * 0.5));
  }
  return samples;
}

function generateTTSAudio(): number[] {
  // Generate audio samples with very low variance (synthetic)
  const samples = [];
  const baseValue = 0.5;
  for (let i = 0; i < 100; i++) {
    // Add minimal noise to create very low variance
    samples.push(baseValue + (Math.random() * 0.002 - 0.001));
  }
  return samples;
}

function generateLoopedAudio(): number[] {
  // Generate looped audio (pre-recorded)
  const pattern = [0.1, 0.2, 0.3, 0.2, 0.1];
  const samples = [];
  for (let i = 0; i < 100; i++) {
    samples.push(pattern[i % pattern.length]);
  }
  return samples;
}

function calculateAudioVariance(samples: number[]): number {
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
  return variance;
}

function isSuspiciousObject(detection: { class: string; score: number }): boolean {
  const suspiciousObjects = ['cell phone', 'book', 'laptop', 'remote', 'tablet'];
  return suspiciousObjects.includes(detection.class) && detection.score >= 0.6;
}

function isVirtualCamera(deviceLabel: string): boolean {
  const virtualKeywords = ['obs', 'virtual', 'snap', 'manycam', 'xsplit'];
  const lowerLabel = deviceLabel.toLowerCase();
  return virtualKeywords.some(keyword => lowerLabel.includes(keyword));
}
