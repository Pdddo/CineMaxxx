import { useState } from 'react';
import { motion } from 'motion/react';
import { fetchApi } from '../lib/api';

interface AuthFormsProps {
  setToken: (token: string | null) => void;
}

export default function AuthForms({ setToken }: AuthFormsProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nama, setNama] = useState('');
  // Set customer as default, remove the dropdown for matching design
  const [role] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (view === 'register' && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        const data = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('cinemaxxx_token', data.access_token);
        setToken(data.access_token);
      } else {
        await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ nama: nama || email.split('@')[0], email, password, role })
        });
        setView('login');
        setError('Registration successful. Please login.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans">
      {/* Background Image (User can replace the image URL in CSS or put a file in public folder) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=2056&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="bg-[#FF6A00] text-black font-black text-xl px-4 py-1.5 rounded-full tracking-wider">
          INEMAXX
        </div>
        <button 
          onClick={() => {
            setView(view === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="text-[#FF6A00] font-bold text-lg hover:text-white transition-colors"
        >
          {view === 'login' ? 'Register' : 'Login'}
        </button>
      </header>

      {/* Form Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg bg-black/60 backdrop-blur-sm p-10 py-16 rounded-sm border border-white/10"
        >
          <h2 className="text-4xl font-bold text-center text-white mb-10 tracking-[0.3em]">
            {view === 'login' ? 'L O G I N' : 'R E G I S T E R'}
          </h2>

          {error && (
            <div className={`p-3 rounded mb-6 text-sm text-center font-medium ${
              error.includes('successful') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
            {view === 'register' && (
              <input
                required
                type="text"
                placeholder="Enter a username"
                className="w-3/4 px-4 py-3 bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] placeholder:text-gray-500 font-medium"
                value={nama}
                onChange={e => setNama(e.target.value)}
              />
            )}
            
            <input
              required
              type="email"
              placeholder={view === 'login' ? "Username" : "Enter an email"}
              className="w-3/4 px-4 py-3 bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] placeholder:text-gray-500 font-medium"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <input
              required
              type="password"
              placeholder={view === 'login' ? "Password" : "Enter a password"}
              className="w-3/4 px-4 py-3 bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] placeholder:text-gray-500 font-medium"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {view === 'register' && (
              <input
                required
                type="password"
                placeholder="Enter password again"
                className="w-3/4 px-4 py-3 bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] placeholder:text-gray-500 font-medium"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            )}

            {view === 'login' && (
              <div className="text-center text-sm text-white/70 mt-2">
                Not a member yet? <button type="button" onClick={() => setView('register')} className="text-white hover:text-[#FF6A00] underline transition">Register Here.</button>
              </div>
            )}

            <button
              disabled={loading}
              className="w-32 bg-black text-[#FF6A00] border border-[#FF6A00] font-bold py-2.5 rounded hover:bg-[#FF6A00] hover:text-black transition-colors disabled:opacity-50 mt-4 tracking-widest text-sm"
            >
              {view === 'login' ? 'LOG IN' : 'REGISTER'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
