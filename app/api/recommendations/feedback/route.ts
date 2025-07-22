// Recommendation Feedback API Endpoints
// Task 2: Build Intelligent Content Recommendation Engine

import { NextRequest, NextResponse } from 'next/server';
import { IntelligentRecommendationService } from '@/lib/services/intelligent-recommendation-service';
import { RecommendationFeedback } from '@/lib/services/recommendation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const feedbackData: RecommendationFeedback = {
      userId: body.userId,
      contentId: body.contentId,
      recommendationId: body.recommendationId,
      rating: body.rating,
      completed: body.completed,
      timeSpent: body.timeSpent,
      difficulty: body.difficulty,
      engagement: body.engagement,
      helpfulness: body.helpfulness,
      comments: body.comments,
      timestamp: new Date()
    };

    // Validate required fields
    if (!feedbackData.userId || !feedbackData.contentId || !feedbackData.recommendationId) {
      return NextResponse.json(
        { error: 'User ID, Content ID, and Recommendation ID are required' },
        { status: 400 }
      );
    }

    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    await recommendationService.recordFeedback(feedbackData);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendation Feedback API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contentId = searchParams.get('contentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId && !contentId) {
      return NextResponse.json(
        { error: 'Either User ID or Content ID is required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    const feedback = await recommendationService.getFeedbackHistory(
      userId,
      contentId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: feedback,
      count: feedback.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Feedback History API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve feedback history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackData } = body;

    if (!feedbackData || !Array.isArray(feedbackData) || feedbackData.length === 0) {
      return NextResponse.json(
        { error: 'Feedback data array is required' },
        { status: 400 }
      );
    }

    const recommendationService = new IntelligentRecommendationService();
    await recommendationService.updateRecommendationModel(feedbackData);

    return NextResponse.json({
      success: true,
      message: 'Recommendation model updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Model Update API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update recommendation model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}