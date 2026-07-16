// ============================================================
// OBJECTIFS — src/app/dashboard/objectifs/page.tsx
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

interface Goal { id:string; label:string; type:string; target_amount:number; current_amount:number; deadline:string; status:string; note:string }

const GOAL_TYPES = ['fonds_urgence','terrain','maison','vehicule','investissement_brvm','personnalise']
const GOAL_ICONS: Record<string,string> = { fonds_urgence:'🛡️', terrain:'🌍', maison:'🏠', vehicule:'🚗', investissement_brvm:'📈', personnalise:'🎯' }
const GOAL_LABELS: Record<string,string> = { fonds_urgence:"Fonds d'urgence", terrain:'Achat terrain', maison:'Achat maison', vehicule:'Achat véhicule', investissement_brvm:'Investissement BRVM', personnalise:'Objectif personnalisé' }
const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

export function ObjectifsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal|null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'en_cours'|'atteint'|'tous'>('en_cours')
  const [form, setForm] = useState({ label:'', type:'fonds_urgence', target_amount:'', deadline:'', note:'' })
  const [contribAmount, setContribAmount] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('goals').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setGoals(data||[])
    setLoading(false)
  }

  async function saveGoal(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('goals').insert({ ...form, target_amount:parseFloat(form.target_amount), current_amount:0, status:'en_cours', user_id:user!.id })
    setSaving(false); setShowModal(false)
    setForm({ label:'', type:'fonds_urgence', target_amount:'', deadline:'', note:'' })
    loadData()
  }

  async function saveContrib(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('goal_contributions').insert({ goal_id:selectedGoal!.id, user_id:user!.id, amount:parseFloat(contribAmount), date:new Date().toISOString().split('T')[0] })
    setSaving(false); setShowContrib(false); setContribAmount('')
    loadData()
  }

  const filtered = goals.filter(g=>filterStatus==='tous'||g.status===filterStatus)
  const totalSaved = goals.filter(g=>g.status==='en_cours').reduce((s,g)=>s+g.current_amount,0)
  const totalTarget = goals.filter(g=>g.status==='en_cours').reduce((s,g)=>s+g.target_amount,0)

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'16px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  return (
    <AppLayout title="Objectifs financiers" subtitle="Définissez et suivez vos projets"
      actions={<button className="btn-teal" onClick={()=>setShowModal(true)}>+ Créer un objectif</button>}>
      <style>{`
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .goal-card{transition:border-color .2s}
        .goal-card:hover{border-color:rgba(0,212,170,0.2)!important}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;z-index:200}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
        .modal-handle{width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 20px}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(min-width:768px){.modal-bg{align-items:center}.modal{border-radius:14px;max-width:440px}}
        select option{background:#0D1923}
      `}</style>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px', marginBottom:'16px' }}>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>En cours</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#F59E0B' }}>{goals.filter(g=>g.status==='en_cours').length}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Épargné</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:'#00D4AA' }}>{fmt(totalSaved)}</div>
          <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>XOF</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Atteints</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#10B981' }}>{goals.filter(g=>g.status==='atteint').length}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Progression</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#6366F1' }}>{totalTarget>0?Math.round((totalSaved/totalTarget)*100):0}%</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:'4px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'14px', width:'fit-content' }}>
        {(['en_cours','atteint','tous'] as const).map(s=>(
          <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:'7px 14px', borderRadius:'7px', border:'none', fontSize:'12px', fontWeight:'600', cursor:'pointer', background:filterStatus===s?'#0D1923':'transparent', color:filterStatus===s?'#fff':'#64748B', fontFamily:"'Sora',sans-serif" }}>
            {s==='en_cours'?'En cours':s==='atteint'?'Atteints':'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px' }}><div style={{ width:'32px', height:'32px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></div>
      ) : filtered.length===0 ? (
        <div style={{ ...card, textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🎯</div>
          <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff', marginBottom:'8px' }}>Aucun objectif</h3>
          <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'20px' }}>Créez votre premier objectif financier</p>
          <button className="btn-teal" onClick={()=>setShowModal(true)}>+ Créer un objectif</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'14px' }}>
          {filtered.map(g=>{
            const pct = Math.min(100,Math.round((g.current_amount/g.target_amount)*100))
            const remaining = g.target_amount - g.current_amount
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime()-Date.now())/(1000*60*60*24)) : null
            return (
              <div key={g.id} className="goal-card" style={{ ...card, border:`1px solid ${g.status==='atteint'?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.07)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(0,212,170,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{GOAL_ICONS[g.type]||'🎯'}</div>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{g.label}</div>
                      <div style={{ fontSize:'11px', color:'#64748B', marginTop:'1px' }}>{GOAL_LABELS[g.type]}</div>
                    </div>
                  </div>
                  {g.status==='atteint'&&<span style={{ fontSize:'10px', background:'rgba(16,185,129,0.15)', color:'#10B981', padding:'3px 8px', borderRadius:'99px', fontWeight:'700' }}>✓ Atteint</span>}
                </div>
                <div style={{ marginBottom:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'12px', color:'#64748B' }}>Progression</span>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:pct>=100?'#10B981':'#00D4AA' }}>{pct}%</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'6px', overflow:'hidden' }}>
                    <div style={{ height:'6px', width:`${pct}%`, background:pct>=100?'#10B981':'linear-gradient(90deg,#00D4AA,#00B4D8)', borderRadius:'99px' }} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                  <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'8px' }}>
                    <div style={{ fontSize:'10px', color:'#64748B', marginBottom:'3px' }}>Épargné</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'12px', fontWeight:'600', color:'#00D4AA' }}>{fmt(g.current_amount)}</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'8px' }}>
                    <div style={{ fontSize:'10px', color:'#64748B', marginBottom:'3px' }}>Objectif</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'12px', fontWeight:'600', color:'#fff' }}>{fmt(g.target_amount)}</div>
                  </div>
                </div>
                {remaining>0&&<div style={{ fontSize:'12px', color:'#64748B', marginBottom:'4px' }}>Reste : <span style={{ color:'#F59E0B', fontWeight:'600' }}>{fmt(remaining)} XOF</span></div>}
                {daysLeft!==null&&<div style={{ fontSize:'12px', color:daysLeft<30?'#EF4444':'#64748B', marginBottom:'12px' }}>Échéance : {daysLeft>0?`dans ${daysLeft}j`:'Dépassée'}</div>}
                <div style={{ display:'flex', gap:'8px' }}>
                  {g.status==='en_cours'&&<button className="btn-teal" style={{ flex:1, fontSize:'12px', padding:'8px' }} onClick={()=>{setSelectedGoal(g);setShowContrib(true)}}>+ Verser</button>}
                  <button onClick={async()=>{await supabase.from('goal_contributions').delete().eq('goal_id',g.id);await supabase.from('goals').delete().eq('id',g.id);loadData()}} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'8px', padding:'8px 12px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CRÉER */}
      {showModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Créer un objectif</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={saveGoal}>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Ex : Fonds d'urgence 6 mois" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Type</label><select className="input-field" style={inputSt} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{GOAL_TYPES.map(t=><option key={t} value={t}>{GOAL_ICONS[t]} {GOAL_LABELS[t]}</option>)}</select></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                <div><label style={labelSt}>Montant cible (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={form.target_amount} onChange={e=>setForm({...form,target_amount:e.target.value})} placeholder="2 000 000" required /></div>
                <div><label style={labelSt}>Échéance</label><input className="input-field" style={inputSt} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></div>
              </div>
              <div style={{ marginBottom:'20px' }}><label style={labelSt}>Note</label><input className="input-field" style={inputSt} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Remarque..." /></div>
              <div style={{ display:'flex', gap:'10px' }}><button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button><button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':'Créer'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERSER */}
      {showContrib&&selectedGoal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowContrib(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Verser</h3>
              <button onClick={()=>setShowContrib(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <div style={{ background:'rgba(0,212,170,0.06)', borderRadius:'10px', padding:'14px', marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#fff', marginBottom:'4px' }}>{GOAL_ICONS[selectedGoal.type]} {selectedGoal.label}</div>
              <div style={{ fontSize:'12px', color:'#64748B' }}>{fmt(selectedGoal.current_amount)} / {fmt(selectedGoal.target_amount)} XOF · {Math.round((selectedGoal.current_amount/selectedGoal.target_amount)*100)}%</div>
            </div>
            <form onSubmit={saveContrib}>
              <div style={{ marginBottom:'20px' }}><label style={labelSt}>Montant à verser (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={contribAmount} onChange={e=>setContribAmount(e.target.value)} placeholder="50 000" required autoFocus /></div>
              <div style={{ display:'flex', gap:'10px' }}><button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowContrib(false)}>Annuler</button><button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Versement...':'Verser'}</button></div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default ObjectifsPage