'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

interface Expense { id:string; label:string; amount:number; category:string; date:string; note:string; is_recurring:boolean }

const CATEGORIES = ['alimentation','transport','logement','sante','communication','education','investissement','loisirs','habillement','dette','autre']
const CAT_ICONS: Record<string,string> = { alimentation:'🛒', transport:'🚗', logement:'🏠', sante:'🏥', communication:'📱', education:'📚', investissement:'📊', loisirs:'🎯', habillement:'👔', dette:'🔴', autre:'💸' }
const CAT_COLORS: Record<string,string> = { alimentation:'#10B981', transport:'#F59E0B', logement:'#6366F1', sante:'#EF4444', communication:'#00B4D8', education:'#8B5CF6', investissement:'#00D4AA', loisirs:'#F97316', habillement:'#EC4899', dette:'#EF4444', autre:'#64748B' }
const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

export default function DepensesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [filterCat, setFilterCat] = useState('tous')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0,7))
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState<Expense|null>(null)
  const [form, setForm] = useState({ label:'', amount:'', category:'alimentation', date:new Date().toISOString().split('T')[0], note:'', is_recurring:false })

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const firstDay = `${filterMonth}-01`
    const lastDay = new Date(parseInt(filterMonth.split('-')[0]), parseInt(filterMonth.split('-')[1]), 0).toISOString().split('T')[0]
    const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', firstDay).lte('date', lastDay).order('date', { ascending:false })
    setExpenses(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editItem) {
      await supabase.from('expenses').update({ label:form.label, amount:parseFloat(form.amount), category:form.category, date:form.date, note:form.note, is_recurring:form.is_recurring }).eq('id', editItem.id)
    } else {
      await supabase.from('expenses').insert({ ...form, amount:parseFloat(form.amount), user_id:user!.id })
    }
    setSaving(false); setShowModal(false); setEditItem(null)
    setForm({ label:'', amount:'', category:'alimentation', date:new Date().toISOString().split('T')[0], note:'', is_recurring:false })
    loadData()
  }

  async function handleDelete(id:string) {
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setDeleting(null); loadData()
  }

  function openEdit(e:Expense) {
    setEditItem(e)
    setForm({ label:e.label, amount:String(e.amount), category:e.category, date:e.date, note:e.note||'', is_recurring:e.is_recurring })
    setShowModal(true)
  }

  const filtered = expenses.filter(e => (filterCat==='tous'||e.category===filterCat) && e.label.toLowerCase().includes(search.toLowerCase()))
  const total = filtered.reduce((s,e)=>s+e.amount,0)
  const totalAll = expenses.reduce((s,e)=>s+e.amount,0)
  const byCat: Record<string,number> = {}
  expenses.forEach(e => { byCat[e.category]=(byCat[e.category]||0)+e.amount })

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'16px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  return (
    <AppLayout title="Dépenses" subtitle="Suivi de toutes vos sorties d'argent"
      actions={<button className="btn-red" onClick={()=>{setEditItem(null);setForm({label:'',amount:'',category:'alimentation',date:new Date().toISOString().split('T')[0],note:'',is_recurring:false});setShowModal(true)}}>+ Ajouter une dépense</button>}>
      <style>{`
        .btn-red{background:linear-gradient(135deg,#EF4444,#DC2626);border:none;border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-red:hover{opacity:0.88}
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .row-item:hover{background:rgba(255,255,255,0.025)}
        .cat-chip{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;z-index:200}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
        .modal-handle{width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 20px}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(min-width:768px){.modal-bg{align-items:center}.modal{border-radius:14px;max-width:440px}}
        select option{background:#0D1923}
      `}</style>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'10px', marginBottom:'16px' }}>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Total du mois</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'20px', fontWeight:'600', color:'#EF4444' }}>{fmt(totalAll)}</div>
          <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>XOF · {expenses.length} dépense{expenses.length>1?'s':''}</div>
        </div>
        {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([cat,amt])=>(
          <div key={cat} style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>{CAT_ICONS[cat]} {cat}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:CAT_COLORS[cat]||'#fff' }}>{fmt(amt)}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{Math.round((amt/totalAll)*100)}%</div>
          </div>
        ))}
      </div>

      {/* Répartition */}
      {Object.keys(byCat).length>0 && (
        <div style={{ ...card, marginBottom:'12px' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#fff', marginBottom:'10px' }}>Répartition</div>
          <div style={{ display:'flex', height:'8px', borderRadius:'99px', overflow:'hidden', marginBottom:'10px' }}>
            {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
              <div key={cat} style={{ width:`${(amt/totalAll)*100}%`, background:CAT_COLORS[cat]||'#64748B' }} title={`${cat}: ${fmt(amt)}`} />
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>(
              <span key={cat} style={{ fontSize:'11px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'2px', background:CAT_COLORS[cat], display:'inline-block' }}/>
                {CAT_ICONS[cat]} {cat} ({Math.round((amt/totalAll)*100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ ...card, marginBottom:'12px' }}>
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="input-field" style={{ ...inputSt, width:'150px', flex:'none' }} />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} className="input-field" style={{ ...inputSt, flex:1, minWidth:'120px' }} />
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'10px' }}>
          {['tous',...CATEGORIES].map(cat=>(
            <button key={cat} className="cat-chip" onClick={()=>setFilterCat(cat)} style={{ background:filterCat===cat?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)', color:filterCat===cat?'#EF4444':'#64748B', borderColor:filterCat===cat?'rgba(239,68,68,0.3)':'transparent' }}>
              {cat==='tous'?'Tous':`${CAT_ICONS[cat]} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{filtered.length} dépense{filtered.length>1?'s':''}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#EF4444' }}>{fmt(total)} XOF</div>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px' }}><div style={{ width:'32px', height:'32px', border:'3px solid rgba(239,68,68,0.2)', borderTopColor:'#EF4444', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>💸</div>
            <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px' }}>Aucune dépense trouvée</p>
            <button className="btn-red" onClick={()=>setShowModal(true)}>+ Ajouter une dépense</button>
          </div>
        ) : filtered.map(e=>(
          <div key={e.id} className="row-item" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 6px', borderRadius:'8px', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .1s' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{CAT_ICONS[e.category]||'💸'}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.label}</span>
                {e.is_recurring && <span style={{ fontSize:'10px', background:'rgba(99,102,241,0.15)', color:'#6366F1', padding:'2px 6px', borderRadius:'99px', fontWeight:'600', flexShrink:0 }}>Récurrent</span>}
              </div>
              <div style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>{e.category} · {new Date(e.date).toLocaleDateString('fr-FR')}{e.note&&` · ${e.note}`}</div>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#EF4444', flexShrink:0 }}>-{fmt(e.amount)}</div>
            <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
              <button onClick={()=>openEdit(e)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#94A3B8', fontSize:'12px', cursor:'pointer' }}>✏️</button>
              <button onClick={()=>handleDelete(e.id)} disabled={deleting===e.id} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>{deleting===e.id?'...':'🗑️'}</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>{editItem?'Modifier':'Ajouter une dépense'}</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={form.label} onChange={e=>setForm({...form,label:e.target.value})} placeholder="Ex : Courses alimentaires" required /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                <div><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="45 000" required /></div>
                <div><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required /></div>
              </div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'14px' }}><label style={labelSt}>Note</label><input className="input-field" style={inputSt} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Remarque..." /></div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                <input type="checkbox" id="rec" checked={form.is_recurring} onChange={e=>setForm({...form,is_recurring:e.target.checked})} style={{ width:'16px', height:'16px', accentColor:'#00D4AA' }} />
                <label htmlFor="rec" style={{ fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>Dépense récurrente</label>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-red" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':editItem?'Modifier':'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}