import { NextRequest, NextResponse } from 'next/server';
import { CourseGeneratorService, CurriculumOutline } from '@/lib/services/course-generator';

export async function POST(request: NextRequest) {
  try {
    const { curriculum }: { curriculum: CurriculumOutline } = await request.json();

    if (!curriculum) {
      return NextResponse.json(
        { error: 'Curriculum is required' },
        { status: 400 }
      );
    }

    // Generate full course materials
    const fullCourse = await CourseGeneratorService.generateFullCourse(curriculum);

    return NextResponse.json({
      success: true,
      course: fullCourse,
      message: 'Full course materials generated successfully'
    });

  } catch (error) {
    console.error('Course export error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate full course materials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}