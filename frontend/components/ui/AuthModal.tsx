'use client';
import { useState } from 'react';
import { useUIStore }  from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function AuthModal() {
  const { authOpen, authMode, closeAuth, setAuthMode } = useUIStore();
  const { login, register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  if (!authOpen) return null;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(form.email, form.password);
      } else {
        if (form.password !== form.confirm) { import('react-hot-toast').then(m => m.default.error('Mots de passe différents')); return; }
        await register(form.name, form.email, form.password);
      }
      closeAuth();
      setForm({ name: '', email: '', password: '', confirm: '' });
    } catch { /* toast déjà géré dans authStore */ }
    finally { setLoading(false); }
  };

  const inp = {
    width: '100%', background: '#161a22', border: '1px solid #1e2433',
    borderRadius: 10, padding: '12px 16px', color: '#f0f4ff',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={closeAuth} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />

      {/* Panel */}
      <div style={{ position: 'relative', background: '#111318', border: '1px solid #1e2433', borderRadius: 20, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <button onClick={closeAuth} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8b96b0', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>PrimeShop</div>
          <div style={{ color: '#8b96b0', fontSize: 14 }}>{authMode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuit'}</div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#161a22', borderRadius: 12, padding: 4 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: authMode === m ? '#2563eb' : 'transparent', color: authMode === m ? '#fff' : '#8b96b0', transition: 'all 0.2s' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {authMode === 'register' && (
            <input placeholder="Nom complet" value={form.name} onChange={set('name')} required style={inp} />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required style={inp} />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={set('password')} required style={inp} />
          {authMode === 'register' && (
            <input type="password" placeholder="Confirmer le mot de passe" value={form.confirm} onChange={set('confirm')} required style={inp} />
          )}
          <button type="submit" disabled={loading} style={{ padding: '14px 0', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? '...' : authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#8b96b0', fontSize: 12, marginTop: 18 }}>🔒 Données sécurisées · Jamais partagées</p>
      </div>
    </div>
  );
}