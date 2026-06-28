import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#020617]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-28 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo_cinemaxxx.png" alt="CineMaxxx Logo" className="h-14 md:h-20 w-auto object-contain" />
        </Link>

        <div className="flex items-center">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-[#FF6900] font-medium mr-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/tickets" className="hover:text-white transition-colors">Tickets</Link>
          </div>

          {/* Divider */}
          {user && (
            <div className="hidden md:block h-6 w-px bg-white/30 mx-6"></div>
          )}

          <div className="flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <span className="text-[#FF6900] hover:text-white transition-colors font-medium">Admin</span>
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 text-[#FF6900] hover:text-white transition-colors group">
                  <span className="hidden sm:inline font-medium">{user.nama}</span>
                  <UserIcon className="w-5 h-5 text-[#FF6900] group-hover:text-white transition-colors" />
                </Link>
                <button onClick={handleLogout} className="text-white hover:text-[#FF6900] transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-[#FF6900]">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="bg-[#FF6900] text-black hover:bg-[#FF6900]/80 border-none">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
