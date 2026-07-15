'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Notifications from '@/components/Notifications'

// ── Types ────────────────────────────────────────────────
interface Profile { full_name: string; currency: string }
interface Revenue { id: string; label: string; amount: number; category: string; date: string }
interface Expense { id: string; label: string; amount: number; category: string; date: string }
interface Goal { id: string; label: string; target_amount: number; current_amount: number; type: string }

// ── Helpers ──────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n)

const CATEGORY_ICONS: Record<string, string> = {
  salaire: '💼', commerce: '🏪', freelance: '💻', trading: '📈',
  location: '🏠', transfert: '💸', autre: '💰',
  alimentation: '🛒', transport: '🚗', logement: '🏠', sante: '🏥',
  communication: '📱', education: '📚', investissement: '📊',
  loisirs: '🎯', habillement: '👔', dette: '🔴',
}

const GOAL_ICONS: Record<string, string> = {
  fonds_urgence: '🛡️', terrain: '🌍', maison: '🏠',
  vehicule: '🚗', investissement_brvm: '📈', personnalise: '🎯',
}

// ── Nav items ────────────────────────────────────────────
const NAV = [
  { icon: '▦', label: 'Tableau de bord', path: '/dashboard', active: true },
  { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
  { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
  { icon: '◈', label: 'Patrimoine', path: '/dashboard/patrimoine' },
  { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
  { icon: '⊞', label: 'Budget', path: '/dashboard/budget' },
  { icon: '📖', label: 'Éducation', path: '/dashboard/education' },
  { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
]

// ════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Modaux
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)

  // Formulaires
  const [revForm, setRevForm] = useState({ label: '', amount: '', category: 'salaire', date: new Date().toISOString().split('T')[0] })
  const [expForm, setExpForm] = useState({ label: '', amount: '', category: 'alimentation', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [profRes, revRes, expRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('full_name,currency').eq('id', user.id).single(),
      supabase.from('revenues').select('*').eq('user_id', user.id).gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'en_cours').limit(4),
    ])

    setProfile(profRes.data)
    setRevenues(revRes.data || [])
    setExpenses(expRes.data || [])
    setGoals(goalRes.data || [])
    setLoading(false)
  }

  const totalRev = revenues.reduce((s, r) => s + r.amount, 0)
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0)
  const epargne = totalRev - totalExp
  const tauxEpargne = totalRev > 0 ? Math.round((epargne / totalRev) * 100) : 0

  // Dernières transactions (mélange revenus + dépenses, triées par date)
  const transactions = [
    ...revenues.map(r => ({ ...r, type: 'rev' as const })),
    ...expenses.map(e => ({ ...e, type: 'exp' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function saveRevenue(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('revenues').insert({ ...revForm, amount: parseFloat(revForm.amount), user_id: user!.id })
    setShowAddRevenue(false)
    setRevForm({ label: '', amount: '', category: 'salaire', date: new Date().toISOString().split('T')[0] })
    setSaving(false); loadData()
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('expenses').insert({ ...expForm, amount: parseFloat(expForm.amount), user_id: user!.id })
    setShowAddExpense(false)
    setExpForm({ label: '', amount: '', category: 'alimentation', date: new Date().toISOString().split('T')[0] })
    setSaving(false); loadData()
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'vous'
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // ── Styles communs ───────────────────────────────────
  const card: React.CSSProperties = {
    background: '#0D1923', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', padding: '20px',
  }
  const inputSt: React.CSSProperties = {
    width: '100%', background: '#080C10',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    padding: '10px 14px', color: '#fff', fontSize: '13px',
    fontFamily: "'Sora',sans-serif",
  }
  const labelSt: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: '#94A3B8', marginBottom: '6px',
  }

  // ── Loader ───────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,212,170,0.2)', borderTopColor: '#00D4AA', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B', fontSize: '13px' }}>Chargement de vos finances...</p>
      </div>
    </div>
  )

  // ── Render principal ─────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080C10', fontFamily: "'Sora',sans-serif", display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; font-size:13px; color:#64748B; cursor:pointer; transition:all .15s; text-decoration:none; }
        .nav-item:hover { background:rgba(255,255,255,0.04); color:#fff; }
        .nav-item.active { background:rgba(0,212,170,0.1); color:#00D4AA; font-weight:600; }
        .btn-teal { background:linear-gradient(135deg,#00D4AA,#00B4D8); border:none; border-radius:8px; padding:9px 16px; color:#000; font-size:13px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; transition:opacity .15s; }
        .btn-teal:hover { opacity:0.88; }
        .btn-ghost { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:9px 16px; color:#fff; font-size:13px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; }
        .btn-ghost:hover { background:rgba(255,255,255,0.1); }
        .input-field:focus { outline:none; border-color:#00D4AA !important; box-shadow:0 0 0 3px rgba(0,212,170,0.12); }
        .tx-row:hover { background:rgba(255,255,255,0.025); border-radius:8px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:100; padding:24px; }
        .modal { background:#0D1923; border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:28px; width:100%; max-width:420px; animation:fadeIn .2s ease; }
        select option { background:#0D1923; }
      `}</style>

      {/* ── SIDEBAR ────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? '220px' : '64px', flexShrink: 0,
        background: '#0D1923', borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', padding: '20px 12px',
        transition: 'width .2s', overflow: 'hidden', position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: '#000', flexShrink: 0 }}>M</div>
          {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap' }}>MyCashflow</span>}
        </div>

        {/* Navigation */}
        {NAV.map(item => (
          <a key={item.label} href={item.path} className={`nav-item${item.active ? ' active' : ''}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
            {sidebarOpen && item.label}
          </a>
        ))}

        {/* Déconnexion */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#000', flexShrink: 0 }}>
                {firstName[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name}</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Niger · XOF</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: '#EF4444', cursor: 'pointer' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⏻</span>
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 28px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Bonjour, {firstName} 👋
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '3px', textTransform: 'capitalize' }}>{month}</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <Notifications />
            <button className="btn-ghost" onClick={() => setShowAddExpense(true)}>+ Dépense</button>
            <button className="btn-teal" onClick={() => setShowAddRevenue(true)}>+ Revenu</button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Cash-flow du mois', value: fmt(epargne), currency: 'XOF', color: epargne >= 0 ? '#10B981' : '#EF4444', gradient: true, sub: `Taux d'épargne : ${tauxEpargne}%` },
            { label: 'Revenus', value: fmt(totalRev), currency: 'XOF', color: '#10B981', sub: `${revenues.length} transaction${revenues.length > 1 ? 's' : ''}` },
            { label: 'Dépenses', value: fmt(totalExp), currency: 'XOF', color: '#EF4444', sub: `${expenses.length} transaction${expenses.length > 1 ? 's' : ''}` },
            { label: 'Objectifs actifs', value: String(goals.length), currency: '', color: '#F59E0B', sub: 'en cours ce mois' },
          ].map((k, i) => (
            <div key={i} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
              {i === 0 && <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'linear-gradient(135deg,#00D4AA22,#00B4D822)', borderRadius: '50%' }} />}
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>{k.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '24px', fontWeight: '600', color: k.gradient ? 'transparent' : k.color, background: k.gradient ? `linear-gradient(135deg,#00D4AA,#00B4D8)` : 'none', WebkitBackgroundClip: k.gradient ? 'text' : 'unset', WebkitTextFillColor: k.gradient ? 'transparent' : 'unset' }}>
                {k.value} <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748B' }}>{k.currency}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── GRILLE PRINCIPALE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Transactions récentes */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Transactions récentes</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{month}</div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💸</div>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Aucune transaction ce mois</p>
                <button className="btn-teal" onClick={() => setShowAddRevenue(true)}>Ajouter un revenu</button>
              </div>
            ) : transactions.map(tx => (
              <div key={tx.id} className="tx-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 6px', transition: 'background .1s' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: tx.type === 'rev' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                  {CATEGORY_ICONS[tx.category] || '💰'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>{tx.category} · {new Date(tx.date).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: '600', color: tx.type === 'rev' ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                  {tx.type === 'rev' ? '+' : '-'}{fmt(tx.amount)}
                </div>
              </div>
            ))}
          </div>

          {/* Objectifs */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Objectifs financiers</div>
              <a href="/dashboard/objectifs" style={{ fontSize: '12px', color: '#00D4AA', textDecoration: 'none', fontWeight: '600' }}>Gérer</a>
            </div>

            {goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Aucun objectif défini</p>
                <a href="/dashboard/objectifs" className="btn-teal" style={{ textDecoration: 'none', padding: '9px 16px', borderRadius: '8px', display: 'inline-block', fontSize: '13px', fontWeight: '700', color: '#000' }}>Créer un objectif</a>
              </div>
            ) : goals.map(g => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              return (
                <div key={g.id} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {GOAL_ICONS[g.type] || '🎯'} {g.label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#00D4AA' }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '5px', width: `${pct}%`, borderRadius: '99px', background: pct >= 100 ? '#10B981' : 'linear-gradient(90deg,#00D4AA,#00B4D8)', transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: '#00D4AA' }}>{fmt(g.current_amount)} XOF</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: '#64748B' }}>{fmt(g.target_amount)} XOF</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RÉSUMÉ PAR CATÉGORIE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Revenus par catégorie */}
          <div style={card}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Revenus par source</div>
            {(() => {
              const bycat: Record<string, number> = {}
              revenues.forEach(r => { bycat[r.category] = (bycat[r.category] || 0) + r.amount })
              const entries = Object.entries(bycat).sort((a, b) => b[1] - a[1])
              if (!entries.length) return <p style={{ fontSize: '13px', color: '#64748B', padding: '16px 0' }}>Aucun revenu ce mois.</p>
              return entries.map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{CATEGORY_ICONS[cat] || '💰'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', color: '#10B981' }}>{fmt(amt)}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '3px' }}>
                      <div style={{ height: '3px', width: `${(amt / totalRev) * 100}%`, background: '#10B981', borderRadius: '99px' }} />
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Dépenses par catégorie */}
          <div style={card}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Dépenses par catégorie</div>
            {(() => {
              const bycat: Record<string, number> = {}
              expenses.forEach(e => { bycat[e.category] = (bycat[e.category] || 0) + e.amount })
              const entries = Object.entries(bycat).sort((a, b) => b[1] - a[1])
              if (!entries.length) return <p style={{ fontSize: '13px', color: '#64748B', padding: '16px 0' }}>Aucune dépense ce mois.</p>
              return entries.map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{CATEGORY_ICONS[cat] || '💸'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '12px', color: '#EF4444' }}>{fmt(amt)}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '3px' }}>
                      <div style={{ height: '3px', width: `${totalExp > 0 ? (amt / totalExp) * 100 : 0}%`, background: '#EF4444', borderRadius: '99px' }} />
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </main>

      {/* ── MODAL REVENU ── */}
      {showAddRevenue && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddRevenue(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Ajouter un revenu</h3>
              <button onClick={() => setShowAddRevenue(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveRevenue}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Libellé</label>
                <input className="input-field" style={inputSt} value={revForm.label} onChange={e => setRevForm({ ...revForm, label: e.target.value })} placeholder="Ex : Salaire juillet" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Montant (XOF)</label>
                <input className="input-field" style={inputSt} type="number" min="1" value={revForm.amount} onChange={e => setRevForm({ ...revForm, amount: e.target.value })} placeholder="500 000" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={revForm.category} onChange={e => setRevForm({ ...revForm, category: e.target.value })}>
                  {['salaire','commerce','freelance','trading','location','transfert','autre'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelSt}>Date</label>
                <input className="input-field" style={inputSt} type="date" value={revForm.date} onChange={e => setRevForm({ ...revForm, date: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddRevenue(false)}>Annuler</button>
                <button type="submit" className="btn-teal" style={{ flex: 1 }} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DÉPENSE ── */}
      {showAddExpense && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddExpense(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Ajouter une dépense</h3>
              <button onClick={() => setShowAddExpense(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveExpense}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Libellé</label>
                <input className="input-field" style={inputSt} value={expForm.label} onChange={e => setExpForm({ ...expForm, label: e.target.value })} placeholder="Ex : Loyer juillet" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Montant (XOF)</label>
                <input className="input-field" style={inputSt} type="number" min="1" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="80 000" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                  {['alimentation','transport','logement','sante','communication','education','investissement','loisirs','habillement','dette','autre'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelSt}>Date</label>
                <input className="input-field" style={inputSt} type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddExpense(false)}>Annuler</button>
                <button type="submit" className="btn-teal" style={{ flex: 1 }} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}