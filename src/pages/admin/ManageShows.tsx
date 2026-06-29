import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import type { Show, Movie, Studio } from '../../types';
import { Plus, X, Trash2, Edit2, Clock, MapPin, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';

export const ManageShows: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  
  const [movieId, setMovieId] = useState('');
  const [studioId, setStudioId] = useState('');
  const [jamTayang, setJamTayang] = useState('');
  const [harga, setHarga] = useState('');
  
  const [editingShowId, setEditingShowId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedStudio, setSelectedStudioFilter] = useState<string>('All Studios');
  const [viewMode, setViewMode] = useState<'Timeline' | 'List'>('Timeline');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Timeline config (08:00 to 24:00)
  const START_HOUR = 8;
  const END_HOUR = 24;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  const fetchData = async () => {
    try {
      const [showsData, moviesData, studiosData] = await Promise.all([
        apiFetch<Show[]>('/api/admin/shows'),
        apiFetch<Movie[]>('/api/admin/movies'),
        apiFetch<Studio[]>('/api/admin/studios')
      ]);
      setShows(showsData);
      setMovies(moviesData);
      setStudios(studiosData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update NOW line every minute
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const isoDate = new Date(jamTayang).toISOString();
      const body = JSON.stringify({
        movie_id: Number(movieId),
        studio_id: Number(studioId),
        jam_tayang: isoDate,
        harga: Number(harga)
      });
      
      if (editingShowId) {
        await apiFetch(`/api/admin/shows/${editingShowId}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/admin/shows', { method: 'POST', body });
      }
      
      setJamTayang('');
      setHarga('');
      setEditingShowId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan jadwal.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingShowId(null);
    setMovieId('');
    setStudioId('');
    setJamTayang('');
    setHarga('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (show: Show) => {
    setEditingShowId(show.id);
    setMovieId(show.movie_id.toString());
    setStudioId(show.studio_id.toString());
    setHarga((show.harga || 0).toString());
    
    // Format datetime-local (YYYY-MM-DDThh:mm) in local timezone
    const d = new Date(show.jam_tayang);
    const tzOffset = d.getTimezoneOffset() * 60000; 
    const localIso = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setJamTayang(localIso);
    
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      // Assuming you have a delete endpoint, fallback if not
      await apiFetch(`/api/admin/shows/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Penghapusan gagal (mungkin karena sudah ada tiket terpesan untuk jadwal ini).');
    }
  };

  // Filter shows by date and studio
  const filteredShows = shows.filter(show => {
    const showDate = new Date(show.jam_tayang);
    // Parse selectedDate as local midnight to avoid timezone shift
    const filterParts = selectedDate.split('-');
    const filterDate = new Date(Number(filterParts[0]), Number(filterParts[1]) - 1, Number(filterParts[2]));
    
    const isSameDate = showDate.getFullYear() === filterDate.getFullYear() &&
                       showDate.getMonth() === filterDate.getMonth() &&
                       showDate.getDate() === filterDate.getDate();
                       
    if (!isSameDate) return false;
    if (selectedStudio !== 'All Studios' && show.studio_id.toString() !== selectedStudio) return false;
    return true;
  });

  const getTipeBadgeColor = (t: string) => {
    if (t === 'IMAX') return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
    if (t === 'Premium') return 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10';
    return 'text-stone-300 border-stone-500/30 bg-stone-700/30';
  };

  const calculatePosition = (dateStr: string, durasi: number) => {
    const date = new Date(dateStr);
    const minsFromStart = (date.getHours() * 60 + date.getMinutes()) - (START_HOUR * 60);
    
    // clamp bounds for timeline display
    let left = (minsFromStart / TOTAL_MINUTES) * 100;
    let width = (durasi / TOTAL_MINUTES) * 100;

    if (left < 0) {
      width += left; // shorten width if starts before timeline
      left = 0;
    }
    if (left + width > 100) {
      width = 100 - left; // clip end
    }

    return { left: `${left}%`, width: `${width}%` };
  };

  const getNowPosition = () => {
    // Only show NOW line if selected date is today
    const today = new Date();
    const filterDate = new Date(selectedDate);
    if (today.toDateString() !== filterDate.toDateString()) return null;
    
    const minsFromStart = (today.getHours() * 60 + today.getMinutes()) - (START_HOUR * 60);
    if (minsFromStart < 0 || minsFromStart > TOTAL_MINUTES) return null;
    
    return `${(minsFromStart / TOTAL_MINUTES) * 100}%`;
  };

  const nowPos = getNowPosition();

  // Studios to display on left column
  const displayedStudios = selectedStudio === 'All Studios' 
    ? studios 
    : studios.filter(s => s.id.toString() === selectedStudio);

  // Time markers (every 2 hours)
  const timeMarkers = [];
  for (let i = START_HOUR; i <= END_HOUR; i += 2) {
    timeMarkers.push(i);
  }

  return (
    <div className="pb-20 text-white font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule Management</h1>
          <p className="text-stone-400 text-sm">Manage movie showtimes and studio allocations.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Toggle View */}
          <div className="flex bg-[#111] rounded border border-white/10 overflow-hidden">
            <button 
              onClick={() => setViewMode('Timeline')}
              className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'Timeline' ? 'bg-[#FF6900]/20 text-[#FF6900]' : 'text-stone-400 hover:text-white'}`}
            >
              <Clock size={16} /> Timeline
            </button>
            <div className="w-px bg-white/10"></div>
            <button 
              onClick={() => setViewMode('List')}
              className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'List' ? 'bg-[#FF6900]/20 text-[#FF6900]' : 'text-stone-400 hover:text-white'}`}
            >
              <AlignLeft size={16} /> List
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>

          {/* Date Picker */}
          <div className="relative">
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-[#111] border border-white/10 text-stone-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-[#FF6900]/50"
            />
          </div>

          {/* Studio Filter */}
          <div className="relative">
            <select 
              value={selectedStudio}
              onChange={(e) => setSelectedStudioFilter(e.target.value)}
              className="appearance-none bg-[#111] border border-white/10 text-stone-300 rounded px-4 py-2 pr-8 text-sm focus:outline-none focus:border-[#FF6900]/50"
            >
              <option value="All Studios">All Studios</option>
              {studios.map(s => (
                <option key={s.id} value={s.id.toString()}>{s.nama_studio}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-transparent text-[#FF6900] border border-[#FF6900]/50 font-semibold px-4 py-2 rounded hover:bg-[#FF6900]/10 transition-colors text-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create Schedule
        </button>
      </div>

      {viewMode === 'Timeline' ? (
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl overflow-hidden relative">
          {/* Header Row */}
          <div className="flex border-b border-white/5 bg-[#1A1815]">
            <div className="w-48 flex-shrink-0 border-r border-white/5 p-4 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              STUDIO
            </div>
            <div className="flex-1 relative flex">
              {timeMarkers.map(hour => (
                <div key={hour} className="flex-1 relative h-10 border-l border-white/5 first:border-0 text-[10px] text-stone-500 px-2 pt-3">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="relative">
            {/* Global NOW Line */}
            {nowPos && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none transition-all duration-1000"
                style={{ left: `calc(12rem + ${nowPos})` }}
              >
                <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow-lg">NOW</div>
              </div>
            )}

            {displayedStudios.map(studio => {
              const studioShows = filteredShows.filter(s => s.studio_id === studio.id);
              
              return (
                <div key={studio.id} className="flex border-b border-white/5 min-h-[120px] relative group hover:bg-white/[0.01]">
                  {/* Studio Info (Left Col) */}
                  <div className="w-48 flex-shrink-0 border-r border-white/5 p-4 bg-[#1C1A17] z-10 flex flex-col justify-center gap-2">
                    <h3 className="font-bold text-base text-white/90">{studio.nama_studio}</h3>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded self-start ${getTipeBadgeColor(studio.tipe || '')}`}>
                      {studio.tipe || 'REGULAR'}
                    </span>
                  </div>
                  
                  {/* Timeline Area (Right Col) */}
                  <div className="flex-1 relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timeMarkers.map((hour, idx) => (
                        <div key={hour} className={`flex-1 border-l border-white/5 ${idx === 0 ? 'border-transparent' : ''}`}></div>
                      ))}
                    </div>

                    {/* Show Blocks */}
                    {studioShows.map(show => {
                      const pos = calculatePosition(show.jam_tayang, show.movie?.durasi_menit || 120);
                      const d = new Date(show.jam_tayang);
                      const endD = new Date(d.getTime() + (show.movie?.durasi_menit || 120) * 60000);
                      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`;
                      
                      const isPast = endD < currentTime;
                      const isPremium = studio.tipe === 'Premium';

                      return (
                        <div 
                          key={show.id}
                          className={`absolute top-4 bottom-4 rounded overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:z-30 cursor-pointer shadow-lg
                            ${isPremium ? 'border border-[#FFD700]/30 bg-gradient-to-r from-[#221c0b] to-[#1C1A17]' : 'border border-white/10 bg-[#22211f]'}
                            ${isPast ? 'opacity-40 grayscale' : ''}
                          `}
                          style={{ left: pos.left, width: pos.width }}
                        >
                          <div className="p-2.5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold ${isPremium ? 'text-[#FFD700]' : 'text-[#FF6900]'}`}>{timeStr}</span>
                              {isPast && <span className="text-[9px] px-1 border border-white/20 text-white/50 rounded">PAST</span>}
                            </div>
                            <h4 className="text-xs font-bold text-white truncate mb-auto" title={show.movie?.judul}>{show.movie?.judul || 'Unknown'}</h4>
                            <div className="flex justify-between items-end">
                              <span className={`text-[10px] ${isPremium ? 'text-[#FFD700]/70' : 'text-stone-400'}`}>Rp {(show.harga || 0).toLocaleString('id-ID')}</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(show); }}
                                  className="text-stone-500 hover:text-white"
                                  title="Edit Schedule"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(show.id); }}
                                  className="text-stone-500 hover:text-red-400"
                                  title="Delete Schedule"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard List View */
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-stone-400 text-xs font-semibold uppercase tracking-wider bg-[#1A1815] border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Movie</th>
                  <th className="px-6 py-4">Studio</th>
                  <th className="px-6 py-4">Showtime</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredShows.map(show => (
                  <tr key={show.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-stone-500">#{show.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{show.movie?.judul}</td>
                    <td className="px-6 py-4 text-stone-300">{show.studio?.nama_studio}</td>
                    <td className="px-6 py-4 text-stone-300">
                      {new Date(show.jam_tayang).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-green-400">Rp {(show.harga || 0).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(show)} className="text-stone-400 hover:text-white transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(show.id)} className="text-stone-400 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredShows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                      No schedules found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1C1A17] border border-white/10 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">{editingShowId ? "Edit Schedule" : "Create Schedule"}</h2>
              <button onClick={() => { setIsModalOpen(false); setError(null); setEditingShowId(null); }} className="text-stone-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded text-sm mb-4">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm text-stone-400 mb-1">Movie</label>
                <select 
                  required value={movieId} onChange={e => setMovieId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none"
                >
                  <option value="">Select Movie</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.judul} ({m.durasi_menit} mins)</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-stone-400 mb-1">Studio</label>
                <select 
                  required value={studioId} onChange={e => setStudioId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none"
                >
                  <option value="">Select Studio</option>
                  {studios.filter(s => s.status !== 'Maintenance').map(s => <option key={s.id} value={s.id}>{s.nama_studio} ({s.tipe})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">Date & Time</label>
                <input 
                  required type="datetime-local" value={jamTayang} onChange={e => setJamTayang(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none [color-scheme:dark]" 
                />
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1">Price (Rp)</label>
                <input 
                  required type="number" min="0" step="1000" value={harga} onChange={e => setHarga(e.target.value)} placeholder="e.g. 50000"
                  className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" 
                />
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setError(null); setEditingShowId(null); }} className="px-4 py-2 rounded text-stone-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-orange-600 text-white font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors">
                  {isLoading ? 'Saving...' : (editingShowId ? 'Save Changes' : 'Create Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
