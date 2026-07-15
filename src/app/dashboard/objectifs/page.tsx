'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Goal { id:string; label:string; type:string; target_amount:number; current_amount:number; deadline:string; status:string; note:string }

const GOAL_TYPES = ['fonds_urgence','terrain','maison','vehicule','investissement_brvm','personnalise']
const GOAL_ICONS: Record<string,string> = { fonds_urgence:'🛡️', terrain:'🌍', maison:'🏠', vehicule:'🚗', investissement_brvm:'📈', personnalise:'🎯' }
const GOAL_LABELS: Record<string,string> = { fonds_urgence:'Fonds d\'urgence', terrain:'Achat terrain', maison:'Achat maison', vehicule:'Achat véhicule', investissement_brvm:'Investissement BRVM', personnalise:'Objectif personnalisé' }

const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

export default function ObjectifsPage() {
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
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending:false })
    setGoals(data || [])
    setLoading(false)
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('goals').insert({ ...form, target_amount:parseFloat(form.target_amount), current_amount:0, status:'en_cours', user_id:user!.id })
    setSaving(false); setShowModal(false)
    setForm({ label:'', type:'fonds_urgence', target_amount:'', deadline:'', note:'' })
    loadData()
  }

  async function saveContrib(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('goal_contributions').insert({ goal_id:selectedGoal!.id, user_id:user!.id, amount:parseFloat(contribAmount), date:new Date().toISOString().split('T')[0] })
    setSaving(false); setShowContrib(false); setContribAmount('')
    loadData()
  }

  async function deleteGoal(id:string) {
    await supabase.from('goal_contributions').delete().eq('goal_id', id)
    await supabase.from('goals').delete().eq('id', id)
    loadData()
  }

  const filtered = goals.filter(g => filterStatus === 'tous' || g.status === filterStatus)
  const totalTarget = goals.filter(g=>g.status==='en_cours').reduce((s,g)=>s+g.target_amount,0)
  const totalSaved = goals.filter(g=>g.status==='en_cours').reduce((s,g)=>s+g.current_amount,0)

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
        .goal-card:hover{border-color:rgba(0,212,170,0.2)!important}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;width:100%;max-width:440px;animation:fadeIn .2s ease}
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
          {icon:'◎',label:'Objectifs',path:'/dashboard/objectifs',active:true},
          {icon:'⊞',label:'Budget',path:'/dashboard/budget'},
          {icon:'📖',label:'Éducation',path:'/dashboard/education'},
        ].map(item=>(
          <a key={item.label} href={item.path} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', fontSize:'13px', color:item.active?'#00D4AA':'#64748B', background:item.active?'rgba(0,212,170,0.1)':'transparent', fontWeight:item.active?'600':'400', textDecoration:'none', marginBottom:'2px' }}>
            <span style={{ fontSize:'16px' }}>{item.icon}</span>{item.label}
          </a>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <a href="/login" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', fontSize:'13px', color:'#EF4444', textDecoration:'none' }}><span>⏻</span>Déconnexion</a>
        </div>
      </aside>

      <main style={{ flex:1, padding:'28px', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Objectifs financiers</h1>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>Définissez et suivez vos projets</p>
          </div>
          <button className="btn-teal" onClick={()=>setShowModal(true)}>+ Créer un objectif</button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px', marginBottom:'20px' }}>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Objectifs en cours</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#F59E0B' }}>{goals.filter(g=>g.status==='en_cours').length}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>sur {goals.length} au total</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Total épargné</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#00D4AA' }}>{fmt(totalSaved)}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>XOF sur {fmt(totalTarget)}</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Objectifs atteints</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#10B981' }}>{goals.filter(g=>g.status==='atteint').length}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>🎉 félicitations !</div>
          </div>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Progression globale</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', color:'#6366F1' }}>{totalTarget>0?Math.round((totalSaved/totalTarget)*100):0}%</div>
            <div style={{ marginTop:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'4px', overflow:'hidden' }}>
              <div style={{ height:'4px', width:`${totalTarget>0?(totalSaved/totalTarget)*100:0}%`, background:'linear-gradient(90deg,#6366F1,#00D4AA)', borderRadius:'99px' }} />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display:'flex', gap:'4px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'16px', width:'fit-content' }}>
          {(['en_cours','atteint','tous'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:'7px 16px', borderRadius:'7px', border:'none', fontSize:'12px', fontWeight:'600', cursor:'pointer', background:filterStatus===s?'#0D1923':'transparent', color:filterStatus===s?'#fff':'#64748B', fontFamily:"'Sora',sans-serif" }}>
              {s==='en_cours'?'En cours':s==='atteint'?'Atteints':'Tous'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🎯</div>
            <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff', marginBottom:'8px' }}>Aucun objectif</h3>
            <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'20px' }}>Créez votre premier objectif financier</p>
            <button className="btn-teal" onClick={()=>setShowModal(true)}>+ Créer un objectif</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'16px' }}>
            {filtered.map(g=>{
              const pct = Math.min(100, Math.round((g.current_amount/g.target_amount)*100))
              const remaining = g.target_amount - g.current_amount
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime()-Date.now())/(1000*60*60*24)) : null
              return (
                <div key={g.id} className="goal-card" style={{ ...card, transition:'border-color .2s', cursor:'default', border:`1px solid ${g.status==='atteint'?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.07)'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(0,212,170,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{GOAL_ICONS[g.type]||'🎯'}</div>
                      <div>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{g.label}</div>
                        <div style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>{GOAL_LABELS[g.type]||g.type}</div>
                      </div>
                    </div>
                    {g.status==='atteint' && <span style={{ fontSize:'10px', background:'rgba(16,185,129,0.15)', color:'#10B981', padding:'3px 8px', borderRadius:'99px', fontWeight:'700' }}>✓ Atteint</span>}
                  </div>

                  <div style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'12px', color:'#64748B' }}>Progression</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color: pct>=100?'#10B981':'#00D4AA' }}>{pct}%</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'6px', overflow:'hidden' }}>
                      <div style={{ height:'6px', width:`${pct}%`, background: pct>=100?'#10B981':'linear-gradient(90deg,#00D4AA,#00B4D8)', borderRadius:'99px', transition:'width .5s' }} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'10px' }}>
                      <div style={{ fontSize:'10px', color:'#64748B', marginBottom:'4px' }}>Épargné</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#00D4AA' }}>{fmt(g.current_amount)}</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'10px' }}>
                      <div style={{ fontSize:'10px', color:'#64748B', marginBottom:'4px' }}>Objectif</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#fff' }}>{fmt(g.target_amount)}</div>
                    </div>
                  </div>

                  {remaining > 0 && <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'6px' }}>Reste : <span style={{ color:'#F59E0B', fontWeight:'600' }}>{fmt(remaining)} XOF</span></div>}
                  {daysLeft !== null && <div style={{ fontSize:'12px', color: daysLeft<30?'#EF4444':'#64748B', marginBottom:'12px' }}>Échéance : {daysLeft>0?`dans ${daysLeft} jours`:'Dépassée'}</div>}
                  {g.note && <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'12px', fontStyle:'italic' }}>{g.note}</div>}

                  <div style={{ display:'flex', gap:'8px' }}>
                    {g.status==='en_cours' && (
                      <button className="btn-teal" style={{ flex:1, fontSize:'12px', padding:'8px' }} onClick={()=>{setSelectedGoal(g);setShowContrib(true)}}>+ Verser</button>
                    )}
                    <button onClick={()=>deleteGoal(g.id)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'8px', padding:'8px 12px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* MODAL CRÉER */}
      {showModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Créer un objectif</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'20px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={saveGoal}>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Ex : Fonds d'urgence 6 mois" required /></div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Type d'objectif</label>
                <select className="input-field" style={inputSt} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  {GOAL_TYPES.map(t=><option key={t} value={t}>{GOAL_ICONS[t]} {GOAL_LABELS[t]}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                <div><label style={labelSt}>Montant cible (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={form.target_amount} onChange={e=>setForm({...form,target_amount:e.target.value})} placeholder="2 000 000" required /></div>
                <div><label style={labelSt}>Échéance (optionnel)</label><input className="input-field" style={inputSt} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></div>
              </div>
              <div style={{ marginBottom:'20px' }}><label style={labelSt}>Note</label><input className="input-field" style={inputSt} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Remarque..." /></div>
              <div style={{ display:'flex', gap:'10px' }}><button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button><button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':'Créer'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VERSER */}
      {showContrib && selectedGoal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowContrib(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>Verser vers l'objectif</h3>
              <button onClick={()=>setShowContrib(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'20px', cursor:'pointer' }}>×</button>
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
    </div>
  )
}