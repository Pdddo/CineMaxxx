import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Show, SeatAvailability } from '../types';

export const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { selectedSeatIds?: number[]; show?: Show; seats?: SeatAvailability[] } | null;
  const [show, setShow] = useState<Show | null>(state?.show || null);
  const [seats, setSeats] = useState<SeatAvailability[]>(state?.seats || []);
  const selectedSeatIds = state?.selectedSeatIds || [];

  const [isLoadingData, setIsLoadingData] = useState(!state?.show);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMissingData = async () => {
      if (!id) return;
      try {
        if (!show) {
          const showsData = await apiFetch<Show[]>('/api/shows', { requireAuth: false });
          const currentShow = showsData.find(s => s.id === Number(id));
          if (currentShow) setShow(currentShow);
        }
        if (seats.length === 0) {
          const seatsData = await apiFetch<SeatAvailability[]>(`/api/shows/${id}/seats`);
          setSeats(seatsData);
        }
      } catch (err: any) {
        console.error('Failed to load missing show data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!show || seats.length === 0) {
      fetchMissingData();
    } else {
      setIsLoadingData(false);
    }
  }, [id, show, seats.length]);

  if (isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  if (!show || selectedSeatIds.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4 tracking-widest uppercase">No Seats Selected</h2>
        <button 
          onClick={() => navigate(id ? `/show/${id}` : '/')}
          className="bg-white text-black px-8 py-3 font-bold text-sm tracking-widest"
        >
          GO BACK
        </button>
      </div>
    );
  }

  const selectedSeatNumbers = seats
    .filter(s => selectedSeatIds.includes(s.seat_id))
    .map(s => s.nomor_kursi);

  const totalPrice = selectedSeatIds.length * (show.harga || 50000);

  // Formatting Date "02 July 2023"
  const d = new Date(show.jam_tayang);
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  // Formatting Time "10.30pm"
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours}.${minutes}${ampm}`;

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // 1. Create Booking
      const bookingPayload = {
        show_id: show.id,
        seat_ids: selectedSeatIds,
        total_harga: totalPrice,
      };

      const createdBooking = await apiFetch<any>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingPayload),
      });

      // 2. Process Payment (QRIS Simulation)
      const paymentPayload = {
        booking_id: createdBooking.id,
        status: 'success',
      };

      await apiFetch('/api/payments/process', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      });

      setBookingResult(createdBooking);
      setShowQRModal(false);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses pembayaran. Kursi mungkin sudah dipesan orang lain.');
      setShowQRModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border border-white/20 p-12 text-center max-w-lg w-full">
          <div className="w-16 h-16 border-2 border-white rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-widest uppercase">Payment Success</h1>
          <p className="text-stone-400 mb-8 font-light tracking-wide">
            Your booking #{bookingResult?.id || 'OK'} has been confirmed.
          </p>
          <div className="space-y-4 mb-10 text-left border-y border-white/20 py-6">
             <div className="flex justify-between text-stone-300 font-light">
               <span>Movie</span>
               <span className="text-white uppercase tracking-wider">{show.movie?.judul}</span>
             </div>
             <div className="flex justify-between text-stone-300 font-light">
               <span>Seating</span>
               <span className="text-white">{selectedSeatNumbers.join(', ')}</span>
             </div>
          </div>
          <Link to="/">
            <button className="bg-white text-black px-12 py-3 font-bold text-sm tracking-widest w-full hover:bg-gray-200 transition-colors">
              BACK TO HOME
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans py-12 px-6 lg:px-24">
      {error && (
        <div className="max-w-5xl mx-auto mb-8 border border-red-500/50 bg-red-500/10 text-red-400 p-4 text-center font-light tracking-wide">
          {error}
        </div>
      )}

      {/* Top Section: Movie Info */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-24 mb-16">
        {show.movie?.poster_url ? (
          <img 
            src={show.movie.poster_url} 
            alt={show.movie.judul} 
            className="w-full md:w-[280px] h-auto object-cover border border-white/10" 
          />
        ) : (
          <div className="w-full md:w-[280px] h-[400px] bg-stone-900 border border-white/10 flex items-center justify-center">
            NO POSTER
          </div>
        )}
        
        <div className="flex-1 py-4">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] mb-12 text-white/90">
            {show.movie?.judul || 'MOVIE TITLE'}
          </h1>
          
          <div className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] gap-y-6 text-xl text-stone-300 font-light">
            <span>Date</span>
            <span className="text-white">: {formattedDate}</span>
            
            <span>Location</span>
            <span className="text-white">: {show.studio?.nama_studio || `Studio #${show.studio_id}`}</span>
            
            <span>Type</span>
            <span className="text-white">: Deluxe</span>
            
            <span>Time</span>
            <span className="text-white">: {formattedTime}</span>
            
            <span>Seating</span>
            <span className="text-white">: {selectedSeatNumbers.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Summary Table */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 text-center border-y border-white/40 py-3 text-xl text-stone-300 font-light tracking-wider">
          <div>Quantity</div>
          <div>Total</div>
        </div>
        
        <div className="grid grid-cols-2 text-center py-8 text-3xl font-light text-white/90">
          <div>{selectedSeatIds.length}</div>
          <div>{totalPrice.toLocaleString('id-ID')}</div>
        </div>

        <div className="grid grid-cols-2 mt-2">
          <div></div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <span className="text-xl text-stone-300 font-light tracking-wide">Grand Total</span>
            <span className="text-2xl font-light border-y border-white/60 py-2 min-w-[200px] text-center">
              RP {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Payment Methods & Actions */}
      <div className="max-w-5xl mx-auto mt-24 flex flex-col md:flex-row justify-between items-end gap-12">
        
        {/* Payment Methods Box */}
        <div className="border border-white/30 p-8 w-full md:w-[340px] space-y-8 bg-black/50">
          {/* Disabled options as per user request to only show QRIS, or just show QRIS alone. User said "cukup tampilkan qris saja", so I will ONLY show QRIS. */}
          <label className="flex items-center gap-6 cursor-pointer">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-white">
              <div className="w-3 h-3 rounded-full bg-[#4285F4]"></div>
            </div>
            <span className="text-2xl font-light tracking-wide">QRIS</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 w-full md:w-auto">
          <button 
            onClick={() => navigate(`/show/${id}`)}
            className="flex-1 md:flex-none bg-white text-black px-10 py-3 text-sm font-bold tracking-widest hover:bg-gray-200 transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={() => setShowQRModal(true)}
            className="flex-1 md:flex-none bg-white text-black px-10 py-3 text-sm font-bold tracking-widest hover:bg-gray-200 transition-colors"
          >
            CONFIRM
          </button>
        </div>
      </div>

      {/* Temporary QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-white/20 p-10 max-w-sm w-full text-center relative shadow-2xl">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-6 text-white/50 hover:text-white text-2xl font-light"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold tracking-widest uppercase mb-2">Scan to Pay</h3>
            <p className="text-stone-400 font-light text-sm mb-8">Scan this QR Code using your e-Wallet app</p>
            
            <div className="bg-white p-4 mx-auto mb-8 w-48 h-48 flex items-center justify-center">
              <img src="/d23306ff4dcc129c4742f50175614047ae7a0661.png" alt="QR Code" className="max-w-full max-h-full opacity-80 mix-blend-multiply" />
            </div>

            <button 
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="bg-white text-black w-full py-4 text-sm font-bold tracking-widest disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'PROCESSING...' : 'SIMULATE SUCCESS'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
