'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard/orders` },
    });
    if (error) { setError(error.message || 'Erreur paiement'); setLoading(false); }
    else clearCart();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50">
        {loading ? 'Traitement...' : 'Payer maintenant'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const { items } = useCartStore();

  useState(() => {
    api.post('/payments/create-intent', { items }).then(({ data }) => setClientSecret(data.clientSecret));
  });

  return clientSecret ? (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
      <div className="max-w-lg mx-auto py-20 px-4">
        <h1 className="text-2xl font-bold mb-8 text-white">Finaliser la commande</h1>
        <CheckoutForm />
      </div>
    </Elements>
  ) : <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;
}