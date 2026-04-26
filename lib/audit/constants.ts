/**
 * Constants and configuration for AI Capabilities Audit System
 * 
 * Defines all AI detection systems, performance targets, and system categories.
 */

import { AICategory } from './types';

// ============================================================================
// AI Detection Systems Registry
// ============================================================================

export interface AISystemDefinition {
  id: string;
  name: string;
  category: AICategory;
  description: string;
  technology: string;
  performanceTarget?: {
    frameRate?: number; // FPS
    latency?: number; // milliseconds
    memoryThreshold?: number; // MB
    cpuThreshold?: number; // percentage
  };
}

export const AI_SYSTEMS: AISystemDefinition[] = [
  // Vision AI Systems (11 systems)
  {
    id: 'face-detection',
    name: 'Face Detection',
    category: 'vision',
    description: 'Detects presence and count of faces in video feed',
    technology: 'MediaPipe FaceMesh',
    performanceTarget: { frameRate: 30, latency: 33, memoryThreshold: 100 },
  },
  {
    id: 'gaze-tracking',
    name: 'Gaze Tracking',
    category: 'vision',
    description: 'Tracks eye gaze direction and looking away behavior',
    technology: 'MediaPipe FaceMesh (iris landmarks)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'head-pose',
    name: 'Head Pose Estimation',
    category: 'vision',
    description: 'Estimates head orientation and detects anomalies',
    technology: 'MediaPipe FaceMesh (facial landmarks)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'blink-analysis',
    name: 'Blink Frequency Analysis',
    category: 'vision',
    description: 'Analyzes blink patterns for liveness detection',
    technology: 'MediaPipe FaceMesh (eye landmarks)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'hand-tracking',
    name: 'Hand Tracking',
    category: 'vision',
    description: 'Detects and tracks hand gestures',
    technology: 'MediaPipe Hands',
    performanceTarget: { frameRate: 10, latency: 100, memoryThreshold: 80 },
  },
  {
    id: 'object-detection',
    name: 'Object Detection',
    category: 'vision',
    description: 'Detects unauthorized materials (phones, books, etc.)',
    technology: 'TensorFlow.js COCO-SSD',
    performanceTarget: { frameRate: 0.5, latency: 2000, memoryThreshold: 150 },
  },
  {
    id: 'face-proximity',
    name: 'Face Proximity Detection',
    category: 'vision',
    description: 'Detects when face is too close or too far from camera',
    technology: 'MediaPipe FaceMesh (face size analysis)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'liveness-detection',
    name: 'Liveness Detection',
    category: 'vision',
    description: 'Detects photo/video spoofing attempts',
    technology: 'MediaPipe FaceMesh + blink analysis',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'micro-gaze',
    name: 'Micro-Gaze Tracking',
    category: 'vision',
    description: 'Tracks subtle eye movements and pupil focus',
    technology: 'MediaPipe FaceMesh (iris tracking)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'lip-movement',
    name: 'Lip Movement Detection',
    category: 'vision',
    description: 'Detects lip movements for dictation detection',
    technology: 'MediaPipe FaceMesh (mouth landmarks)',
    performanceTarget: { frameRate: 30, latency: 33 },
  },
  {
    id: 'biometric-recognition',
    name: 'Biometric Recognition',
    category: 'vision',
    description: 'Verifies candidate identity via face comparison',
    technology: 'MediaPipe FaceMesh + face embeddings',
    performanceTarget: { latency: 500 },
  },

  // Audio AI Systems (4 systems)
  {
    id: 'voice-activity',
    name: 'Voice Activity Detection',
    category: 'audio',
    description: 'Detects voice activity and speech patterns',
    technology: 'Web Speech API',
    performanceTarget: { frameRate: 60, latency: 16 },
  },
  {
    id: 'ambient-noise',
    name: 'Ambient Noise Analysis',
    category: 'audio',
    description: 'Analyzes background noise levels',
    technology: 'Web Audio API (AudioContext)',
    performanceTarget: { frameRate: 60, latency: 16 },
  },
  {
    id: 'tts-detection',
    name: 'TTS Detection',
    category: 'audio',
    description: 'Detects synthetic/text-to-speech audio',
    technology: 'Web Audio API (frequency analysis)',
    performanceTarget: { frameRate: 60, latency: 16 },
  },
  {
    id: 'lip-sync',
    name: 'Lip-Sync Verification',
    category: 'audio',
    description: 'Verifies audio matches lip movements',
    technology: 'MediaPipe FaceMesh + Web Speech API',
    performanceTarget: { frameRate: 30, latency: 33 },
  },

  // Behavioral AI Systems (4 systems)
  {
    id: 'keystroke-dynamics',
    name: 'Keystroke Dynamics',
    category: 'behavioral',
    description: 'Analyzes typing patterns and rhythm',
    technology: 'JavaScript event listeners',
    performanceTarget: { latency: 10 },
  },
  {
    id: 'mouse-behavior',
    name: 'Mouse Behavior Analysis',
    category: 'behavioral',
    description: 'Tracks mouse movement patterns',
    technology: 'JavaScript event listeners',
    performanceTarget: { latency: 10 },
  },
  {
    id: 'response-time',
    name: 'Response Time Profiling',
    category: 'behavioral',
    description: 'Analyzes time spent on questions',
    technology: 'Custom timing analytics',
    performanceTarget: { latency: 50 },
  },
  {
    id: 'typing-pattern',
    name: 'Typing Pattern Analysis',
    category: 'behavioral',
    description: 'Detects copy-paste and unusual typing patterns',
    technology: 'JavaScript event listeners',
    performanceTarget: { latency: 10 },
  },

  // System AI Systems (10 systems)
  {
    id: 'virtual-camera',
    name: 'Virtual Camera Detection',
    category: 'system',
    description: 'Detects virtual camera software (OBS, ManyCam)',
    technology: 'MediaDevices API + device fingerprinting',
    performanceTarget: { latency: 100 },
  },
  {
    id: 'virtual-device',
    name: 'Virtual Device Detection',
    category: 'system',
    description: 'Detects virtual audio/video devices',
    technology: 'MediaDevices API',
    performanceTarget: { latency: 100 },
  },
  {
    id: 'browser-fingerprint',
    name: 'Browser Fingerprinting',
    category: 'system',
    description: 'Creates unique browser fingerprint',
    technology: 'Canvas fingerprinting + WebGL',
    performanceTarget: { latency: 200 },
  },
  {
    id: 'extension-detection',
    name: 'Extension Detection',
    category: 'system',
    description: 'Detects browser extensions',
    technology: 'Resource timing API',
    performanceTarget: { latency: 100 },
  },
  {
    id: 'devtools-detection',
    name: 'DevTools Detection',
    category: 'system',
    description: 'Detects when browser DevTools are open',
    technology: 'Window size analysis + debugger detection',
    performanceTarget: { latency: 50 },
  },
  {
    id: 'screen-recording',
    name: 'Screen Recording Detection',
    category: 'system',
    description: 'Detects screen recording software',
    technology: 'Screen Capture API + process detection',
    performanceTarget: { latency: 100 },
  },
  {
    id: 'multi-tab',
    name: 'Multi-Tab Detection',
    category: 'system',
    description: 'Detects tab switching and window blur',
    technology: 'Page Visibility API',
    performanceTarget: { latency: 10 },
  },
  {
    id: 'network-anomaly',
    name: 'Network Anomaly Detection',
    category: 'system',
    description: 'Detects unusual network patterns',
    technology: 'Network Information API + timing analysis',
    performanceTarget: { latency: 100 },
  },
  {
    id: 'sandbox-vm',
    name: 'Sandbox/VM Detection',
    category: 'system',
    description: 'Detects virtual machines and sandboxes',
    technology: 'Hardware fingerprinting + timing attacks',
    performanceTarget: { latency: 200 },
  },
  {
    id: 'hardware-spoofing',
    name: 'Hardware Spoofing Detection',
    category: 'system',
    description: 'Detects hardware emulation and spoofing',
    technology: 'WebGL fingerprinting + hardware queries',
    performanceTarget: { latency: 200 },
  },
];

