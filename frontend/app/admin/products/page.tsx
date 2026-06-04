'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ price: '', stock: '', name: '' });

  useEffect(() => {
    api.get('/products/primelens-pro-x1')
      .then(r => { setProduct(r.data); setForm({ price: r.data.price, stock: r.data.stock, name: r.data.name }); })
      .catch(() => toast.error('Erreur chargement produit'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      await api.put(`/products/${product.id}`, { price: Number(form.price), stock: Number(form.stock), name: form.name });
      setProduct((p: any) => ({ ...p, ...form }));
      setEditing(false);
      toast.success('Produit mis à jour ✅');
    } catch { toast.error('Erreur mise à jour'); }
  };

  const inp = "w-full bg-[#0a0c10] border border-[#1e2433] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-600 transition";

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-2xl font-black">Gestion produits</h1>
          <Link href="/admin" className="text-sm text-[#8b96b0] border border-[#1e2433] rounded-xl px-4 py-2">← Dashboard</Link>
        </div>

        {loading ? (
          <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-8 animate-pulse">
            <div className="h-6 bg-[#1e2433] rounded w-1/2 mb-4" />
            <div className="h-4 bg-[#1e2433] rounded w-1/3" />
          </div>
        ) : product && (
          <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
            {/* Product header */}
            <div className="flex gap-6 p-6 border-b border-[#1e2433] flex-wrap">
              {product.images?.[0] && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={product.images[0]} alt={product.name} fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-black mb-1">{product.name}</h2>
                <p className="text-[#8b96b0] text-sm mb-3">{product.category}</p>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-blue-400 font-bold">€{product.price}</span>
                  <span className={`font-bold ${product.stock > 10 ? 'text-green-400' : 'text-orange-400'}`}>{product.stock} en stock</span>
                  <span className="text-[#8b96b0]">Slug : {product.slug}</span>
                </div>
              </div>
              <button onClick={() => setEditing(e => !e)} style={{ background: editing ? '#1e2433' : '#2563eb' }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer h-fit">
                {editing ? 'Annuler' : '✏️ Modifier'}
              </button>
            </div>

            {/* Edit form */}
            {editing && (
              <div className="p-6 border-b border-[#1e2433]">
                <h3 className="font-bold mb-4">Modifier le produit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-2">Nom</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-2">Prix (€)</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b96b0] block mb-2">Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inp} />
                  </div>
                </div>
                <button onClick={save} className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:bg-blue-700 transition">
                  💾 Sauvegarder
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
              {[
                { label: 'Prix actuel',   value: `€${product.price}`,        color: 'text-blue-400' },
                { label: 'Prix barré',    value: `€${product.comparePrice}`, color: 'text-[#8b96b0]' },
                { label: 'Stock',         value: product.stock,              color: product.stock > 10 ? 'text-green-400' : 'text-orange-400' },
                { label: 'Catégorie',     value: product.category,           color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="p-5 border-r border-b border-[#1e2433] last:border-r-0 text-center">
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-[#8b96b0] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CJ Import */}
        <div className="mt-6 bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
          <h3 className="font-bold mb-2">Import CJ Dropshipping</h3>
          <p className="text-[#8b96b0] text-sm mb-4">Importez automatiquement un produit depuis CJ Dropshipping via son ID.</p>
          <div className="flex gap-3 flex-wrap">
            <input placeholder="ID produit CJ (ex: xxx)" className={`${inp} flex-1 min-w-[200px]`} />
            <button onClick={() => toast.success('Import en cours... (Connectez l\'API CJ)')}
              className="px-5 py-2.5 bg-blue-600 rounded-xl font-bold text-sm text-white border-none cursor-pointer">
              📦 Importer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}