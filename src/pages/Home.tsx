import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Movie, Show } from '../types';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  // Sort movies so that those with active schedules (shows) appear first
  const displayMovies = [...movies].sort((a, b) => {
    const aHasShows = shows.some(s => s.movie_id === a.id);
    const bHasShows = shows.some(s => s.movie_id === b.id);
    if (aHasShows && !bHasShows) return -1;
    if (!aHasShows && bHasShows) return 1;
    return 0;
  });
  const totalPages = Math.ceil(displayMovies.length / itemsPerPage);

  const currentMovies = displayMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-black text-white pb-12 pt-8 font-sans">
      <div className="max-w-6xl mx-auto px-4">

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 text-center">
            {error}
          </div>
        )}

        {/* Promotional Banners */}
        <div className="mb-14">
          <h2 className="text-lg font-bold text-slate-300 mb-4 tracking-wider uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6900]"></span> Spesial Promo & Event
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer aspect-[21/9]">
              <img src="/poster_promosi1.png" alt="Promo 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-sm font-semibold text-[#FF6900] bg-black/80 px-3 py-1 rounded-full border border-[#FF6900]/30">Lihat Promo</span>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer aspect-[21/9]">
              <img src="/poster_promosi2.png" alt="Promo 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-sm font-semibold text-[#FF6900] bg-black/80 px-3 py-1 rounded-full border border-[#FF6900]/30">Lihat Promo</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-8">All Shows</h2>

        {displayMovies.length === 0 && !error ? (
          <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
            <p className="text-lg">Belum ada film tayang saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-12">
            {currentMovies.map((movie, idx) => {
              const movieShows = shows.filter(s => s.movie_id === movie.id);
              const posterSrc = movie.poster_url;

              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-slate-900 shadow-lg">
                    {movie.poster_url ? (
                      <img
                        src={posterSrc}
                        alt={movie.judul}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                        <span className="text-xl font-bold text-slate-500 mb-2">{movie.judul}</span>
                        <span className="text-sm">No Poster</span>
                      </div>
                    )}

                    {/* Info badge */}
                    <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>

                  <Link
                    to={movieShows.length > 0 ? `/movie/${movie.id}` : `#`}
                    className={`mt-4 w-full h-10 flex items-center justify-center rounded-sm font-bold text-black transition-colors ${movieShows.length > 0 ? 'bg-[#FF6900] hover:bg-[#e55e00]' : 'bg-slate-600 cursor-not-allowed'
                      }`}
                    onClick={(e) => {
                      if (movieShows.length === 0) e.preventDefault();
                    }}
                  >
                    {movieShows.length > 0 ? 'BUY NOW' : 'COMING SOON'}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Functional */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-16 mb-16 text-slate-400 font-medium tracking-widest text-sm">
            <span
              className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              &lt;
            </span>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <span
                key={page}
                className={`cursor-pointer ${currentPage === page ? 'text-[#FF6900] font-bold border-b-2 border-[#FF6900]' : 'hover:text-white'}`}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {page}
              </span>
            ))}

            <span
              className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              &gt;
            </span>
          </div>
        )}

        {/* Seating Experience Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8">
            Seating<br />Experience
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80" alt="Seat Type 1" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=600&q=80" alt="Seat Type 2" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/3] bg-slate-800 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80" alt="Seat Type 3" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
