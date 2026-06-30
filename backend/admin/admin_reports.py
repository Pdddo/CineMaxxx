from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import datetime

import models
import auth
from database import get_db

router = APIRouter(
    prefix="/api/admin/reports",
    tags=["admin_reports"],
    dependencies=[Depends(auth.get_current_admin)]
)



# Tujuan: Mendapatkan metrik dashboard admin.
# Parameter: db (Session): Sesi DB (opsional).
# return: dict berisi total pendapatan, tiket terjual, dan film terlaris.
@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    # Hitung total pendapatan dari booking yang sudah dibayar
    total_revenue = db.query(func.sum(models.Booking.total_harga)).filter(models.Booking.status_pembayaran == "paid").scalar() or 0
    
    # Hitung jumlah kursi/tiket yang terjual
    tickets_sold = db.query(func.count(models.BookingDetail.id)) \
        .join(models.Booking, models.BookingDetail.booking_id == models.Booking.id) \
        .filter(models.Booking.status_pembayaran == "paid").scalar() or 0

    # Cari film dengan pendapatan tertinggi
    top_movie_query = (
        db.query(
            models.Movie.judul, # Ambil kolom judul film
            func.sum(models.Booking.total_harga).label("revenue") # Hitung total pemasukan (alias revenue)
        )
        .join(models.Show, models.Show.movie_id == models.Movie.id) # Relasikan ke tabel jadwal tayang
        .join(models.Booking, models.Booking.show_id == models.Show.id) # Relasikan ke transaksi pemesanan
        .filter(models.Booking.status_pembayaran == "paid") # Hanya hitung yang tiketnya lunas
        .group_by(models.Movie.id) # Kelompokkan total pemasukan per masing-masing film
        .order_by(func.sum(models.Booking.total_harga).desc()) # Urutkan dari pemasukan tertinggi (descending)
        .first() # Ambil satu data yang paling teratas (peringkat 1)
    )

    # Ekstrak hasil query film terlaris
    top_movie = top_movie_query[0] if top_movie_query else "N/A"
    top_movie_revenue = float(top_movie_query[1]) if top_movie_query else 0.0

    return {
        "total_revenue": float(total_revenue), # Kembalikan total pendapatan
        "tickets_sold": tickets_sold, # Kembalikan total tiket terjual
        "top_movie": top_movie, # Kembalikan judul film terlaris
        "top_movie_revenue": top_movie_revenue # Kembalikan pendapatan film terlaris
    }



# Tujuan: Mengambil 50 transaksi terbaru.
# Parameter: db (Session): Sesi DB (opsional).
# return: List[dict] dari data transaksi yang diformat.
@router.get("/transactions")
def get_recent_transactions(db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).order_by(models.Booking.id.desc()).limit(50).all() # Ambil 50 booking terbaru
    result = []
    for b in bookings: # Loop tiap booking
        seats = [d.seat.nomor_kursi for d in b.details if d.seat] if b.details else [] # Kumpulkan nomor kursi
        studio_name = b.show.studio.nama_studio if b.show and b.show.studio else "N/A" # Nama studio
        movie_title = b.show.movie.judul if b.show and b.show.movie else "N/A" # Judul film
        datetime_str = b.show.jam_tayang.strftime("%d %b %Y, %I:%M %p") if b.show and b.show.jam_tayang else "N/A" # Format waktu

        result.append({
            "id": f"#TRX-{8900 + b.id}", # Format ID transaksi
            "movie": movie_title, # Simpan judul film
            "studio_seats": f"{studio_name} • Seat {', '.join(seats)}", # Gabung studio dan kursi
            "datetime": datetime_str, # Waktu transaksi
            "amount": b.total_harga, # Nominal
            "status": b.status_pembayaran.capitalize() # Status kapitalisasi
        })
    return result # Kembalikan list transaksi
