'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

interface Article { id:string; title:string; slug:string; category:string; level:string; summary:string; read_time:number }

const CAT_ICONS: Record<string,string> = { budget:'📊', epargne:'💰', dettes:'🔴', investissement:'📈', entrepreneuriat:'🚀', patrimoine:'🏛️' }
const CAT_LABELS: Record<string,string> = { budget:'Budget', epargne:'Épargne', dettes:'Dettes', investissement:'Investissement', entrepreneuriat:'Entrepreneuriat', patrimoine:'Patrimoine' }
const LEVEL_COLORS: Record<string,string> = { debutant:'#10B981', intermediaire:'#F59E0B', avance:'#6366F1' }
const LEVEL_LABELS: Record<string,string> = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé' }

const DEFAULT_ARTICLES = [
  { id:'1', title:'La règle des 50/30/20', category:'budget', level:'debutant', summary:'50% besoins, 30% envies, 20% épargne — la méthode la plus simple pour gérer son budget.', read_time:5, slug:'regle-50-30-20' },
  { id:'2', title:'Construire un fonds d\'urgence', category:'epargne', level:'debutant', summary:'Comment constituer une réserve de 3 à 6 mois de dépenses adaptée au contexte nigérien.', read_time:7, slug:'fonds-urgence' },
  { id:'3', title:'Comprendre la BRVM', category:'investissement', level:'intermediaire', summary:'Introduction à la Bourse Régionale des Valeurs Mobilières et comment y investir depuis le Niger.', read_time:10, slug:'comprendre-brvm' },
  { id:'4', title:'Sortir du cycle des dettes', category:'dettes', level:'debutant', summary:'Stratégies pratiques pour rembourser ses dettes et éviter d\'y retomber.', read_time:8, slug:'sortir-dettes' },
  { id:'5', title:'Séparer finances perso et pro', category:'entrepreneuriat', level:'intermediaire', summary:'L\'erreur fatale de la plupart des entrepreneurs africains — et comment l\'éviter.', read_time:6, slug:'separer-finances' },
  { id:'6', title:'Investir dans l\'immobilier au Niger', category:'patrimoine', level:'debutant', summary:'Comment commencer à investir dans l\'immobilier avec un petit budget à Niamey.', read_time:12, slug:'immobilier-niger' },
  { id:'7', title:'Mobile Money comme outil d\'épargne', category:'epargne', level:'debutant', summary:'Utiliser Airtel Money et Moov Money pour épargner automatiquement.', read_time:5, slug:'mobile-money' },
  { id:'8', title:'Comprendre l\'inflation', category:'investissement', level:'intermediaire', summary:'Avec 8% d\'inflation en zone CEDEAO, comment protéger son pouvoir d\'achat.', read_time:9, slug:'inflation' },
  { id:'9', title:'La tontine digitale', category:'epargne', level:'debutant', summary:'Transformer la tontine traditionnelle en outil financier moderne et sécurisé.', read_time:6, slug:'tontine-digitale' },
]

