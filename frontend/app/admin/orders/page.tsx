'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'En attente',    color: '#fbbf24', bg: '#292524' },
  CONFIRMED:  { label: 'Confirmée',     color: '#4ade80', bg: '#1e3a2f' },
  PROCESSING: { label: 'En cours',      color: '#60a5fa', bg: '#1e2d4a' },
  SHIPPED:    { label: 'Expédiée',      color: '#a78bfa', bg: '#2e1a47' },
  DELIVERED:  { label: 'Livrée',        color: '#22c55e', bg: '#14532d' },
  CANCELLED:  { label: 'Annulée',       color: '#f87171', bg: '#3b1111' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/orders')
      .then(r => setOrders(r.data.orders))
      .catch(() => toast.error('Erreur chargement commandes'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status });
      setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur mise à jour'); }
  };

  const filtered = orders.filter(o =>
    (filter === 'ALL' || o.status === filter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Gestion des commandes</h1>
            <p className="text-[#8b96b0] text-sm mt-1">{orders.length} commandes au total</p>
          </div>
          <Link href="/admin" className="text-sm text-[#8b96b0] hover:text-white border border-[#1e2433] rounded-xl px-4 py-2 transition">
            ← Dashboard
          </Link>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="flex-1 min-w-[200px] bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer">
            <option value="ALL">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#111318] border-b border-[#1e2433]">
                  {['ID', 'Client', 'Montant', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[#8b96b0] font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="border-b border-[#1e2433]">
                      {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-4"><Skeleton height={16} /></td>)}
                    </tr>
                  ))
                ) : filtered.map(o => {
                  const s = STATUS_LABELS[o.status];
                  return (
                    <tr key={o.id} className="border-b border-[#1e2433] hover:bg-[#1a1f2a] transition">
                      <td className="px-4 py-4 text-blue-400 font-bold">#{o.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold">{o.user?.name}</div>
                        <div className="text-[#8b96b0] text-xs">{o.user?.email}</div>
                      </td>
                      <td className="px-4 py-4 font-bold">€{o.total}</td>
                      <td className="px-4 py-4">
                        <span style={{ background: s?.bg, color: s?.color }} className="px-2 py-1 rounded-md text-xs font-bold">
                          {s?.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#8b96b0] whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4">
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                          className="bg-[#0a0c10] border border-[#1e2433] rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer">
                          {Object.entries(STATUS_LABELS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}