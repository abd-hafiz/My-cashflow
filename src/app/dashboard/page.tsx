'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

interface Revenue { id:string; label:string; amount:number; category:string; date:string }
interface Expense { id:string; label:string; amount:number; category:string; date:string }
interface Goal { id:string; label:string; target_amount:number; current_amount:number; type:string }

const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

const CATEGORY_ICONS: Record<string,string> = {
  salaire:'💼', commerce:'🏪', freelance:'💻', trading:'📈',
  location:'🏠', transfert:'💸', autre:'💰',
  alimentation:'🛒', transport:'🚗', logement:'🏠', sante:'🏥',
  communication:'📱', education:'📚', investissement:'📊',
  loisirs:'🎯', habillement:'👔', dette:'🔴',
}

const GOAL_ICONS: Record<string,string> = {
  fonds_urgence:'🛡️', terrain:'🌍', maison:'🏠',
  vehicule:'🚗', investissement_brvm:'📈', personnalise:'🎯',
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRevenue, setShowAddRevenue] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [saving, setSaving] = useState(false)

  const [revForm, setRevForm] = useState({ label:'', amount:'', category:'salaire', date:new Date().toISOString().split('T')[0] })
  const [expForm, setExpForm] = useState({ label:'', amount:'', category:'alimentation', date:new Date().toISOString().split('T')[0] })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0]

    const [profRes, revRes, expRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('revenues').select('*').eq('user_id',user.id).gte('date',firstDay).lte('date',lastDay).order('date',{ascending:false}),
      supabase.from('expenses').select('*').eq('user_id',user.id).gte('date',firstDay).lte('date',lastDay).order('date',{ascending:false}),
      supabase.from('goals').select('*').eq('user_id',user.id).eq('status','en_cours').limit(3),
    ])

    setFirstName(profRes.data?.full_name?.split(' ')[0] || 'vous')
    setRevenues(revRes.data||[])
    setExpenses(expRes.data||[])
    setGoals(goalRes.data||[])
    setLoading(false)
  }

  async function saveRevenue(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('revenues').insert({ ...revForm, amount:parseFloat(revForm.amount), user_id:user!.id })
    setShowAddRevenue(false)
    setRevForm({ label:'', amount:'', category:'salaire', date:new Date().toISOString().split('T')[0] })
    setSaving(false); loadData()
  }

  async function saveExpense(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('expenses').insert({ ...expForm, amount:parseFloat(expForm.amount), user_id:user!.id })
    setShowAddExpense(false)
    setExpForm({ label:'', amount:'', category:'alimentation', date:new Date().toISOString().split('T')[0] })
    setSaving(false); loadData()
  }

  const totalRev = revenues.reduce((s,r)=>s+r.amount,0)
  const totalExp = expenses.reduce((s,e)=>s+e.amount,0)
  const cashflow = totalRev - totalExp
  const tauxEpargne = totalRev>0 ? Math.round((cashflow/totalRev)*100) : 0
  const month = new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})

  const transactions = [
    ...revenues.map(r=>({...r,type:'rev' as const})),
    ...expenses.map(e=>({...e,type:'exp' as const})),
  ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,5)

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'16px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#080C10', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ color:'#64748B', fontSize:'13px' }}>Chargement...</p>
      </div>
    </div>
  )

  return (
    <AppLayout showHeader={false}>
      <style>{`
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-teal:hover{opacity:0.88}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-red{background:linear-gradient(135deg,#EF4444,#DC2626);border:none;border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .tx-row:hover{background:rgba(255,255,255,0.025);border-radius:8px}
        .quick-link:hover{border-color:rgba(0,212,170,0.2)!important;background:rgba(0,212,170,0.03)!important}

        /* Header dashboard personnalisé */
        .dash-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px}
        .dash-actions{display:flex;gap:8px}

        /* FAB mobile */
        .fab-container{display:none;position:fixed;bottom:80px;right:16px;z-index:40;flex-direction:column;gap:10px}

        /* Accès rapide — desktop seulement */
        .quick-links{display:grid;grid-template-columns:1fr 1fr;gap:10px}

        /* MODAL */
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;z-index:200}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
        .modal-handle{width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 20px}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:767px){
          .fab-container{display:flex}
          .quick-links{display:none}
          .dash-actions{display:none}
        }
        @media(min-width:768px){
          .modal-bg{align-items:center}
          .modal{border-radius:14px;max-width:440px}
        }
        select option{background:#0D1923}
      `}</style>

      {/* HEADER DASHBOARD — une seule fois */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Bonjour, {firstName} 👋</h1>
          <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px', textTransform:'capitalize' }}>{month}</p>
        </div>
        <div className="dash-actions">
          <button className="btn-ghost" onClick={()=>setShowAddExpense(true)}>+ Dépense</button>
          <button className="btn-teal" onClick={()=>setShowAddRevenue(true)}>+ Revenu</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'10px', marginBottom:'16px' }}>
        <div style={{ ...card, gridColumn:'span 2', background:'linear-gradient(135deg,rgba(0,212,170,0.08),rgba(0,180,216,0.08))', border:'1px solid rgba(0,212,170,0.15)' }}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Cash-flow du mois</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'26px', fontWeight:'600', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{fmt(cashflow)}</div>
          <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>Taux d'épargne : {tauxEpargne}%</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Revenus</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:'#10B981' }}>{fmt(totalRev)}</div>
          <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>{revenues.length} transaction{revenues.length>1?'s':''}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Dépenses</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:'#EF4444' }}>{fmt(totalExp)}</div>
          <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>{expenses.length} dépense{expenses.length>1?'s':''}</div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div style={{ ...card, marginBottom:'12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>Transactions récentes</div>
          <a href="/dashboard/revenus" style={{ fontSize:'12px', color:'#00D4AA', textDecoration:'none', fontWeight:'600' }}>Voir tout</a>
        </div>
        {transactions.length===0 ? (
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'12px' }}>Aucune transaction ce mois</p>
            <button className="btn-teal" onClick={()=>setShowAddRevenue(true)}>+ Ajouter un revenu</button>
          </div>
        ) : transactions.map(tx=>(
          <div key={tx.id} className="tx-row" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 6px', transition:'background .1s', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:tx.type==='rev'?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
              {CATEGORY_ICONS[tx.category]||'💰'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.label}</div>
              <div style={{ fontSize:'11px', color:'#64748B', marginTop:'1px' }}>{tx.category} · {new Date(tx.date).toLocaleDateString('fr-FR')}</div>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:tx.type==='rev'?'#10B981':'#EF4444', flexShrink:0 }}>
              {tx.type==='rev'?'+':'-'}{fmt(tx.amount)}
            </div>
          </div>
        ))}
      </div>

      {/* OBJECTIFS */}
      {goals.length>0 && (
        <div style={{ ...card, marginBottom:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>Objectifs financiers</div>
            <a href="/dashboard/objectifs" style={{ fontSize:'12px', color:'#00D4AA', textDecoration:'none', fontWeight:'600' }}>Gérer</a>
          </div>
          {goals.map(g=>{
            const pct = Math.min(100,Math.round((g.current_amount/g.target_amount)*100))
            return (
              <div key={g.id} style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#fff' }}>{GOAL_ICONS[g.type]||'🎯'} {g.label}</span>
                  <span style={{ fontSize:'12px', fontWeight:'700', color:'#00D4AA' }}>{pct}%</span>
                </div>
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'5px', overflow:'hidden' }}>
                  <div style={{ height:'5px', width:`${pct}%`, background:'linear-gradient(90deg,#00D4AA,#00B4D8)', borderRadius:'99px' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'11px', color:'#00D4AA' }}>{fmt(g.current_amount)} XOF</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'11px', color:'#64748B' }}>{fmt(g.target_amount)} XOF</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ACCÈS RAPIDE — desktop uniquement */}
      <div className="quick-links">
        {[
          { icon:'◈', label:'Patrimoine', path:'/dashboard/patrimoine' },
          { icon:'⊞', label:'Budget', path:'/dashboard/budget' },
          { icon:'📖', label:'Éducation', path:'/dashboard/education' },
          { icon:'👤', label:'Profil', path:'/dashboard/profil' },
        ].map(item=>(
          <a key={item.label} href={item.path} className="quick-link"
            style={{ display:'flex', alignItems:'center', gap:'12px', ...card, textDecoration:'none', transition:'all .2s' }}>
            <span style={{ fontSize:'20px' }}>{item.icon}</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'#fff' }}>{item.label}</span>
          </a>
        ))}
      </div>

      {/* FAB MOBILE */}
      <div className="fab-container">
        <button onClick={()=>setShowAddExpense(true)} style={{ width:'52px', height:'52px', borderRadius:'50%', background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none', cursor:'pointer', fontSize:'24px', color:'#fff', boxShadow:'0 4px 20px rgba(239,68,68,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
        <button onClick={()=>setShowAddRevenue(true)} style={{ width:'52px', height:'52px', borderRadius:'50%', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', border:'none', cursor:'pointer', fontSize:'24px', color:'#000', boxShadow:'0 4px 20px rgba(0,212,170,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700' }}>+</button>
      </div>

      {/* MODAL REVENU */}
      {showAddRevenue && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddRevenue(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Ajouter un revenu</h3>
              <button onClick={()=>setShowAddRevenue(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={saveRevenue}>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={revForm.label} onChange={e=>setRevForm({...revForm,label:e.target.value})} placeholder="Ex : Salaire juillet" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={revForm.amount} onChange={e=>setRevForm({...revForm,amount:e.target.value})} placeholder="500 000" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={revForm.category} onChange={e=>setRevForm({...revForm,category:e.target.value})}>
                  {['salaire','commerce','freelance','trading','location','transfert','autre'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'20px' }}><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={revForm.date} onChange={e=>setRevForm({...revForm,date:e.target.value})} required /></div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowAddRevenue(false)}>Annuler</button>
                <button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉPENSE */}
      {showAddExpense && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowAddExpense(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Ajouter une dépense</h3>
              <button onClick={()=>setShowAddExpense(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={saveExpense}>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={expForm.label} onChange={e=>setExpForm({...expForm,label:e.target.value})} placeholder="Ex : Loyer juillet" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} placeholder="80 000" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})}>
                  {['alimentation','transport','logement','sante','communication','education','investissement','loisirs','habillement','dette','autre'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'20px' }}><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} required /></div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowAddExpense(false)}>Annuler</button>
                <button type="submit" className="btn-red" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}