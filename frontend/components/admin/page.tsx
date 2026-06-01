'use client';
import { useState } from 'react';

// ── Palette ────────────────────────────────────────────────
const C = {
  bg: '#0a0c10', surface: '#111318', card: '#161a22', border: '#1e2433',
  accent: '#2563eb', text: '#f0f4ff', muted: '#8b96b0',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', purple: '#8b5cf6',
};

// ── Fake data ──────────────────────────────────────────────
const STATS = [
  { label: 'Revenus total',    value: '€48,291', delta: '+18.4%', up: true,  icon: '💰' },
  { label: 'Commandes',        value: '1,284',   delta: '+12.1%', up: true,  icon: '📦' },
  { label: 'Clients',          value: '3,741',   delta: '+9.3%',  up: true,  icon: '👥' },
  { label: 'Taux conversion',  value: '3.8%',    delta: '-0.4%',  up: false, icon: '📈' },
];

const ORDERS = [
  { id: 'PS-001284', customer: 'Alexandre M.', email: 'alex@mail.com',    product: 'PrimeLens Pro X1', variant: 'Storm Gray · 512GB',      amount: 249, status: 'DELIVERED',  date: '27 mai 2026', tracking: 'CJ202605270001' },
  { id: 'PS-001283', customer: 'Sofia L.',     email: 'sofia@mail.com',   product: 'PrimeLens Pro X1', variant: 'Midnight Black · 256GB',  amount: 249, status: 'SHIPPED',    date: '26 mai 2026', tracking: 'CJ202605260045' },
  { id: 'PS-001282', customer: 'Thomas D.',    email: 'thomas@mail.com',  product: 'PrimeLens Pro X1', variant: 'Desert Gold · 1TB',       amount: 249, status: 'PROCESSING', date: '25 mai 2026', tracking: null },
  { id: 'PS-001281', customer: 'Camille R.',   email: 'camille@mail.com', product: 'PrimeLens Pro X1', variant: 'Storm Gray · 256GB',      amount: 212, status: 'CONFIRMED',  date: '25 mai 2026', tracking: null },
  { id: 'PS-001280', customer: 'Lucas B.',     email: 'lucas@mail.com',   product: 'PrimeLens Pro X1', variant: 'Midnight Black · 512GB',  amount: 249, status: 'PENDING',    date: '24 mai 2026', tracking: null },
  { id: 'PS-001279', customer: 'Emma V.',      email: 'emma@mail.com',    product: 'PrimeLens Pro X1', variant: 'Desert Gold · 256GB',     amount: 249, status: 'CANCELLED',  date: '23 mai 2026', tracking: null },
];

const USERS = [
  { id: 'u1', name: 'Alexandre M.', email: 'alex@mail.com',    orders: 4, spent: 996,  joined: '10 jan. 2026', role: 'USER',  status: 'active' },
  { id: 'u2', name: 'Sofia L.',     email: 'sofia@mail.com',   orders: 2, spent: 498,  joined: '15 fév. 2026', role: 'USER',  status: 'active' },
  { id: 'u3', name: 'Thomas D.',    email: 'thomas@mail.com',  orders: 7, spent: 1743, joined: '3 mars 2026',  role: 'USER',  status: 'active' },
  { id: 'u4', name: 'Admin Boss',   email: 'admin@primeshop.fr', orders: 0, spent: 0, joined: '1 jan. 2026',  role: 'ADMIN', status: 'active' },
  { id: 'u5', name: 'Camille R.',   email: 'camille@mail.com', orders: 1, spent: 212,  joined: '20 avr. 2026', role: 'USER',  status: 'inactive' },
];

const PROMOS_INIT = [
  { code: 'PRIME15',  type: 'percentage', discount: 15, uses: 284, maxUses: 500, active: true,  expires: '30 juin 2026' },
  { code: 'SUMMER10', type: 'percentage', discount: 10, uses: 102, maxUses: 200, active: true,  expires: '31 juil. 2026' },
  { code: 'FLASH20',  type: 'percentage', discount: 20, uses: 50,  maxUses: 50,  active: false, expires: '1 mai 2026' },
];

