from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api/admin",
    tags=["admin_library"],
    dependencies=[Depends(auth.get_current_admin)]
)

# fungsi untuk upload file gambar.
# param: File gambar (wajib).
# return: dict berisi URL gambar.
@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
 

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower() # Ambil ekstensi file
    
    if ext not in allowed_extensions: # Validasi ekstensi
        raise HTTPException(status_code=400, detail="Invalid file extension")
    
    filename = f"{uuid.uuid4()}{ext}" # Buat nama file unik
    filepath = os.path.join("..", "public", "uploads", filename) # Tentukan path simpan
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True) # Buat folder jika belum ada
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer) # Simpan file fisik ke folder
        
    return {"url": f"/uploads/{filename}"} # Kembalikan URL publik



# fungsi untuk tambah film baru.
# param: - movie (MovieCreate): Data film baru (wajib).
# return: schemas.Movie (objek film yang dibuat).
@router.post("/movies", response_model=schemas.Movie, status_code=status.HTTP_201_CREATED)
def create_movie(movie: schemas.MovieCreate, db: Session = Depends(get_db)):
    db_movie = models.Movie(**movie.model_dump()) # Mapping data ke model
    db.add(db_movie) # Tambah ke session
    db.commit() # Simpan ke database
    db.refresh(db_movie) # Ambil ID terbaru
    return db_movie # Kembalikan objek film



# fungsi untuk mengambil semua data film.
# param: db (Session): Sesi DB (opsional).
# return: List[schemas.Movie] (daftar film).
@router.get("/movies", response_model=List[schemas.Movie])
def get_all_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all() # Ambil dan kembalikan semua baris tabel Movie



# fungsi untuk memperbarui data film.
# param: - movie_id (int): ID film (wajib).
#        - movie (MovieCreate): Data baru (wajib).
#        - db (Session): Sesi DB (opsional).
# return: schemas.Movie (film ter-update).
@router.put("/movies/{movie_id}", response_model=schemas.Movie)
def update_movie(movie_id: int, movie: schemas.MovieCreate, db: Session = Depends(get_db)):

    db_movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first() # Cari film by ID
    if not db_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan") # Error jika tidak ada
    for key, value in movie.model_dump().items():
        setattr(db_movie, key, value) # Update setiap field
    db.commit() # Simpan perubahan
    db.refresh(db_movie) # Refresh data dari DB
    return db_movie



# fungsi untuk Menghapus film.
# Parameter: - movie_id (int): ID film (wajib).
#            - db (Session): Sesi DB (opsional).
# return: None.
@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    db_movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first() # Cari film by ID
    if not db_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan") # Error jika tidak ada
    db.delete(db_movie) # Hapus objek dari database
    db.commit() # Eksekusi hapus di database
    return None
