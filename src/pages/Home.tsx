import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Movie, Show } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Calendar, Clock, Ticket } from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesData, showsData] = await Promise.all([
          apiFetch<Movie[]>('/api/movies', { requireAuth: false }),
          apiFetch<Show[]>('/api/shows', { requireAuth: false })
        ]);
        setMovies(moviesData);
        setShows(showsData);
      } catch (err: any) {
        setError('Gagal memuat data. Server mungkin sedang offline.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  // Get active movies that have shows
  const moviesWithShows = movies.filter(movie => shows.some(show => show.movie_id === movie.id));

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Banner Section */}
      <div className="relative h-[60vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
           {moviesWithShows.length > 0 && moviesWithShows[0].poster_url ? (
             <img src={moviesWithShows[0].poster_url} alt="Hero" className="w-full h-full object-cover opacity-40 blur-sm" />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-slate-900/90"></div>
           )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10"></div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tighter mb-6"
          >
            PENGALAMAN SINEMA <br/> TANPA BATAS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-8"
          >
            Pesan tiket bioskop dengan mudah, cepat, dan nyaman. Rasakan sensasi antarmuka masa depan.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-30">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="w-2 h-8 bg-purple-500 rounded-full inline-block"></span>
          Sedang Tayang
        </h2>

        {moviesWithShows.length === 0 && !error ? (
          <GlassCard className="p-12 text-center text-slate-400">
            <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Belum ada jadwal tayang saat ini.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {moviesWithShows.map((movie, idx) => {
              const movieShows = shows.filter(s => s.movie_id === movie.id);
              
              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <GlassCard className="h-full flex flex-col overflow-hidden group">
                    <div className="relative aspect-[2/3] overflow-hidden bg-slate-800">
                      {movie.poster_url ? (
                        <img 
                          src={movie.poster_url} 
                          alt={movie.judul} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{movie.judul}</h3>
                        <div className="flex items-center gap-2 text-sm text-purple-300">
                          <Clock className="w-4 h-4" />
                          <span>{movie.durasi_menit} Menit</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                          {movie.sinopsis}
                        </p>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Jadwal Tersedia
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {movieShows.slice(0, 3).map(show => {
                              const time = new Date(show.jam_tayang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                              return (
                                <Link key={show.id} to={`/show/${show.id}`}>
                                  <span className="inline-block px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/40 border border-purple-500/30 transition-colors">
                                    {time}
                                  </span>
                                </Link>
                              );
                            })}
                            {movieShows.length > 3 && (
                               <span className="inline-block px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">+{movieShows.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link to={`/show/${movieShows[0]?.id}`} className="block mt-4">
                        <Button className="w-full group-hover:shadow-[0_0_20px_rgba(147,51,234,0.6)]">
                          Pesan Tiket
                        </Button>
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
