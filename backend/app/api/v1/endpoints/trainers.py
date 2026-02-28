from typing import Any
import uuid
import boto3
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from datetime import datetime, timezone, date

from app.api.deps import SessionDep, TrainerUserDep
from app.models.user import Attendance, Media, User
from app.models.inventory import InventoryCapacity
from app.core.config import settings

router = APIRouter()

# Mock S3 Client (Configure with real credentials in production)
s3_client = boto3.client(
    's3',
    aws_access_key_id='YOUR_ACCESS_KEY',
    aws_secret_access_key='YOUR_SECRET_KEY',
    region_name='ap-south-1'
)

@router.post("/attendance")
async def mark_attendance(
    user_id: uuid.UUID,
    slot_id: uuid.UUID,
    is_present: bool,
    trainer: TrainerUserDep,
    session: SessionDep,
) -> Any:
    """
    Allows a trainer to mark student attendance.
    """
    attendance = Attendance(
        user_id=user_id,
        inventory_slot_id=slot_id,
        is_present=is_present,
        date=date.today()
    )
    session.add(attendance)
    await session.commit()
    return {"message": "Attendance marked successfully"}

@router.get("/my-students/{slot_id}")
async def get_students_for_slot(
    slot_id: uuid.UUID,
    trainer: TrainerUserDep,
    session: SessionDep,
) -> Any:
    """
    Returns a list of students enrolled in a specific class slot for the trainer.
    """
    # Logic to fetch enrolled students would go here
    # For now, return mock or partial result
    return {"students": []}

@router.post("/media-upload-url")
async def get_upload_url(
    student_id: uuid.UUID,
    media_type: str,
    trainer: TrainerUserDep,
) -> Any:
    """
    Generates a pre-signed S3 URL for the trainer to upload a video/photo directly.
    Zero-bottleneck architecture: Media never touches the FastAPI server.
    """
    file_name = f"training/{student_id}/{uuid.uuid4().hex}.{media_type}"
    bucket_name = "xmfclub-media"
    
    try:
        url = s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=file_name,
            Fields={"acl": "public-read", "Content-Type": "video/mp4" if media_type == 'mp4' else 'image/jpeg'},
            Conditions=[
                {"acl": "public-read"},
                ["starts-with", "$Content-Type", ""],
            ],
            ExpiresIn=3600
        )
    except Exception as e:
        # For local dev without real AWS credentials, return a dummy
        return {
            "url": "https://s3.ap-south-1.amazonaws.com/xmfclub-media",
            "fields": {"key": file_name},
            "mock": True
        }

    return url

@router.post("/media-confirm")
async def confirm_media_upload(
    student_id: uuid.UUID,
    url: str,
    media_type: str,
    caption: str | None,
    trainer: TrainerUserDep,
    session: SessionDep,
) -> Any:
    """
    Called by the frontend after a successful S3 upload to link the media to the student profile.
    """
    media = Media(
        user_id=student_id,
        trainer_id=trainer.id,
        url=url,
        media_type=media_type,
        caption=caption
    )
    session.add(media)
    await session.commit()
    return {"message": "Media linked to student profile"}
