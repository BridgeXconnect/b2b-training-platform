// Performance Analysis API Endpoints
// Task 2: Build Intelligent Content Recommendation Engine

import { NextRequest, NextResponse } from 'next/server';
import { UserPerformanceAnalyzer } from '@/lib/services/performance-analyzer';
import { IntelligentRecommendationService } from '@/lib/services/intelligent-recommendation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeInsights = searchParams.get('includeInsights') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    const performanceAnalysis = await recommendationService.analyzeUserPerformance(userId);

    let response: any = {
      success: true,
      data: performanceAnalysis,
      timestamp: new Date().toISOString()
    };

    if (includeInsights) {
      const insights = await recommendationService.getPerformanceInsights(userId);
      response.insights = insights;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Performance Analysis API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze user performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, performanceData } = body;

    if (!userId || !performanceData) {
      return NextResponse.json(
        { error: 'User ID and performance data are required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    await recommendationService.updatePerformanceModel(userId, performanceData);

    return NextResponse.json({
      success: true,
      message: 'Performance model updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update performance model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}