// ============================================================================
// System Categories
// ============================================================================

export const SYSTEMS_BY_CATEGORY: Record<AICategory, AISystemDefinition[]> = {
  vision: AI_SYSTEMS.filter((s) => s.category === 'vision'),
  audio: AI_SYSTEMS.filter((s) => s.category === 'audio'),
  behavioral: AI_SYSTEMS.filter((s) => s.category === 'behavioral'),
  system: AI_SYSTEMS.filter((s) => s.category === 'system'),
};

// ============================================================================
// Performance Targets
// ============================================================================

export const DEFAULT_PERFORMANCE_TARGETS = {
  vision: {
    frameRate: 30, // FPS
    latency: 33, // milliseconds
    memoryThreshold: 100, // MB
    cpuThreshold: 50, // percentage
  },
  audio: {
    frameRate: 60, // FPS
    latency: 16, // milliseconds
    memoryThreshold: 50, // MB
    cpuThreshold: 30, // percentage
  },
  behavioral: {
    latency: 10, // milliseconds
    memoryThreshold: 20, // MB
    cpuThreshold: 10, // percentage
  },
  system: {
    latency: 100, // milliseconds
    memoryThreshold: 30, // MB
    cpuThreshold: 15, // percentage
  },
};

// ============================================================================
// Audit Configuration Defaults
// ============================================================================

