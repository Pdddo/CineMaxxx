from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api/user",
    tags=["user"]
)

@router.get("/profile", response_model=schemas.User)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/bookings", response_model=List[schemas.BookingHistory])
def get_user_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Get all bookings for the user with details, shows, movies, etc.
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).order_by(models.Booking.id.desc()).all()
    return bookings

@router.get("/bookings/{booking_id}", response_model=schemas.BookingHistory)
def get_user_booking(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Tiket tidak ditemukan atau Anda tidak memiliki akses.")
    
    return booking

