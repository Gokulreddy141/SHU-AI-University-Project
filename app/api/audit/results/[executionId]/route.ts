import { NextResponse } from "next/server";
import { getAuditExecutionRecord } from "@/lib/audit/db-operations";
import { handleApiError } from "@/lib/apiUtils";

// GET /api/audit/results/:executionId — Get complete audit results
export async function GET(
  req: Request,
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

    // Check if audit is completed
    if (executionRecord.status === 'running') {
      return NextResponse.json(
        { 
          message: "Audit is still running. Use /api/audit/status/:executionId to check progress.",
          status: executionRecord.status,
          startTime: executionRecord.startTime,
        },
        { status: 202 } // 202 Accepted - request accepted but processing not complete
      );
    }

    if (executionRecord.status === 'failed') {
      return NextResponse.json(
        { 
          message: "Audit execution failed",
          status: executionRecord.status,
          startTime: executionRecord.startTime,
          endTime: executionRecord.endTime,
        },
        { status: 500 }
      );
    }

    // Check if results are available
    if (!executionRecord.results) {
      return NextResponse.json(
        { 
          message: "Audit results not available",
          status: executionRecord.status,
        },
        { status: 404 }
      );
    }

    // Parse URL parameters for filtering/formatting options
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const includeDetails = url.searchParams.get('includeDetails') !== 'false';
    const category = url.searchParams.get('category');

    let results = executionRecord.results;

    // Filter by category if requested
    if (category) {
      const validCategories = ['vision', 'audio', 'behavioral', 'system'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { 
            message: "Invalid category",
            validCategories,
          },
          { status: 400 }
        );
      }

      // Filter category results
      results = {
        ...results,
        categoryResults: results.categoryResults.filter(
          (cat: Record<string, unknown>) => cat.category === category
        ),
      };
    }

    // Remove detailed information if not requested
    if (!includeDetails) {
      results = {
        executionId: results.executionId,
        timestamp: results.timestamp,
        duration: results.duration,
        overallStatus: results.overallStatus,
        summary: results.summary,
        categoryResults: results.categoryResults.map((cat: Record<string, unknown>) => ({
          category: cat.category,
          status: cat.status,
          totalSystems: cat.totalSystems,
          systemsPassed: cat.systemsPassed,
          systemsFailed: cat.systemsFailed,
          systemsWarning: cat.systemsWarning,
        })),
      };
    }

    // Handle different response formats
    if (format === 'summary') {
      return NextResponse.json({
        executionId: results.executionId,
        timestamp: results.timestamp,
        duration: results.duration,
        overallStatus: results.overallStatus,
        summary: results.summary,
        categoryStats: results.categoryResults.map((cat: Record<string, unknown>) => ({
          category: cat.category,
          status: cat.status,
          passRate: (cat.totalSystems as number) > 0 ? 
            Math.round(((cat.systemsPassed as number) / (cat.totalSystems as number)) * 100) : 0,
        })),
      }, { status: 200 });
    }

    // Default JSON response with complete results
    const response = {
      executionId,
      results,
      metadata: {
        retrievedAt: new Date(),
        auditOptions: executionRecord.auditOptions,
        triggeredBy: executionRecord.triggeredBy,
        environment: executionRecord.environment,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error getting audit results:', error);
    return handleApiError(error);
  }
}