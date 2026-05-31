'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'En attente',      color: '#fbbf24', bg: '#292524' },
  CONFIRMED:  { label: 'Confirmée',       color: '#4ade80', bg: '#1e3a2f' },
  PROCESSING: { label: 'En préparation',  color: '#60a5fa', bg: '#1e2d4a' },
  SHIPPED:    { label: 'Expédiée',        color: '#a78bfa', bg: '#2e1a47' },
  DELIVERED:  { label: 'Livrée',          color: '#22c55e', bg: '#14532d' },
  CANCELLED:  { label: 'Annulée',         color: '#f87171', bg: '#3b1111' },
};

export default function DashboardPage() {
  const user   = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const router = useRouter();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Erreur chargement commandes'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const totalSpent = orders
    .filter(o => !['CANCELLED','REFUNDED'].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black">Bonjour, {user.name} 👋</h1>
            <p className="text-[#8b96b0] text-sm mt-1">{user.email}</p>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-red-400 hover:text-red-300 transition border border-red-900 rounded-xl px-4 py-2">
            Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
          {[
            { label: 'Commandes',      value: orders.length,             icon: '📦' },
            { label: 'Total dépensé',  value: `€${totalSpent.toFixed(0)}`, icon: '💰' },
            { label: 'Points fidélité',value: orders.length * 250,       icon: '⭐' },
            { label: 'Statut',         value: 'Premium',                 icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-xl font-black text-blue-400">{s.value}</div>
              <div className="text-xs text-[#8b96b0] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Orders */}
        <h2 className="text-lg font-bold mb-4">Mes commandes</h2>
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
          {loading ? (
            [1,2,3].map(i => <OrderRowSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-[#8b96b0] mb-6">Aucune commande pour l'instant</p>
              <Link href="/" className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                Découvrir nos produits
              </Link>
            </div>
          ) : orders.map(o => {
            const s = STATUS_LABELS[o.status] || STATUS_LABELS.PENDING;
            return (
              <div key={o.id} className="p-5 border-b border-[#1e2433] last:border-0">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <span className="font-bold text-blue-400 text-sm">#{o.id.slice(-8).toUpperCase()}</span>
                    <span className="text-[#8b96b0] text-xs ml-3">
                      {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ background: s.bg, color: s.color }}
                      className="text-xs font-bold px-3 py-1 rounded-full">{s.label}</span>
                    <span className="font-bold text-white">€{o.total}</span>
                  </div>
                </div>
                {o.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-3 mt-3 items-center">
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{item.product?.name}</p>
                      <p className="text-xs text-[#8b96b0]">{item.variant} · ×{item.quantity}</p>
                    </div>
                  </div>
                ))}
                {o.trackingNumber && (
                  <Link href={`/dashboard/orders/${o.id}`}
                    className="inline-block mt-3 text-xs text-blue-400 hover:underline">
                    Suivre ma commande →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}