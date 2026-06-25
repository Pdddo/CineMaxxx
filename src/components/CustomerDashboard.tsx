import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { formatRupiah } from '../lib/utils';
import { MonitorPlay, Clock, MapPin, Ticket, ChevronLeft, CreditCard, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Show, SeatAvailability } from '../types';

export default function CustomerDashboard() {
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  useEffect(() => {
    fetchApi('/shows')
      .then(data => setShows(data))
      .catch(console.error);
  }, []);

  if (selectedShow) {
    return (
      <SeatSelection
        show={selectedShow}
        onBack={() => setSelectedShow(null)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Now Showing</h2>
        <p className="text-gray-500 text-lg">Book your favorite movies playing in our premium studios.</p>
      </div>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <MonitorPlay className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-1">No Shows Available</h3>
          <p className="text-gray-500">Check back later for new movies and showtimes.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {shows.map((show) => (
            <motion.div
              whileHover={{ y: -4 }}
              key={show.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <FilmIcon className="w-6 h-6 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                {show.movie_judul}
              </h3>
              
              <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-grow">
                {show.sinopsis || "No synopsis available."}
              </p>

              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{show.durasi_menit} Minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{show.nama_studio}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MonitorPlay className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-blue-600">
                    {new Date(show.jam_tayang).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedShow(show)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors mt-auto"
              >
                <Ticket className="w-5 h-5" />
                Select Seats
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilmIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18" />
      <path d="M17 3v18" />
      <path d="M3 7h18" />
      <path d="M3 12h18" />
      <path d="M3 17h18" />
    </svg>
  );
}

interface SeatSelectionProps {
  show: Show;
  onBack: () => void;
}

function SeatSelection({ show, onBack }: SeatSelectionProps) {
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [bookingId, setBookingId] = useState<number | null>(null);

  const TICKET_PRICE = 50000;

  useEffect(() => {
    fetchApi(`/shows/${show.id}/seats`)
      .then(data => {
        setSeats(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [show.id]);

  const toggleSeat = (seatId: number) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleBooking = async () => {
    try {
      const total_harga = selectedSeats.length * TICKET_PRICE;
      const data = await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({ show_id: show.id, seat_ids: selectedSeats, total_harga })
      });
      setBookingId(data.id);
      setStep('payment');
    } catch (err: any) {
      alert(err.message || 'Failed to book seats');
    }
  };

  const handlePayment = async () => {
    try {
      await fetchApi('/payments/process', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, status: 'success' })
      });
      setStep('success');
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-xl text-gray-500 mb-8 max-w-md text-center">
          Your tickets for <span className="font-semibold text-gray-900">{show.movie_judul}</span> have been confirmed.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition shadow-lg"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold mb-8">Checkout</h2>
        
        <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Movie</span>
            <span className="font-bold text-gray-900 text-right">{show.movie_judul}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Seats ({selectedSeats.length})</span>
            <span className="font-bold text-gray-900 text-right">
              {selectedSeats.map(id => seats.find(s => s.seat_id === id)?.nomor_kursi).join(', ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-900 font-bold">Total Payment</span>
            <span className="font-bold text-blue-600">{formatRupiah(selectedSeats.length * TICKET_PRICE)}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/30"
        >
          <CreditCard className="w-6 h-6" />
          Pay Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Shows
      </button>

      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">{show.movie_judul}</h2>
        <p className="text-gray-500 text-lg">{show.nama_studio} • {new Date(show.jam_tayang).toLocaleString()}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="w-full h-12 bg-gradient-to-b from-gray-200 to-transparent rounded-t-3xl mb-16 flex items-center justify-center text-gray-400 font-bold tracking-widest uppercase text-sm">
              Screen
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-4 justify-center">
                {seats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seat_id);
                  return (
                    <button
                      key={seat.seat_id}
                      disabled={seat.is_booked}
                      onClick={() => toggleSeat(seat.seat_id)}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all
                        ${seat.is_booked 
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200' 
                          : isSelected 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110' 
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}
                      `}
                    >
                      {seat.nomor_kursi}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center gap-8 mt-12 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-200 rounded-md"></div>
                <span className="text-sm text-gray-500 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
                <span className="text-sm text-gray-500 font-medium">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded-md"></div>
                <span className="text-sm text-gray-500 font-medium">Booked</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
          <h3 className="text-2xl font-bold mb-6">Booking Summary</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-600">
              <span>Ticket Price</span>
              <span className="font-medium">{formatRupiah(TICKET_PRICE)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Seats Selected</span>
              <span className="font-bold text-gray-900">{selectedSeats.length}</span>
            </div>
            {selectedSeats.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(id => {
                    const seat = seats.find(s => s.seat_id === id);
                    return (
                      <span key={id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">
                        {seat?.nomor_kursi}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-200 mb-8">
            <div className="flex justify-between items-end">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-3xl font-extrabold text-gray-900">
                {formatRupiah(selectedSeats.length * TICKET_PRICE)}
              </span>
            </div>
          </div>

          <button
            disabled={selectedSeats.length === 0}
            onClick={handleBooking}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
          >
            Continue to Payment
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