const MONTHLY = [
  { month: 'Jan', rev: 3200, orders: 82  },
  { month: 'Fév', rev: 4100, orders: 104 },
  { month: 'Mar', rev: 5800, orders: 148 },
  { month: 'Avr', rev: 4900, orders: 125 },
  { month: 'Mai', rev: 7200, orders: 184 },
  { month: 'Juin', rev: 6100, orders: 156 },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: 'En attente',     bg: '#292524', color: '#fbbf24' },
  CONFIRMED:  { label: 'Confirmée',      bg: '#1e3a2f', color: '#4ade80' },
  PROCESSING: { label: 'En cours',       bg: '#1e2d4a', color: '#60a5fa' },
  SHIPPED:    { label: 'Expédiée',       bg: '#2e1a47', color: '#a78bfa' },
  DELIVERED:  { label: 'Livrée',         bg: '#14532d', color: '#22c55e' },
  CANCELLED:  { label: 'Annulée',        bg: '#3b1111', color: '#f87171' },
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'    },
  { id: 'orders',    icon: '📦', label: 'Commandes'    },
  { id: 'users',     icon: '👥', label: 'Utilisateurs' },
  { id: 'promos',    icon: '🎁', label: 'Promotions'   },
  { id: 'analytics', icon: '📈', label: 'Analytics'    },
];

