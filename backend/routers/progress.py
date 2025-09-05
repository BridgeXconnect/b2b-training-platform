"""
Progress Tracking API Router
Handles user progress, learning goals, study sessions, assessments, and achievements
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

from models import (
    User, LearningGoal, StudySession, Assessment, Achievement, UserProgress,
    LearningGoalCreate, LearningGoalResponse,
    StudySessionCreate, StudySessionResponse,
    AssessmentCreate, AssessmentResponse,
    AchievementResponse, UserProgressResponse,
    ProgressDashboardResponse, CEFRLevel
)
from database import get_db
from auth import get_current_user
from config.sentry_config import SentryConfig
import sentry_sdk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/progress", tags=["progress"])

# Helper functions
async def get_or_create_user_progress(db: AsyncSession, user_id: str) -> UserProgress:
    """Get or create user progress record"""
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == user_id))
    progress = result.scalar_one_or_none()
    
    if not progress:
        progress = UserProgress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            total_study_time=0,
            completed_lessons=0,
            current_streak=0,
            longest_streak=0,
            current_cefr_level=CEFRLevel.A1,
            weekly_goal_hours=5
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
    
    return progress

def calculate_streak(sessions: List[StudySession]) -> tuple[int, int]:
    """Calculate current and longest streak from study sessions"""
    if not sessions:
        return 0, 0
    
    # Sort sessions by date
    sorted_sessions = sorted(sessions, key=lambda x: x.date.date())
    session_dates = [s.date.date() for s in sorted_sessions]
    unique_dates = sorted(list(set(session_dates)))
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 1
    
    today = datetime.now().date()
    
    # Calculate current streak (from today backwards)
    if unique_dates and unique_dates[-1] == today:
        current_streak = 1
        for i in range(len(unique_dates) - 2, -1, -1):
            if (unique_dates[i + 1] - unique_dates[i]).days == 1:
                current_streak += 1
            else:
                break
    elif unique_dates and (today - unique_dates[-1]).days == 1:
        # Grace period of 1 day
        current_streak = 1
        for i in range(len(unique_dates) - 2, -1, -1):
            if (unique_dates[i + 1] - unique_dates[i]).days == 1:
                current_streak += 1
            else:
                break
    
    # Calculate longest streak overall
    for i in range(1, len(unique_dates)):
        if (unique_dates[i] - unique_dates[i - 1]).days == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak)
    return current_streak, longest_streak

# Learning Goals endpoints
@router.post("/goals", response_model=LearningGoalResponse)
async def create_learning_goal(
    goal_data: LearningGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new learning goal"""
    try:
        with sentry_sdk.start_transaction(op="api", name="create_learning_goal"):
            goal = LearningGoal(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                **goal_data.model_dump()
            )
            
            db.add(goal)
            await db.commit()
            await db.refresh(goal)
            
            sentry_sdk.add_breadcrumb(
                message="Learning goal created",
                category="progress",
                data={"goal_id": goal.id, "category": goal.category}
            )
            
            return goal
            
    except Exception as e:
        logger.error(f"Failed to create learning goal: {e}")
        SentryConfig.capture_database_error(e, table="learning_goals")
        raise HTTPException(status_code=500, detail="Failed to create learning goal")

@router.get("/goals", response_model=List[LearningGoalResponse])
async def get_learning_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all learning goals for the current user"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_learning_goals"):
            result = await db.execute(
                select(LearningGoal)
                .where(LearningGoal.user_id == current_user.id)
                .order_by(desc(LearningGoal.created_at))
            )
            goals = result.scalars().all()
            return goals
            
    except Exception as e:
        logger.error(f"Failed to get learning goals: {e}")
        SentryConfig.capture_database_error(e, table="learning_goals")
        raise HTTPException(status_code=500, detail="Failed to retrieve learning goals")

