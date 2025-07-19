"""
Course generation router with AI integration
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime
import logging

from models import (
    GeneratedCourse,
    GeneratedCourseResponse,
    ClientRequest,
    UserResponse,
    CEFRLevel,
    SOPDocument
)
from database import get_db
from auth import get_current_user
from services.ai_service import ai_service, CourseGenerationRequest

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generate/{request_id}", response_model=GeneratedCourseResponse)
async def generate_course(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an AI-powered course for a client request"""
    
    logger.info(f"Starting AI course generation for request {request_id}")
    
    # Verify request exists and user has access
    result = await db.execute(
        select(ClientRequest).where(ClientRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client request not found"
        )
    
    if current_user.role == "sales" and request.sales_rep_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        # Extract data from request
        company_details = request.company_details
        training_cohort = request.training_cohort
        training_objectives = request.training_objectives
        course_preferences = request.course_preferences
        
        # Get SOP documents and content
        sop_result = await db.execute(
            select(SOPDocument).where(SOPDocument.client_request_id == request_id)
        )
        sop_documents = sop_result.scalars().all()
        
        # Combine SOP content
        sop_content = ""
        sop_analysis = {}
        if sop_documents:
            sop_texts = []
            for doc in sop_documents:
                if doc.extracted_text:
                    sop_texts.append(doc.extracted_text)
                if doc.analysis_results:
                    sop_analysis.update(doc.analysis_results)
            
            sop_content = "\n\n".join(sop_texts)
            
            # If no existing analysis, analyze the SOP content
            if not sop_analysis and sop_content:
                logger.info("Analyzing SOP content with AI")
                sop_analysis = await ai_service.analyze_sop_document(
                    sop_content, 
                    company_details
                )
        
        # Prepare AI course generation request
        ai_request = CourseGenerationRequest(
            company_name=company_details.get("name", "Company"),
            industry=company_details.get("industry", "Business"),
            target_cefr_level=training_cohort.get("target_cefr_level", "B2"),
            current_cefr_level=training_cohort.get("current_cefr_level", "A2"),
            course_duration=course_preferences.get("total_length", 40),
            participant_count=training_cohort.get("participant_count", 15),
            focus_areas=sop_analysis.get("training_focus", ["Business Communication"]),
            sop_content=sop_content,
            sop_analysis=sop_analysis,
            specific_goals=training_objectives.get("specific_goals", []),
            delivery_method=course_preferences.get("delivery_method", "hybrid")
        )
        
        # Generate course with AI
        logger.info("Generating course content with OpenAI")
        ai_course = await ai_service.generate_course(ai_request)
        
        # Create course record
        db_course = GeneratedCourse(
            id=str(uuid.uuid4()),
            client_request_id=request_id,
            title=ai_course["title"],
            description=ai_course["description"],
            cefr_level=CEFRLevel(ai_course["cefr_level"]),
            total_duration=ai_course["total_duration"],
            status="generated",
            generated_by="ai",
            modules=ai_course["modules"]
        )
        
        db.add(db_course)
        await db.commit()
        await db.refresh(db_course)
        
        logger.info(f"AI course generation completed successfully for request {request_id}")
        return GeneratedCourseResponse.from_orm(db_course)
        
    except Exception as e:
        logger.error(f"Error in AI course generation: {str(e)}")
        await db.rollback()
        
        # Fallback to basic course generation
        logger.info("Falling back to basic course generation")
        return await _generate_fallback_course(request, request_id, db)

async def _generate_fallback_course(request: ClientRequest, request_id: str, db: Session) -> GeneratedCourseResponse:
    """Fallback course generation when AI fails"""
    
    company_name = request.company_details.get("name", "Company")
    target_level = request.training_cohort.get("target_cefr_level", "B2")
    total_duration = request.course_preferences.get("total_length", 40)
    
    # Generate basic course structure
    module_count = max(1, total_duration // 8)
    lessons_per_module = request.course_preferences.get("lessons_per_module", 4)
    
    modules = []
    for i in range(module_count):
        module = {
            "id": f"module-{i + 1}",
            "title": f"Module {i + 1}: Business Communication Fundamentals",
            "description": f"CEFR {target_level} aligned training module for {company_name}",
            "lessons": [
                {
                    "id": f"lesson-{i + 1}-{j + 1}",
                    "title": f"Lesson {j + 1}: Core Skills",
                    "duration": 90,
                    "activities": [
                        {
                            "id": f"activity-{i + 1}-{j + 1}-1",
                            "type": "reading",
                            "title": "Business Reading Exercise",
                            "sop_integrated": False,
                            "estimated_time": 20
                        }
                    ]
                }
                for j in range(lessons_per_module)
            ],
            "assessments": [
                {
                    "id": f"assessment-{i + 1}",
                    "type": "quiz",
                    "title": f"Module {i + 1} Assessment",
                    "cefr_level": target_level,
                    "passing_score": 75
                }
            ],
            "duration": 8 * 60,
            "learning_objectives": [
                "Master business communication skills",
                "Apply professional terminology",
                "Demonstrate workplace interactions"
            ]
        }
        modules.append(module)
    
    # Create fallback course record
    db_course = GeneratedCourse(
        id=str(uuid.uuid4()),
        client_request_id=request_id,
        title=f"Business English Training for {company_name}",
        description=f"CEFR {target_level} aligned English training course",
        cefr_level=CEFRLevel(target_level),
        total_duration=total_duration,
        status="generated",
        generated_by="fallback",
        modules=modules
    )
    
    db.add(db_course)
    await db.commit()
    await db.refresh(db_course)
    
    return GeneratedCourseResponse.from_orm(db_course)

@router.get("/requests/{request_id}/courses", response_model=List[GeneratedCourseResponse])
async def get_courses_for_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all generated courses for a client request"""
    
    # Verify request exists and user has access
    result = await db.execute(
        select(ClientRequest).where(ClientRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client request not found"
        )
    
    if current_user.role == "sales" and request.sales_rep_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get courses
    result = await db.execute(
        select(GeneratedCourse).where(GeneratedCourse.client_request_id == request_id)
    )
    courses = result.scalars().all()
    
    return [GeneratedCourseResponse.from_orm(course) for course in courses]

@router.get("/{course_id}", response_model=GeneratedCourseResponse)
async def get_course(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific generated course"""
    
    result = await db.execute(
        select(GeneratedCourse).where(GeneratedCourse.id == course_id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Verify user has access to the related request
    result = await db.execute(
        select(ClientRequest).where(ClientRequest.id == course.client_request_id)
    )
    request = result.scalar_one_or_none()
    
    if current_user.role == "sales" and request.sales_rep_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return GeneratedCourseResponse.from_orm(course)

# Export router
courses_router = router