export interface User {
  id: number;
  nama: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface Movie {
  id: number;
  judul: string;
  durasi_menit: number;
  sinopsis: string;
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
  jam_tayang: string;
  movie_judul?: string;
  durasi_menit?: number;
  sinopsis?: string;
  nama_studio?: string;
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
  status_pembayaran: string;
}