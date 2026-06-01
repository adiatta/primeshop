'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import toast from 'react-hot-toast';

const PRODUCT = {
  id:           'primelens-pro-x1-id',
  slug:         'primelens-pro-x1',
  name:         'PrimeLens Pro X1',
  tagline:      'La caméra de poche qui redéfinit la perfection.',
  price:        249,
  originalPrice:399,
  rating:       4.9,
  reviews:      2847,
  sold:         12400,
  stock:        47,
  images: [
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  ],
  features: [
    { icon: '📷', title: '200MP Ultra HD',  desc: 'Capteur nouvelle génération pour des détails époustouflants' },
    { icon: '🎬', title: '8K 60fps',         desc: 'Vidéo professionnelle dans votre poche' },
    { icon: '🌙', title: 'Night Mode AI',    desc: 'Intelligence artificielle pour des photos de nuit parfaites' },
    { icon: '⚡', title: 'Charge 5min',      desc: 'Batterie 6000mAh à 80% en 5 minutes' },
    { icon: '🛡️', title: 'IP68 Certifié',   desc: 'Résistant à l\'eau jusqu\'à 10 mètres' },
    { icon: '🔗', title: 'WiFi 7 + 5G',      desc: 'Transfert à la vitesse de la lumière' },
  ],
  specs: [
    ['Capteur',       '1/1.3" CMOS 200MP'],
    ['Vidéo',         '8K@60fps / 4K@120fps'],
    ['Stabilisation', 'OIS 6 axes + EIS'],
    ['Batterie',      '6000mAh / 150W'],
    ['Stockage',      '256GB / 512GB / 1TB'],
    ['Connectivité',  'WiFi 7, BT 5.4, 5G'],
    ['Résistance',    'IP68 (10m/30min)'],
    ['Poids',         '198g'],
  ],
  colors:       ['#1a1a2e', '#2d3748', '#c0a882'],
  colorNames:   ['Midnight Black', 'Storm Gray', 'Desert Gold'],
  storageOptions: ['256GB', '512GB', '1TB'],
};

const REVIEWS = [
  { name: 'Alexandre M.', initials: 'AM', rating: 5, date: '12 mai 2026', text: 'Absolument bluffant. Les photos de nuit sont dignes d\'un reflex professionnel.', verified: true },
  { name: 'Sofia L.',     initials: 'SL', rating: 5, date: '8 mai 2026',  text: 'Livraison ultra rapide, emballage premium, produit encore plus beau en vrai.', verified: true },
  { name: 'Thomas D.',    initials: 'TD', rating: 5, date: '3 mai 2026',  text: 'J\'hésitais longtemps. Finalement sauté le pas et je ne regrette absolument pas.', verified: true },
  { name: 'Camille R.',   initials: 'CR', rating: 4, date: '28 avr.',     text: 'Très bon produit globalement. L\'interface est fluide, les photos magnifiques.', verified: true },
  { name: 'Lucas B.',     initials: 'LB', rating: 5, date: '21 avr.',     text: 'Meilleur achat de l\'année. La recharge en 5 minutes c\'est révolutionnaire.', verified: true },
  { name: 'Emma V.',      initials: 'EV', rating: 5, date: '15 avr.',     text: 'Design sublime, photos époustouflantes, service client au top.', verified: true },
];

const FAQS = [
  { q: 'Quelle est la politique de retour ?',       a: 'Retour gratuit sous 30 jours. Satisfait ou remboursé sans condition.' },
  { q: 'Quand vais-je recevoir ma commande ?',      a: 'Livraison express 3-7 jours ouvrés. Suivi en temps réel inclus.' },
  { q: 'Le produit est-il garanti ?',               a: 'Garantie 2 ans constructeur incluse.' },
  { q: 'Paiement en plusieurs fois disponible ?',   a: 'Oui, 3x ou 4x sans frais via Stripe.' },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? '#fbbf24' : '#374151' }}>★</span>
      ))}
    </span>
  );
}

