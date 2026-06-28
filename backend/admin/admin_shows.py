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

@router.post("", response_model=schemas.Show, status_code=status.HTTP_201_CREATED)
def create_show(show: schemas.ShowCreate, db: Session = Depends(get_db)):
    new_movie = db.query(models.Movie).filter(models.Movie.id == show.movie_id).first()
    if not new_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan.")
    
    new_start = show.jam_tayang.replace(tzinfo=None)
    new_end = new_start + timedelta(minutes=new_movie.durasi_menit + 15)
    
    existing_shows = db.query(models.Show).filter(models.Show.studio_id == show.studio_id).all()
    for ex_show in existing_shows:
        ex_start = ex_show.jam_tayang.replace(tzinfo=None)
        durasi = ex_show.movie.durasi_menit if ex_show.movie else 120
        ex_end = ex_start + timedelta(minutes=durasi + 15)
        
        if new_start < ex_end and new_end > ex_start:
            raise HTTPException(status_code=400, detail="Jadwal bertabrakan dengan tayangan lain di studio ini (termasuk waktu pembersihan 15 menit).")

    db_show = models.Show(**show.model_dump())
    db.add(db_show)
    db.commit()
    db.refresh(db_show)
    return db_show

@router.get("", response_model=List[schemas.Show])
def get_all_shows(db: Session = Depends(get_db)):
    return db.query(models.Show).all()

@router.put("/{show_id}", response_model=schemas.Show)
def update_show(show_id: int, show: schemas.ShowCreate, db: Session = Depends(get_db)):
    db_show = db.query(models.Show).filter(models.Show.id == show_id).first()
    if not db_show:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    new_movie = db.query(models.Movie).filter(models.Movie.id == show.movie_id).first()
    if not new_movie:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan.")
    
    new_start = show.jam_tayang.replace(tzinfo=None)
    new_end = new_start + timedelta(minutes=new_movie.durasi_menit + 15)
    
    existing_shows = db.query(models.Show).filter(models.Show.studio_id == show.studio_id).all()
    for ex_show in existing_shows:
        if ex_show.id == show_id:
            continue
        ex_start = ex_show.jam_tayang.replace(tzinfo=None)
        durasi = ex_show.movie.durasi_menit if ex_show.movie else 120
        ex_end = ex_start + timedelta(minutes=durasi + 15)
        
        if new_start < ex_end and new_end > ex_start:
            raise HTTPException(status_code=400, detail="Waktu tayang yang baru bertabrakan dengan jadwal lain di studio ini.")

    for key, value in show.model_dump().items():
        setattr(db_show, key, value)
        
    try:
        db.commit()
        db.refresh(db_show)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menyimpan perubahan. Mungkin sudah ada tiket yang terpesan.")
        
    return db_show

@router.delete("/{show_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_show(show_id: int, db: Session = Depends(get_db)):
    db_show = db.query(models.Show).filter(models.Show.id == show_id).first()
    if not db_show:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    
    try:
        db.delete(db_show)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus jadwal karena sudah ada tiket yang terpesan.")
    return None
