import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Movie, Show } from '../types';

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Selections
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesData, showsData] = await Promise.all([
          apiFetch<Movie[]>('/api/movies', { requireAuth: false }),
          apiFetch<Show[]>('/api/shows', { requireAuth: false })
        ]);
        
        const currentMovie = moviesData.find(m => m.id === Number(id));
        if (!currentMovie) throw new Error('Film tidak ditemukan');
        
        const movieShows = showsData.filter(s => s.movie_id === Number(id));
        
        setMovie(currentMovie);
        setShows(movieShows);

        // Auto select defaults based on available data
        if (movieShows.length > 0) {
           const dates = Array.from(new Set(movieShows.map(s => new Date(s.jam_tayang).toLocaleDateString('id-ID'))));
           if (dates.length > 0) setSelectedDate(dates[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-12 text-center bg-black min-h-screen text-white">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl inline-block">
          {error}
        </div>
      </div>
    );
  }

  // Generate options based on shows
  const availableDates = Array.from(new Set(shows.map(s => new Date(s.jam_tayang).toLocaleDateString('id-ID'))));
  
  // Filter shows by selected date
  const showsOnDate = shows.filter(s => new Date(s.jam_tayang).toLocaleDateString('id-ID') === selectedDate);
  const availableLocations = Array.from(new Set(showsOnDate.map(s => s.studio?.nama_studio.split(' (')[0] || `Studio ${s.studio_id}`)));
  
  // If selected location is not in available locations, reset it
  if (selectedLocation && !availableLocations.includes(selectedLocation)) setSelectedLocation('');
  
  // Filter by location
  const showsAtLocation = selectedLocation 
    ? showsOnDate.filter(s => (s.studio?.nama_studio.split(' (')[0] || `Studio ${s.studio_id}`) === selectedLocation)
    : showsOnDate;

  // Extract Types from Studio Names (e.g., "Studio 1 (IMAX)" -> "IMAX")
  const extractType = (nama: string) => {
    const match = nama.match(/\((.*?)\)/);
    return match ? match[1] : 'Regular';
  };
  const availableTypes = Array.from(new Set(showsAtLocation.map(s => extractType(s.studio?.nama_studio || ''))));
  
  if (selectedType && !availableTypes.includes(selectedType)) setSelectedType('');

  // Final filtered shows
  const finalShows = selectedType
    ? showsAtLocation.filter(s => extractType(s.studio?.nama_studio || '') === selectedType)
    : showsAtLocation;

  const handleBuyNow = () => {
    if (!selectedDate || !selectedLocation || !selectedType || !selectedShowId) {
      setFormError('Semua pilihan (Date, Location, Type, dan Time) harus diisi!');
      return;
    }
    setFormError('');
    navigate(`/show/${selectedShowId}`);
  };

  const posterSrc = movie.poster_url?.startsWith('/static') 
    ? `http://localhost:8000${movie.poster_url}` 
    : movie.poster_url;

  return (
    <div className="min-h-screen bg-black text-white font-sans pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Left Column */}
          <div className="flex flex-col">
            <button 
              onClick={() => navigate(-1)}
              className="text-[#FF6900] font-bold text-xl tracking-widest hover:text-white transition-colors self-start mb-6"
            >
              &lt;&lt; EXIT
            </button>
            <div className="w-full aspect-[2/3] md:aspect-[3/4] rounded-md overflow-hidden bg-slate-900 shadow-2xl relative">
               {posterSrc ? (
                 <img src={posterSrc} alt={movie.judul} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-600">No Poster</div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-6">
              {movie.judul}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 max-w-lg">
              {movie.sinopsis}
            </p>

            {/* Selection Form */}
            <div className="space-y-6 max-w-md text-lg">
              {/* Date */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-3 text-slate-300">Date</span>
                <span className="col-span-1 text-slate-300">:</span>
                <div className="col-span-8">
                  <select 
                    className="w-full bg-[#3d2616] text-[#FF6900] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#FF6900] appearance-none cursor-pointer outline-none font-medium"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedShowId(null);
                    }}
                  >
                    <option value="" disabled>Select Date</option>
                    {availableDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-3 text-slate-300">Location</span>
                <span className="col-span-1 text-slate-300">:</span>
                <div className="col-span-8">
                  <select 
                    className="w-full bg-[#3d2616] text-[#FF6900] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#FF6900] appearance-none cursor-pointer outline-none font-medium"
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setSelectedShowId(null);
                    }}
                  >
                    <option value="">LOCATION</option>
                    {availableLocations.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type */}
              <div className="grid grid-cols-12 items-center gap-4">
                <span className="col-span-3 text-slate-300">Type</span>
                <span className="col-span-1 text-slate-300">:</span>
                <div className="col-span-8">
                  <select 
                    className="w-full bg-[#3d2616] text-[#FF6900] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#FF6900] appearance-none cursor-pointer outline-none font-medium"
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setSelectedShowId(null);
                    }}
                  >
                    <option value="">SEATING TYPE</option>
                    {availableTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-12 items-start gap-4 pt-2">
                <span className="col-span-3 text-slate-300 mt-2">Time</span>
                <span className="col-span-1 text-slate-300 mt-2">:</span>
                <div className="col-span-8">
                  {finalShows.length === 0 ? (
                    <p className="text-slate-500 text-sm mt-2">Tidak ada jadwal tersedia.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {finalShows.map(show => {
                        const time = new Date(show.jam_tayang).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
                        return (
                          <label key={show.id} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedShowId === show.id ? 'border-[#3b82f6]' : 'border-slate-500 group-hover:border-slate-400'}`}>
                              {selectedShowId === show.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div>
                              )}
                            </div>
                            <input 
                              type="radio" 
                              name="time" 
                              className="hidden" 
                              value={show.id}
                              checked={selectedShowId === show.id}
                              onChange={() => setSelectedShowId(show.id)}
                            />
                            <span className={`font-semibold text-sm ${selectedShowId === show.id ? 'text-[#FF6900]' : 'text-[#FF6900]/80'}`}>
                              {time}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="mt-auto pt-16 flex flex-col items-end gap-4">
              {formError && (
                <div className="text-red-500 bg-red-500/10 border border-red-500/50 px-4 py-2 rounded-md text-sm">
                  {formError}
                </div>
              )}
              <button 
                onClick={handleBuyNow}
                className="px-8 py-3 rounded-sm font-bold text-black text-sm tracking-widest transition-all bg-white hover:bg-gray-200"
              >
                BUY NOW
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
