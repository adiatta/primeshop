'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ShoppingCart, User, Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const count  = useCartStore(s => s.count());
  const user   = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 transition-all duration-300
      ${scrolled ? 'bg-[#0a0c10]/95 backdrop-blur-xl border-b border-[#1e2433]' : 'bg-transparent'}`}>

      {/* Logo */}
      <Link href="/" className="text-xl font-black bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
        PrimeShop
      </Link>

      {/* Desktop actions */}
      <div className="hidden sm:flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/dashboard"
              className="flex items-center gap-2 bg-[#161a22] border border-[#1e2433] rounded-full px-4 py-2 text-sm font-semibold text-white hover:border-blue-600 transition">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {user.name[0]}
              </div>
              {user.name}
            </Link>
            <button onClick={logout}
              className="text-xs text-[#8b96b0] hover:text-white transition px-2">
              Déconnexion
            </button>
          </div>
        ) : (
          <Link href="/auth/login"
            className="border border-[#1e2433] rounded-full px-4 py-2 text-sm font-semibold text-white hover:border-blue-600 transition flex items-center gap-2">
            <User size={14} /> Connexion
          </Link>
        )}

        <Link href="/cart" className="relative bg-[#161a22] border border-[#1e2433] rounded-full px-4 py-2 text-sm font-semibold text-white hover:border-blue-600 transition flex items-center gap-2">
          <ShoppingCart size={14} />
          Panier
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile burger */}
      <button className="sm:hidden text-white" onClick={() => setMenuOpen(o => !o)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#111318] border-b border-[#1e2433] p-4 flex flex-col gap-3 sm:hidden">
          <Link href="/cart"     onClick={() => setMenuOpen(false)} className="text-white font-semibold py-2">🛒 Panier ({count})</Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-white font-semibold py-2">👤 Mon compte</Link>
          {!user && <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-white font-semibold py-2">Connexion</Link>}
          {user  && <button onClick={() => { logout(); setMenuOpen(false); }} className="text-left text-red-400 font-semibold py-2">Déconnexion</button>}
        </div>
      )}
    </nav>
  );
}