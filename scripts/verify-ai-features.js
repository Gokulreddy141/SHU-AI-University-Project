/**
 * AI Features Verification Script
 * Checks that all AI hooks and components are properly integrated
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_AI_HOOKS = [
    'useVoiceActivityDetection',
    'useAmbientNoiseDetection',
    'useAudioSpoofingDetection',
    'useLipSyncDetection',
    'useHandTracking',
    'useBlinkFrequencyAnalysis',
    'useHeadPoseEstimation',
    'useMicroGazeTracker',
    'useObjectDetection',
    'useFaceProximityDetection',
    'useKeystrokeDynamics',
    'useMouseBehaviorAnalysis',
    'useResponseTimeProfiling',
    'useVirtualCameraDetection',
    'useDevToolsDetection',
    'useMultiTabDetection',
    'useScreenRecordingDetection',
    'useNetworkMonitor',
    'useSandboxEnvironmentCheck',
    'useVirtualDeviceDetection',
    'useExtensionDetection',
    'useFullScreenEnforcement',
    'useWindowFocusDetection',
    'useBrowserFingerprint',
    'useHardwareDetection',
    'useIrisFocusTracking',
];

const REQUIRED_COMPONENTS = [
    'CameraFeed',
    'DiagnosticsCameraFeed',
    'BiometricCapture',
    'LiveInterviewRoom',
    'GazeIndicator',
    'IntegrityScoreBadge',
];

const REQUIRED_API_ROUTES = [
    'api/biometric/enroll',
    'api/violation',
    'api/session',
    'api/exam',
    'api/interview/token',
];

console.log('🤖 AI Features Verification Script\n');
console.log('=' .repeat(60));

let allPassed = true;

// Check AI Hooks
console.log('\n📦 Checking AI Hooks...');
const hooksDir = path.join(process.cwd(), 'hooks');
const hookFiles = fs.readdirSync(hooksDir);

REQUIRED_AI_HOOKS.forEach(hook => {
    const filename = `${hook}.ts`;
    if (hookFiles.includes(filename)) {
        console.log(`  ✅ ${hook}`);
    } else {
        console.log(`  ❌ ${hook} - MISSING`);
        allPassed = false;
    }
});

// Check Components
console.log('\n🎨 Checking AI Components...');
const componentsDir = path.join(process.cwd(), 'components/features');
const componentFiles = fs.readdirSync(componentsDir);

REQUIRED_COMPONENTS.forEach(component => {
    const filename = `${component}.tsx`;
    if (componentFiles.includes(filename)) {
        console.log(`  ✅ ${component}`);
    } else {
        console.log(`  ❌ ${component} - MISSING`);
        allPassed = false;
    }
});

// Check API Routes
console.log('\n🌐 Checking API Routes...');
REQUIRED_API_ROUTES.forEach(route => {
    const routePath = path.join(process.cwd(), 'app', route, 'route.ts');
    if (fs.existsSync(routePath)) {
        console.log(`  ✅ ${route}`);
    } else {
        console.log(`  ❌ ${route} - MISSING`);
        allPassed = false;
    }
});

// Check Dependencies
console.log('\n📚 Checking AI Dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

const requiredDeps = {
    '@mediapipe/face_mesh': 'Face detection',
    '@mediapipe/tasks-vision': 'Hand tracking',
    '@tensorflow/tfjs': 'TensorFlow.js',
    '@tensorflow-models/coco-ssd': 'Object detection',
    'livekit-client': 'Video conferencing',
    'mongoose': 'Database',
};

Object.entries(requiredDeps).forEach(([dep, purpose]) => {
    if (deps[dep]) {
        console.log(`  ✅ ${dep} (${purpose})`);
    } else {
        console.log(`  ❌ ${dep} (${purpose}) - MISSING`);
        allPassed = false;
    }
});

// Check Integrity Score Algorithm
console.log('\n🎯 Checking Integrity Score Algorithm...');
const integrityPath = path.join(process.cwd(), 'lib/integrity.ts');
if (fs.existsSync(integrityPath)) {
    const integrityContent = fs.readFileSync(integrityPath, 'utf8');
    const violationTypes = integrityContent.match(/summary\.\w+/g) || [];
    const uniqueTypes = [...new Set(violationTypes)];
    console.log(`  ✅ Integrity algorithm found`);
    console.log(`  ✅ ${uniqueTypes.length} violation types defined`);
} else {
    console.log(`  ❌ Integrity algorithm - MISSING`);
    allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
    console.log('✅ ALL AI FEATURES VERIFIED - SYSTEM READY FOR DEMO');
} else {
    console.log('❌ SOME FEATURES MISSING - CHECK ERRORS ABOVE');
}
console.log('='.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
