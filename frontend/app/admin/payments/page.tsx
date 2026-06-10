'use client';
import { useEffect, useState } from 'react';
import Link  from 'next/link';
import api   from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Payment {
  id: string; amount: number; currency: string;
  status: string; created: string; customer: string;
  email: string; orderId: string | null;
  orderStatus: string | null; refunded: boolean;
}
interface Stats {
  total: number; succeeded: number; revenue: number;
  refunded: number; avgTicket: number;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  succeeded:          { label: 'Réussi',    color: '#22c55e', bg: '#14532d' },
  canceled:           { label: 'Annulé',    color: '#f87171', bg: '#3b1111' },
  requires_payment_method: { label: 'Échoué', color: '#f59e0b', bg: '#292524' },
  processing:         { label: 'En cours',  color: '#60a5fa', bg: '#1e2d4a' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(false);
  const [lastId, setLastId]     = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState('requested_by_customer');

  useEffect(() => {
    Promise.all([
      api.get('/admin/payments'),
      api.get('/admin/payments/stats'),
    ]).then(([p, s]) => {
      setPayments(p.data.payments);
      setHasMore(p.data.hasMore);
      setLastId(p.data.lastId);
      setStats(s.data);
    }).catch(() => toast.error('Erreur chargement paiements'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (!lastId) return;
    try {
      const { data } = await api.get(`/admin/payments?starting_after=${lastId}`);
      setPayments(p => [...p, ...data.payments]);
      setHasMore(data.hasMore);
      setLastId(data.lastId);
    } catch { toast.error('Erreur chargement'); }
  };

  const refund = async (paymentIntentId: string, amount?: number) => {
    if (!confirm(`Confirmer le remboursement${amount ? ` de ${amount}€` : ' total'} ?`)) return;
    setRefunding(paymentIntentId);
    try {
      const { data } = await api.post('/admin/payments/refund', {
        paymentIntentId,
        amount,
        reason: selectedReason,
      });
      toast.success(`✅ Remboursé : ${data.amount}€`);
      setPayments(p => p.map(x =>
        x.id === paymentIntentId ? { ...x, refunded: true, orderStatus: 'REFUNDED' } : x
      ));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur remboursement');
    } finally { setRefunding(null); }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="text-[#8b96b0] text-sm hover:text-white">← Admin</Link>
            <h1 className="text-2xl font-black mt-2">Gestion des paiements</h1>
          </div>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#161a22] border border-[#1e2433] rounded-xl text-sm font-semibold text-white hover:border-blue-600 transition no-underline">
            🔗 Dashboard Stripe
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total paiements',  value: stats.total,                   color: '#f0f4ff' },
              { label: 'Réussis',          value: stats.succeeded,               color: '#22c55e' },
              { label: 'Revenus 30j',      value: formatPrice(stats.revenue),    color: '#60a5fa' },
              { label: 'Panier moyen',     value: formatPrice(stats.avgTicket),  color: '#a78bfa' },
              { label: 'Remboursements',   value: stats.refunded,                color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-5 text-center">
                <div className="text-xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-[#8b96b0]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Raison remboursement */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm text-[#8b96b0]">Raison des remboursements :</span>
          <select value={selectedReason} onChange={e => setSelectedReason(e.target.value)}
            className="bg-[#161a22] border border-[#1e2433] rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer">
            <option value="requested_by_customer">Demande client</option>
            <option value="duplicate">Doublon</option>
            <option value="fraudulent">Fraude</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-[#8b96b0]">
                <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                Chargement des paiements Stripe...
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#111318] border-b border-[#1e2433]">
                    {['ID Stripe','Client','Montant','Statut','Commande','Date','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[#8b96b0] font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const s = STATUS_STYLE[p.status] || STATUS_STYLE.processing;
                    return (
                      <tr key={p.id} className="border-b border-[#1e2433] hover:bg-[#1a1f2a] transition">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-[#8b96b0]">{p.id.slice(0, 20)}...</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{p.customer}</div>
                          <div className="text-xs text-[#8b96b0]">{p.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-black text-white">{formatPrice(p.amount)}</span>
                          {p.refunded && <span className="ml-2 text-xs text-orange-400">(remboursé)</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ background: s.bg, color: s.color }} className="px-2 py-1 rounded-md text-xs font-bold">
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.orderId ? (
                            <Link href={`/dashboard/orders/${p.orderId}`}
                              className="text-blue-400 text-xs hover:underline font-mono">
                              #{p.orderId.slice(-8).toUpperCase()}
                            </Link>
                          ) : <span className="text-[#8b96b0] text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#8b96b0] whitespace-nowrap text-xs">
                          {formatDate(p.created)}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'succeeded' && !p.refunded ? (
                            <button
                              onClick={() => refund(p.id)}
                              disabled={refunding === p.id}
                              className="px-3 py-1.5 bg-red-900/30 border border-red-600/30 text-red-400 hover:bg-red-900/50 rounded-lg text-xs font-bold border-none cursor-pointer disabled:opacity-50 transition">
                              {refunding === p.id ? '...' : '↩ Rembourser'}
                            </button>
                          ) : (
                            <span className="text-xs text-[#8b96b0]">
                              {p.refunded ? '✓ Remboursé' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {hasMore && (
            <div className="p-4 text-center border-t border-[#1e2433]">
              <button onClick={loadMore}
                className="px-6 py-2.5 bg-[#161a22] border border-[#1e2433] hover:border-blue-600 rounded-xl text-sm font-semibold text-white cursor-pointer transition">
                Charger plus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}