export default function HomePage() {
  const [activeImg, setActiveImg]     = useState(0);
  const [selColor, setSelColor]       = useState(0);
  const [selStorage, setSelStorage]   = useState(0);
  const [qty, setQty]                 = useState(1);
  const [promoCode, setPromoCode]     = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [openFaq, setOpenFaq]         = useState<number|null>(null);
  const [activeTab, setActiveTab]     = useState('features');
  const [navScrolled, setNavScrolled] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const productRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const finalPrice = promoApplied ? Math.round(PRODUCT.price * 0.85) : PRODUCT.price;

  const handleAddToCart = () => {
    addItem({
      id:      `${PRODUCT.id}-${selColor}-${selStorage}`,
      name:    PRODUCT.name,
      price:   finalPrice,
      quantity: qty,
      image:   PRODUCT.images[0],
      variant: `${PRODUCT.colorNames[selColor]} · ${PRODUCT.storageOptions[selStorage]}`,
    });
    toast.success(`${PRODUCT.name} ajouté au panier 🛒`);
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'PRIME15') {
      setPromoApplied(true);
      toast.success('Code promo appliqué : -15% 🎁');
    } else {
      toast.error('Code invalide');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f0f4ff]">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(37,99,235,0.12), transparent)' }} />

        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
            ✦ Nouveau · Édition 2026 · Livraison offerte
          </div>

          <h1 className="text-5xl sm:text-7xl font-black leading-none tracking-tight mb-5"
            style={{ background: 'linear-gradient(135deg,#f0f4ff,#93c5fd,#2563eb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {PRODUCT.name}
          </h1>

          <p className="text-lg sm:text-2xl text-[#8b96b0] max-w-xl mx-auto mb-4">{PRODUCT.tagline}</p>

          <div className="flex items-center justify-center gap-4 text-sm flex-wrap mb-10">
            <div className="flex items-center gap-1.5">
              <Stars rating={PRODUCT.rating} size={15} />
              <span className="font-bold">{PRODUCT.rating}</span>
              <span className="text-[#8b96b0]">({PRODUCT.reviews.toLocaleString()} avis)</span>
            </div>
            <span className="text-[#1e2433]">|</span>
            <span className="text-[#8b96b0]">🔥 {PRODUCT.sold.toLocaleString()} vendus</span>
            <span className="text-[#1e2433]">|</span>
            <span className="text-green-400">✓ En stock · {PRODUCT.stock} restants</span>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => productRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-xl font-bold text-base text-white animate-glow transition"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              Commander maintenant →
            </button>
            <button
              onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-5 rounded-xl font-bold text-base text-[#f0f4ff] border border-[#1e2433] hover:border-blue-600 transition">
              Voir les avis ★
            </button>
          </div>
        </div>

        {/* Hero image */}
        <div className="mt-16 animate-float">
          <div className="relative w-[min(500px,90vw)] aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(37,99,235,0.25)] border border-blue-600/10">
            <Image src={PRODUCT.images[0]} alt={PRODUCT.name} fill className="object-cover" priority />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#8b96b0] text-xs">
          <span>Défiler</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#1e2433] to-transparent" />
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="bg-[#111318] border-y border-[#1e2433] py-7">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
          {[
            ['🚀','Livraison express','3-7 jours'],
            ['🔒','Paiement sécurisé','Stripe SSL'],
            ['↩️','Retour gratuit','30 jours'],
            ['🏆','Garantie','2 ans'],
            ['⭐','Satisfaction','98.7%'],
          ].map(([icon, label, val]) => (
            <div key={label}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-sm font-bold">{label}</div>
              <div className="text-xs text-blue-400">{val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT SECTION ────────────────────────────────── */}
      <section ref={productRef} className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#161a22] mb-3">
              <Image src={PRODUCT.images[activeImg]} alt={PRODUCT.name} fill className="object-cover transition-all duration-300" />
              <button
                onClick={() => toast.success('Ajouté aux favoris ❤️')}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-lg border-none">
                🤍
              </button>
              {promoApplied && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-15%</span>
              )}
            </div>
            <div className="flex gap-2">
              {PRODUCT.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className="flex-1 aspect-square rounded-xl overflow-hidden border-2 transition"
                  style={{ borderColor: activeImg === i ? '#2563eb' : 'transparent' }}>
                  <Image src={img} alt="" width={80} height={80} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Gadget Tech · Édition 2026</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">{PRODUCT.name}</h2>

            <div className="flex items-center gap-3 text-sm mb-6 flex-wrap">
              <Stars rating={PRODUCT.rating} />
              <span className="font-bold">{PRODUCT.rating}</span>
              <span className="text-[#8b96b0]">({PRODUCT.reviews.toLocaleString()} avis)</span>
              <span className="text-green-400">· {PRODUCT.stock} en stock</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 bg-[#161a22] border border-[#1e2433] rounded-xl px-5 py-4 mb-6">
              <span className="text-4xl font-black">{finalPrice}€</span>
              {promoApplied && <span className="text-xl text-[#8b96b0] line-through">{PRODUCT.price}€</span>}
              <span className="text-xl text-[#8b96b0] line-through">{PRODUCT.originalPrice}€</span>
              <span className="text-xs font-bold bg-red-900 text-red-300 px-2 py-1 rounded">
                -{Math.round((1 - PRODUCT.price / PRODUCT.originalPrice) * 100)}%
              </span>
            </div>

            {/* Color */}
            <div className="mb-5">
              <div className="text-xs text-[#8b96b0] font-semibold mb-2">
                Couleur · <span className="text-white">{PRODUCT.colorNames[selColor]}</span>
              </div>
              <div className="flex gap-2">
                {PRODUCT.colors.map((c, i) => (
                  <button key={i} onClick={() => setSelColor(i)}
                    className="w-8 h-8 rounded-full transition"
                    style={{ background: c, border: `3px solid ${selColor === i ? '#2563eb' : 'transparent'}`, boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            </div>

            {/* Storage */}
            <div className="mb-5">
              <div className="text-xs text-[#8b96b0] font-semibold mb-2">Stockage</div>
              <div className="flex gap-2">
                {PRODUCT.storageOptions.map((s, i) => (
                  <button key={s} onClick={() => setSelStorage(i)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{ border: `1.5px solid ${selStorage === i ? '#2563eb' : '#1e2433'}`, background: selStorage === i ? 'rgba(37,99,235,0.1)' : 'transparent', color: selStorage === i ? '#60a5fa' : '#f0f4ff' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty */}
            <div className="mb-5">
              <div className="text-xs text-[#8b96b0] font-semibold mb-2">Quantité</div>
              <div className="flex items-center border border-[#1e2433] rounded-xl w-fit bg-[#161a22]">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2.5 text-lg text-white bg-transparent border-none border-r border-[#1e2433]">−</button>
                <span className="px-5 font-bold">{qty}</span>
                <button onClick={() => setQty(q => Math.min(PRODUCT.stock, q + 1))} className="px-4 py-2.5 text-lg text-white bg-transparent border-none border-l border-[#1e2433]">+</button>
              </div>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-6">
              <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
                placeholder="Code promo (ex: PRIME15)"
                className="flex-1 bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition" />
              <button onClick={applyPromo}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: promoApplied ? '#166534' : '#161a22', border: `1px solid ${promoApplied ? '#22c55e' : '#1e2433'}`, color: promoApplied ? '#4ade80' : '#f0f4ff' }}>
                {promoApplied ? '✓' : 'Appliquer'}
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <button onClick={handleAddToCart}
                className="w-full py-5 rounded-xl font-bold text-base text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                🛒 Ajouter au panier · {finalPrice * qty}€
              </button>
              <Link href="/checkout"
                className="w-full py-4 rounded-xl font-bold text-base text-center text-white border border-[#1e2433] hover:border-blue-600 transition">
                ⚡ Acheter maintenant
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-[#8b96b0]">
              {['🔒 Paiement sécurisé', '↩️ Retour 30j', '🚀 Livraison 3-7j', '🏆 Garanti 2 ans'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex gap-1 border-b border-[#1e2433] mb-10 overflow-x-auto">
          {[['features','✦ Caractéristiques'],['specs','📋 Spécifications'],['shipping','🚚 Livraison']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px"
              style={{ borderColor: activeTab === id ? '#2563eb' : 'transparent', color: activeTab === id ? '#2563eb' : '#8b96b0' }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'features' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCT.features.map(f => (
              <div key={f.title} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 hover:border-blue-600/40 transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="font-bold mb-1">{f.title}</div>
                <div className="text-sm text-[#8b96b0] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-lg">
            {PRODUCT.specs.map(([k, v]) => (
              <div key={k} className="flex justify-between py-3.5 border-b border-[#1e2433] text-sm">
                <span className="text-[#8b96b0]">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[['🇫🇷 France','3-5 jours','Gratuite'],['🇪🇺 Europe','5-8 jours','4.99€'],['🌍 International','7-14 jours','9.99€']].map(([z,d,p]) => (
              <div key={z} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">{z.split(' ')[0]}</div>
                <div className="font-bold mb-1">{z.split(' ').slice(1).join(' ')}</div>
                <div className="text-sm text-[#8b96b0] mb-2">{d}</div>
                <div className={`font-bold ${p === 'Gratuite' ? 'text-green-400' : 'text-blue-400'}`}>{p}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REVIEWS ────────────────────────────────────────── */}
      <section id="reviews" className="bg-[#111318] border-t border-[#1e2433] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Ce que disent nos clients</h2>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Stars rating={PRODUCT.rating} size={20} />
              <span className="text-4xl font-black">{PRODUCT.rating}</span>
              <span className="text-[#8b96b0]">sur 5 · {PRODUCT.reviews.toLocaleString()} avis vérifiés</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      {r.initials}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{r.name}</div>
                      <div className="text-xs text-[#8b96b0]">{r.date}</div>
                    </div>
                  </div>
                  {r.verified && (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">✓ Vérifié</span>
                  )}
                </div>
                <Stars rating={r.rating} size={13} />
                <p className="mt-2 text-sm text-[#8b96b0] leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-10">Questions fréquentes</h2>
        {FAQS.map((f, i) => (
          <div key={i} className="mb-3 rounded-xl overflow-hidden border transition"
            style={{ borderColor: openFaq === i ? '#2563eb' : '#1e2433', background: '#161a22' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex justify-between items-center px-6 py-5 text-left font-semibold text-sm bg-transparent border-none text-white cursor-pointer">
              {f.q}
              <span className="text-blue-400 text-xl transition-transform"
                style={{ display: 'inline-block', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {openFaq === i && (
              <div className="px-6 pb-5 text-sm text-[#8b96b0] leading-relaxed">{f.a}</div>
            )}
          </div>
        ))}
      </section>

      {/* ── STICKY BUY BAR ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1e2433] px-5 py-3 flex items-center gap-4"
        style={{ background: 'rgba(10,12,16,0.95)', backdropFilter: 'blur(20px)' }}>
        <div>
          <div className="text-lg font-black">{finalPrice}€</div>
          <div className="text-xs text-[#8b96b0]">Livraison offerte</div>
        </div>
        <button onClick={handleAddToCart}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          Ajouter au panier
        </button>
      </div>

      <div className="pb-20">
        <Footer />
      </div>
    </div>
  );
}