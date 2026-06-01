'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface TrackingEvent {
  time: string;
  context: string;
  location?: string;
}

const STATUS_STEPS = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation', SHIPPED: 'Expédiée', DELIVERED: 'Livrée',
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${id}`),
      api.get(`/orders/${id}/tracking`),
    ]).then(([orderRes, trackingRes]) => {
      setOrder(orderRes.data);
      setTracking(trackingRes.data.events || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );
  if (!order) return <p className="text-center text-gray-400 py-20">Commande introuvable.</p>;

  const curStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-black text-white mb-1">Commande #{order.id}</h1>
      <p className="text-gray-400 text-sm mb-8">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>

      {/* Progress */}
      <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white mb-6">Suivi de livraison</h2>
        <div className="flex items-center justify-between mb-2">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i <= curStep ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' : 'bg-[#1e2433] text-gray-500'}`}>
                {i < curStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs text-center hidden sm:block ${i <= curStep ? 'text-white' : 'text-gray-600'}`}>
                {STATUS_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex mt-1 gap-1">
          {STATUS_STEPS.slice(0, -1).map((_, i) => (
            <div key={i} className={`flex-1 h-0.5 rounded transition-all ${i < curStep ? 'bg-blue-600' : 'bg-[#1e2433]'}`} />
          ))}
        </div>
      </div>

      {/* Tracking number */}
      {order.trackingNumber && (
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-white mb-3">Numéro de suivi</h2>
          <div className="flex items-center justify-between bg-[#0a0c10] rounded-xl p-4">
            <span className="text-blue-400 font-mono text-sm">{order.trackingNumber}</span>
            <button onClick={() => navigator.clipboard.writeText(order.trackingNumber)}
              className="text-xs text-gray-400 hover:text-white transition">
              Copier
            </button>
          </div>
        </div>
      )}

      {/* Events timeline */}
      {tracking.length > 0 && (
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-white mb-4">Historique de livraison</h2>
          <div className="space-y-0">
            {tracking.map((event, i) => (
              <div key={i} className="flex gap-4 pb-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-[#1e2433]'}`} />
                  {i < tracking.length - 1 && <div className="w-0.5 flex-1 bg-[#1e2433] mt-1" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{event.context}</p>
                  {event.location && <p className="text-gray-500 text-xs mt-0.5">📍 {event.location}</p>}
                  <p className="text-gray-600 text-xs mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!order.trackingNumber && order.status !== 'DELIVERED' && (
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-400 text-sm">Votre commande est en cours de préparation. Le numéro de suivi sera disponible dès l'expédition.</p>
        </div>
      )}

      {/* Order items */}
      <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
        <h2 className="font-bold text-white mb-4">Articles commandés</h2>
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex gap-3 py-3 border-b border-[#1e2433] last:border-0">
            {item.product?.images?.[0] && (
              <img src={item.product.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">{item.product?.name}</p>
              <p className="text-gray-500 text-xs">{item.variant} · ×{item.quantity}</p>
            </div>
            <p className="text-white font-bold text-sm">€{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="flex justify-between pt-4 font-bold text-white">
          <span>Total</span>
          <span>€{order.total?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}