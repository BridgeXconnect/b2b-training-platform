// API endpoint to validate Story 5.3 implementation
// GET /api/validate-learning-path

import { NextResponse } from 'next/server';
import { validateLearningPathImplementation } from '../../../lib/learning/validation';

export async function GET() {
  try {
    console.log('🚀 Starting Story 5.3 validation...');
    
    const result = await validateLearningPathImplementation();
    
    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: 'Story 5.3: Intelligent Learning Path Optimization - Successfully Validated!',
        data: result.summary,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Story 5.3 validation failed',
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API validation error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Validation endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}