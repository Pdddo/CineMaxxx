import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import type { User } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

export const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<User[]>('/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tindakan ini tidak dapat dibatalkan. Yakin ingin menghapus pengguna ini?')) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengguna.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white">Data Pengguna</h1>

      <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg flex gap-3 text-orange-400">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Peringatan Keamanan:</strong> Sesuai kebijakan sistem, Administrator hanya diizinkan untuk melihat dan menghapus akun pengguna. Pengubahan data pengguna (Edit) dinonaktifkan demi privasi.
        </p>
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-slate-400">#{user.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{user.nama}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                        ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                         <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)} className="h-8">
                           <Trash2 className="w-4 h-4 mr-1" /> Hapus
                         </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Tidak ada pengguna ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
