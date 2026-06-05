'use client';
import { useEffect, useState } from 'react';
import { Elements }      from '@stripe/react-stripe-js';
import { loadStripe }    from '@stripe/stripe-js';
import { useCartStore }  from '@/store/cartStore';
import { useAuth }       from '@/hooks/useAuth';
import { CheckoutForm }  from '@/components/checkout/CheckoutForm';
import { Navbar }        from '@/components/ui/Navbar';
import { formatPrice }   from '@/lib/utils';
import api  from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface AddressForm {
  firstName:  string; lastName:   string;
  email:      string; phone:      string;
  street:     string; city:       string;
  postalCode: string; country:    string;
}

const EMPTY_ADDRESS: AddressForm = {
  firstName: '', lastName: '', email: '',
  phone: '', street: '', city: '',
  postalCode: '', country: 'FR',
};

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'CA', name: 'Canada' },
  { code: 'MA', name: 'Maroc' },
  { code: 'SN', name: 'Sénégal' },
];

export default function CheckoutPage() {
  const [step, setStep]             = useState<1 | 2>(1); // 1=adresse, 2=paiement
  const [address, setAddress]       = useState<AddressForm>(EMPTY_ADDRESS);
  const [clientSecret, setClientSecret] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [loadingIntent, setLoadingIntent] = useState(false);

  const { items }                       = useCartStore();
  const { isAuthenticated, isHydrated, user } = useAuth();
  const router                          = useRouter();

  // Pré-remplir l'email si connecté
  useEffect(() => {
    if (user?.email) setAddress(a => ({ ...a, email: user.email }));
    if (user?.name) {
      const [first, ...rest] = user.name.split(' ');
      setAddress(a => ({ ...a, firstName: first, lastName: rest.join(' ') }));
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace('/'); toast.error('Connectez-vous pour continuer'); }
    if (items.length === 0) { router.replace('/'); }
  }, [isHydrated, isAuthenticated, items]);

  // Valider l'adresse et passer à l'étape 2
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['firstName','lastName','email','street','city','postalCode','country'];
    const missing  = required.filter(k => !address[k as keyof AddressForm]);
    if (missing.length) { toast.error('Veuillez remplir tous les champs obligatoires'); return; }

    setLoadingIntent(true);
    try {
      const { data } = await api.post('/payments/create-intent', {
        items: items.map(i => ({ productId: i.id, price: i.price, quantity: i.quantity })),
      });
      setClientSecret(data.clientSecret);
      setOrderTotal(data.total);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur création paiement');
    } finally {
      setLoadingIntent(false);
    }
  };

  const cartTotal = orderTotal || items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!isHydrated) return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const inp = "w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600 transition placeholder-[#4b5563]";

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Breadcrumb étapes */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/cart" className="text-[#8b96b0] text-sm hover:text-white transition">Panier</Link>
          <span className="text-[#1e2433]">›</span>
          <span className={`text-sm font-semibold ${step === 1 ? 'text-white' : 'text-[#8b96b0]'}`}>Livraison</span>
          <span className="text-[#1e2433]">›</span>
          <span className={`text-sm font-semibold ${step === 2 ? 'text-white' : 'text-[#8b96b0]'}`}>Paiement</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* ── Étape 1 : Adresse & Infos client ────────── */}
          {step === 1 && (
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 sm:p-8">
              <h2 className="font-bold text-xl mb-6">📦 Adresse de livraison</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">

                {/* Nom & Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Prénom *</label>
                    <input value={address.firstName} onChange={e => setAddress(a => ({ ...a, firstName: e.target.value }))} placeholder="Jean" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Nom *</label>
                    <input value={address.lastName}  onChange={e => setAddress(a => ({ ...a, lastName: e.target.value }))} placeholder="Dupont" required className={inp} />
                  </div>
                </div>

                {/* Email & Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Email *</label>
                    <input type="email" value={address.email} onChange={e => setAddress(a => ({ ...a, email: e.target.value }))} placeholder="jean@exemple.com" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Téléphone</label>
                    <input type="tel" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+33 6 12 34 56 78" className={inp} />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="text-xs text-[#8b96b0] block mb-1.5">Adresse *</label>
                  <input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="12 rue de la Paix" required className={inp} />
                </div>

                {/* Ville & Code postal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Ville *</label>
                    <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Paris" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Code postal *</label>
                    <input value={address.postalCode} onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))} placeholder="75001" required className={inp} />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label className="text-xs text-[#8b96b0] block mb-1.5">Pays *</label>
                  <select value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))}
                    className="w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600 transition cursor-pointer">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={loadingIntent}
                  className="w-full py-4 rounded-xl font-bold text-white text-base border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition mt-2"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                  {loadingIntent
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Chargement...</span>
                    : 'Continuer vers le paiement →'
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Étape 2 : Paiement Stripe ─────────────── */}
          {step === 2 && (
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="text-[#8b96b0] hover:text-white transition text-sm bg-transparent border-none cursor-pointer">← Modifier ladresse</button>
              </div>

              {/* Adresse récapitulée */}
              <div className="bg-[#161a22] border border-[#1e2433] rounded-xl p-4 mb-6">
                <p className="text-xs text-[#8b96b0] mb-1">Livraison à</p>
                <p className="text-sm font-semibold">{address.firstName} {address.lastName}</p>
                <p className="text-xs text-[#8b96b0]">{address.street}, {address.postalCode} {address.city}</p>
                <p className="text-xs text-[#8b96b0]">{COUNTRIES.find(c => c.code === address.country)?.name}</p>
              </div>

              <h2 className="font-bold text-xl mb-6">🔒 Paiement sécurisé</h2>

              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{
                  clientSecret,
                  locale: 'fr',
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary:    '#2563eb',
                      colorBackground: '#161a22',
                      colorText:       '#f0f4ff',
                      borderRadius:    '12px',
                    },
                    rules: {
                      '.Input': { border: '1px solid #1e2433', padding: '12px 16px' },
                      '.Input:focus': { border: '1px solid #2563eb' },
                      '.Label': { color: '#8b96b0' },
                    },
                  },
                }}>
                  <CheckoutForm total={cartTotal} address={address} />
                </Elements>
              ) : (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* ── Récapitulatif ──────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6">
              <h2 className="font-bold mb-4">Votre commande</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      {item.variant && <p className="text-xs text-[#8b96b0]">{item.variant}</p>}
                      <p className="text-xs text-[#8b96b0]">Qté : {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#1e2433] pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[#8b96b0]">Livraison</span><span className="text-green-400 font-semibold">Gratuite</span></div>
                <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-blue-400">{formatPrice(cartTotal)}</span></div>
              </div>
            </div>
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-5 space-y-3">
              {[['🔒','Paiement sécurisé','SSL 256 bits'],['↩️','Retour gratuit','30 jours'],['🚀','Livraison rapide','3-7 jours']].map(([i,t,d]) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="text-lg">{i}</span>
                  <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-[#8b96b0]">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}