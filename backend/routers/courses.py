"""
Course generation router with AI integration and comprehensive Sentry monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime
import logging
import sentry_sdk
from config.sentry_config import SentryConfig

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
    """Generate an AI-powered course for a client request with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="course_service", name="generate_course") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("request_id", request_id)
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("user_role", current_user.role)
            transaction.set_tag("operation", "ai_course_generation")
            transaction.set_tag("service", "ai_powered")
            
            logger.info(f"Starting AI course generation for request {request_id}")
            
            # Add breadcrumb for course generation start
            sentry_sdk.add_breadcrumb(
                message=f"Starting AI course generation for request {request_id}",
                category="course_service",
                level="info",
                data={"request_id": request_id, "user": current_user.email}
            )
            
            # Verify request exists and user has access
            result = await db.execute(
                select(ClientRequest).where(ClientRequest.id == request_id)
            )
            request = result.scalar_one_or_none()
            
            if not request:
                sentry_sdk.add_breadcrumb(
                    message=f"Client request not found for course generation: {request_id}",
                    category="course_service",
                    level="warning"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client request not found"
                )
            
            if current_user.role == "sales" and request.sales_rep_id != current_user.id:
                sentry_sdk.add_breadcrumb(
                    message=f"Access denied for course generation: {request_id}",
                    category="course_service",
                    level="warning",
                    data={"user_role": current_user.role, "owner_id": request.sales_rep_id}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
            
            # Set additional transaction context from request
            company_name = request.company_details.get("name", "Unknown")
            target_level = request.training_cohort.get("target_cefr_level", "Unknown")
            course_duration = request.course_preferences.get("total_length", 40)
            
            transaction.set_tag("company_name", company_name)
            transaction.set_tag("target_cefr_level", target_level)
            transaction.set_tag("course_duration", course_duration)
            
            # Extract data from request
            company_details = request.company_details
            training_cohort = request.training_cohort
            training_objectives = request.training_objectives
            course_preferences = request.course_preferences
            
            # Add breadcrumb for data extraction
            sentry_sdk.add_breadcrumb(
                message="Extracted request data for course generation",
                category="course_service",
                level="info",
                data={
                    "company_name": company_name,
                    "target_level": target_level,
                    "duration": course_duration
                }
            )
            
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
                
                # Add breadcrumb for SOP processing
                sentry_sdk.add_breadcrumb(
                    message=f"Processing {len(sop_documents)} SOP documents",
                    category="course_service",
                    level="info",
                    data={
                        "sop_count": len(sop_documents),
                        "content_length": len(sop_content),
                        "has_analysis": bool(sop_analysis)
                    }
                )
                
                # If no existing analysis, analyze the SOP content
                if not sop_analysis and sop_content:
                    logger.info("Analyzing SOP content with AI")
                    sentry_sdk.add_breadcrumb(
                        message="Starting SOP content analysis",
                        category="course_service",
                        level="info"
                    )
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
            
            # Add breadcrumb for AI request preparation
            sentry_sdk.add_breadcrumb(
                message="Prepared AI course generation request",
                category="course_service",
                level="info",
                data={
                    "has_sop_content": bool(sop_content),
                    "focus_areas_count": len(ai_request.focus_areas),
                    "delivery_method": ai_request.delivery_method
                }
            )
            
            # Generate course with AI
            logger.info("Generating course content with OpenAI")
            sentry_sdk.add_breadcrumb(
                message="Starting AI course content generation",
                category="course_service",
                level="info"
            )
            
            ai_course = await ai_service.generate_course(ai_request)
            
            # Create course record
            course_id = str(uuid.uuid4())
            db_course = GeneratedCourse(
                id=course_id,
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
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"AI course generated successfully: {course_id}",
                category="course_service",
                level="info",
                data={
                    "course_id": course_id,
                    "title": ai_course["title"],
                    "modules_count": len(ai_course["modules"]),
                    "cefr_level": ai_course["cefr_level"],
                    "total_duration": ai_course["total_duration"]
                }
            )
            
            logger.info(f"AI course generation completed successfully for request {request_id}")
            return GeneratedCourseResponse.from_orm(db_course)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in AI course generation: {str(e)}")
            await db.rollback()
            
            # Capture AI service error
            SentryConfig.capture_ai_service_error(e, {
                "request_id": request_id,
                "company_name": company_name,
                "operation": "course_generation",
                "fallback_triggered": True
            })
            
            # Add breadcrumb for fallback
            sentry_sdk.add_breadcrumb(
                message="AI course generation failed, using fallback",
                category="course_service",
                level="warning",
                data={"error": str(e), "fallback": True}
            )
            
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