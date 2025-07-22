// Recommendation API Endpoints
// Task 2: Build Intelligent Content Recommendation Engine

import { NextRequest, NextResponse } from 'next/server';
import { IntelligentRecommendationService } from '@/lib/services/intelligent-recommendation-service';
import { RecommendationRequest, RecommendationType } from '@/lib/services/recommendation-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as RecommendationType || 'immediate';
    const maxRecommendations = parseInt(searchParams.get('maxRecommendations') || '5');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    const recommendations = await recommendationService.getRecommendationsForUser(
      userId,
      type,
      maxRecommendations
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendation API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recommendationType, constraints, contentPool } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    
    // Build recommendation request
    const recommendationRequest: Partial<RecommendationRequest> = {
      maxRecommendations: constraints?.maxRecommendations || 5,
      contentPool: contentPool || [],
      recommendationType: recommendationType || 'immediate',
      constraints
    };

    const result = await recommendationService.generateCustomRecommendations(
      userId,
      recommendationRequest
    );

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom Recommendation API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate custom recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}