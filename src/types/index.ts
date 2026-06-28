export interface User {
  id: number;
  nama: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface Movie {
  id: number;
  judul: string;
  durasi_menit: number;
  sinopsis: string;
  poster_url?: string; // Menyimpan URL poster setelah di-upload
}

export interface Studio {
  id: number;
  nama_studio: string;
}

export interface Seat {
  id: number;
  studio_id: number;
  nomor_kursi: string;
}

export interface Show {
  id: number;
  movie_id: number;
  studio_id: number;
  jam_tayang: string; // ISO 8601 string
  harga: number;
  
  // Optional relations that might be joined by backend
  movie?: Movie;
  studio?: Studio;
}

export interface SeatAvailability {
  seat_id: number;
  nomor_kursi: string;
  is_booked: boolean;
}

export interface Booking {
  id: number;
  user_id: number;
  show_id: number;
  total_harga: number;
  status_pembayaran: string; // e.g., 'PENDING', 'PAID', 'FAILED'
  
  // Optional relations
  show?: Show;
  details?: BookingDetail[];
}

export interface BookingDetail {
  id: number;
  booking_id: number;
  seat_id: number;
  seat?: Seat;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}
