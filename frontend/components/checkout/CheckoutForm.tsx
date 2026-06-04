'use client';
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cartStore';
import { useRouter }    from 'next/navigation';
import toast from 'react-hot-toast';

export function CheckoutForm() {
  const stripe   = useStripe();
  const elements = useElements();
  const clearCart = useCartStore(s => s.clearCart);
  const router    = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (error) {
      toast.error(error.message ?? 'Erreur lors du paiement');
    } else {
      clearCart();
      toast.success('Paiement réussi ! 🎉');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
        <h2 className="font-bold text-white mb-5 text-lg">Informations de paiement</h2>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-4 rounded-xl font-bold text-white text-base border-none cursor-pointer disabled:opacity-50 transition hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {loading ? 'Traitement en cours...' : '🔒 Payer maintenant'}
      </button>
      <p className="text-center text-xs text-[#8b96b0]">
        Paiement sécurisé · Crypté SSL · Aucune donnée bancaire stockée
      </p>
    </form>
  );
}