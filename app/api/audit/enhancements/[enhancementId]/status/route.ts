import { NextRequest, NextResponse } from 'next/server';
import EnhancementRecommendationRecord from '@/models/EnhancementRecommendationRecord';
import { handleApiError } from '@/lib/apiUtils';
import { EnhancementStatus } from '@/lib/audit/types';

/**
 * POST /api/audit/enhancements/:enhancementId/status
 * 
 * Updates the status of a specific enhancement recommendation
 * 
 * Path Parameters:
 * - enhancementId: string - ID of the enhancement
 * 
 * Request Body:
 * - status: EnhancementStatus - New status (proposed, approved, in_progress, completed, rejected)
 * - notes?: string - Optional notes about the status change
 * 
 * Requirements: 6.7, 13.8
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enhancementId: string }> }
) {
  try {
    const { enhancementId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!enhancementId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Enhancement ID is required' 
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Status is required' 
        },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses: EnhancementStatus[] = ['proposed', 'approved', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Find and update the enhancement record
    const existingRecord = await EnhancementRecommendationRecord.findOne({ 
      enhancementId 
    });

    if (!existingRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Enhancement with ID '${enhancementId}' not found` 
        },
        { status: 404 }
      );
    }

    // Update the status and timestamp
    existingRecord.status = status;
    existingRecord.updatedAt = new Date();
    
    // Add notes if provided (extend the model to include notes field if needed)
    if (notes) {
      // For now, we'll store notes in a metadata field
      // In a full implementation, you might want to add a notes field to the schema
      existingRecord.set('notes', notes);
    }

    await existingRecord.save();

    return NextResponse.json({
      success: true,
      data: {
        enhancementId,
        previousStatus: existingRecord.status,
        newStatus: status,
        updatedAt: existingRecord.updatedAt,
        notes: notes || null
      },
      message: `Enhancement status updated to '${status}'`
    });

  } catch (error: unknown) {
    console.error(`Error updating enhancement status for ${params.enhancementId}:`, error);
    return handleApiError(error);
  }
}