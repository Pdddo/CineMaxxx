from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

import models
import schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/api/admin",
    tags=["admin_studios"],
    dependencies=[Depends(auth.get_current_admin)]
)


# Tujuan: Membuat studio baru.
# Parameter:
# - studio (StudioCreate): Data studio (wajib).
# - db (Session): Sesi DB (opsional).
# return: schemas.Studio (studio dibuat).
@router.post("/studios", response_model=schemas.Studio, status_code=status.HTTP_201_CREATED)
def create_studio(studio: schemas.StudioCreate, db: Session = Depends(get_db)):
    db_studio = models.Studio(**studio.model_dump()) # Konversi data pydantic ke SQLAlchemy model
    db.add(db_studio) # Tambah ke session
    db.commit() # Simpan ke DB
    db.refresh(db_studio) # Dapatkan data terbaru
    return db_studio



# Tujuan: Mendapatkan daftar studio.
# Parameter: db (Session): Sesi DB (opsional).
# return: List[schemas.Studio] (daftar studio).
@router.get("/studios", response_model=List[schemas.Studio])
def get_studios(db: Session = Depends(get_db)):
    return db.query(models.Studio).all() # Mengambil semua record studio

# Tujuan: Mengupdate studio.
# Parameter:
# - studio_id (int): ID studio (wajib).
# - studio (StudioCreate): Data baru (wajib).
# - db (Session): Sesi DB (opsional).
# return: schemas.Studio (studio ter-update).
@router.put("/studios/{studio_id}", response_model=schemas.Studio)
def update_studio(studio_id: int, studio: schemas.StudioCreate, db: Session = Depends(get_db)):

    db_studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first() # Ambil studio terkait
    if not db_studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
    for key, value in studio.model_dump().items():
        setattr(db_studio, key, value) # Perbarui masing-masing field
    db.commit() # Eksekusi simpan
    db.refresh(db_studio) # Refresh nilai kembalian
    return db_studio



# Tujuan: Menghapus studio.
# Parameter:
# - studio_id (int): ID studio (wajib).
# - db (Session): Sesi DB (opsional).
# return: None.
@router.delete("/studios/{studio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_studio(studio_id: int, db: Session = Depends(get_db)):

    db_studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first() # Cari studio
    if not db_studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
    db.delete(db_studio) # Tandai studio untuk dihapus
    db.commit() # Hapus dari DB
    return None



# Tujuan: Mendapatkan daftar kursi studio.
# Parameter:
# - studio_id (int): ID studio (wajib).
# - db (Session): Sesi DB (opsional).
# return: List[schemas.Seat] (daftar kursi).
@router.get("/seats/{studio_id}", response_model=List[schemas.Seat])
def get_seats(studio_id: int, db: Session = Depends(get_db)):
    return db.query(models.Seat).filter(models.Seat.studio_id == studio_id).all() # Ambil semua kursi milik studio target



# Tujuan: Generate otomatis layout kursi.
# Parameter:
# - studio_id (int): ID studio (wajib).
# - rows (int): Baris, default 5 (opsional).
# - cols (int): Kolom, default 10 (opsional).
# - db (Session): Sesi DB (opsional).
# return: List[schemas.Seat] (kursi yang di-generate).
@router.post("/studios/{studio_id}/generate-seats", response_model=List[schemas.Seat])
def generate_seats(studio_id: int, rows: int = 5, cols: int = 10, db: Session = Depends(get_db)):
    studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first() # Cek eksistensi studio
    if not studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
        
    try:
        db.query(models.Seat).filter(models.Seat.studio_id == studio_id).delete() # Hapus semua kursi lama
        
        new_seats = []
        for r in range(rows): # Iterasi baris
            row_char = chr(65 + r) # Konversi index jadi huruf abjad
            for c in range(1, cols + 1): # Iterasi kolom
                seat_num = f"{row_char}{c}" # Gabung huruf dan angka (misal: A1)
                new_seat = models.Seat(studio_id=studio_id, nomor_kursi=seat_num) # Buat objek kursi
                db.add(new_seat) # Tambah kursi ke sesi DB
                new_seats.append(new_seat) # Masukkan ke list lokal
                
        db.commit() # Simpan kursi-kursi baru
        for seat in new_seats:
            db.refresh(seat) # Dapatkan ID tiap kursi
        return new_seats
    except IntegrityError:
        db.rollback() # Batalkan penghapusan dan penambahan jika ada tiket terpesan (Foreign Key constrain)
        raise HTTPException(
            status_code=400,
            detail="Tidak dapat merombak kursi karena studio ini sudah memiliki riwayat pemesanan tiket pada kursinya."
        )



# Tujuan: Menambah satu kursi manual.
# Parameter:
# - seat (SeatCreate): Data kursi (wajib).
# - db (Session): Sesi DB (opsional).
# Nilai Balik: schemas.Seat (kursi dibuat).
@router.post("/seats", response_model=schemas.Seat)
def add_seat(seat: schemas.SeatCreate, db: Session = Depends(get_db)):
    db_seat = models.Seat(**seat.model_dump()) # Set data dari pydantic
    db.add(db_seat) # Tambah seat ke session
    db.commit() # Terapkan perubahan
    db.refresh(db_seat)
    return db_seat



# Tujuan: Menghapus satu kursi.
# Parameter:
# - seat_id (int): ID kursi (wajib).
# - db (Session): Sesi DB (opsional).
# Nilai Balik: dict berisi pesan sukses.
@router.delete("/seats/{seat_id}")
def delete_seat(seat_id: int, db: Session = Depends(get_db)):
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first() # Cari kursi
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    db.delete(seat) # Hapus kursi
    db.commit() # Eksekusi ke database
    return {"message": "deleted"}
