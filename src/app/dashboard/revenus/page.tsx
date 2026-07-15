'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Revenue {
  id: string
  label: string
  amount: number
  category: string
  date: string
  note: string
  is_recurring: boolean
}

const CATEGORIES = ['salaire','commerce','freelance','trading','location','transfert','autre']

const CAT_ICONS: Record<string, string> = {
  salaire:'💼', commerce:'🏪', freelance:'💻', trading:'📈',
  location:'🏠', transfert:'💸', autre:'💰',
}

const CAT_COLORS: Record<string, string> = {
  salaire:'#00D4AA', commerce:'#6366F1', freelance:'#00B4D8',
  trading:'#10B981', location:'#F59E0B', transfert:'#8B5CF6', autre:'#64748B',
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export default function RevenuesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [filterCat, setFilterCat] = useState('tous')
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0,7))
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState<Revenue|null>(null)

  const [form, setForm] = useState({
    label:'', amount:'', category:'salaire',
    date: new Date().toISOString().split('T')[0],
    note:'', is_recurring: false,
  })

  useEffect(() => { loadData() }, [filterMonth])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const firstDay = `${filterMonth}-01`
    const lastDay = new Date(parseInt(filterMonth.split('-')[0]), parseInt(filterMonth.split('-')[1]), 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false })

    setRevenues(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (editItem) {
      await supabase.from('revenues').update({
        label: form.label, amount: parseFloat(form.amount),
        category: form.category, date: form.date,
        note: form.note, is_recurring: form.is_recurring,
      }).eq('id', editItem.id)
    } else {
      await supabase.from('revenues').insert({
        label: form.label, amount: parseFloat(form.amount),
        category: form.category, date: form.date,
        note: form.note, is_recurring: form.is_recurring,
        user_id: user!.id,
      })
    }

    setSaving(false)
    setShowModal(false)
    setEditItem(null)
    resetForm()
    loadData()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('revenues').delete().eq('id', id)
    setDeleting(null)
    loadData()
  }

  function openEdit(r: Revenue) {
    setEditItem(r)
    setForm({ label: r.label, amount: String(r.amount), category: r.category, date: r.date, note: r.note || '', is_recurring: r.is_recurring })
    setShowModal(true)
  }

  function resetForm() {
    setForm({ label:'', amount:'', category:'salaire', date: new Date().toISOString().split('T')[0], note:'', is_recurring: false })
  }

  const filtered = revenues.filter(r => {
    const matchCat = filterCat === 'tous' || r.category === filterCat
    const matchSearch = r.label.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const total = filtered.reduce((s, r) => s + r.amount, 0)

  // Répartition par catégorie
  const byCat: Record<string, number> = {}
  revenues.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.amount })
  const totalAll = revenues.reduce((s, r) => s + r.amount, 0)

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
        .btn-ghost:hover{background:rgba(255,255,255,0.1)}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .row-item:hover{background:rgba(255,255,255,0.025)}
        .cat-chip{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:24px}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;width:100%;max-width:440px;animation:fadeIn .2s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        select option{background:#0D1923}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:'220px', flexShrink:0, background:'#0D1923', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 4px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'12px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#000' }}>M</div>
          <span style={{ fontSize:'14px', fontWeight:'700', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>MyCashflow</span>
        </div>
        {[
          {icon:'▦', label:'Tableau de bord', path:'/dashboard'},
          {icon:'↑', label:'Revenus', path:'/dashboard/revenus', active:true},
          {icon:'↓', label:'Dépenses', path:'/dashboard/depenses'},
          {icon:'◈', label:'Patrimoine', path:'/dashboard/patrimoine'},
          {icon:'◎', label:'Objectifs', path:'/dashboard/objectifs'},
          {icon:'⊞', label:'Budget', path:'/dashboard/budget'},
          {icon:'📖', label:'Éducation', path:'/dashboard/education'},
        ].map(item => (
          <a key={item.label} href={item.path} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', fontSize:'13px', color: item.active ? '#00D4AA' : '#64748B', background: item.active ? 'rgba(0,212,170,0.1)' : 'transparent', fontWeight: item.active ? '600' : '400', textDecoration:'none', marginBottom:'2px' }}>
            <span style={{ fontSize:'16px' }}>{item.icon}</span>{item.label}
          </a>
        ))}
        <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <a href="/login" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', fontSize:'13px', color:'#EF4444', textDecoration:'none' }}>
            <span>⏻</span>Déconnexion
          </a>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, padding:'28px', overflow:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Revenus</h1>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>Suivi de toutes vos entrées d'argent</p>
          </div>
          <button className="btn-teal" onClick={() => { resetForm(); setEditItem(null); setShowModal(true) }}>+ Ajouter un revenu</button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'14px', marginBottom:'20px' }}>
          <div style={card}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>Total du mois</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'22px', fontWeight:'600', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{fmt(totalAll)}</div>
            <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>XOF · {revenues.length} transaction{revenues.length > 1 ? 's' : ''}</div>
          </div>
          {Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,3).map(([cat, amt]) => (
            <div key={cat} style={card}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                {CAT_ICONS[cat]} {cat}
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'20px', fontWeight:'600', color: CAT_COLORS[cat] || '#fff' }}>{fmt(amt)}</div>
              <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{Math.round((amt/totalAll)*100)}% du total</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ ...card, marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              className="input-field" style={{ ...inputSt, width:'160px' }} />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="input-field" style={{ ...inputSt, flex:1, minWidth:'160px' }} />
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {['tous', ...CATEGORIES].map(cat => (
                <button key={cat} className="cat-chip" onClick={() => setFilterCat(cat)}
                  style={{ background: filterCat === cat ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)', color: filterCat === cat ? '#00D4AA' : '#64748B', borderColor: filterCat === cat ? 'rgba(0,212,170,0.3)' : 'transparent' }}>
                  {cat === 'tous' ? 'Tous' : `${CAT_ICONS[cat]} ${cat}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste */}
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'14px', fontWeight:'600', color:'#10B981' }}>Total : {fmt(total)} XOF</div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:'32px', height:'32px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>💰</div>
              <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px' }}>Aucun revenu trouvé</p>
              <button className="btn-teal" onClick={() => { resetForm(); setEditItem(null); setShowModal(true) }}>+ Ajouter un revenu</button>
            </div>
          ) : filtered.map(r => (
            <div key={r.id} className="row-item" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 8px', borderRadius:'8px', transition:'background .1s', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(0,212,170,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                {CAT_ICONS[r.category] || '💰'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.label}</span>
                  {r.is_recurring && <span style={{ fontSize:'10px', background:'rgba(99,102,241,0.15)', color:'#6366F1', padding:'2px 7px', borderRadius:'99px', fontWeight:'600', flexShrink:0 }}>Récurrent</span>}
                </div>
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>
                  {r.category} · {new Date(r.date).toLocaleDateString('fr-FR')}
                  {r.note && ` · ${r.note}`}
                </div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'14px', fontWeight:'600', color:'#10B981', flexShrink:0 }}>+{fmt(r.amount)}</div>
              <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                <button onClick={() => openEdit(r)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'6px', padding:'5px 10px', color:'#94A3B8', fontSize:'12px', cursor:'pointer' }}>✏️</button>
                <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'6px', padding:'5px 10px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>
                  {deleting === r.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>{editItem ? 'Modifier le revenu' : 'Ajouter un revenu'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'20px', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom:'14px' }}>
                <label style={labelSt}>Libellé</label>
                <input className="input-field" style={inputSt} value={form.label} onChange={e => setForm({...form, label:e.target.value})} placeholder="Ex : Salaire juillet" required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                <div>
                  <label style={labelSt}>Montant (XOF)</label>
                  <input className="input-field" style={inputSt} type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} placeholder="500 000" required />
                </div>
                <div>
                  <label style={labelSt}>Date</label>
                  <input className="input-field" style={inputSt} type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} required />
                </div>
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label style={labelSt}>Catégorie</label>
                <select className="input-field" style={inputSt} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label style={labelSt}>Note (optionnel)</label>
                <input className="input-field" style={inputSt} value={form.note} onChange={e => setForm({...form, note:e.target.value})} placeholder="Remarque..." />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                <input type="checkbox" id="recurring" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring:e.target.checked})} style={{ width:'16px', height:'16px', accentColor:'#00D4AA' }} />
                <label htmlFor="recurring" style={{ fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>Revenu récurrent (mensuel)</label>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" style={{ flex:1 }} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving ? 'Enregistrement...' : editItem ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}