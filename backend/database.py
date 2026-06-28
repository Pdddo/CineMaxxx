from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Ganti 'postgres' dan 'passwordmu' sesuai dengan kredensial PostgreSQL kamu di DBeaver
# Format: postgresql://<username>:<password>@<host>:<port>/<nama_database>
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:reski 123@localhost:5432/cinemaxxx"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()