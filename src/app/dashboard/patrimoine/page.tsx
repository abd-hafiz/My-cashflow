'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

interface Asset { id:string; label:string; value:number; type:string; date:string; note:string }
interface Liability { id:string; label:string; amount:number; type:string; date_end:string; note:string }

const ASSET_TYPES = ['epargne','immobilier','vehicule','investissement','mobile_money','autre']
const LIABILITY_TYPES = ['pret_bancaire','dette_personnelle','credit_immobilier','autre']
const ASSET_ICONS: Record<string,string> = { epargne:'💰', immobilier:'🏠', vehicule:'🚗', investissement:'📈', mobile_money:'📱', autre:'💎' }
const LIABILITY_ICONS: Record<string,string> = { pret_bancaire:'🏦', dette_personnelle:'👤', credit_immobilier:'🏠', autre:'🔴' }
const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n)

export default function PatrimoinePage() {
  const router = useRouter()
  const supabase = createClient()
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'actifs'|'passifs'>('actifs')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'actif'|'passif'>('actif')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [assetForm, setAssetForm] = useState({ label:'', value:'', type:'epargne', date:new Date().toISOString().split('T')[0], note:'' })
  const [liabForm, setLiabForm] = useState({ label:'', amount:'', type:'pret_bancaire', date_end:'', note:'' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [a,l] = await Promise.all([
      supabase.from('assets').select('*').eq('user_id',user.id).order('value',{ascending:false}),
      supabase.from('liabilities').select('*').eq('user_id',user.id).order('amount',{ascending:false}),
    ])
    setAssets(a.data||[]); setLiabilities(l.data||[])
    setLoading(false)
  }

  async function saveAsset(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('assets').insert({ ...assetForm, value:parseFloat(assetForm.value), user_id:user!.id })
    setSaving(false); setShowModal(false)
    setAssetForm({ label:'', value:'', type:'epargne', date:new Date().toISOString().split('T')[0], note:'' })
    loadData()
  }

  async function saveLiab(e:React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('liabilities').insert({ ...liabForm, amount:parseFloat(liabForm.amount), user_id:user!.id })
    setSaving(false); setShowModal(false)
    setLiabForm({ label:'', amount:'', type:'pret_bancaire', date_end:'', note:'' })
    loadData()
  }

  const totalAssets = assets.reduce((s,a)=>s+a.value,0)
  const totalLiab = liabilities.reduce((s,l)=>s+l.amount,0)
  const netWorth = totalAssets - totalLiab

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'16px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }
  const labelSt: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:'600', color:'#94A3B8', marginBottom:'6px' }

  return (
    <AppLayout title="Patrimoine" subtitle="Actifs − Passifs = Valeur nette"
      actions={
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn-ghost" onClick={()=>{setModalType('passif');setShowModal(true)}}>+ Passif</button>
          <button className="btn-teal" onClick={()=>{setModalType('actif');setShowModal(true)}}>+ Actif</button>
        </div>
      }>
      <style>{`
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-ghost{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 16px;color:#fff;font-size:13px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .row-item:hover{background:rgba(255,255,255,0.025)}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center;z-index:200}
        .modal{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
        .modal-handle{width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 20px}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(min-width:768px){.modal-bg{align-items:center}.modal{border-radius:14px;max-width:440px}}
        select option{background:#0D1923}
      `}</style>

      {/* Bilan */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Actifs</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:'#10B981' }}>{fmt(totalAssets)}</div>
          <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>XOF</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Passifs</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', color:'#EF4444' }}>{fmt(totalLiab)}</div>
          <div style={{ fontSize:'11px', color:'#64748B', marginTop:'3px' }}>XOF</div>
        </div>
        <div style={{ ...card, border:`1px solid ${netWorth>=0?'rgba(0,212,170,0.2)':'rgba(239,68,68,0.2)'}` }}>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>Valeur nette</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'18px', fontWeight:'600', background:'linear-gradient(135deg,#00D4AA,#00B4D8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{fmt(netWorth)}</div>
          <div style={{ fontSize:'11px', color:netWorth>=0?'#10B981':'#EF4444', marginTop:'3px' }}>{netWorth>=0?'✓ Positif':'⚠ Négatif'}</div>
        </div>
      </div>

      {/* Barre */}
      {(totalAssets+totalLiab)>0 && (
        <div style={{ ...card, marginBottom:'16px' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#fff', marginBottom:'10px' }}>Actifs vs Passifs</div>
          <div style={{ display:'flex', height:'8px', borderRadius:'99px', overflow:'hidden', background:'rgba(239,68,68,0.2)' }}>
            <div style={{ width:`${(totalAssets/(totalAssets+totalLiab))*100}%`, background:'linear-gradient(90deg,#00D4AA,#10B981)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
            <span style={{ fontSize:'12px', color:'#10B981' }}>Actifs {Math.round((totalAssets/(totalAssets+totalLiab||1))*100)}%</span>
            <span style={{ fontSize:'12px', color:'#EF4444' }}>Passifs {Math.round((totalLiab/(totalAssets+totalLiab||1))*100)}%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'4px', marginBottom:'14px', width:'fit-content' }}>
        {(['actifs','passifs'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 20px', borderRadius:'7px', border:'none', fontSize:'13px', fontWeight:'600', cursor:'pointer', background:tab===t?'#0D1923':'transparent', color:tab===t?'#fff':'#64748B', fontFamily:"'Sora',sans-serif" }}>
            {t==='actifs'?`Actifs (${assets.length})`:`Passifs (${liabilities.length})`}
          </button>
        ))}
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px' }}><div style={{ width:'32px', height:'32px', border:'3px solid rgba(0,212,170,0.2)', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}/></div>
        ) : tab==='actifs' ? (
          assets.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>💎</div>
              <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px' }}>Aucun actif enregistré</p>
              <button className="btn-teal" onClick={()=>{setModalType('actif');setShowModal(true)}}>+ Ajouter un actif</button>
            </div>
          ) : assets.map(a=>(
            <div key={a.id} className="row-item" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 6px', borderRadius:'8px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{ASSET_ICONS[a.type]||'💎'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.label}</div>
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>{a.type} · {new Date(a.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#10B981', flexShrink:0 }}>{fmt(a.value)} XOF</div>
              <button onClick={async()=>{setDeleting(a.id);await supabase.from('assets').delete().eq('id',a.id);setDeleting(null);loadData()}} disabled={deleting===a.id} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>{deleting===a.id?'...':'🗑️'}</button>
            </div>
          ))
        ) : (
          liabilities.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎉</div>
              <p style={{ fontSize:'13px', color:'#10B981' }}>Aucune dette — bilan parfait !</p>
            </div>
          ) : liabilities.map(l=>(
            <div key={l.id} className="row-item" style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 6px', borderRadius:'8px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>{LIABILITY_ICONS[l.type]||'🔴'}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.label}</div>
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>{l.type}{l.date_end&&` · échéance ${new Date(l.date_end).toLocaleDateString('fr-FR')}`}</div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'13px', fontWeight:'600', color:'#EF4444', flexShrink:0 }}>{fmt(l.amount)} XOF</div>
              <button onClick={async()=>{setDeleting(l.id);await supabase.from('liabilities').delete().eq('id',l.id);setDeleting(null);loadData()}} disabled={deleting===l.id} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'6px', padding:'5px 8px', color:'#EF4444', fontSize:'12px', cursor:'pointer' }}>{deleting===l.id?'...':'🗑️'}</button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-handle"/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#fff' }}>{modalType==='actif'?'Ajouter un actif':'Ajouter un passif'}</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', color:'#64748B', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            {modalType==='actif' ? (
              <form onSubmit={saveAsset}>
                <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={assetForm.label} onChange={e=>setAssetForm({...assetForm,label:e.target.value})} placeholder="Ex : Terrain Niamey" required /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                  <div><label style={labelSt}>Valeur (XOF)</label><input className="input-field" style={inputSt} type="number" min="0" value={assetForm.value} onChange={e=>setAssetForm({...assetForm,value:e.target.value})} placeholder="5 000 000" required /></div>
                  <div><label style={labelSt}>Date</label><input className="input-field" style={inputSt} type="date" value={assetForm.date} onChange={e=>setAssetForm({...assetForm,date:e.target.value})} /></div>
                </div>
                <div style={{ marginBottom:'14px' }}><label style={labelSt}>Type</label><select className="input-field" style={inputSt} value={assetForm.type} onChange={e=>setAssetForm({...assetForm,type:e.target.value})}>{ASSET_TYPES.map(t=><option key={t} value={t}>{ASSET_ICONS[t]} {t}</option>)}</select></div>
                <div style={{ marginBottom:'20px' }}><label style={labelSt}>Note</label><input className="input-field" style={inputSt} value={assetForm.note} onChange={e=>setAssetForm({...assetForm,note:e.target.value})} placeholder="Remarque..." /></div>
                <div style={{ display:'flex', gap:'10px' }}><button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button><button type="submit" className="btn-teal" style={{ flex:1 }} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button></div>
              </form>
            ) : (
              <form onSubmit={saveLiab}>
                <div style={{ marginBottom:'14px' }}><label style={labelSt}>Libellé</label><input className="input-field" style={inputSt} value={liabForm.label} onChange={e=>setLiabForm({...liabForm,label:e.target.value})} placeholder="Ex : Prêt BIA Niger" required /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                  <div><label style={labelSt}>Montant (XOF)</label><input className="input-field" style={inputSt} type="number" min="0" value={liabForm.amount} onChange={e=>setLiabForm({...liabForm,amount:e.target.value})} placeholder="1 000 000" required /></div>
                  <div><label style={labelSt}>Échéance</label><input className="input-field" style={inputSt} type="date" value={liabForm.date_end} onChange={e=>setLiabForm({...liabForm,date_end:e.target.value})} /></div>
                </div>
                <div style={{ marginBottom:'14px' }}><label style={labelSt}>Type</label><select className="input-field" style={inputSt} value={liabForm.type} onChange={e=>setLiabForm({...liabForm,type:e.target.value})}>{LIABILITY_TYPES.map(t=><option key={t} value={t}>{LIABILITY_ICONS[t]} {t}</option>)}</select></div>
                <div style={{ marginBottom:'20px' }}><label style={labelSt}>Note</label><input className="input-field" style={inputSt} value={liabForm.note} onChange={e=>setLiabForm({...liabForm,note:e.target.value})} placeholder="Remarque..." /></div>
                <div style={{ display:'flex', gap:'10px' }}><button type="button" className="btn-ghost" style={{ flex:1 }} onClick={()=>setShowModal(false)}>Annuler</button><button type="submit" style={{ flex:1, background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none', borderRadius:'8px', padding:'9px 16px', color:'#fff', fontSize:'13px', fontWeight:'700', fontFamily:"'Sora',sans-serif", cursor:'pointer' }} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}