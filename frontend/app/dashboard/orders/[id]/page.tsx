'use client';
import { useEffect, useState } from 'react';
import { useParams }  from 'next/navigation';
import Link           from 'next/link';
import Image          from 'next/image';
import api            from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const STEPS: OrderStatus[] = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];
const STEP_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  CONFIRMED:  'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED:    'Expédiée',
  DELIVERED:  'Livrée',
};
const STEP_DESC: Record<string, string> = {
  PENDING:    'Votre commande est en attente de confirmation.',
  CONFIRMED:  'Votre commande a été confirmée et validée.',
  PROCESSING: 'Votre colis est en cours de préparation.',
  SHIPPED:    'Votre colis est en route vers vous.',
  DELIVERED:  'Votre colis a été livré. Profitez-en !',
};

interface TrackingEvent {
  time:      string;
  context:   string;
  location?: string;
}

export default function OrderTrackingPage() {
  const { id }                          = useParams<{ id: string }>();
  const [order, setOrder]               = useState<Order | null>(null);
  const [tracking, setTracking]         = useState<TrackingEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = async () => {
    try {
      const [oRes, tRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/orders/${id}/tracking`),
      ]);
      setOrder(oRes.data);
      setTracking(tRes.data.events || []);
    } catch {
      toast.error('Commande introuvable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const refresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-5xl">📭</p>
      <p className="font-bold">Commande introuvable</p>
      <Link href="/dashboard" className="text-blue-400 text-sm">← Mon compte</Link>
    </div>
  );

  const curIdx     = STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="text-[#8b96b0] text-sm hover:text-white transition">← Mon compte</Link>
            <h1 className="text-2xl font-black mt-2">Commande #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-[#8b96b0] text-sm mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 border border-[#1e2433] rounded-xl px-4 py-2 text-sm text-[#8b96b0] hover:text-white hover:border-blue-600 transition bg-transparent cursor-pointer disabled:opacity-50">
            {refreshing ? <span className="w-3 h-3 border border-[#8b96b0] border-t-white rounded-full animate-spin" /> : '🔄'}
            Actualiser
          </button>
        </div>

        {/* ── Barre de progression ─────────────────────── */}
        {!isCancelled && (
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 mb-5">
            <h2 className="font-bold mb-6">Suivi de livraison</h2>
            <div className="flex items-center mb-6">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < curIdx  ? 'bg-blue-600 text-white' :
                      i === curIdx ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' :
                      'bg-[#1e2433] text-[#8b96b0]'
                    }`}>
                      {i < curIdx ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] text-center hidden sm:block ${i <= curIdx ? 'text-white' : 'text-[#8b96b0]'}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${i < curIdx ? 'bg-blue-600' : 'bg-[#1e2433]'}`} />
                  )}
                </div>
              ))}
            </div>
            {/* Description étape actuelle */}
            <div className="bg-[#161a22] border border-[#1e2433] rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-400 mb-1">{STEP_LABELS[order.status]}</p>
              <p className="text-sm text-[#8b96b0]">{STEP_DESC[order.status] ?? ''}</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-2xl p-5 mb-5">
            <p className="font-bold text-red-400">❌ Commande annulée</p>
            <p className="text-sm text-[#8b96b0] mt-1">Cette commande a été annulée. Si vous avez été débité, le remboursement sera effectué sous 5-7 jours.</p>
          </div>
        )}

        {/* ── Numéro de suivi ───────────────────────────── */}
        {order.trackingNumber && (
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-5 mb-5">
            <h2 className="font-bold mb-3">📍 Numéro de suivi</h2>
            <div className="flex items-center justify-between bg-[#161a22] rounded-xl p-4 gap-4">
              <span className="text-blue-400 font-mono text-sm break-all">{order.trackingNumber}</span>
              <button onClick={() => { navigator.clipboard.writeText(order.trackingNumber!); toast.success('Copié !'); }}
                className="text-xs text-[#8b96b0] hover:text-white border border-[#1e2433] rounded-lg px-3 py-1.5 bg-transparent cursor-pointer flex-shrink-0">
                Copier
              </button>
            </div>
          </div>
        )}

        {/* ── Événements de tracking ───────────────────── */}
        {tracking.length > 0 && (
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 mb-5">
            <h2 className="font-bold mb-5">Historique de livraison</h2>
            <div className="space-y-0">
              {tracking.map((event, i) => (
                <div key={i} className="flex gap-4 pb-5 relative">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-[#1e2433]'}`} />
                    {i < tracking.length - 1 && <div className="w-px flex-1 bg-[#1e2433] mt-1" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold">{event.context}</p>
                    {event.location && <p className="text-xs text-[#8b96b0] mt-0.5">📍 {event.location}</p>}
                    <p className="text-xs text-[#4b5563] mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!order.trackingNumber && !isCancelled && (
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 mb-5 text-center">
            <p className="text-3xl mb-3">📦</p>
            <p className="font-semibold mb-1">En cours de préparation</p>
            <p className="text-sm text-[#8b96b0]">Le numéro de suivi sera disponible dès l'expédition.</p>
          </div>
        )}

        {/* ── Articles commandés ────────────────────────── */}
        <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 mb-5">
          <h2 className="font-bold mb-4">Articles commandés</h2>
          {order.items?.map(item => (
            <div key={item.id} className="flex gap-4 py-3 border-b border-[#1e2433] last:border-0 items-center">
              {item.product?.images?.[0] && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.product?.name ?? 'Produit'}</p>
                {item.variant && <p className="text-xs text-[#8b96b0]">{item.variant}</p>}
                <p className="text-xs text-[#8b96b0]">Qté : {item.quantity}</p>
              </div>
              <p className="font-bold text-sm flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}

          {/* Totaux */}
          <div className="mt-4 pt-4 border-t border-[#1e2433] space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[#8b96b0]">Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-[#8b96b0]">Réduction</span><span className="text-green-400">-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-[#8b96b0]">Livraison</span><span className="text-green-400">Gratuite</span></div>
            <div className="flex justify-between font-black text-base pt-2 border-t border-[#1e2433]"><span>Total</span><span className="text-blue-400">{formatPrice(order.total)}</span></div>
          </div>
        </div>

        {/* ── Adresse de livraison ──────────────────────── */}
        {order.address && (
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6">
            <h2 className="font-bold mb-4">Adresse de livraison</h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{order.address.firstName} {order.address.lastName}</p>
              <p className="text-[#8b96b0]">{order.address.street}</p>
              <p className="text-[#8b96b0]">{order.address.postalCode} {order.address.city}</p>
              <p className="text-[#8b96b0]">{order.address.country}</p>
              {order.address.phone && <p className="text-[#8b96b0]">{order.address.phone}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}