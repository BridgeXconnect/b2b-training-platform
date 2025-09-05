import { NextRequest, NextResponse } from 'next/server';
import { CourseGeneratorService, CourseRequest } from '@/lib/services/course-generator';

export async function POST(request: NextRequest) {
  try {
    const courseRequest: CourseRequest = await request.json();

    // Validate required fields
    if (!courseRequest.clientNeeds || !courseRequest.industry || !courseRequest.cefrLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: clientNeeds, industry, cefrLevel' },
        { status: 400 }
      );
    }

    // Generate curriculum
    const curriculum = await CourseGeneratorService.generateCurriculum(courseRequest);

    return NextResponse.json({
      success: true,
      curriculum,
      message: 'Curriculum generated successfully'
    });

  } catch (error) {
    console.error('Course generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate course curriculum',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}