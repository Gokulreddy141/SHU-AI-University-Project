import { NextRequest, NextResponse } from 'next/server';
import { EnhancementRecommender } from '@/lib/audit/enhancement-recommender';
import { handleApiError } from '@/lib/apiUtils';

/**
 * GET /api/audit/enhancements/:enhancementId/guide
 * 
 * Returns detailed implementation guide for a specific enhancement
 * 
 * Path Parameters:
 * - enhancementId: string - ID of the enhancement
 * 
 * Requirements: 6.8, 20.7, 20.8, 20.9
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enhancementId: string }> }
) {
  try {
    const { enhancementId } = await params;

    if (!enhancementId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement ID is required' 
        },
        { status: 400 }
      );
    }

    const recommender = new EnhancementRecommender();
    
    // Generate implementation guide for the specific enhancement
    const guide = await recommender.generateImplementationGuide(enhancementId);
    
    if (!guide) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Enhancement with ID '${enhancementId}' not found` 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        guide,
        metadata: {
          enhancementId,
          generatedAt: new Date().toISOString(),
          totalDependencies: guide.requiredDependencies.length,
          totalCodeExamples: guide.codeExamples.length,
          totalIntegrationPoints: guide.integrationPoints.length
        }
      }
    });

  } catch (error) {
    const { enhancementId: errorEnhancementId } = await params;
    console.error(`Error fetching implementation guide for enhancement ${errorEnhancementId}:`, error);
    return handleApiError(error);
  }
}