import React from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Film, Video, Users, LogOut } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { ManageMovies } from './ManageMovies';
import { ManageShows } from './ManageShows';
import { ManageUsers } from './ManageUsers';

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, exact: true },
    { path: '/admin/movies', label: 'Kelola Film', icon: <Film className="w-5 h-5" /> },
    { path: '/admin/shows', label: 'Kelola Jadwal', icon: <Video className="w-5 h-5" /> },
    { path: '/admin/users', label: 'Data Pengguna', icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#020617] border-t border-white/5">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0f172a]/50 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <img src="/logo_cinemaxxx.png" alt="CineMaxxx Logo" className="h-16 w-auto object-contain" />
          <div>
            <h2 className="text-lg font-bold text-white tracking-wider leading-none">Admin Panel</h2>
            <p className="text-xs text-slate-400 mt-1">CineMaxxx Management</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm
                ${isActive ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movies" element={<ManageMovies />} />
          <Route path="/shows" element={<ManageShows />} />
          <Route path="/users" element={<ManageUsers />} />
        </Routes>
      </main>
    </div>
  );
};
