import { NextRequest, NextResponse } from 'next/server';
import { EnhancementRecommender } from '@/lib/audit/enhancement-recommender';
import { handleApiError } from '@/lib/apiUtils';

/**
 * GET /api/audit/enhancements
 * 
 * Returns prioritized enhancement recommendations and roadmap
 * 
 * Query Parameters:
 * - category?: string - Filter by AI category (vision, audio, behavioral, system)
 * - status?: string - Filter by enhancement status
 * 
 * Requirements: 6.7, 13.8
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'vision' | 'audio' | 'behavioral' | 'system' | null;
    const categoryFallback = typeof category === 'string' && ['vision', 'audio', 'behavioral', 'system'].includes(category)
      ? category as 'vision' | 'audio' | 'behavioral' | 'system'
      : undefined;

    const recommender = new EnhancementRecommender();
    
    // Get enhancement recommendations
    const enhancements = await recommender.recommendEnhancements(categoryFallback);
    const prioritizedEnhancements = recommender.prioritizeEnhancements(enhancements);
    
    // Generate roadmap
    const roadmap = await recommender.generateRoadmap();
    
    // Filter by status if provided
    let filteredEnhancements = prioritizedEnhancements;
    if (status) {
      // For now, all recommendations are in 'proposed' status
      // This would be enhanced when we have database persistence
      filteredEnhancements = status === 'proposed' ? prioritizedEnhancements : [];
    }

    return NextResponse.json({
      success: true,
      data: {
        enhancements: filteredEnhancements,
        roadmap,
        metadata: {
          totalEnhancements: filteredEnhancements.length,
          categories: [...new Set(filteredEnhancements.map(e => e.category))],
          totalEstimatedHours: roadmap.totalEstimatedHours,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching enhancement recommendations:', error);
    return handleApiError(error);
  }
}