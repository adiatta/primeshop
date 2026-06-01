'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
          <div className="text-6xl">🛒</div>
          <h1 className="text-2xl font-black">Votre panier est vide</h1>
          <p className="text-[#8b96b0]">Ajoutez des produits pour commencer</p>
          <Link href="/" className="px-8 py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition">
            Découvrir nos produits →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-3xl font-black mb-2">Mon panier</h1>
        <p className="text-[#8b96b0] mb-10">{count()} article{count() > 1 ? 's' : ''}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-5 flex gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-1 truncate">{item.name}</div>
                  <div className="text-xs text-[#8b96b0] mb-3">{item.variant}</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center border border-[#1e2433] rounded-xl bg-[#0a0c10]">
                      <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                        className="px-3 py-1.5 text-lg bg-transparent border-none text-white cursor-pointer">−</button>
                      <span className="px-3 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1.5 text-lg bg-transparent border-none text-white cursor-pointer">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-blue-400">{(item.price * item.quantity).toLocaleString()}€</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 text-sm hover:text-red-300 transition bg-transparent border-none cursor-pointer">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 h-fit sticky top-24">
            <h2 className="font-bold text-lg mb-5">Récapitulatif</h2>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-[#8b96b0]">Sous-total</span>
                <span>{total().toLocaleString()}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b96b0]">Livraison</span>
                <span className="text-green-400">Gratuite</span>
              </div>
            </div>
            <div className="flex justify-between font-black text-lg border-t border-[#1e2433] pt-4 mb-6">
              <span>Total</span>
              <span>{total().toLocaleString()}€</span>
            </div>
            <Link href="/checkout"
              className="block w-full text-center py-4 rounded-xl font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              Passer la commande →
            </Link>
            <p className="text-center text-xs text-[#8b96b0] mt-3">🔒 Paiement 100% sécurisé via Stripe</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}