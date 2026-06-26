import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, User, Mail } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Register() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan Confirm Password tidak cocok');
      return;
    }

    setIsLoading(true);
    // As per requirement, role is 'customer' by default. Wait, the old code sent 'user'. I will send 'customer' as per my types.
    const payload = { nama, email, password, role: 'customer' };

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
        requireAuth: false,
      });

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal, periksa data Anda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('/background_loginreg.png')" }}>
      <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm z-0"></div>
      <GlassCard className="w-full max-w-md p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join CineMaxxx today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          
          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FF6900] hover:text-[#e55e00] font-medium">
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}