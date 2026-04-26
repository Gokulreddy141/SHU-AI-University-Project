import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/audit/report-generator';
import { getAuditResults } from '@/lib/audit/db-operations';
import { ReportFormat } from '@/lib/audit/types';
import { randomUUID } from 'crypto';

/**
 * POST /api/audit/reports/generate
 * 
 * Generate a report from audit results
 * 
 * Request body:
 * {
 *   executionId: string;
 *   reportType: 'audit' | 'performance' | 'compatibility' | 'roadmap' | 'demo-checklist';
 *   format: 'html' | 'pdf' | 'markdown' | 'json';
 * }
 * 
 * Response:
 * {
 *   reportId: string;
 *   downloadUrl: string;
 *   status: 'generated';
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, reportType, format } = body;

    // Validate required fields
    if (!executionId || !reportType || !format) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['executionId', 'reportType', 'format'] 
        },
        { status: 400 }
      );
    }

    // Validate report type
    const validReportTypes = ['audit', 'performance', 'compatibility', 'roadmap', 'demo-checklist'];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { 
          error: 'Invalid report type', 
          validTypes: validReportTypes 
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats: ReportFormat[] = ['html', 'pdf', 'markdown', 'json'];
    if (!validFormats.includes(format as ReportFormat)) {
      return NextResponse.json(
        { 
          error: 'Invalid format', 
          validFormats 
        },
        { status: 400 }
      );
    }

    const reportGenerator = new ReportGenerator();
    const reportId = randomUUID();

    let generatedReport;

    try {
      switch (reportType) {
        case 'audit': {
          // Get audit results from database
          const auditResults = await getAuditResults(executionId);
          if (!auditResults) {
            return NextResponse.json(
              { error: 'Audit execution not found' },
              { status: 404 }
            );
          }
          generatedReport = await reportGenerator.generateAuditReport(auditResults as any);
          break;
        }

        case 'performance': {
          // Get performance data from audit results
          const auditResults = await getAuditResults(executionId) as any;
          if (!auditResults?.performanceAnalysis) {
            return NextResponse.json(
              { error: 'Performance data not found for execution' },
              { status: 404 }
            );
          }
          generatedReport = await reportGenerator.generatePerformanceReport(
            auditResults.performanceAnalysis.performanceData
          );
          break;
        }

        case 'compatibility': {
          // Get compatibility data from audit results
          const auditResults = await getAuditResults(executionId) as any;
          if (!auditResults?.compatibilityData) {
            return NextResponse.json(
              { error: 'Compatibility data not found for execution' },
              { status: 404 }
            );
          }
          generatedReport = await reportGenerator.generateCompatibilityMatrix(
            auditResults.compatibilityData
          );
          break;
        }

        case 'roadmap': {
          // Get enhancement recommendations from audit results
          const auditResults = await getAuditResults(executionId) as any;
          if (!auditResults?.enhancementRecommendations) {
            return NextResponse.json(
              { error: 'Enhancement recommendations not found for execution' },
              { status: 404 }
            );
          }
          
          // Convert enhancement recommendations to roadmap format
          const roadmap = {
            phases: [{
              phaseName: 'Phase 1: High Priority Enhancements',
              enhancements: auditResults.enhancementRecommendations.slice(0, 5),
              estimatedDuration: '2-4 weeks',
              dependencies: []
            }],
            totalEstimatedHours: auditResults.enhancementRecommendations.reduce(
              (total: number, enhancement: Record<string, unknown>) => total + ((enhancement.estimatedHours as number) || 8), 0
            ),
            recommendedSequence: auditResults.enhancementRecommendations.map((e: Record<string, unknown>) => e.name)
          };
          
          generatedReport = await reportGenerator.generateRoadmapDocument(roadmap);
          break;
        }

        case 'demo-checklist': {
          generatedReport = await reportGenerator.generateDemonstrationChecklist();
          break;
        }

        default:
          return NextResponse.json(
            { error: 'Unsupported report type' },
            { status: 400 }
          );
      }

      // Override report ID with our generated one
      generatedReport.reportId = reportId;

      // Export report in requested format
      const exportedFilePath = await reportGenerator.exportReport(generatedReport, format as ReportFormat);

      // Store report metadata in memory/cache for retrieval
      // In a production system, this would be stored in a database
      (global as Record<string, unknown>).reportCache = (global as Record<string, unknown>).reportCache || new Map();
      ((global as Record<string, unknown>).reportCache as Map<string, unknown>).set(reportId, {
        report: generatedReport,
        filePath: exportedFilePath,
        format,
        createdAt: new Date()
      });

      const downloadUrl = `/api/audit/reports/${reportId}/download`;

      return NextResponse.json({
        reportId,
        downloadUrl,
        status: 'generated',
        reportType,
        format,
        generatedAt: generatedReport.generatedAt
      });

    } catch (generationError) {
      console.error('Report generation error:', generationError);
      return NextResponse.json(
        { 
          error: 'Failed to generate report', 
          details: generationError instanceof Error ? generationError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Report generation endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}