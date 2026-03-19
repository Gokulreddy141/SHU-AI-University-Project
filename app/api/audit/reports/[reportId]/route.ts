import { NextRequest, NextResponse } from 'next/server';
import { CachedReport } from './download/route';

/**
 * GET /api/audit/reports/:reportId
 * 
 * Return generated report data
 * 
 * Response:
 * {
 *   reportId: string;
 *   reportType: string;
 *   generatedAt: Date;
 *   title: string;
 *   sections: ReportSection[];
 *   metadata: Record<string, any>;
 *   format: string;
 *   downloadUrl: string;
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Retrieve report from cache/database
    // In a production system, this would query a database
    const reportCache = (global as unknown as { reportCache: Map<string, CachedReport> }).reportCache || new Map();
    const cachedReport = reportCache.get(reportId);

    if (!cachedReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const { report, format, createdAt } = cachedReport;

    // Check if report has expired (optional - could implement TTL)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - createdAt.getTime() > maxAge) {
      // Clean up expired report
      reportCache.delete(reportId);
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    // Return report data with additional metadata
    return NextResponse.json({
      ...report,
      format,
      downloadUrl: `/api/audit/reports/${reportId}/download`,
      expiresAt: new Date(createdAt.getTime() + maxAge),
      size: JSON.stringify(report).length // Approximate size in bytes
    });

  } catch (error: unknown) {
    console.error('Get report endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}