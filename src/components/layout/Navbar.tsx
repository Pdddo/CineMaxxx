import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#111111]/95 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
            <img src="/logo_cinemaxxx.png" alt="CineMaxxx Logo" className="h-16 md:h-24 w-auto object-contain py-1" />
          </Link>

          <div className="flex items-center">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium mr-8">
              <Link to="/" className={`transition-colors ${location.pathname === '/' ? 'text-[#FF6900] border-b border-[#FF6900] pb-1' : 'text-[#B4886B] hover:text-[#FF6900]'}`}>Home</Link>
              <Link to="/tickets" className={`transition-colors ${location.pathname.startsWith('/tickets') ? 'text-[#FF6900] border-b border-[#FF6900] pb-1' : 'text-[#B4886B] hover:text-[#FF6900]'}`}>Tickets</Link>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-white/20 mr-6 hidden md:block"></div>

            <div className="flex items-center gap-4 text-[#FF6900]">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin">
                      <span className="text-[#B4886B] hover:text-[#FF6900] transition-colors text-sm font-medium">Admin Panel</span>
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 hover:text-white transition-colors group">
                    <span className="hidden sm:inline text-sm font-medium">{user.nama}</span>
                    <UserIcon size={18} />
                  </Link>
                  <button onClick={handleLogout} className="p-1 hover:bg-white/10 rounded transition-colors text-stone-400 hover:text-white" title="Logout">
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-[#B4886B] hover:text-[#FF6900]">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="bg-[#FF6900] text-black hover:bg-[#FF6900]/80 border-none font-bold">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
