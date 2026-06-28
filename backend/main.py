from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from database import engine
from admin import admin_reports, admin_library, admin_studios, admin_shows
from routers import auth_router, public_router, booking_router, user_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistem CineMaxxx API", description="API untuk Sistem Penjualan Tiket Bioskop", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- CUSTOMER ENDPOINTS ---
app.include_router(auth_router.router)
app.include_router(public_router.router)
app.include_router(booking_router.router)
app.include_router(user_router.router)

# --- ADMIN ENDPOINTS ---
app.include_router(admin_reports.router)
app.include_router(admin_library.router)
app.include_router(admin_studios.router)
app.include_router(admin_shows.router)