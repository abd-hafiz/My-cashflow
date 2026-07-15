'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Budget { id:string; category:string; limit_amount:number; month:string }
interface Expense { category:string; amount:number }

const CATEGORIES = ['alimentation','transport','logement','sante','communication','education','investissement','loisirs','habillement','dette','autre']
const CAT_ICONS: Record<string,string> = { alimentation:'🛒', transport:'🚗', logement:'🏠', sante:'🏥', communication:'📱', education:'📚', investissement:'📊', loisirs:'🎯', habillement:'👔', dette:'🔴', autre:'💸' }
const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

export default function BudgetPage() {
  const router = useRouter()
  const supabase = createClient()

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0,7))
  const [form, setForm] = useState({ category:'alimentation', limit_amount:'' })
  const [editId, setEditId] = useState<string|null>(null)

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const firstDay = `${filterMonth}-01`
    const lastDay = new Date(parseInt(filterMonth.split('-')[0]), parseInt(filterMonth.split('-')[1]), 0).toISOString().split('T')[0]

    const [b, e] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', firstDay),
      supabase.from('expenses').select('category,amount').eq('user_id', user.id).gte('date', firstDay).lte('date', lastDay),
    ])

    setBudgets(b.data || [])
    setExpenses(e.data || [])
    setLoading(false)
  }

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const firstDay = `${filterMonth}-01`

    if (editId) {
      await supabase.from('budgets').update({ limit_amount: parseFloat(form.limit_amount) }).eq('id', editId)
    } else {
      await supabase.from('budgets').upsert({ category: form.category, limit_amount: parseFloat(form.limit_amount), month: firstDay, user_id: user!.id }, { onConflict: 'user_id,category,month' })
    }

    setSaving(false); setShowModal(false); setEditId(null)
    setForm({ category:'alimentation', limit_amount:'' })
    loadData()
  }

  async function deleteBudget(id:string) {
    await supabase.from('budgets').delete().eq('id', id)
    loadData()
  }

  // Calcul dépenses par catégorie
  const expByCat: Record<string,number> = {}
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount })

  const totalBudget = budgets.reduce((s,b) => s + b.limit_amount, 0)
  const totalSpent = budgets.reduce((s,b) => s + (expByCat[b.category] || 0), 0)
  const totalRemaining = totalBudget - totalSpent

  // Catégories sans budget
  const catsWithBudget = budgets.map(b => b.category)
  const catsWithoutBudget = CATEGORIES.filter(c => !catsWithBudget.includes(c))

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'20px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'13px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', fontFamily:"'Sora',sans-serif", display:'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-teal:hover{opacity:0.88}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;width:100%;max-width:420px;animation:fadeIn .2s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        select option{background:#0D1923}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:'220px', flexShrink:0, background:'#0D1923', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 4px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'12px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#000' }}>M</div>
          <span style={{ fontSize:'14px', fontWeight:'700', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</span>
        </div>
        {[
          {icon:'▦',label:'Tableau de bord',path:'/dashboard'},
          {icon:'↑',label:'Revenus',path:'/dashboard/revenus'},
          {icon:'↓',label:'Dépenses',path:'/dashboard/depenses'},
          {icon:'◈',label:'Patrimoine',path:'/dashboard/patrimoine'},
          {icon:'◎',label:'Objectifs',path:'/dashboard/objectifs'},
          {icon:'⊞',label:'Budget',path:'/dashboard/budget',active:true},
          {icon:'📖',label:'Éducation',path:'/dashboard/education'},
        ].map(item=>(
          <a key={item.label} href={item.path} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', fontSize:'13px', color:item.active?'#00D4AA':'#64748B', background:item.active?'rgba(0,212,170,0.1)':'transparent', fontWeight:item.active?'600':'400', textDecoration:'none', marginBottom:'2px' }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <a href="/login" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', fontSize:'13px', color:'#EF4444', textDecoration:'none' }}><span>⏻</span>Déconnexion</a>
        </div>
      </aside>

      <main style={{ flex:1, padding:'28px', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Budget mensuel</h1>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>Plafonds de dépenses par catégorie</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="input-field" style={{ ...inputSt, width:'160px' }} />
            <button className="btn-teal" onClick={()=>{ setEditId(null); setForm({ category: catsWithoutBudget[0]||'alimentation', limit_amount:'' }); setShowModal(true) }}>+ Ajouter un budget</button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'20px' }}>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Budget total</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#fff' }}>{fmt(totalBudget)}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>XOF planifié</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Dépensé</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color: totalSpent > totalBudget ? '#EF4444' : '#F59E0B' }}>{fmt(totalSpent)}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}% du budget</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Restant</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color: totalRemaining >= 0 ? '#10B981' : '#EF4444' }}>{fmt(Math.abs(totalRemaining))}</div>
            <div style={{ fontSize:'12px', color: totalRemaining >= 0 ? '#10B981' : '#EF4444', marginTop:'4px' }}>{totalRemaining >= 0 ? '✓ Dans les limites' : '⚠ Dépassement'}</div>
          </div>
        </div>

        {/* Budgets par catégorie */}
        <div style={card}>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'16px' }}>Suivi par catégorie</div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'40px' }}>
              <div style={{ width:'32px', height:'32px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
            </div>
          ) : budgets.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📊</div>
              <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px' }}>Aucun budget défini pour ce mois</p>
              <button className="btn-teal" onClick={()=>setShowModal(true)}>+ Créer un budget</button>
            </div>
          ) : budgets.map(b => {
            const spent = expByCat[b.category] || 0
            const pct = Math.min(100, Math.round((spent / b.limit_amount) * 100))
            const over = spent > b.limit_amount
            const barColor = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#00D4AA'

            return (
              <div key={b.id} style={{ marginBottom:'20px', padding:'16px', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:`1px solid ${over?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'18px' }}>{CAT_ICONS[b.category]||'💸'}</span>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:'600', color:'#fff', textTransform:'capitalize' }}>{b.category}</div>
                      {over && <div style={{ fontSize:'11px', color:'#EF4444', marginTop:'1px' }}>⚠ Dépassement de {fmt(spent - b.limit_amount)} XOF</div>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color: over?'#EF4444':'#fff' }}>{fmt(spent)} / {fmt(b.limit_amount)}</div>
                      <div style={{ fontSize:'11px', color:'#64748B' }}>XOF · {pct}%</div>
                    </div>
                    <button onClick={()=>{ setEditId(b.id); setForm({ category:b.category, limit_amount:String(b.limit_amount) }); setShowModal(true) }} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#94A3B8', cursor:'pointer', fontSize:'12px' }}>✏️</button>
                    <button onClick={()=>deleteBudget(b.id)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#EF4444', cursor:'pointer', fontSize:'12px' }}>🗑️</button>
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'6px', overflow:'hidden' }}>
                  <div style={{ height:'6px', width:`${pct}%`, background:barColor, borderRadius:'99px', transition:'width .4s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                  <span style={{ fontSize:'11px', color:'#64748B' }}>Dépensé</span>
                  <span style={{ fontSize:'11px', color: over?'#EF4444':'#10B981' }}>{over ? `−${fmt(spent-b.limit_amount)} dépassé` : `${fmt(b.limit_amount-spent)} restant`}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>{editId ? 'Modifier le budget' : 'Ajouter un budget'}</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'20px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={saveBudget}>
              {!editId && (
                <div style={{ marginBottom:'14px' }}>
                  <label style={labelSt}>Catégorie</label>
                  <select className="input-field" style={inputSt} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {(editId ? CATEGORIES : catsWithoutBudget.length > 0 ? catsWithoutBudget : CATEGORIES).map(c=>(
                      <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>
              )}
              {editId && (
                <div style={{ background:'rgba(0,212,170,0.06)', borderRadius:'8px', padding:'12px', marginBottom:'14px' }}>
                  <span style={{ fontSize:'13px', color:'#00D4AA', fontWeight:'600' }}>{CAT_ICONS[form.category]} {form.category}</span>
                </div>
              )}
              <div style={{ marginBottom:'20px' }}>
                <label style={labelSt}>Plafond mensuel (XOF)</label>
                <input className="input-field" style={inputSt} type="number" min="1" value={form.limit_amount} onChange={e=>setForm({...form,limit_amount:e.target.value})} placeholder="150 000" required autoFocus />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':editId?'Modifier':'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}