// ── Helpers ────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function MiniBar({ data }: { data: typeof MONTHLY }) {
  const max = Math.max(...data.map(d => d.rev));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map(d => (
        <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', background: `linear-gradient(to top,${C.accent},#60a5fa)`, borderRadius: '4px 4px 0 0', height: `${(d.rev / max) * 68}px`, minHeight: 4 }} />
          <span style={{ fontSize: 10, color: C.muted }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section Dashboard ──────────────────────────────────────
function Dashboard() {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, color: C.text }}>Tableau de bord</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>Bienvenue, Admin · PrimeShop</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 12, marginTop: 6, color: s.up ? C.success : C.danger, fontWeight: 600 }}>
                  {s.up ? '▲' : '▼'} {s.delta} ce mois
                </div>
              </div>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Revenus mensuels</div>
              <div style={{ color: C.muted, fontSize: 12 }}>6 derniers mois</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>€31,300</div>
          </div>
          <MiniBar data={MONTHLY} />
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Statut commandes</div>
          {Object.entries(STATUS_CONFIG).map(([key, s]) => {
            const count = ORDERS.filter(o => o.status === key).length;
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 13, color: C.muted }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Commandes récentes</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['ID', 'Client', 'Variante', 'Montant', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.slice(0, 5).map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px', color: C.accent, fontWeight: 700 }}>{o.id}</td>
                  <td style={{ padding: '12px', color: C.text }}>{o.customer}</td>
                  <td style={{ padding: '12px', color: C.muted }}>{o.variant}</td>
                  <td style={{ padding: '12px', color: C.text, fontWeight: 700 }}>€{o.amount}</td>
                  <td style={{ padding: '12px' }}><Badge status={o.status} /></td>
                  <td style={{ padding: '12px', color: C.muted }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Section Orders ─────────────────────────────────────────
function Orders({ onSelect }: { onSelect: (o: typeof ORDERS[0]) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const filtered = ORDERS.filter(o =>
    (filter === 'ALL' || o.status === filter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );
  const inp = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' } as React.CSSProperties;
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, color: C.text }}>Gestion des commandes</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
          <option value="ALL">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['ID', 'Client', 'Variante', 'Montant', 'Suivi', 'Statut', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px', color: C.accent, fontWeight: 700 }}>{o.id}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ color: C.text, fontWeight: 600 }}>{o.customer}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{o.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: C.muted, maxWidth: 160 }}>{o.variant}</td>
                  <td style={{ padding: '14px 16px', color: C.text, fontWeight: 700 }}>€{o.amount}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {o.tracking ? <span style={{ color: C.accent, fontSize: 11, fontFamily: 'monospace' }}>{o.tracking}</span> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}><Badge status={o.status} /></td>
                  <td style={{ padding: '14px 16px', color: C.muted }}>{o.date}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => onSelect(o)} style={{ background: C.accent, border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Section Order Detail ───────────────────────────────────
function OrderDetail({ order, onBack }: { order: typeof ORDERS[0]; onBack: () => void }) {
  const [status, setStatus]   = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking || '');
  const [saved, setSaved]     = useState(false);
  const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const curIdx = steps.indexOf(status);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const inp = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties;

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', color: C.muted, cursor: 'pointer', fontSize: 13, marginBottom: 24 }}>← Retour</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.text }}>Commande {order.id}</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>{order.date} · {order.customer}</p>
        </div>
        <Badge status={status} />
      </div>

      {/* Timeline */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 15, color: C.text }}>Suivi de la commande</div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= curIdx ? C.accent : C.border, color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: i === curIdx ? `0 0 0 4px rgba(37,99,235,0.2)` : 'none' }}>
                  {i < curIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i <= curIdx ? C.text : C.muted, textAlign: 'center', whiteSpace: 'nowrap' }}>{STATUS_CONFIG[s]?.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < curIdx ? C.accent : C.border, margin: '0 4px', marginBottom: 24 }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: C.text }}>Mettre à jour</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>N° de suivi CJ</label>
            <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="CJ202605270001" style={inp} />
          </div>
          <button onClick={save} style={{ width: '100%', padding: '12px 0', background: saved ? C.success : C.accent, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {saved ? '✓ Sauvegardé !' : 'Mettre à jour'}
          </button>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: C.text }}>Détails commande</div>
          {[['Produit', order.product], ['Variante', order.variant], ['Montant', `€${order.amount}`], ['Client', order.customer], ['Email', order.email]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ color: C.text, fontWeight: 600, maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: C.text }}>Actions CJ Dropshipping</div>
          {[
            { label: '📦 Passer commande CJ', color: C.accent },
            { label: '🔄 Sync. livraison',    color: C.purple },
            { label: '📧 Email confirmation',  color: C.warning },
            { label: '↩️ Rembourser',          color: C.danger },
          ].map(a => (
            <button key={a.label} style={{ width: '100%', padding: '11px 0', background: 'transparent', border: `1px solid ${a.color}`, borderRadius: 8, color: a.color, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Users ──────────────────────────────────────────
function Users() {
  const [search, setSearch] = useState('');
  const filtered = USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, color: C.text }}>Gestion des utilisateurs</h1>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur…"
        style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['Utilisateur', 'Commandes', 'Total dépensé', 'Inscription', 'Rôle', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: u.role === 'ADMIN' ? `linear-gradient(135deg,${C.accent},#1d4ed8)` : `linear-gradient(135deg,${C.purple},#7c3aed)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>{u.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: C.text }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: C.text, fontWeight: 700 }}>{u.orders}</td>
                  <td style={{ padding: '14px 16px', color: C.accent, fontWeight: 700 }}>€{u.spent}</td>
                  <td style={{ padding: '14px 16px', color: C.muted }}>{u.joined}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: u.role === 'ADMIN' ? 'rgba(37,99,235,0.15)' : 'rgba(139,92,246,0.15)', color: u.role === 'ADMIN' ? C.accent : C.purple, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: u.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.status === 'active' ? C.success : C.danger, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{u.status === 'active' ? 'Actif' : 'Inactif'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Section Promos ─────────────────────────────────────────
function Promos() {
  const [promos, setPromos] = useState(PROMOS_INIT);
  const [form, setForm] = useState({ code: '', discount: '', maxUses: '', expires: '' });
  const toggle = (code: string) => setPromos(p => p.map(x => x.code === code ? { ...x, active: !x.active } : x));
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties;

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, color: C.text }}>Codes promotionnels</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 24 }}>
        {promos.map(p => (
          <div key={p.code} style={{ background: C.card, border: `1px solid ${p.active ? C.accent : C.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: C.text }}>{p.code}</span>
              <button onClick={() => toggle(p.code)} style={{ background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 20, padding: '5px 14px', color: p.active ? C.success : C.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {p.active ? '✓ Actif' : '✗ Inactif'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>-{p.discount}%</div>
                <div style={{ fontSize: 11, color: C.muted }}>Réduction</div>
              </div>
              <div style={{ flex: 1, background: C.bg, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{p.uses}/{p.maxUses}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Utilisations</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Expire : {p.expires}</div>
            <div style={{ background: C.border, borderRadius: 4, height: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(p.uses / p.maxUses) * 100}%`, height: '100%', background: p.active ? C.accent : C.danger, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Créer un code promo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          <div><label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Code</label><input placeholder="NEWCODE" value={form.code} onChange={setF('code')} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Réduction (%)</label><input type="number" placeholder="15" value={form.discount} onChange={setF('discount')} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Max utilisations</label><input type="number" placeholder="500" value={form.maxUses} onChange={setF('maxUses')} style={inp} /></div>
          <div><label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Expire le</label><input type="date" value={form.expires} onChange={setF('expires')} style={inp} /></div>
        </div>
        <button onClick={() => { if (!form.code || !form.discount) return; setPromos(p => [...p, { code: form.code.toUpperCase(), type: 'percentage', discount: Number(form.discount), uses: 0, maxUses: Number(form.maxUses) || 999, active: true, expires: form.expires || '—' }]); setForm({ code: '', discount: '', maxUses: '', expires: '' }); }}
          style={{ marginTop: 18, padding: '12px 28px', background: `linear-gradient(135deg,${C.accent},#1d4ed8)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Créer le code
        </button>
      </div>
    </div>
  );
}

// ── Section Analytics ──────────────────────────────────────
function Analytics() {
  const kpis = [
    { label: 'Panier moyen',        value: '€249', icon: '🛒' },
    { label: 'CLV moyen',           value: '€621', icon: '🏆' },
    { label: 'Abandon panier',      value: '68%',  icon: '⚠️' },
    { label: 'Taux retour',         value: '1.2%', icon: '↩️' },
    { label: 'NPS Score',           value: '87',   icon: '⭐' },
    { label: 'Stock restant',       value: '47',   icon: '📦' },
  ];
  const sources = [
    { src: 'Google Ads', pct: 42, color: C.accent },
    { src: 'TikTok Ads', pct: 28, color: C.purple },
    { src: 'Instagram',  pct: 16, color: '#ec4899' },
    { src: 'Direct',     pct: 9,  color: C.success },
    { src: 'Autres',     pct: 5,  color: C.muted },
  ];
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, color: C.text }}>Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 18, fontSize: 15, color: C.text }}>Revenus par mois</div>
          {MONTHLY.map(m => (
            <div key={m.month} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.muted }}>{m.month}</span>
                <span style={{ color: C.text, fontWeight: 700 }}>€{m.rev.toLocaleString()}</span>
              </div>
              <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                <div style={{ width: `${(m.rev / 7200) * 100}%`, height: '100%', background: `linear-gradient(to right,${C.accent},#60a5fa)`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 18, fontSize: 15, color: C.text }}>Sources de trafic</div>
          {sources.map(s => (
            <div key={s.src} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.muted }}>{s.src}</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.pct}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shell principal ────────────────────────────────────────
export default function AdminPanel() {
  const [active, setActive]             = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<typeof ORDERS[0] | null>(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  const handleSelect = (o: typeof ORDERS[0]) => { setSelectedOrder(o); setActive('order-detail'); };
  const handleBack   = () => { setSelectedOrder(null); setActive('orders'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px} select,option{background:${C.card}} button:hover{opacity:.88}`}</style>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 68, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.3s', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: sidebarOpen ? '24px 20px 20px' : '24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && <span style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PrimeShop</span>}
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>☰</button>
        </div>
        <nav style={{ flex: 1, padding: sidebarOpen ? '16px 12px' : '16px 8px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActive(item.id); setSelectedOrder(null); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: sidebarOpen ? 12 : 0, justifyContent: sidebarOpen ? 'flex-start' : 'center', padding: sidebarOpen ? '11px 14px' : '11px 0', borderRadius: 10, border: 'none', background: active === item.id || (item.id === 'orders' && active === 'order-detail') ? 'rgba(37,99,235,0.15)' : 'transparent', color: active === item.id || (item.id === 'orders' && active === 'order-detail') ? C.accent : C.muted, cursor: 'pointer', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Version</div>
            <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>Admin v2.0</div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 28px', minWidth: 0 }}>
        {active === 'dashboard'    && <Dashboard />}
        {active === 'orders'       && <Orders onSelect={handleSelect} />}
        {active === 'order-detail' && selectedOrder && <OrderDetail order={selectedOrder} onBack={handleBack} />}
        {active === 'users'        && <Users />}
        {active === 'promos'       && <Promos />}
        {active === 'analytics'    && <Analytics />}
      </main>
    </div>
  );
}