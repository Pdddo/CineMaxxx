import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import type { Booking } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Ticket, Calendar, Clock, Film } from 'lucide-react';
import { motion } from 'motion/react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await apiFetch<Booking[]>('/api/user/bookings');
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat riwayat pemesanan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Halo, {user?.nama}!</h1>
        <p className="text-slate-400">Email: {user?.email}</p>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
        Riwayat Pemesanan Tiket
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8">
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <GlassCard className="p-12 text-center">
          <Ticket className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Anda belum memiliki riwayat pemesanan.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-4 border-l-purple-500">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Film className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {booking.show?.movie?.judul || 'Movie Title'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {booking.show?.studio?.nama_studio || 'Studio Name'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-md">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>
                        {booking.show?.jam_tayang ? new Date(booking.show.jam_tayang).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-md">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>
                        {booking.show?.jam_tayang ? new Date(booking.show.jam_tayang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-md">
                      <Ticket className="w-4 h-4 text-purple-400" />
                      <span>
                        {booking.details?.length || 0} Tiket (Kursi: {booking.details?.map(d => d.seat?.nomor_kursi).join(', ')})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[150px]">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${booking.status_pembayaran === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      booking.status_pembayaran === 'FAILED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}
                  >
                    {booking.status_pembayaran}
                  </span>
                  <p className="text-xl font-bold text-white mt-2">
                    Rp {booking.total_harga.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Booking ID: #{booking.id}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
