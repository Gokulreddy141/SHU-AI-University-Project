import { NextResponse } from "next/server";
import { getAuditExecutionHistory, getAuditStatistics } from "@/lib/audit/db-operations";
import { handleApiError } from "@/lib/apiUtils";

// GET /api/audit/history — Get paginated list of past audit executions
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 50); // Max 50 per page
    const status = url.searchParams.get('status') as 'running' | 'completed' | 'failed' | null;
    const triggeredBy = url.searchParams.get('triggeredBy');
    const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined;
    const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined;
    const includeStats = url.searchParams.get('includeStats') === 'true';

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { message: "Page must be >= 1" },
        { status: 400 }
      );
    }

    if (pageSize < 1) {
      return NextResponse.json(
        { message: "Page size must be >= 1" },
        { status: 400 }
      );
    }

    if (status && !['running', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { 
          message: "Invalid status",
          validStatuses: ['running', 'completed', 'failed'],
        },
        { status: 400 }
      );
    }

    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid startDate format. Use ISO 8601 format." },
        { status: 400 }
      );
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid endDate format. Use ISO 8601 format." },
        { status: 400 }
      );
    }

    // Build filters
    const filters: unknown = {};
    if (status) filters.status = status;
    if (triggeredBy) filters.triggeredBy = triggeredBy;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    // Get audit execution history
    const historyResult = await getAuditExecutionHistory(page, pageSize, filters);

    // Transform records to include summary statistics
    const executions = historyResult.records.map((record: unknown) => {
      const execution: unknown = {
        executionId: record.executionId,
        startTime: record.startTime,
        endTime: record.endTime,
        status: record.status,
        duration: record.endTime && record.startTime ? 
          Math.round((new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 1000) : null,
        triggeredBy: record.triggeredBy,
        auditOptions: record.auditOptions,
      };

      // Add summary if results are available
      if (record.results?.summary) {
        execution.summary = {
          totalSystems: record.results.summary.totalSystems,
          systemsPassed: record.results.summary.systemsPassed,
          systemsFailed: record.results.summary.systemsFailed,
          systemsWarning: record.results.summary.systemsWarning,
          passRate: record.results.summary.passRate,
          overallStatus: record.results.overallStatus,
        };
      }

      return execution;
    });

    // Prepare response
    const response: unknown = {
      executions,
      pagination: {
        page: historyResult.page,
        pageSize: historyResult.pageSize,
        total: historyResult.total,
        totalPages: Math.ceil(historyResult.total / historyResult.pageSize),
        hasNext: historyResult.page * historyResult.pageSize < historyResult.total,
        hasPrevious: historyResult.page > 1,
      },
      filters: {
        status,
        triggeredBy,
        startDate,
        endDate,
      },
    };

    // Include statistics if requested
    if (includeStats) {
      try {
        const stats = await getAuditStatistics();
        response.statistics = stats;
      } catch (error: unknown) {
        console.warn('Could not fetch audit statistics:', error);
        response.statistics = null;
      }
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error getting audit history:', error);
    return handleApiError(error);
  }
}