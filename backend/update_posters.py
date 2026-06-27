import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def update_posters():
    db: Session = SessionLocal()
    
    posters = [
        "/poster_blackadam.png",
        "/poster_cumajanji.png",
        "/poster_jokowi.png",
        "/poster_keluargasuami.png",
        "/poster_lifeofmia.png",
        "/poster_loveagain.png",
        "/poster_mio.png",
        "/poster_pabrikmuwani.png",
        "/poster_paraperodok.png",
        "/poster_promosi1.png",
        "/poster_promosi2.png",
        "/poster_rusdi.png"
    ]
    
    movies = db.query(models.Movie).order_by(models.Movie.id).all()
    
    for i, movie in enumerate(movies):
        poster = posters[i % len(posters)]
        movie.poster_url = poster
        print(f"Updated {movie.judul} -> {poster}")
        
    db.commit()
    db.close()
    print("Berhasil mengupdate seluruh poster_url film dengan file yang ada di folder public!")

if __name__ == "__main__":
    update_posters()
