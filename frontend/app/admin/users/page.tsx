'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Erreur chargement utilisateurs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Utilisateurs</h1>
            <p className="text-[#8b96b0] text-sm mt-1">{users.length} comptes enregistrés</p>
          </div>
          <Link href="/admin" className="text-sm text-[#8b96b0] border border-[#1e2433] rounded-xl px-4 py-2">← Dashboard</Link>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
          className="w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-sm text-white outline-none mb-6" />

        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#111318] border-b border-[#1e2433]">
                  {['Utilisateur', 'Commandes', 'Total dépensé', 'Inscription', 'Rôle'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[#8b96b0] font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(loading ? Array(5).fill(null) : filtered).map((u, i) => (
                  <tr key={u?.id || i} className="border-b border-[#1e2433]">
                    {!u ? (
                      [1,2,3,4,5].map(j => <td key={j} className="px-5 py-4"><div className="h-4 bg-[#1e2433] rounded animate-pulse" /></td>)
                    ) : (
                      <>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div style={{ background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                              {u.name[0]}
                            </div>
                            <div>
                              <div className="font-semibold">{u.name}</div>
                              <div className="text-[#8b96b0] text-xs">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold">{u._count?.orders ?? 0}</td>
                        <td className="px-5 py-4 text-blue-400 font-bold">€{u.totalSpent ?? 0}</td>
                        <td className="px-5 py-4 text-[#8b96b0]">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                            {u.role}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}