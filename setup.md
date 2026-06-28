# Panduan Setup Project CineMaxxx

Dokumen ini berisi langkah-langkah lengkap untuk mengatur (setup) proyek CineMaxxx di komputer lokal Anda dari awal, mulai dari instalasi *library* hingga konfigurasi database.

## Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal aplikasi berikut di komputer Anda:
1. **Python** (versi 3.9 atau lebih baru)
2. **Node.js** (versi 18 atau lebih baru)
3. **PostgreSQL** (pastikan server PostgreSQL sudah berjalan)

---

## 1. Setup Database PostgreSQL

Aplikasi ini menggunakan PostgreSQL. Anda harus membuat database kosong terlebih dahulu sebelum menjalankan aplikasi.

1. Buka aplikasi manajemen PostgreSQL Anda (misalnya **pgAdmin**, **DBeaver**, atau `psql` lewat terminal).
2. Buat database baru dengan nama `cinemaxx`.
   *(Atau jalankan perintah SQL ini: `CREATE DATABASE cinemaxx;`)*
3. Karena *file* konfigurasi database (`backend/database.py`) disembunyikan agar kredensial Anda aman, Anda harus membuat *file* tersebut secara manual.
4. Di dalam folder `backend/`, gandakan (copy) *file* `database.example.py` dan ubah namanya menjadi `database.py`.
5. Buka `database.py` dan sesuaikan *username*, *password*, serta nama database dengan konfigurasi PostgreSQL di komputer Anda.

---

## 2. Setup Backend (Python/FastAPI)

Ikuti langkah-langkah berikut secara berurutan melalui terminal (Command Prompt / PowerShell / Git Bash):

### A. Masuk ke folder backend
```bash
cd backend
```

### B. Buat Virtual Environment (venv) baru
Meskipun mungkin ada folder `venv` bawaan yang tidak sengaja ter-push ke *repository*, sebaiknya Anda menimpanya atau membuat ulang agar sesuai dengan sistem komputer Anda:
```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

### C. Aktifkan Virtual Environment
Anda harus mengaktifkan `venv` setiap kali ingin menginstal *library* atau menjalankan *backend*.
```bash
# Windows (PowerShell)
.\venv\Scripts\activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Mac/Linux
source venv/bin/activate
```
*(Ciri `venv` sudah aktif: akan muncul tulisan `(venv)` di awal baris terminal Anda).*

### D. Install Library (Dependencies)
Setelah `venv` aktif, instal semua paket yang dibutuhkan:
```bash
pip install -r requirements.txt
```

### E. Migrasi atau Seed Database
Bergantung pada kondisi database Anda, jalankan salah satu perintah berikut:

- **Jika database Anda benar-benar baru dan kosong:**
  Jalankan perintah ini untuk membuat semua tabel sekaligus mengisinya dengan data tiruan (seperti daftar film dan akun admin):
  ```bash
  python seed_db.py
  ```

- **Jika Anda menggunakan database versi lama (tapi sudah ada datanya):**
  Untuk mencegah *website* mengalami *error* karena kehilangan kolom (misal kolom `genre`, `rating` belum ada), jalankan perintah ini untuk menyuntikkan kolom baru secara aman:
  ```bash
  python migrate_db.py
  ```

### F. Jalankan Server Backend
```bash
uvicorn main:app --reload
```
Server backend akan berjalan di `http://127.0.0.1:8000`. Biarkan terminal ini tetap terbuka!

---

## 3. Setup Frontend (React/Vite)

Buka **Terminal Baru** (jangan tutup terminal backend), lalu ikuti langkah ini:

### A. Pastikan berada di root folder (bukan di dalam backend)
Jika terminal baru terbuka di folder utama proyek (`cinemaxxx`), Anda bisa langsung lanjut. Jika ada di dalam folder `backend`, kembali ke luar dengan:
```bash
cd ..
```

### B. Install Node Modules
Instal semua dependensi React/Frontend:
```bash
npm install
```

### C. Jalankan Server Frontend
```bash
npm run dev
```
Server frontend (aplikasi utama) biasanya akan berjalan di `http://localhost:5173`. Buka URL tersebut di browser (Chrome/Edge/Safari) Anda.

---

## 4. Akun Default untuk Login

Karena Anda sudah menjalankan `seed_db.py`, berikut adalah akun yang bisa Anda gunakan untuk masuk (login) ke aplikasi:

**Akun Admin:**
- **Email:** `admin@cinemaxx.com`
- **Password:** `admin123`

**Akun Customer:**
- **Email:** `budi@example.com`
- **Password:** `password123`

---
Selamat! Aplikasi CineMaxxx sudah siap digunakan.
