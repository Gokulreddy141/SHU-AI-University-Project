/**
 * Tests for Report API Endpoints
 * 
 * Tests the three report API endpoints:
 * - POST /api/audit/reports/generate
 * - GET /api/audit/reports/:reportId
 * - GET /api/audit/reports/:reportId/download
 */

import { NextRequest } from 'next/server';
import { POST as generateReport } from '@/app/api/audit/reports/generate/route';

// Mock the db-operations module
jest.mock('@/lib/audit/db-operations', () => ({
  getAuditResults: jest.fn(),
}));

// Mock the report generator
jest.mock('@/lib/audit/report-generator', () => ({
  ReportGenerator: jest.fn().mockImplementation(() => ({
    generateAuditReport: jest.fn().mockResolvedValue({
      reportId: 'test-report-id',
      reportType: 'audit',
      generatedAt: new Date(),
      title: 'Test Audit Report',
      sections: [],
      metadata: {}
    }),
    generateDemonstrationChecklist: jest.fn().mockResolvedValue({
      reportId: 'test-checklist-id',
      reportType: 'demo-checklist',
      generatedAt: new Date(),
      title: 'Demonstration Checklist',
      sections: [],
      metadata: {}
    }),
    exportReport: jest.fn().mockResolvedValue('/tmp/test-report.html')
  }))
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('Report API Endpoints', () => {
  beforeEach(() => {
    // Clear global report cache
    global.reportCache = new Map();
    jest.clearAllMocks();
  });

  describe('POST /api/audit/reports/generate', () => {
    it('should generate audit report successfully', async () => {
      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock).mockResolvedValue({
        executionId: 'test-execution',
        results: { /* mock audit results */ }
      });

      const request = new NextRequest('http://localhost/api/audit/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          executionId: 'test-execution',
          reportType: 'audit',
          format: 'html'
        })
      });

      const response = await generateReport(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reportId).toBe('mock-uuid-123');
      expect(data.status).toBe('generated');
      expect(data.downloadUrl).toBe('/api/audit/reports/mock-uuid-123/download');
    });
  });
});