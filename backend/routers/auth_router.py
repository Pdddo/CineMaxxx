from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)



# Tujuan: Mendaftar akun baru.
# Parameter:
# - user (UserCreate): Data registrasi (wajib).
# - db (Session): Sesi DB (opsional).
# Nilai Balik: schemas.User (user yang dibuat).
@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first() # Cek email sudah ada atau belum
    if db_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar") # Tolak jika email sudah terpakai
    hashed_password = auth.get_password_hash(user.password) # Enkripsi password
    new_user = models.User(nama=user.nama, email=user.email, password=hashed_password, role=user.role) # Buat objek user
    db.add(new_user) # Tambah ke session
    db.commit() # Simpan ke DB
    db.refresh(new_user) # Dapatkan ID terbaru
    return new_user



# Tujuan: Login dan dapatkan token.
# Parameter:
# - form_data (OAuth2PasswordRequestForm): Form data kredensial (wajib).
# - db (Session): Sesi DB (opsional).
# Nilai Balik: schemas.Token (berisi token dan tipe token).
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first() # Cari user berdasarkan email
    if not user or not auth.verify_password(form_data.password, user.password): # Validasi email dan password
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role}) # Generate token JWT
    return {"access_token": access_token, "token_type": "bearer"} # Berikan token ke client
