import psycopg2
from database import SQLALCHEMY_DATABASE_URL

# Convert SQLAlchemy URL to psycopg2 connect format if necessary, or just use it directly
# psycopg2 accepts postgresql:// URIs directly
conn = psycopg2.connect(SQLALCHEMY_DATABASE_URL)
cur = conn.cursor()

try:
    # Alter movies
    cur.execute("ALTER TABLE movies ADD COLUMN IF NOT EXISTS genre VARCHAR")
    cur.execute("ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating VARCHAR")
    cur.execute("ALTER TABLE movies ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Now Showing'")
    cur.execute("ALTER TABLE movies ADD COLUMN IF NOT EXISTS release_date VARCHAR")
    
    # Alter studios
    cur.execute("ALTER TABLE studios ADD COLUMN IF NOT EXISTS tipe VARCHAR DEFAULT 'Standard'")
    cur.execute("ALTER TABLE studios ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Active'")
    
    conn.commit()
    print("Migration successful")
except Exception as e:
    conn.rollback()
    print("Error:", e)
finally:
    cur.close()
    conn.close()
