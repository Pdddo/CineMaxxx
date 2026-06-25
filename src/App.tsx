import { useEffect, useState } from 'react';
import { Film, LogOut } from 'lucide-react';
import AuthForms from './components/AuthForms';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
// import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cinemaxxx_token'));
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, role: payload.role, nama: payload.nama || 'User' });
      } catch (e) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('cinemaxxx_token');
      }
    } else {
      setUser(null);
    }
    setIsInitializing(false);
  }, [token]);

  const logout = () => {
    localStorage.removeItem('cinemaxxx_token');
    setToken(null);
  };

  if (isInitializing) return null;

  if (!user) {
    return <AuthForms setToken={setToken} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-200">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl shadow-md shadow-orange-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              CineMaxxx
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user.email}</span>
              <span className="text-xs font-semibold tracking-wide text-orange-600 uppercase">
                {user.role} Dashboard
              </span>
            </div>
            <button 
              onClick={logout} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <CustomerDashboard />
        )}
      </main>
    </div>
  );
}