export default function EducationPage() {
  const supabase = createClient()
  const [articles, setArticles] = useState(DEFAULT_ARTICLES)
  const [readIds, setReadIds] = useState<string[]>([])
  const [filterCat, setFilterCat] = useState('tous')
  const [filterLevel, setFilterLevel] = useState('tous')
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<typeof DEFAULT_ARTICLES[0]|null>(null)

  useEffect(() => {
    loadReads()
    async function loadArticles() {
      const { data } = await supabase.from('articles').select('*').eq('is_published',true)
      if (data&&data.length>0) setArticles(data as any)
    }
    loadArticles()
  }, [])

  async function loadReads() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('article_reads').select('article_id').eq('user_id',user.id)
    setReadIds((data||[]).map((r:any)=>r.article_id))
  }

  async function markRead(articleId:string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user||readIds.includes(articleId)) return
    await supabase.from('article_reads').upsert({ user_id:user.id, article_id:articleId })
    setReadIds(prev=>[...prev,articleId])
  }

  const filtered = articles.filter(a => {
    const matchCat = filterCat==='tous'||a.category===filterCat
    const matchLevel = filterLevel==='tous'||a.level===filterLevel
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())||a.summary.toLowerCase().includes(search.toLowerCase())
    return matchCat&&matchLevel&&matchSearch
  })

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'16px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'14px', fontFamily:"'Sora',sans-serif" }

  return (
    <AppLayout title="Éducation financière" subtitle={`${readIds.length}/${articles.length} articles lus`}>
      <style>{`
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .article-card{cursor:pointer;transition:all .2s}
        .article-card:hover{border-color:rgba(0,212,170,0.25)!important;transform:translateY(-2px)}
        .cat-chip{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:flex-end;justify-content:center;z-index:200;padding:0}
        .modal-article{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:20px 20px 0 0;padding:24px 20px calc(32px + env(safe-area-inset-bottom,0px));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
        .modal-handle{width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:0 auto 20px}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @media(min-width:768px){.modal-bg{align-items:center;padding:24px}.modal-article{border-radius:16px;max-width:640px;margin:auto}}
      `}</style>

      {/* Barre de progression globale */}
      <div style={{ ...card, marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'#fff' }}>Progression globale</span>
          <span style={{ fontSize:'13px', fontWeight:'700', color:'#00D4AA' }}>{articles.length>0?Math.round((readIds.length/articles.length)*100):0}%</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'6px', overflow:'hidden' }}>
          <div style={{ height:'6px', width:`${articles.length>0?(readIds.length/articles.length)*100:0}%`, background:'linear-gradient(90deg,#00D4AA,#00B4D8)', transition:'width .5s' }} />
        </div>
      </div>

      {/* Catégories */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
        {Object.entries(CAT_ICONS).map(([cat,icon])=>{
          const count = articles.filter(a=>a.category===cat).length
          const readCount = articles.filter(a=>a.category===cat&&readIds.includes(a.id)).length
          return (
            <div key={cat} onClick={()=>setFilterCat(cat===filterCat?'tous':cat)}
              style={{ ...card, padding:'12px', cursor:'pointer', border:`1px solid ${filterCat===cat?'rgba(0,212,170,0.3)':'rgba(255,255,255,0.07)'}`, background:filterCat===cat?'rgba(0,212,170,0.05)':'#0D1923', textAlign:'center' }}>
              <div style={{ fontSize:'22px', marginBottom:'4px' }}>{icon}</div>
              <div style={{ fontSize:'11px', fontWeight:'600', color:filterCat===cat?'#00D4AA':'#94A3B8' }}>{CAT_LABELS[cat]}</div>
              <div style={{ fontSize:'10px', color:'#64748B', marginTop:'2px' }}>{readCount}/{count}</div>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div style={{ ...card, marginBottom:'14px' }}>
        <input type="text" placeholder="Rechercher un article..." value={search} onChange={e=>setSearch(e.target.value)} className="input-field" style={{ ...inputSt, marginBottom:'10px' }} />
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {['tous','debutant','intermediaire','avance'].map(l=>(
            <button key={l} className="cat-chip" onClick={()=>setFilterLevel(l)}
              style={{ background:filterLevel===l?`${LEVEL_COLORS[l]||'rgba(0,212,170,0.15)'}22`:'rgba(255,255,255,0.04)', color:filterLevel===l?LEVEL_COLORS[l]||'#00D4AA':'#64748B', borderColor:filterLevel===l?`${LEVEL_COLORS[l]||'#00D4AA'}44`:'transparent' }}>
              {l==='tous'?'Tous niveaux':LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'12px' }}>
        {filtered.map(a=>{
          const isRead = readIds.includes(a.id)
          return (
            <div key={a.id} className="article-card"
              style={{ ...card, border:`1px solid ${isRead?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.07)'}`, position:'relative' }}
              onClick={()=>{ setSelectedArticle(a); markRead(a.id) }}>
              {isRead&&<div style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(16,185,129,0.15)', color:'#10B981', fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'99px' }}>✓ Lu</div>}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(0,212,170,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>{CAT_ICONS[a.category]||'📖'}</div>
                <div>
                  <div style={{ fontSize:'10px', fontWeight:'600', color:LEVEL_COLORS[a.level]||'#64748B', textTransform:'uppercase' }}>{LEVEL_LABELS[a.level]}</div>
                  <div style={{ fontSize:'11px', color:'#64748B' }}>{CAT_LABELS[a.category]}</div>
                </div>
              </div>
              <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'6px', lineHeight:'1.4' }}>{a.title}</h3>
              <p style={{ fontSize:'12px', color:'#64748B', lineHeight:'1.6', marginBottom:'12px' }}>{a.summary}</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', color:'#64748B' }}>⏱ {a.read_time} min</span>
                <span style={{ fontSize:'12px', color:'#00D4AA', fontWeight:'600' }}>Lire →</span>
              </div>
            </div>
          )
        })}
        {filtered.length===0&&(
          <div style={{ ...card, textAlign:'center', padding:'40px', gridColumn:'1/-1' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📚</div>
            <p style={{ fontSize:'13px', color:'#64748B' }}>Aucun article trouvé</p>
          </div>
        )}
      </div>

      {/* MODAL ARTICLE */}
      {selectedArticle&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setSelectedArticle(null)}>
          <div className="modal-article">
            <div className="modal-handle"/>
            <button onClick={()=>setSelectedArticle(null)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'8px', padding:'6px 14px', color:'#94A3B8', fontSize:'13px', cursor:'pointer', marginBottom:'16px' }}>← Retour</button>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:LEVEL_COLORS[selectedArticle.level], background:`${LEVEL_COLORS[selectedArticle.level]}22`, padding:'3px 10px', borderRadius:'99px' }}>{LEVEL_LABELS[selectedArticle.level]}</span>
              <span style={{ fontSize:'11px', color:'#64748B', background:'rgba(255,255,255,0.06)', padding:'3px 10px', borderRadius:'99px' }}>{CAT_ICONS[selectedArticle.category]} {CAT_LABELS[selectedArticle.category]}</span>
              <span style={{ fontSize:'11px', color:'#64748B', background:'rgba(255,255,255,0.06)', padding:'3px 10px', borderRadius:'99px' }}>⏱ {selectedArticle.read_time} min</span>
            </div>
            <h2 style={{ fontSize:'18px', fontWeight:'800', color:'#fff', lineHeight:'1.4', marginBottom:'14px' }}>{selectedArticle.title}</h2>
            <p style={{ fontSize:'14px', color:'#94A3B8', lineHeight:'1.8', marginBottom:'20px' }}>{selectedArticle.summary}</p>
            <div style={{ background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:'12px', padding:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#00D4AA', marginBottom:'8px' }}>📝 Contenu</div>
              <p style={{ fontSize:'13px', color:'#64748B', lineHeight:'1.8' }}>Le contenu complet est disponible dans la table <code style={{ background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:'4px', fontSize:'12px' }}>articles</code> de Supabase.</p>
            </div>
            {readIds.includes(selectedArticle.id)&&<div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'16px', color:'#10B981', fontSize:'13px' }}>✓ Article marqué comme lu</div>}
          </div>
        </div>
      )}
    </AppLayout>
  )
}