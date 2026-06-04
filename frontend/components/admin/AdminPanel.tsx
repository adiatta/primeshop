'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: 'En attente',    bg: '#292524', color: '#fbbf24' },
  CONFIRMED:  { label: 'Confirmée',     bg: '#1e3a2f', color: '#4ade80' },
  PROCESSING: { label: 'En cours',      bg: '#1e2d4a', color: '#60a5fa' },
  SHIPPED:    { label: 'Expédiée',      bg: '#2e1a47', color: '#a78bfa' },
  DELIVERED:  { label: 'Livrée',        bg: '#14532d', color: '#22c55e' },
  CANCELLED:  { label: 'Annulée',       bg: '#3b1111', color: '#f87171' },
};

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'    },
  { id: 'orders',    icon: '📦', label: 'Commandes'    },
  { id: 'users',     icon: '👥', label: 'Utilisateurs' },
  { id: 'promos',    icon: '🎁', label: 'Promotions'   },
];

function Badge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}

// ── Dashboard ──────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats]     = useState<any>(null);
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/orders?limit=6'),
    ]).then(([s, o]) => {
      setStats(s.data);
      setOrders(o.data.orders || []);
    }).catch(() => toast.error('Erreur chargement')).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Revenus total',  value: formatPrice(stats.revenue || 0),  icon: '💰', color: '#22c55e' },
    { label: 'Commandes',      value: stats.totalOrders || 0,            icon: '📦', color: '#60a5fa' },
    { label: 'Clients',        value: stats.totalUsers  || 0,            icon: '👥', color: '#a78bfa' },
    { label: 'En attente',     value: stats.pendingOrders || 0,          icon: '⏳', color: '#fbbf24' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff', marginBottom: 24 }}>Tableau de bord</h1>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, padding: 24, height: 100, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: '#8b96b0', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Commandes récentes */}
      <div style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4ff', marginBottom: 16 }}>Commandes récentes</div>
        {loading ? (
          <p style={{ color: '#8b96b0', fontSize: 14 }}>Chargement...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: '#8b96b0', fontSize: 14 }}>Aucune commande pour le moment</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2433' }}>
                  {['ID', 'Client', 'Montant', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8b96b0', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1e2433' }}>
                    <td style={{ padding: '12px', color: '#60a5fa', fontWeight: 700 }}>#{o.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding: '12px', color: '#f0f4ff' }}>{o.user?.name ?? '—'}</td>
                    <td style={{ padding: '12px', color: '#f0f4ff', fontWeight: 700 }}>{formatPrice(o.total)}</td>
                    <td style={{ padding: '12px' }}><Badge status={o.status} /></td>
                    <td style={{ padding: '12px', color: '#8b96b0' }}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Orders ─────────────────────────────────────────────────
function Orders() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('ALL');

  useEffect(() => {
    api.get('/admin/orders').then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Erreur commandes')).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status });
      setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur mise à jour'); }
  };

  const filtered = orders.filter(o =>
    (filter === 'ALL' || o.status === filter) &&
    (o.id.includes(search) || o.user?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const inp = { background: '#161a22', border: '1px solid #1e2433', borderRadius: 10, padding: '10px 14px', color: '#f0f4ff', fontSize: 13, outline: 'none' } as React.CSSProperties;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff', marginBottom: 24 }}>Commandes ({orders.length})</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          <option value="ALL">Tous</option>
          {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <p style={{ padding: 24, color: '#8b96b0' }}>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 24, color: '#8b96b0' }}>Aucune commande trouvée</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#111318', borderBottom: '1px solid #1e2433' }}>
                  {['ID', 'Client', 'Montant', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8b96b0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1e2433' }}>
                    <td style={{ padding: '14px 16px', color: '#60a5fa', fontWeight: 700 }}>#{o.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#f0f4ff', fontWeight: 600 }}>{o.user?.name ?? '—'}</div>
                      <div style={{ color: '#8b96b0', fontSize: 11 }}>{o.user?.email ?? ''}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#f0f4ff', fontWeight: 700 }}>{formatPrice(o.total)}</td>
                    <td style={{ padding: '14px 16px' }}><Badge status={o.status} /></td>
                    <td style={{ padding: '14px 16px', color: '#8b96b0' }}>{formatDate(o.createdAt)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                        style={{ background: '#0a0c10', border: '1px solid #1e2433', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#f0f4ff', cursor: 'pointer', outline: 'none' }}>
                        {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Users ──────────────────────────────────────────────────
function Users() {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data || []))
      .catch(() => toast.error('Erreur utilisateurs')).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff', marginBottom: 24 }}>Utilisateurs ({users.length})</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
        style={{ width: '100%', background: '#161a22', border: '1px solid #1e2433', borderRadius: 10, padding: '10px 14px', color: '#f0f4ff', fontSize: 13, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }} />
      <div style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? <p style={{ padding: 24, color: '#8b96b0' }}>Chargement...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#111318', borderBottom: '1px solid #1e2433' }}>
                  {['Utilisateur', 'Commandes', 'Inscription', 'Rôle'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8b96b0', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #1e2433' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f0f4ff' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#8b96b0' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#f0f4ff', fontWeight: 700 }}>{u._count?.orders ?? 0}</td>
                    <td style={{ padding: '14px 16px', color: '#8b96b0' }}>{formatDate(u.createdAt)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: u.role === 'ADMIN' ? 'rgba(37,99,235,0.15)' : 'rgba(139,92,246,0.15)', color: u.role === 'ADMIN' ? '#60a5fa' : '#a78bfa', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Promos ─────────────────────────────────────────────────
function Promos() {
  const [promos, setPromos]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ code: '', discount: '', maxUses: '', expires: '' });

  useEffect(() => {
    // Les promo codes viennent de la BDD via l'API admin
    api.get('/admin/promos').then(r => setPromos(r.data || []))
      .catch(() => setPromos([])).finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!form.code || !form.discount) { toast.error('Code et réduction requis'); return; }
    try {
      const { data } = await api.post('/admin/promos', {
        code:     form.code.toUpperCase(),
        discount: Number(form.discount),
        type:     'percentage',
        maxUses:  Number(form.maxUses) || null,
        expiresAt: form.expires || null,
      });
      setPromos(p => [...p, data]);
      setForm({ code: '', discount: '', maxUses: '', expires: '' });
      toast.success('Code créé !');
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Erreur'); }
  };

  const toggle = async (code: string, active: boolean) => {
    try {
      await api.patch(`/admin/promos/${code}`, { active: !active });
      setPromos(p => p.map(x => x.code === code ? { ...x, active: !active } : x));
    } catch { toast.error('Erreur'); }
  };

  const inp = { background: '#0a0c10', border: '1px solid #1e2433', borderRadius: 8, padding: '10px 12px', color: '#f0f4ff', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff', marginBottom: 24 }}>Codes promo</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? <p style={{ color: '#8b96b0' }}>Chargement...</p> : promos.map((p: any) => (
          <div key={p.code} style={{ background: '#161a22', border: `1px solid ${p.active ? '#2563eb' : '#1e2433'}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: '#f0f4ff' }}>{p.code}</span>
              <button onClick={() => toggle(p.code, p.active)} style={{ background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 20, padding: '4px 12px', color: p.active ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {p.active ? '✓ Actif' : '✗ Inactif'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#0a0c10', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb' }}>-{p.discount}%</div>
                <div style={{ fontSize: 11, color: '#8b96b0' }}>Réduction</div>
              </div>
              <div style={{ flex: 1, background: '#0a0c10', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f4ff' }}>{p.currentUses}/{p.maxUses ?? '∞'}</div>
                <div style={{ fontSize: 11, color: '#8b96b0' }}>Utilisations</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire création */}
      <div style={{ background: '#161a22', border: '1px solid #1e2433', borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff', marginBottom: 16 }}>Créer un code</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
          <div><label style={{ fontSize: 12, color: '#8b96b0', display: 'block', marginBottom: 6 }}>Code *</label><input placeholder="PROMO20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: '#8b96b0', display: 'block', marginBottom: 6 }}>Réduction % *</label><input type="number" placeholder="20" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: '#8b96b0', display: 'block', marginBottom: 6 }}>Max utilisations</label><input type="number" placeholder="100" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: '#8b96b0', display: 'block', marginBottom: 6 }}>Expiration</label><input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} style={inp} /></div>
        </div>
        <button onClick={create} style={{ marginTop: 16, padding: '12px 28px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Créer le code
        </button>
      </div>
    </div>
  );
}

// ── Shell principal ────────────────────────────────────────
export default function AdminPanel() {
  const [active, setActive]       = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 68px)', background: '#0a0c10', color: '#f0f4ff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e2433;border-radius:2px} select,option{background:#161a22;color:#f0f4ff}`}</style>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 68, background: '#111318', borderRight: '1px solid #1e2433', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e2433', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && <span style={{ fontSize: 15, fontWeight: 900, color: '#60a5fa' }}>Admin</span>}
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'none', border: 'none', color: '#8b96b0', cursor: 'pointer', fontSize: 18 }}>☰</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarOpen ? '16px 12px' : '16px 8px' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: sidebarOpen ? 12 : 0, justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: sidebarOpen ? '11px 14px' : '11px 0', borderRadius: 10, border: 'none', background: active === item.id ? 'rgba(37,99,235,0.15)' : 'transparent', color: active === item.id ? '#60a5fa' : '#8b96b0', cursor: 'pointer', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid #1e2433' }}>
          <Link href="/" style={{ display: 'block', textAlign: sidebarOpen ? 'left' : 'center', color: '#8b96b0', fontSize: 12, textDecoration: 'none' }}>
            {sidebarOpen ? '← Retour boutique' : '←'}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 28px', minWidth: 0 }}>
        {active === 'dashboard' && <Dashboard />}
        {active === 'orders'    && <Orders />}
        {active === 'users'     && <Users />}
        {active === 'promos'    && <Promos />}
      </main>
    </div>
  );
}