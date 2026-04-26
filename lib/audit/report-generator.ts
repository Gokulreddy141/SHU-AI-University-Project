/**
 * Report Generator for AI Capabilities Audit System
 * 
 * Generates comprehensive reports in multiple formats (HTML, JSON, Markdown)
 * for audit results, performance analysis, compatibility matrices, and enhancement roadmaps.
 */

import {
  AuditReport,
  GeneratedReport,
  ReportSection,
  ReportFormat,
  PerformanceData,
  CompatibilityData,
  EnhancementRoadmap,
  Visualization,
  CategoryAuditResult,
  BenchmarkComparison,
  BrowserCompatibility,
  RoadmapPhase,
  Bottleneck,
  BehaviorTest,
} from './types';

/**
 * ReportGenerator class
 * 
 * Generates various types of reports for the audit system:
 * - Comprehensive audit reports
 * - Performance analysis reports
 * - Compatibility matrices
 * - Enhancement roadmaps
 * - Demonstration checklists
 */
export class ReportGenerator {
  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport(auditResults: AuditReport): Promise<GeneratedReport> {
    const reportId = `audit-${auditResults.executionId}`;
    const sections: ReportSection[] = [];

    // Executive Summary
    sections.push(this.generateExecutiveSummary(auditResults));

    // Category Results
    sections.push(this.generateCategoryResults(auditResults.categoryResults));

    // System Details
    sections.push(this.generateSystemDetails(auditResults.categoryResults));

    // Performance Analysis
    if (auditResults.performanceAnalysis) {
      sections.push(this.generatePerformanceSection(auditResults.performanceAnalysis));
    }

    // Accuracy Analysis
    if (auditResults.accuracyAnalysis) {
      sections.push(this.generateAccuracySection(auditResults.accuracyAnalysis));
    }

    // Enhancement Recommendations
    if (auditResults.enhancementRecommendations) {
      sections.push(this.generateEnhancementsSection(auditResults.enhancementRecommendations));
    }

    // Recommendations
    sections.push(this.generateRecommendationsSection(auditResults.summary));

    return {
      reportId,
      reportType: 'audit',
      generatedAt: new Date(),
      title: `AI Capabilities Audit Report - ${auditResults.executionId}`,
      sections,
      metadata: {
        executionId: auditResults.executionId,
        timestamp: auditResults.timestamp,
        duration: auditResults.duration,
        overallStatus: auditResults.overallStatus,
      },
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(performanceData: PerformanceData): Promise<GeneratedReport> {
    const reportId = `performance-${Date.now()}`;
    const sections: ReportSection[] = [];

    // Performance Overview
    sections.push(this.generatePerformanceOverview(performanceData));

    // System-by-System Metrics
    sections.push(this.generateSystemMetrics(performanceData));

    // Benchmark Comparisons
    sections.push(this.generateBenchmarkSection(performanceData.benchmarkComparisons));

    return {
      reportId,
      reportType: 'performance',
      generatedAt: new Date(),
      title: 'AI System Performance Analysis Report',
      sections,
      metadata: {
        overallScore: performanceData.overallPerformanceScore,
      },
    };
  }

  /**
   * Generate compatibility matrix
   */
  async generateCompatibilityMatrix(compatibilityData: CompatibilityData): Promise<GeneratedReport> {
    const reportId = `compatibility-${Date.now()}`;
    const sections: ReportSection[] = [];

    // Browser Compatibility Overview
    sections.push(this.generateCompatibilityOverview(compatibilityData));

    // Detailed Compatibility Matrix
    sections.push(this.generateCompatibilityMatrixSection(compatibilityData.browsers));

    // Recommended Configuration
    sections.push(this.generateRecommendedConfigSection(compatibilityData.recommendedConfiguration));

    return {
      reportId,
      reportType: 'compatibility',
      generatedAt: new Date(),
      title: 'Browser & Device Compatibility Matrix',
      sections,
      metadata: {
        browsersTestedCount: compatibilityData.browsers.length,
      },
    };
  }

  /**
   * Generate enhancement roadmap document
   */
  async generateRoadmapDocument(roadmap: EnhancementRoadmap): Promise<GeneratedReport> {
    const reportId = `roadmap-${Date.now()}`;
    const sections: ReportSection[] = [];

    // Roadmap Overview
    sections.push(this.generateRoadmapOverview(roadmap));

    // Phase-by-Phase Details
    for (const phase of roadmap.phases) {
      sections.push(this.generatePhaseSection(phase));
    }

    // Implementation Sequence
    sections.push(this.generateSequenceSection(roadmap.recommendedSequence));

    return {
      reportId,
      reportType: 'roadmap',
      generatedAt: new Date(),
      title: 'AI Enhancement Roadmap',
      sections,
      metadata: {
        totalHours: roadmap.totalEstimatedHours,
        phaseCount: roadmap.phases.length,
      },
    };
  }

  /**
   * Generate demonstration checklist
   */
  async generateDemonstrationChecklist(): Promise<GeneratedReport> {
    const reportId = `demo-checklist-${Date.now()}`;
    const sections: ReportSection[] = [];

    // Pre-Demonstration Checklist
    sections.push(this.generatePreDemoChecklist());

    // Demonstration Script
    sections.push(this.generateDemoScript());

    // Expected Results
    sections.push(this.generateExpectedResults());

    // Troubleshooting Guide
    sections.push(this.generateTroubleshootingGuide());

    return {
      reportId,
      reportType: 'demonstration-checklist',
      generatedAt: new Date(),
      title: 'AI Capabilities Demonstration Checklist',
      sections,
      metadata: {
        estimatedDuration: '5 minutes',
      },
    };
  }

  /**
   * Export report in specified format
   */
  async exportReport(report: GeneratedReport, format: ReportFormat): Promise<string> {
    switch (format) {
      case 'html':
        return this.exportAsHTML(report);
      case 'json':
        return this.exportAsJSON(report);
      case 'markdown':
        return this.exportAsMarkdown(report);
      case 'pdf':
        throw new Error('PDF export not yet implemented. Use HTML export and convert to PDF.');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // ============================================================================
  // Private Helper Methods - Report Sections
  // ============================================================================

  private generateExecutiveSummary(auditResults: AuditReport): ReportSection {
    const { summary, duration, timestamp } = auditResults;
    
    const content = `
## Executive Summary

**Audit Execution ID:** ${auditResults.executionId}  
**Timestamp:** ${timestamp.toISOString()}  
**Duration:** ${duration.toFixed(2)} seconds  
**Overall Status:** ${this.formatStatus(auditResults.overallStatus)}

### Key Metrics

- **Total AI Systems Tested:** ${summary.totalSystems}
- **Systems Passed:** ${summary.systemsPassed} (${summary.passRate.toFixed(1)}%)
- **Systems Failed:** ${summary.systemsFailed}
- **Systems with Warnings:** ${summary.systemsWarning}

${summary.criticalIssues.length > 0 ? `
### Critical Issues

${summary.criticalIssues.map(issue => `- ⚠️ ${issue}`).join('\n')}
` : ''}
`;

    return {
      title: 'Executive Summary',
      content: content.trim(),
    };
  }

  private generateCategoryResults(categoryResults: CategoryAuditResult[]): ReportSection {
    const content = `
## Category Results

${categoryResults.map(cat => `
### ${this.formatCategoryName(cat.category)} AI Systems

**Status:** ${this.formatStatus(cat.status)}  
**Systems Tested:** ${cat.totalSystems}  
**Passed:** ${cat.systemsPassed} | **Failed:** ${cat.systemsFailed} | **Warnings:** ${cat.systemsWarning}

${cat.systemResults.map(sys => `- ${this.formatStatus(sys.status)} **${sys.systemName}** (${sys.systemId})`).join('\n')}
`).join('\n')}
`;

    const visualizations: Visualization[] = [
      {
        type: 'chart',
        title: 'Category Status Distribution',
        data: categoryResults.map(cat => ({
          category: this.formatCategoryName(cat.category),
          passed: cat.systemsPassed,
          failed: cat.systemsFailed,
          warning: cat.systemsWarning,
        })),
        config: { type: 'bar', stacked: true },
      },
    ];

    return {
      title: 'Category Results',
      content: content.trim(),
      visualizations,
    };
  }

  private generateSystemDetails(categoryResults: CategoryAuditResult[]): ReportSection {
    const allSystems = categoryResults.flatMap(cat => cat.systemResults);
    
    const content = `
## System-Level Details

${allSystems.map(sys => `
### ${sys.systemName}

**System ID:** ${sys.systemId}  
**Status:** ${this.formatStatus(sys.status)}  
**Category:** ${this.formatCategoryName(categoryResults.find(c => c.systemResults.includes(sys))?.category || 'unknown')}

**Test Results:**
- Tests Passed: ${sys.validationResult.testsPassed}
- Tests Failed: ${sys.validationResult.testsFailed}
- Tests Skipped: ${sys.validationResult.testsSkipped}

${sys.validationResult.errors.length > 0 ? `
**Errors:**
${sys.validationResult.errors.map(err => `- ❌ **${err.testName}**: ${err.errorMessage}`).join('\n')}
` : ''}

${sys.validationResult.warnings.length > 0 ? `
**Warnings:**
${sys.validationResult.warnings.map(warn => `- ⚠️ **${warn.testName}**: ${warn.warningMessage}`).join('\n')}
` : ''}
`).join('\n---\n')}
`;

    return {
      title: 'System-Level Details',
      content: content.trim(),
    };
  }

  private generatePerformanceSection(performanceAnalysis: any): ReportSection {
    const { performanceData, bottlenecks, optimizationRecommendations } = performanceAnalysis;
    
    const content = `
## Performance Analysis

**Overall Performance Score:** ${performanceData.overallPerformanceScore}/100

${bottlenecks.length > 0 ? `
### Identified Bottlenecks

${bottlenecks.map((b: Bottleneck) => `
- **${b.systemId}** - ${b.metricName}
  - Severity: ${b.severity.toUpperCase()}
  - Description: ${b.description}
  - Impact: ${b.impact}
`).join('\n')}
` : '### ✅ No Performance Bottlenecks Identified'}

${optimizationRecommendations.length > 0 ? `
### Optimization Recommendations

${optimizationRecommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
` : ''}
`;

    return {
      title: 'Performance Analysis',
      content: content.trim(),
    };
  }

  private generateAccuracySection(accuracyAnalysis: any): ReportSection {
    const { falsePositiveAnalysis, falseNegativeAnalysis } = accuracyAnalysis;
    
    const content = `
## Accuracy Analysis

### False Positive Analysis

**System:** ${falsePositiveAnalysis.systemId}  
**False Positive Rate:** ${falsePositiveAnalysis.falsePositiveRate.toFixed(2)}%  
**Total Tests:** ${falsePositiveAnalysis.totalTests}  
**False Positives Detected:** ${falsePositiveAnalysis.falsePositives.length}

${falsePositiveAnalysis.falsePositives.length > 0 ? `
**False Positive Cases:**
${falsePositiveAnalysis.falsePositives.map((fp: BehaviorTest) => `- ${fp.behaviorName}: ${fp.description}`).join('\n')}
` : ''}

### False Negative Analysis

**System:** ${falseNegativeAnalysis.systemId}  
**False Negative Rate:** ${falseNegativeAnalysis.falseNegativeRate.toFixed(2)}%  
**Total Tests:** ${falseNegativeAnalysis.totalTests}  
**False Negatives Detected:** ${falseNegativeAnalysis.falseNegatives.length}

${falseNegativeAnalysis.falseNegatives.length > 0 ? `
**False Negative Cases:**
${falseNegativeAnalysis.falseNegatives.map((fn: BehaviorTest) => `- ${fn.behaviorName}: ${fn.description}`).join('\n')}
` : ''}
`;

    return {
      title: 'Accuracy Analysis',
      content: content.trim(),
    };
  }

  private generateEnhancementsSection(enhancements: any[]): ReportSection {
    const content = `
## Enhancement Recommendations

**Total Recommendations:** ${enhancements.length}

${enhancements.map((enh, i) => `
### ${i + 1}. ${enh.name}

**Category:** ${this.formatCategoryName(enh.category)}  
**Implementation Effort:** ${enh.implementationEffort.toUpperCase()}  
**Demonstration Value:** ${enh.demonstrationValue.toUpperCase()}  
**Estimated Hours:** ${enh.estimatedHours}

${enh.description}

**Required Libraries:** ${enh.requiredLibraries.join(', ')}

${enh.prerequisites.length > 0 ? `**Prerequisites:** ${enh.prerequisites.join(', ')}` : ''}
`).join('\n---\n')}
`;

    return {
      title: 'Enhancement Recommendations',
      content: content.trim(),
    };
  }

  private generateRecommendationsSection(summary: any): ReportSection {
    const content = `
## Recommendations

${summary.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
`;

    return {
      title: 'Recommendations',
      content: content.trim(),
    };
  }

  private generatePerformanceOverview(performanceData: PerformanceData): ReportSection {
    const content = `
## Performance Overview

**Overall Performance Score:** ${performanceData.overallPerformanceScore}/100

### Summary

This report analyzes the performance of all AI detection systems across key metrics including frame rate, latency, memory usage, and CPU utilization.

**Systems Analyzed:** ${performanceData.systemMetrics.size}  
**Benchmark Comparisons:** ${performanceData.benchmarkComparisons.length}
`;

    return {
      title: 'Performance Overview',
      content: content.trim(),
    };
  }

  private generateSystemMetrics(performanceData: PerformanceData): ReportSection {
    const metricsArray = Array.from(performanceData.systemMetrics.entries());
    
    const content = `
## System Performance Metrics

${metricsArray.map(([systemId, metrics]) => `
### ${systemId}

${metrics.frameRate ? `
**Frame Rate:**
- Average: ${metrics.frameRate.average.toFixed(2)} FPS
- Min: ${metrics.frameRate.min.toFixed(2)} FPS
- Max: ${metrics.frameRate.max.toFixed(2)} FPS
- Target: ${metrics.frameRate.target} FPS
- ${metrics.frameRate.meetsTarget ? '✅ Meets Target' : '❌ Below Target'}
` : ''}

${metrics.latency ? `
**Latency:**
- Average: ${metrics.latency.average.toFixed(2)} ms
- P50: ${metrics.latency.p50.toFixed(2)} ms
- P95: ${metrics.latency.p95.toFixed(2)} ms
- P99: ${metrics.latency.p99.toFixed(2)} ms
- Target: ${metrics.latency.target} ms
- ${metrics.latency.meetsTarget ? '✅ Meets Target' : '❌ Above Target'}
` : ''}

${metrics.memory ? `
**Memory Usage:**
- Initial: ${metrics.memory.initial.toFixed(2)} MB
- Peak: ${metrics.memory.peak.toFixed(2)} MB
- Average: ${metrics.memory.average.toFixed(2)} MB
- Growth Rate: ${metrics.memory.growth.toFixed(2)} MB/min
- ${metrics.memory.exceedsThreshold ? '❌ Exceeds Threshold' : '✅ Within Threshold'}
` : ''}

${metrics.cpu ? `
**CPU Usage:**
- Average: ${metrics.cpu.average.toFixed(2)}%
- Peak: ${metrics.cpu.peak.toFixed(2)}%
- ${metrics.cpu.exceedsThreshold ? '❌ Exceeds Threshold' : '✅ Within Threshold'}
` : ''}
`).join('\n---\n')}
`;

    return {
      title: 'System Performance Metrics',
      content: content.trim(),
    };
  }

  private generateBenchmarkSection(benchmarkComparisons: BenchmarkComparison[]): ReportSection {
    const content = `
## Benchmark Comparisons

${benchmarkComparisons.map(comp => `
### ${comp.systemId}

**Overall Status:** ${comp.overallStatus.toUpperCase()}

**Metric Comparisons:**

| Metric | Actual | Target | Status | Deviation |
|--------|--------|--------|--------|-----------|
${comp.metricComparisons.map(mc => 
  `| ${mc.metricName} | ${mc.actual.toFixed(2)} | ${mc.target.toFixed(2)} | ${mc.status === 'pass' ? '✅' : '❌'} | ${mc.deviation.toFixed(1)}% |`
).join('\n')}

${comp.recommendations.length > 0 ? `
**Recommendations:**
${comp.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}
`).join('\n---\n')}
`;

    return {
      title: 'Benchmark Comparisons',
      content: content.trim(),
    };
  }

  private generateCompatibilityOverview(compatibilityData: CompatibilityData): ReportSection {
    const avgCompatibility = compatibilityData.browsers.reduce((sum, b) => sum + b.overallCompatibility, 0) / compatibilityData.browsers.length;
    
    const content = `
## Compatibility Overview

**Browsers Tested:** ${compatibilityData.browsers.length}  
**Average Compatibility:** ${avgCompatibility.toFixed(1)}%

### Browser Summary

${compatibilityData.browsers.map(browser => `
- **${browser.browserName} ${browser.version}**: ${browser.overallCompatibility.toFixed(1)}% compatible
  - Supported: ${browser.supportedSystems.length} systems
  - Unsupported: ${browser.unsupportedSystems.length} systems
  - Partial: ${browser.partialSystems.length} systems
`).join('\n')}
`;

    return {
      title: 'Compatibility Overview',
      content: content.trim(),
    };
  }

  private generateCompatibilityMatrixSection(browsers: BrowserCompatibility[]): ReportSection {
    // Get all unique system IDs
    const allSystemIds = new Set<string>();
    browsers.forEach(browser => {
      browser.supportedSystems.forEach(s => allSystemIds.add(s));
      browser.unsupportedSystems.forEach(s => allSystemIds.add(s));
      browser.partialSystems.forEach(ps => allSystemIds.add(ps.systemId));
    });

    const systemIds = Array.from(allSystemIds).sort();

    const content = `
## Compatibility Matrix

| System | ${browsers.map(b => `${b.browserName} ${b.version}`).join(' | ')} |
|--------|${browsers.map(() => '--------').join('|')}|
${systemIds.map(systemId => {
  const row = browsers.map(browser => {
    if (browser.supportedSystems.includes(systemId)) return '✅';
    if (browser.unsupportedSystems.includes(systemId)) return '❌';
    const partial = browser.partialSystems.find(ps => ps.systemId === systemId);
    if (partial) return '⚠️';
    return '❓';
  });
  return `| ${systemId} | ${row.join(' | ')} |`;
}).join('\n')}

**Legend:**
- ✅ Fully Supported
- ❌ Not Supported
- ⚠️ Partially Supported
- ❓ Not Tested

${browsers.flatMap(browser => 
  browser.partialSystems.map(ps => `
**${browser.browserName} ${browser.version} - ${ps.systemId}:**
- Limitation: ${ps.limitation}
${ps.workaround ? `- Workaround: ${ps.workaround}` : ''}
`)
).join('\n')}
`;

    const visualizations: Visualization[] = [
      {
        type: 'matrix',
        title: 'Browser Compatibility Heatmap',
        data: {
          browsers: browsers.map(b => `${b.browserName} ${b.version}`),
          systems: systemIds,
          compatibility: systemIds.map(systemId => 
            browsers.map(browser => {
              if (browser.supportedSystems.includes(systemId)) return 100;
              if (browser.unsupportedSystems.includes(systemId)) return 0;
              if (browser.partialSystems.find(ps => ps.systemId === systemId)) return 50;
              return -1;
            })
          ),
        },
        config: { colorScale: ['red', 'yellow', 'green'] },
      },
    ];

    return {
      title: 'Compatibility Matrix',
      content: content.trim(),
      visualizations,
    };
  }

  private generateRecommendedConfigSection(config: any): ReportSection {
    const content = `
## Recommended Configuration

### Browser

**Recommended Browser:** ${config.browser}  
**Minimum Version:** ${config.minVersion}

### Required Permissions

${config.requiredPermissions.map((perm: string) => `- ${perm}`).join('\n')}

### Hardware Requirements

**Minimum:**
- RAM: ${config.hardwareRequirements.minRAM}
- CPU: ${config.hardwareRequirements.minCPU}
- GPU: ${config.hardwareRequirements.gpu}
- Camera: ${config.hardwareRequirements.camera}
- Microphone: ${config.hardwareRequirements.microphone}

**Recommended:**
- RAM: ${config.hardwareRequirements.recommendedRAM}
`;

    return {
      title: 'Recommended Configuration',
      content: content.trim(),
    };
  }

  private generateRoadmapOverview(roadmap: EnhancementRoadmap): ReportSection {
    const content = `
## Enhancement Roadmap Overview

**Total Estimated Hours:** ${roadmap.totalEstimatedHours}  
**Number of Phases:** ${roadmap.phases.length}  
**Total Enhancements:** ${roadmap.phases.reduce((sum, phase) => sum + phase.enhancements.length, 0)}

### Recommended Implementation Sequence

${roadmap.recommendedSequence.map((enhId, i) => `${i + 1}. ${enhId}`).join('\n')}
`;

    return {
      title: 'Roadmap Overview',
      content: content.trim(),
    };
  }

  private generatePhaseSection(phase: RoadmapPhase): ReportSection {
    const content = `
## ${phase.phaseName}

**Estimated Duration:** ${phase.estimatedDuration}  
**Enhancements in Phase:** ${phase.enhancements.length}

${phase.dependencies.length > 0 ? `
**Dependencies:**
${phase.dependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}

### Enhancements

${phase.enhancements.map(enh => `
#### ${enh.name} (Priority: ${enh.priority}/10)

${enh.description}

- **Category:** ${this.formatCategoryName(enh.category)}
- **Effort:** ${enh.implementationEffort}
- **Value:** ${enh.demonstrationValue}
- **Estimated Hours:** ${enh.estimatedHours}
- **Required Libraries:** ${enh.requiredLibraries.join(', ')}
- **Priority Rationale:** ${enh.priorityRationale}
`).join('\n')}
`;

    return {
      title: phase.phaseName,
      content: content.trim(),
    };
  }

  private generateSequenceSection(sequence: string[]): ReportSection {
    const content = `
## Implementation Sequence

The following sequence is recommended for implementing enhancements to maximize demonstration value while managing dependencies:

${sequence.map((enhId, i) => `${i + 1}. ${enhId}`).join('\n')}

**Note:** This sequence considers:
- Technical dependencies between enhancements
- Implementation effort vs. demonstration value
- Logical grouping of related features
`;

    return {
      title: 'Implementation Sequence',
      content: content.trim(),
    };
  }

  private generatePreDemoChecklist(): ReportSection {
    const content = `
## Pre-Demonstration Checklist

### Environment Setup

- [ ] **Browser:** Chrome or Edge (latest version) installed and set as default
- [ ] **Camera:** Webcam connected and functional
- [ ] **Microphone:** Microphone connected and functional
- [ ] **Internet:** Stable internet connection (minimum 5 Mbps)
- [ ] **Display:** Screen resolution at least 1920x1080 for optimal viewing

### System Checks

- [ ] **Database:** MongoDB connection verified
- [ ] **Environment Variables:** All required .env variables configured
- [ ] **Dependencies:** All npm packages installed (\`npm install\`)
- [ ] **Build:** Application builds successfully (\`npm run build\`)
- [ ] **Development Server:** Dev server starts without errors (\`npm run dev\`)

### AI System Initialization

- [ ] **MediaPipe FaceMesh:** Loads successfully (check browser console)
- [ ] **MediaPipe Hands:** Loads successfully (check browser console)
- [ ] **TensorFlow.js:** Loads successfully (check browser console)
- [ ] **COCO-SSD Model:** Downloads and initializes (check network tab)
- [ ] **Web Speech API:** Available (Chrome/Edge only)
- [ ] **Web Audio API:** AudioContext initializes

### Data Preparation

- [ ] **Test Accounts:** Recruiter and candidate accounts created
- [ ] **Sample Exam:** Exam with MCQ and coding questions created
- [ ] **Biometric Data:** Test candidate has enrolled biometrics
- [ ] **Access Code:** Exam access code ready for candidate login

### Dashboard Access

- [ ] **AI Diagnostics Dashboard:** Accessible at /dashboard/ai-diagnostics
- [ ] **Live Monitoring Dashboard:** Accessible at /dashboard/live
- [ ] **Exam Dashboard:** Accessible at /dashboard/exams
- [ ] **Reports Dashboard:** Accessible at /dashboard/reports

### Browser Permissions

- [ ] **Camera Permission:** Granted for the application domain
- [ ] **Microphone Permission:** Granted for the application domain
- [ ] **Notifications:** Enabled (optional but recommended)
`;

    return {
      title: 'Pre-Demonstration Checklist',
      content: content.trim(),
    };
  }

  private generateDemoScript(): ReportSection {
    const content = `
## 5-Minute Demonstration Script

### Phase 1: System Overview (30 seconds)

**Action:** Open AI Diagnostics Dashboard (/dashboard/ai-diagnostics)

**Talking Points:**
- "This platform demonstrates 29+ AI detection systems across 4 categories"
- "Real-time monitoring of Vision, Audio, Behavioral, and System-level AI"
- Point out the live status indicators for each AI system

### Phase 2: Vision AI Demonstration (90 seconds)

**Action:** Start camera feed on diagnostics dashboard

**Test Actions:**
1. **Face Detection:** Show face to camera - indicator turns green
2. **Gaze Tracking:** Look away from screen - "Looking Away" violation triggers
3. **Hand Tracking:** Raise hand near face - "Hand Near Face" detected
4. **Object Detection:** Hold phone to camera - "Unauthorized Object" detected
5. **Multiple People:** Have someone else appear - "Multiple People" detected

**Expected Results:** All vision AI indicators active, violations logged in real-time

### Phase 3: Audio AI Demonstration (60 seconds)

**Action:** Enable microphone on diagnostics dashboard

**Test Actions:**
1. **Voice Activity:** Speak normally - voice activity detected
2. **Ambient Noise:** Make background noise - noise level indicator updates
3. **Lip Sync:** Speak while covering mouth - lip-sync mismatch detected

**Expected Results:** Audio waveform visible, detection indicators active

### Phase 4: Behavioral AI Demonstration (45 seconds)

**Action:** Navigate to a sample exam session

**Test Actions:**
1. **Keystroke Dynamics:** Type in answer field - pattern analysis active
2. **Mouse Behavior:** Move mouse erratically - unusual pattern detected
3. **Tab Switching:** Switch browser tabs - "Tab Switch" violation logged
4. **Copy-Paste:** Attempt to paste text - "Copy-Paste" violation detected

**Expected Results:** Behavioral violations logged with timestamps

### Phase 5: Live Monitoring & Integrity Score (45 seconds)

**Action:** Open Live Monitoring Dashboard (/dashboard/live)

**Talking Points:**
- "Real-time monitoring of all active exam sessions"
- Show integrity score calculation (starts at 100, decreases with violations)
- Demonstrate color-coded status (GREEN: 80-100, YELLOW: 50-79, RED: 0-49)
- Show violation history with severity levels

**Expected Results:** Session appears with real-time integrity score updates

### Phase 6: Reports & Analytics (30 seconds)

**Action:** Navigate to session report

**Talking Points:**
- "Comprehensive violation summary across all AI categories"
- "Detailed timeline of all detected anomalies"
- "Exportable reports for academic evaluation"

**Expected Results:** Complete audit trail of all AI detections

### Closing (30 seconds)

**Talking Points:**
- "29+ AI systems working in harmony for comprehensive proctoring"
- "Real-time detection with sub-second latency"
- "Production-ready platform demonstrating cutting-edge AI capabilities"
`;

    return {
      title: '5-Minute Demonstration Script',
      content: content.trim(),
    };
  }

  private generateExpectedResults(): ReportSection {
    const content = `
## Expected Results by AI Category

### Vision AI (11 Systems)

| System | Test Action | Expected Result |
|--------|-------------|-----------------|
| Face Detection | Show face to camera | Green indicator, face detected |
| Gaze Tracking | Look away from screen | "Looking Away" violation |
| Head Pose | Turn head significantly | "Head Pose Anomaly" detected |
| Blink Analysis | Close eyes for extended period | "Suspicious Blink Pattern" |
| Hand Tracking | Raise hand near face | "Hand Near Face" violation |
| Object Detection | Show phone/book | "Unauthorized Object" detected |
| Face Proximity | Move very close to camera | "Face Too Close" warning |
| Liveness Detection | Show photo of face | "Liveness Check Failed" |
| Micro-Gaze | Look at second monitor | "Gaze Direction Anomaly" |
| Lip Movement | Mouth words silently | Lip movement detected |
| Biometric Recognition | Different person appears | "Face Mismatch" violation |

### Audio AI (4 Systems)

| System | Test Action | Expected Result |
|--------|-------------|-----------------|
| Voice Activity | Speak normally | Voice activity indicator active |
| Ambient Noise | Background noise | Noise level indicator updates |
| TTS Detection | Play computer-generated voice | "TTS Detected" warning |
| Lip-Sync Verification | Speak with mouth covered | "Lip-Sync Mismatch" violation |

### Behavioral AI (4 Systems)

| System | Test Action | Expected Result |
|--------|-------------|-----------------|
| Keystroke Dynamics | Type answers | Pattern analysis active |
| Mouse Behavior | Erratic mouse movement | "Unusual Mouse Pattern" |
| Response Time | Answer too quickly | "Suspicious Response Time" |
| Typing Pattern | Copy-paste text | "Copy-Paste Detected" violation |

### System AI (10 Systems)

| System | Test Action | Expected Result |
|--------|-------------|-----------------|
| Virtual Camera | Use OBS virtual camera | "Virtual Camera Detected" |
| Virtual Device | Use virtual audio device | "Virtual Device Detected" |
| Browser Fingerprinting | Check browser properties | Fingerprint captured |
| Extension Detection | Install suspicious extension | "Extension Detected" warning |
| DevTools Detection | Open browser DevTools | "DevTools Open" violation |
| Screen Recording | Start screen recording | "Screen Recording Detected" |
| Multi-Tab Detection | Open multiple tabs | "Multiple Tabs" violation |
| Network Anomaly | Unusual network activity | "Network Anomaly" detected |
| Sandbox/VM Detection | Run in virtual machine | "VM Detected" warning |
| Hardware Spoofing | Spoofed hardware info | "Hardware Spoofing" detected |
`;

    return {
      title: 'Expected Results',
      content: content.trim(),
    };
  }

  private generateTroubleshootingGuide(): ReportSection {
    const content = `
## Troubleshooting Guide

### Camera Not Working

**Symptoms:** Camera feed shows black screen or "Camera not found" error

**Solutions:**
1. Check camera is connected and not in use by another application
2. Grant camera permissions in browser settings
3. Restart browser and try again
4. Check browser console for specific error messages
5. Try a different browser (Chrome or Edge recommended)

### Microphone Not Working

**Symptoms:** No audio waveform visible, voice activity not detected

**Solutions:**
1. Check microphone is connected and selected as default device
2. Grant microphone permissions in browser settings
3. Check system audio settings and volume levels
4. Test microphone in system settings first
5. Restart browser and try again

### AI Models Not Loading

**Symptoms:** "Loading..." indicator stuck, AI systems show "Not Initialized"

**Solutions:**
1. Check internet connection (models download from CDN)
2. Clear browser cache and reload page
3. Check browser console for network errors
4. Verify CDN URLs are accessible (not blocked by firewall)
5. Wait 30-60 seconds for initial model download

### Web Speech API Not Available

**Symptoms:** "Web Speech API not supported" warning

**Solutions:**
1. Use Chrome or Edge browser (Firefox/Safari not supported)
2. Ensure HTTPS connection (required for Web Speech API)
3. Check browser version is up to date
4. Grant microphone permissions

### Integrity Score Not Updating

**Symptoms:** Score stuck at 100 despite violations

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify session is active and not in "completed" state
3. Refresh the monitoring dashboard
4. Check database connection is active
5. Verify violation logging endpoints are responding

### Performance Issues

**Symptoms:** Slow frame rates, laggy interface, high CPU usage

**Solutions:**
1. Close unnecessary browser tabs and applications
2. Ensure adequate system resources (8GB+ RAM recommended)
3. Disable browser extensions that may interfere
4. Use hardware acceleration in browser settings
5. Reduce video resolution if needed

### Database Connection Errors

**Symptoms:** "Database connection failed" errors

**Solutions:**
1. Verify MongoDB is running
2. Check .env.local file has correct MONGODB_URI
3. Verify network connectivity to database
4. Check database credentials are correct
5. Restart the development server

### Build or Deployment Issues

**Symptoms:** Application fails to build or start

**Solutions:**
1. Delete node_modules and package-lock.json, run \`npm install\`
2. Clear Next.js cache: \`rm -rf .next\`
3. Check Node.js version (v18+ required)
4. Verify all environment variables are set
5. Check for TypeScript errors: \`npm run type-check\`
`;

    return {
      title: 'Troubleshooting Guide',
      content: content.trim(),
    };
  }

  // ============================================================================
  // Private Helper Methods - Export Formats
  // ============================================================================

  private exportAsHTML(report: GeneratedReport): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 8px; }
    h3 { color: #1e3a8a; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #2563eb; color: white; }
    tr:nth-child(even) { background-color: #f9fafb; }
    code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background-color: #1f2937; color: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .metadata { background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .section { margin: 30px 0; }
    ul { padding-left: 25px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  
  <div class="metadata">
    <p><strong>Report ID:</strong> ${report.reportId}</p>
    <p><strong>Report Type:</strong> ${report.reportType}</p>
    <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
    ${Object.entries(report.metadata).map(([key, value]) => 
      `<p><strong>${this.formatKey(key)}:</strong> ${value}</p>`
    ).join('\n')}
  </div>

  ${report.sections.map(section => `
    <div class="section">
      ${this.markdownToHTML(section.content)}
    </div>
  `).join('\n')}

  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #6b7280; text-align: center;">
    <p>Generated by AI Capabilities Audit System</p>
    <p>${new Date().toISOString()}</p>
  </footer>
</body>
</html>
`;
    return html.trim();
  }

  private exportAsJSON(report: GeneratedReport): string {
    return JSON.stringify(report, null, 2);
  }

  private exportAsMarkdown(report: GeneratedReport): string {
    const markdown = `# ${report.title}

**Report ID:** ${report.reportId}  
**Report Type:** ${report.reportType}  
**Generated:** ${report.generatedAt.toISOString()}

## Metadata

${Object.entries(report.metadata).map(([key, value]) => `- **${this.formatKey(key)}:** ${value}`).join('\n')}

---

${report.sections.map(section => section.content).join('\n\n---\n\n')}

---

*Generated by AI Capabilities Audit System - ${new Date().toISOString()}*
`;
    return markdown.trim();
  }

  // ============================================================================
  // Private Helper Methods - Formatting
  // ============================================================================

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pass: '✅ PASS',
      fail: '❌ FAIL',
      warning: '⚠️ WARNING',
      running: '🔄 RUNNING',
      completed: '✅ COMPLETED',
      failed: '❌ FAILED',
    };
    return statusMap[status] || status.toUpperCase();
  }

  private formatCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      vision: 'Vision',
      audio: 'Audio',
      behavioral: 'Behavioral',
      system: 'System',
    };
    return categoryMap[category] || category;
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*<\/li>)/g, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Tables (basic support)
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });

    return html;
  }
}
