'use client';
import { useState }       from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCartStore }   from '@/store/cartStore';
import { useAuthStore }   from '@/store/authStore';
import { useRouter }      from 'next/navigation';
import { formatPrice }    from '@/lib/utils';
import api   from '@/lib/api';
import toast from 'react-hot-toast';

interface AddressForm {
  firstName: string; lastName:   string;
  email:     string; phone:      string;
  street:    string; city:       string;
  postalCode:string; country:    string;
}

interface Props {
  total:   number;
  address: AddressForm;
}

export function CheckoutForm({ total, address }: Props) {
  const stripe   = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCartStore();
  const user   = useAuthStore(s => s.user);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const tid = toast.loading('Vérification du paiement...');

    // 1. Valider le formulaire Stripe
    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message ?? 'Erreur formulaire', { id: tid });
      setLoading(false);
      return;
    }

    // 2. Confirmer le paiement Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:             `${window.location.origin}/dashboard`,
        payment_method_data:    {
          billing_details: {
            name:  `${address.firstName} ${address.lastName}`,
            email: address.email,
            phone: address.phone,
            address: {
              line1:       address.street,
              city:        address.city,
              postal_code: address.postalCode,
              country:     address.country,
            },
          },
        },
      },
      redirect: 'if_required', // ← ne redirige pas si pas nécessaire
    });

    if (error) {
      toast.error(error.message ?? 'Paiement refusé', { id: tid });
      setLoading(false);
      return;
    }

    // 3. ✅ Paiement réussi — créer la commande en base
    toast.loading('Création de votre commande...', { id: tid });

    try {
      await api.post('/orders', {
        stripePaymentId: paymentIntent?.id,
        items: items.map(i => ({
          productId: i.id,
          quantity:  i.quantity,
          price:     i.price,
          variant:   i.variant ?? null,
        })),
        // Adresse de livraison
        address: {
          firstName:  address.firstName,
          lastName:   address.lastName,
          street:     address.street,
          city:       address.city,
          postalCode: address.postalCode,
          country:    address.country,
          phone:      address.phone,
        },
        subtotal: total,
        total,
        shipping: 0,
        discount: 0,
      });

      toast.success('Commande confirmée ! 🎉', { id: tid });
      clearCart();
      router.push('/dashboard?payment=success');
    } catch (err: any) {
      // Le paiement a réussi mais la commande n'a pas pu être créée
      // On redirige quand même et on log l'erreur
      console.error('Order creation error:', err);
      toast.success('Paiement réussi ! Commande en cours de traitement.', { id: tid });
      clearCart();
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
          fields: { billingDetails: 'auto' }, // on envoie les détails manuellement
        }}
      />
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full py-4 rounded-xl font-bold text-white text-base border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        {loading
          ? <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          : `🔒 Payer ${formatPrice(total)}`
        }
      </button>
      <p className="text-center text-xs text-[#8b96b0]">
        Chiffrement SSL · Aucune donnée bancaire stockée
      </p>
    </form>
  );
}