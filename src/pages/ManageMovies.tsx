import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { Movie } from '../types';
import { Button } from '../components/ui/Button';
import { Trash2, Edit, Plus, Image as ImageIcon, X, Filter } from 'lucide-react';

export const ManageMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [judul, setJudul] = useState('');
  const [durasi, setDurasi] = useState('');
  const [sinopsis, setSinopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('PG-13');
  const [status, setStatus] = useState('Now Showing');
  const [releaseDate, setReleaseDate] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [genreFilter, setGenreFilter] = useState('All Genres');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const fetchMovies = async () => {
    try {
      const data = await apiFetch<Movie[]>('/api/admin/movies');
      setMovies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let posterUrl = existingPosterUrl || undefined;

      if (posterFile) {
        const formData = new FormData();
        formData.append('file', posterFile);
        const res = await apiFetch<{ url: string }>('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        posterUrl = res.url;
      }

      const payload: Record<string, any> = {
        judul,
        durasi_menit: Number(durasi),
        sinopsis,
        genre,
        rating,
        status,
        release_date: releaseDate,
      };
      if (posterUrl) {
        payload.poster_url = posterUrl;
      }

      if (isEditing) {
        await apiFetch(`/api/admin/movies/${isEditing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<Movie>('/api/admin/movies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      closeModal();
      fetchMovies();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setIsEditing(movie.id);
    setJudul(movie.judul);
    setDurasi(movie.durasi_menit.toString());
    setSinopsis(movie.sinopsis);
    setGenre(movie.genre || '');
    setRating(movie.rating || 'PG-13');
    setStatus(movie.status || 'Now Showing');
    setReleaseDate(movie.release_date || '');
    setExistingPosterUrl(movie.poster_url || null);
    setPosterFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus film ini?')) return;
    try {
      await apiFetch(`/api/admin/movies/${id}`, { method: 'DELETE' });
      fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setJudul('');
    setDurasi('');
    setSinopsis('');
    setGenre('');
    setRating('PG-13');
    setStatus('Now Showing');
    setReleaseDate('');
    setPosterFile(null);
    setExistingPosterUrl(null);
    setError(null);
  };

  const getStatusColor = (statusVal: string) => {
    if (statusVal === 'Now Showing') return 'bg-orange-500';
    if (statusVal === 'Upcoming') return 'bg-blue-500';
    return 'bg-stone-500';
  };

  // Filter & Pagination logic
  const filteredMovies = movies.filter(m => {
    if (genreFilter !== 'All Genres' && !m.genre?.includes(genreFilter)) return false;
    if (statusFilter !== 'All Statuses' && m.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / itemsPerPage));
  const currentMovies = filteredMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueGenres = ['All Genres', ...Array.from(new Set(movies.map(m => m.genre?.split(',')[0].trim()).filter(Boolean)))];
  const uniqueStatuses = ['All Statuses', 'Now Showing', 'Upcoming', 'Archived'];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-6">Movie Library</h1>
          <div className="flex gap-4">
            <div className="relative">
              <select 
                value={genreFilter}
                onChange={(e) => { setGenreFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-transparent border border-white/20 text-stone-300 rounded px-4 py-2 pr-8 text-sm focus:outline-none focus:border-[#FF6900]/50"
              >
                {uniqueGenres.map(g => <option key={g as string} value={g as string} className="bg-[#111]">{g as string}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-transparent border border-white/20 text-stone-300 rounded px-4 py-2 pr-8 text-sm focus:outline-none focus:border-[#FF6900]/50"
              >
                {uniqueStatuses.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded hover:bg-[#FFD700]/90 transition-colors"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Movie
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1C1A17] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-stone-400 text-xs font-semibold uppercase tracking-wider bg-[#1A1815] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Poster</th>
                <th className="px-6 py-4">Movie Title</th>
                <th className="px-6 py-4">Genre</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentMovies.map((movie) => (
                <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-16 rounded overflow-hidden bg-stone-800 flex items-center justify-center">
                      {movie.poster_url ? (
                        <img src={movie.poster_url} alt={movie.judul} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-stone-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium text-base mb-1">{movie.judul}</p>
                    <p className="text-stone-500 text-xs">Release: {movie.release_date || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-stone-400">{movie.genre || '-'}</td>
                  <td className="px-6 py-4 text-stone-400">{movie.durasi_menit} min</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold text-[#FFD700] border border-[#FFD700]/30 bg-[#FFD700]/10 rounded">
                      {movie.rating || 'NR'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-stone-300">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(movie.status || '')}`}></span>
                      {movie.status || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(movie)} className="text-stone-400 hover:text-white transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(movie.id)} className="text-stone-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentMovies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    No movies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center text-sm text-stone-400">
          <div>
            Showing {filteredMovies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredMovies.length)} of {filteredMovies.length} entries
          </div>
          <div className="flex gap-1 items-center">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === i + 1 ? 'bg-[#FF6900] text-white' : 'hover:bg-white/5'}`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1C1A17] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Movie' : 'Add Movie'}</h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Movie Title</label>
                  <input required value={judul} onChange={e => setJudul(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Release Date</label>
                  <input type="date" required value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Genre</label>
                  <input required value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. Action, Thriller" className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Duration (minutes)</label>
                  <input required type="number" value={durasi} onChange={e => setDurasi(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Rating</label>
                  <select value={rating} onChange={e => setRating(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none">
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none">
                    <option value="Now Showing">Now Showing</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-stone-400 mb-1">Synopsis</label>
                <textarea required rows={3} value={sinopsis} onChange={e => setSinopsis(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-sm text-stone-400 mb-1">Poster Image</label>
                <div className="flex items-center gap-4">
                  {(posterFile || existingPosterUrl) && (
                    <div className="w-16 h-24 rounded overflow-hidden bg-[#111] flex-shrink-0">
                      <img 
                        src={posterFile ? URL.createObjectURL(posterFile) : existingPosterUrl || ''} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files && setPosterFile(e.target.files[0])} 
                      className="w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#FF6900]/10 file:text-[#FF6900] hover:file:bg-[#FF6900]/20"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded text-stone-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-[#FFD700] text-black font-semibold hover:bg-[#FFD700]/90 disabled:opacity-50 transition-colors">
                  {isLoading ? 'Saving...' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
