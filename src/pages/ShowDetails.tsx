import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import type { Show, SeatAvailability } from '../types';
import { X } from 'lucide-react';

export const ShowDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dummy timer state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    // Timer logic
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const showsData = await apiFetch<Show[]>('/api/shows', { requireAuth: false });
        const currentShow = showsData.find(s => s.id === Number(id));
        
        if (!currentShow) {
          throw new Error('Jadwal tayang tidak ditemukan');
        }
        setShow(currentShow);

        const seatsData = await apiFetch<SeatAvailability[]>(`/api/shows/${id}/seats`);
        setSeats(seatsData);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data kursi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSeatClick = (seatId: number, isBooked: boolean) => {
    if (isBooked) return;
    
    setSelectedSeatIds(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedSeatIds.length === 0) return;
    navigate(`/checkout/${id}`, { state: { selectedSeatIds, show } });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  // Build grid mapping
  // Based on 2-5-2 layout (cols 1..9, rows A..H)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  // Helper to find seat by row and col
  const getSeatData = (row: string, col: number) => {
    return seats.find(s => s.nomor_kursi === `${row}${col}`);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Header Section */}
      <div className="pt-8 px-8 lg:px-16 w-full max-w-[1400px] mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#FF6900] font-bold text-lg tracking-widest hover:text-white transition-colors mb-6"
        >
          &lt;&lt; EXIT
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-[0.2em] max-w-2xl leading-tight">
            {show.movie?.judul || 'MOVIE TITLE'}
          </h1>
          
          <div className="flex items-center gap-6">
            <span className="text-3xl font-light tracking-wider text-slate-300">
              {formatTime(timeLeft)}
            </span>
            <div className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-[#4a4a4a] text-[#FF6900] cursor-help">
              <span className="text-xl font-bold">!</span>
              <div className="absolute top-full mt-2 w-48 p-2 bg-[#E8E6D3] text-black text-xs font-semibold rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Seat with 'X' is unavailable and should not be selected.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content / Seat Map Area */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 pb-12 flex flex-col items-center">
        
        {/* The Gray Box Container */}
        <div className="bg-[#4a4a4a] w-full max-w-[1000px] relative p-8 md:p-16 flex flex-col items-center">
          
          {/* Screen Label */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-12 bg-[#E8E6D3] text-stone-500 flex items-center justify-center text-xl tracking-widest font-light shadow-md">
            Screen
          </div>

          {/* EXIT Label (Right Side) */}
          <div className="absolute top-0 right-0 w-12 h-32 bg-[#E8E6D3] text-stone-500 flex items-center justify-center shadow-md">
            <span className="rotate-90 tracking-widest text-lg font-light">EXIT</span>
          </div>

          {/* The Seat Grid */}
          <div className="mt-12 flex flex-col gap-6 w-full max-w-[800px] mx-auto">
            {rows.map(row => (
              <div key={row} className="flex items-center justify-between w-full">
                {/* Left Row Label */}
                <div className="w-8 text-[#FF6900] font-light">{row}</div>

                {/* Left Block (Cols 1-2) */}
                <div className="flex gap-4">
                  {[1, 2].map(col => {
                    const seatData = getSeatData(row, col);
                    if (!seatData) return <div key={col} className="w-8 h-8 md:w-10 md:h-10 opacity-0" />;
                    const isSelected = selectedSeatIds.includes(seatData.seat_id);
                    return (
                      <button
                        key={seatData.seat_id}
                        disabled={seatData.is_booked}
                        onClick={() => handleSeatClick(seatData.seat_id, seatData.is_booked)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative transition-colors ${
                          seatData.is_booked 
                            ? 'bg-black cursor-not-allowed'
                            : isSelected 
                              ? 'bg-[#FF6900]' 
                              : 'bg-black hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        {seatData.is_booked && <X className="text-[#FF6900] w-6 h-6 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Spacer between block 1 and 2 */}
                <div className="w-8 md:w-12"></div>

                {/* Middle Block (Cols 3-7) */}
                <div className="flex gap-4">
                  {[3, 4, 5, 6, 7].map(col => {
                    const seatData = getSeatData(row, col);
                    if (!seatData) return <div key={col} className="w-8 h-8 md:w-10 md:h-10 opacity-0" />;
                    const isSelected = selectedSeatIds.includes(seatData.seat_id);
                    return (
                      <button
                        key={seatData.seat_id}
                        disabled={seatData.is_booked}
                        onClick={() => handleSeatClick(seatData.seat_id, seatData.is_booked)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative transition-colors ${
                          seatData.is_booked 
                            ? 'bg-black cursor-not-allowed'
                            : isSelected 
                              ? 'bg-[#FF6900]' 
                              : 'bg-black hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        {seatData.is_booked && <X className="text-[#FF6900] w-6 h-6 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Spacer between block 2 and 3 */}
                <div className="w-8 md:w-12"></div>

                {/* Right Block (Cols 8-9) */}
                <div className="flex gap-4">
                  {[8, 9].map(col => {
                    const seatData = getSeatData(row, col);
                    if (!seatData) return <div key={col} className="w-8 h-8 md:w-10 md:h-10 opacity-0" />;
                    const isSelected = selectedSeatIds.includes(seatData.seat_id);
                    return (
                      <button
                        key={seatData.seat_id}
                        disabled={seatData.is_booked}
                        onClick={() => handleSeatClick(seatData.seat_id, seatData.is_booked)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative transition-colors ${
                          seatData.is_booked 
                            ? 'bg-black cursor-not-allowed'
                            : isSelected 
                              ? 'bg-[#FF6900]' 
                              : 'bg-black hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        {seatData.is_booked && <X className="text-[#FF6900] w-6 h-6 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <div className="w-8 text-[#FF6900] font-light text-right">{row}</div>
              </div>
            ))}
          </div>

          {/* Column Number Labels (Footer of Grid) */}
          <div className="flex items-center justify-between w-full max-w-[800px] mt-6">
            <div className="w-8"></div>
            <div className="flex gap-4">
              {[1, 2].map(num => (
                <div key={num} className="w-8 md:w-10 text-center text-[#FF6900] font-light">{num}</div>
              ))}
            </div>
            <div className="w-8 md:w-12"></div>
            <div className="flex gap-4">
              {[3, 4, 5, 6, 7].map(num => (
                <div key={num} className="w-8 md:w-10 text-center text-[#FF6900] font-light">{num}</div>
              ))}
            </div>
            <div className="w-8 md:w-12"></div>
            <div className="flex gap-4">
              {[8, 9].map(num => (
                <div key={num} className="w-8 md:w-10 text-center text-[#FF6900] font-light">{num}</div>
              ))}
            </div>
            <div className="w-8"></div>
          </div>

        </div>
        
        {/* Footer Area (Legend & Continue Button) */}
        <div className="w-full max-w-[1000px] mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black border border-[#FF6900]">
              <X className="text-[#FF6900] w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-2xl font-bold tracking-wide">Unavailable</span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={selectedSeatIds.length === 0}
            className={`px-8 py-3 rounded-sm font-bold text-black text-sm tracking-widest transition-all ${
              selectedSeatIds.length > 0 
                ? 'bg-white hover:bg-gray-200' 
                : 'bg-white/30 cursor-not-allowed'
            }`}
          >
            CONTINUE
          </button>
        </div>

      </div>
    </div>
  );
};
