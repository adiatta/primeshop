'use client';
import Link from 'next/link';
import { useUIStore }   from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useAuth }      from '@/hooks/useAuth';   // ← useAuth gère l'hydratation
import { CartItem }     from '@/components/cart/CartItem';
import { formatPrice }  from '@/lib/utils';

export function CartDrawer() {
  const { cartOpen, closeCart, openAuth } = useUIStore();
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const { isAuthenticated } = useAuth();  // ← hydraté correctement

  if (!cartOpen) return null;

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 888 }}>
      <div onClick={closeCart} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 'min(420px,100vw)', background: '#111318', borderLeft: '1px solid #1e2433', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px', borderBottom: '1px solid #1e2433', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff' }}>Mon panier ({count})</span>
          <button onClick={closeCart} style={{ background: 'none', border: 'none', color: '#8b96b0', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8b96b0', marginTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ marginBottom: 20 }}>Votre panier est vide</p>
              <button onClick={closeCart} style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                Continuer mes achats
              </button>
            </div>
          ) : items.map(item => (
            <CartItem key={item.id} item={item} onRemove={removeItem} onQty={updateQuantity} />
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: 20, borderTop: '1px solid #1e2433' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#8b96b0', marginBottom: 6 }}>
              <span>Livraison</span><span style={{ color: '#22c55e' }}>Gratuite</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: '#f0f4ff', marginBottom: 16 }}>
              <span>Total</span><span>{formatPrice(total())}</span>
            </div>

            {/* ✅ FIX : isAuthenticated depuis useAuth (hydration safe) */}
            {isAuthenticated ? (
              <Link href="/checkout" onClick={closeCart}
                style={{ display: 'block', textAlign: 'center', padding: '15px 0', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>
                Payer maintenant →
              </Link>
            ) : (
              <button
                onClick={() => { closeCart(); openAuth('login'); }}
                style={{ width: '100%', padding: '15px 0', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                Se connecter pour payer
              </button>
            )}
            <p style={{ textAlign: 'center', color: '#8b96b0', fontSize: 12, marginTop: 10 }}>🔒 Paiement sécurisé via Stripe</p>
          </div>
        )}
      </div>
    </div>
  );
}