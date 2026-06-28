from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="customer")

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    judul = Column(String, index=True)
    durasi_menit = Column(Integer)
    sinopsis = Column(Text)
    poster_url = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    rating = Column(String, nullable=True)
    status = Column(String, default="Now Showing")
    release_date = Column(String, nullable=True)

    shows = relationship("Show", back_populates="movie", cascade="all, delete-orphan")

class Studio(Base):
    __tablename__ = "studios"
    id = Column(Integer, primary_key=True, index=True)
    nama_studio = Column(String)
    tipe = Column(String, default="Standard")
    status = Column(String, default="Active")

    shows = relationship("Show", back_populates="studio", cascade="all, delete-orphan")
    seats = relationship("Seat", back_populates="studio", cascade="all, delete-orphan")

class Show(Base):
    __tablename__ = "shows"
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"))
    studio_id = Column(Integer, ForeignKey("studios.id"))
    jam_tayang = Column(DateTime)
    harga = Column(Float, default=50000.0)

    movie = relationship("Movie", back_populates="shows")
    studio = relationship("Studio", back_populates="shows")
    bookings = relationship("Booking", back_populates="show", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    studio_id = Column(Integer, ForeignKey("studios.id"))
    nomor_kursi = Column(String)

    studio = relationship("Studio", back_populates="seats")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    show_id = Column(Integer, ForeignKey("shows.id"))
    total_harga = Column(Float)
    status_pembayaran = Column(String, default="pending")

    user = relationship("User", back_populates="bookings")
    show = relationship("Show", back_populates="bookings")
    details = relationship("BookingDetail", back_populates="booking", cascade="all, delete-orphan")

class BookingDetail(Base):
    __tablename__ = "booking_details"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"))

    booking = relationship("Booking", back_populates="details")
    seat = relationship("Seat")
