from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api",
    tags=["booking"]
)

@router.get("/shows/{show_id}/seats", response_model=List[schemas.SeatAvailability])
def get_seat_availability(show_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    show = db.query(models.Show).filter(models.Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Jadwal (Show) tidak ditemukan")
    
    all_seats = db.query(models.Seat).filter(models.Seat.studio_id == show.studio_id).all()
    
    booked_seats_query = db.query(models.BookingDetail.seat_id) \
        .join(models.Booking) \
        .filter(models.Booking.show_id == show_id) \
        .filter(models.Booking.status_pembayaran.in_(["paid", "pending"])) \
        .all()
    booked_seats_ids = {seat[0] for seat in booked_seats_query}
    
    result = []
    for seat in all_seats:
        result.append(schemas.SeatAvailability(
            seat_id=seat.id,
            nomor_kursi=seat.nomor_kursi,
            is_booked=(seat.id in booked_seats_ids)
        ))
    return result

@router.post("/bookings", response_model=schemas.Booking, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    show = db.query(models.Show).filter(models.Show.id == booking.show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Jadwal (Show) tidak ditemukan")
    
    booked_seats_query = db.query(models.BookingDetail.seat_id) \
        .join(models.Booking) \
        .filter(models.Booking.show_id == booking.show_id) \
        .filter(models.Booking.status_pembayaran.in_(["paid", "pending"])) \
        .all()
    booked_seats_ids = {seat[0] for seat in booked_seats_query}
    
    for seat_id in booking.seat_ids:
        if seat_id in booked_seats_ids:
            raise HTTPException(status_code=400, detail=f"Kursi dengan ID {seat_id} sudah dipesan")
            
    new_booking = models.Booking(
        user_id=current_user.id,
        show_id=booking.show_id,
        total_harga=booking.total_harga,
        status_pembayaran="pending"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    for seat_id in booking.seat_ids:
        new_detail = models.BookingDetail(booking_id=new_booking.id, seat_id=seat_id)
        db.add(new_detail)
        
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.post("/payments/process")
def process_payment(payment: schemas.PaymentProcess, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == payment.booking_id, models.Booking.user_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan atau milik user lain")
        
    if payment.status.lower() == "success":
        booking.status_pembayaran = "paid"
    else:
        booking.status_pembayaran = "failed"
        
    db.commit()
    db.refresh(booking)
    return {"message": "Pembayaran diproses", "booking_id": booking.id, "status_pembayaran": booking.status_pembayaran}
