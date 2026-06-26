import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import type { Show, Movie, Studio } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ManageShows: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  
  const [movieId, setMovieId] = useState('');
  const [studioId, setStudioId] = useState('');
  const [jamTayang, setJamTayang] = useState('');
  const [harga, setHarga] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Pastikan format ISO-8601
      const isoDate = new Date(jamTayang).toISOString();
      await apiFetch('/api/admin/shows', {
        method: 'POST',
        body: JSON.stringify({
          movie_id: Number(movieId),
          studio_id: Number(studioId),
          jam_tayang: isoDate,
          harga: Number(harga)
        })
      });
      setJamTayang('');
      setHarga('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white">Manajemen Jadwal Tayang</h1>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Tambah Jadwal Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Film</label>
            <select 
              required value={movieId} onChange={e => setMovieId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Pilih Film</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.judul}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Studio</label>
            <select 
              required value={studioId} onChange={e => setStudioId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Pilih Studio</option>
              {studios.map(s => <option key={s.id} value={s.id}>{s.nama_studio}</option>)}
            </select>
          </div>
          <Input label="Jam Tayang" type="datetime-local" required value={jamTayang} onChange={e => setJamTayang(e.target.value)} />
          <Input label="Harga (Rp)" type="number" required value={harga} onChange={e => setHarga(e.target.value)} />
          
          <Button type="submit" isLoading={isLoading} className="lg:col-span-4 mt-4">Tambah Jadwal</Button>
        </form>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Film</th>
                <th className="px-6 py-4">Studio</th>
                <th className="px-6 py-4">Jadwal</th>
                <th className="px-6 py-4">Harga</th>
              </tr>
            </thead>
            <tbody>
              {shows.map(show => (
                <tr key={show.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-medium text-white">#{show.id}</td>
                  <td className="px-6 py-4 text-purple-400">{show.movie?.judul || show.movie_id}</td>
                  <td className="px-6 py-4">{show.studio?.nama_studio || show.studio_id}</td>
                  <td className="px-6 py-4">{new Date(show.jam_tayang).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-green-400">Rp {show.harga.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {shows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada jadwal tayang</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
