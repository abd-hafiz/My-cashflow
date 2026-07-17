'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile { full_name: string; currency: string }
interface Revenue { id: string; label: string; amount: number; category: string; date: string }
interface Expense { id: string; label: string; amount: number; category: string; date: string }
interface Goal { id: string; label: string; target_amount: number; current_amount: number; type: string }

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

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

const NAV = [
  { icon: '▦', label: 'Accueil', path: '/dashboard' },
  { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
  { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
  { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
  { icon: '☰', label: 'Menu', path: '/dashboard/menu' },
]

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [saving, setSaving] = useState(false)

  const [revForm, setRevForm] = useState({ label: '', amount: '', category: 'salaire', date: new Date().toISOString().split('T')[0] })
  const [expForm, setExpForm] = useState({ label: '', amount: '', category: 'alimentation', date: new Date().toISOString().split('T')[0] })

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
      supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'en_cours').limit(3),
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

  const transactions = [
    ...revenues.map(r => ({ ...r, type: 'rev' as const })),
    ...expenses.map(e => ({ ...e, type: 'exp' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

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

  const inputSt: React.CSSProperties = { width: '100%', background: '#080C10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', fontFamily: "'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginBottom: '6px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,212,170,0.2)', borderTopColor: '#00D4AA', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748B', fontSize: '13px' }}>Chargement...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', fontFamily: "'Sora',sans-serif", paddingBottom: '80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        /* TOPBAR */
        .topbar { position: sticky; top: 0; z-index: 50; background: #0D1923; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }

        /* BOTTOM NAV */
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: #0D1923; border-top: 1px solid rgba(255,255,255,0.07); display: flex; padding: 8px 0 env(safe-area-inset-bottom, 8px); }
        .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; background: none; border: none; cursor: pointer; font-family: 'Sora',sans-serif; color: #64748B; font-size: 10px; transition: color .15s; text-decoration: none; }
        .nav-btn.active { color: #00D4AA; }
        .nav-btn-icon { font-size: 18px; line-height: 1; }

        /* SIDEBAR MOBILE */
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; }
        .sidebar-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 280px; background: #0D1923; border-left: 1px solid rgba(255,255,255,0.07); z-index: 101; padding: 24px 16px; display: flex; flex-direction: column; animation: slideIn .2s ease; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        /* CARDS */
        .card { background: #0D1923; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
        .kpi-card { background: #0D1923; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 14px; }

        /* BUTTONS */
        .btn-teal { background: linear-gradient(135deg,#00D4AA,#00B4D8); border: none; border-radius: 10px; padding: 12px 20px; color: #000; font-size: 14px; font-weight: 700; font-family: 'Sora',sans-serif; cursor: pointer; width: 100%; }
        .btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 20px; color: #fff; font-size: 14px; font-weight: 600; font-family: 'Sora',sans-serif; cursor: pointer; width: 100%; }
        .btn-red { background: linear-gradient(135deg,#EF4444,#DC2626); border: none; border-radius: 10px; padding: 12px 20px; color: #fff; font-size: 14px; font-weight: 700; font-family: 'Sora',sans-serif; cursor: pointer; width: 100%; }

        /* FAB */
        .fab { position: fixed; bottom: 90px; right: 20px; z-index: 40; display: flex; flex-direction: column; gap: 10px; }
        .fab-btn { width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }

        /* MODAL */
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
        .modal { background: #0D1923; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px 20px 0 0; padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)); width: 100%; max-height: 90vh; overflow-y: auto; animation: slideUp .25s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .modal-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 99px; margin: 0 auto 20px; }

        /* DESKTOP OVERRIDE */
        @media (min-width: 768px) {
          body { display: flex; }
          .bottom-nav { display: none; }
          .fab { display: none; }
          .desktop-sidebar { display: flex !important; }
          .main-content { margin-left: 220px; }
          .topbar { display: none; }
          .modal { border-radius: 14px; max-width: 440px; position: static; align-self: center; }
          .modal-bg { align-items: center; }
          .kpi-grid { grid-template-columns: repeat(4,1fr); }
        }

        .input-field:focus { outline: none; border-color: #00D4AA !important; box-shadow: 0 0 0 3px rgba(0,212,170,0.12); }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #0D1923; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="desktop-sidebar" style={{ display: 'none', width: '220px', position: 'fixed', top: 0, left: 0, bottom: 0, background: '#0D1923', borderRight: '1px solid rgba(255,255,255,0.07)', flexDirection: 'column', padding: '20px 12px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: '#000' }}>M</div>
          <span style={{ fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyCashflow</span>
        </div>
        {[
          { icon: '▦', label: 'Tableau de bord', path: '/dashboard', active: true },
          { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
          { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
          { icon: '◈', label: 'Patrimoine', path: '/dashboard/patrimoine' },
          { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
          { icon: '⊞', label: 'Budget', path: '/dashboard/budget' },
          { icon: '📖', label: 'Éducation', path: '/dashboard/education' },
          { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
        ].map(item => (
          <a key={item.label} href={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: item.active ? '#00D4AA' : '#64748B', background: item.active ? 'rgba(0,212,170,0.1)' : 'transparent', fontWeight: item.active ? '600' : '400', textDecoration: 'none', marginBottom: '2px' }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px 12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#000' }}>{firstName[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{profile?.full_name}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Niger · XOF</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: "'Sora',sans-serif" }}>
            <span>⏻</span>Déconnexion
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#000' }}>M</div>
          <span style={{ fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyCashflow</span>
        </div>
        <button onClick={() => setShowSidebar(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: '#fff' }}>☰</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ padding: '16px' }}>
        {/* Salutation */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Bonjour, {firstName} 👋</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', textTransform: 'capitalize' }}>{month}</p>
        </div>

        {/* KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg,rgba(0,212,170,0.08),rgba(0,180,216,0.08))', border: '1px solid rgba(0,212,170,0.2)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>Cash-flow du mois</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '28px', fontWeight: '600', background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(epargne)}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Taux d'épargne : {tauxEpargne}%</div>
          </div>
          <div className="kpi-card">
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>Revenus</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '18px', fontWeight: '600', color: '#10B981' }}>{fmt(totalRev)}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>{revenues.length} transaction{revenues.length > 1 ? 's' : ''}</div>
          </div>
          <div className="kpi-card">
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>Dépenses</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '18px', fontWeight: '600', color: '#EF4444' }}>{fmt(totalExp)}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>{expenses.length} dépense{expenses.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="card" style={{ margin: '0 0 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Transactions récentes</div>
            <a href="/dashboard/revenus" style={{ fontSize: '12px', color: '#00D4AA', textDecoration: 'none', fontWeight: '600' }}>Voir tout</a>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>Aucune transaction ce mois</p>
            </div>
          ) : transactions.map(tx => (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: tx.type === 'rev' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {CATEGORY_ICONS[tx.category] || '💰'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>{tx.category} · {new Date(tx.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '13px', fontWeight: '600', color: tx.type === 'rev' ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                {tx.type === 'rev' ? '+' : '-'}{fmt(tx.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* OBJECTIFS */}
        {goals.length > 0 && (
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Objectifs</div>
              <a href="/dashboard/objectifs" style={{ fontSize: '12px', color: '#00D4AA', textDecoration: 'none', fontWeight: '600' }}>Gérer</a>
            </div>
            {goals.map(g => {
              const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
              return (
                <div key={g.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{GOAL_ICONS[g.type] || '🎯'} {g.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#00D4AA' }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '5px', width: `${pct}%`, borderRadius: '99px', background: 'linear-gradient(90deg,#00D4AA,#00B4D8)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: '#00D4AA' }}>{fmt(g.current_amount)} XOF</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: '#64748B' }}>{fmt(g.target_amount)} XOF</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ACCÈS RAPIDE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {[
            { icon: '◈', label: 'Patrimoine', path: '/dashboard/patrimoine', color: '#6366F1' },
            { icon: '⊞', label: 'Budget', path: '/dashboard/budget', color: '#F59E0B' },
            { icon: '📖', label: 'Éducation', path: '/dashboard/education', color: '#00D4AA' },
            { icon: '👤', label: 'Profil', path: '/dashboard/profil', color: '#64748B' },
          ].map(item => (
            <a key={item.label} href={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0D1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', textDecoration: 'none' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* FAB BUTTONS */}
      <div className="fab">
        <button className="fab-btn" onClick={() => setShowAddExpense(true)} style={{ background: '#EF4444', color: '#fff' }}>−</button>
        <button className="fab-btn" onClick={() => setShowAddRevenue(true)} style={{ background: 'linear-gradient(135deg,#00D4AA,#00B4D8)', color: '#000' }}>+</button>
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {[
          { icon: '▦', label: 'Accueil', path: '/dashboard', active: true },
          { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
          { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
          { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
          { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
        ].map(item => (
          <a key={item.label} href={item.path} className={`nav-btn${item.active ? ' active' : ''}`}>
            <span className="nav-btn-icon">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* SIDEBAR DRAWER MOBILE */}
      {showSidebar && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
          <div className="sidebar-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Menu</span>
              <button onClick={() => setShowSidebar(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            {[
              { icon: '▦', label: 'Tableau de bord', path: '/dashboard' },
              { icon: '↑', label: 'Revenus', path: '/dashboard/revenus' },
              { icon: '↓', label: 'Dépenses', path: '/dashboard/depenses' },
              { icon: '◈', label: 'Patrimoine', path: '/dashboard/patrimoine' },
              { icon: '◎', label: 'Objectifs', path: '/dashboard/objectifs' },
              { icon: '⊞', label: 'Budget', path: '/dashboard/budget' },
              { icon: '📖', label: 'Éducation', path: '/dashboard/education' },
              { icon: '👤', label: 'Profil', path: '/dashboard/profil' },
            ].map(item => (
              <a key={item.label} href={item.path} onClick={() => setShowSidebar(false)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 12px', borderRadius: '10px', fontSize: '15px', color: '#fff', textDecoration: 'none', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px', width: '24px', textAlign: 'center' }}>{item.icon}</span>{item.label}
              </a>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '15px', fontFamily: "'Sora',sans-serif" }}>
                <span>⏻</span>Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL REVENU */}
      {showAddRevenue && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddRevenue(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Ajouter un revenu</h3>
              <button onClick={() => setShowAddRevenue(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveRevenue}>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={revForm.label} onChange={e => setRevForm({ ...revForm, label: e.target.value })} placeholder="Ex : Salaire juillet" required /></div>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={revForm.amount} onChange={e => setRevForm({ ...revForm, amount: e.target.value })} placeholder="500 000" required /></div>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={revForm.category} onChange={e => setRevForm({ ...revForm, category: e.target.value })}>
                  {['salaire','commerce','freelance','trading','location','transfert','autre'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={revForm.date} onChange={e => setRevForm({ ...revForm, date: e.target.value })} required /></div>
              <button type="submit" className="btn-teal" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉPENSE */}
      {showAddExpense && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowAddExpense(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Ajouter une dépense</h3>
              <button onClick={() => setShowAddExpense(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveExpense}>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={expForm.label} onChange={e => setExpForm({ ...expForm, label: e.target.value })} placeholder="Ex : Loyer juillet" required /></div>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="80 000" required /></div>
              <div style={{ marginBottom: '14px' }}><label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                  {['alimentation','transport','logement','sante','communication','education','investissement','loisirs','habillement','dette','autre'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} required /></div>
              <button type="submit" className="btn-red" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}