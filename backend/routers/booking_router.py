from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api",
    tags=["booking"]
)



# Tujuan: Mengecek ketersediaan kursi untuk jadwal tertentu.
# Parameter:
# - show_id (int): ID jadwal tayang (wajib).
# - db (Session): Sesi DB (opsional).
# - current_user (User): Pengguna login (otomatis).
# return: List[schemas.SeatAvailability] (daftar kursi dan status booked).
@router.get("/shows/{show_id}/seats", response_model=List[schemas.SeatAvailability])
def get_seat_availability(show_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    show = db.query(models.Show).filter(models.Show.id == show_id).first() # Cari jadwal
    if not show:
        raise HTTPException(status_code=404, detail="Jadwal (Show) tidak ditemukan")
    
    all_seats = db.query(models.Seat).filter(models.Seat.studio_id == show.studio_id).all() # Ambil semua kursi di studio
    
    booked_seats_query = db.query(models.BookingDetail.seat_id) \
        .join(models.Booking) \
        .filter(models.Booking.show_id == show_id) \
        .filter(models.Booking.status_pembayaran.in_(["paid", "pending"])) \
        .all() # Cari kursi yang sudah dibooking (status paid/pending)
    booked_seats_ids = {seat[0] for seat in booked_seats_query} # Buat set ID kursi terbooking
    
    result = []
    for seat in all_seats: # Mapping setiap kursi
        result.append(schemas.SeatAvailability(
            seat_id=seat.id,
            nomor_kursi=seat.nomor_kursi,
            is_booked=(seat.id in booked_seats_ids) # Tentukan status is_booked
        ))
    return result # Kembalikan list ketersediaan kursi


# Tujuan: Membuat pesanan tiket baru (booking).
# Parameter:
# - booking (BookingCreate): Data pesanan (wajib).
# - db (Session): Sesi DB (opsional).
# - current_user (User): Pengguna login (otomatis).
# return: schemas.Booking (pesanan tiket).
@router.post("/bookings", response_model=schemas.Booking, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    show = db.query(models.Show).filter(models.Show.id == booking.show_id).first() # Cari jadwal
    if not show:
        raise HTTPException(status_code=404, detail="Jadwal (Show) tidak ditemukan")
    
    from datetime import datetime
    if show.jam_tayang < datetime.now(): # Validasi waktu tayang
        raise HTTPException(status_code=400, detail="Tidak bisa membeli tiket untuk jadwal yang sudah lewat")
    
    if show.studio.status == 'Maintenance': # Validasi status studio
        raise HTTPException(status_code=400, detail="Tidak bisa membeli tiket karena studio sedang dalam perbaikan (Maintenance)")
    
    booked_seats_query = db.query(models.BookingDetail.seat_id) \
        .join(models.Booking) \
        .filter(models.Booking.show_id == booking.show_id) \
        .filter(models.Booking.status_pembayaran.in_(["paid", "pending"])) \
        .all() # Ambil kursi yang sudah terbooking
    booked_seats_ids = {seat[0] for seat in booked_seats_query}
    
    for seat_id in booking.seat_ids: # Validasi bentrok kursi
        if seat_id in booked_seats_ids:
            raise HTTPException(status_code=400, detail=f"Kursi dengan ID {seat_id} sudah dipesan")
            
    new_booking = models.Booking(
        user_id=current_user.id, # Set ID pembeli
        show_id=booking.show_id, # Set ID jadwal
        total_harga=booking.total_harga, # Set harga total
        status_pembayaran="pending" # Set status awal
    )
    db.add(new_booking) # Tambah pesanan
    db.commit() # Simpan pesanan
    db.refresh(new_booking) # Dapatkan ID pesanan
    
    for seat_id in booking.seat_ids: # Buat detail booking untuk tiap kursi
        new_detail = models.BookingDetail(booking_id=new_booking.id, seat_id=seat_id)
        db.add(new_detail)
        
    db.commit() # Simpan detail kursi
    db.refresh(new_booking)
    return new_booking





# Tujuan: Memproses pembayaran tiket.
# Parameter:
# - payment (PaymentProcess): Data pembayaran (wajib).
# - db (Session): Sesi DB (opsional).
# - current_user (User): Pengguna login (otomatis).
# return: dict (status pembayaran).
@router.post("/payments/process")
def process_payment(payment: schemas.PaymentProcess, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == payment.booking_id, models.Booking.user_id == current_user.id).first() # Cari booking berdasarkan ID dan pemilik
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan atau milik user lain")
        
    if payment.status.lower() == "success": # Jika payload sukses
        booking.status_pembayaran = "paid" # Set lunas
    else:
        booking.status_pembayaran = "failed" # Set gagal
        
    db.commit() # Simpan perubahan status
    db.refresh(booking)
    return {"message": "Pembayaran diproses", "booking_id": booking.id, "status_pembayaran": booking.status_pembayaran}
