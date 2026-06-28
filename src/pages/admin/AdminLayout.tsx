import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Globe } from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Library', path: '/admin/library' },
    { name: 'Studios', path: '/admin/studios' },
    { name: 'Schedules', path: '/admin/schedules' },
    { name: 'Sales Reports', path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-slate-200 font-sans">
      {/* Admin Navbar */}
      <nav className="border-b border-white/10 bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/admin" className="flex items-center gap-2">
                <img src="/logo_cinemaxxx.png" alt="CineMaxxx Logo" className="h-16 md:h-24 w-auto object-contain py-2" />
              </Link>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8 text-[#FF6900] text-sm font-medium mr-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`transition-colors ${location.pathname.includes(link.path)
                        ? 'text-[#FF6900] border-b border-[#FF6900] pb-1'
                        : 'text-[#B4886B] hover:text-[#FF6900]'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-white/20 mr-6 hidden md:block"></div>

              {/* Admin Profile */}
              <div className="flex items-center gap-4 text-[#FF6900]">
                <span className="text-sm font-medium hidden sm:block">Admin</span>
                <Link to="/" className="p-1 hover:bg-white/10 rounded transition-colors text-stone-400 hover:text-white" title="Back to Customer Site">
                  <Globe size={18} />
                </Link>
                <User size={18} />
                <button
                  onClick={handleLogout}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-stone-400 hover:text-white"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
