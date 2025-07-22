/**
 * Voice Analysis API Route
 * Handles pronunciation analysis requests for Story 5.4 Voice Features
 */

import { NextRequest, NextResponse } from 'next/server';
import { pronunciationAnalyzer } from '@/lib/voice/pronunciationAnalysis';
import { log } from '@/lib/logger';
import { UsageMonitor } from '@/lib/usage-monitor';
import { RateLimiter } from '@/lib/ai-config';

export async function POST(request: NextRequest) {
  let userId = 'anonymous';
  
  try {
    const formData = await request.formData();
    
    // Extract form data
    const audioFile = formData.get('audio') as File;
    const targetText = formData.get('targetText') as string;
    const cefrLevel = formData.get('cefrLevel') as string;
    const exerciseType = formData.get('exerciseType') as string;
    const businessContext = formData.get('businessContext') as string;
    userId = formData.get('userId') as string || 'anonymous';

    // Validate required fields
    if (!audioFile || !targetText || !cefrLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, targetText, or cefrLevel' },
        { status: 400 }
      );
    }

    // Rate limiting check
    if (!RateLimiter.canMakeRequest(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before making another request.' },
        { status: 429 }
      );
    }

    // Usage limit check
    const usageCheck = UsageMonitor.canUserMakeRequest(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, tokensRemaining: usageCheck.tokensRemaining },
        { status: 429 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { 
      type: audioFile.type || 'audio/webm' 
    });

    // Analyze pronunciation
    const analysisRequest = {
      audioBlob,
      targetText,
      cefrLevel,
      exerciseType: exerciseType as any,
      businessContext,
      userId
    };

    const result = await pronunciationAnalyzer.analyzePronunciation(analysisRequest);

    // Record the request for rate limiting
    RateLimiter.recordRequest(userId);

    // Record usage for monitoring (estimate tokens used for voice analysis)
    const estimatedTokens = Math.ceil(targetText.length / 4); // Rough estimate
    await UsageMonitor.recordUsage(
      userId,
      `voice_session_${Date.now()}`,
      'gpt-4',
      estimatedTokens,
      estimatedTokens * 2, // Output usually longer
      estimatedTokens * 0.03 / 1000, // Rough cost estimate
      'voice-analysis',
      {
        cefrLevel,
        businessContext
      }
    );

    log.userAction('Voice analysis completed', userId, {
      score: result.analysis.overallScore,
      exerciseType,
      cefrLevel
    });

    return NextResponse.json({
      success: true,
      result,
      userStats: {
        tokensRemaining: usageCheck.tokensRemaining,
        budgetRemaining: usageCheck.budgetRemaining
      }
    });

  } catch (error) {
    log.error('Voice analysis API error', 'VOICE', { 
      error: error instanceof Error ? error.message : String(error), 
      userId 
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Voice analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      service: 'voice-analysis',
      timestamp: new Date().toISOString(),
      features: {
        pronunciationAnalysis: true,
        realTimeProcessing: true,
        cefrAlignment: true,
        businessContext: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}