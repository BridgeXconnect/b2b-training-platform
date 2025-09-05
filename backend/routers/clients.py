"""
Client requests router with comprehensive Sentry monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import uuid
import os
import logging
from datetime import datetime
import sentry_sdk
from config.sentry_config import SentryConfig

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

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/requests", response_model=ClientRequestResponse)
async def create_client_request(
    request: ClientRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new client request with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="client_service", name="create_client_request") as transaction:
        try:
            # Set transaction context
            company_name = request.company_details.get("name", "Unknown")
            transaction.set_tag("company_name", company_name)
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("user_role", current_user.role)
            transaction.set_tag("operation", "create_request")
            
            # Add breadcrumb for request creation attempt
            sentry_sdk.add_breadcrumb(
                message=f"Creating client request for {company_name}",
                category="client_service",
                level="info",
                data={
                    "company_name": company_name,
                    "sales_rep": current_user.email,
                    "target_level": request.training_cohort.get("target_cefr_level", "Unknown")
                }
            )
            
            # Ensure user has sales role
            if current_user.role not in ["sales", "admin"]:
                sentry_sdk.add_breadcrumb(
                    message=f"Access denied - insufficient role: {current_user.role}",
                    category="client_service",
                    level="warning",
                    data={"required_roles": ["sales", "admin"], "user_role": current_user.role}
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only sales representatives can create client requests"
                )
            
            # Create client request
            request_id = str(uuid.uuid4())
            db_request = ClientRequest(
                id=request_id,
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
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Client request created successfully: {request_id}",
                category="client_service",
                level="info",
                data={
                    "request_id": request_id,
                    "company_name": company_name,
                    "status": "pending"
                }
            )
            
            logger.info(f"Client request created: {request_id} for {company_name}")
            return ClientRequestResponse.from_orm(db_request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating client request: {str(e)}")
            SentryConfig.capture_database_error(e, table="client_requests")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create client request"
            )

@router.get("/requests", response_model=List[ClientRequestResponse])
async def get_client_requests(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all client requests for current user with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="client_service", name="get_client_requests") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("user_role", current_user.role)
            transaction.set_tag("operation", "list_requests")
            
            # Add breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Fetching client requests for user {current_user.email}",
                category="client_service",
                level="info",
                data={"user_role": current_user.role}
            )
            
            query = select(ClientRequest)
            
            # Sales reps see only their requests, admins see all
            if current_user.role == "sales":
                query = query.where(ClientRequest.sales_rep_id == current_user.id)
                transaction.set_tag("filter", "user_requests_only")
            else:
                transaction.set_tag("filter", "all_requests")
            
            result = await db.execute(query)
            requests = result.scalars().all()
            
            # Add success breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Retrieved {len(requests)} client requests",
                category="client_service",
                level="info",
                data={"count": len(requests)}
            )
            
            logger.info(f"Retrieved {len(requests)} client requests for {current_user.email}")
            return [ClientRequestResponse.from_orm(req) for req in requests]
            
        except Exception as e:
            logger.error(f"Error fetching client requests: {str(e)}")
            SentryConfig.capture_database_error(e, table="client_requests", query="SELECT")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch client requests"
            )

@router.get("/requests/{request_id}", response_model=ClientRequestResponse)
async def get_client_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific client request with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="client_service", name="get_client_request") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("request_id", request_id)
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("user_role", current_user.role)
            transaction.set_tag("operation", "get_request")
            
            # Add breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Fetching client request {request_id}",
                category="client_service",
                level="info",
                data={"request_id": request_id, "user": current_user.email}
            )
            
            result = await db.execute(
                select(ClientRequest).where(ClientRequest.id == request_id)
            )
            request = result.scalar_one_or_none()
            
            if not request:
                sentry_sdk.add_breadcrumb(
                    message=f"Client request not found: {request_id}",
                    category="client_service",
                    level="warning"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client request not found"
                )
            
            # Check permissions
            if current_user.role == "sales" and request.sales_rep_id != current_user.id:
                sentry_sdk.add_breadcrumb(
                    message=f"Access denied for request {request_id}",
                    category="client_service",
                    level="warning",
                    data={"user_role": current_user.role, "owner_id": request.sales_rep_id}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
            
            # Add success breadcrumb
            company_name = request.company_details.get("name", "Unknown")
            sentry_sdk.add_breadcrumb(
                message=f"Retrieved client request: {request_id}",
                category="client_service",
                level="info",
                data={"company_name": company_name, "status": request.status.value}
            )
            
            logger.info(f"Retrieved client request {request_id} for {company_name}")
            return ClientRequestResponse.from_orm(request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching client request {request_id}: {str(e)}")
            SentryConfig.capture_database_error(e, table="client_requests", query="SELECT BY ID")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch client request"
            )

@router.post("/requests/{request_id}/sop-documents", response_model=SOPDocumentResponse)
async def upload_sop_document(
    request_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload an SOP document for a client request with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="client_service", name="upload_sop_document") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("request_id", request_id)
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("filename", file.filename)
            transaction.set_tag("content_type", file.content_type)
            transaction.set_tag("operation", "upload_sop")
            
            # Add breadcrumb for upload attempt
            sentry_sdk.add_breadcrumb(
                message=f"Uploading SOP document {file.filename} for request {request_id}",
                category="client_service",
                level="info",
                data={
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "user": current_user.email
                }
            )
            
            # Verify request exists and user has access
            result = await db.execute(
                select(ClientRequest).where(ClientRequest.id == request_id)
            )
            request = result.scalar_one_or_none()
            
            if not request:
                sentry_sdk.add_breadcrumb(
                    message=f"Client request not found for SOP upload: {request_id}",
                    category="client_service",
                    level="warning"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client request not found"
                )
            
            if current_user.role == "sales" and request.sales_rep_id != current_user.id:
                sentry_sdk.add_breadcrumb(
                    message=f"Access denied for SOP upload to request {request_id}",
                    category="client_service",
                    level="warning",
                    data={"user_role": current_user.role, "owner_id": request.sales_rep_id}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
            
            # Validate file type
            allowed_types = ["application/pdf", "application/msword", 
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                            "text/plain"]
            
            if file.content_type not in allowed_types:
                sentry_sdk.add_breadcrumb(
                    message=f"Invalid file type uploaded: {file.content_type}",
                    category="client_service",
                    level="warning",
                    data={"filename": file.filename, "content_type": file.content_type}
                )
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
            
            content = await file.read()
            file_size = len(content)
            
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if file_size > max_size:
                sentry_sdk.add_breadcrumb(
                    message=f"File too large: {file_size} bytes (max: {max_size})",
                    category="client_service",
                    level="warning",
                    data={"filename": file.filename, "size": file_size}
                )
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File too large. Maximum size is 10MB."
                )
            
            # Save file to disk
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # Create database record
            db_document = SOPDocument(
                id=file_id,
                client_request_id=request_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                mime_type=file.content_type
            )
            
            db.add(db_document)
            await db.commit()
            await db.refresh(db_document)
            
            # Add success breadcrumb
            company_name = request.company_details.get("name", "Unknown")
            sentry_sdk.add_breadcrumb(
                message=f"SOP document uploaded successfully: {file.filename}",
                category="client_service",
                level="info",
                data={
                    "file_id": file_id,
                    "filename": file.filename,
                    "size": file_size,
                    "company_name": company_name
                }
            )
            
            logger.info(f"SOP document uploaded: {file.filename} ({file_size} bytes) for {company_name}")
            return SOPDocumentResponse.from_orm(db_document)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading SOP document: {str(e)}")
            
            # Clean up file if it was created
            if 'file_path' in locals() and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up partial file upload: {file_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up file {file_path}: {cleanup_error}")
            
            SentryConfig.capture_database_error(e, table="sop_documents")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload SOP document"
            )

@router.get("/requests/{request_id}/sop-documents", response_model=List[SOPDocumentResponse])
async def get_sop_documents(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all SOP documents for a client request with Sentry monitoring"""
    
    with sentry_sdk.start_transaction(op="client_service", name="get_sop_documents") as transaction:
        try:
            # Set transaction context
            transaction.set_tag("request_id", request_id)
            transaction.set_tag("user_id", current_user.id)
            transaction.set_tag("user_role", current_user.role)
            transaction.set_tag("operation", "list_sop_documents")
            
            # Add breadcrumb
            sentry_sdk.add_breadcrumb(
                message=f"Fetching SOP documents for request {request_id}",
                category="client_service",
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
                    message=f"Client request not found for SOP documents: {request_id}",
                    category="client_service",
                    level="warning"
                )
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client request not found"
                )
            
            if current_user.role == "sales" and request.sales_rep_id != current_user.id:
                sentry_sdk.add_breadcrumb(
                    message=f"Access denied for SOP documents of request {request_id}",
                    category="client_service",
                    level="warning",
                    data={"user_role": current_user.role, "owner_id": request.sales_rep_id}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
            
            # Get documents
            result = await db.execute(
                select(SOPDocument).where(SOPDocument.client_request_id == request_id)
            )
            documents = result.scalars().all()
            
            # Add success breadcrumb
            company_name = request.company_details.get("name", "Unknown")
            total_size = sum(doc.file_size for doc in documents if doc.file_size)
            sentry_sdk.add_breadcrumb(
                message=f"Retrieved {len(documents)} SOP documents",
                category="client_service",
                level="info",
                data={
                    "count": len(documents),
                    "total_size": total_size,
                    "company_name": company_name
                }
            )
            
            logger.info(f"Retrieved {len(documents)} SOP documents for {company_name} (total: {total_size} bytes)")
            return [SOPDocumentResponse.from_orm(doc) for doc in documents]
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching SOP documents for {request_id}: {str(e)}")
            SentryConfig.capture_database_error(e, table="sop_documents", query="SELECT")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch SOP documents"
            )

# Export router
clients_router = router