export const DEFAULT_AUDIT_OPTIONS = {
  categories: ['vision', 'audio', 'behavioral', 'system'] as AICategory[],
  includePerformance: true,
  includeFalsePositiveAnalysis: true,
  includeEnhancementRecommendations: true,
  concurrency: 4,
};

export const AUDIT_TIMEOUTS = {
  perTest: 5000, // 5 seconds per individual test
  perSystem: 30000, // 30 seconds per system
  perCategory: 120000, // 2 minutes per category
  fullAudit: 600000, // 10 minutes for full audit
};

// ============================================================================
// Violation Severity Weights (for Integrity Score calculation)
// ============================================================================

export const VIOLATION_SEVERITY_WEIGHTS: Record<string, number> = {
  // High severity (30-50 points)
  FACE_MISMATCH: 50,
  VIRTUAL_CAMERA: 40,
  SCREEN_RECORDING_DETECTED: 40,
  DEVTOOLS_ACCESS: 35,
  LIVENESS_FAILURE: 35,
  VM_OR_SANDBOX_DETECTED: 30,

  // Medium severity (10-25 points)
  LIP_SYNC_MISMATCH: 25,
  PHONE_DETECTED: 25,
  UNAUTHORIZED_MATERIAL: 20,
  DUPLICATE_TAB: 15,
  MULTIPLE_FACES: 15,
  COPY_PASTE: 15,
  EXTENSION_DETECTED: 10,
  VIRTUAL_DEVICE_DETECTED: 10,

  // Low severity (2-10 points)
  LOOKING_AWAY: 5,
  TAB_SWITCH: 5,
  WINDOW_BLUR: 3,
  FULLSCREEN_EXIT: 3,
  HEAD_POSE_ANOMALY: 5,
  AMBIENT_NOISE: 3,
  TYPING_ANOMALY: 5,
  FACE_PROXIMITY_ANOMALY: 3,
  PUPIL_FOCUS_ANOMALY: 5,
  RESPONSE_TIME_ANOMALY: 5,
  MOUSE_INACTIVITY: 3,
  NETWORK_ANOMALY: 5,
  VOICE_ACTIVITY_ANOMALY: 3,
  HAND_GESTURE_ANOMALY: 3,
  ENVIRONMENT_CHANGE: 3,
  BLINK_PATTERN_ANOMALY: 3,
  SYNTHETIC_AUDIO_DETECTED: 10,
  MICRO_GAZE_ANOMALY: 5,
  NO_FACE: 10,
  KEYBOARD_SHORTCUT: 5,
  CLIPBOARD_PASTE: 10,
  SECONDARY_MONITOR: 15,
};

// ============================================================================
// Browser Compatibility Matrix
// ============================================================================

export const BROWSER_COMPATIBILITY = {
  Chrome: {
    minVersion: '90',
    fullSupport: true,
    limitations: [],
  },
  Edge: {
    minVersion: '90',
    fullSupport: true,
    limitations: [],
  },
  Firefox: {
    minVersion: '88',
    fullSupport: false,
    limitations: ['Web Speech API not available', 'MediaPipe performance degraded'],
  },
  Safari: {
    minVersion: '14',
    fullSupport: false,
    limitations: [
      'Web Speech API not available',
      'MediaPipe limited support',
      'Some WebGL features unavailable',
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getSystemById(systemId: string): AISystemDefinition | undefined {
  return AI_SYSTEMS.find((s) => s.id === systemId);
}

export function getSystemsByCategory(category: AICategory): AISystemDefinition[] {
  return SYSTEMS_BY_CATEGORY[category];
}

export function getAllSystemIds(): string[] {
  return AI_SYSTEMS.map((s) => s.id);
}

export function getSystemCount(): number {
  return AI_SYSTEMS.length;
}

export function getCategorySystemCount(category: AICategory): number {
  return SYSTEMS_BY_CATEGORY[category].length;
}

// Create a lookup object for easier access
export const AI_SYSTEMS_MAP: Record<string, AISystemDefinition> = AI_SYSTEMS.reduce((acc, system) => {
  acc[system.id] = system;
  return acc;
}, {} as Record<string, AISystemDefinition>);
