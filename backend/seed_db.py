import datetime
from database import SessionLocal, engine
import models
import auth

# Create tables just in case
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if data already exists
if db.query(models.Movie).first():
    print("Database already has data. Skipping seed.")
    db.close()
    exit()

# 1. Add Admin User
hashed_pwd = auth.get_password_hash("admin123")
admin = models.User(nama="Admin", email="admin@cinemaxxx.com", password=hashed_pwd, role="admin")
db.add(admin)

# 2. Add Customer User
hashed_pwd_cust = auth.get_password_hash("customer123")
cust = models.User(nama="Budi", email="budi@gmail.com", password=hashed_pwd_cust, role="customer")
db.add(cust)

# 3. Add Movies
m1 = models.Movie(
    judul="Mission: Impossible - Dead Reckoning",
    durasi_menit=163,
    sinopsis="Ethan Hunt and his IMF team embark on their most dangerous mission yet.",
    poster_url="/static/uploads/mission.jpg" # will just map to 404 but frontend fallback will handle it if we haven't created the file
)
m2 = models.Movie(
    judul="Oppenheimer",
    durasi_menit=180,
    sinopsis="The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    poster_url="/static/uploads/oppenheimer.jpg"
)
m3 = models.Movie(
    judul="Barbie",
    durasi_menit=114,
    sinopsis="Barbie suffers a crisis that leads her to question her world and her existence.",
    poster_url="/static/uploads/barbie.jpg"
)
m4 = models.Movie(
    judul="Spider-Man: Across the Spider-Verse",
    durasi_menit=140,
    sinopsis="Miles Morales catapults across the Multiverse.",
    poster_url="/static/uploads/spiderman.jpg"
)

db.add_all([m1, m2, m3, m4])
db.commit()

# 4. Add Studio
s1 = models.Studio(nama_studio="Studio 1 (Deluxe)")
s2 = models.Studio(nama_studio="Studio 2 (IMAX)")
db.add_all([s1, s2])
db.commit()

# 5. Add Seats to Studio 1 (e.g. 20 seats)
seats = []
for row in ['A', 'B', 'C', 'D']:
    for col in range(1, 6):
        seats.append(models.Seat(studio_id=s1.id, nomor_kursi=f"{row}{col}"))

for row in ['A', 'B', 'C', 'D']:
    for col in range(1, 6):
        seats.append(models.Seat(studio_id=s2.id, nomor_kursi=f"{row}{col}"))

db.add_all(seats)
db.commit()

# 6. Add Shows (Jadwal Tayang)
now = datetime.datetime.now()
show1 = models.Show(movie_id=m1.id, studio_id=s1.id, jam_tayang=now + datetime.timedelta(hours=2))
show2 = models.Show(movie_id=m1.id, studio_id=s2.id, jam_tayang=now + datetime.timedelta(hours=5))
show3 = models.Show(movie_id=m2.id, studio_id=s2.id, jam_tayang=now + datetime.timedelta(days=1))
show4 = models.Show(movie_id=m3.id, studio_id=s1.id, jam_tayang=now + datetime.timedelta(hours=3))

db.add_all([show1, show2, show3, show4])
db.commit()

print("Database seeded successfully with dummy data!")
db.close()
