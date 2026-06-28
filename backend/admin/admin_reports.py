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

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    total_revenue = db.query(func.sum(models.Booking.total_harga)).filter(models.Booking.status_pembayaran == "paid").scalar() or 0
    
    tickets_sold = db.query(func.count(models.BookingDetail.id)) \
        .join(models.Booking, models.BookingDetail.booking_id == models.Booking.id) \
        .filter(models.Booking.status_pembayaran == "paid").scalar() or 0

    # Top performing movie
    top_movie_query = db.query(
        models.Movie.judul,
        func.sum(models.Booking.total_harga).label("revenue")
    ).join(models.Show, models.Show.movie_id == models.Movie.id) \
     .join(models.Booking, models.Booking.show_id == models.Show.id) \
     .filter(models.Booking.status_pembayaran == "paid") \
     .group_by(models.Movie.id) \
     .order_by(func.sum(models.Booking.total_harga).desc()).first()

    top_movie = top_movie_query[0] if top_movie_query else "N/A"
    top_movie_revenue = float(top_movie_query[1]) if top_movie_query else 0.0

    return {
        "total_revenue": float(total_revenue),
        "tickets_sold": tickets_sold,
        "top_movie": top_movie,
        "top_movie_revenue": top_movie_revenue
    }


@router.get("/transactions")
def get_recent_transactions(db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).order_by(models.Booking.id.desc()).limit(50).all()
    result = []
    for b in bookings:
        seats = [d.seat.nomor_kursi for d in b.details if d.seat] if b.details else []
        studio_name = b.show.studio.nama_studio if b.show and b.show.studio else "N/A"
        movie_title = b.show.movie.judul if b.show and b.show.movie else "N/A"
        datetime_str = b.show.jam_tayang.strftime("%d %b %Y, %I:%M %p") if b.show and b.show.jam_tayang else "N/A"

        result.append({
            "id": f"#TRX-{8900 + b.id}",
            "movie": movie_title,
            "studio_seats": f"{studio_name} • Seat {', '.join(seats)}",
            "datetime": datetime_str,
            "amount": b.total_harga,
            "status": b.status_pembayaran.capitalize()
        })
    return result
