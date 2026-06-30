from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import timedelta

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api/admin/shows",
    tags=["admin_shows"],
    dependencies=[Depends(auth.get_current_admin)]
)


# Tujuan: Membuat jadwal tayang baru.
# Parameter:
# - show (ShowCreate): Data jadwal (wajib).
# - db (Session): Sesi DB (opsional).
# return: schemas.Show (jadwal tayang yang dibuat).
@router.post("", response_model=schemas.Show, status_code=status.HTTP_201_CREATED)
def create_show(show: schemas.ShowCreate, db: Session = Depends(get_db)):
    new_movie = db.query(models.Movie).filter(models.Movie.id == show.movie_id).first() # Cari film terkait
    if not new_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan.") # Error jika film tak ada
    
    new_start = show.jam_tayang.replace(tzinfo=None) # Hilangkan zona waktu dari input
    new_end = new_start + timedelta(minutes=new_movie.durasi_menit + 15) # Hitung waktu selesai + jeda 15 menit
    
    existing_shows = db.query(models.Show).filter(models.Show.studio_id == show.studio_id).all() # Ambil jadwal di studio ini
    for ex_show in existing_shows: # Cek tiap jadwal untuk deteksi bentrok
        ex_start = ex_show.jam_tayang.replace(tzinfo=None) # Waktu mulai tayangan eksisting
        durasi = ex_show.movie.durasi_menit if ex_show.movie else 120 # Ambil durasi
        ex_end = ex_start + timedelta(minutes=durasi + 15) # Waktu selesai tayangan eksisting
        
        if new_start < ex_end and new_end > ex_start: # Logika overlap
            raise HTTPException(status_code=400, detail="Jadwal bertabrakan dengan tayangan lain di studio ini (termasuk waktu pembersihan 15 menit).")

    db_show = models.Show(**show.model_dump()) # Buat objek model Show
    db.add(db_show) # Tambah ke session
    db.commit() # Simpan ke DB
    db.refresh(db_show) # Refresh data dari DB
    return db_show



# Tujuan: Mendapatkan semua jadwal tayang.
# Parameter: db (Session): Sesi DB (opsional).
# return: List[schemas.Show] (daftar semua jadwal).
@router.get("", response_model=List[schemas.Show])
def get_all_shows(db: Session = Depends(get_db)):
    return db.query(models.Show).all() # Ambil semua jadwal



# Tujuan: Memperbarui jadwal tayang.
# Parameter:
# - show_id (int): ID jadwal (wajib).
# - show (ShowCreate): Data baru (wajib).
# - db (Session): Sesi DB (opsional).
# return: schemas.Show (jadwal ter-update).
@router.put("/{show_id}", response_model=schemas.Show)
def update_show(show_id: int, show: schemas.ShowCreate, db: Session = Depends(get_db)):
    db_show = db.query(models.Show).filter(models.Show.id == show_id).first() # Cari jadwal tayang
    if not db_show:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    new_movie = db.query(models.Movie).filter(models.Movie.id == show.movie_id).first() # Cari film target
    if not new_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan.")
    
    new_start = show.jam_tayang.replace(tzinfo=None) # Mulai baru
    new_end = new_start + timedelta(minutes=new_movie.durasi_menit + 15) # Selesai baru
    
    existing_shows = db.query(models.Show).filter(models.Show.studio_id == show.studio_id).all() # Jadwal di studio
    for ex_show in existing_shows: # Loop deteksi bentrok
        if ex_show.id == show_id: # Lewati jika id-nya sama
            continue
        ex_start = ex_show.jam_tayang.replace(tzinfo=None)
        durasi = ex_show.movie.durasi_menit if ex_show.movie else 120
        ex_end = ex_start + timedelta(minutes=durasi + 15)
        
        if new_start < ex_end and new_end > ex_start: # Logika overlap
            raise HTTPException(status_code=400, detail="Waktu tayang yang baru bertabrakan dengan jadwal lain di studio ini.")

    for key, value in show.model_dump().items():
        setattr(db_show, key, value) # Timpa atribut
        
    try:
        db.commit() # Simpan perubahan
        db.refresh(db_show)
    except IntegrityError:
        db.rollback() # Batalkan jika ada error integritas DB
        raise HTTPException(status_code=400, detail="Gagal menyimpan perubahan. Mungkin sudah ada tiket yang terpesan.")
        
    return db_show




# Tujuan: Menghapus jadwal tayang.
# Parameter:
# - show_id (int): ID jadwal (wajib).
# - db (Session): Sesi DB (opsional).
# return: None.
@router.delete("/{show_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_show(show_id: int, db: Session = Depends(get_db)):

    db_show = db.query(models.Show).filter(models.Show.id == show_id).first() # Cari jadwal
    if not db_show:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    
    try:
        db.delete(db_show) # Hapus jadwal dari database
        db.commit() # Terapkan perubahan
    except IntegrityError:
        db.rollback() # Rollback jika relasi error
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus jadwal karena sudah ada tiket yang terpesan.")
    return None
