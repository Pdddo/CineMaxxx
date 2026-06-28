import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6900] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-12 md:pt-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl bg-stone-900 border border-white/20 p-8 md:p-12 shadow-2xl rounded-sm">
        
        <div className="flex flex-col items-center mb-10 border-b border-white/10 pb-10">
          <div className="w-24 h-24 rounded-full bg-[#FF6900] flex items-center justify-center text-4xl font-black text-black mb-6 uppercase shadow-lg shadow-[#FF6900]/20">
            {user.nama.charAt(0)}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-widest uppercase text-white mb-3 text-center">{user.nama}</h1>
          <span className={`px-4 py-1 text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-[#FF6900]/20 text-[#FF6900] border border-[#FF6900]/50'}`}>
            {user.role}
          </span>
        </div>

        <div className="space-y-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
            <span className="text-stone-500 text-xs md:text-sm uppercase tracking-widest mb-1 md:mb-0">Full Name</span>
            <span className="text-lg md:text-xl font-light tracking-wide">{user.nama}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
            <span className="text-stone-500 text-xs md:text-sm uppercase tracking-widest mb-1 md:mb-0">Email Address</span>
            <span className="text-lg md:text-xl font-light tracking-wide text-stone-300">{user.email}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
            <span className="text-stone-500 text-xs md:text-sm uppercase tracking-widest mb-1 md:mb-0">Account ID</span>
            <span className="text-lg md:text-xl font-light tracking-wide text-stone-300">#{8900 + user.id}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
          <Link to="/tickets" className="flex-1">
            <button className="w-full border border-white text-white px-8 py-4 text-sm font-bold tracking-widest hover:bg-white hover:text-black transition-all">
              MY TICKETS
            </button>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex-1 border border-red-500/50 text-red-400 bg-red-500/10 px-8 py-4 text-sm font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            LOG OUT
          </button>
        </div>

      </div>
    </div>
  );
};

