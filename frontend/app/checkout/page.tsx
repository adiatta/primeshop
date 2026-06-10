'use client';
import { useEffect, useState } from 'react';
import { Elements }      from '@stripe/react-stripe-js';
import { loadStripe }    from '@stripe/stripe-js';
import { useCartStore }  from '@/store/cartStore';
import { useAuth }       from '@/hooks/useAuth';
import { CheckoutForm }  from '@/components/checkout/CheckoutForm';
import { Navbar }        from '@/components/ui/Navbar';
import { formatPrice }   from '@/lib/utils';
import api   from '@/lib/api';
import Link  from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface AddressForm {
  firstName: string; lastName:   string; email:      string;
  phone:     string; street:     string; city:       string;
  postalCode:string; country:    string;
}
const EMPTY: AddressForm = { firstName:'',lastName:'',email:'',phone:'',street:'',city:'',postalCode:'',country:'FR' };
const COUNTRIES = [
  {code:'FR',name:'France'},{code:'BE',name:'Belgique'},
  {code:'CH',name:'Suisse'},{code:'LU',name:'Luxembourg'},
  {code:'MA',name:'Maroc'},{code:'SN',name:'Sénégal'},
  {code:'CA',name:'Canada'},
];

export default function CheckoutPage() {
  const [step, setStep]               = useState<1|2>(1);
  const [address, setAddress]         = useState<AddressForm>(EMPTY);
  const [clientSecret, setClientSecret] = useState('');
  const [orderTotal, setOrderTotal]   = useState(0);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState('');

  const { items }                           = useCartStore();
  const { isAuthenticated, isHydrated, user } = useAuth();
  const router                              = useRouter();

  // Pré-remplir avec les infos du compte
  useEffect(() => {
    if (!user) return;
    const [first='', ...rest] = (user.name ?? '').split(' ');
    setAddress(a => ({
      ...a,
      firstName: first,
      lastName:  rest.join(' '),
      email:     user.email ?? '',
    }));
  }, [user]);

  // Garde — redirige si non connecté ou panier vide
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace('/'); return; }
    if (items.length === 0) { router.replace('/'); }
  }, [isHydrated, isAuthenticated, items.length]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentLoading(true);
    setIntentError('');

    try {
      const { data } = await api.post('/payments/create-intent', {
        items: items.map(i => ({
          productId: i.id,
          price:     i.price,
          quantity:  i.quantity,
        })),
      });

      if (!data.clientSecret) throw new Error('Réponse invalide du serveur');

      setClientSecret(data.clientSecret);
      setOrderTotal(data.total);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Erreur serveur';
      setIntentError(msg);
      toast.error(msg);
    } finally {
      setIntentLoading(false);
    }
  };

  const cartTotal = orderTotal || items.reduce((s, i) => s + i.price * i.quantity, 0);
  const inp = "w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600 transition";

  if (!isHydrated) return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Étapes */}
        <div className="flex items-center gap-3 mb-10 text-sm">
          <Link href="/cart" className="text-[#8b96b0] hover:text-white transition">← Panier</Link>
          <span className="text-[#1e2433]">›</span>
          <button onClick={() => step === 2 && setStep(1)} className={`font-semibold bg-transparent border-none cursor-pointer ${step===1?'text-white':'text-blue-400 underline'}`}>
            Livraison
          </button>
          <span className="text-[#1e2433]">›</span>
          <span className={`font-semibold ${step===2?'text-white':'text-[#8b96b0]'}`}>Paiement</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* ── ÉTAPE 1 : Adresse ───────────────────── */}
          {step === 1 && (
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 sm:p-8">
              <h2 className="font-bold text-xl mb-6">📦 Informations de livraison</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Prénom *</label>
                    <input value={address.firstName} onChange={e=>setAddress(a=>({...a,firstName:e.target.value}))} placeholder="Jean" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Nom *</label>
                    <input value={address.lastName}  onChange={e=>setAddress(a=>({...a,lastName:e.target.value}))}  placeholder="Dupont" required className={inp} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Email *</label>
                    <input type="email" value={address.email} onChange={e=>setAddress(a=>({...a,email:e.target.value}))} placeholder="jean@exemple.com" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Téléphone</label>
                    <input type="tel" value={address.phone} onChange={e=>setAddress(a=>({...a,phone:e.target.value}))} placeholder="+33 6 00 00 00 00" className={inp} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8b96b0] block mb-1.5">Adresse *</label>
                  <input value={address.street} onChange={e=>setAddress(a=>({...a,street:e.target.value}))} placeholder="12 rue de la Paix" required className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Ville *</label>
                    <input value={address.city} onChange={e=>setAddress(a=>({...a,city:e.target.value}))} placeholder="Paris" required className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-1.5">Code postal *</label>
                    <input value={address.postalCode} onChange={e=>setAddress(a=>({...a,postalCode:e.target.value}))} placeholder="75001" required className={inp} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#8b96b0] block mb-1.5">Pays *</label>
                  <select value={address.country} onChange={e=>setAddress(a=>({...a,country:e.target.value}))}
                    className="w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600 transition cursor-pointer">
                    {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>

                {intentError && (
                  <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-4">
                    <p className="text-red-400 text-sm font-semibold">❌ {intentError}</p>
                    <p className="text-xs text-[#8b96b0] mt-1">Vérifiez que le backend Railway est en ligne et que STRIPE_SECRET_KEY est configurée.</p>
                  </div>
                )}

                <button type="submit" disabled={intentLoading}
                  className="w-full py-4 rounded-xl font-bold text-white border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                  {intentLoading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Initialisation du paiement...
                      </span>
                    : 'Continuer vers le paiement →'
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── ÉTAPE 2 : Paiement ──────────────────── */}
          {step === 2 && (
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6 sm:p-8">
              {/* Adresse résumée */}
              <div className="flex items-start justify-between mb-6 gap-4">
                <div className="bg-[#161a22] border border-[#1e2433] rounded-xl p-4 flex-1">
                  <p className="text-xs text-[#8b96b0] mb-1">📦 Livraison à</p>
                  <p className="text-sm font-semibold">{address.firstName} {address.lastName}</p>
                  <p className="text-xs text-[#8b96b0]">{address.street}, {address.postalCode} {address.city}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-blue-400 hover:underline bg-transparent border-none cursor-pointer flex-shrink-0 mt-2">
                  Modifier
                </button>
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
                      '.Input':        { border: '1px solid #1e2433', padding: '12px 16px' },
                      '.Input:focus':  { border: '1px solid #2563eb' },
                      '.Label':        { color: '#8b96b0' },
                    },
                  },
                }}>
                  <CheckoutForm total={cartTotal} address={address} />
                </Elements>
              ) : (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* ── Récapitulatif ────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-6">
              <h2 className="font-bold mb-4">Votre commande</h2>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-[#1e2433] last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.variant && <p className="text-xs text-[#8b96b0]">{item.variant}</p>}
                    <p className="text-xs text-[#8b96b0]">× {item.quantity}</p>
                  </div>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-[#1e2433] space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-[#8b96b0]">Livraison</span><span className="text-green-400">Gratuite</span></div>
                <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-blue-400">{formatPrice(cartTotal)}</span></div>
              </div>
            </div>
            <div className="bg-[#111318] border border-[#1e2433] rounded-2xl p-5 space-y-3">
              {[['🔒','Paiement sécurisé','SSL 256 bits'],['↩️','Retour gratuit','30 jours'],['🚀','Livraison','3-7 jours']].map(([i,t,d])=>(
                <div key={t} className="flex items-start gap-3"><span>{i}</span><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-[#8b96b0]">{d}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}