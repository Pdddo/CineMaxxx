import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
import models
from auth import get_password_hash
from datetime import datetime, timedelta

def seed():
    print("Dropping all tables...")
    models.Base.metadata.drop_all(bind=engine)
    print("Recreating all tables...")
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding users...")
        admin = models.User(
            nama="Administrator", 
            email="admin@cinemaxxx.com", 
            password=get_password_hash("admin123"), 
            role="admin"
        )
        user = models.User(
            nama="Customer", 
            email="user@gmail.com", 
            password=get_password_hash("user123"), 
            role="customer"
        )
        db.add_all([admin, user])
        
        print("Seeding movies...")
        movies_data = [
            {"judul": "Black Adam", "durasi_menit": 125, "sinopsis": "Nearly 5,000 years after he was bestowed with the almighty powers of the Egyptian gods—and imprisoned just as quickly—Black Adam is freed from his earthly tomb, ready to unleash his unique form of justice on the modern world.", "poster_url": "/poster_blackadam.png", "genre": "Action, Fantasy", "rating": "PG-13", "status": "Now Showing", "release_date": "2022-10-21"},
            {"judul": "Love Again", "durasi_menit": 104, "sinopsis": "A young woman tries to ease the pain of her fiancé's death by sending romantic texts to his old cell phone number, and forms a connection with the man the number has been reassigned to.", "poster_url": "/poster_loveagain.png", "genre": "Romance, Comedy", "rating": "PG-13", "status": "Now Showing", "release_date": "2023-05-05"},
            {"judul": "Life of Mia", "durasi_menit": 110, "sinopsis": "An inspiring story of Mia's journey through life, overcoming obstacles and finding her true passion in music.", "poster_url": "/poster_lifeofmia.png", "genre": "Drama", "rating": "R", "status": "Now Showing", "release_date": "2023-08-12"},
            {"judul": "Mio", "durasi_menit": 90, "sinopsis": "An animated adventure about a little cat named Mio who embarks on a grand journey to find his family.", "poster_url": "/poster_mio.png", "genre": "Animation, Family", "rating": "G", "status": "Now Showing", "release_date": "2021-11-20"},
            {"judul": "Jokowi", "durasi_menit": 115, "sinopsis": "A biographical drama depicting the early life and rise of the 7th President of Indonesia.", "poster_url": "/poster_jokowi.png", "genre": "Biography, Drama", "rating": "PG", "status": "Now Showing", "release_date": "2013-06-20"},
            {"judul": "Cuma Janji", "durasi_menit": 100, "sinopsis": "Drama percintaan lokal yang mengharukan tentang kesetiaan dan janji yang tak pernah ditepati.", "poster_url": "/poster_cumajanji.png", "genre": "Drama, Romance", "rating": "PG-13", "status": "Coming Soon", "release_date": "2024-02-14"},
        ]
        
        movies = []
        for md in movies_data:
            m = models.Movie(**md)
            db.add(m)
            movies.append(m)
            
        print("Seeding studios and seats...")
        studios_data = [
            {"nama_studio": "Studio 1", "tipe": "IMAX", "status": "Active"},
            {"nama_studio": "Studio 2", "tipe": "Premium", "status": "Active"},
            {"nama_studio": "Studio 3", "tipe": "Regular", "status": "Active"},
        ]
        studios = []
        for sd in studios_data:
            s = models.Studio(**sd)
            db.add(s)
            studios.append(s)
        
        db.commit() # Commit so we can get IDs
        
        # Generate Seats
        for s in studios:
            rows = 4 if s.tipe == "Regular" else (3 if s.tipe == "IMAX" else 2)
            cols = 8 if s.tipe != "Premium" else 6
            for r in range(rows):
                for c in range(cols):
                    row_char = chr(65 + r)
                    seat_num = f"{row_char}{c+1}"
                    db.add(models.Seat(studio_id=s.id, nomor_kursi=seat_num))
        db.commit()
        
        print("Seeding schedules (shows)...")
        # Ensure no overlaps
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Helper to add 15 mins buffer
        def next_time(start_dt, durasi):
            return start_dt + timedelta(minutes=durasi + 15)
            
        # Studio 1 (IMAX)
        s1_1 = today.replace(hour=10, minute=0)
        s1_2 = next_time(s1_1, movies[0].durasi_menit) # Black Adam (125m) -> 12:20
        s1_3 = next_time(s1_2, movies[4].durasi_menit) # Jokowi (115m) -> 14:30
        
        # Studio 2 (Premium)
        s2_1 = today.replace(hour=11, minute=0)
        s2_2 = next_time(s2_1, movies[1].durasi_menit) # Love Again (104m) -> 12:59
        s2_3 = next_time(s2_2, movies[2].durasi_menit) # Life of Mia (110m) -> 15:04

        # Studio 3 (Regular)
        s3_1 = today.replace(hour=9, minute=30)
        s3_2 = next_time(s3_1, movies[3].durasi_menit) # Mio (90m) -> 11:15
        s3_3 = next_time(s3_2, movies[0].durasi_menit) # Black Adam (125m) -> 13:35

        shows_data = [
            # IMAX
            models.Show(movie_id=movies[0].id, studio_id=studios[0].id, jam_tayang=s1_1, harga=75000),
            models.Show(movie_id=movies[4].id, studio_id=studios[0].id, jam_tayang=s1_2, harga=75000),
            models.Show(movie_id=movies[0].id, studio_id=studios[0].id, jam_tayang=s1_3, harga=75000),
            
            # Premium
            models.Show(movie_id=movies[1].id, studio_id=studios[1].id, jam_tayang=s2_1, harga=120000),
            models.Show(movie_id=movies[2].id, studio_id=studios[1].id, jam_tayang=s2_2, harga=120000),
            models.Show(movie_id=movies[1].id, studio_id=studios[1].id, jam_tayang=s2_3, harga=120000),
            
            # Regular
            models.Show(movie_id=movies[3].id, studio_id=studios[2].id, jam_tayang=s3_1, harga=50000),
            models.Show(movie_id=movies[0].id, studio_id=studios[2].id, jam_tayang=s3_2, harga=50000),
            models.Show(movie_id=movies[3].id, studio_id=studios[2].id, jam_tayang=s3_3, harga=50000),
        ]
        
        for sh in shows_data:
            db.add(sh)
        
        db.commit()
        
        print("Seeding dummy transactions...")
        import random
        all_seats = db.query(models.Seat).all()
        seats_by_studio = {}
        for st in all_seats:
            if st.studio_id not in seats_by_studio:
                seats_by_studio[st.studio_id] = []
            seats_by_studio[st.studio_id].append(st)
            
        for show in shows_data:
            num_bookings = random.randint(2, 6)
            studio_seats = seats_by_studio.get(show.studio_id, [])
            taken_seats = set()
            
            for _ in range(num_bookings):
                num_tickets = random.randint(1, 4)
                available = [s for s in studio_seats if s.id not in taken_seats]
                if len(available) < num_tickets:
                    break
                    
                selected_seats = random.sample(available, num_tickets)
                for s in selected_seats:
                    taken_seats.add(s.id)
                    
                total_price = num_tickets * show.harga
                booking = models.Booking(
                    user_id=user.id,
                    show_id=show.id,
                    total_harga=total_price,
                    status_pembayaran="paid"
                )
                db.add(booking)
                db.flush()
                
                for s in selected_seats:
                    db.add(models.BookingDetail(booking_id=booking.id, seat_id=s.id))
                    
        db.commit()
        
        print("Database seeded successfully with valid IDs starting from 1!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
