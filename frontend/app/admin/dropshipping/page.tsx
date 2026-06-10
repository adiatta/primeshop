'use client';
import { useEffect, useState } from 'react';
import Link   from 'next/link';
import Image  from 'next/image';
import api    from '@/lib/api';
import toast  from 'react-hot-toast';

interface CJProduct {
  pid: string; productNameEn: string;
  sellPrice: string; productImage: string;
  categoryName: string;
}

interface ImportedProduct {
  id: string; name: string; price: number;
  stock: number; cjProductId: string;
  active: boolean; images: string[];
}

export default function DropshippingPage() {
  const [tab, setTab]                   = useState<'search'|'imported'|'sync'>('search');
  const [apiStatus, setApiStatus]       = useState<{ connected: boolean; message: string } | null>(null);
  const [keyword, setKeyword]           = useState('');
  const [searchResults, setResults]     = useState<CJProduct[]>([]);
  const [searching, setSearching]       = useState(false);
  const [imported, setImported]         = useState<ImportedProduct[]>([]);
  const [syncing, setSyncing]           = useState(false);
  const [importingId, setImportingId]   = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/dropshipping/status')
      .then(r => setApiStatus(r.data))
      .catch(() => setApiStatus({ connected: false, message: 'Impossible de joindre le backend' }));
    if (tab === 'imported') loadImported();
  }, [tab]);

  const loadImported = () => {
    api.get('/admin/dropshipping/products')
      .then(r => setImported(r.data))
      .catch(() => toast.error('Erreur chargement produits'));
  };

  const search = async () => {
    if (!keyword.trim()) { toast.error('Entrez un mot-clé'); return; }
    setSearching(true);
    try {
      const { data } = await api.post('/admin/dropshipping/search', { keyword });
      setResults(data?.list ?? data ?? []);
    } catch { toast.error('Erreur recherche CJ'); }
    finally { setSearching(false); }
  };

  const importProduct = async (pid: string) => {
    setImportingId(pid);
    try {
      const { data } = await api.post('/admin/dropshipping/import', { cjProductId: pid });
      toast.success(`✅ "${data.product.name}" importé !`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erreur import');
    } finally { setImportingId(null); }
  };

  const syncStock = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/admin/dropshipping/sync-stock');
      toast.success(data.message);
      if (tab === 'imported') loadImported();
    } catch { toast.error('Erreur synchronisation'); }
    finally { setSyncing(false); }
  };

  const syncTracking = async () => {
    const tid = toast.loading('Synchronisation du tracking...');
    try {
      const { data } = await api.post('/admin/dropshipping/sync-tracking');
      toast.success(data.message, { id: tid });
    } catch { toast.error('Erreur sync tracking', { id: tid }); }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="text-[#8b96b0] text-sm hover:text-white transition">← Admin</Link>
            <h1 className="text-2xl font-black mt-2">Gestion Dropshipping</h1>
          </div>
          {/* Statut API */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${apiStatus?.connected ? 'bg-green-900/20 border-green-600/30 text-green-400' : 'bg-red-900/20 border-red-600/30 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${apiStatus?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {apiStatus ? apiStatus.message : 'Vérification...'}
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-8 border-b border-[#1e2433]">
          {[['search','🔍 Rechercher'],['imported','📦 Produits importés'],['sync','🔄 Synchronisation']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition bg-transparent cursor-pointer ${tab === id ? 'border-blue-500 text-white' : 'border-transparent text-[#8b96b0] hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Onglet Recherche ─────────────────────────── */}
        {tab === 'search' && (
          <div>
            <div className="flex gap-3 mb-6">
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Ex: wireless earbuds, phone case..."
                className="flex-1 bg-[#161a22] border border-[#1e2433] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600" />
              <button onClick={search} disabled={searching}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm text-white border-none cursor-pointer disabled:opacity-50 transition">
                {searching ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>

            {searchResults.length === 0 && !searching && (
              <div className="text-center py-16 text-[#8b96b0]">
                <p className="text-4xl mb-4">🔍</p>
                <p>Recherchez des produits sur CJ Dropshipping</p>
                <p className="text-xs mt-2">Les produits seront importés avec une marge de ×2.5</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((p) => (
                <div key={p.pid} className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
                  <div className="relative aspect-square">
                    {p.productImage ? (
                      <Image src={p.productImage} alt={p.productNameEn} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-[#1e2433] flex items-center justify-center text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-blue-400 mb-1">{p.categoryName}</p>
                    <p className="text-sm font-semibold mb-2 line-clamp-2">{p.productNameEn}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#8b96b0]">Prix CJ : {p.sellPrice}$</p>
                        <p className="text-sm font-bold text-blue-400">
                          Vente : ~{Math.round(Number(p.sellPrice) * 2.5 * 0.93)}€
                        </p>
                      </div>
                      <button onClick={() => importProduct(p.pid)} disabled={importingId === p.pid}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white border-none cursor-pointer disabled:opacity-50 transition">
                        {importingId === p.pid ? '...' : '+ Importer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Onglet Produits importés ──────────────────── */}
        {tab === 'imported' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <p className="text-[#8b96b0] text-sm">{imported.length} produits CJ dans la boutique</p>
              <button onClick={syncStock} disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-[#161a22] border border-[#1e2433] hover:border-blue-600 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50 transition">
                {syncing ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : '🔄'}
                Sync stock
              </button>
            </div>

            {imported.length === 0 ? (
              <div className="text-center py-16 text-[#8b96b0]">
                <p className="text-4xl mb-4">📭</p>
                <p>Aucun produit CJ importé</p>
              </div>
            ) : (
              <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#111318] border-b border-[#1e2433]">
                      {['Produit','Prix vente','Stock','ID CJ','Statut'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[#8b96b0] font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imported.map(p => (
                      <tr key={p.id} className="border-b border-[#1e2433] hover:bg-[#1a1f2a] transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images[0] && <Image src={p.images[0]} alt={p.name} width={40} height={40} className="rounded-lg object-cover" unoptimized />}
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-400">{p.price}€</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.stock > 10 ? 'text-green-400' : p.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#8b96b0] font-mono text-xs">{p.cjProductId}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {p.active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Synchronisation ───────────────────── */}
        {tab === 'sync' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: '📦', title: 'Sync stock produits',
                desc: 'Met à jour le stock de tous les produits CJ importés',
                action: syncStock, loading: syncing, label: 'Synchroniser le stock',
                color: 'blue',
              },
              {
                icon: '🚚', title: 'Sync tracking commandes',
                desc: 'Met à jour le statut des commandes en transit depuis CJ',
                action: syncTracking, loading: false, label: 'Synchroniser le tracking',
                color: 'purple',
              },
            ].map(card => (
              <div key={card.title} className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6">
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-[#8b96b0] text-sm mb-6">{card.desc}</p>
                <button onClick={card.action} disabled={card.loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition"
                  style={{ background: `linear-gradient(135deg, ${card.color === 'blue' ? '#2563eb,#1d4ed8' : '#8b5cf6,#7c3aed'})` }}>
                  {card.loading ? 'En cours...' : card.label}
                </button>
              </div>
            ))}

            {/* Config CJ */}
            <div className="bg-[#161a22] border border-[#1e2433] rounded-2xl p-6 sm:col-span-2">
              <h3 className="font-bold text-lg mb-4">⚙️ Configuration CJ API</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'CJ_EMAIL', val: process.env.NEXT_PUBLIC_CJ_EMAIL || '(configuré côté serveur)' },
                  { label: 'CJ_API_KEY', val: '••••••••••••••••' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#0a0c10] rounded-xl p-4">
                    <p className="text-xs text-[#8b96b0] mb-1">{label}</p>
                    <p className="font-mono text-sm text-white">{val}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#8b96b0] mt-4">
                Les variables CJ_EMAIL et CJ_API_KEY sont configurées dans les variables d'environnement Railway.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}