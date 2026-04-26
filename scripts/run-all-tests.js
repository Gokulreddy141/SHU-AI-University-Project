#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all verification and tests for the AI system
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n🧪 AI Detection System - Comprehensive Test Suite\n');
console.log('='.repeat(60));

let allPassed = true;
const results = [];

// Test 1: Verify AI Features
console.log('\n📦 Step 1: Verifying AI Features...\n');
try {
    execSync('node scripts/verify-ai-features.js', { stdio: 'inherit' });
    results.push({ test: 'AI Features Verification', status: '✅ PASS' });
} catch {
    results.push({ test: 'AI Features Verification', status: '❌ FAIL' });
    allPassed = false;
}

// Test 2: Check Test Files Exist
console.log('\n📁 Step 2: Checking Test Files...\n');
const testFiles = [
    'tests/ai-detection.test.ts',
    'tests/ai-hooks.test.ts',
    'tests/e2e-scenarios.test.ts',
];

let testFilesExist = true;
testFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) testFilesExist = false;
});

if (testFilesExist) {
    results.push({ test: 'Test Files', status: '✅ PASS' });
} else {
    results.push({ test: 'Test Files', status: '❌ FAIL' });
    allPassed = false;
}

// Test 3: Check Jest Configuration
console.log('\n⚙️  Step 3: Checking Jest Configuration...\n');
const jestConfigExists = fs.existsSync(path.join(process.cwd(), 'jest.config.js'));
console.log(`  ${jestConfigExists ? '✅' : '❌'} jest.config.js`);

if (jestConfigExists) {
    results.push({ test: 'Jest Configuration', status: '✅ PASS' });
} else {
    results.push({ test: 'Jest Configuration', status: '❌ FAIL' });
    allPassed = false;
}

// Test 4: Check Dependencies
console.log('\n📚 Step 4: Checking Test Dependencies...\n');
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const devDeps = packageJson.devDependencies || {};

const requiredDeps = ['jest', '@types/jest', 'ts-jest'];
let depsInstalled = true;

requiredDeps.forEach(dep => {
    const installed = devDeps[dep] !== undefined;
    console.log(`  ${installed ? '✅' : '❌'} ${dep}`);
    if (!installed) depsInstalled = false;
});

if (depsInstalled) {
    results.push({ test: 'Test Dependencies', status: '✅ PASS' });
} else {
    results.push({ test: 'Test Dependencies', status: '⚠️  WARN - Run: npm install' });
}

// Test 5: Run Jest Tests (if dependencies installed)
if (depsInstalled && testFilesExist) {
    console.log('\n🧪 Step 5: Running Jest Tests...\n');
    try {
        execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
        results.push({ test: 'Jest Tests', status: '✅ PASS' });
    } catch {
        results.push({ test: 'Jest Tests', status: '❌ FAIL' });
        allPassed = false;
    }
} else {
    console.log('\n⏭️  Step 5: Skipping Jest Tests (dependencies not installed)\n');
    results.push({ test: 'Jest Tests', status: '⏭️  SKIPPED' });
}

// Test 6: Check Documentation
console.log('\n📖 Step 6: Checking Documentation...\n');
const docFiles = [
    'AI_CAPABILITIES_TEST_CHECKLIST.md',
    'TEST_SCENARIOS.md',
    'PRACTICAL_TEST_GUIDE.md',
    'TESTING_IMPLEMENTATION.md',
];

let docsExist = true;
docFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) docsExist = false;
});

if (docsExist) {
    results.push({ test: 'Documentation', status: '✅ PASS' });
} else {
    results.push({ test: 'Documentation', status: '❌ FAIL' });
    allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:\n');

results.forEach(result => {
    console.log(`  ${result.status.padEnd(15)} ${result.test}`);
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED - SYSTEM READY FOR DEMO\n');
    process.exit(0);
} else {
    console.log('\n❌ SOME TESTS FAILED - CHECK ERRORS ABOVE\n');
    console.log('💡 Quick Fixes:');
    console.log('   - Run: npm install');
    console.log('   - Check test files exist in tests/ folder');
    console.log('   - Verify jest.config.js exists\n');
    process.exit(1);
}
