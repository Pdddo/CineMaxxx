from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(
    prefix="/api",
    tags=["public"]
)

@router.get("/movies", response_model=List[schemas.Movie])
def get_public_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all()

from datetime import datetime

@router.get("/shows", response_model=List[schemas.Show])
def get_active_shows(db: Session = Depends(get_db)):
    return db.query(models.Show).filter(models.Show.jam_tayang >= datetime.now()).all()
