'use client';
import { useState } from 'react';
import { useUIStore }   from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function AuthModal() {
  const { authOpen, authMode, closeAuth, setAuthMode } = useUIStore();
  const { login, register } = useAuthStore();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
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
        if (form.password !== form.confirm) {
          const { default: toast } = await import('react-hot-toast');
          toast.error('Mots de passe différents');
          return;
        }
        await register(form.name, form.email, form.password);
      }
      closeAuth();
      setForm({ name: '', email: '', password: '', confirm: '' });
    } catch { /* géré dans authStore */ }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    closeAuth();
    window.location.href = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL
      ?? 'http://localhost:5000/api/auth/google';
  };

  const inp = {
    width: '100%', background: '#161a22', border: '1px solid #1e2433',
    borderRadius: 10, padding: '12px 16px', color: '#f0f4ff',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={closeAuth} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#111318', border: '1px solid #1e2433', borderRadius: 20, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <button onClick={closeAuth} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8b96b0', fontSize: 22, cursor: 'pointer' }}>×</button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>PrimeShop</div>
          <div style={{ color: '#8b96b0', fontSize: 13 }}>{authMode === 'login' ? 'Connectez-vous' : 'Créez votre compte'}</div>
        </div>

        {/* ✅ Bouton Google */}
        <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', background: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          {/* Icône Google SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </button>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#1e2433' }} />
          <span style={{ color: '#8b96b0', fontSize: 12 }}>ou par email</span>
          <div style={{ flex: 1, height: 1, background: '#1e2433' }} />
        </div>

        {/* Toggle Login / Register */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#161a22', borderRadius: 12, padding: 4 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: authMode === m ? '#2563eb' : 'transparent', color: authMode === m ? '#fff' : '#8b96b0', transition: 'all 0.2s' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {authMode === 'register' && (
            <input placeholder="Nom complet" value={form.name} onChange={set('name')} required style={inp} />
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required style={inp} />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={set('password')} required minLength={8} style={inp} />
          {authMode === 'register' && (
            <input type="password" placeholder="Confirmer le mot de passe" value={form.confirm} onChange={set('confirm')} required style={inp} />
          )}
          <button type="submit" disabled={loading} style={{ padding: '13px 0', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? '...' : authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#8b96b0', fontSize: 11, marginTop: 16 }}>🔒 Données sécurisées · Jamais partagées</p>
      </div>
    </div>
  );
}