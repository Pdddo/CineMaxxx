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

@router.post("/studios", response_model=schemas.Studio, status_code=status.HTTP_201_CREATED)
def create_studio(studio: schemas.StudioCreate, db: Session = Depends(get_db)):
    db_studio = models.Studio(**studio.model_dump())
    db.add(db_studio)
    db.commit()
    db.refresh(db_studio)
    return db_studio

@router.get("/studios", response_model=List[schemas.Studio])
def get_studios(db: Session = Depends(get_db)):
    return db.query(models.Studio).all()

@router.put("/studios/{studio_id}", response_model=schemas.Studio)
def update_studio(studio_id: int, studio: schemas.StudioCreate, db: Session = Depends(get_db)):
    db_studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first()
    if not db_studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
    for key, value in studio.model_dump().items():
        setattr(db_studio, key, value)
    db.commit()
    db.refresh(db_studio)
    return db_studio

@router.delete("/studios/{studio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_studio(studio_id: int, db: Session = Depends(get_db)):
    db_studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first()
    if not db_studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
    db.delete(db_studio)
    db.commit()
    return None

@router.get("/seats/{studio_id}", response_model=List[schemas.Seat])
def get_seats(studio_id: int, db: Session = Depends(get_db)):
    return db.query(models.Seat).filter(models.Seat.studio_id == studio_id).all()

@router.post("/studios/{studio_id}/generate-seats", response_model=List[schemas.Seat])
def generate_seats(studio_id: int, rows: int = 5, cols: int = 10, db: Session = Depends(get_db)):
    studio = db.query(models.Studio).filter(models.Studio.id == studio_id).first()
    if not studio:
        raise HTTPException(status_code=404, detail="Studio tidak ditemukan")
        
    try:
        db.query(models.Seat).filter(models.Seat.studio_id == studio_id).delete()
        
        new_seats = []
        for r in range(rows):
            row_char = chr(65 + r)
            for c in range(1, cols + 1):
                seat_num = f"{row_char}{c}"
                new_seat = models.Seat(studio_id=studio_id, nomor_kursi=seat_num)
                db.add(new_seat)
                new_seats.append(new_seat)
                
        db.commit()
        for seat in new_seats:
            db.refresh(seat)
        return new_seats
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Tidak dapat merombak kursi karena studio ini sudah memiliki riwayat pemesanan tiket pada kursinya."
        )

@router.post("/seats", response_model=schemas.Seat)
def add_seat(seat: schemas.SeatCreate, db: Session = Depends(get_db)):
    db_seat = models.Seat(**seat.model_dump())
    db.add(db_seat)
    db.commit()
    db.refresh(db_seat)
    return db_seat

@router.delete("/seats/{seat_id}")
def delete_seat(seat_id: int, db: Session = Depends(get_db)):
    seat = db.query(models.Seat).filter(models.Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    db.delete(seat)
    db.commit()
    return {"message": "deleted"}
