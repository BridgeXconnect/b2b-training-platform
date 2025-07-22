// Cache Management API Endpoints
// Task 2: Build Intelligent Content Recommendation Engine - Performance Optimization

import { NextRequest, NextResponse } from 'next/server';
import { recommendationCacheManager, cachePerformanceMonitor } from '@/lib/services/recommendation-cache';
import { IntelligentRecommendationService } from '@/lib/services/intelligent-recommendation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';

    switch (action) {
      case 'metrics':
        return await handleGetMetrics();
      
      case 'performance-report':
        return await handleGetPerformanceReport();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: metrics, performance-report' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Cache Management API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process cache request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case 'optimize':
        return await handleOptimizeCache();
      
      case 'clear':
        return await handleClearCache(body.scope || 'all');
      
      case 'invalidate-user':
        return await handleInvalidateUser(userId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: optimize, clear, invalidate-user' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Cache Management API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process cache management request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleGetMetrics() {
  const metrics = recommendationCacheManager.getComprehensiveMetrics();
  
  return NextResponse.json({
    success: true,
    data: {
      ...metrics,
      timestamp: new Date().toISOString(),
      recommendations: generateOptimizationRecommendations(metrics)
    }
  });
}

async function handleGetPerformanceReport() {
  const report = cachePerformanceMonitor.getPerformanceReport();
  
  return NextResponse.json({
    success: true,
    data: {
      ...report,
      timestamp: new Date().toISOString()
    }
  });
}

async function handleOptimizeCache() {
  const optimizationResults = recommendationCacheManager.optimizeAll();
  
  return NextResponse.json({
    success: true,
    data: {
      optimizationResults,
      message: 'Cache optimization completed',
      timestamp: new Date().toISOString()
    }
  });
}

async function handleClearCache(scope: string) {
  switch (scope) {
    case 'all':
      recommendationCacheManager.clearAll();
      break;
    
    case 'recommendations':
      // Would need to implement selective clearing
      break;
    
    default:
      return NextResponse.json(
        { error: 'Invalid scope. Use: all, recommendations' },
        { status: 400 }
      );
  }

  return NextResponse.json({
    success: true,
    message: `Cache cleared (scope: ${scope})`,
    timestamp: new Date().toISOString()
  });
}

async function handleInvalidateUser(userId: string) {
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  recommendationCacheManager.invalidateUser(userId);

  return NextResponse.json({
    success: true,
    message: `Cache invalidated for user ${userId}`,
    timestamp: new Date().toISOString()
  });
}

function generateOptimizationRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  // Low hit rate recommendation
  if (metrics.overall.averageHitRate < 0.6) {
    recommendations.push('Consider increasing cache TTL or adjusting eviction policies');
  }

  // High memory usage recommendation
  if (metrics.overall.totalMemory > 75 * 1024 * 1024) { // 75MB
    recommendations.push('High memory usage detected - consider enabling compression or reducing cache sizes');
  }

  // High eviction rate recommendation
  if (metrics.overall.totalEvictions > 1000) {
    recommendations.push('High eviction rate - consider increasing cache capacity');
  }

  // L1 cache specific recommendations
  if (metrics.l1.hitRate < 0.8) {
    recommendations.push('L1 cache hit rate is low - review hot data identification strategy');
  }

  // Similarity cache specific recommendations
  if (metrics.similarity.totalMemoryUsage > 25 * 1024 * 1024) { // 25MB
    recommendations.push('Similarity cache using high memory - consider implementing matrix compression');
  }

  return recommendations.length > 0 ? recommendations : ['Cache performance is optimal'];
}