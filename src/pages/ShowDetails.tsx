import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Show, SeatAvailability } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ScreenShare, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const ShowDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Since prompt didn't specify GET /api/shows/{id}, we fetch all and find
        const showsData = await apiFetch<Show[]>('/api/shows', { requireAuth: false });
        const currentShow = showsData.find(s => s.id === Number(id));
        
        if (!currentShow) {
          throw new Error('Jadwal tayang tidak ditemukan');
        }
        setShow(currentShow);

        // Fetch seat availability
        const seatsData = await apiFetch<SeatAvailability[]>(`/api/shows/${id}/seats`);
        setSeats(seatsData);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data kursi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSeatClick = (seatId: number, isBooked: boolean) => {
    if (isBooked) return;
    
    setSelectedSeatIds(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedSeatIds.length === 0) return;
    // We pass state to the checkout page using React Router's state navigation
    navigate(`/checkout/${id}`, { state: { selectedSeatIds, show } });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl inline-block">
          {error}
        </div>
      </div>
    );
  }

  const totalPrice = selectedSeatIds.length * show.harga;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Seat Map */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8">
            <h2 className="text-2xl font-bold mb-8 text-center text-white flex items-center justify-center gap-2">
              <ScreenShare className="w-6 h-6 text-purple-400" />
              Pilih Kursi Anda
            </h2>

            {/* Screen indicator */}
            <div className="w-full h-12 bg-gradient-to-t from-purple-500/20 to-transparent border-t-2 border-purple-500/50 rounded-t-[50%] mb-12 relative overflow-hidden">
               <div className="absolute inset-0 flex items-end justify-center pb-2 text-sm text-purple-300 font-medium tracking-[0.5em]">LAYAR BIOSKOP</div>
            </div>

            {/* Seat Grid */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
              {seats.map(({ seat, is_booked }) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                return (
                  <motion.button
                    whileHover={!is_booked ? { scale: 1.1 } : {}}
                    whileTap={!is_booked ? { scale: 0.9 } : {}}
                    key={seat.id}
                    disabled={is_booked}
                    onClick={() => handleSeatClick(seat.id, is_booked)}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-t-lg rounded-b-sm font-semibold text-xs transition-colors flex items-center justify-center border-b-4
                      ${is_booked 
                        ? 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-purple-500 text-white border-purple-700 shadow-[0_0_10px_rgba(147,51,234,0.5)]' 
                          : 'bg-slate-700 text-slate-300 border-slate-800 hover:bg-slate-600 cursor-pointer'}
                    `}
                  >
                    {seat.nomor_kursi}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-12 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-700 border-b-4 border-slate-800"></div>
                <span>Tersedia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500 border-b-4 border-purple-700 shadow-[0_0_10px_rgba(147,51,234,0.5)]"></div>
                <span>Dipilih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-800 border-b-4 border-slate-900"></div>
                <span>Terisi</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-4">Ringkasan Pesanan</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-400">Film</p>
                <p className="font-semibold text-white">{show.movie?.judul || `Movie #${show.movie_id}`}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Jadwal Tayang</p>
                <p className="font-semibold text-white">
                  {new Date(show.jam_tayang).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Studio</p>
                <p className="font-semibold text-white">{show.studio?.nama_studio || `Studio #${show.studio_id}`}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-300">Kursi Dipilih ({selectedSeatIds.length})</p>
                <p className="font-medium text-purple-400">
                  {seats.filter(s => selectedSeatIds.includes(s.seat.id)).map(s => s.seat.nomor_kursi).join(', ') || '-'}
                </p>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <p className="text-white">Total Bayar</p>
                <p className="text-purple-400">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {selectedSeatIds.length === 0 && (
              <div className="flex items-start gap-2 text-sm text-slate-400 mb-4 bg-slate-800/50 p-3 rounded-lg">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p>Silakan pilih setidaknya satu kursi untuk melanjutkan ke pembayaran.</p>
              </div>
            )}

            <Button 
              className="w-full text-lg h-14" 
              disabled={selectedSeatIds.length === 0}
              onClick={handleProceedToCheckout}
            >
              Lanjut Pembayaran
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
