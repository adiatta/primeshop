'use client';
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCartStore }  from '@/store/cartStore';
import { useRouter }     from 'next/navigation';
import { formatPrice }   from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props { total: number; }

export function CheckoutForm({ total }: Props) {
  const stripe    = useStripe();
  const elements  = useElements();
  const clearCart = useCartStore(s => s.clearCart);
  const router    = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const loadingToast = toast.loading('Traitement du paiement...');

    // Valider le formulaire Stripe
    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message ?? 'Erreur formulaire', { id: loadingToast });
      setLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: `${window.location.origin}/success`,
    payment_method_data: {
      billing_details: {
        address: {
          country: 'FR',
        },
      },
    },
  },
});

    if (error) {
      toast.error(error.message ?? 'Paiement refusé', { id: loadingToast });
      setLoading(false);
    } else {
      toast.success('Paiement réussi ! 🎉', { id: loadingToast });
      clearCart();
      router.push('/dashboard?payment=success');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PaymentElement Stripe — rendu automatiquement */}
      <PaymentElement
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
          },
          fields: {
            billingDetails: {
              name:    'auto',
              email:   'auto',
             address: 'auto', // simplifier le formulaire
            },
          },
        }}
      />

      {/* Bouton payer */}
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full py-4 rounded-xl font-bold text-white text-base border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
      >
        {loading
          ? <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          : `🔒 Payer ${formatPrice(total)}`
        }
      </button>

      <p className="text-center text-xs text-[#8b96b0]">
        Vos données bancaires sont chiffrées et sécurisées par Stripe.
        PrimeShop ne stocke jamais vos informations de carte.
      </p>
    </form>
  );
}