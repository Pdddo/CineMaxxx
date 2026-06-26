import React, { useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Show, Booking } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Ticket } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutState {
  selectedSeatIds: number[];
  show: Show;
}

export const Checkout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState | undefined;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  if (!state || !state.show || !state.selectedSeatIds) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <GlassCard className="p-8 max-w-md mx-auto">
          <p className="text-slate-300 mb-6">Data pesanan tidak ditemukan. Silakan ulangi pemilihan kursi.</p>
          <Link to="/">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const { selectedSeatIds, show } = state;
  const totalHarga = selectedSeatIds.length * show.harga;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // 1. Create Booking
      const bookingData = await apiFetch<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          show_id: Number(id),
          seat_ids: selectedSeatIds,
          total_harga: totalHarga
        })
      });

      // 2. Process Payment Simulation
      await apiFetch('/api/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingData.id,
          status: 'PAID'
        })
      });

      setBooking(bookingData);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses pembayaran. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <GlassCard className="p-10 max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Pembayaran Berhasil!</h1>
            <p className="text-slate-400 mb-8">Tiket Anda telah berhasil dicetak.</p>
            
            <div className="bg-slate-900/50 rounded-lg p-4 mb-8 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-1">Booking ID</p>
              <p className="font-mono text-xl text-purple-400 font-bold">#{booking?.id || '---'}</p>
            </div>

            <Button onClick={() => navigate('/profile')} className="w-full h-12 text-lg">
              Lihat Tiket Saya
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Ticket className="w-8 h-8 text-purple-400" />
        Checkout Pembayaran
      </h1>

      <GlassCard className="p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-between items-start pb-6 border-b border-white/10">
            <div>
              <p className="text-sm text-slate-400 mb-1">Film</p>
              <p className="text-xl font-bold text-white">{show.movie?.judul || 'Movie Title'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-1">Studio</p>
              <p className="text-lg font-semibold text-white">{show.studio?.nama_studio}</p>
            </div>
          </div>

          <div className="pb-6 border-b border-white/10">
            <p className="text-sm text-slate-400 mb-2">Detail Tiket</p>
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-lg">
              <div>
                <p className="font-medium text-white">{selectedSeatIds.length}x Tiket Nonton</p>
                <p className="text-sm text-purple-400 mt-1">
                  Rp {show.harga.toLocaleString('id-ID')} / tiket
                </p>
              </div>
              <p className="font-bold text-white">
                Rp {totalHarga.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center text-xl font-bold mb-8">
              <p className="text-white">Total Pembayaran</p>
              <p className="text-purple-400">Rp {totalHarga.toLocaleString('id-ID')}</p>
            </div>

            <Button 
              className="w-full h-14 text-lg" 
              isLoading={isProcessing}
              onClick={handlePayment}
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
