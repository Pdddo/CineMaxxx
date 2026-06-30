from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/api",
    tags=["public"]
)

# Tujuan: Mendapatkan daftar semua film (publik).
# Parameter: db (Session): Sesi DB (opsional).
# return: List[schemas.Movie] (daftar film).
@router.get("/movies", response_model=List[schemas.Movie])
def get_public_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all() # Ambil semua film dari database

from datetime import datetime

# Tujuan: Mendapatkan jadwal tayang yang aktif.
# Parameter: db (Session): Sesi DB (opsional).
# return: List[schemas.Show] (daftar jadwal tayang aktif).
@router.get("/shows", response_model=List[schemas.Show])
def get_active_shows(db: Session = Depends(get_db)):
    return db.query(models.Show).join(models.Studio).filter( # Query jadwal dengan join tabel Studio
        models.Show.jam_tayang >= datetime.now(), # Syarat 1: waktu belum lewat
        models.Studio.status != 'Maintenance' # Syarat 2: Studio tidak Maintenance
    ).all()
