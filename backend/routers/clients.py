"""
Client requests router
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
import os
from datetime import datetime

from models import (
    ClientRequest, 
    ClientRequestCreate, 
    ClientRequestResponse,
    UserResponse,
    SOPDocument,
    SOPDocumentResponse,
    RequestStatus
)
from database import get_db
from auth import get_current_user

router = APIRouter()

@router.post("/requests", response_model=ClientRequestResponse)
async def create_client_request(
    request: ClientRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new client request"""
    
    # Ensure user has sales role
    if current_user.role not in ["sales", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sales representatives can create client requests"
        )
    
    # Create client request
    db_request = ClientRequest(
        id=str(uuid.uuid4()),
        sales_rep_id=current_user.id,
        status=RequestStatus.PENDING,
        company_details=request.company_details.dict(),
        training_cohort=request.training_cohort.dict(),
        training_objectives=request.training_objectives.dict(),
        course_preferences=request.course_preferences.dict()
    )
    
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    
    return ClientRequestResponse.from_orm(db_request)

@router.get("/requests", response_model=List[ClientRequestResponse])
async def get_client_requests(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all client requests for current user"""
    
    query = select(ClientRequest)
    
    # Sales reps see only their requests, admins see all
    if current_user.role == "sales":
        query = query.where(ClientRequest.sales_rep_id == current_user.id)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    return [ClientRequestResponse.from_orm(req) for req in requests]

@router.get("/requests/{request_id}", response_model=ClientRequestResponse)
async def get_client_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific client request"""
    
    result = await db.execute(
        select(ClientRequest).where(ClientRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client request not found"
        )
    
    # Check permissions
    if current_user.role == "sales" and request.sales_rep_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return ClientRequestResponse.from_orm(request)

@router.post("/requests/{request_id}/sop-documents", response_model=SOPDocumentResponse)
async def upload_sop_document(
    request_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload an SOP document for a client request"""
    
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
    
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", 
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported. Please upload PDF, DOC, DOCX, or TXT files."
        )
    
    # Create uploads directory if it doesn't exist
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Save file
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(uploads_dir, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database record
    db_document = SOPDocument(
        id=file_id,
        client_request_id=request_id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type
    )
    
    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)
    
    return SOPDocumentResponse.from_orm(db_document)

@router.get("/requests/{request_id}/sop-documents", response_model=List[SOPDocumentResponse])
async def get_sop_documents(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all SOP documents for a client request"""
    
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
    
    # Get documents
    result = await db.execute(
        select(SOPDocument).where(SOPDocument.client_request_id == request_id)
    )
    documents = result.scalars().all()
    
    return [SOPDocumentResponse.from_orm(doc) for doc in documents]

# Export router
clients_router = router