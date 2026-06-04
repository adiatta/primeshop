'use client';
import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore }  from '@/store/cartStore';
import { useAuth }       from '@/hooks/useAuth';
import { CheckoutForm }  from '@/components/checkout/CheckoutForm';
import { Navbar }        from '@/components/ui/Navbar';
import { formatPrice }   from '@/lib/utils';
import api  from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Initialiser Stripe une seule fois au module level
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [orderTotal, setOrderTotal]     = useState(0);
  const [status, setStatus]             = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg]         = useState('');

  const { items }                       = useCartStore();
  const { isAuthenticated, isHydrated } = useAuth();
  const router                          = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    // Redirection si non connecté
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour continuer');
      router.replace('/');
      return;
    }

    // Redirection si panier vide
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      router.replace('/');
      return;
    }

    // Vérifier la clé Stripe côté client
    if (!stripeKey) {
      setErrorMsg('Clé Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)');
      setStatus('error');
      return;
    }

    // Créer le PaymentIntent
    api.post('/payments/create-intent', {
      items: items.map(i => ({
        productId: i.id,
        price:     i.price,
        quantity:  i.quantity,
      })),
    })
      .then(({ data }) => {
        if (!data.clientSecret) throw new Error('clientSecret manquant dans la réponse');
        setClientSecret(data.clientSecret);
        setOrderTotal(data.total);
        setStatus('ready');
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err.message || 'Erreur création paiement';
        setErrorMsg(msg);
        setStatus('error');
        toast.error(msg);
      });
  }, [isHydrated, isAuthenticated]);

  // ── Écrans d'état ──────────────────────────────────────
  if (!isHydrated || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[#8b96b0] text-sm">Préparation du paiement...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-black text-white">Impossible d'initialiser le paiement</h1>
        <p className="text-[#8b96b0] text-sm max-w-sm">{errorMsg}</p>
        <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-5 text-left max-w-md w-full">
          <p className="text-xs font-bold text-blue-400 mb-3">🔧 Checklist développeur</p>
          <div className="space-y-2 text-xs text-[#8b96b0]">
            <p>1. <code className="text-blue-300">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> dans <code>.env.local</code></p>
            <p>2. <code className="text-blue-300">STRIPE_SECRET_KEY</code> dans Railway</p>
            <p>3. Backend Railway en ligne et accessible</p>
            <p>4. Route <code className="text-blue-300">POST /api/payments/create-intent</code> opérationnelle</p>
          </div>
        </div>
        <Link href="/" className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-white text-sm">
          ← Retour à la boutique
        </Link>
      </div>
    );
  }

  // ── Page principale ────────────────────────────────────
  const cartTotal = orderTotal || items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/cart" className="text-[#8b96b0] hover:text-white transition text-sm">← Panier</Link>
          <span className="text-[#1e2433]">/</span>
          <h1 className="text-2xl font-black">Finaliser la commande</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── Formulaire Stripe ─────────────────────── */}
          <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 sm:p-8">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span>🔒</span> Informations de paiement
            </h2>

            {clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: 'fr',
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary:         '#2563eb',
                      colorBackground:      '#161a22',
                      colorText:            '#f0f4ff',
                      colorTextSecondary:   '#8b96b0',
                      colorTextPlaceholder: '#4b5563',
                      colorDanger:          '#ef4444',
                      borderRadius:         '12px',
                      fontFamily:           'Inter, system-ui, sans-serif',
                      spacingUnit:          '4px',
                    },
                    rules: {
                      '.Input': {
                        border:     '1px solid #1e2433',
                        boxShadow:  'none',
                        padding:    '12px 16px',
                      },
                      '.Input:focus': {
                        border:    '1px solid #2563eb',
                        boxShadow: '0 0 0 3px rgba(37,99,235,0.15)',
                      },
                      '.Label': { color: '#8b96b0', fontSize: '13px', marginBottom: '6px' },
                      '.Tab':   { border: '1px solid #1e2433', background: '#161a22' },
                      '.Tab--selected': { borderColor: '#2563eb', background: 'rgba(37,99,235,0.1)' },
                    },
                  },
                }}
              >
                <CheckoutForm total={cartTotal} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* ── Récapitulatif commande ─────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24">

            {/* Articles */}
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6">
              <h2 className="font-bold mb-4">Votre commande</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="text-white">{item.name}</span>
                      {item.variant && <span className="text-[#8b96b0] text-xs block">{item.variant}</span>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-[#8b96b0] text-xs">×{item.quantity}</span>
                      <span className="text-white font-semibold ml-2">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#1e2433] mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b96b0]">Livraison</span>
                  <span className="text-green-400 font-semibold">Gratuite</span>
                </div>
                <div className="flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span className="text-blue-400">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            {/* Garanties */}
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-5 space-y-3">
              {[
                ['🔒', 'Paiement sécurisé', 'Chiffrement SSL 256 bits'],
                ['↩️', 'Retour gratuit',    '30 jours sans condition'],
                ['🚀', 'Livraison rapide',  '3 à 7 jours ouvrés'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-[#8b96b0]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Carte test — visible UNIQUEMENT en développement */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-yellow-400 mb-2">🧪 Mode test – carte Stripe</p>
                <p className="text-xs text-yellow-200/70 font-mono">4242 4242 4242 4242</p>
                <p className="text-xs text-yellow-200/70">Date : 12/34 · CVC : 123</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}