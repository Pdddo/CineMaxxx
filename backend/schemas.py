from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    nama: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "customer"

class UserUpdate(BaseModel):
    nama: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Movie
class MovieBase(BaseModel):
    judul: str
    durasi_menit: int
    sinopsis: str
    poster_url: Optional[str] = None

class MovieCreate(MovieBase):
    pass

class Movie(MovieBase):
    id: int
    class Config:
        from_attributes = True

# Studio
class StudioBase(BaseModel):
    nama_studio: str

class StudioCreate(StudioBase):
    pass

class Studio(StudioBase):
    id: int
    class Config:
        from_attributes = True

# Seat
class SeatBase(BaseModel):
    studio_id: int
    nomor_kursi: str

class SeatCreate(SeatBase):
    pass

class Seat(SeatBase):
    id: int
    class Config:
        from_attributes = True

# Show
class ShowBase(BaseModel):
    movie_id: int
    studio_id: int
    jam_tayang: datetime

class ShowCreate(ShowBase):
    pass

class Show(ShowBase):
    id: int
    movie: Movie
    studio: Studio
    class Config:
        from_attributes = True

# Seat Availability
class SeatAvailability(BaseModel):
    seat_id: int
    nomor_kursi: str
    is_booked: bool

# Booking
class BookingCreate(BaseModel):
    show_id: int
    seat_ids: List[int]
    total_harga: float

class Booking(BaseModel):
    id: int
    user_id: int
    show_id: int
    total_harga: float
    status_pembayaran: str
    class Config:
        from_attributes = True

class PaymentProcess(BaseModel):
    booking_id: int
    status: str # 'success' or 'fail'

class BookingDetail(BaseModel):
    id: int
    seat: Seat
    class Config:
        from_attributes = True

class BookingHistory(Booking):
    show: Show
    details: List[BookingDetail]
    class Config:
        from_attributes = True
