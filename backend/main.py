from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid

import models, schemas, database, auth
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistem CineMaxxx API", description="API untuk Sistem Penjualan Tiket Bioskop", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- AUTHENTICATION ---
@app.post("/api/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(nama=user.nama, email=user.email, password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ADMIN ENDPOINTS ---

@app.post("/api/admin/upload")
def upload_image(file: UploadFile = File(...), admin: models.User = Depends(auth.get_current_admin)):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file extension")
    
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("static", "uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/uploads/{filename}"}

# 1. Manajemen Movies
@app.post("/api/admin/movies", response_model=schemas.Movie, status_code=status.HTTP_201_CREATED)
def create_movie(movie: schemas.MovieCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_movie = models.Movie(**movie.model_dump())
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

@app.get("/api/admin/movies", response_model=List[schemas.Movie])
def get_movies(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Movie).all()

@app.put("/api/admin/movies/{movie_id}", response_model=schemas.Movie)
def update_movie(movie_id: int, movie: schemas.MovieCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not db_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")
    for key, value in movie.model_dump().items():
        setattr(db_movie, key, value)
    db.commit()
    db.refresh(db_movie)
    return db_movie

@app.delete("/api/admin/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
    if not db_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")
    db.delete(db_movie)
    db.commit()
    return None

# 2. Manajemen Studio & Seats
@app.post("/api/admin/studios", response_model=schemas.Studio, status_code=status.HTTP_201_CREATED)
def create_studio(studio: schemas.StudioCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_studio = models.Studio(**studio.model_dump())
    db.add(db_studio)
    db.commit()
    db.refresh(db_studio)
    return db_studio

@app.get("/api/admin/studios", response_model=List[schemas.Studio])
def get_studios(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Studio).all()

@app.post("/api/admin/seats", response_model=schemas.Seat, status_code=status.HTTP_201_CREATED)
def create_seat(seat: schemas.SeatCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_seat = models.Seat(**seat.model_dump())
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat

@app.get("/api/admin/seats/{studio_id}", response_model=List[schemas.Seat])
def get_seats_by_studio(studio_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Seat).filter(models.Seat.studio_id == studio_id).all()

# 3. Manajemen Shows
@app.post("/api/admin/shows", response_model=schemas.Show, status_code=status.HTTP_201_CREATED)
def create_show(show: schemas.ShowCreate, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_show = models.Show(**show.model_dump())
    db.add(db_show)
    db.commit()
    db.refresh(db_show)
    return db_show

@app.get("/api/admin/shows", response_model=List[schemas.Show])
def get_all_shows(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Show).all()

# 4. Manajemen Users
@app.get("/api/admin/users", response_model=List[schemas.User])
def get_all_users(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.User).all()

@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    db.delete(db_user)
    db.commit()
    return None

# 5. Laporan Penjualan
@app.get("/api/admin/reports")
def get_reports(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    total_pendapatan = db.query(func.sum(models.Booking.total_harga)).filter(models.Booking.status_pembayaran == "paid").scalar() or 0
    
    tiket_terjual = db.query(
        models.Movie.judul, 
        func.count(models.BookingDetail.id).label("total_tiket")
    ).join(models.Show, models.Show.movie_id == models.Movie.id) \
     .join(models.Booking, models.Booking.show_id == models.Show.id) \
     .join(models.BookingDetail, models.BookingDetail.booking_id == models.Booking.id) \
     .filter(models.Booking.status_pembayaran == "paid") \
     .group_by(models.Movie.id).all()
     
    data_tiket = [{"judul": t[0], "total_tiket": t[1]} for t in tiket_terjual]
     
    return {
        "total_pendapatan": float(total_pendapatan),
        "tiket_terjual_per_film": data_tiket
    }

# --- CUSTOMER ENDPOINTS ---
# 1. Melihat Jadwal Film & Lokasi
@app.get("/api/movies", response_model=List[schemas.Movie])
def get_public_movies(db: Session = Depends(database.get_db)):
    return db.query(models.Movie).all()

@app.get("/api/shows", response_model=List[schemas.Show])
def get_active_shows(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Show).all()

# 2. Pemilihan Kursi Interaktif
@app.get("/api/shows/{show_id}/seats", response_model=List[schemas.SeatAvailability])
def get_seat_availability(show_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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

# 3. Melakukan Pemesanan Tiket
@app.post("/api/bookings", response_model=schemas.Booking, status_code=status.HTTP_201_CREATED)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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

# --- PAYMENT GATEWAY ENDPOINT ---
@app.post("/api/payments/process")
def process_payment(payment: schemas.PaymentProcess, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
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

# --- USER PROFILE & HISTORY ENDPOINTS ---
@app.get("/api/user/profile", response_model=schemas.User)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/user/bookings", response_model=List[schemas.BookingHistory])
def get_user_bookings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Get all bookings for the user with details, shows, movies, etc.
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).order_by(models.Booking.id.desc()).all()
    return bookings