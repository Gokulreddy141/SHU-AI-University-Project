import { NextResponse } from "next/server";
import { getAuditExecutionRecord } from "@/lib/audit/db-operations";
import { handleApiError } from "@/lib/apiUtils";

interface AuditOptions {
  categories?: string[];
  includePerformance?: boolean;
  includeFalsePositiveAnalysis?: boolean;
  includeEnhancementRecommendations?: boolean;
}

// GET /api/audit/status/:executionId — Get audit execution status
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await params;

    if (!executionId) {
      return NextResponse.json(
        { message: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Get audit execution record from database
    const executionRecord = await getAuditExecutionRecord(executionId) as any;

    if (!executionRecord) {
      return NextResponse.json(
        { message: "Audit execution not found" },
        { status: 404 }
      );
    }

    // If audit is still running, try to get real-time status from orchestrator
    let currentStatus = null;
    let partialResults = null;

    if (executionRecord.status === 'running') {
      try {
        // Note: In a production system, you'd need a way to track running orchestrators
        // For now, we'll return the database status
        const startTime = new Date(executionRecord.startTime);
        const elapsed = (Date.now() - startTime.getTime()) / 1000;
        
        // Estimate progress based on elapsed time and estimated duration
        const estimatedDuration = estimateAuditDuration(executionRecord.auditOptions as AuditOptions);
        const estimatedProgress = Math.min(95, (elapsed / estimatedDuration) * 100);

        currentStatus = {
          isRunning: true,
          currentPhase: 'executing',
          progress: Math.round(estimatedProgress),
          startTime: executionRecord.startTime,
          estimatedCompletion: new Date(startTime.getTime() + estimatedDuration * 1000),
        };
      } catch (error) {
        console.warn('Could not get real-time status:', error);
      }
    }

    // Prepare response
    const response = {
      executionId,
      status: {
        isRunning: executionRecord.status === 'running',
        currentPhase: executionRecord.status === 'running' ? 'executing' : executionRecord.status,
        progress: executionRecord.status === 'completed' ? 100 : 
                 executionRecord.status === 'failed' ? 0 : 
                 currentStatus?.progress || 0,
        startTime: executionRecord.startTime,
        endTime: executionRecord.endTime,
        estimatedCompletion: currentStatus?.estimatedCompletion,
      },
      auditOptions: executionRecord.auditOptions,
      triggeredBy: executionRecord.triggeredBy,
    };

    // Include partial results if available
    if (executionRecord.results) {
      partialResults = executionRecord.results;
    }

    if (partialResults) {
      (response as Record<string, unknown>).partialResults = partialResults;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error getting audit status:', error);
    return handleApiError(error);
  }
}

// Helper function to estimate audit duration
function estimateAuditDuration(auditOptions: AuditOptions): number {
  const categories = auditOptions.categories || ['vision', 'audio', 'behavioral', 'system'];
  const systemCount = categories.reduce((sum: number, cat: string) => {
    const systemCounts = { vision: 11, audio: 4, behavioral: 4, system: 10 };
    return sum + (systemCounts[cat as keyof typeof systemCounts] || 0);
  }, 0);

  let estimatedSeconds = systemCount * 2; // 2 seconds per system validation
  if (auditOptions.includePerformance) estimatedSeconds += systemCount * 5;
  if (auditOptions.includeFalsePositiveAnalysis) estimatedSeconds += 10;
  if (auditOptions.includeEnhancementRecommendations) estimatedSeconds += 5;

  return estimatedSeconds;
}