import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import type { Studio, Seat } from '../types';
import { Plus, Edit, Trash2, LayoutGrid, Armchair, Wrench, Settings, Search, X } from 'lucide-react';

interface StudioWithSeats extends Studio {
  seats?: Seat[];
  isFetchingSeats?: boolean;
}

export const ManageStudios: React.FC = () => {
  const [studios, setStudios] = useState<StudioWithSeats[]>([]);
  const [namaStudio, setNamaStudio] = useState('');
  const [tipe, setTipe] = useState('Regular');
  const [status, setStatus] = useState('Active');

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Seat management modal
  const [selectedStudio, setSelectedStudio] = useState<StudioWithSeats | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [genRows, setGenRows] = useState(5);
  const [genCols, setGenCols] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const [filterType, setFilterType] = useState('All Types');

  const fetchStudios = async () => {
    try {
      const data = await apiFetch<Studio[]>('/api/admin/studios');
      const studiosWithSeats = await Promise.all(
        data.map(async (st) => {
          try {
            const seats = await apiFetch<Seat[]>(`/api/admin/seats/${st.id}`);
            return { ...st, seats };
          } catch {
            return { ...st, seats: [] };
          }
        })
      );
      setStudios(studiosWithSeats);
    } catch (err) {
      console.error('Failed fetching studios:', err);
    }
  };

  useEffect(() => {
    fetchStudios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaStudio.trim()) return;
    setIsLoading(true);
    try {
      if (isEditing) {
        await apiFetch(`/api/admin/studios/${isEditing}`, {
          method: 'PUT',
          body: JSON.stringify({ nama_studio: namaStudio, tipe, status }),
        });
      } else {
        const newSt = await apiFetch<Studio>('/api/admin/studios', {
          method: 'POST',
          body: JSON.stringify({ nama_studio: namaStudio, tipe, status }),
        });
        try {
          await apiFetch(`/api/admin/studios/${newSt.id}/generate-seats?rows=5&cols=10`, {
            method: 'POST',
          });
        } catch { }
      }
      closeModal();
      fetchStudios();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (studio: Studio) => {
    setIsEditing(studio.id);
    setNamaStudio(studio.nama_studio);
    setTipe(studio.tipe || 'Regular');
    setStatus(studio.status || 'Active');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus studio ini beserta seluruh kursinya?')) return;
    try {
      await apiFetch(`/api/admin/studios/${id}`, { method: 'DELETE' });
      fetchStudios();
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setNamaStudio('');
    setTipe('Regular');
    setStatus('Active');
  };

  const handleGenerateSeats = async () => {
    if (!selectedStudio) return;
    if (!confirm(`Generate ${genRows * genCols} seats? Existing seats will be DELETED.`)) return;

    setIsGenerating(true);
    try {
      const newSeats = await apiFetch<Seat[]>(`/api/admin/studios/${selectedStudio.id}/generate-seats?rows=${genRows}&cols=${genCols}`, {
        method: 'POST'
      });
      setStudios(prev => prev.map(s => s.id === selectedStudio.id ? { ...s, seats: newSeats } : s));
      setSelectedStudio(prev => prev ? { ...prev, seats: newSeats } : null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal me-generate kursi.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Stats computation
  const activeStudios = studios.filter(s => s.status !== 'Maintenance').length;
  const totalCapacity = studios.reduce((acc, curr) => acc + (curr.seats?.length || 0), 0);
  const maintenanceCount = studios.filter(s => s.status === 'Maintenance').length;

  const filteredStudios = filterType === 'All Types' ? studios : studios.filter(s => s.tipe === filterType);

  const getTipeColor = (t: string) => {
    if (t === 'IMAX') return 'text-orange-400 border-orange-400/30';
    if (t === 'Premium') return 'text-[#FFD700] border-[#FFD700]/30';
    return 'text-stone-400 border-stone-400/30';
  };

  const renderSeatPattern = (tipe: string) => {
    // A visual dummy representation just for the card
    const rows = tipe === 'Premium' ? 2 : tipe === 'IMAX' ? 3 : 4;
    const cols = tipe === 'Premium' ? 6 : 8;

    return (
      <div className="flex flex-col items-center justify-center h-24 gap-1.5 opacity-50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-1.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`w-3 h-3 rounded-sm ${tipe === 'Premium' ? 'border border-[#FFD700]/50' : tipe === 'IMAX' && r === rows - 1 ? 'bg-yellow-500' : 'bg-stone-700'}`}
                style={tipe === 'Premium' ? { borderRadius: '2px' } : {}}
              ></div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Studio</h1>
          <p className="text-stone-400 text-sm">Manage seating layouts, capacities, and maintenance status across all locations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded hover:bg-[#FFD700]/90 transition-colors"
        >
          <Plus size={18} strokeWidth={2.5} />
          ADD NEW STUDIO
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-5">
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL STUDIOS</p>
          <p className="text-[#FF6900] font-bold text-xl">{activeStudios} Active</p>
        </div>
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-5">
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">TOTAL CAPACITY</p>
          <p className="text-stone-300 font-bold text-xl">{totalCapacity.toLocaleString()} Seats</p>
        </div>
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-5 flex justify-between items-end">
          <div>
            <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">IN MAINTENANCE</p>
            <p className="text-red-500 font-bold text-xl">{maintenanceCount} Studios</p>
          </div>
          <Wrench size={20} className="text-red-500 mb-1" />
        </div>
        <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-5 relative">
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-1">FILTER BY TYPE</p>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
          >
            <option value="All Types" className="bg-[#111]">All Types</option>
            <option value="Regular" className="bg-[#111]">Regular</option>
            <option value="Premium" className="bg-[#111]">Premium</option>
            <option value="IMAX" className="bg-[#111]">IMAX</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 bottom-[-16px] flex items-center text-stone-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudios.map(studio => (
          <div key={studio.id} className="bg-[#1C1A17] border border-[#FF6900]/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 flex-1 relative group">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{studio.nama_studio}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded ${getTipeColor(studio.tipe || '')}`}>
                      {studio.tipe || 'REGULAR'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                    <Armchair size={14} />
                    <span>{studio.seats?.length || 0} Seats</span>
                  </div>
                </div>
                <div>
                  {studio.status === 'Maintenance' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 text-red-500 bg-red-500/10 border border-red-500/20 rounded">
                      <Wrench size={10} />
                      MAINTENANCE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 text-green-500 bg-green-500/10 border border-green-500/20 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Graphic Screen */}
              <div className="flex flex-col items-center mb-4 mt-8 relative">
                {studio.tipe === 'Premium' ? (
                  <div className="relative w-3/4 mb-6">
                    <div className="text-[9px] font-bold tracking-widest text-[#FFD700] mb-2 text-center">CURVED SCREEN</div>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-[50%] blur-[1px]"></div>
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent rounded-[50%] absolute bottom-[-2px]"></div>
                  </div>
                ) : (
                  <div className="w-1/2 h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-[100%] flex items-start justify-center pt-1 mb-2">
                    <span className="text-[8px] font-bold tracking-widest text-white/30 uppercase">SCREEN</span>
                  </div>
                )}
                {renderSeatPattern(studio.tipe || 'Regular')}
              </div>

              {/* Hover Actions overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => handleEdit(studio)} className="w-8 h-8 rounded bg-[#111] border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(studio.id)} className="w-8 h-8 rounded bg-[#111] border border-white/10 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="grid grid-cols-1 border-t border-white/5">
              <button
                onClick={() => { setSelectedStudio(studio); setIsSeatModalOpen(true); }}
                className="py-3 text-xs text-stone-400 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center justify-center gap-2"
              >
                <Armchair size={14} /> MANAGE SEATS
              </button>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-transparent border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-12 hover:bg-white/[0.02] hover:border-white/40 transition-colors min-h-[300px]"
        >
          <div className="w-12 h-12 bg-[#2A2622] rounded flex items-center justify-center mb-4">
            <Plus size={24} className="text-white" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Add New Studio</h3>
          <p className="text-stone-500 text-sm text-center">Configure layout, seating types, and set operational status.</p>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1C1A17] border border-white/10 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Studio' : 'Add Studio'}</h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Studio Name</label>
                <input required value={namaStudio} onChange={e => setNamaStudio(e.target.value)} placeholder="e.g. Studio 1" className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Type</label>
                <select value={tipe} onChange={e => setTipe(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none">
                  <option value="Regular">Regular</option>
                  <option value="IMAX">IMAX</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:border-[#FF6900]/50 focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded text-stone-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-[#FFD700] text-black font-semibold hover:bg-[#FFD700]/90 disabled:opacity-50 transition-colors">
                  {isLoading ? 'Saving...' : 'Save Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Generator Modal */}
      {isSeatModalOpen && selectedStudio && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1C1A17] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-2">Generate Seats</h2>
            <p className="text-stone-400 text-sm mb-6">Create a grid layout for {selectedStudio.nama_studio}.</p>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-xs text-stone-500 mb-1 uppercase">Rows</label>
                <input type="number" min="1" max="26" value={genRows} onChange={e => setGenRows(Number(e.target.value))} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:outline-none focus:border-[#FF6900]/50" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-stone-500 mb-1 uppercase">Columns</label>
                <input type="number" min="1" max="50" value={genCols} onChange={e => setGenCols(Number(e.target.value))} className="w-full bg-[#111] border border-white/10 text-white rounded px-4 py-2 focus:outline-none focus:border-[#FF6900]/50" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsSeatModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleGenerateSeats}
                disabled={isGenerating}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Layout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
