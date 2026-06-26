import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import type { Movie } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Trash2, Edit, Plus, Image as ImageIcon } from 'lucide-react';

export const ManageMovies: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [judul, setJudul] = useState('');
  const [durasi, setDurasi] = useState('');
  const [sinopsis, setSinopsis] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const payload = { judul, durasi_menit: Number(durasi), sinopsis };
      
      let movieId = isEditing;
      
      if (isEditing) {
        await apiFetch(`/api/admin/movies/${isEditing}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        const newMovie = await apiFetch<Movie>('/api/admin/movies', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        movieId = newMovie.id;
      }

      // Handle Image Upload if selected
      if (posterFile && movieId) {
        const formData = new FormData();
        formData.append('file', posterFile);
        formData.append('movie_id', movieId.toString());

        await apiFetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
      }

      setJudul('');
      setDurasi('');
      setSinopsis('');
      setPosterFile(null);
      setIsEditing(null);
      fetchMovies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setIsEditing(movie.id);
    setJudul(movie.judul);
    setDurasi(movie.durasi_menit.toString());
    setSinopsis(movie.sinopsis);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Manajemen Film</h1>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isEditing ? 'Edit Film' : 'Tambah Film Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Judul Film" required value={judul} onChange={e => setJudul(e.target.value)} />
            <Input label="Durasi (Menit)" type="number" required value={durasi} onChange={e => setDurasi(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Sinopsis</label>
            <textarea 
              className="w-full mt-1.5 rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              rows={3} required value={sinopsis} onChange={e => setSinopsis(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-1.5">
              <ImageIcon className="w-4 h-4" /> Upload Poster
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setPosterFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600/20 file:text-purple-400 hover:file:bg-purple-600/30"
            />
          </div>
          <div className="flex gap-2 justify-end mt-6">
            {isEditing && (
              <Button type="button" variant="ghost" onClick={() => { setIsEditing(null); setJudul(''); setDurasi(''); setSinopsis(''); }}>Batal</Button>
            )}
            <Button type="submit" isLoading={isLoading}>{isEditing ? 'Update Film' : 'Simpan Film'}</Button>
          </div>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map(movie => (
          <GlassCard key={movie.id} className="p-4 flex gap-4">
            <div className="w-24 h-32 bg-slate-800 rounded-md overflow-hidden shrink-0">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.judul} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Image</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white line-clamp-2">{movie.judul}</h3>
                <p className="text-xs text-slate-400 mt-1">{movie.durasi_menit} Menit</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(movie)} className="flex-1 h-8">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(movie.id)} className="flex-1 h-8">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
