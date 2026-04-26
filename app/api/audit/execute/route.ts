import { NextResponse } from "next/server";
import { AuditEngineOrchestrator } from "@/lib/audit/audit-engine-orchestrator";
import { createAuditExecutionRecord } from "@/lib/audit/db-operations";
import { handleApiError } from "@/lib/apiUtils";
import { AuditOptions, AICategory } from "@/lib/audit/types";

// POST /api/audit/execute — Trigger audit execution
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { options = {} } = body;

    // Validate audit options
    const auditOptions: AuditOptions = {
      categories: options.categories || ['vision', 'audio', 'behavioral', 'system'],
      includePerformance: options.includePerformance ?? true,
      includeFalsePositiveAnalysis: options.includeFalsePositiveAnalysis ?? true,
      includeEnhancementRecommendations: options.includeEnhancementRecommendations ?? true,
      concurrency: options.concurrency || 4,
    };

    // Validate categories if provided
    if (auditOptions.categories) {
      const validCategories: AICategory[] = ['vision', 'audio', 'behavioral', 'system'];
      const invalidCategories = auditOptions.categories.filter(
        cat => !validCategories.includes(cat as AICategory)
      );
      
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { 
            message: "Invalid categories provided", 
            invalidCategories,
            validCategories 
          },
          { status: 400 }
        );
      }
    }

    // Validate concurrency
    if (auditOptions.concurrency && (auditOptions.concurrency < 1 || auditOptions.concurrency > 10)) {
      return NextResponse.json(
        { message: "Concurrency must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Create orchestrator and start audit
    const orchestrator = new AuditEngineOrchestrator();
    
    // Generate execution ID
    const executionId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Create audit execution record
    await createAuditExecutionRecord({
      executionId,
      startTime: new Date(),
      status: 'running',
      auditOptions,
      triggeredBy: 'api', // Could be enhanced with user authentication
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        dependencies: {}, // Could be populated with package versions
      },
    });

    // Start audit execution asynchronously
    orchestrator.executeFullAudit(auditOptions)
      .then(async (results) => {
        // Update record with results
        const { updateAuditExecutionRecord } = await import("@/lib/audit/db-operations");
        await updateAuditExecutionRecord(executionId, {
          endTime: new Date(),
          status: 'completed',
          results,
        });
      })
      .catch(async (error) => {
        // Update record with failure
        const { updateAuditExecutionRecord } = await import("@/lib/audit/db-operations");
        await updateAuditExecutionRecord(executionId, {
          endTime: new Date(),
          status: 'failed',
        });
        console.error('Audit execution failed:', error);
      });

    // Estimate completion time
    const systemCount = auditOptions.categories!.reduce((sum, cat) => {
      const systemCounts = { vision: 11, audio: 4, behavioral: 4, system: 10 };
      return sum + systemCounts[cat as keyof typeof systemCounts];
    }, 0);

    let estimatedSeconds = systemCount * 2; // 2 seconds per system validation
    if (auditOptions.includePerformance) estimatedSeconds += systemCount * 5;
    if (auditOptions.includeFalsePositiveAnalysis) estimatedSeconds += 10;
    if (auditOptions.includeEnhancementRecommendations) estimatedSeconds += 5;

    return NextResponse.json(
      {
        executionId,
        status: 'started',
        estimatedDuration: estimatedSeconds,
        message: 'Audit execution started successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error starting audit execution:', error);
    return handleApiError(error);
  }
}