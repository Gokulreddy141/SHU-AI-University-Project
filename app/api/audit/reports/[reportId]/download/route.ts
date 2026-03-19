import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export interface CachedReport {
  report: { reportType: string; [key: string]: unknown };
  filePath: string;
  format: string;
  createdAt: Date;
}

/**
 * GET /api/audit/reports/:reportId/download
 * 
 * Stream report file for download
 * Supports multiple formats (HTML, PDF, Markdown, JSON)
 * 
 * Response: File stream with appropriate headers
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

    // Retrieve report metadata from cache/database
    const reportCache = (global as unknown as { reportCache: Map<string, CachedReport> }).reportCache || new Map();
    const cachedReport = reportCache.get(reportId);

    if (!cachedReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const { report, filePath, format, createdAt } = cachedReport;

    // Check if report has expired
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - createdAt.getTime() > maxAge) {
      // Clean up expired report
      reportCache.delete(reportId);
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Report file not found' },
        { status: 404 }
      );
    }

    try {
      // Read file content
      const fileContent = await readFile(filePath);
      
      // Determine content type and file extension based on format
      let contentType: string;
      let fileExtension: string;
      
      switch (format) {
        case 'html':
          contentType = 'text/html';
          fileExtension = 'html';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
        case 'markdown':
          contentType = 'text/markdown';
          fileExtension = 'md';
          break;
        case 'json':
          contentType = 'application/json';
          fileExtension = 'json';
          break;
        default:
          contentType = 'application/octet-stream';
          fileExtension = 'txt';
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `audit-report-${report.reportType}-${timestamp}.${fileExtension}`;

      // Create response with appropriate headers
      const response = new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileContent.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      return response;

    } catch (fileError: unknown) {

      console.error('File read error:', fileError);
      return NextResponse.json(
        { 
          error: 'Failed to read report file', 
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {

    console.error('Download report endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/audit/reports/:reportId/download
 * 
 * Get file metadata without downloading
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;

    if (!reportId) {
      return new NextResponse(null, { status: 400 });
    }

    // Retrieve report metadata from cache/database
    const reportCache = (global as unknown as { reportCache: Map<string, CachedReport> }).reportCache || new Map();
    const cachedReport = reportCache.get(reportId);

    if (!cachedReport) {
      return new NextResponse(null, { status: 404 });
    }

    const { filePath, format, createdAt } = cachedReport;

    // Check if report has expired
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - createdAt.getTime() > maxAge) {
      return new NextResponse(null, { status: 410 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    // Get file stats
    const fileContent = await readFile(filePath);
    
    // Determine content type based on format
    let contentType: string;
    switch (format) {
      case 'html':
        contentType = 'text/html';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'markdown':
        contentType = 'text/markdown';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileContent.length.toString(),
        'Last-Modified': createdAt.toUTCString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: unknown) {

    console.error('HEAD report endpoint error:', error);
    return new NextResponse(null, { status: 500 });
  }
}