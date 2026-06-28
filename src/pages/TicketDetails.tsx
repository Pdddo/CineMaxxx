import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { apiFetch } from '../utils/api';
import type { Booking } from '../types';

export const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await apiFetch<Booking>(`/api/user/bookings/${id}`);
        setBooking(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail tiket.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchTicket();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4 tracking-widest uppercase text-center">Ticket Not Found</h2>
        <p className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/50 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/tickets')}
          className="bg-white text-black px-8 py-3 font-bold text-sm tracking-widest hover:bg-gray-200 transition-colors"
        >
          BACK TO TICKETS
        </button>
      </div>
    );
  }

  const seats = booking.details?.map(d => d.seat?.nomor_kursi).join(', ') || 'N/A';
  const showDate = new Date(booking.show?.jam_tayang || '').toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const showTime = new Date(booking.show?.jam_tayang || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const validationCode = `TRX-${8900 + booking.id}-${booking.user_id}`;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center pt-12 md:pt-20">
      
      <button 
        onClick={() => navigate('/tickets')}
        className="text-[#FF6900] font-bold text-lg tracking-widest hover:text-white transition-colors self-start max-w-lg mx-auto w-full mb-6"
      >
        &lt;&lt; BACK
      </button>

      <div className="bg-stone-900 border border-white/20 w-full max-w-lg shadow-2xl overflow-hidden rounded-sm relative">
        {/* Ticket Header Image */}
        {booking.show?.movie?.poster_url ? (
           <div className="h-48 w-full relative">
             <img src={booking.show.movie.poster_url} alt={booking.show.movie.judul} className="w-full h-full object-cover opacity-60" />
             <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
           </div>
        ) : (
           <div className="h-32 w-full bg-slate-800"></div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-4 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${booking.status_pembayaran === 'paid' ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-white'}`}>
            {booking.status_pembayaran}
          </span>
        </div>

        <div className="p-8 -mt-12 relative z-10">
          <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2 leading-tight">
            {booking.show?.movie?.judul}
          </h1>
          
          <div className="grid grid-cols-2 gap-y-6 mt-8 border-t border-white/10 pt-6">
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Date</p>
              <p className="font-medium text-lg">{showDate}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Time</p>
              <p className="font-medium text-lg">{showTime}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Location</p>
              <p className="font-medium text-lg text-[#FF6900]">{booking.show?.studio?.nama_studio}</p>
            </div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Seats</p>
              <p className="font-medium text-lg">{seats}</p>
            </div>
          </div>
        </div>

        {/* Tear line */}
        <div className="relative flex items-center justify-between px-[-10px]">
           <div className="w-5 h-5 rounded-full bg-black -ml-2.5"></div>
           <div className="h-px border-t-2 border-dashed border-white/20 flex-1"></div>
           <div className="w-5 h-5 rounded-full bg-black -mr-2.5"></div>
        </div>

        {/* QR Code Section */}
        <div className="p-8 flex flex-col items-center bg-stone-900 pb-12">
           <p className="text-stone-500 text-sm font-light mb-6 text-center">Tunjukkan QR Code ini kepada petugas bioskop sebelum masuk.</p>
           <div className="bg-white p-4 rounded-xl">
             <QRCode value={validationCode} size={160} level="H" />
           </div>
           <p className="mt-4 font-mono text-xl tracking-[0.2em] text-white/80">{validationCode}</p>
        </div>
      </div>
    </div>
  );
};
