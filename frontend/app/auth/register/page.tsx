'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);
  const router   = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 8)       { toast.error('Mot de passe trop court (8 caractères min)'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Compte créé avec succès 🎉');
      router.push('/dashboard');
    } catch {
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600 transition";

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#111318] border border-[#1e2433] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
            PrimeShop
          </Link>
          <p className="text-[#8b96b0] text-sm mt-2">Créez votre compte gratuit</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Nom complet"      value={form.name}     onChange={set('name')}     required className={inp} />
          <input type="email" placeholder="Email" value={form.email}   onChange={set('email')}    required className={inp} />
          <input type="password" placeholder="Mot de passe (8+ caractères)" value={form.password} onChange={set('password')} required className={inp} />
          <input type="password" placeholder="Confirmer le mot de passe"    value={form.confirm}  onChange={set('confirm')}  required className={inp} />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-[#8b96b0] text-sm mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}