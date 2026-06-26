import datetime
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import auth

# Buat tabel jika belum ada
models.Base.metadata.create_all(bind=engine)

def seed():
    db: Session = SessionLocal()

    print("Membersihkan data lama untuk seed ulang secara menyeluruh...")
    db.query(models.BookingDetail).delete()
    db.query(models.Booking).delete()
    db.query(models.Seat).delete()
    db.query(models.Show).delete()
    db.query(models.Studio).delete()
    db.query(models.Movie).delete()
    # Jangan hapus semua user, tapi kita bisa hapus yang dummy
    db.query(models.User).filter(models.User.email.in_(["admin@cinemaxxx.com", "customer1@cinemaxxx.com", "customer2@cinemaxxx.com"])).delete()
    db.commit()

    print("Seeding Users...")
    users = []
    # 1. Admin
    admin = models.User(
        nama="Super Admin",
        email="admin@cinemaxxx.com",
        password=auth.get_password_hash("admin123"),
        role="admin"
    )
    db.add(admin)
    users.append(admin)

    # 2. Customers
    c1 = models.User(
        nama="Budi Customer",
        email="customer1@cinemaxxx.com",
        password=auth.get_password_hash("customer123"),
        role="customer"
    )
    c2 = models.User(
        nama="Siti Customer",
        email="customer2@cinemaxxx.com",
        password=auth.get_password_hash("customer123"),
        role="customer"
    )
    db.add(c1)
    db.add(c2)
    users.append(c1)
    users.append(c2)
    db.commit()
    for u in users:
        db.refresh(u)

    print("Seeding Movies...")
    base_movies = [
        {"judul": "Cumajan Ji?", "durasi": 120},
        {"judul": "Jokowi", "durasi": 110},
        {"judul": "Life of Mia", "durasi": 95},
        {"judul": "Love Again", "durasi": 105},
        {"judul": "Mission: Impossible - Dead Reckoning", "durasi": 163},
        {"judul": "Black Adam", "durasi": 125},
        {"judul": "Avatar: The Way of Water", "durasi": 192},
        {"judul": "Spider-Man: No Way Home", "durasi": 148}
    ]

    movies = []
    # Generate 24 movies to test pagination
    for i in range(1, 25):
        base = base_movies[(i - 1) % len(base_movies)]
        judul = f"{base['judul']} {i if i > 6 else ''}".strip()
        poster_text = base['judul'].replace(' ', '+').replace(':', '')
        
        movie = models.Movie(
            judul=judul,
            durasi_menit=base["durasi"],
            sinopsis=f"Sinopsis luar biasa dan mendebarkan untuk film {judul}. Saksikan aksi dan drama yang tak terlupakan hanya di CineMaxxx.",
            poster_url=f"https://placehold.co/400x600/1e1e1e/FF6900.png?text={poster_text}+{i}"
        )
        db.add(movie)
        movies.append(movie)
    
    db.commit()
    for m in movies:
        db.refresh(m)

    print("Seeding Studios and Seats...")
    studios = []
    for s_name in ["Studio 1 (IMAX)", "Studio 2 (Regular)", "Studio 3 (Premiere)"]:
        studio = models.Studio(nama_studio=s_name)
        db.add(studio)
        studios.append(studio)
    
    db.commit()
    for s in studios:
        db.refresh(s)

    all_seats = []
    for studio in studios:
        # Buat 30 kursi per studio
        for i in range(1, 31):
            row = chr(65 + (i - 1) // 10) # A, B, C
            num = ((i - 1) % 10) + 1
            seat = models.Seat(studio_id=studio.id, nomor_kursi=f"{row}{num}")
            db.add(seat)
            all_seats.append(seat)
    db.commit()

    print("Seeding Shows...")
    today = datetime.date.today()
    shows = []
    for movie in movies:
        num_shows = random.randint(1, 3)
        for _ in range(num_shows):
            studio = random.choice(studios)
            hour = random.randint(10, 22)
            show_time = datetime.datetime.combine(today + datetime.timedelta(days=random.randint(0,2)), datetime.time(hour, 0))
            show = models.Show(
                movie_id=movie.id,
                studio_id=studio.id,
                jam_tayang=show_time
            )
            db.add(show)
            shows.append(show)
    db.commit()
    for s in shows:
        db.refresh(s)

    print("Seeding Bookings...")
    for _ in range(10): # 10 dummy bookings
        show = random.choice(shows)
        customer = random.choice([c1, c2])
        # Cari kursi di studio show ini
        studio_seats = [s for s in all_seats if s.studio_id == show.studio_id]
        chosen_seats = random.sample(studio_seats, random.randint(1, 3)) # Beli 1-3 tiket
        
        booking = models.Booking(
            user_id=customer.id,
            show_id=show.id,
            total_harga=len(chosen_seats) * 50000.0,
            status_pembayaran="paid"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        for seat in chosen_seats:
            detail = models.BookingDetail(
                booking_id=booking.id,
                seat_id=seat.id
            )
            db.add(detail)
    db.commit()

    print("Database seeding (Semua Tabel) completed successfully!")
    db.close()

if __name__ == "__main__":
    seed()
