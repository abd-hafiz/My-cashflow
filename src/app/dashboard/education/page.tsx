'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Article { id:string; title:string; slug:string; category:string; level:string; summary:string; read_time:number; cover_url:string }

const CATEGORIES = ['tous','budget','epargne','dettes','investissement','entrepreneuriat','patrimoine']
const CAT_ICONS: Record<string,string> = { budget:'📊', epargne:'💰', dettes:'🔴', investissement:'📈', entrepreneuriat:'🚀', patrimoine:'🏛️' }
const CAT_LABELS: Record<string,string> = { budget:'Gestion du budget', epargne:'Techniques d\'épargne', dettes:'Gestion des dettes', investissement:'Introduction à l\'investissement', entrepreneuriat:'Entrepreneuriat financier', patrimoine:'Patrimoine & richesse' }
const LEVEL_COLORS: Record<string,string> = { debutant:'#10B981', intermediaire:'#F59E0B', avance:'#6366F1' }
const LEVEL_LABELS: Record<string,string> = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé' }

// Articles par défaut si la base est vide
const DEFAULT_ARTICLES = [
  { id:'1', title:'La règle des 50/30/20 : gérer son budget simplement', category:'budget', level:'debutant', summary:'Découvrez la méthode la plus simple pour équilibrer vos finances : 50% besoins, 30% envies, 20% épargne.', read_time:5, slug:'regle-50-30-20', cover_url:'' },
  { id:'2', title:'Construire un fonds d\'urgence en Afrique de l\'Ouest', category:'epargne', level:'debutant', summary:'Pourquoi et comment constituer une réserve de 3 à 6 mois de dépenses, adapté au contexte nigérien.', read_time:7, slug:'fonds-urgence-afrique', cover_url:'' },
  { id:'3', title:'Comprendre la BRVM : la bourse régionale d\'Afrique de l\'Ouest', category:'investissement', level:'intermediaire', summary:'Introduction à la Bourse Régionale des Valeurs Mobilières (BRVM) et comment y investir depuis le Niger.', read_time:10, slug:'comprendre-brvm', cover_url:'' },
  { id:'4', title:'Comment sortir du cycle des dettes', category:'dettes', level:'debutant', summary:'Stratégies pratiques pour rembourser ses dettes et éviter d\'y retomber, adaptées au contexte africain.', read_time:8, slug:'sortir-cycle-dettes', cover_url:'' },
  { id:'5', title:'Séparer finances personnelles et professionnelles', category:'entrepreneuriat', level:'intermediaire', summary:'L\'erreur fatale de la plupart des entrepreneurs africains — et comment l\'éviter pour protéger votre patrimoine.', read_time:6, slug:'separer-finances', cover_url:'' },
  { id:'6', title:'Investir dans l\'immobilier au Niger : guide débutant', category:'patrimoine', level:'debutant', summary:'Terrain, maison ou appartement : comment commencer à investir dans l\'immobilier avec un petit budget à Niamey.', read_time:12, slug:'immobilier-niger', cover_url:'' },
  { id:'7', title:'Le Mobile Money comme outil d\'épargne', category:'epargne', level:'debutant', summary:'Comment utiliser Airtel Money et Moov Money pour épargner automatiquement et atteindre vos objectifs.', read_time:5, slug:'mobile-money-epargne', cover_url:'' },
  { id:'8', title:'Comprendre l\'inflation et protéger son pouvoir d\'achat', category:'investissement', level:'intermediaire', summary:'Avec 8% d\'inflation en zone CEDEAO, comment faire fructifier son argent pour ne pas perdre de valeur.', read_time:9, slug:'inflation-pouvoir-achat', cover_url:'' },
  { id:'9', title:'La tontine digitale : moderniser l\'épargne collective', category:'epargne', level:'debutant', summary:'Comment transformer la tontine traditionnelle en outil financier moderne et sécurisé pour votre groupe.', read_time:6, slug:'tontine-digitale', cover_url:'' },
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
    loadArticles()
  }, [])

  async function loadArticles() {
    const { data } = await supabase.from('articles').select('*').eq('is_published', true)
    if (data && data.length > 0) setArticles(data)
  }

  async function loadReads() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('article_reads').select('article_id').eq('user_id', user.id)
    setReadIds((data||[]).map((r:any) => r.article_id))
  }

  async function markRead(articleId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || readIds.includes(articleId)) return
    await supabase.from('article_reads').upsert({ user_id:user.id, article_id:articleId })
    setReadIds(prev => [...prev, articleId])
  }

  const filtered = articles.filter(a => {
    const matchCat = filterCat === 'tous' || a.category === filterCat
    const matchLevel = filterLevel === 'tous' || a.level === filterLevel
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchLevel && matchSearch
  })

  const card: React.CSSProperties = { background:'#0D1923', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'20px' }
  const inputSt: React.CSSProperties = { width:'100%', background:'#080C10', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', color:'#fff', fontSize:'13px', fontFamily:"'Sora',sans-serif" }

  return (
    <div style={{ minHeight:'100vh', background:'#080C10', fontFamily:"'Sora',sans-serif", display:'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .btn-teal{background:linear-gradient(135deg,#00D4AA,#00B4D8);border:none;border-radius:8px;padding:9px 16px;color:#000;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;cursor:pointer}
        .btn-teal:hover{opacity:0.88}
        .input-field:focus{outline:none;border-color:#00D4AA!important;box-shadow:0 0 0 3px rgba(0,212,170,0.12)}
        .article-card{cursor:pointer;transition:all .2s}
        .article-card:hover{border-color:rgba(0,212,170,0.25)!important;transform:translateY(-2px)}
        .cat-chip{padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:100;padding:24px;overflow-y:auto}
        .modal-article{background:#0D1923;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;width:100%;max-width:640px;margin:auto;animation:fadeIn .2s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
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
          {icon:'⊞',label:'Budget',path:'/dashboard/budget'},
          {icon:'📖',label:'Éducation',path:'/dashboard/education',active:true},
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
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:'700', color:'#fff' }}>Éducation financière</h1>
          <p style={{ fontSize:'13px', color:'#64748B', marginTop:'3px' }}>Montez en compétences — {readIds.length}/{articles.length} articles lus</p>
          <div style={{ marginTop:'10px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', height:'4px', overflow:'hidden' }}>
            <div style={{ height:'4px', width:`${articles.length>0?(readIds.length/articles.length)*100:0}%`, background:'linear-gradient(90deg,#00D4AA,#00B4D8)', transition:'width .5s' }} />
          </div>
        </div>

        {/* Stats catégories */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'10px', marginBottom:'20px' }}>
          {Object.entries(CAT_ICONS).map(([cat, icon]) => {
            const count = articles.filter(a=>a.category===cat).length
            const readCount = articles.filter(a=>a.category===cat&&readIds.includes(a.id)).length
            return (
              <div key={cat} onClick={()=>setFilterCat(cat===filterCat?'tous':cat)} style={{ ...card, padding:'14px', cursor:'pointer', border:`1px solid ${filterCat===cat?'rgba(0,212,170,0.3)':'rgba(255,255,255,0.07)'}`, background:filterCat===cat?'rgba(0,212,170,0.05)':'#0D1923' }}>
                <div style={{ fontSize:'20px', marginBottom:'6px' }}>{icon}</div>
                <div style={{ fontSize:'11px', fontWeight:'600', color:filterCat===cat?'#00D4AA':'#94A3B8' }}>{CAT_LABELS[cat]}</div>
                <div style={{ fontSize:'11px', color:'#64748B', marginTop:'4px' }}>{readCount}/{count} lus</div>
              </div>
            )
          })}
        </div>

        {/* Filtres */}
        <div style={{ ...card, marginBottom:'16px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <input type="text" placeholder="Rechercher un article..." value={search} onChange={e=>setSearch(e.target.value)} className="input-field" style={{ ...inputSt, flex:1, minWidth:'200px' }} />
            <div style={{ display:'flex', gap:'6px' }}>
              {['tous','debutant','intermediaire','avance'].map(l=>(
                <button key={l} className="cat-chip" onClick={()=>setFilterLevel(l)} style={{ background:filterLevel===l?`${LEVEL_COLORS[l]||'rgba(0,212,170,0.15)'}22`:' rgba(255,255,255,0.04)', color:filterLevel===l?LEVEL_COLORS[l]||'#00D4AA':'#64748B', borderColor:filterLevel===l?`${LEVEL_COLORS[l]||'#00D4AA'}44`:'transparent' }}>
                  {l==='tous'?'Tous niveaux':LEVEL_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
          {filtered.map(a => {
            const isRead = readIds.includes(a.id)
            return (
              <div key={a.id} className="article-card" style={{ ...card, border:`1px solid ${isRead?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.07)'}`, position:'relative' }}
                onClick={()=>{ setSelectedArticle(a); markRead(a.id) }}>
                {isRead && <div style={{ position:'absolute', top:'14px', right:'14px', background:'rgba(16,185,129,0.15)', color:'#10B981', fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'99px' }}>✓ Lu</div>}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(0,212,170,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>{CAT_ICONS[a.category]||'📖'}</div>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:'600', color:LEVEL_COLORS[a.level]||'#64748B', textTransform:'uppercase', letterSpacing:'.06em' }}>{LEVEL_LABELS[a.level]||a.level}</div>
                    <div style={{ fontSize:'11px', color:'#64748B' }}>{CAT_LABELS[a.category]||a.category}</div>
                  </div>
                </div>
                <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#fff', marginBottom:'8px', lineHeight:'1.4' }}>{a.title}</h3>
                <p style={{ fontSize:'12px', color:'#64748B', lineHeight:'1.6', marginBottom:'14px' }}>{a.summary}</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'11px', color:'#64748B' }}>⏱ {a.read_time} min de lecture</span>
                  <span style={{ fontSize:'12px', color:'#00D4AA', fontWeight:'600' }}>Lire →</span>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ ...card, textAlign:'center', padding:'60px 20px', marginTop:'16px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📚</div>
            <p style={{ fontSize:'13px', color:'#64748B' }}>Aucun article trouvé pour cette recherche</p>
          </div>
        )}
      </main>

      {/* MODAL ARTICLE */}
      {selectedArticle && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setSelectedArticle(null)}>
          <div className="modal-article">
            <button onClick={()=>setSelectedArticle(null)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'8px', padding:'6px 14px', color:'#94A3B8', fontSize:'13px', cursor:'pointer', marginBottom:'20px' }}>← Retour</button>
            <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:LEVEL_COLORS[selectedArticle.level], background:`${LEVEL_COLORS[selectedArticle.level]}22`, padding:'3px 10px', borderRadius:'99px' }}>{LEVEL_LABELS[selectedArticle.level]}</span>
              <span style={{ fontSize:'11px', color:'#64748B', background:'rgba(255,255,255,0.06)', padding:'3px 10px', borderRadius:'99px' }}>{CAT_ICONS[selectedArticle.category]} {CAT_LABELS[selectedArticle.category]}</span>
              <span style={{ fontSize:'11px', color:'#64748B', background:'rgba(255,255,255,0.06)', padding:'3px 10px', borderRadius:'99px' }}>⏱ {selectedArticle.read_time} min</span>
            </div>
            <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#fff', lineHeight:'1.4', marginBottom:'16px' }}>{selectedArticle.title}</h2>
            <p style={{ fontSize:'14px', color:'#94A3B8', lineHeight:'1.8', marginBottom:'24px' }}>{selectedArticle.summary}</p>
            <div style={{ background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:'12px', padding:'20px' }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#00D4AA', marginBottom:'8px' }}>📝 Contenu de l'article</div>
              <p style={{ fontSize:'13px', color:'#64748B', lineHeight:'1.8' }}>
                Le contenu complet de cet article sera disponible ici. En tant qu'administrateur, vous pouvez ajouter des articles directement dans la table <code style={{ background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:'4px', fontSize:'12px' }}>articles</code> de votre base Supabase avec <code style={{ background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:'4px', fontSize:'12px' }}>is_published = true</code>.
              </p>
            </div>
            {readIds.includes(selectedArticle.id) && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'16px', color:'#10B981', fontSize:'13px' }}>
                <span>✓</span> Article marqué comme lu
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}