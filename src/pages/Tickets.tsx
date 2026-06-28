import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { Booking } from '../types';

export const Tickets: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await apiFetch<Booking[]>('/api/user/bookings');
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat tiket.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FF6900] mb-8 uppercase tracking-widest border-b border-white/20 pb-4">My Tickets</h1>
        
        {error ? (
          <div className="text-red-500 bg-red-500/10 p-4 border border-red-500/50">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-lg">Anda belum memiliki tiket aktif.</div>
        ) : (
          <div className="space-y-6">
            {bookings.map(booking => (
              <div key={booking.id} className="border border-white/20 p-6 flex flex-col md:flex-row gap-6 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                {booking.show?.movie?.poster_url ? (
                  <img src={booking.show.movie.poster_url} alt="Poster" className="w-24 h-36 object-cover" />
                ) : (
                  <div className="w-24 h-36 bg-slate-800 flex items-center justify-center text-xs text-center text-slate-500">No Poster</div>
                )}
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">{booking.show?.movie?.judul || 'Unknown Movie'}</h2>
                    <p className="text-stone-300 font-light mb-1">
                      <span className="text-[#FF6900] mr-2">Time:</span> 
                      {booking.show ? new Date(booking.show.jam_tayang).toLocaleString('id-ID') : '-'}
                    </p>
                    <p className="text-stone-300 font-light mb-1">
                      <span className="text-[#FF6900] mr-2">Location:</span> 
                      {booking.show?.studio?.nama_studio || '-'}
                    </p>
                    <p className="text-stone-300 font-light">
                      <span className="text-[#FF6900] mr-2">Seats:</span> 
                      {booking.details?.map((d: any) => d.seat?.nomor_kursi).join(', ')}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-4">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${booking.status_pembayaran === 'paid' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'}`}>
                      {booking.status_pembayaran}
                    </span>
                    <span className="text-xl font-light tracking-widest">RP {booking.total_harga.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
