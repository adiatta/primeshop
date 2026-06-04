'use client';
import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cartStore';
import { useAuth }      from '@/hooks/useAuth';
import { getStripe }    from '@/lib/stripe';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Navbar }       from '@/components/ui/Navbar';
import { Loader }       from '@/components/ui/Loader';
import { formatPrice }  from '@/lib/utils';
import api  from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const { items }          = useCartStore();
  const { isAuthenticated, isHydrated } = useAuth();
  const router             = useRouter();

  // Rediriger si non connecté ou panier vide
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace('/'); toast.error('Connectez-vous pour payer'); return; }
    if (items.length === 0) { router.replace('/'); toast.error('Votre panier est vide'); return; }
  }, [isHydrated, isAuthenticated, items]);

  // ✅ useEffect — pas useState — pour fetcher le clientSecret
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;

    setLoading(true);
    api.post('/payments/create-intent', {
      items: items.map(i => ({ price: i.price, quantity: i.quantity, productId: i.id })),
    })
      .then(({ data }) => {
        setClientSecret(data.clientSecret);
        setTotal(data.total);
      })
      .catch(err => {
        const msg = err?.response?.data?.error || 'Impossible de créer la session de paiement';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // Loading
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader text="Préparation du paiement..." />
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-4 text-white px-6">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold">Erreur de paiement</h1>
        <p className="text-[#8b96b0] text-center">{error}</p>
        <p className="text-xs text-[#8b96b0]">Vérifiez que STRIPE_SECRET_KEY est configurée sur Railway</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-white">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-black mb-10">Finaliser la commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Stripe form */}
          <div>
            {clientSecret ? (
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary:    '#2563eb',
                      colorBackground: '#161a22',
                      colorText:       '#f0f4ff',
                      colorDanger:     '#ef4444',
                      borderRadius:    '12px',
                    },
                  },
                }}
              >
                <CheckoutForm />
              </Elements>
            ) : (
              <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-8 text-center">
                <p className="text-[#8b96b0]">Chargement du formulaire de paiement...</p>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div>
            <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-5">Récapitulatif</h2>

              {/* Articles */}
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#8b96b0]">{item.name} × {item.quantity}</span>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#1e2433] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b96b0]">Livraison</span>
                  <span className="text-green-400 font-semibold">Gratuite</span>
                </div>
                <div className="flex justify-between font-black text-xl mt-2">
                  <span>Total</span>
                  <span className="text-blue-400">{formatPrice(total || items.reduce((s,i) => s + i.price * i.quantity, 0))}</span>
                </div>
              </div>

              {/* Garanties */}
              <div className="mt-5 pt-4 border-t border-[#1e2433] space-y-2">
                {['🔒 Paiement chiffré SSL', '↩️ Retour gratuit 30 jours', '🏆 Garantie 2 ans'].map(t => (
                  <p key={t} className="text-xs text-[#8b96b0]">{t}</p>
                ))}
              </div>

              {/* Carte test Stripe */}
              <div className="mt-4 bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-400 mb-2">🧪 Carte de test Stripe</p>
                <p className="text-xs text-[#8b96b0] font-mono">4242 4242 4242 4242</p>
                <p className="text-xs text-[#8b96b0]">Date : 12/34 · CVC : 123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}