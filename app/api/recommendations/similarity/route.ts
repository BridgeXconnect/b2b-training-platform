// Content Similarity API Endpoints
// Task 2: Build Intelligent Content Recommendation Engine

import { NextRequest, NextResponse } from 'next/server';
import { ContentSimilarityEngine } from '@/lib/services/content-matcher';
import { ContentItem } from '@/lib/services/recommendation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const similarityEngine = new ContentSimilarityEngine();

    switch (action) {
      case 'calculate-similarity':
        return await handleCalculateSimilarity(similarityEngine, data);
      
      case 'build-matrix':
        return await handleBuildMatrix(similarityEngine, data);
      
      case 'find-similar':
        return await handleFindSimilar(similarityEngine, data);
      
      case 'extract-features':
        return await handleExtractFeatures(similarityEngine, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Content Similarity API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process similarity request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCalculateSimilarity(
  engine: ContentSimilarityEngine,
  data: { content1: ContentItem; content2: ContentItem }
) {
  const { content1, content2 } = data;

  if (!content1 || !content2) {
    return NextResponse.json(
      { error: 'Two content items are required for similarity calculation' },
      { status: 400 }
    );
  }

  const similarity = await engine.calculateContentSimilarity(content1, content2);

  return NextResponse.json({
    success: true,
    data: {
      similarity,
      content1Id: content1.id,
      content2Id: content2.id
    },
    timestamp: new Date().toISOString()
  });
}

async function handleBuildMatrix(
  engine: ContentSimilarityEngine,
  data: { contents: ContentItem[] }
) {
  const { contents } = data;

  if (!contents || !Array.isArray(contents) || contents.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 content items are required for matrix building' },
      { status: 400 }
    );
  }

  const matrix = await engine.buildSimilarityMatrix(contents);

  return NextResponse.json({
    success: true,
    data: {
      matrix,
      contentCount: contents.length
    },
    timestamp: new Date().toISOString()
  });
}

async function handleFindSimilar(
  engine: ContentSimilarityEngine,
  data: { targetContent: ContentItem; candidateContents: ContentItem[]; maxRecommendations?: number }
) {
  const { targetContent, candidateContents, maxRecommendations = 5 } = data;

  if (!targetContent || !candidateContents || !Array.isArray(candidateContents)) {
    return NextResponse.json(
      { error: 'Target content and candidate contents are required' },
      { status: 400 }
    );
  }

  const similarContent = await engine.findSimilarContent(
    targetContent,
    candidateContents,
    maxRecommendations
  );

  return NextResponse.json({
    success: true,
    data: {
      targetContentId: targetContent.id,
      similarContent,
      count: similarContent.length
    },
    timestamp: new Date().toISOString()
  });
}

async function handleExtractFeatures(
  engine: ContentSimilarityEngine,
  data: { content: ContentItem }
) {
  const { content } = data;

  if (!content) {
    return NextResponse.json(
      { error: 'Content item is required for feature extraction' },
      { status: 400 }
    );
  }

  const features = await engine.extractContentFeatures(content);

  return NextResponse.json({
    success: true,
    data: features,
    timestamp: new Date().toISOString()
  });
}