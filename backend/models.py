"""
Database Models for B2B English Training Platform
Based on existing TypeScript interfaces from frontend
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum as PyEnum

Base = declarative_base()

# Enums
class UserRole(str, PyEnum):
    SALES = "sales"
    COURSE_MANAGER = "course_manager"
    TRAINER = "trainer"
    STUDENT = "student"
    ADMIN = "admin"

class CEFRLevel(str, PyEnum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"

class DeliveryMethod(str, PyEnum):
    IN_PERSON = "in-person"
    VIRTUAL = "virtual"
    HYBRID = "hybrid"

class Frequency(str, PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi-weekly"

class RequestStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(Enum(UserRole))
    company_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client_requests = relationship("ClientRequest", back_populates="sales_rep")

class ClientRequest(Base):
    __tablename__ = "client_requests"
    
    id = Column(String, primary_key=True)
    sales_rep_id = Column(String, ForeignKey("users.id"))
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)
    
    # Company Details (JSON stored)
    company_details = Column(JSON)
    
    # Training Cohort (JSON stored)
    training_cohort = Column(JSON)
    
    # Training Objectives (JSON stored)
    training_objectives = Column(JSON)
    
    # Course Preferences (JSON stored)
    course_preferences = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sales_rep = relationship("User", back_populates="client_requests")
    sop_documents = relationship("SOPDocument", back_populates="client_request")
    generated_courses = relationship("GeneratedCourse", back_populates="client_request")

class SOPDocument(Base):
    __tablename__ = "sop_documents"
    
    id = Column(String, primary_key=True)
    client_request_id = Column(String, ForeignKey("client_requests.id"))
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    
    # Extracted content and analysis
    extracted_text = Column(Text, nullable=True)
    analysis_results = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    client_request = relationship("ClientRequest", back_populates="sop_documents")

class GeneratedCourse(Base):
    __tablename__ = "generated_courses"
    
    id = Column(String, primary_key=True)
    client_request_id = Column(String, ForeignKey("client_requests.id"))
    title = Column(String)
    description = Column(Text)
    cefr_level = Column(Enum(CEFRLevel))
    total_duration = Column(Integer)  # in hours
    status = Column(String, default="generated")
    generated_by = Column(String, default="ai")
    
    # Course structure (JSON stored)
    modules = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    client_request = relationship("ClientRequest", back_populates="generated_courses")

# Pydantic models for API
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    company_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    company_id: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CompanyDetails(BaseModel):
    name: str
    industry: str
    size: int
    primary_contact: Dict[str, Any]

class TrainingCohort(BaseModel):
    participant_count: int
    current_cefr_level: CEFRLevel
    target_cefr_level: CEFRLevel
    roles_and_departments: List[str]

class TrainingObjectives(BaseModel):
    specific_goals: List[str]
    pain_points: List[str]
    success_criteria: List[str]

class SchedulingPreferences(BaseModel):
    frequency: Frequency
    duration: int
    preferred_times: List[str]

class CoursePreferences(BaseModel):
    total_length: int
    lessons_per_module: int
    delivery_method: DeliveryMethod
    scheduling: SchedulingPreferences

class ClientRequestCreate(BaseModel):
    company_details: CompanyDetails
    training_cohort: TrainingCohort
    training_objectives: TrainingObjectives
    course_preferences: CoursePreferences

class ClientRequestResponse(BaseModel):
    id: str
    sales_rep_id: str
    status: RequestStatus
    company_details: CompanyDetails
    training_cohort: TrainingCohort
    training_objectives: TrainingObjectives
    course_preferences: CoursePreferences
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class SOPDocumentResponse(BaseModel):
    id: str
    client_request_id: str
    filename: str
    file_size: int
    mime_type: str
    analysis_results: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

class GeneratedCourseResponse(BaseModel):
    id: str
    client_request_id: str
    title: str
    description: str
    cefr_level: CEFRLevel
    total_duration: int
    status: str
    generated_by: str
    modules: List[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None