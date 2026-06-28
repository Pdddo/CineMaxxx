import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Show, SeatAvailability } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { QrCode, CheckCircle2, AlertCircle, Film, Calendar, MapPin, Ticket, ShieldCheck, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!show || selectedSeatIds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <GlassCard className="p-8 border-red-500/30">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Belum Ada Kursi Dipilih</h2>
          <p className="text-slate-400 mb-6">
            Silakan pilih jadwal dan kursi terlebih dahulu sebelum melanjutkan ke halaman pembayaran.
          </p>
          <Button onClick={() => navigate(id ? `/show/${id}` : '/')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2 inline" /> Kembali Pilih Kursi
          </Button>
        </GlassCard>
      </div>
    );
  }

  const selectedSeatNumbers = seats
    .filter(s => selectedSeatIds.includes(s.seat.id))
    .map(s => s.seat.nomor_kursi);

  const totalPrice = selectedSeatIds.length * show.harga;

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
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses pembayaran. Kursi mungkin sudah dipesan orang lain.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <GlassCard className="p-8 text-center relative overflow-hidden border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Pembayaran Berhasil
          </span>

          <h1 className="text-3xl font-bold text-white mb-2">Tiket Terbit!</h1>
          <p className="text-slate-300 text-sm mb-8">
            Terima kasih telah memesan tiket di <span className="text-[#FF6900] font-semibold">CineMaxxx</span>. Tiket elektronik Anda sudah aktif.
          </p>

          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-5 text-left mb-8 space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
              <span className="text-slate-400">Kode Booking</span>
              <span className="font-mono font-bold text-purple-400 text-base">#CMX-{bookingResult?.id || 'OK'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Film</span>
              <span className="font-semibold text-white truncate max-w-[200px]">{show.movie.judul}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Studio & Kursi</span>
              <span className="font-semibold text-emerald-400">
                {show.studio?.nama_studio || `Studio #${show.studio_id}`} ({selectedSeatNumbers.join(', ') || selectedSeatIds.join(', ')})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
              <span className="text-slate-400">Total Dibayar</span>
              <span className="font-bold text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to={`/show/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Pilih Kursi
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-purple-400" /> Konfirmasi & Pembayaran
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 animate-shake">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-4">
              <Ticket className="w-5 h-5 text-purple-400" /> Ringkasan Pesanan
            </h2>

            <div className="flex gap-4 items-start mb-6">
              {show.movie.poster_url ? (
                <img src={show.movie.poster_url} alt={show.movie.judul} className="w-24 h-36 object-cover rounded-lg shadow-md border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-24 h-36 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Film className="w-8 h-8 text-slate-600" />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <h3 className="text-2xl font-bold text-white leading-tight">{show.movie.judul}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{show.studio?.nama_studio || `Studio #${show.studio_id}`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>
                    {new Date(show.jam_tayang).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(show.jam_tayang).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Harga Tiket</span>
                <span className="text-slate-200">Rp {show.harga.toLocaleString('id-ID')} x {selectedSeatIds.length} kursi</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Nomor Kursi</span>
                <span className="font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                  {selectedSeatNumbers.join(', ') || selectedSeatIds.join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
                <span className="text-slate-400">Biaya Layanan & QRIS</span>
                <span className="text-emerald-400 font-medium">GRATIS</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
              <div>
                <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Pembayaran</span>
                <span className="text-3xl font-extrabold text-white">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
                Instant Confirmation
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: QR Payment */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 border-purple-500/30 text-center relative overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-center gap-2 text-purple-400 font-bold text-lg mb-2">
              <QrCode className="w-6 h-6" /> Scan QRIS Pembayaran
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Mendukung semua aplikasi e-Wallet (Gopay, OVO, Dana, ShopeePay) dan Mobile Banking.
            </p>

            {/* QR Image Container */}
            <div className="bg-white p-4 rounded-2xl shadow-2xl inline-block mb-6 border-4 border-purple-500/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/d23306ff4dcc129c4742f50175614047ae7a0661.png"
                alt="QRIS CineMaxxx"
                className="w-56 h-56 object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 mb-6 text-left">
              <p className="text-xs text-purple-300 leading-relaxed font-medium">
                💡 <strong className="text-white">Cara Bayar:</strong> Buka aplikasi m-Banking atau e-Wallet Anda, pilih fitur Scan QR/QRIS, lalu arahkan kamera ke kode QR di atas.
              </p>
            </div>

            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" /> Memverifikasi Pembayaran...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2 inline" /> Saya Sudah Bayar
                </>
              )}
            </Button>
            
            <p className="text-[11px] text-slate-500 mt-3">
              Klik tombol di atas setelah Anda berhasil melakukan transfer via QRIS.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
