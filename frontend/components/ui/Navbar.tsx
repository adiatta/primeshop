'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore }   from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { openAuth, openCart } = useUIStore();
  const { user, logout }       = useAuthStore();
  const count = useCartStore(s => s.count());
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, height: 68,
      background: scrolled ? 'rgba(10,12,16,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid #1e2433' : 'none',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
    }}>
      <Link href="/" style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', letterSpacing: -0.5 }}>
        PrimeShop
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#161a22', border: '1px solid #1e2433', borderRadius: 9999, padding: '7px 16px', color: '#f0f4ff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 24, height: 24, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{user.name[0].toUpperCase()}</span>
              {user.name}
            </Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" style={{ padding: '7px 14px', background: 'rgba(139,92,246,0.15)', border: '1px solid #7c3aed', borderRadius: 9999, color: '#a78bfa', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Admin</Link>
            )}
            <button onClick={logout} style={{ background: 'none', border: 'none', color: '#8b96b0', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>Déconnexion</button>
          </>
        ) : (
          <button onClick={() => openAuth('login')} style={{ background: 'none', border: '1px solid #1e2433', borderRadius: 9999, padding: '9px 20px', color: '#f0f4ff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Connexion
          </button>
        )}

        <button onClick={openCart} style={{ position: 'relative', background: '#161a22', border: '1px solid #1e2433', borderRadius: 9999, width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', color: '#f0f4ff' }}>
          🛒
          {mounted && count > 0 && (
  <span
    style={{
      position: "absolute",
      top: -4,
      right: -4,
      background: "#2563eb",
      color: "#fff",
      fontSize: 10,
      fontWeight: 800,
      width: 18,
      height: 18,
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {count}
  </span>
)}
        </button>
      </div>
    </nav>
  );
}