from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api/user",
    tags=["user"]
)

# Tujuan: Mendapatkan profil pengguna login.
# Parameter: current_user (User): Pengguna dari JWT (otomatis).
# return: schemas.User (profil pengguna).
@router.get("/profile", response_model=schemas.User)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user # Kembalikan objek pengguna dari dependensi JWT

# Tujuan: Mengambil riwayat pemesanan tiket pengguna.
# Parameter:
# - db (Session): Sesi DB (opsional).
# - current_user (User): Pengguna login (otomatis).
# return: List[schemas.BookingHistory] (riwayat pemesanan).
@router.get("/bookings", response_model=List[schemas.BookingHistory])
def get_user_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Ambil semua booking milik user, urutkan dari yang terbaru
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).order_by(models.Booking.id.desc()).all()
    return bookings # Kembalikan daftar booking

# Tujuan: Mendapatkan detail satu pemesanan tiket.
# Parameter:
# - booking_id (int): ID pemesanan (wajib).
# - db (Session): Sesi DB (opsional).
# - current_user (User): Pengguna login (otomatis).
# return: schemas.BookingHistory (detail tiket).
@router.get("/bookings/{booking_id}", response_model=schemas.BookingHistory)
def get_user_booking(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter( # Cari booking by ID
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id # Pastikan milik user ini
    ).first()
    
    if not booking: # Cegah akses jika tiket tidak ada atau bukan miliknya
        raise HTTPException(status_code=404, detail="Tiket tidak ditemukan atau Anda tidak memiliki akses.")
    
    return booking # Kembalikan detail tiket
