"""
Course generation router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
from datetime import datetime

from models import (
    GeneratedCourse,
    GeneratedCourseResponse,
    ClientRequest,
    UserResponse,
    CEFRLevel
)
from database import get_db
from auth import get_current_user

router = APIRouter()

@router.post("/generate/{request_id}", response_model=GeneratedCourseResponse)
async def generate_course(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a course for a client request"""
    
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
    
    # Extract data from request
    company_name = request.company_details.get("name", "Company")
    target_level = request.training_cohort.get("target_cefr_level", "B2")
    total_duration = request.course_preferences.get("total_length", 40)
    
    # Generate course structure (simplified for now)
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
                            "title": "SOP-Based Reading Exercise",
                            "sopIntegrated": True,
                            "estimatedTime": 20
                        },
                        {
                            "id": f"activity-{i + 1}-{j + 1}-2",
                            "type": "vocabulary",
                            "title": "Industry Terminology",
                            "sopIntegrated": True,
                            "estimatedTime": 15
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
                    "cefrLevel": target_level,
                    "passingScore": 75
                }
            ],
            "duration": 8 * 60,  # 8 hours in minutes
            "learningObjectives": [
                "Master business communication skills",
                "Apply company-specific terminology",
                "Demonstrate professional interactions"
            ]
        }
        modules.append(module)
    
    # Create course record
    db_course = GeneratedCourse(
        id=str(uuid.uuid4()),
        client_request_id=request_id,
        title=f"Business English Training for {company_name}",
        description=f"CEFR {target_level} aligned English training course with company-specific content integration",
        cefr_level=CEFRLevel(target_level),
        total_duration=total_duration,
        status="generated",
        generated_by="ai",
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