@router.put("/goals/{goal_id}", response_model=LearningGoalResponse)
async def update_goal_progress(
    goal_id: str,
    current_progress: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update progress on a learning goal"""
    try:
        with sentry_sdk.start_transaction(op="api", name="update_goal_progress"):
            result = await db.execute(
                select(LearningGoal)
                .where(and_(LearningGoal.id == goal_id, LearningGoal.user_id == current_user.id))
            )
            goal = result.scalar_one_or_none()
            
            if not goal:
                raise HTTPException(status_code=404, detail="Learning goal not found")
            
            goal.current = current_progress
            await db.commit()
            await db.refresh(goal)
            
            return goal
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update goal progress: {e}")
        SentryConfig.capture_database_error(e, table="learning_goals")
        raise HTTPException(status_code=500, detail="Failed to update goal progress")

# Study Sessions endpoints
@router.post("/sessions", response_model=StudySessionResponse)
async def create_study_session(
    session_data: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new study session"""
    try:
        with sentry_sdk.start_transaction(op="api", name="create_study_session"):
            session = StudySession(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                **session_data.model_dump()
            )
            
            db.add(session)
            
            # Update user progress
            progress = await get_or_create_user_progress(db, current_user.id)
            progress.total_study_time += session_data.duration / 60  # Convert minutes to hours
            progress.completed_lessons += 1
            
            # Recalculate streaks
            all_sessions_result = await db.execute(
                select(StudySession)
                .where(StudySession.user_id == current_user.id)
                .order_by(StudySession.date)
            )
            all_sessions = all_sessions_result.scalars().all()
            all_sessions.append(session)  # Include the new session
            
            current_streak, longest_streak = calculate_streak(all_sessions)
            progress.current_streak = current_streak
            progress.longest_streak = max(progress.longest_streak, longest_streak)
            
            await db.commit()
            await db.refresh(session)
            
            sentry_sdk.add_breadcrumb(
                message="Study session created",
                category="progress",
                data={
                    "session_id": session.id,
                    "duration": session_data.duration,
                    "category": session_data.category
                }
            )
            
            return session
            
    except Exception as e:
        logger.error(f"Failed to create study session: {e}")
        SentryConfig.capture_database_error(e, table="study_sessions")
        raise HTTPException(status_code=500, detail="Failed to create study session")

@router.get("/sessions", response_model=List[StudySessionResponse])
async def get_study_sessions(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent study sessions for the current user"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_study_sessions"):
            result = await db.execute(
                select(StudySession)
                .where(StudySession.user_id == current_user.id)
                .order_by(desc(StudySession.date))
                .limit(limit)
            )
            sessions = result.scalars().all()
            return sessions
            
    except Exception as e:
        logger.error(f"Failed to get study sessions: {e}")
        SentryConfig.capture_database_error(e, table="study_sessions")
        raise HTTPException(status_code=500, detail="Failed to retrieve study sessions")

# Assessment endpoints
@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new assessment record"""
    try:
        with sentry_sdk.start_transaction(op="api", name="create_assessment"):
            assessment = Assessment(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                **assessment_data.model_dump()
            )
            
            db.add(assessment)
            
            # Update user progress if assessment is completed
            if assessment_data.completed_at and assessment_data.percentage:
                progress = await get_or_create_user_progress(db, current_user.id)
                
                # Update CEFR level if significant improvement
                if assessment_data.percentage >= 80:
                    current_level_index = list(CEFRLevel).index(progress.current_cefr_level)
                    target_level_index = list(CEFRLevel).index(assessment_data.cefr_level)
                    
                    if target_level_index > current_level_index:
                        progress.current_cefr_level = assessment_data.cefr_level
            
            await db.commit()
            await db.refresh(assessment)
            
            sentry_sdk.add_breadcrumb(
                message="Assessment created",
                category="progress",
                data={
                    "assessment_id": assessment.id,
                    "type": assessment_data.assessment_type,
                    "level": assessment_data.cefr_level.value
                }
            )
            
            return assessment
            
    except Exception as e:
        logger.error(f"Failed to create assessment: {e}")
        SentryConfig.capture_database_error(e, table="assessments")
        raise HTTPException(status_code=500, detail="Failed to create assessment")

@router.get("/assessments", response_model=List[AssessmentResponse])
async def get_assessments(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent assessments for the current user"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_assessments"):
            result = await db.execute(
                select(Assessment)
                .where(Assessment.user_id == current_user.id)
                .where(Assessment.completed_at.is_not(None))
                .order_by(desc(Assessment.completed_at))
                .limit(limit)
            )
            assessments = result.scalars().all()
            return assessments
            
    except Exception as e:
        logger.error(f"Failed to get assessments: {e}")
        SentryConfig.capture_database_error(e, table="assessments")
        raise HTTPException(status_code=500, detail="Failed to retrieve assessments")

# Achievements endpoints
@router.get("/achievements", response_model=List[AchievementResponse])
async def get_achievements(
    earned_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get achievements for the current user"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_achievements"):
            query = select(Achievement).where(Achievement.user_id == current_user.id)
            
            if earned_only:
                query = query.where(Achievement.earned_date.is_not(None))
            
            result = await db.execute(
                query.order_by(desc(Achievement.earned_date), desc(Achievement.created_at))
            )
            achievements = result.scalars().all()
            return achievements
            
    except Exception as e:
        logger.error(f"Failed to get achievements: {e}")
        SentryConfig.capture_database_error(e, table="achievements")
        raise HTTPException(status_code=500, detail="Failed to retrieve achievements")

# Progress dashboard endpoint
@router.get("/dashboard", response_model=ProgressDashboardResponse)
async def get_progress_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive progress dashboard data"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_progress_dashboard"):
            # Get user progress
            progress = await get_or_create_user_progress(db, current_user.id)
            
            # Get learning goals
            goals_result = await db.execute(
                select(LearningGoal)
                .where(LearningGoal.user_id == current_user.id)
                .order_by(desc(LearningGoal.created_at))
            )
            goals = goals_result.scalars().all()
            
            # Get recent study sessions
            sessions_result = await db.execute(
                select(StudySession)
                .where(StudySession.user_id == current_user.id)
                .order_by(desc(StudySession.date))
                .limit(10)
            )
            sessions = sessions_result.scalars().all()
            
            # Get recent assessments
            assessments_result = await db.execute(
                select(Assessment)
                .where(Assessment.user_id == current_user.id)
                .where(Assessment.completed_at.is_not(None))
                .order_by(desc(Assessment.completed_at))
                .limit(10)
            )
            assessments = assessments_result.scalars().all()
            
            # Get earned achievements
            achievements_result = await db.execute(
                select(Achievement)
                .where(Achievement.user_id == current_user.id)
                .where(Achievement.earned_date.is_not(None))
                .order_by(desc(Achievement.earned_date))
            )
            achievements = achievements_result.scalars().all()
            
            return ProgressDashboardResponse(
                user_progress=progress,
                learning_goals=goals,
                recent_sessions=sessions,
                recent_assessments=assessments,
                achievements=achievements
            )
            
    except Exception as e:
        logger.error(f"Failed to get progress dashboard: {e}")
        SentryConfig.capture_database_error(e)
        raise HTTPException(status_code=500, detail="Failed to retrieve progress dashboard")

# Weekly progress endpoint
@router.get("/weekly", response_model=dict)
async def get_weekly_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get weekly progress statistics"""
    try:
        with sentry_sdk.start_transaction(op="api", name="get_weekly_progress"):
            # Calculate date range for current week
            today = datetime.now()
            start_of_week = today - timedelta(days=today.weekday())
            start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Get sessions from current week
            result = await db.execute(
                select(StudySession)
                .where(and_(
                    StudySession.user_id == current_user.id,
                    StudySession.date >= start_of_week
                ))
            )
            sessions = result.scalars().all()
            
            # Calculate weekly stats
            total_minutes = sum(session.duration for session in sessions)
            total_hours = total_minutes / 60
            
            # Get user's weekly goal
            progress = await get_or_create_user_progress(db, current_user.id)
            
            return {
                "target_hours": progress.weekly_goal_hours,
                "completed_hours": round(total_hours, 1),
                "percentage": min(round((total_hours / progress.weekly_goal_hours) * 100, 1), 100),
                "sessions_count": len(sessions),
                "days_studied": len(set(session.date.date() for session in sessions))
            }
            
    except Exception as e:
        logger.error(f"Failed to get weekly progress: {e}")
        SentryConfig.capture_database_error(e)
        raise HTTPException(status_code=500, detail="Failed to retrieve weekly progress")