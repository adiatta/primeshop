'use client';
import { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { formatPrice, discountPercent } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Props { product: Product; }

export function ProductInfo({ product }: Props) {
  const [qty, setQty]               = useState(1);
  const [promoCode, setPromoCode]   = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount]     = useState(0);
  const { addToCart } = useCart();

  const finalPrice = Math.round(product.price * (1 - discount / 100));

  const applyPromo = async () => {
    try {
      const { data } = await api.post('/promo/validate', { code: promoCode });
      setDiscount(data.discount);
      setPromoApplied(true);
      toast.success(`Code appliqué : -${data.discount}% 🎁`);
    } catch {
      toast.error('Code invalide ou expiré');
    }
  };

  const handleAdd = () => {
    addToCart({
      id:       product.id + (promoApplied ? '-promo' : ''),
      name:     product.name,
      price:    finalPrice,
      quantity: qty,
      image:    product.images[0] ?? '',
    });
  };

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">{product.category}</p>
      <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight text-white">{product.name}</h1>

      {/* Rating */}
      {avgRating && (
        <div className="flex items-center gap-2 text-sm mb-5">
          <span className="text-yellow-400">{'★'.repeat(Math.round(Number(avgRating)))}</span>
          <span className="font-bold text-white">{avgRating}</span>
          <span className="text-[#8b96b0]">({product.reviews!.length} avis)</span>
          <span className="text-green-400 ml-2">· {product.stock} en stock</span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 bg-[#161a22] border border-[#1e2433] rounded-xl px-5 py-4 mb-5">
        <span className="text-4xl font-black text-white">{formatPrice(finalPrice)}</span>
        {promoApplied && <span className="text-xl text-[#8b96b0] line-through">{formatPrice(product.price)}</span>}
        {product.comparePrice && (
          <>
            <span className="text-xl text-[#8b96b0] line-through">{formatPrice(product.comparePrice)}</span>
            <span className="text-xs font-bold bg-red-900 text-red-300 px-2 py-1 rounded-lg">
              -{discountPercent(product.comparePrice, product.price)}%
            </span>
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-[#8b96b0] text-sm leading-relaxed mb-5">{product.description}</p>

      {/* Qty */}
      <div className="mb-4">
        <label className="text-xs text-[#8b96b0] font-semibold block mb-2">Quantité</label>
        <div className="flex items-center border border-[#1e2433] rounded-xl w-fit bg-[#161a22]">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2.5 text-lg text-white bg-transparent border-none border-r border-[#1e2433] cursor-pointer">−</button>
          <span className="px-5 font-bold text-white">{qty}</span>
          <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-2.5 text-lg text-white bg-transparent border-none border-l border-[#1e2433] cursor-pointer">+</button>
        </div>
      </div>

      {/* Promo */}
      <div className="flex gap-2 mb-5">
        <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
          placeholder="Code promo (ex: PRIME15)"
          className="flex-1 bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition" />
        <button onClick={applyPromo} disabled={promoApplied}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition"
          style={{ background: promoApplied ? '#14532d' : '#161a22', color: promoApplied ? '#4ade80' : '#f0f4ff', border: `1px solid ${promoApplied ? '#22c55e' : '#1e2433'}` }}>
          {promoApplied ? '✓' : 'Appliquer'}
        </button>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <button onClick={handleAdd}
          className="w-full py-5 rounded-xl font-bold text-base text-white border-none cursor-pointer hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          🛒 Ajouter au panier · {formatPrice(finalPrice * qty)}
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-3 mt-4">
        {['🔒 Paiement sécurisé', '↩️ Retour 30j', '🚀 Livraison 3-7j', '🏆 Garanti 2 ans'].map(t => (
          <span key={t} className="text-xs text-[#8b96b0]">{t}</span>
        ))}
      </div>
    </div>
  );
}